import { PrismaClient } from "@prisma/client";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();

type MissionPackage = { contentPackageVersion: number; projects: any[] };

const sourcePath = path.resolve(__dirname, "../content/nextess_missions(4).json");

function mimeType(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  return ({
    ".txt": "text/plain", ".csv": "text/csv", ".json": "application/json",
    ".html": "text/html", ".svg": "image/svg+xml", ".png": "image/png",
    ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".pdf": "application/pdf"
  } as Record<string, string>)[ext] ?? "application/octet-stream";
}

function displayMode(fileType: string): string {
  if (fileType === "data") return "dataset";
  if (fileType === "diagram") return "prose";
  if (fileType === "concept_brief") return "prose";
  return "report";
}

function checksum(value: unknown): string {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function estimatedMinutes(value: unknown): number | null {
  const match = String(value ?? "").match(/(\d+)\s*(?:-|–)\s*(\d+)/);
  return match ? Number(match[2]) : null;
}

async function main() {
  const pkg = JSON.parse(fs.readFileSync(sourcePath, "utf8")) as MissionPackage;

  const subjects = [
    { key: "PHYSICS", displayName: "Physics", status: "ACTIVE" as const, ordering: 1 },
    { key: "ECONOMICS", displayName: "Economics", status: "ACTIVE" as const, ordering: 2 },
    { key: "CHEMISTRY", displayName: "Physical & Synthetic Chemistry", status: "FUTURE" as const, ordering: 3 },
    { key: "BIOLOGY", displayName: "Evolutionary Biology", status: "FUTURE" as const, ordering: 4 },
    { key: "GEOGRAPHY", displayName: "Geography", status: "FUTURE" as const, ordering: 5 },
    { key: "HISTORY", displayName: "History", status: "FUTURE" as const, ordering: 6 }
  ];

  const subjectMap = new Map<string, string>();
  for (const subject of subjects) {
    const row = await prisma.subject.upsert({
      where: { key: subject.key },
      update: { displayName: subject.displayName, status: subject.status, ordering: subject.ordering },
      create: subject
    });
    subjectMap.set(subject.key.toLowerCase(), row.id);\n    subjectMap.set(subject.displayName.toLowerCase(), row.id);
  }

  for (const mission of pkg.projects) {
    const subjectId = subjectMap.get(String(mission.subject).toLowerCase());
    if (!subjectId) throw new Error(`Unknown subject: ${mission.subject}`);

    const project = await prisma.project.upsert({
      where: { slug: mission.key },
      update: {
        subjectId,
        title: mission.title,
        mission: mission.mission,
        role: mission.role ?? null,
        priority: mission.priority ?? null,
        problemType: mission.problemType ?? null,
        estimatedLengthMinutes: estimatedMinutes(mission.estimatedLength),
        status: "PUBLISHED",
        anonymousAccess: true
      },
      create: {
        subjectId,
        slug: mission.key,
        title: mission.title,
        mission: mission.mission,
        role: mission.role ?? null,
        priority: mission.priority ?? null,
        problemType: mission.problemType ?? null,
        estimatedLengthMinutes: estimatedMinutes(mission.estimatedLength),
        status: "PUBLISHED",
        anonymousAccess: true
      }
    });

    const contentChecksum = checksum(mission);
    const version = await prisma.projectVersion.upsert({
      where: { projectId_version: { projectId: project.id, version: mission.version ?? 1 } },
      update: {
        status: "PUBLISHED",
        contentChecksum,
        contentMetadata: {
          difficulty: mission.difficulty ?? null,
          estimatedLength: mission.estimatedLength ?? null,
          learningCapsule: mission.learningCapsule ?? null,
          requiredEvidence: mission.requiredEvidence ?? null,
          requiredSimulation: mission.requiredSimulation ?? null
        },
        publishedAt: new Date()
      },
      create: {
        projectId: project.id,
        version: mission.version ?? 1,
        status: "PUBLISHED",
        contentChecksum,
        contentMetadata: {
          difficulty: mission.difficulty ?? null,
          estimatedLength: mission.estimatedLength ?? null,
          learningCapsule: mission.learningCapsule ?? null,
          requiredEvidence: mission.requiredEvidence ?? null,
          requiredSimulation: mission.requiredSimulation ?? null
        },
        publishedAt: new Date()
      }
    });

    await prisma.simulationDefinition.deleteMany({ where: { key: { startsWith: `${mission.key}.level-` } } });
    await prisma.caseFile.deleteMany({ where: { projectVersionId: version.id } });
    await prisma.level.deleteMany({ where: { projectVersionId: version.id } });

    await prisma.project.update({
      where: { id: project.id },
      data: { currentPublishedVersionId: version.id }
    });

    for (const [index, resource] of (mission.requiredEvidence?.files ?? []).entries()) {
      await prisma.caseFile.create({
        data: {
          projectVersionId: version.id,
          name: resource.fileName,
          mimeType: mimeType(resource.fileName),
          content: resource.content ?? null,
          storageKey: `mission-files/${mission.key}/${resource.fileName}`,
          displayMode: displayMode(resource.type),
          metadata: {
            type: resource.type ?? null,
            purpose: resource.purpose ?? null,
            bundleId: mission.requiredEvidence?.bundleId ?? null
          },
          ordering: index + 1
        }
      });
    }

    for (const levelData of mission.levels ?? []) {
      const simulation = mission.requiredSimulation
        ? await prisma.simulationDefinition.create({
            data: {
              key: `${mission.key}.level-${levelData.number}`,
              version: mission.version ?? 1,
              rendererKey: "mission-file",
              purpose: mission.requiredSimulation.description,
              frontendNotes: mission.requiredSimulation.integrationComment ?? null,
              configuration: {
                fileName: mission.requiredSimulation.fileName,
                description: mission.requiredSimulation.description,
                required: true
              },
              assets: {
                create: {
                  assetType: "INTERACTIVE_SIMULATION",
                  storageKey: `simulations/${mission.key}/v${mission.version ?? 1}/${mission.requiredSimulation.fileName}`,
                  status: "PLACEHOLDER",
                  mimeType: "text/html"
                }
              }
            }
          })
        : null;

      const level = await prisma.level.create({
        data: {
          projectVersionId: version.id,
          levelNumber: levelData.number,
          title: levelData.title,
          learningObjectives: levelData.learningObjectives ?? null,
          completionRules: { requiredQuestions: (levelData.questions ?? []).length },
          debrief: {
            evidenceUse: levelData.evidenceUse ?? null,
            simulationUse: levelData.simulationUse ?? null
          },
          simulationDefinitionId: simulation?.id ?? null,
          rewardXp: levelData.number === (mission.levels ?? []).length ? 20 : 5,
          rewardCoins: levelData.number === (mission.levels ?? []).length ? 10 : 2
        }
      });

      for (const [index, q] of (levelData.questions ?? []).entries()) {
        const answer = q.answer;
        const question = await prisma.question.create({
          data: {
            levelId: level.id,
            questionNumber: q.number ?? index + 1,
            questionType: q.type,
            prompt: q.prompt,
            inputSchema: {
              unit: q.unit ?? null,
              tolerance: q.tolerance ?? null,
              hasOptions: Array.isArray(q.options) && q.options.length > 0
            },
            evaluationDefinition: {
              answer,
              tolerance: q.tolerance ?? null
            },
            consequenceDefinition: {},
            explanation: q.explanation ?? null,
            ordering: q.number ?? index + 1,
            options: {
              create: (q.options ?? []).map((option: string, optionIndex: number) => ({
                optionKey: String.fromCharCode(65 + optionIndex),
                optionText: option,
                evaluationData: { value: option }
              }))
            },
            hints: {
              create: (q.hints ?? []).map((hint: string, hintIndex: number) => ({
                level: hintIndex + 1,
                text: hint,
                xpCost: 0,
                coinCost: 0
              }))
            },
            rules: {
              create: {
                ruleKey: `mission-${mission.key}-level-${levelData.number}-question-${q.number ?? index + 1}`,
                evaluatorVersion: "v2",
                definition: { answer, tolerance: q.tolerance ?? null },
                enabled: true
              }
            }
          }
        });
        void question;
      }
    }
  }

  const badges = [
    ["streak-7", "7 Day Streak", "Maintain a qualifying learning streak for 7 days.", "STREAK"],
    ["streak-14", "14 Day Streak", "Maintain a qualifying learning streak for 14 days.", "STREAK"],
    ["perfect-mission", "Perfect Mission", "Complete a mission without an incorrect answer.", "PERFECT"],
    ["mission-complete", "Mission Complete", "Complete a Nextess mission.", "MISSION"]
  ] as const;

  for (const [key, name, description, kind] of badges) {
    await prisma.badge.upsert({
      where: { key },
      update: { name, description, kind, criteria: { key } },
      create: { key, name, description, kind, criteria: { key } }
    });
  }

  const directives = [
    ["00000000-0000-0000-0000-000000000001", "Complete one investigation", "Finish one mission investigation today.", 60, 10, 0],
    ["00000000-0000-0000-0000-000000000002", "Review one concept", "Use a saved report or completed level for review.", 40, 5, 1],
    ["00000000-0000-0000-0000-000000000003", "Run one simulation", "Change a variable and record the observed consequence.", 30, 10, 2]
  ] as const;

  for (const [id, title, description, rewardXp, rewardCoins, ordering] of directives) {
    await prisma.dailyDirective.upsert({
      where: { id },
      update: { title, description, rewardXp, rewardCoins, ordering, active: true },
      create: { id, title, description, rewardXp, rewardCoins, ordering, active: true }
    });
  }

  const quotes = [
    ["The important thing is not to stop questioning.", "Albert Einstein", "science"],
    ["The important thing is to know what is important.", "Albert Einstein", "science"],
    ["If I have seen further it is by standing on the shoulders of giants.", "Isaac Newton", "science"],
    ["To myself I seem to have been only like a boy playing on the seashore.", "Isaac Newton", "science"],
    ["Nothing in life is to be feared, it is only to be understood.", "Marie Curie", "science"],
    ["Humanity needs practical men, but humanity also needs dreamers.", "Marie Curie", "science"],
    ["Diligence is the mother of good luck.", "Benjamin Franklin", "finance"],
    ["Drive thy business; let not thy business drive thee.", "Benjamin Franklin", "finance"],
    ["Remember that time is money.", "Benjamin Franklin", "finance"],
    ["One today is worth two tomorrows.", "Benjamin Franklin", "finance"],
    ["Keep thy shop, and thy shop will keep thee.", "Benjamin Franklin", "finance"],
    ["God helps them that help themselves.", "Benjamin Franklin", "success"],
    ["The harder the conflict, the more glorious the triumph.", "Thomas Paine", "success"],
    ["What we obtain too cheap, we esteem too lightly.", "Thomas Paine", "success"],
    ["Society is produced by our wants, and government by our wickedness.", "Thomas Paine", "economics"],
    ["The beginning is thought to be more than half the whole.", "Aristotle", "success"],
    ["The mistake lies in the beginning.", "Aristotle", "success"],
    ["Well begun is half done.", "Aristotle", "success"],
    ["Knowledge is power.", "Francis Bacon", "science"],
    ["Reading maketh a full man; conference a ready man; and writing an exact man.", "Francis Bacon", "learning"],
    ["Nature, to be commanded, must be obeyed.", "Francis Bacon", "science"],
    ["The die is cast.", "Julius Caesar", "success"],
    ["Fortune favors the bold.", "Virgil", "success"],
    ["The greatest wealth is to live content with little.", "Plato", "finance"],
    ["He who learns but does not think, is lost.", "Confucius", "learning"],
    ["I hear and I forget. I see and I remember. I do and I understand.", "Confucius", "learning"],
    ["It does not matter how slowly you go as long as you do not stop.", "Confucius", "success"],
    ["The journey of a thousand miles begins with one step.", "Lao Tzu", "success"],
    ["A person who never made a mistake never tried anything new.", "Albert Einstein", "success"],\n    ["The best way to have a good idea is to have a lot of ideas.", "Linus Pauling", "chemistry"]
  ] as const;
  await prisma.dailyQuote.deleteMany({});
  for (const [index, [quote, source, category]] of quotes.entries()) {
    const dateKey = `2000-01-${String(index + 1).padStart(2, "0")}`;
    await prisma.dailyQuote.create({ data: { dateKey, quote, source, category } });
  }

  console.log(`Seeded ${pkg.projects.length} published missions, 6 subjects, mission metadata/resources/simulation placeholders, directives, quotes and badges.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => {
  await prisma.$disconnect();
});
