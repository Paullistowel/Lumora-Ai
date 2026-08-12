"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/components/ui";

/**
 * Interactive system architecture. The diagram is plain HTML boxes in a CSS
 * grid rather than an SVG so it reflows on a phone, stays keyboard-navigable,
 * and lets each node carry a real description.
 */

type Node = {
  id: string;
  label: string;
  sub: string;
  detail: string;
  tier: "client" | "server" | "engine" | "store";
};

const NODES: Node[] = [
  {
    id: "user",
    label: "Student / Lecturer",
    sub: "Browser",
    detail:
      "Both roles use the same interface. What each can see is decided on the server from their session, not by hiding controls in the UI.",
    tier: "client",
  },
  {
    id: "app",
    label: "Next.js App Router",
    sub: "React 19 · server components",
    detail:
      "Pages render on the server and stream to the browser. Interactive parts — the workspace, the report tabs, the charts — hydrate as client components.",
    tier: "client",
  },
  {
    id: "actions",
    label: "Server actions & routes",
    sub: "Node.js runtime",
    detail:
      "Every mutation runs as a server action that re-checks the caller's session and role before touching data. The analysis progress endpoint is a route handler scoped to the owner of the analysis.",
    tier: "server",
  },
  {
    id: "auth",
    label: "Auth & RBAC",
    sub: "Sessions · bcrypt · roles",
    detail:
      "Session tokens are hashed before storage. Role checks (requireRole) gate every server action, and corpus queries are filtered by what the caller is entitled to read.",
    tier: "server",
  },
  {
    id: "documents",
    label: "Document processing",
    sub: "PDF · DOCX · TXT · MD",
    detail:
      "Text is extracted, whitespace and PDF punctuation artefacts are normalised, then the document is split into paragraphs. Short blocks merge forward so nothing embeds a two-word chunk.",
    tier: "engine",
  },
  {
    id: "embeddings",
    label: "Embedding model",
    sub: "sentence-transformers on CPU",
    detail:
      "transformers.js runs the model locally from weights cached on disk. No inference request leaves the machine. If the model cannot load, a lexical fallback keeps the pipeline working and every report says which backend produced it.",
    tier: "engine",
  },
  {
    id: "similarity",
    label: "Similarity engine",
    sub: "Cosine · length-weighted roll-up",
    detail:
      "Each paragraph vector is compared against the corpus by cosine similarity. Per-paragraph maxima roll up into a document score weighted by paragraph length, then map to a risk band.",
    tier: "engine",
  },
  {
    id: "writing",
    label: "Writing & style analysis",
    sub: "Readability · tone · AI-style",
    detail:
      "Deterministic linguistic analysis — no model call, no API key. The same input always produces the same score, which is what makes progress over a semester comparable.",
    tier: "engine",
  },
  {
    id: "peer",
    label: "Peer review engine",
    sub: "Double-blind allocation",
    detail:
      "Reviewers are allocated anonymously and balanced across the cohort, scored against a rubric, and each submitted review is itself assessed for specificity and constructiveness.",
    tier: "engine",
  },
  {
    id: "vectors",
    label: "Vector storage",
    sub: "Serialised float vectors",
    detail:
      "Paragraph embeddings are stored alongside their text. On SQLite they are serialised JSON; on PostgreSQL the same column becomes pgvector for indexed nearest-neighbour search.",
    tier: "store",
  },
  {
    id: "db",
    label: "Database",
    sub: "Prisma · SQLite / PostgreSQL",
    detail:
      "Users, courses, assignments, submissions, analyses, reviews, notifications and the audit log. One schema, one migration history, no external data store.",
    tier: "store",
  },
  {
    id: "storage",
    label: "Document store",
    sub: "Local disk / object storage",
    detail:
      "Uploaded files are written under opaque keys with traversal-safe path resolution. The interface is object-storage shaped, so moving to MinIO or S3 touches one file.",
    tier: "store",
  },
];

const TIERS: { key: Node["tier"]; label: string }[] = [
  { key: "client", label: "Client" },
  { key: "server", label: "Application" },
  { key: "engine", label: "Analysis engine" },
  { key: "store", label: "Persistence" },
];

export function ArchitectureDiagram() {
  const [active, setActive] = useState<string>("embeddings");
  const node = NODES.find((n) => n.id === active) ?? NODES[0];

  return (
    <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr] lg:items-start">
      <div className="space-y-4">
        {TIERS.map((tier, tierIndex) => (
          <div key={tier.key}>
            <p className="mb-2 text-xs font-semibold tracking-[0.14em] text-muted uppercase">
              {tier.label}
            </p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {NODES.filter((n) => n.tier === tier.key).map((entry, index) => (
                <motion.button
                  key={entry.id}
                  type="button"
                  onClick={() => setActive(entry.id)}
                  onMouseEnter={() => setActive(entry.id)}
                  aria-pressed={active === entry.id}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.3, delay: tierIndex * 0.06 + index * 0.04 }}
                  className={cn(
                    "focus-ring rounded-xl border p-3 text-left transition-all",
                    active === entry.id
                      ? "border-brand bg-brand-soft shadow-[var(--shadow-sm)]"
                      : "border-border bg-surface hover:border-border-strong",
                  )}
                >
                  <span className="block text-sm font-medium">{entry.label}</span>
                  <span className="mt-0.5 block text-xs text-muted">{entry.sub}</span>
                </motion.button>
              ))}
            </div>

            {tierIndex < TIERS.length - 1 ? (
              <div className="my-3 flex justify-center" aria-hidden>
                <span className="relative h-6 w-px overflow-hidden bg-border">
                  <motion.span
                    className="absolute inset-x-0 h-2 bg-brand"
                    animate={{ y: [-8, 24] }}
                    transition={{
                      duration: 1.6,
                      repeat: Infinity,
                      ease: "linear",
                      delay: tierIndex * 0.4,
                    }}
                  />
                </span>
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <aside className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-sm)] lg:sticky lg:top-24">
        <p className="text-xs font-semibold tracking-[0.14em] text-brand uppercase">
          {TIERS.find((t) => t.key === node.tier)?.label}
        </p>
        <h3 className="mt-2 text-lg font-semibold">{node.label}</h3>
        <p className="mt-0.5 text-sm text-muted">{node.sub}</p>
        <p className="mt-4 text-sm leading-relaxed">{node.detail}</p>
        <p className="mt-5 border-t border-border pt-4 text-xs text-muted">
          Select any component to read what it does. Nothing in this diagram
          describes a service outside the deployment boundary.
        </p>
      </aside>
    </div>
  );
}
