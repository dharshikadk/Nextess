import test from 'node:test';
import assert from 'node:assert/strict';
import {validateUuid,validateObject,validateString} from './validation.js';
test('validates UUIDs',()=>{assert.equal(validateUuid('00000000-0000-4000-8000-000000000000'),true);assert.equal(validateUuid('bad-id'),false);});
test('validates objects',()=>{assert.equal(validateObject({a:1}),true);assert.equal(validateObject([]),false);assert.equal(validateObject(null),false);});
test('validates bounded strings',()=>{assert.equal(validateString('hello',1,5),true);assert.equal(validateString('abcdef',1,5),false);assert.equal(validateString(5,1,5),false);});
