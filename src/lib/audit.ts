import "server-only";

import { headers } from "next/headers";
import { db } from "./db";

type AuditInput = {
  userId?: string | null;
  action: string;
  entity?: string;
  entityId?: string;
  detail?: string;
};

/**
 * Module 19 — every meaningful action lands here. Deliberately never throws:
 * a logging failure must not roll back the action being logged.
 */
export async function audit(input: AuditInput) {
  try {
    const headerList = await headers();
    await db.auditLog.create({
      data: {
        userId: input.userId ?? null,
        action: input.action,
        entity: input.entity ?? null,
        entityId: input.entityId ?? null,
        detail: input.detail ?? null,
        ipAddress:
          headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
      },
    });
  } catch (error) {
    console.error("[audit] failed to record", input.action, error);
  }
}
