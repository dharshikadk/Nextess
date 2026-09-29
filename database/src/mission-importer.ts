import { PrismaClient } from "@prisma/client";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { assertValidMissionPackage, buildDefaultStages } from "./mission-validator.js";

export type ImportMode = "draft" | "publish";

const DEFAULT_SUBJECTS = [
  { key:"PHYSICS", displayName:"Physics", status:"ACTIVE" as const, ordering:1 },
  { key:"ECONOMICS", displayName:"Economics", status:"ACTIVE" as const, ordering:2 },
  { key:"CHEMISTRY", displayName:"Physical & Synthetic Chemistry", status:"FUTURE" as const, ordering:3 },
  { key:"BIOLOGY", displayName:"Evolutionary Biology", status:"FUTURE" as const, ordering:4 },
  { key:"GEOGRAPHY", displayName:"Geography", status:"FUTURE" as const, ordering:5 },
  { key:"HISTORY", displayName:"History", status:"FUTURE" as const, ordering:6 }
];

const checksum = (value: unknown) => crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
const estimatedMinutes = (value: unknown) => {
  const match = String(value ?? "").match(/(\d+)\s*(?:-|–)\s*(\d+)/);
  return match ? Number(match[2]) : null;
};
const mimeType = (fileName: string) => ({
  ".txt":"text/plain",".csv":"text/csv",".json":"application/json",".html":"text/html",
  ".svg":"image/svg+xml",".png":"image/png",".jpg":"image/jpeg",".jpeg":"image/jpeg",".pdf":"application/pdf"
} as Record<string,string>)[path.extname(fileName).toLowerCase()] ?? "application/octet-stream";
const displayMode = (type: string) => type === "data" ? "dataset" : type === "diagram" || type === "concept_brief" ? "prose" : "report";

function metadataFor(mission: any) {
  return {
    version: mission.version ?? 1,
    difficulty: mission.difficulty ?? null,
    estimatedLength: mission.estimatedLength ?? null,
    learningCapsule: mission.learningCapsule ?? null,
    requiredEvidence: mission.requiredEvidence ?? null,
    requiredSimulation: mission.requiredSimulation ?? null,
    stages: mission.stages?.length ? mission.stages : buildDefaultStages(mission)
  };
}

async function importMission(tx: any, mission: any, subjects: Map<string,string>, mode: ImportMode) {
  const subjectId = subjects.get(String(mission.subject).toLowerCase());
  if (!subjectId) throw new Error(`Unknown subject: ${mission.subject}`);
  const versionNumber = Number(mission.version ?? 1);
  const contentChecksum = checksum(mission);
  const existingProject = await tx.project.findUnique({where:{slug:mission.key},select:{id:true}});
  const existingVersion = existingProject
    ? await tx.projectVersion.findUnique({where:{projectId_version:{projectId:existingProject.id,version:versionNumber}}})
    : null;

  if (existingVersion?.status === "PUBLISHED") {
    if (existingVersion.contentChecksum !== contentChecksum)
      throw new Error(`Published mission ${mission.key} v${versionNumber} is immutable; checksum differs.`);
    return { projectId: existingProject!.id, versionId: existingVersion.id, reused: true };
  }
  if (existingVersion && existingVersion.contentChecksum !== contentChecksum)
    throw new Error(`Mission ${mission.key} v${versionNumber} already exists with a different checksum.`);

  const project = existingProject
    ? await tx.project.update({
        where:{id:existingProject.id},
        data:{subjectId,title:mission.title,mission:mission.mission,role:mission.role ?? null,priority:mission.priority ?? null,
          problemType:mission.problemType ?? null,estimatedLengthMinutes:estimatedMinutes(mission.estimatedLength),status:mode==="publish"?"PUBLISHED":"DRAFT"}
      })
    : await tx.project.create({
        data:{subjectId,slug:mission.key,title:mission.title,mission:mission.mission,role:mission.role ?? null,priority:mission.priority ?? null,
          problemType:mission.problemType ?? null,estimatedLengthMinutes:estimatedMinutes(mission.estimatedLength),
          status:mode==="publish"?"PUBLISHED":"DRAFT",anonymousAccess:true}
      });

  const version = existingVersion ?? await tx.projectVersion.create({
    data:{projectId:project.id,version:versionNumber,status:mode==="publish"?"PUBLISHED":"DRAFT",contentChecksum,contentMetadata:metadataFor(mission),
      publishedAt:mode==="publish"?new Date():null}
  });

  if (existingVersion) {
    await tx.projectVersion.update({where:{id:version.id},data:{contentMetadata:metadataFor(mission)}});
  }

  if (mode === "publish") {
    await tx.project.update({where:{id:project.id},data:{currentPublishedVersionId:version.id,status:"PUBLISHED"}});
  }

  if (existingVersion) {
    await tx.simulationDefinition.deleteMany({where:{key:{startsWith:`${mission.key}.level-`}}});
    await tx.caseFile.deleteMany({where:{projectVersionId:version.id}});
    await tx.level.deleteMany({where:{projectVersionId:version.id}});
  }

  {
    for (const [index, resource] of (mission.requiredEvidence?.files ?? []).entries()) {
      await tx.caseFile.create({data:{
        projectVersionId:version.id,name:resource.fileName,mimeType:mimeType(resource.fileName),content:resource.content ?? null,
        storageKey:`mission-files/${mission.key}/v${versionNumber}/${resource.fileName}`,displayMode:displayMode(resource.type),
        metadata:{type:resource.type ?? null,purpose:resource.purpose ?? null,bundleId:mission.requiredEvidence?.bundleId ?? null},ordering:index+1
      }});
    }

    for (const levelData of mission.levels ?? []) {
      const simulation = mission.requiredSimulation ? await tx.simulationDefinition.create({data:{
        key:`${mission.key}.level-${levelData.number}`,version:versionNumber,rendererKey:"mission-file",
        purpose:mission.requiredSimulation.description,frontendNotes:mission.requiredSimulation.integrationComment ?? null,
        configuration:{fileName:mission.requiredSimulation.fileName,description:mission.requiredSimulation.description,required:true},
        assets:{create:{assetType:"INTERACTIVE_SIMULATION",storageKey:`simulations/${mission.key}/v${versionNumber}/${mission.requiredSimulation.fileName}`,status:"PLACEHOLDER",mimeType:"text/html"}}
      }}) : null;

      const level = await tx.level.create({data:{
        projectVersionId:version.id,levelNumber:levelData.number,title:levelData.title,
        learningObjectives:levelData.learningObjectives ?? null,completionRules:{requiredQuestions:(levelData.questions ?? []).length},
        debrief:{evidenceUse:levelData.evidenceUse ?? null,simulationUse:levelData.simulationUse ?? null},
        simulationDefinitionId:simulation?.id ?? null,rewardXp:levelData.number===mission.levels.length?20:5,rewardCoins:levelData.number===mission.levels.length?10:2
      }});

      for (const [index,q] of (levelData.questions ?? []).entries()) {
        await tx.question.create({data:{
          levelId:level.id,questionNumber:q.number ?? index+1,questionType:q.type,prompt:q.prompt,
          inputSchema:{unit:q.unit ?? null,tolerance:q.tolerance ?? null,hasOptions:Array.isArray(q.options)&&q.options.length>0},
          evaluationDefinition:{answer:q.answer,tolerance:q.tolerance ?? null},consequenceDefinition:{},explanation:q.explanation ?? null,ordering:q.number ?? index+1,
          options:{create:(q.options ?? []).map((option:string,oi:number)=>({optionKey:String.fromCharCode(65+oi),optionText:option,evaluationData:{value:option}}))},
          hints:{create:(q.hints ?? []).map((hint:string,hi:number)=>({level:hi+1,text:hint,xpCost:0,coinCost:0}))},
          rules:{create:{ruleKey:`mission-${mission.key}-level-${levelData.number}-question-${q.number ?? index+1}`,evaluatorVersion:"v3",definition:{answer:q.answer,tolerance:q.tolerance ?? null},enabled:true}}
        }});
      }
    }
  }
  return {projectId:project.id,versionId:version.id,reused:false};
}

export async function importMissionPackage(prisma: PrismaClient, pkg: any, mode: ImportMode = "draft") {
  assertValidMissionPackage(pkg);
  return prisma.$transaction(async tx => {
    const subjectMap = new Map<string,string>();
    for (const subject of DEFAULT_SUBJECTS) {
      const row = await tx.subject.upsert({where:{key:subject.key},update:{displayName:subject.displayName,status:subject.status,ordering:subject.ordering},create:subject});
      subjectMap.set(subject.key.toLowerCase(),row.id);
      subjectMap.set(subject.displayName.toLowerCase(),row.id);
    }
    const results = [];
    for (const mission of pkg.projects) results.push(await importMission(tx,mission,subjectMap,mode));
    return results;
  });
}

export async function importMissionFile(prisma: PrismaClient, filePath: string, mode: ImportMode = "draft") {
  const absolute = path.resolve(filePath);
  const pkg = JSON.parse(fs.readFileSync(absolute,"utf8"));
  return importMissionPackage(prisma,pkg,mode);
}
