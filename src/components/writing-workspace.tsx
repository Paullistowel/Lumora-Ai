"use client";

import { useDeferredValue, useRef, useState, type DragEvent, type ChangeEvent } from "react";
import { useMemo } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Bot, Check, CircleHelp, Eraser, FileDown, FileText, Gauge, ListChecks,
  PanelRightClose, PanelRightOpen, Quote, ScanSearch, Sparkles, WandSparkles,
  LoaderCircle, Upload,
} from "lucide-react";
import { applyAll, applyOne, checkGrammar, type GrammarIssue } from "@/lib/grammar";
import { detectAiStyle, humanize, DEFAULT_OPTIONS, type HumanizeOptions } from "@/lib/humanize";
import { Badge, Button, Card, ScoreRing, cn } from "@/components/ui";

const SAMPLE = `Artificial intelligence has transformed the way higher education institutions handle academic honesty. Conventional plagiarism tools depend on matching strings of text, which catches directly copied sections but misses cases where a learner expresses an identical concept using alternative phrasing.

Meaning-based detection closes this gap. By transforming every paragraph into a numerical representation that captures sense instead of wording, the software identifies when two passages with different vocabulary convey the same claim.

Nevertheless, a high semantic score does not establish wrongdoing. Learners drawing on an identical set of readings will inevitably generate similar reasoning, and properly attributed quotations appear similar as a matter of course.`;

type Tool = "suggestions" | "ai" | "plagiarism" | "humanizer" | "paraphraser";

const TOOLS: { id: Tool; label: string; description: string; icon: typeof Bot; accent: string }[] = [
  { id: "suggestions", label: "Suggestions", description: "Live writing feedback", icon: ListChecks, accent: "var(--brand)" },
  { id: "ai", label: "AI detector", description: "Style signals, not verdicts", icon: Bot, accent: "var(--accent)" },
  { id: "plagiarism", label: "Similarity", description: "Compare against a source", icon: ScanSearch, accent: "var(--accent-2)" },
  { id: "humanizer", label: "Humanizer", description: "Make the prose more natural", icon: WandSparkles, accent: "var(--risk-moderate)" },
  { id: "paraphraser", label: "Paraphraser", description: "Explore a clearer phrasing", icon: Quote, accent: "var(--risk-original)" },
];

function words(text: string) {
  return text.match(/[A-Za-z0-9'-]+/g)?.length ?? 0;
}

function downloadText(text: string) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
  link.download = "lume-draft.txt";
  link.click();
  URL.revokeObjectURL(link.href);
}

export function WritingWorkspace() {
  const [text, setText] = useState("");
  const [activeTool, setActiveTool] = useState<Tool | null>("suggestions");
  const [panelOpen, setPanelOpen] = useState(true);
  const [source, setSource] = useState("");
  const [options, setOptions] = useState<HumanizeOptions>(DEFAULT_OPTIONS);
  const [documentName, setDocumentName] = useState("Untitled academic draft");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const deferredText = useDeferredValue(text);
  const grammar = useMemo(() => checkGrammar(deferredText), [deferredText]);
  const aiReport = useMemo(() => detectAiStyle(deferredText), [deferredText]);
  const rewrite = useMemo(() => humanize(deferredText, options), [deferredText, options]);
  const wordCount = words(text);
  const paragraphCount = text.split(/\n{2,}/).filter((paragraph) => paragraph.trim()).length;

  function selectTool(tool: Tool) {
    setActiveTool(tool);
    setPanelOpen(true);
  }

  function toggleOption(key: keyof HumanizeOptions) {
    setOptions((current) => ({ ...current, [key]: !current[key] }));
  }

  function applyIssue(issue: GrammarIssue, replacement: string) {
    setText((current) => applyOne(current, issue, replacement));
  }

  function applyAllSuggestions() {
    setText((current) => applyAll(current, grammar.issues));
  }

  async function importDocument(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/writing/extract", {
        method: "POST",
        body: formData,
      });
      const result = (await response.json()) as { text?: string; fileName?: string; error?: string };
      if (!response.ok || !result.text) throw new Error(result.error ?? "The document could not be read.");
      setText(result.text);
      setDocumentName(result.fileName ?? file.name);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "The document could not be read.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    void importDocument(event.dataTransfer.files[0]);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    void importDocument(event.target.files?.[0]);
  }

  const active = TOOLS.find((tool) => tool.id === activeTool);

  return (
    <div className="-mx-4 -my-7 flex min-h-[calc(100dvh-4.5rem)] flex-col bg-[radial-gradient(circle_at_70%_0%,color-mix(in_srgb,var(--brand)_9%,transparent),transparent_32rem),var(--surface-muted)] sm:-mx-6">
      <header className="surface-glass flex flex-wrap items-center gap-3 border-b border-border px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand"><FileText className="size-4" /></span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{documentName}</p>
            <p className="text-xs text-muted">{uploading ? "Reading document…" : "Saved locally in this session"}</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <Button variant="secondary" className="px-2.5 py-2 text-xs" onClick={() => fileInputRef.current?.click()} disabled={uploading}><Upload className="size-3.5" /> Upload</Button>
          <input ref={fileInputRef} type="file" accept=".pdf,.docx,.doc,.txt,.md" onChange={handleFileChange} className="sr-only" />
          <Button variant="ghost" className="px-2.5 py-2 text-xs" onClick={() => { setText(SAMPLE); setDocumentName("Example academic draft"); setUploadError(null); }}><Sparkles className="size-3.5" /> Example</Button>
          <Button variant="ghost" className="px-2.5 py-2 text-xs" onClick={() => setText("")} disabled={!text}><Eraser className="size-3.5" /> Clear</Button>
          <Button variant="secondary" className="px-2.5 py-2 text-xs" onClick={() => downloadText(text)} disabled={!text}><FileDown className="size-3.5" /> Export</Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside className="order-2 flex shrink-0 border-t border-border bg-surface/85 px-3 py-2 lg:order-1 lg:w-[4.75rem] lg:flex-col lg:border-t-0 lg:border-r lg:px-2 lg:py-5">
          <div className="flex gap-1 overflow-x-auto lg:flex-col lg:gap-2">
            {TOOLS.map((tool) => {
              const Icon = tool.icon;
              const selected = activeTool === tool.id && panelOpen;
              return (
                <button key={tool.id} type="button" onClick={() => selectTool(tool.id)} title={tool.description} aria-label={tool.label} className={cn("focus-ring group flex min-w-16 flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2.5 text-[10px] font-medium transition-all lg:min-w-0", selected ? "bg-brand-soft text-brand shadow-[var(--shadow-sm)]" : "text-muted hover:bg-surface-muted hover:text-foreground")}>
                  <Icon className="size-5" style={{ color: selected ? undefined : tool.accent }} />
                  <span className="truncate">{tool.label}</span>
                </button>
              );
            })}
          </div>
          <button type="button" className="focus-ring mt-auto hidden items-center justify-center rounded-xl p-2 text-muted hover:bg-surface-muted lg:flex" title="Workspace help" aria-label="Workspace help"><CircleHelp className="size-4" /></button>
        </aside>

        <main className="order-1 min-w-0 flex-1 overflow-y-auto px-4 py-5 sm:px-8 lg:order-2 lg:px-10 lg:py-8">
          <div className="mx-auto max-w-3xl">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div><p className="text-xs font-semibold tracking-[0.14em] text-brand uppercase">Writing workspace</p><h1 className="mt-1 text-xl font-semibold tracking-tight">Think on the page.</h1></div>
              <button type="button" onClick={() => setPanelOpen((open) => !open)} className="focus-ring rounded-xl border border-border bg-surface p-2.5 text-muted transition-colors hover:border-border-strong hover:text-foreground" title={panelOpen ? "Close analysis panel" : "Open analysis panel"} aria-label={panelOpen ? "Close analysis panel" : "Open analysis panel"}>{panelOpen ? <PanelRightClose className="size-4" /> : <PanelRightOpen className="size-4" />}</button>
            </div>
            <section onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={handleDrop} className={cn("overflow-hidden rounded-2xl border bg-surface shadow-[var(--shadow-md)] transition-colors", dragging ? "border-brand ring-2 ring-brand/20" : "border-border")}>
              <div className="flex items-center justify-between border-b border-border px-5 py-3 text-xs text-muted"><span className="inline-flex items-center gap-2"><span className="size-2 rounded-full bg-risk-original" /> Editing</span><span>{wordCount > 0 ? "Local analysis active" : "Start with a blank page"}</span></div>
              {uploading ? <div className="flex items-center gap-3 border-b border-border bg-brand-soft/40 px-5 py-3 text-xs text-brand sm:px-10"><LoaderCircle className="size-4 animate-spin" /> Extracting text and preparing your writing checks…</div> : null}
              <textarea value={text} onChange={(event) => { setText(event.target.value); setDocumentName("Untitled academic draft"); }} placeholder="Start writing your introduction, paste a draft, or drop a PDF, Word or text document here..." spellCheck className="min-h-[48dvh] w-full resize-none bg-transparent px-5 py-6 text-[1.02rem] leading-[1.9] text-foreground outline-none placeholder:text-muted/70 sm:min-h-[56dvh] sm:px-10 sm:py-9 sm:text-[1.08rem]" />
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border bg-surface-muted/45 px-5 py-3 text-xs text-muted sm:px-10"><span>{wordCount} words</span><span>{text.length} characters</span><span>{paragraphCount} paragraphs</span><span className="ml-auto inline-flex items-center gap-1.5"><Gauge className="size-3.5" /> {wordCount ? `${Math.max(1, Math.ceil(wordCount / 200))} min read` : "Ready"}</span></div>
            </section>
            {uploadError ? <p role="alert" className="mt-3 rounded-xl border border-risk-critical/25 bg-risk-critical/10 px-3.5 py-2.5 text-xs text-risk-critical">{uploadError}</p> : null}
            {dragging ? <p className="mt-3 text-center text-xs font-medium text-brand">Drop to import and scan this document</p> : null}
          </div>
        </main>

        <AnimatePresence initial={false}>
          {panelOpen && active ? <motion.aside initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 18 }} transition={{ duration: 0.22 }} className="order-3 w-full shrink-0 border-t border-border bg-surface px-4 py-5 lg:w-[22rem] lg:border-t-0 lg:border-l lg:px-5 lg:py-6"><ToolPanel tool={activeTool!} text={text} grammar={grammar.issues} aiReport={aiReport} source={source} setSource={setSource} rewrite={rewrite} options={options} toggleOption={toggleOption} onReplace={setText} onApplyIssue={applyIssue} onApplyAll={applyAllSuggestions} /></motion.aside> : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ToolPanel({ tool, text, grammar, aiReport, source, setSource, rewrite, options, toggleOption, onReplace, onApplyIssue, onApplyAll }: { tool: Tool; text: string; grammar: GrammarIssue[]; aiReport: ReturnType<typeof detectAiStyle>; source: string; setSource: (value: string) => void; rewrite: ReturnType<typeof humanize>; options: HumanizeOptions; toggleOption: (key: keyof HumanizeOptions) => void; onReplace: (value: string) => void; onApplyIssue: (issue: GrammarIssue, replacement: string) => void; onApplyAll: () => void }) {
  const config = TOOLS.find((item) => item.id === tool)!;
  return <div className="mx-auto max-w-3xl lg:mx-0 lg:max-w-none"><div className="mb-5 flex items-start justify-between gap-3"><div><div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-brand-soft text-brand"><config.icon className="size-5" /></div><h2 className="text-base font-semibold">{config.label}</h2><p className="mt-1 text-xs text-muted">{config.description}</p></div><Badge tone="neutral">Local</Badge></div>{tool === "suggestions" ? <SuggestionsPanel text={text} grammar={grammar} onApplyIssue={onApplyIssue} onApplyAll={onApplyAll} /> : null}{tool === "ai" ? <AiPanel text={text} report={aiReport} /> : null}{tool === "plagiarism" ? <SimilarityPanel source={source} setSource={setSource} text={text} /> : null}{tool === "humanizer" ? <HumanizerPanel text={text} result={rewrite} options={options} toggleOption={toggleOption} onReplace={onReplace} /> : null}{tool === "paraphraser" ? <ParaphrasePanel text={text} result={rewrite} onReplace={onReplace} /> : null}</div>;
}

function SuggestionsPanel({ text, grammar, onApplyIssue, onApplyAll }: { text: string; grammar: GrammarIssue[]; onApplyIssue: (issue: GrammarIssue, replacement: string) => void; onApplyAll: () => void }) {
  if (!text) return <EmptyPanel icon={ListChecks} title="Suggestions will appear here" body="Start writing and Lumora will look for spelling, grammar, clarity and academic style issues." />;
  return <div className="space-y-3"><Card className="border-brand/20 bg-brand-soft/35 p-4"><div className="flex items-center gap-3"><ScoreRing value={grammar.length ? Math.max(0, 100 - grammar.length * 5) : 100} size={68} colour="var(--brand)" caption="clarity" /><div className="min-w-0"><p className="text-sm font-semibold">{grammar.length ? `${grammar.length} suggestion${grammar.length === 1 ? "" : "s"}` : "Looking clean"}</p><p className="mt-1 text-xs text-muted">{grammar.length ? "Review each change before applying it." : "No issues found in the current draft."}</p></div></div>{grammar.some((issue) => issue.replacements.length > 0) ? <Button variant="gradient" className="mt-4 w-full text-xs" onClick={onApplyAll}><Check className="size-3.5" /> Fix all suggestions</Button> : null}</Card>{grammar.slice(0, 8).map((issue) => <div key={`${issue.start}-${issue.match}`} className="rounded-xl border border-border bg-surface p-3.5"><div className="flex items-center gap-2"><span className="size-2 rounded-full bg-risk-moderate" /><p className="text-xs font-semibold">{issue.title}</p><Badge tone="neutral" className="ml-auto">{issue.category}</Badge></div><p className="mt-2 text-xs leading-relaxed text-muted">{issue.message}</p>{issue.replacements.length > 0 ? <div className="mt-3 flex flex-wrap gap-1.5">{issue.replacements.slice(0, 3).map((replacement) => <button key={replacement} type="button" onClick={() => onApplyIssue(issue, replacement)} className="focus-ring rounded-lg bg-brand px-2.5 py-1.5 text-xs font-medium text-brand-fg transition-transform hover:scale-[1.02]">{replacement === "(delete)" ? "Remove" : `Use “${replacement}”`}</button>)}</div> : null}</div>)}</div>;
}

function AiPanel({ text, report }: { text: string; report: ReturnType<typeof detectAiStyle> }) {
  if (!text) return <EmptyPanel icon={Bot} title="AI-style analysis is ready" body="Paste at least 40 words for a more useful read. This is a stylistic signal, not proof of authorship." />;
  return <div className="space-y-4"><Card className="flex items-center gap-4 p-4"><ScoreRing value={report.score} size={86} colour={report.score > 60 ? "var(--risk-moderate)" : "var(--risk-original)"} caption="AI-style" /><div><p className="text-sm font-semibold">{report.score > 60 ? "Some signals to review" : "Low AI-style signal"}</p><p className="mt-1 text-xs leading-relaxed text-muted">Indicative only. Human review and disclosure policy still matter.</p></div></Card>{report.signals.map((signal) => <div key={signal.label} className="rounded-xl border border-border bg-surface p-3.5"><p className="text-xs font-semibold">{signal.label}</p><p className="mt-1 text-xs leading-relaxed text-muted">{signal.detail}</p></div>)}</div>;
}

function SimilarityPanel({ text, source, setSource }: { text: string; source: string; setSource: (value: string) => void }) {
  const draftWords = new Set((text.toLowerCase().match(/[a-z0-9']+/g) ?? []).filter((word) => word.length > 3));
  const sourceWords = new Set((source.toLowerCase().match(/[a-z0-9']+/g) ?? []).filter((word) => word.length > 3));
  const shared = [...sourceWords].filter((word) => draftWords.has(word));
  const score = sourceWords.size ? Math.round((shared.length / Math.max(draftWords.size, sourceWords.size)) * 100) : 0;
  return <div className="space-y-4"><Card className="p-4"><div className="flex items-center gap-4"><ScoreRing value={score} size={84} colour={score > 30 ? "var(--risk-moderate)" : "var(--risk-original)"} caption="overlap" /><div><p className="text-sm font-semibold">{source ? `${shared.length} shared terms` : "Add a source"}</p><p className="mt-1 text-xs text-muted">This workspace preview uses local word overlap. Full reports use Lumora&apos;s semantic engine.</p></div></div></Card><label className="block"><span className="mb-1.5 block text-xs font-semibold">Compare against a source</span><textarea value={source} onChange={(event) => setSource(event.target.value)} placeholder="Paste a reading or earlier draft..." className="focus-ring min-h-32 w-full resize-y rounded-xl border border-border bg-surface px-3.5 py-3 text-xs leading-relaxed outline-none placeholder:text-muted" /></label><p className="text-xs text-muted">{shared.length ? `Shared terms: ${shared.slice(0, 7).join(", ")}` : "No source text has been added yet."}</p></div>;
}

function HumanizerPanel({ text, result, options, toggleOption, onReplace }: { text: string; result: ReturnType<typeof humanize>; options: HumanizeOptions; toggleOption: (key: keyof HumanizeOptions) => void; onReplace: (value: string) => void }) {
  if (!text) return <EmptyPanel icon={WandSparkles} title="Refine your voice" body="Write a draft first. Lumora will suggest clearer, less formulaic phrasing while keeping your ideas yours." />;
  return <div className="space-y-4"><Card className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm font-semibold">{result.changes.length} possible refinements</p><p className="mt-1 text-xs text-muted">Review the changes before replacing your draft.</p></div><Sparkles className="size-4 text-risk-moderate" /></div><Button variant="gradient" className="mt-4 w-full" onClick={() => onReplace(result.text)} disabled={!result.changes.length}><Check className="size-4" /> Apply suggestions</Button></Card><div className="space-y-2">{(["simplifyVocabulary", "varyTransitions", "activateVerbs", "varyRhythm", "trimHedging"] as const).map((key) => <label key={key} className="flex items-center justify-between rounded-xl border border-border px-3 py-2.5 text-xs"><span>{key === "simplifyVocabulary" ? "Simplify formulaic phrases" : key === "varyTransitions" ? "Vary transitions" : key === "activateVerbs" ? "Use active verbs" : key === "varyRhythm" ? "Vary sentence rhythm" : "Trim stacked hedges"}</span><input type="checkbox" checked={options[key]} onChange={() => toggleOption(key)} className="size-4 accent-[var(--brand)]" /></label>)}</div></div>;
}

function ParaphrasePanel({ text, result, onReplace }: { text: string; result: ReturnType<typeof humanize>; onReplace: (value: string) => void }) {
  if (!text) return <EmptyPanel icon={Quote} title="A clearer version, when you need one" body="Add text to generate a light-touch alternative using Lumora&apos;s writing patterns." />;
  return <div className="space-y-4"><Card className="p-4"><p className="text-xs font-semibold">Preview</p><p className="mt-3 max-h-56 overflow-y-auto text-xs leading-relaxed text-muted">{result.text}</p><Button variant="secondary" className="mt-4 w-full" onClick={() => onReplace(result.text)}><Check className="size-4" /> Use this version</Button></Card><p className="text-xs leading-relaxed text-muted">Paraphrasing should preserve the original claim and still be cited. Check the meaning before using it.</p></div>;
}

function EmptyPanel({ icon: Icon, title, body }: { icon: typeof Bot; title: string; body: string }) {
  return <div className="rounded-2xl border border-dashed border-border bg-surface-muted/45 px-5 py-10 text-center"><Icon className="mx-auto size-7 text-brand" /><p className="mt-3 text-sm font-semibold">{title}</p><p className="mt-1.5 text-xs leading-relaxed text-muted">{body}</p></div>;
}
