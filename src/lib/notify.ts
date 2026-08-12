import { db } from "./db";

export type NotificationType =
  | "SUBMISSION"
  | "SIMILARITY"
  | "REVIEW"
  | "FEEDBACK"
  | "DEADLINE"
  | "SYSTEM";

type NotifyInput = {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
};

/**
 * Module 13. In-app delivery is persisted here; email/SMS transports plug in
 * at `deliverExternally` once SMTP credentials exist.
 */
export async function notify(input: NotifyInput) {
  const notification = await db.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      link: input.link ?? null,
    },
  });
  await deliverExternally(input);
  return notification;
}

export async function notifyMany(inputs: NotifyInput[]) {
  await Promise.all(inputs.map(notify));
}

async function deliverExternally(input: NotifyInput) {
  if (!process.env.SMTP_URL) {
    // No transport configured — in-app notification is the delivery channel.
    return;
  }
  // Wire nodemailer here when SMTP_URL is provisioned.
  console.info("[notify] email transport configured but not implemented", input.type);
}
