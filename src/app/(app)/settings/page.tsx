import { revalidatePath } from "next/cache";
import { requireUser, hashPassword, verifyPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { Button, Card, CardHeader, PageHeader } from "@/components/ui";
import { restartOnboarding } from "@/components/onboarding/actions";
import { formatDateTime } from "@/lib/format";
import { ProfileForm, PasswordForm, type SettingsState } from "./forms";

export const metadata = { title: "Settings" };

async function updateProfile(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  "use server";
  const user = await requireUser();
  const fullName = String(formData.get("fullName") ?? "").trim();

  if (fullName.length < 2) return { error: "Enter your full name." };

  await db.user.update({ where: { id: user.id }, data: { fullName } });
  await audit({ userId: user.id, action: "PROFILE_UPDATED" });
  revalidatePath("/settings");
  return { success: "Profile updated." };
}

async function changePassword(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  "use server";
  const user = await requireUser();
  const current = String(formData.get("currentPassword") ?? "");
  const next = String(formData.get("newPassword") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  if (next.length < 8) return { error: "New password must be at least 8 characters." };
  if (next !== confirm) return { error: "New passwords do not match." };

  const record = await db.user.findUniqueOrThrow({
    where: { id: user.id },
    select: { passwordHash: true },
  });
  if (!(await verifyPassword(current, record.passwordHash))) {
    return { error: "Your current password is incorrect." };
  }

  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(next) },
  });
  // Changing a password invalidates every other device.
  await db.session.deleteMany({ where: { userId: user.id } });
  await audit({ userId: user.id, action: "PASSWORD_CHANGED" });

  return { success: "Password changed. Other devices have been signed out." };
}

export default async function SettingsPage() {
  const user = await requireUser();

  const [profile, sessions] = await Promise.all([
    db.user.findUniqueOrThrow({
      where: { id: user.id },
      select: {
        fullName: true,
        email: true,
        role: true,
        matricNumber: true,
        level: true,
        createdAt: true,
        lastLoginAt: true,
        department: { select: { name: true } },
      },
    }),
    db.session.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, userAgent: true, createdAt: true, expiresAt: true },
    }),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Account"
        title="Settings"
        description="Your profile, security and account activity."
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Profile" />
          <ProfileForm action={updateProfile} defaultName={profile.fullName} />

          <dl className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
            <Row label="Email" value={profile.email} />
            <Row label="Role" value={profile.role.toLowerCase()} />
            {profile.matricNumber ? (
              <Row label="Matric number" value={profile.matricNumber} />
            ) : null}
            {profile.level ? <Row label="Level" value={String(profile.level)} /> : null}
            <Row label="Department" value={profile.department?.name ?? "—"} />
            <Row label="Member since" value={formatDateTime(profile.createdAt)} />
          </dl>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader
              title="Change password"
              description="Signs you out of all other devices."
            />
            <PasswordForm action={changePassword} />
          </Card>

          <Card>
            <CardHeader
              title="Product tour"
              description="Replay the walkthrough of where everything lives."
            />
            <form action={restartOnboarding}>
              <Button type="submit" variant="secondary">
                Restart the tour
              </Button>
            </form>
          </Card>

          <Card>
            <CardHeader
              title="Active sessions"
              description="Recent sign-ins on this account."
            />
            <ul className="space-y-2">
              {sessions.map((session) => (
                <li
                  key={session.id}
                  className="rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <p className="truncate">{session.userAgent ?? "Unknown device"}</p>
                  <p className="text-xs text-muted">
                    Started {formatDateTime(session.createdAt)} · expires{" "}
                    {formatDateTime(session.expiresAt)}
                  </p>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
