import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

/**
 * Progress endpoint for the analysis workspace. Returns the stage the engine is
 * genuinely on, so the processing checklist reflects the backend rather than a
 * timer. Scoped to the owner — an analysis is private to the user who ran it.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { id } = await params;
  const analysis = await db.analysis.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      status: true,
      stage: true,
      statusDetail: true,
      durationMs: true,
    },
  });

  if (!analysis || analysis.userId !== user.id) {
    return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
  }

  return NextResponse.json(
    {
      status: analysis.status,
      stage: analysis.stage,
      statusDetail: analysis.statusDetail,
      durationMs: analysis.durationMs,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
