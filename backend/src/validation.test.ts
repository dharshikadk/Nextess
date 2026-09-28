import test from 'node:test';
import assert from 'node:assert/strict';
import {validateUuid,validateObject} from './validation.js';

test('UUID validation accepts canonical UUIDs and rejects malformed IDs',()=>{assert.equal(validateUuid('00000000-0000-4000-8000-000000000000'),true);assert.equal(validateUuid('not-a-uuid'),false);});
test('object validation rejects arrays and primitives',()=>{assert.equal(validateObject({a:1}),true);assert.equal(validateObject([]),false);assert.equal(validateObject('x'),false);assert.equal(validateObject(null),false);});
