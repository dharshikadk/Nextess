import { PrismaClient } from "@prisma/client";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();

type MissionPackage = {
  contentVersion: string;
  missions: Array<any>;
};

const sourcePath = path.resolve(__dirname, "../content/nextess_10_missions.json");

function mimeType(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  return ({
    ".txt": "text/plain",
    ".csv": "text/csv",
    ".json": "application/json",
    ".html": "text/html",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".pdf": "application/pdf"
  } as Record<string, string>)[ext] ?? "application/octet-stream";
}

function displayMode(fileType: string): string {
  if (fileType === "data") return "dataset";
  if (fileType === "diagram") return "prose";
  if (fileType === "concept_brief") return "prose";
  return "report";
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function checksum(value: unknown): string {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

async function main() {
  const pkg = JSON.parse(fs.readFileSync(sourcePath, "utf8")) as MissionPackage;

  const subjects = [
    { key: "PHYSICS", displayName: "Physics", status: "ACTIVE" as const, ordering: 1 },
    { key: "ECONOMICS", displayName: "Economics", status: "ACTIVE" as const, ordering: 2 },
    { key: "CHEMISTRY", displayName: "Chemistry", status: "FUTURE" as const, ordering: 3 },
    { key: "BIOLOGY", displayName: "Biology", status: "FUTURE" as const, ordering: 4 },
    { key: "GEOGRAPHY", displayName: "Geography", status: "FUTURE" as const, ordering: 5 },
    { key: "HISTORY", displayName: "History", status: "FUTURE" as const, ordering: 6 }
  ];

  const subjectMap = new Map<string, string>();
  for (const subject of subjects) {
    const row = await prisma.subject.upsert({
      where: { key: subject.key },
      update: subject,
      create: subject
    });
    subjectMap.set(subject.displayName.toLowerCase(), row.id);
  }

  for (const mission of pkg.missions) {
    const subjectId = subjectMap.get(String(mission.subject).toLowerCase());
    if (!subjectId) throw new Error(`Unknown subject: ${mission.subject}`);

    const slug = slugify(`${mission.id}-${mission.title}`);
    const project = await prisma.project.upsert({
      where: { slug },
      update: {
        subjectId,
        title: mission.title,
        mission: mission.objective ?? mission.missionBrief,
        role: mission.role ?? null,
        priority: mission.priority ?? null,
        problemType: mission.missionType ?? null,
        estimatedLengthMinutes: mission.estimatedTimeMinutes ?? null,
        status: "PUBLISHED",
        anonymousAccess: true
      },
      create: {
        subjectId,
        slug,
        title: mission.title,
        mission: mission.objective ?? mission.missionBrief,
        role: mission.role ?? null,
        priority: mission.priority ?? null,
        problemType: mission.missionType ?? null,
        estimatedLengthMinutes: mission.estimatedTimeMinutes ?? null,
        status: "PUBLISHED",
        anonymousAccess: true
      }
    });

    const contentChecksum = checksum(mission);
    const version = await prisma.projectVersion.upsert({
      where: { projectId_version: { projectId: project.id, version: 1 } },
      update: {
        status: "PUBLISHED",
        contentChecksum,
        publishedAt: new Date()
      },
      create: {
        projectId: project.id,
        version: 1,
        status: "PUBLISHED",
        contentChecksum,
        publishedAt: new Date()
      }
    });

    await prisma.project.update({
      where: { id: project.id },
      data: { currentPublishedVersionId: version.id }
    });

    await prisma.level.deleteMany({ where: { projectVersionId: version.id } });
    await prisma.caseFile.deleteMany({ where: { projectVersionId: version.id } });

    if (mission.simulation) {
      await prisma.simulationDefinition.deleteMany({ where: { key: `${mission.id}.${mission.simulation.type}` } });
    }

    const sim = mission.simulation
      ? await prisma.simulationDefinition.create({
          data: {
            key: `${mission.id}.${mission.simulation.type}`,
            version: 1,
            rendererKey: mission.simulation.type,
            purpose: mission.simulation.purpose,
            configuration: {
              outputs: mission.simulation.outputs ?? [],
              states: mission.simulation.states ?? [],
              logic: mission.simulation.logic ?? null,
              frontend: mission.simulation.frontend ?? null
            },
            assets: {
              create: {
                assetType: "INTERACTIVE_SIMULATION",
                storageKey: `simulations/${mission.id}/v1/index.html`,
                status: "PLACEHOLDER",
                mimeType: "text/html"
              }
            },
            variables: {
              create: (mission.simulation.controls ?? []).map((control: any) => ({
                variableKey: control.id,
                label: control.label,
                valueType: Array.isArray(control.options) ? "enum" : "number",
                minValue: typeof control.min === "number" ? control.min : undefined,
                maxValue: typeof control.max === "number" ? control.max : undefined,
                stepValue: typeof control.step === "number" ? control.step : undefined,
                defaultValue: control.default,
                unit: control.unit ?? null,
                options: control.options ?? undefined
              }))
            },
            consequences: {
              create: (mission.simulation.states ?? []).map((state: string, index: number) => ({
                code: state.replace(/[^A-Za-z0-9]+/g, "_").toUpperCase(),
                label: state,
                ruleDefinition: { source: "mission-definition", state },
                ordering: index
              }))
            }
          }
        })
      : null;

    const level = await prisma.level.create({
      data: {
        projectVersionId: version.id,
        levelNumber: 1,
        title: "Mission Challenges",
        learningObjectives: mission.debrief?.concepts ?? [],
        debrief: mission.debrief ?? null,
        rewardXp: mission.xp ?? 0,
        rewardCoins: mission.coins ?? 0,
        simulationDefinitionId: sim?.id ?? null
      }
    });

    for (const [index, resource] of (mission.resources ?? []).entries()) {
      await prisma.caseFile.create({
        data: {
          projectVersionId: version.id,
          name: resource.fileName,
          mimeType: mimeType(resource.fileName),
          content: resource.content ?? null,
          displayMode: displayMode(resource.fileType),
          ordering: index + 1,
          storageKey: `mission-files/${mission.id}/${resource.fileName}`
        }
      });
    }

    for (const [index, challenge] of (mission.challenges ?? []).entries()) {
      const answer = challenge.answer ?? {};
      const question = await prisma.question.create({
        data: {
          levelId: level.id,
          questionNumber: index + 1,
          questionType: challenge.type,
          prompt: challenge.prompt,
          inputSchema: {
            answerType: answer.type ?? null,
            unit: answer.unit ?? null,
            tolerance: answer.tolerance ?? null
          },
          evaluationDefinition: {
            answer,
            insight: challenge.insight ?? null
          },
          consequenceDefinition: challenge.systemResponse
            ? { response: challenge.systemResponse }
            : null,
          explanation: challenge.systemResponse ?? null,
          ordering: index + 1,
          options: {
            create: (challenge.options ?? []).map((option: string, optionIndex: number) => ({
              optionKey: String.fromCharCode(65 + optionIndex),
              optionText: option,
              evaluationData: { imported: true }
            }))
          },
          hints: challenge.insight
            ? {
                create: {
                  level: 1,
                  text: challenge.insight,
                  xpCost: 0,
                  coinCost: 0
                }
              }
            : undefined,
          rules: {
            create: {
              ruleKey: `imported-${challenge.id}`,
              evaluatorVersion: "1.0",
              definition: answer,
              enabled: true
            }
          }
        }
      });
      void question;
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

  console.log(`Seeded ${pkg.missions.length} missions, 6 subject records, future subject placeholders, simulation placeholders, and baseline badges.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
