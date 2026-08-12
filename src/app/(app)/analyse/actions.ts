"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { putFile, deleteFile } from "@/lib/storage";
import {
  ACCEPTED_EXTENSIONS,
  ACCEPTED_LABEL,
  MAX_FILE_BYTES,
  countWords,
  detectType,
} from "@/lib/documents";
import {
  ALL_MODULES,
  runAnalysis,
  type AnalysisModule,
  type CorpusScope,
} from "@/lib/analysis";

export type AnalyseState = { error?: string } | null;

const MIN_WORDS = 30;
const MAX_REFERENCES = 5;

const referenceSchema = z.array(
  z.object({ label: z.string().trim().min(1).max(120), text: z.string() }),
);

/**
 * Creates an analysis and starts processing.
 *
 * Processing is handed to `after()` so the request returns immediately and the
 * report page can show genuine per-stage progress read back off the row,
 * rather than the browser hanging on a long POST.
 */
export async function createAnalysis(
  _prev: AnalyseState,
  formData: FormData,
): Promise<AnalyseState> {
  const user = await requireUser();

  const source = formData.get("source") === "UPLOAD" ? "UPLOAD" : "TEXT";
  const pastedText = String(formData.get("text") ?? "").trim();

  const modules = parseModuleSelection(formData.getAll("modules"));
  const corpusScope: CorpusScope =
    formData.get("corpusScope") === "PLATFORM" ? "PLATFORM" : "REFERENCES";

  let references: { label: string; text: string }[] = [];
  const rawReferences = formData.get("references");
  if (typeof rawReferences === "string" && rawReferences.length > 0) {
    const parsed = referenceSchema.safeParse(safeJson(rawReferences));
    if (!parsed.success) return { error: "Reference sources could not be read." };
    references = parsed.data
      .filter((reference) => reference.text.trim().length > 60)
      .slice(0, MAX_REFERENCES);
  }

  if (modules.includes("SIMILARITY") && corpusScope === "REFERENCES" && references.length === 0) {
    return {
      error:
        "Semantic similarity needs something to compare against. Add a reference source, or switch the comparison to your Lume AI corpus.",
    };
  }

  let title: string;
  let storageKey: string | null = null;
  let fileName: string | null = null;
  let fileType: string | null = null;
  let fileSize = 0;
  let text = "";

  if (source === "UPLOAD") {
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { error: "Choose a document to analyse." };
    }
    if (file.size > MAX_FILE_BYTES) {
      return {
        error: `That file is ${(file.size / 1024 / 1024).toFixed(1)}MB. The limit is ${MAX_FILE_BYTES / 1024 / 1024}MB.`,
      };
    }
    const detected = detectType(file.name);
    if (!detected) {
      return {
        error: `Lume AI cannot read that file type. Upload ${ACCEPTED_LABEL} (${ACCEPTED_EXTENSIONS.join(", ")}).`,
      };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    storageKey = await putFile(buffer, file.name);
    fileName = file.name;
    fileType = detected;
    fileSize = file.size;
    title = file.name.replace(/\.[^.]+$/, "");
  } else {
    if (countWords(pastedText) < MIN_WORDS) {
      return {
        error: `Paste at least ${MIN_WORDS} words. Shorter passages do not give the model enough to judge.`,
      };
    }
    text = pastedText;
    const explicitTitle = String(formData.get("title") ?? "").trim();
    title =
      explicitTitle ||
      `${pastedText.slice(0, 48).replace(/\s+/g, " ").trim()}${pastedText.length > 48 ? "…" : ""}`;
  }

  const analysis = await db.analysis.create({
    data: {
      userId: user.id,
      title: title.slice(0, 160),
      source,
      fileName,
      fileType,
      fileSize,
      storageKey,
      text,
      wordCount: source === "TEXT" ? countWords(text) : 0,
      modules: JSON.stringify(modules),
      corpusScope,
      status: "PENDING",
      stage: "QUEUED",
      references: {
        create: references.map((reference, order) => ({
          label: reference.label,
          text: reference.text,
          order,
        })),
      },
    },
    select: { id: true },
  });

  await audit({
    userId: user.id,
    action: "ANALYSE",
    entity: "Analysis",
    entityId: analysis.id,
    detail: `${source.toLowerCase()} · ${modules.join(", ")}`,
  });

  after(() => runAnalysis(analysis.id));

  redirect(`/analyse/${analysis.id}`);
}

/** Re-runs an existing analysis, e.g. after the corpus has grown. */
export async function reanalyse(analysisId: string) {
  const user = await requireUser();

  const analysis = await db.analysis.findUnique({
    where: { id: analysisId },
    select: { id: true, userId: true },
  });
  if (!analysis || analysis.userId !== user.id) {
    throw new Error("Analysis not found.");
  }

  await db.analysis.update({
    where: { id: analysisId },
    data: { status: "PENDING", stage: "QUEUED", statusDetail: null },
  });

  after(() => runAnalysis(analysisId));
  revalidatePath(`/analyse/${analysisId}`);
}

export async function deleteAnalysis(analysisId: string) {
  const user = await requireUser();

  const analysis = await db.analysis.findUnique({
    where: { id: analysisId },
    select: { id: true, userId: true, storageKey: true },
  });
  if (!analysis || analysis.userId !== user.id) {
    throw new Error("Analysis not found.");
  }

  if (analysis.storageKey) await deleteFile(analysis.storageKey);
  await db.analysis.delete({ where: { id: analysisId } });

  await audit({
    userId: user.id,
    action: "ANALYSE_DELETE",
    entity: "Analysis",
    entityId: analysisId,
  });

  revalidatePath("/analyse/history");
  redirect("/analyse/history");
}

function parseModuleSelection(values: FormDataEntryValue[]): AnalysisModule[] {
  const selected = values
    .map(String)
    .filter((value): value is AnalysisModule =>
      (ALL_MODULES as string[]).includes(value),
    );
  return selected.length > 0 ? selected : ["SIMILARITY"];
}

function safeJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}
