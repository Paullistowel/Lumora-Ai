import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, dashboardPath } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in" };

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(dashboardPath(user.role));

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
      <p className="mt-1.5 mb-7 text-sm text-muted">
        Sign in with your institutional account.
      </p>

      <LoginForm />

      <p className="mt-7 text-center text-sm text-muted">
        New student?{" "}
        <Link href="/register" className="font-medium text-brand hover:underline">
          Create an account
        </Link>
      </p>

      <div className="mt-8 rounded-xl border border-border bg-surface-muted/60 p-4">
        <p className="text-xs font-medium">Just exploring?</p>
        <p className="mt-1 text-xs text-muted">
          The{" "}
          <Link href="/tools" className="font-medium text-brand hover:underline">
            grammar, plagiarism and humanizer tools
          </Link>{" "}
          need no account at all.
        </p>
      </div>
    </>
  );
}
