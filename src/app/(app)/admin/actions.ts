"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword, requireRole } from "@/lib/auth";
import { audit } from "@/lib/audit";

export type ActionState = { error?: string; success?: string } | null;

const departmentSchema = z.object({
  name: z.string().trim().min(3, "Enter a department name."),
  code: z.string().trim().min(2, "Enter a short code.").toUpperCase(),
});

export async function createDepartment(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireRole("ADMIN");
  const parsed = departmentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const clash = await db.department.findFirst({
    where: { OR: [{ name: parsed.data.name }, { code: parsed.data.code }] },
    select: { id: true },
  });
  if (clash) return { error: "A department with that name or code already exists." };

  const department = await db.department.create({ data: parsed.data });
  await audit({
    userId: user.id,
    action: "DEPARTMENT_CREATED",
    entity: "Department",
    entityId: department.id,
    detail: department.name,
  });

  revalidatePath("/admin/departments");
  return { success: `${department.name} created.` };
}

const courseSchema = z.object({
  title: z.string().trim().min(3, "Enter a course title."),
  code: z.string().trim().min(2, "Enter a course code.").toUpperCase(),
  level: z.coerce.number().int().min(100).max(900),
  semester: z.string().trim().min(1, "Enter a semester."),
  departmentId: z.string().min(1, "Choose a department."),
  lecturerId: z.string().optional(),
});

export async function createCourse(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireRole("ADMIN");
  const parsed = courseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const clash = await db.course.findUnique({
    where: { code: parsed.data.code },
    select: { id: true },
  });
  if (clash) return { error: "That course code is already in use." };

  const course = await db.course.create({
    data: {
      ...parsed.data,
      lecturerId:
        parsed.data.lecturerId && parsed.data.lecturerId.length > 0
          ? parsed.data.lecturerId
          : null,
    },
  });

  await audit({
    userId: user.id,
    action: "COURSE_CREATED",
    entity: "Course",
    entityId: course.id,
    detail: `${course.code} — ${course.title}`,
  });

  revalidatePath("/admin/courses");
  return { success: `${course.code} created.` };
}

const staffSchema = z.object({
  fullName: z.string().trim().min(2, "Enter a full name."),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  role: z.enum(["LECTURER", "ADMIN"]),
  departmentId: z.string().optional(),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export async function createStaff(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireRole("ADMIN");
  const parsed = staffSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const clash = await db.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  });
  if (clash) return { error: "An account with that email already exists." };

  const created = await db.user.create({
    data: {
      fullName: parsed.data.fullName,
      email: parsed.data.email,
      role: parsed.data.role,
      passwordHash: await hashPassword(parsed.data.password),
      // Staff accounts are provisioned by a human, so no email round-trip.
      emailVerified: true,
      departmentId:
        parsed.data.departmentId && parsed.data.departmentId.length > 0
          ? parsed.data.departmentId
          : null,
    },
  });

  await audit({
    userId: user.id,
    action: "STAFF_CREATED",
    entity: "User",
    entityId: created.id,
    detail: `${created.email} (${created.role})`,
  });

  revalidatePath("/admin/users");
  return { success: `${created.fullName} can now sign in.` };
}

export async function toggleSuspension(formData: FormData): Promise<void> {
  const admin = await requireRole("ADMIN");
  const userId = String(formData.get("userId") ?? "");
  if (userId === admin.id) return; // never lock yourself out

  const target = await db.user.findUnique({
    where: { id: userId },
    select: { suspended: true, email: true },
  });
  if (!target) return;

  await db.user.update({
    where: { id: userId },
    data: { suspended: !target.suspended },
  });

  // Suspension must take effect immediately, not at token expiry.
  if (!target.suspended) {
    await db.session.deleteMany({ where: { userId } });
  }

  await audit({
    userId: admin.id,
    action: target.suspended ? "USER_REINSTATED" : "USER_SUSPENDED",
    entity: "User",
    entityId: userId,
    detail: target.email,
  });

  revalidatePath("/admin/users");
}

export async function assignLecturer(formData: FormData): Promise<void> {
  const admin = await requireRole("ADMIN");
  const courseId = String(formData.get("courseId") ?? "");
  const lecturerId = String(formData.get("lecturerId") ?? "");

  await db.course.update({
    where: { id: courseId },
    data: { lecturerId: lecturerId || null },
  });

  await audit({
    userId: admin.id,
    action: "COURSE_LECTURER_ASSIGNED",
    entity: "Course",
    entityId: courseId,
    detail: lecturerId || "unassigned",
  });

  revalidatePath("/admin/courses");
}
