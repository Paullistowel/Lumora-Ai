import Link from "next/link";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  PageHeader,
} from "@/components/ui";
import { relativeTime } from "@/lib/format";

export const metadata = { title: "Notifications" };

async function markAllRead() {
  "use server";
  const user = await requireUser();
  await db.notification.updateMany({
    where: { userId: user.id, read: false },
    data: { read: true },
  });
  revalidatePath("/notifications");
}

const TONE = {
  SIMILARITY: "warning",
  REVIEW: "brand",
  SUBMISSION: "success",
  FEEDBACK: "brand",
  DEADLINE: "danger",
  SYSTEM: "neutral",
} as const;

export default async function NotificationsPage() {
  const user = await requireUser();

  const notifications = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <>
      <PageHeader
        eyebrow="Inbox"
        title="Notifications"
        description={unread > 0 ? `${unread} unread` : "You are up to date."}
        action={
          unread > 0 ? (
            <form action={markAllRead}>
              <Button type="submit" variant="secondary">
                Mark all read
              </Button>
            </form>
          ) : undefined
        }
      />

      {notifications.length === 0 ? (
        <EmptyState
          title="Nothing yet"
          description="Submission confirmations, similarity reports and review assignments land here."
        />
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => {
            const body = (
              <Card
                className={
                  notification.read ? "opacity-70" : "border-brand/30 bg-brand-soft/30"
                }
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{notification.title}</p>
                    <p className="mt-0.5 text-sm text-muted">{notification.body}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Badge
                      tone={
                        TONE[notification.type as keyof typeof TONE] ?? "neutral"
                      }
                    >
                      {notification.type.toLowerCase()}
                    </Badge>
                    <span className="text-xs text-muted">
                      {relativeTime(notification.createdAt)}
                    </span>
                  </div>
                </div>
              </Card>
            );

            return notification.link ? (
              <Link
                key={notification.id}
                href={notification.link as never}
                className="block"
              >
                {body}
              </Link>
            ) : (
              <div key={notification.id}>{body}</div>
            );
          })}
        </div>
      )}
    </>
  );
}
