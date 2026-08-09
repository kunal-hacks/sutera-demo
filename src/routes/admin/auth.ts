import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { adminLoginSchema } from "../../lib/validation";
import { verifyPassword, signSession, SESSION_COOKIE_NAME, sessionCookieOptions } from "../../lib/auth";
import { requireAdmin, AuthedRequest } from "../../middleware/require-admin";

export const adminAuthRouter = Router();

adminAuthRouter.post("/login", async (req, res) => {
  const parsed = adminLoginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Enter a valid email and password." });
  }

  const { email, password } = parsed.data;
  const admin = await prisma.admin.findUnique({ where: { email: email.toLowerCase() } });

  // Same generic error whether the email doesn't exist or the password is
  // wrong, to avoid leaking which admin emails are registered.
  if (!admin || !(await verifyPassword(password, admin.passwordHash))) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  const token = signSession({ adminId: admin.id, email: admin.email, name: admin.name });
  res.cookie(SESSION_COOKIE_NAME, token, sessionCookieOptions);
  res.json({ success: true, name: admin.name });
});

adminAuthRouter.post("/logout", (req, res) => {
  res.clearCookie(SESSION_COOKIE_NAME, { path: "/" });
  res.json({ success: true });
});

adminAuthRouter.get("/me", requireAdmin, (req: AuthedRequest, res) => {
  res.json({ name: req.admin!.name, email: req.admin!.email });
});
