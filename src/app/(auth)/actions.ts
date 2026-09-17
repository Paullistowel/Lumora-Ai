"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  createSession,
  dashboardPath,
  destroySession,
  hashPassword,
  hashToken,
  verifyPassword,
  type Role,
} from "@/lib/auth";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notify";

export type FormState = { error?: string; success?: string } | null;

const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, "Enter your full name."),
    email: z.string().trim().toLowerCase().email("Enter a valid email address."),
    matricNumber: z.string().trim().min(3, "Enter your matriculation number."),
    departmentId: z.string().min(1, "Select your department."),
    level: z.coerce.number().int().min(100).max(900),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .regex(/[a-z]/i, "Password must contain a letter.")
      .regex(/\d/, "Password must contain a number."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export async function registerStudent(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const data = parsed.data;

  let clash;
  try {
    clash = await db.user.findFirst({
      where: {
        OR: [{ email: data.email }, { matricNumber: data.matricNumber }],
      },
      select: { email: true },
    });
  } catch (error) {
    console.error("[auth] Registration database lookup failed", error);
    return { error: "Account services are not configured yet. Set DATABASE_URL in Vercel and redeploy." };
  }
  if (clash) {
    return {
      error:
        clash.email === data.email
          ? "An account with that email already exists."
          : "That matriculation number is already registered.",
    };
  }

  let user;
  try {
    user = await db.user.create({
      data: {
        email: data.email,
        fullName: data.fullName,
        passwordHash: await hashPassword(data.password),
        role: "STUDENT",
        matricNumber: data.matricNumber,
        level: data.level,
        departmentId: data.departmentId,
        emailVerified: true,
      },
    });
  } catch (error) {
    console.error("[auth] Registration failed", error);
    return { error: "Account creation is unavailable. Check the production database and migrations." };
  }

  await audit({ userId: user.id, action: "REGISTER", entity: "User", entityId: user.id });
  try {
    await createSession(user.id);
  } catch (error) {
    console.error("[auth] Registration session creation failed", error);
    return { error: "Account was created, but sign-in could not be started. Check the production database configuration." };
  }
  redirect(dashboardPath(user.role as Role));
}

const verifySchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  code: z.string().trim().regex(/^\d{6}$/, "Enter the six-digit code."),
});

export async function verifyEmail(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = verifySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const user = await db.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, otpHash: true, otpExpiresAt: true, role: true },
  });

  if (
    !user ||
    !user.otpHash ||
    !user.otpExpiresAt ||
    user.otpExpiresAt < new Date() ||
    user.otpHash !== hashToken(parsed.data.code)
  ) {
    return { error: "That code is invalid or has expired." };
  }

  await db.user.update({
    where: { id: user.id },
    data: { emailVerified: true, otpHash: null, otpExpiresAt: null },
  });

  await audit({ userId: user.id, action: "VERIFY_EMAIL", entity: "User", entityId: user.id });
  await notify({
    userId: user.id,
    type: "SYSTEM",
    title: "Welcome to Lume AI",
    body: "Your account is verified. Enrol in your courses to start submitting work.",
    link: "/student/courses",
  });

  await createSession(user.id);
  redirect(dashboardPath(user.role as Role));
}

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

export async function login(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  let user;
  try {
    user = await db.user.findUnique({
      where: { email: parsed.data.email },
      select: {
        id: true,
        passwordHash: true,
        role: true,
        suspended: true,
      },
    });
  } catch (error) {
    console.error("[auth] Login database lookup failed", error);
    return { error: "Sign-in is temporarily unavailable. Check the production database configuration." };
  }

  // Same message for unknown email and wrong password — do not let the form
  // confirm which addresses have accounts.
  const invalid = { error: "Incorrect email or password." };
  if (!user) return invalid;
  if (!(await verifyPassword(parsed.data.password, user.passwordHash))) {
    await audit({ userId: user.id, action: "LOGIN_FAILED", detail: "bad password" });
    return invalid;
  }
  if (user.suspended) {
    return { error: "This account has been suspended. Contact your administrator." };
  }
  try {
    await db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
  } catch (error) {
    console.error("[auth] Login update failed", error);
    return { error: "Sign-in is temporarily unavailable. Check the production database configuration." };
  }
  try {
    await createSession(user.id);
  } catch (error) {
    console.error("[auth] Login session creation failed", error);
    return { error: "Password accepted, but sign-in could not be completed. Check the production database configuration." };
  }
  await audit({ userId: user.id, action: "LOGIN" });

  redirect(dashboardPath(user.role as Role));
}

export async function logout() {
  await destroySession();
  redirect("/login");
}
