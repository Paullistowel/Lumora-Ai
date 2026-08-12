"use server";

import { cookies, headers } from "next/headers";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { CONSENT_COOKIE, VISITOR_COOKIE, type ConsentChoice } from "@/lib/consent";
import type { PublicFormState } from "@/lib/form-state";

// Only async functions may be exported from a "use server" module — the cookie
// constants and the state type live in @/lib/consent and @/lib/form-state.

// ── Newsletter ──────────────────────────────────────────────────────────────

const newsletterSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  name: z.string().trim().optional(),
  role: z.string().trim().optional(),
  source: z.string().trim().default("footer"),
});

export async function subscribeToNewsletter(
  _prev: PublicFormState,
  formData: FormData,
): Promise<PublicFormState> {
  const parsed = newsletterSchema.safeParse({
    email: formData.get("email"),
    name: formData.get("name") ?? undefined,
    role: formData.get("role") ?? undefined,
    source: formData.get("source") ?? "footer",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { email, name, role, source } = parsed.data;

  const existing = await db.newsletterSubscriber.findUnique({
    where: { email },
    select: { id: true, unsubscribedAt: true },
  });

  if (existing) {
    // Re-subscribing after opting out should work, and saying "already
    // subscribed" to a stranger would leak whether an address is on the list.
    if (existing.unsubscribedAt) {
      await db.newsletterSubscriber.update({
        where: { email },
        data: { unsubscribedAt: null, source },
      });
    }
    return { success: "You're on the list. Look out for the next issue." };
  }

  await db.newsletterSubscriber.create({
    data: {
      email,
      name: name || null,
      role: role || null,
      source,
    },
  });

  return { success: "You're on the list. Look out for the next issue." };
}

export async function unsubscribeFromNewsletter(
  _prev: PublicFormState,
  formData: FormData,
): Promise<PublicFormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) return { error: "Enter your email address." };

  await db.newsletterSubscriber
    .updateMany({ where: { email }, data: { unsubscribedAt: new Date() } })
    .catch(() => undefined);

  // Same response either way — do not confirm whether an address was on the list.
  return { success: "If that address was subscribed, it has been removed." };
}

// ── Cookie consent ──────────────────────────────────────────────────────────

export async function saveConsent(choice: {
  analytics: boolean;
  marketing: boolean;
}) {
  const store = await cookies();
  const headerList = await headers();

  let visitorId = store.get(VISITOR_COOKIE)?.value;
  if (!visitorId) {
    visitorId = randomUUID();
    store.set(VISITOR_COOKIE, visitorId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  const value: ConsentChoice = {
    necessary: true,
    analytics: choice.analytics,
    marketing: choice.marketing,
  };

  // Readable by client script so non-essential tags can gate themselves.
  store.set(CONSENT_COOKIE, JSON.stringify(value), {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 182, // re-ask every six months
  });

  // A durable record of what was consented to and when.
  await db.consentRecord.create({
    data: {
      visitorId,
      analytics: choice.analytics,
      marketing: choice.marketing,
      userAgent: headerList.get("user-agent")?.slice(0, 255) ?? null,
    },
  });
}

export async function getConsent(): Promise<ConsentChoice | null> {
  const raw = (await cookies()).get(CONSENT_COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ConsentChoice;
    return { necessary: true, analytics: !!parsed.analytics, marketing: !!parsed.marketing };
  } catch {
    return null;
  }
}

// ── Contact ─────────────────────────────────────────────────────────────────

const contactSchema = z.object({
  name: z.string().trim().min(2, "Enter your name."),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  institution: z.string().trim().optional(),
  topic: z.string().trim().min(1, "Choose a topic."),
  message: z.string().trim().min(20, "Tell us a little more — at least 20 characters."),
  // Honeypot: bots fill hidden fields, humans never see them.
  website: z.string().max(0).optional(),
});

export async function sendContactMessage(
  _prev: PublicFormState,
  formData: FormData,
): Promise<PublicFormState> {
  const parsed = contactSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    if (issue.path[0] === "website") return { success: "Thanks — we'll be in touch." };
    return { error: issue.message };
  }

  await db.contactMessage.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      institution: parsed.data.institution || null,
      topic: parsed.data.topic,
      message: parsed.data.message,
    },
  });

  return { success: "Thanks — we'll reply within two working days." };
}
