import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {hashPassword,verifyPassword} from './password.js';

test('passwords use memory-hard scrypt hashes',()=>{
  const hash=hashPassword('CorrectHorseBatteryStaple');
  assert.match(hash,/^scrypt\$16384\$8\$1\$/);
  assert.equal(verifyPassword('CorrectHorseBatteryStaple',hash).valid,true);
  assert.equal(verifyPassword('wrong-password',hash).valid,false);
  assert.equal(verifyPassword('CorrectHorseBatteryStaple',hash).needsUpgrade,false);
});

test('legacy password hashes verify once and request upgrade',()=>{
  const salt=crypto.randomBytes(16).toString('hex');
  const digest=crypto.createHash('sha256').update(salt+':LegacyPassword123').digest('hex');
  const result=verifyPassword('LegacyPassword123',salt+'$'+digest);
  assert.deepEqual(result,{valid:true,needsUpgrade:true});
  assert.equal(verifyPassword('wrong',salt+'$'+digest).valid,false);
});

test('malformed password hashes never throw',()=>{
  assert.deepEqual(verifyPassword('anything','not-a-valid-hash'),{valid:false,needsUpgrade:false});
  assert.deepEqual(verifyPassword('anything','scrypt$1$1$1$x$y'),{valid:false,needsUpgrade:false});
});
