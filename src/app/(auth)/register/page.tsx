import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser, dashboardPath } from "@/lib/auth";
import { Alert } from "@/components/ui";
import { RegisterForm } from "./register-form";

export const metadata = { title: "Create account · AI-AIMS" };

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect(dashboardPath(user.role));

  const departments = await db.department.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, code: true },
  });

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
      <p className="mt-1.5 mb-7 text-sm text-muted">
        Student registration. Lecturer and admin accounts are created by an
        administrator.
      </p>

      {departments.length === 0 ? (
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
