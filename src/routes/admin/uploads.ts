import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { requireAdmin } from "../../middleware/require-admin";

// Resolved relative to the process's working directory (the `backend/`
// folder, since that's where `npm run dev` / `npm run start` are invoked
// from) rather than __dirname, so dev (tsx, running from src/) and
// production (compiled to dist/) both resolve to the same physical folder.
export const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/svg+xml", "image/gif"]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = crypto.randomBytes(8).toString("hex");
    cb(null, `${Date.now()}-${unique}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_TYPES.has(file.mimetype)) {
      return cb(new Error("Only JPG, PNG, WEBP, GIF, or SVG images are allowed."));
    }
    cb(null, true);
  },
});

export const adminUploadsRouter = Router();
adminUploadsRouter.use(requireAdmin);

adminUploadsRouter.post("/", (req, res) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || "Upload failed." });
    }
    if (!req.file) {
      return res.status(400).json({ error: "No file was uploaded." });
    }

    // Build an absolute URL so the image displays correctly no matter which
    // origin (frontend dev server, deployed frontend, etc.) renders it —
    // uploaded files are served by this backend, not the frontend.
    const publicBase = process.env.PUBLIC_URL || `${req.protocol}://${req.get("host")}`;
    const url = `${publicBase}/uploads/${req.file.filename}`;

    res.status(201).json({ url });
  });
});
