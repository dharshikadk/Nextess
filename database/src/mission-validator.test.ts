import test from "node:test";
import assert from "node:assert/strict";
import { buildDefaultStages, validateMissionPackage } from "./mission-validator.js";

const base = (levels: any[]) => ({ contentPackageVersion: 1, projects: [{ key:"test", subject:"physics", version:1, title:"Test", mission:"Test mission", levels }] });

test("accepts structurally different valid missions", () => {
  const missions = [
    base([{number:1,title:"A",questions:[{number:1,type:"numerical",prompt:"x?",answer:1}]}]),
    base(Array.from({length:8},(_,i)=>({number:i+1,title:`L${i+1}`,questions:[{number:1,type:"structured-choice",prompt:"x?",options:["A","B"],answer:"A"}]}))),
    base([{number:1,title:"Mixed",questions:[{number:1,type:"data-analysis",prompt:"x?",options:["A"],answer:"A"},{number:2,type:"what-if",prompt:"x?",answer:"A"}]}])
  ];
  for (const pkg of missions) assert.deepEqual(validateMissionPackage(pkg), []);
});

test("rejects duplicate and out-of-order structure", () => {
  const issues = validateMissionPackage(base([
    {number:1,title:"A",questions:[{number:1,type:"numerical",prompt:"x?",answer:1}]},
    {number:1,title:"B",questions:[{number:1,type:"future",prompt:"x?"}]}
  ]));
  assert.ok(issues.some(x=>x.message.includes("Duplicate level number")));
  assert.ok(issues.some(x=>x.message.includes("strictly ordered")));
  assert.ok(issues.some(x=>x.message.includes("Unsupported challenge type")));
});

test("default stages are derived from mission data", () => {
  const stages = buildDefaultStages(base([{number:1,title:"A",questions:[{number:1,type:"numerical",prompt:"x?",answer:1}] }]).projects[0]);
  assert.deepEqual(stages.map(x=>x.type), ["brief","learning-capsule","level","completion"]);
});