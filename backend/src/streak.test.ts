import test from "node:test";
import assert from "node:assert/strict";
import { calculateStreak } from "./streak.js";

const day=(offset:number)=>new Date(Date.UTC(2026,9,8-offset,12,0,0));

test("streak semantics cover today, yesterday and gaps",()=>{
  assert.deepEqual(calculateStreak([] ,day(0)),{streakDays:0,latestDiffDays:null,missedDays:0,atRisk:false,streakLost:false});
  assert.equal(calculateStreak([day(0)],day(0)).streakDays,1);
  assert.equal(calculateStreak([day(1)],day(0)).streakDays,1);
  assert.equal(calculateStreak([day(1)],day(0)).atRisk,true);
  assert.equal(calculateStreak([day(0),day(1)],day(0)).streakDays,2);
  assert.equal(calculateStreak([day(0),day(1),day(2)],day(0)).streakDays,3);
  assert.equal(calculateStreak([day(0),day(2)],day(0)).streakDays,1);
  assert.equal(calculateStreak([day(0),day(3)],day(0)).streakDays,1);
  assert.equal(calculateStreak([day(2)],day(0)).streakLost,true);
  assert.equal(calculateStreak([day(2)],day(0)).missedDays,2);
});

test("timezone boundary is evaluated by UTC calendar day",()=>{
  const now=new Date("2026-10-08T00:15:00+05:30");
  const yesterday=new Date("2026-10-07T23:50:00+05:30");
  assert.equal(calculateStreak([yesterday],now).streakDays,1);
  assert.equal(calculateStreak([yesterday],now).atRisk,true);
});
