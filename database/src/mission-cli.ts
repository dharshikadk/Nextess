import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";
import { assertValidMissionPackage, validateMissionPackage } from "./mission-validator.js";
import { importMissionFile } from "./mission-importer.js";

const prisma=new PrismaClient();
const file=process.argv[3]||path.resolve(process.cwd(),"content/nextess_missions(4).json");
const mode=process.argv[2];

async function main(){
  const pkg=JSON.parse(fs.readFileSync(path.resolve(file),"utf8"));
  if(mode==="validate"){
    const issues=validateMissionPackage(pkg);
    if(issues.length){for(const issue of issues)console.error(issue.path+": "+issue.message);process.exitCode=1;return;}
    console.log("Mission package is valid.");
    return;
  }
  if(mode==="import"||mode==="publish"){
    assertValidMissionPackage(pkg);
    const result=await importMissionFile(prisma,path.resolve(file),mode==="publish"?"publish":"draft");
    console.log(JSON.stringify({mode,missions:result.length,result},null,2));
    return;
  }
  throw new Error("Usage: npm run mission:validate -- <file> | npm run mission:import -- <file> | npm run mission:publish -- <file>");
}
main().catch(error=>{console.error(error instanceof Error?error.message:error);process.exitCode=1}).finally(()=>prisma.$disconnect());
