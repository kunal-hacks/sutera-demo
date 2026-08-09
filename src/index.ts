import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { productsRouter } from "./routes/products";
import { checkoutRouter } from "./routes/checkout";
import { verifyRouter } from "./routes/verify";
import { trackOrderRouter, contactRouter } from "./routes/public-misc";
import { adminAuthRouter } from "./routes/admin/auth";
import { adminProductsRouter } from "./routes/admin/products";
import { adminOrdersRouter } from "./routes/admin/orders";
import { adminDashboardRouter, adminSettingsRouter } from "./routes/admin/dashboard-settings";
import { adminUploadsRouter, uploadsDir } from "./routes/admin/uploads";

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

const allowedOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Serves admin-uploaded product images, e.g. /uploads/169...-a1b2c3d4.jpg
app.use("/uploads", express.static(uploadsDir));

app.get("/health", (_req, res) => res.json({ ok: true }));

// Public API
app.use("/api/products", productsRouter);
app.use("/api/checkout", checkoutRouter);
app.use("/api/checkout/verify", verifyRouter);
app.use("/api/track-order", trackOrderRouter);
app.use("/api/contact", contactRouter);

// Admin API (each router applies its own requireAdmin middleware,
// except /login which must stay public)
app.use("/api/admin", adminAuthRouter);
app.use("/api/admin/products", adminProductsRouter);
app.use("/api/admin/orders", adminOrdersRouter);
app.use("/api/admin/dashboard", adminDashboardRouter);
app.use("/api/admin/settings", adminSettingsRouter);
app.use("/api/admin/uploads", adminUploadsRouter);

// Centralized error handler — never leak stack traces to the client.
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong on our end. Please try again." });
});

app.listen(PORT, () => {
  console.log(`Sutera API listening on http://localhost:${PORT}`);
});
