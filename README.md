# AI-AIMS

**AI Academic Integrity & Assignment Management Platform** — assignment workflow, semantic plagiarism detection, AI writing feedback and anonymous peer review, in one Next.js application.

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
paraphrase that shares almost no wording with its source.

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
