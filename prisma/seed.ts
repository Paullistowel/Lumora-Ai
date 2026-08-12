/**
 * Seeds a realistic demo institution: departments, courses, staff, students,
 * an assignment with a rubric, and submissions that deliberately include a
 * paraphrased near-duplicate so the similarity engine has something to find.
 *
 * Run with: npm run db:seed
 */

import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const db = new PrismaClient({
  adapter: new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL ?? "file:./dev.db",
  }),
});

const PASSWORD = "Password123";

// Two documents on the same topic. The second is a paraphrase of the first —
// no long shared phrases, so word-matching would miss it and semantic
// similarity should not.
const ORIGINAL = `Machine learning has reshaped how universities approach academic integrity. Traditional plagiarism detection relies on string matching, which identifies copied passages but fails when a student rewrites the same idea in different words.

Semantic detection addresses this gap. By converting each paragraph into a dense vector that encodes meaning rather than surface form, the system can recognise that two differently worded passages express the same argument. This is the central advantage of embedding-based approaches over lexical ones.

However, semantic similarity is not proof of misconduct. Students working from the same reading list will naturally produce overlapping arguments, and correctly quoted material registers as similar by design. The tool should therefore direct a lecturer's attention rather than deliver a verdict.

Effective deployment requires clear institutional policy. Thresholds must be set per assignment, students must understand how scores are produced, and every flagged case must be reviewed by a human before any consequence follows.`;

const PARAPHRASE = `Artificial intelligence has transformed the way higher education institutions handle academic honesty. Conventional plagiarism tools depend on matching strings of text, which catches directly copied sections but misses cases where a learner expresses an identical concept using alternative phrasing.

Meaning-based detection closes this gap. Through transforming every paragraph into a numerical representation that captures sense instead of wording, the software identifies when two passages with different vocabulary convey the same claim. That capability is the principal benefit of embedding methods compared with word-matching techniques.

Nevertheless, a high semantic score does not establish wrongdoing. Learners drawing on an identical set of readings will inevitably generate similar reasoning, and properly attributed quotations appear similar as a matter of course. The system ought to guide an instructor's review instead of issuing a judgement.

Successful adoption depends on unambiguous institutional rules. Limits should be configured for each task, learners need to understand how figures are calculated, and a person must examine every flagged submission before any action is taken.`;

const DISTINCT = `Renewable energy adoption in West Africa faces infrastructural rather than technological barriers. Solar photovoltaic costs have fallen by roughly ninety percent over the past decade, placing generation within reach of most national budgets.

The binding constraint is transmission. Grid infrastructure in much of the region was designed around a small number of large thermal plants near urban centres, and it cannot absorb distributed generation from rural solar installations without substantial reinforcement.

Financing models compound the problem. Multilateral lending favours large capital projects with measurable outputs, while the incremental substation upgrades that would unlock distributed capacity attract little attention despite their leverage.

A pragmatic path forward pairs mini-grid deployment with targeted transmission investment. Mini-grids serve immediate demand without waiting for national grid reform, while staged reinforcement builds the capacity to integrate them later.`;

async function main() {
  console.log("Seeding…");

  // Idempotent: wipe in dependency order so re-seeding is safe.
  await db.similarityMatch.deleteMany();
  await db.similarityResult.deleteMany();
  await db.chunk.deleteMany();
  await db.writingFeedback.deleteMany();
  await db.reviewScore.deleteMany();
  await db.peerReview.deleteMany();
  await db.submission.deleteMany();
  await db.assignment.deleteMany();
  await db.rubricCriterion.deleteMany();
  await db.rubric.deleteMany();
  await db.enrollment.deleteMany();
  await db.course.deleteMany();
  await db.notification.deleteMany();
  await db.auditLog.deleteMany();
  await db.session.deleteMany();
  await db.user.deleteMany();
  await db.department.deleteMany();

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  const computing = await db.department.create({
    data: { name: "Computer Science", code: "CSC" },
  });
  const engineering = await db.department.create({
    data: { name: "Electrical Engineering", code: "EEE" },
  });

  const admin = await db.user.create({
    data: {
      email: "admin@university.edu",
      fullName: "Ada Nwosu",
      passwordHash,
      role: "ADMIN",
      emailVerified: true,
      departmentId: computing.id,
    },
  });

  const lecturer = await db.user.create({
    data: {
      email: "lecturer@university.edu",
      fullName: "Dr Emeka Balogun",
      passwordHash,
      role: "LECTURER",
      emailVerified: true,
      departmentId: computing.id,
    },
  });

  await db.user.create({
    data: {
      email: "lecturer2@university.edu",
      fullName: "Dr Fatima Sule",
      passwordHash,
      role: "LECTURER",
      emailVerified: true,
      departmentId: engineering.id,
    },
  });

  const course = await db.course.create({
    data: {
      title: "Research Methods",
      code: "CSC401",
      level: 400,
      semester: "First",
      departmentId: computing.id,
      lecturerId: lecturer.id,
    },
  });

  await db.course.create({
    data: {
      title: "Machine Learning",
      code: "CSC412",
      level: 400,
      semester: "First",
      departmentId: computing.id,
      lecturerId: lecturer.id,
    },
  });

  const studentSpecs = [
    { name: "Chidi Okafor", matric: "CSC/2021/0011", email: "chidi@university.edu" },
    { name: "Amara Eze", matric: "CSC/2021/0012", email: "amara@university.edu" },
    { name: "Tunde Adeyemi", matric: "CSC/2021/0013", email: "tunde@university.edu" },
    { name: "Ngozi Obi", matric: "CSC/2021/0014", email: "ngozi@university.edu" },
  ];

  const students = [];
  for (const spec of studentSpecs) {
    const student = await db.user.create({
      data: {
        email: spec.email,
        fullName: spec.name,
        passwordHash,
        role: "STUDENT",
        emailVerified: true,
        matricNumber: spec.matric,
        level: 400,
        departmentId: computing.id,
      },
    });
    await db.enrollment.create({
      data: { studentId: student.id, courseId: course.id },
    });
    students.push(student);
  }

  const rubric = await db.rubric.create({
    data: {
      name: "Standard essay rubric",
      description: "Applies to written coursework across the department.",
      isTemplate: true,
      criteria: {
        create: [
          {
            label: "Argument and analysis",
            description: "Is the central claim clear and well supported?",
            maxScore: 10,
            weight: 2,
            order: 0,
          },
          {
            label: "Use of evidence",
            description: "Are sources relevant, current and correctly cited?",
            maxScore: 10,
            weight: 1.5,
            order: 1,
          },
          {
            label: "Structure and clarity",
            description: "Does the piece flow logically from section to section?",
            maxScore: 10,
            weight: 1,
            order: 2,
          },
          {
            label: "Academic style",
            description: "Is the register appropriate and the prose precise?",
            maxScore: 10,
            weight: 1,
            order: 3,
          },
        ],
      },
    },
  });

  const dueAt = new Date(Date.now() + 7 * 86_400_000);
  const assignment = await db.assignment.create({
    data: {
      title: "Critical review: AI and academic integrity",
      instructions:
        "Write a 1,500-word critical review of how machine learning is changing academic integrity enforcement in higher education. Engage with at least five peer-reviewed sources, state a clear position, and use the department's citation style consistently.",
      courseId: course.id,
      createdById: lecturer.id,
      dueAt,
      maxMarks: 100,
      similarityThreshold: 30,
      allowLate: true,
      peerReviewEnabled: true,
      reviewersPerStudent: 2,
      reviewDueAt: new Date(Date.now() + 14 * 86_400_000),
      rubricId: rubric.id,
    },
  });

  // Text-only submissions: the processing pipeline reads extractedText, so the
  // demo does not need real files on disk.
  const texts = [ORIGINAL, PARAPHRASE, DISTINCT];
  for (let i = 0; i < texts.length; i++) {
    await db.submission.create({
      data: {
        assignmentId: assignment.id,
        studentId: students[i].id,
        version: 1,
        isLatest: true,
        fileName: `review-${i + 1}.txt`,
        fileType: "txt",
        fileSize: Buffer.byteLength(texts[i]),
        storageKey: `seed/review-${i + 1}.txt`,
        extractedText: texts[i],
        wordCount: texts[i].split(/\s+/).length,
        status: "PENDING",
      },
    });
  }

  await db.notification.create({
    data: {
      userId: students[0].id,
      type: "DEADLINE",
      title: "New assignment published",
      body: `"${assignment.title}" is due ${dueAt.toDateString()}.`,
      link: `/student/assignments/${assignment.id}`,
    },
  });

  await db.auditLog.create({
    data: { userId: admin.id, action: "SEED", detail: "Demo data created" },
  });

  console.log(`
Seed complete.

  Admin     admin@university.edu      / ${PASSWORD}
  Lecturer  lecturer@university.edu   / ${PASSWORD}
  Student   chidi@university.edu      / ${PASSWORD}
            amara@university.edu      / ${PASSWORD}   (paraphrase of Chidi's)
            tunde@university.edu      / ${PASSWORD}
            ngozi@university.edu      / ${PASSWORD}   (no submission yet)

Three submissions are seeded but not yet analysed. Run:
  npm run db:analyze
to embed them and generate similarity + writing reports.
`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
