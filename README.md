# Lume AI

**AI-Powered Academic Integrity & Peer Review Platform**

Intelligent document analysis, semantic plagiarism detection, academic writing
feedback and structured peer review for higher education.

> Research Prototype · Group 4 · KNUST · 2026
>
> *Illuminate. Analyse. Improve.*

**Nothing in this application reports a research result that has not been
measured.** Capabilities are labelled *implemented*, *experimental* or
*evaluation pending*, and the accuracy figures the proposal targets are shown as
targets — not achievements — until `npm run benchmark` produces them from a real
labelled dataset. See [Research and evaluation](#research-and-evaluation).

## Quick start

```bash
npm install
npm run fetch-model    # caches all-MiniLM-L6-v2 (~23MB) for the similarity engine
npm run db:migrate     # creates dev.db
npm run db:seed        # demo institution, courses, students, submissions
npm run db:analyze     # embeds the seeded submissions and builds their reports
npm run dev
```

Then open <http://localhost:3000>.

### Demo accounts

All use the password `Password123`.

| Role     | Email                     | Notes                                            |
| -------- | ------------------------- | ------------------------------------------------ |
| Admin    | `admin@university.edu`    | Departments, courses, users, audit log           |
| Lecturer | `lecturer@university.edu` | Owns CSC401; marking and integrity console       |
| Student  | `chidi@university.edu`    | Submitted the original essay                     |
| Student  | `amara@university.edu`    | Submitted a **paraphrase** of Chidi's — 42% flag |
| Student  | `tunde@university.edu`    | Unrelated topic — 0%                             |
| Student  | `ngozi@university.edu`    | Spare account                                    |

Sign in as Amara and open **My submissions** to see the originality report catch a
paraphrase that shares almost no wording with its source. Or open **Analyse**
as any role, paste two related passages, and watch the same engine run live.

## The analysis workspace

`/analyse` is available to every role and is independent of the assignment
workflow. Upload a PDF, DOCX, DOC, TXT or Markdown file — or paste text — then
choose any combination of:

| Module | What it does |
| --- | --- |
| Semantic similarity | Cosine comparison of paragraph embeddings, classified as verbatim, near-verbatim or paraphrase by how much wording the passages share |
| Academic writing | Readability, academic tone, structure, coherence and grammar, each issue paired with what to change |
| Academic integrity | Citation coverage, and evidence-claims carrying no attribution nearby |
| AI-style indicators | Stylistic regularity associated with generated prose — indicative only, never proof of authorship |

The comparison corpus is assembled **server-side from what the caller is
entitled to read**: reference texts they paste in, plus (optionally) their own
earlier submissions for a student, submissions on their own courses for a
lecturer, or all submissions for an admin. A student can never compare against a
classmate's work, and an analysis is private to whoever ran it — including from
staff.

Processing runs through `after()` so the request returns immediately, and the
report page polls `/api/analysis/[id]` for the stage the engine is genuinely on.
The progress checklist is not on a timer.

## Research and evaluation

`/research` reports the project's objectives, targets, dataset status and model
benchmark. Every number there is read from files under `data/evaluation/`; when a
file is absent the page says *evaluation pending* rather than showing a
placeholder.

```bash
npm run benchmark                                  # all available models
npm run benchmark -- --model all-MiniLM-L6-v2      # one model
npm run benchmark -- --threshold 0.80              # different decision threshold
```

The harness (`scripts/benchmark.mjs`) reads labelled assignment pairs from
`data/corpus/pairs.jsonl` and computes precision, recall, F1, accuracy, the
confusion matrix, ROC/AUC, the F1-optimal threshold, per-pair latency and peak
memory — for `all-MiniLM-L6-v2`, `paraphrase-mpnet-base-v2` and a
Ghanaian-fine-tuned MiniLM (set `GHANAIAN_MODEL_ID` once that checkpoint
exists). See `data/corpus/README.md` for the dataset format and the consent,
anonymisation and retention requirements that govern it.

**Current status:** the corpus has not been collected, so the benchmark has not
been run and the usability (SUS) and writing-improvement studies have not taken
place. The application states this everywhere it would otherwise show a figure.

## How the AI works

Everything runs locally in Node — no API keys, no per-request cost.

**Plagiarism detection (Module 5).** Each submission is split into paragraphs and
embedded with `all-MiniLM-L6-v2` via transformers.js (384-dim, mean-pooled,
L2-normalised). Every paragraph is compared by cosine similarity against every
other student's paragraphs for the same assignment. Paragraphs matching at ≥0.75
are flagged, weighted by length, and rolled up into a document-level score.

Because it compares *meaning* rather than strings, rewording does not evade it —
the seeded paraphrase scores 42.6% despite sharing no long phrases with its
source.

The corpus is scoped to a single assignment on purpose: comparing across
assignments would flag shared prompts and course terminology as plagiarism.

**Fallback.** If the model cannot load (offline machine, restricted CI), the
system falls back to a hashed lexical vector so the pipeline still runs. It is
much weaker at paraphrase — `backendUsed()` reports which backend produced a
score. Force it with `EMBEDDING_BACKEND=lexical`.

**Writing feedback (Module 6).** Flesch reading ease and Flesch–Kincaid grade
level, plus checks for academic tone, passive voice, wordiness, sentence
structure, citation density against claim density, transitions and lexical
variety. Deterministic, so "writing improvement over time" is comparable across
semesters.

**Review quality (Module 9).** Peer reviews are scored 0–100 on depth,
specificity, constructiveness and respectfulness; low-effort and hostile reviews
are flagged for the lecturer.

## Architecture

```
src/
  app/
    (auth)/         login, register, OTP verification
    (app)/          authenticated shell
      student/      dashboard, assignments, submissions, reviews, courses, integrity guide
      lecturer/     dashboard, courses, assignments + marking, rubrics
      admin/        dashboard, users, departments, courses, audit log
      settings/     profile, password, sessions
      notifications/
  lib/
    auth.ts            bcrypt + JWT sessions, revocable server-side
    documents.ts       Module 4 — extract, clean, paragraph-detect, tokenize
    embeddings.ts      transformers.js with lexical fallback
    similarity.ts      Module 5 — cosine search, risk banding
    writing.ts         Module 6 — readability and style analysis
    review-quality.ts  Module 9
    peer-review.ts     Module 7 — balanced anonymous allocation
    pipeline.ts        orchestrates extract → embed → compare → analyse
    storage.ts         S3-shaped interface over local disk
    audit.ts           Module 19
  components/       design system, report views, app shell
prisma/
  schema.prisma     22 models covering all 20 modules
  seed.ts / analyze.ts
```

**Stack.** Next.js 16 (App Router, server actions) · TypeScript · Tailwind 4 ·
Prisma 7 · SQLite (dev) · transformers.js.

### Risk bands

| Score   | Level    |
| ------- | -------- |
| 0–15%   | Original |
| 16–30%  | Low      |
| 31–60%  | Moderate |
| 61–80%  | High     |
| 81–100% | Critical |

Thresholds are configurable per assignment.

## Module status

Built and working end-to-end: authentication and roles (1), student dashboard
(2), assignment management (3), document processing (4), plagiarism detection
(5), writing assistant (6), peer review (7), rubrics (8), review quality (9),
lecturer dashboard (10), admin dashboard (12), notifications — in-app (13),
analytics surfaced in dashboards (15), user/audit search (16), integrity
knowledge base (18), audit log (19), settings (20).

Scaffolded, not yet built out: standalone department dashboard (11), email/SMS
transports (13), PDF/Excel report export (14), recommendation engine (17).

## Production notes

Deliberate development-mode shortcuts, each a one-file change:

- **SQLite → Postgres.** Swap `provider` in `schema.prisma` and the adapter in
  `src/lib/db.ts` for `PrismaPg`. Store embeddings in a `pgvector` column and the
  similarity scan becomes an indexed query instead of a full scan.
- **Similarity is O(corpus).** Fine for a class; add an ANN index (pgvector
  HNSW) before an institution-wide corpus.
- **Processing runs inline** in the upload request. Move `processSubmission` to a
  queue for large documents — it is already idempotent.
- **OTP codes print to the terminal.** Set `SMTP_URL` and implement
  `deliverExternally` in `src/lib/notify.ts`.
- **Files go to local disk.** `src/lib/storage.ts` is already S3-shaped.
- **Set `AUTH_SECRET`** to a real value: `openssl rand -base64 32`.

## Scripts

| Command               | Purpose                        |
| --------------------- | ------------------------------ |
| `npm run dev`         | Development server             |
| `npm run build`       | Production build               |
| `npm run typecheck`   | `tsc --noEmit`                 |
| `npm run db:migrate`  | Apply migrations               |
| `npm run db:seed`     | Reset to demo data             |
| `npm run db:analyze`  | Process unanalysed submissions |
| `npm run db:studio`   | Prisma Studio                  |
| `npm run fetch-model` | Pre-cache the embedding model  |
