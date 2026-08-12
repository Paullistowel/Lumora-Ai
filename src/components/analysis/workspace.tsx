"use client";

import { useActionState, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ClipboardPaste, FileUp, Info, Layers, Plus, ScanSearch, Sparkles,
  SpellCheck, Trash2, Loader2, ShieldCheck,
} from "lucide-react";
import { createAnalysis, type AnalyseState } from "@/app/(app)/analyse/actions";
import { DropZone } from "./dropzone";
import {
  Alert, Badge, Button, Card, CardHeader, Input, Textarea, cn,
} from "@/components/ui";
import type { Role } from "@/lib/auth";

type ModuleKey = "SIMILARITY" | "WRITING" | "INTEGRITY" | "AI_STYLE";

const MODULES: {
  key: ModuleKey;
  label: string;
  description: string;
  icon: typeof ScanSearch;
}[] = [
  {
    key: "SIMILARITY",
    label: "Semantic similarity",
    description: "Find conceptually similar passages, including reworded ones.",
    icon: ScanSearch,
  },
  {
    key: "WRITING",
    label: "Academic writing",
    description: "Grammar, clarity, structure, academic tone and coherence.",
    icon: SpellCheck,
  },
  {
    key: "INTEGRITY",
    label: "Academic integrity",
    description: "Citation coverage and claims that carry no attribution.",
    icon: ShieldCheck,
  },
  {
    key: "AI_STYLE",
    label: "AI-style indicators",
    description: "Stylistic patterns common in generated prose. Indicative only.",
    icon: Sparkles,
  },
];

type Reference = { id: string; label: string; text: string };

const PLACEHOLDER =
  "Paste your essay, assignment, research paper or academic content here...";

export function AnalysisWorkspace({ role }: { role: Role }) {
  const [state, formAction, pending] = useActionState<AnalyseState, FormData>(
    createAnalysis,
    null,
  );

  const [mode, setMode] = useState<"UPLOAD" | "TEXT">("UPLOAD");
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [modules, setModules] = useState<ModuleKey[]>(["SIMILARITY", "WRITING"]);
  const [corpusScope, setCorpusScope] = useState<"REFERENCES" | "PLATFORM">("REFERENCES");
  const [references, setReferences] = useState<Reference[]>([
    { id: "r1", label: "Source 1", text: "" },
  ]);

  const wordCount = useMemo(
    () => (text.match(/[A-Za-z0-9'-]+/g) ?? []).length,
    [text],
  );

  const wantsSimilarity = modules.includes("SIMILARITY");
  const usableReferences = references.filter((r) => r.text.trim().length > 60);

  const ready =
    (mode === "UPLOAD" ? file !== null : wordCount >= 30) &&
    modules.length > 0 &&
    (!wantsSimilarity || corpusScope === "PLATFORM" || usableReferences.length > 0);

  const platformCorpusLabel =
    role === "STUDENT"
      ? "Your own earlier submissions"
      : role === "LECTURER"
        ? "Submissions on the courses you teach"
        : "Every submission on the platform";

  function toggleModule(key: ModuleKey) {
    setModules((current) =>
      current.includes(key) ? current.filter((m) => m !== key) : [...current, key],
    );
  }

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="source" value={mode} />
      <input type="hidden" name="corpusScope" value={corpusScope} />
      <input
        type="hidden"
        name="references"
        value={JSON.stringify(
          usableReferences.map((r) => ({ label: r.label, text: r.text })),
        )}
      />
      {modules.map((module) => (
        <input key={module} type="hidden" name="modules" value={module} />
      ))}

      {state?.error ? <Alert tone="error">{state.error}</Alert> : null}

      {/* ── 1. Input ─────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader
          title="1 · Your work"
          description="Upload a document or paste the text you want Lume AI to analyse."
          icon={<FileUp className="size-4" />}
        />

        <div
          role="tablist"
          aria-label="How to provide your work"
          className="mb-5 inline-flex rounded-xl border border-border bg-surface-muted p-1"
        >
          {(
            [
              { key: "UPLOAD", label: "Upload document", icon: FileUp },
              { key: "TEXT", label: "Paste text", icon: ClipboardPaste },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={mode === tab.key}
              onClick={() => setMode(tab.key)}
              className={cn(
                "focus-ring relative flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                mode === tab.key ? "text-brand" : "text-muted hover:text-foreground",
              )}
            >
              {mode === tab.key ? (
                <motion.span
                  layoutId="workspace-tab"
                  className="absolute inset-0 -z-10 rounded-lg bg-surface shadow-[var(--shadow-sm)]"
                  transition={{ type: "spring", stiffness: 400, damping: 34 }}
                />
              ) : null}
              <tab.icon className="size-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className={mode === "UPLOAD" ? "block" : "hidden"}>
          <DropZone file={file} onFile={setFile} disabled={pending} />
        </div>

        <div className={mode === "TEXT" ? "block space-y-3" : "hidden"}>
          <Input
            name="title"
            placeholder="Give this analysis a name (optional)"
            maxLength={120}
          />
          <Textarea
            name="text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={PLACEHOLDER}
            className="min-h-72 leading-relaxed"
            aria-label="Text to analyse"
          />
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
            <span>
              {wordCount.toLocaleString()} words · {text.length.toLocaleString()} characters
              {wordCount > 0 && wordCount < 30 ? " · at least 30 words needed" : ""}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={async () => {
                  try {
                    setText(await navigator.clipboard.readText());
                  } catch {
                    /* clipboard permission denied — the textarea still works */
                  }
                }}
                className="focus-ring rounded px-2 py-1 hover:text-foreground"
              >
                Paste
              </button>
              <button
                type="button"
                onClick={() => setText("")}
                className="focus-ring rounded px-2 py-1 hover:text-foreground"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* ── 2. Analysis type ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader
          title="2 · What to analyse"
          description="Pick one or run everything. Each module adds a section to your report."
          icon={<Layers className="size-4" />}
          action={
            <Button
              type="button"
              variant="ghost"
              onClick={() =>
                setModules(
                  modules.length === MODULES.length
                    ? ["SIMILARITY"]
                    : MODULES.map((m) => m.key),
                )
              }
              className="px-3 py-1.5 text-xs"
            >
              {modules.length === MODULES.length ? "Reset" : "Full analysis"}
            </Button>
          }
        />

        <div className="grid gap-3 sm:grid-cols-2">
          {MODULES.map((module) => {
            const selected = modules.includes(module.key);
            return (
              <button
                key={module.key}
                type="button"
                role="checkbox"
                aria-checked={selected}
                onClick={() => toggleModule(module.key)}
                className={cn(
                  "focus-ring flex gap-3 rounded-2xl border p-4 text-left transition-all",
                  selected
                    ? "border-brand/45 bg-brand-soft shadow-[var(--shadow-sm)]"
                    : "border-border bg-surface hover:border-border-strong",
                )}
              >
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-xl transition-colors",
                    selected ? "bg-brand text-brand-fg" : "bg-surface-muted text-muted",
                  )}
                >
                  <module.icon className="size-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{module.label}</span>
                  <span className="mt-0.5 block text-xs text-muted">
                    {module.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {modules.includes("AI_STYLE") ? (
          <p className="mt-4 flex gap-2 text-xs text-muted">
            <Info className="mt-px size-3.5 shrink-0" />
            AI-style analysis reports stylistic patterns. It cannot determine
            whether text was generated by AI, and no score from it should be
            treated as proof of authorship.
          </p>
        ) : null}
      </Card>

      {/* ── 3. Comparison corpus ─────────────────────────────────────────── */}
      <AnimatePresence initial={false}>
        {wantsSimilarity ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <Card>
              <CardHeader
                title="3 · Compare against"
                description="Similarity is only meaningful relative to a corpus. Choose what yours is."
                icon={<ScanSearch className="size-4" />}
              />

              <div className="mb-5 grid gap-3 sm:grid-cols-2">
                {(
                  [
                    {
                      key: "REFERENCES" as const,
                      label: "Sources I provide",
                      description: "Paste readings, a classmate's shared draft, or your own earlier essay.",
                    },
                    {
                      key: "PLATFORM" as const,
                      label: "My Lume AI corpus",
                      description: platformCorpusLabel,
                    },
                  ]
                ).map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    role="radio"
                    aria-checked={corpusScope === option.key}
                    onClick={() => setCorpusScope(option.key)}
                    className={cn(
                      "focus-ring rounded-2xl border p-4 text-left transition-all",
                      corpusScope === option.key
                        ? "border-brand/45 bg-brand-soft"
                        : "border-border bg-surface hover:border-border-strong",
                    )}
                  >
                    <span className="block text-sm font-medium">{option.label}</span>
                    <span className="mt-0.5 block text-xs text-muted">
                      {option.description}
                    </span>
                  </button>
                ))}
              </div>

              {corpusScope === "PLATFORM" ? (
                <Alert tone="info">
                  Lume AI compares only against documents your role permits you to
                  read. {platformCorpusLabel.toLowerCase()}. This is enforced on the
                  server, not by hiding options here.
                </Alert>
              ) : (
                <div className="space-y-3">
                  {references.map((reference, index) => (
                    <div
                      key={reference.id}
                      className="rounded-2xl border border-border bg-surface-muted/40 p-3"
                    >
                      <div className="mb-2 flex items-center gap-2">
                        <input
                          value={reference.label}
                          onChange={(event) =>
                            setReferences((current) =>
                              current.map((r) =>
                                r.id === reference.id
                                  ? { ...r, label: event.target.value }
                                  : r,
                              ),
                            )
                          }
                          aria-label={`Name for source ${index + 1}`}
                          className="focus-ring min-w-0 flex-1 rounded-lg bg-transparent px-1 py-0.5 text-sm font-medium"
                        />
                        {references.length > 1 ? (
                          <button
                            type="button"
                            onClick={() =>
                              setReferences((current) =>
                                current.filter((r) => r.id !== reference.id),
                              )
                            }
                            aria-label={`Remove ${reference.label}`}
                            className="focus-ring rounded-lg p-1.5 text-muted hover:text-risk-critical"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        ) : null}
                      </div>
                      <Textarea
                        value={reference.text}
                        onChange={(event) =>
                          setReferences((current) =>
                            current.map((r) =>
                              r.id === reference.id ? { ...r, text: event.target.value } : r,
                            ),
                          )
                        }
                        placeholder="Paste the full text of this source."
                        className="min-h-28 text-sm"
                      />
                    </div>
                  ))}

                  {references.length < 5 ? (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() =>
                        setReferences((current) => [
                          ...current,
                          {
                            id: `r${current.length + 1}-${Date.now()}`,
                            label: `Source ${current.length + 1}`,
                            text: "",
                          },
                        ])
                      }
                      className="px-3 py-1.5 text-xs"
                    >
                      <Plus className="size-3.5" /> Add source
                    </Button>
                  ) : null}
                </div>
              )}
            </Card>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* ── Submit ───────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="submit"
          variant="gradient"
          disabled={!ready || pending}
          className="px-6 py-3"
        >
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Starting analysis…
            </>
          ) : (
            <>
              <ScanSearch className="size-4" /> Analyse
            </>
          )}
        </Button>

        <div className="flex flex-wrap gap-1.5">
          {modules.map((module) => (
            <Badge key={module} tone="brand">
              {MODULES.find((m) => m.key === module)?.label}
            </Badge>
          ))}
        </div>

        {!ready && !pending ? (
          <p className="text-xs text-muted">
            {mode === "UPLOAD" && !file
              ? "Add a document to continue."
              : mode === "TEXT" && wordCount < 30
                ? "Paste at least 30 words to continue."
                : modules.length === 0
                  ? "Choose at least one analysis type."
                  : "Add a source to compare against, or switch to your Lume AI corpus."}
          </p>
        ) : null}
      </div>
    </form>
  );
}
