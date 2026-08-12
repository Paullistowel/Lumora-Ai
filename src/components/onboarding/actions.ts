"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

/** Marks the tour as seen so it does not reappear on the next visit. */
export async function completeOnboarding() {
  const user = await getCurrentUser();
  if (!user) return;

  await db.user.update({
    where: { id: user.id },
    data: { onboardedAt: new Date() },
  });
  revalidatePath("/", "layout");
}

/** Lets a user replay the tour from Settings. */
export async function restartOnboarding() {
  const user = await getCurrentUser();
  if (!user) return;

  await db.user.update({
    where: { id: user.id },
    data: { onboardedAt: null },
  });
  revalidatePath("/", "layout");
}
