import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateChallenge} from './evaluators.js';

test('all current challenge types use the shared evaluator contract',()=>{
  const types=['structured-choice','what-if','data-analysis','quantitative-investigation','engineering-decision','decision'];
  for(const type of types){
    assert.equal(evaluateChallenge({type,value:'correct',definition:{answer:'correct'}}).correct,true,type);
    assert.equal(evaluateChallenge({type,value:'wrong',definition:{answer:'correct'}}).correct,false,type);
  }
});

test('numerical challenges honor tolerance',()=>{
  assert.equal(evaluateChallenge({type:'numerical',value:6.51,definition:{answer:6.5,tolerance:0.02}}).correct,true);
  assert.equal(evaluateChallenge({type:'numerical',value:6.54,definition:{answer:6.5,tolerance:0.02}}).correct,false);
});

test('text evaluation is normalized without exposing answer data',()=>{
  const result=evaluateChallenge({type:'structured-choice',value:'  YES ',definition:{answer:'yes'}});
  assert.equal(result.correct,true);
  assert.equal(result.evaluatorVersion,'v3');
  assert.deepEqual(result.normalizedAnswer,'yes');
});

test('unknown challenge types remain deterministic when an answer contract exists',()=>{
  assert.equal(evaluateChallenge({type:'future-type',value:12,definition:{answer:12}}).correct,true);
  assert.equal(evaluateChallenge({type:'future-type',value:11,definition:{answer:12}}).correct,false);
});
