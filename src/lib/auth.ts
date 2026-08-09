import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const SESSION_COOKIE = "sutera_admin_session";
export const SESSION_COOKIE_NAME = SESSION_COOKIE;

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not set. Add it to your .env file.");
  }
  return secret;
}

export interface AdminSessionPayload {
  adminId: string;
  email: string;
  name: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signSession(payload: AdminSessionPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn: "7d" });
}

export function verifySession(token: string): AdminSessionPayload | null {
  try {
    return jwt.verify(token, getSecret()) as AdminSessionPayload;
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days, in ms for Express cookies
};
