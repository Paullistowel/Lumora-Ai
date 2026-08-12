import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getFile } from "@/lib/storage";
import { audit } from "@/lib/audit";

/**
 * Authenticated file download.
 *
 * Every branch resolves the storage key *and* the permission in the same
 * query, so there is no path where a key is fetched before the caller has been
 * checked. Storage keys are opaque and never exposed to the client.
 */

const MIME: Record<string, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  doc: "application/msword",
  txt: "text/plain; charset=utf-8",
  md: "text/markdown; charset=utf-8",
};

type Resolved = { storageKey: string; fileName: string; fileType: string };

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ kind: string; id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { kind, id } = await params;
  let resolved: Resolved | null = null;

  if (kind === "submission") {
    const submission = await db.submission.findUnique({
      where: { id },
      select: {
        storageKey: true,
        fileName: true,
        fileType: true,
        studentId: true,
        assignment: { select: { course: { select: { lecturerId: true } } } },
      },
    });
    // The author, the lecturer who teaches the course, or an administrator.
    const allowed =
      submission &&
      (submission.studentId === user.id ||
        user.role === "ADMIN" ||
        (user.role === "LECTURER" &&
          submission.assignment.course.lecturerId === user.id));
    if (submission && allowed) resolved = submission;
  } else if (kind === "analysis") {
    const analysis = await db.analysis.findUnique({
      where: { id },
      select: {
        storageKey: true,
        fileName: true,
        fileType: true,
        userId: true,
      },
    });
    // An analysis is private to whoever ran it, including from staff.
    if (
      analysis?.storageKey &&
      analysis.fileName &&
      analysis.fileType &&
      analysis.userId === user.id
    ) {
      resolved = {
        storageKey: analysis.storageKey,
        fileName: analysis.fileName,
        fileType: analysis.fileType,
      };
    }
  } else if (kind === "review-document") {
    const document = await db.reviewDocument.findUnique({
      where: { id },
      select: {
        storageKey: true,
        fileName: true,
        fileType: true,
        ownerId: true,
        reviews: { where: { reviewerId: user.id }, select: { id: true } },
      },
    });
    // The author, or a student actually assigned to review it.
    if (document && (document.ownerId === user.id || document.reviews.length > 0)) {
      resolved = document;
    }
  } else {
    return NextResponse.json({ error: "Unknown file type" }, { status: 404 });
  }

  if (!resolved) {
    // Same response whether it does not exist or is not theirs — an attacker
    // learns nothing about which.
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  let buffer: Buffer;
  try {
    buffer = await getFile(resolved.storageKey);
  } catch {
    return NextResponse.json(
      { error: "The stored file is no longer available." },
      { status: 410 },
    );
  }

  await audit({
    userId: user.id,
    action: "DOWNLOAD",
    entity: kind,
    entityId: id,
    detail: resolved.fileName,
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": MIME[resolved.fileType] ?? "application/octet-stream",
      "Content-Disposition": `attachment; filename="${resolved.fileName.replace(/"/g, "")}"`,
      "Content-Length": String(buffer.byteLength),
      "Cache-Control": "private, no-store",
    },
  });
}
