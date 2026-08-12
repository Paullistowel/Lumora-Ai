import "server-only";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { createHash, randomInt } from "node:crypto";
import { db } from "./db";

export const SESSION_COOKIE = "aims_session";
const SESSION_DAYS = 7;

export type Role = "STUDENT" | "LECTURER" | "ADMIN";

export type SessionUser = {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  departmentId: string | null;
  avatarUrl: string | null;
};

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value) {
    throw new Error("AUTH_SECRET is not set — copy .env.example to .env");
  }
  return new TextEncoder().encode(value);
}

export function hashPassword(plain: string) {
  return bcrypt.hash(plain, 10);
}

export function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

/** Six-digit code for email verification and 2FA (Module 1). */
export function generateOtp() {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Issues a JWT and records the session server-side so an admin can revoke it
 * (Module 12) and so login history is auditable (Module 19).
 */
export async function createSession(userId: string) {
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);

  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(secret());

  const headerList = await headers();
  await db.session.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt,
      userAgent: headerList.get("user-agent")?.slice(0, 255) ?? null,
      ipAddress:
        headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    },
  });

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.session
      .deleteMany({ where: { tokenHash: hashToken(token) } })
      .catch(() => undefined);
  }
  store.delete(SESSION_COOKIE);
}

/** Returns the signed-in user, or null. Never throws. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  let userId: string;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub) return null;
    userId = payload.sub;
  } catch {
    return null;
  }

  // A valid JWT is not enough — the session row must still exist, which is
  // what makes admin revocation and logout-everywhere work.
  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { expiresAt: true },
  });
  if (!session || session.expiresAt < new Date()) return null;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      departmentId: true,
      avatarUrl: true,
      suspended: true,
    },
  });
  if (!user || user.suspended) return null;

  const { suspended: _suspended, ...rest } = user;
  return { ...rest, role: rest.role as Role };
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect(dashboardPath(user.role));
  return user;
}

export function dashboardPath(role: Role) {
  if (role === "ADMIN") return "/admin";
  if (role === "LECTURER") return "/lecturer";
  return "/student";
}
