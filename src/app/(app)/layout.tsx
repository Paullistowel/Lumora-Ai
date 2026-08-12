import type { ReactNode } from "react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { AppShell } from "@/components/app-shell";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();

  const [unreadCount, record] = await Promise.all([
    db.notification.count({ where: { userId: user.id, read: false } }),
    db.user.findUnique({
      where: { id: user.id },
      select: { onboardedAt: true },
    }),
  ]);

  return (
    <AppShell
      user={user}
      unreadCount={unreadCount}
      showTour={record?.onboardedAt === null}
    >
      {children}
    </AppShell>
  );
}
