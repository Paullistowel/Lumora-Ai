/**
 * Runs the document-processing pipeline over every submission that has not
 * been analysed yet. Used after seeding, and useful for reprocessing a corpus
 * after changing the embedding backend.
 *
 * Run with: npm run db:analyze
 */

import "dotenv/config";
import { db } from "../src/lib/db.js";
import { processSubmission } from "../src/lib/pipeline.js";
import { backendUsed } from "../src/lib/embeddings.js";

async function main() {
  const pending = await db.submission.findMany({
    where: { status: { in: ["PENDING", "FAILED"] } },
    orderBy: { submittedAt: "asc" },
    select: {
      id: true,
      student: { select: { fullName: true } },
      assignment: { select: { title: true } },
    },
  });

  if (pending.length === 0) {
    console.log("Nothing to analyse — every submission is already processed.");
    return;
  }

  console.log(`Analysing ${pending.length} submission(s)…\n`);

  for (const submission of pending) {
    process.stdout.write(`  ${submission.student.fullName}… `);
    await processSubmission(submission.id);

    const result = await db.similarityResult.findUnique({
      where: { submissionId: submission.id },
      select: { overallScore: true, riskLevel: true, comparedAgainst: true },
    });
    const writing = await db.writingFeedback.findUnique({
      where: { submissionId: submission.id },
      select: { overallScore: true },
    });

    if (result) {
      console.log(
        `${result.overallScore.toFixed(1)}% similarity (${result.riskLevel}) ` +
          `vs ${result.comparedAgainst} peer(s), writing ${writing?.overallScore ?? "—"}/100`,
      );
    } else {
      const failed = await db.submission.findUnique({
        where: { id: submission.id },
        select: { status: true, statusDetail: true },
      });
      console.log(`${failed?.status}: ${failed?.statusDetail ?? "no result"}`);
    }
  }

  // Scores computed before later submissions arrived are now stale.
  console.log("\nRefreshing scores across the corpus…");
  const all = await db.submission.findMany({
    where: { status: "COMPLETE", isLatest: true },
    select: { id: true },
  });
  const { computeSimilarity, saveSimilarityResult } = await import(
    "../src/lib/similarity.js"
  );
  for (const submission of all) {
    const computation = await computeSimilarity(submission.id);
    await saveSimilarityResult(submission.id, computation);
  }

  console.log(`\nDone. Embedding backend: ${backendUsed()}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
