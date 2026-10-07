import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";
import { assertValidMissionPackage, validateMissionPackage, validateMissionPublishReadiness } from "./mission-validator.js";
import { importMissionFile } from "./mission-importer.js";

const prisma=new PrismaClient();
const input=process.argv[3]||path.resolve(process.cwd(),"content/nextess_missions(4).json");
const mode=process.argv[2];

function discoverJsonFiles(inputPath:string): string[] {
  const absolute=path.resolve(inputPath);
  if (!fs.existsSync(absolute)) throw new Error(`Content path does not exist: ${absolute}`);
  if (fs.statSync(absolute).isFile()) return [absolute];
  const results:string[]=[];
  const walk=(dir:string)=>{
    for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
      const full=path.join(dir,entry.name);
      if(entry.isDirectory()) walk(full);
      else if(entry.isFile()&&entry.name.toLowerCase().endsWith(".json")) results.push(full);
    }
  };
  walk(absolute);
  return results.sort();
}

async function main(){
  if(!["validate","import","publish"].includes(mode)) throw new Error("Usage: npm run mission:validate -- <file|directory> | npm run mission:import -- <file|directory> | npm run mission:publish -- <file|directory>");
  const files=discoverJsonFiles(input);
  if(!files.length) throw new Error(`No JSON mission packages found under ${path.resolve(input)}`);
  const results=[];
  for(const filePath of files){
    const pkg=JSON.parse(fs.readFileSync(filePath,"utf8"));
    const issues=mode==="publish"?validateMissionPublishReadiness(pkg):validateMissionPackage(pkg);
    if(issues.length){
      for(const issue of issues) console.error(`${filePath}: ${issue.path}: ${issue.message}`);
      process.exitCode=1;
      continue;
    }
    if(mode==="validate"){
      results.push({file:filePath,status:"valid"});
      continue;
    }
    assertValidMissionPackage(pkg);
    const imported=await importMissionFile(prisma,filePath,mode==="publish"?"publish":"draft");
    results.push({file:filePath,missions:imported});
  }
  console.log(JSON.stringify({mode,files:files.length,results},null,2));
  if(process.exitCode) throw new Error("One or more mission packages failed validation.");
}
main().catch(error=>{console.error(error instanceof Error?error.message:error);process.exitCode=1}).finally(()=>prisma.$disconnect());
