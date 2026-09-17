import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser, dashboardPath } from "@/lib/auth";
import { Alert } from "@/components/ui";
import { RegisterForm } from "./register-form";

export const metadata = { title: "Create account" };

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect(dashboardPath(user.role));

  let departments: { id: string; name: string; code: string }[] = [];
  let databaseError = false;
  try {
    departments = await db.department.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, code: true },
    });
  } catch (error) {
    console.error("[auth] Registration page database lookup failed", error);
    databaseError = true;
  }

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
      <p className="mt-1.5 mb-7 text-sm text-muted">
        Student registration. Lecturer and admin accounts are created by an
        administrator.
      </p>

      {databaseError ? (
        <Alert tone="error">
          Account services are not available yet. Configure a hosted
          <code className="mx-1">DATABASE_URL</code> in Vercel, run the Prisma
          migrations, and redeploy.
        </Alert>
      ) : departments.length === 0 ? (
        <Alert tone="error">
          No departments exist yet. Run <code>npm run db:seed</code> or ask an
          administrator to create one.
        </Alert>
      ) : (
        <RegisterForm departments={departments} />
      )}

      <p className="mt-7 text-center text-sm text-muted">
        Already registered?{" "}
        <Link href="/login" className="font-medium text-brand hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
