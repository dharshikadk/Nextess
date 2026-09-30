import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { buildDefaultStages, assertValidMissionPackage, SUPPORTED_CHALLENGE_TYPES } from "./mission-validator.js";

const packagePath=path.resolve(process.cwd(),"content/nextess_missions(4).json");
const pkg=JSON.parse(fs.readFileSync(packagePath,"utf8"));

test("canonical mission package satisfies the published mission contract",()=>{
  assert.doesNotThrow(()=>assertValidMissionPackage(pkg));
  assert.ok(pkg.projects.length>=4);
  assert.ok(pkg.projects.length<=100, "Canonical package unexpectedly exceeds the intended 100-mission verification fixture.");
  for(const mission of pkg.projects){
    const stages=buildDefaultStages(mission);
    assert.equal(stages[0].type,"brief");
    assert.equal(stages.at(-1)?.type,"completion");
    assert.equal(stages.filter((s:any)=>s.type==="level").length,mission.levels.length);
    const types=new Set(mission.levels.flatMap((level:any)=>level.questions.map((q:any)=>q.type)));
    for(const type of types)assert.ok((SUPPORTED_CHALLENGE_TYPES as readonly string[]).includes(type),type);
    for(const level of mission.levels){
      assert.ok(level.questions.length>0,mission.key);
      for(const question of level.questions){
        assert.equal(typeof question.prompt,"string");
        assert.ok(Object.prototype.hasOwnProperty.call(question,"answer"),mission.key+" "+question.number);
      }
    }
    if(mission.requiredSimulation){
      assert.equal(typeof mission.requiredSimulation.fileName,"string");
      assert.ok(mission.requiredSimulation.fileName.length>0);
    }
  }
});

test("canonical mission keys remain unique",()=>{
  const keys=pkg.projects.map((mission:any)=>mission.key);
  assert.equal(new Set(keys).size,keys.length);
});