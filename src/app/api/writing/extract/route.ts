import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import {
  ACCEPTED_LABEL,
  MAX_FILE_BYTES,
  cleanText,
  detectType,
  extractText,
} from "@/lib/documents";

export const runtime = "nodejs";

export async function POST(request: Request) {
  await requireUser();

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Choose a document to upload." }, { status: 400 });
  }

  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      { error: `That file is larger than ${MAX_FILE_BYTES / 1024 / 1024}MB.` },
      { status: 413 },
    );
  }

  const type = detectType(file.name);
  if (!type) {
    return NextResponse.json(
      { error: `Use ${ACCEPTED_LABEL} when importing a writing draft.` },
      { status: 415 },
    );
  }

  try {
    const rawText = await extractText(Buffer.from(await file.arrayBuffer()), type);
    const text = cleanText(rawText);

    if (!text) {
      return NextResponse.json(
        { error: "No readable text was found in that document." },
        { status: 422 },
      );
    }

    return NextResponse.json({ fileName: file.name, text });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "That document could not be read." },
      { status: 422 },
    );
  }
}
