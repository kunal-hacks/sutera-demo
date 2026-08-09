import { Request, Response, NextFunction } from "express";
import { verifySession, SESSION_COOKIE_NAME, AdminSessionPayload } from "../lib/auth";

export interface AuthedRequest extends Request {
  admin?: AdminSessionPayload;
}

export function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.[SESSION_COOKIE_NAME];
  const session = token ? verifySession(token) : null;

  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  req.admin = session;
  next();
}
