import { VerifyForm } from "./verify-form";

export const metadata = { title: "Verify email · AI-AIMS" };

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email = "" } = await searchParams;

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Verify your email</h1>
      <p className="mt-1.5 mb-7 text-sm text-muted">
        We sent a six-digit code to <strong>{email || "your email"}</strong>. It
        expires in 15 minutes.
      </p>

      <VerifyForm email={email} />

      <p className="mt-5 rounded-lg bg-surface-muted px-3 py-2 text-xs text-muted">
        Development build: no mail server is configured, so the code is printed
        to the terminal running <code>npm run dev</code>.
      </p>
    </>
  );
}
