import { NextResponse } from "next/server";
import { destroySession, getCurrentUser } from "@/lib/auth";
import { audit } from "@/lib/audit";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  await audit({ userId: user?.id, action: "LOGOUT" });
  await destroySession();
  return NextResponse.redirect(new URL("/login", request.url), 303);
}
