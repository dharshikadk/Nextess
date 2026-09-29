import test from "node:test";
import assert from "node:assert/strict";
import { challengeEvaluatorRegistry, evaluateChallenge, EVALUATOR_VERSION, registerChallengeEvaluator } from "./evaluators.js";

test("registry contains every current challenge type",()=>{
  for(const type of ["structured-choice","numerical","what-if","data-analysis","quantitative-investigation","engineering-decision","decision"])
    assert.equal(challengeEvaluatorRegistry.has(type),true,type);
});
test("all current challenge types use the shared evaluator contract",()=>{
  for(const type of ["structured-choice","what-if","data-analysis","quantitative-investigation","engineering-decision","decision"]){
    assert.equal(evaluateChallenge({type,value:"correct",definition:{answer:"correct"}}).correct,true,type);
    assert.equal(evaluateChallenge({type,value:"wrong",definition:{answer:"correct"}}).correct,false,type);
  }
});
test("numerical challenges honor tolerance",()=>{
  assert.equal(evaluateChallenge({type:"numerical",value:6.51,definition:{answer:6.5,tolerance:.02}}).correct,true);
  assert.equal(evaluateChallenge({type:"numerical",value:6.54,definition:{answer:6.5,tolerance:.02}}).correct,false);
});
test("registry can accept a genuinely new reusable evaluator",()=>{
  registerChallengeEvaluator("test-extension",({value,definition})=>({
    correct:value===definition.answer,normalizedAnswer:value,feedback:{message:"extension"},evaluatorVersion:EVALUATOR_VERSION
  }));
  assert.equal(evaluateChallenge({type:"test-extension",value:42,definition:{answer:42}}).correct,true);
  assert.equal(challengeEvaluatorRegistry.has("test-extension"),true);
});
test("unknown types without an answer contract fail safely",()=>{
  const r=evaluateChallenge({type:"unknown-type",value:12,definition:{}});
  assert.equal(r.correct,false);
  assert.match(r.feedback.message,/No evaluator registered/);
});
test("structured answers remain deterministic",()=>{
  const definition={answer:{decision:"repair",parameters:{threshold:5,channels:["A","B"]}}};
  assert.equal(evaluateChallenge({type:"data-analysis",value:{parameters:{channels:["A","B"],threshold:5},decision:"repair"},definition}).correct,true);
  assert.equal(evaluateChallenge({type:"data-analysis",value:{parameters:{channels:["B","A"],threshold:5},decision:"repair"},definition}).correct,false);
});
