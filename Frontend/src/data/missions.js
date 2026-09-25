// src/data/missions.js
//
// SOURCE OF TRUTH: database/content/nextess_10_missions.json (Nextess repo)
// This module is a stand-in for what the API/service layer will eventually
// fetch from the backend (see src/services/api.js). It intentionally keeps
// the *shape* the backend already uses (id, subject, title, domain,
// difficulty, xp, coins, objective, missionBrief, resources, simulation,
// challenges) and only adds UI-only fields (status, progress, ladder) that
// the frontend needs to render the zig-zag path and mission ladder. None of
// this is hard-coded per-mission logic — it's a generic transform that will
// work for any mission object with this schema.

import rawMissions from "./raw_missions_subset.json";

// The backend does not yet return live per-user progress for these demo
// missions, so we simulate a *plausible* progress state per the product
// spec (mission 1 = active/in-progress, mission 2 = unlocked/ready). This
// mirrors what /api/missions?subject=... + /api/progress would return
// combined. Replace with a real API call in services/api.js when the
// backend contract is ready (see NEXTESS_API_CONTRACT below).
const DEMO_PROGRESS_BY_ID = {
  "PHY-001": { status: "in_progress", currentLevel: 2, totalLevels: 4, currentQuestion: 3, totalQuestions: 5, percent: 60 },
  "PHY-002": { status: "unlocked", currentLevel: 0, totalLevels: 4, percent: 0 },
  "ECO-001": { status: "in_progress", currentLevel: 1, totalLevels: 4, currentQuestion: 2, totalQuestions: 5, percent: 35 },
  "ECO-002": { status: "unlocked", currentLevel: 0, totalLevels: 4, percent: 0 },
};

// Splits the mission's real challenges into the 4-level structure the
// product spec describes (Section 15 / 19), purely for the ladder UI.
function buildLadder(mission, progress) {
  const totalLevels = progress.totalLevels || 4;
  const steps = [{ key: "capsule", label: "Capsule", sublabel: "Intro" }];
  for (let lvl = 1; lvl <= totalLevels; lvl++) {
    steps.push({ key: `level-${lvl}`, label: `Lvl ${lvl}`, sublabel: null });
  }
  return steps.map((step, idx) => {
    let state = "locked";
    if (idx === 0) state = "passed"; // capsule always completed once a mission is started
    else if (idx - 1 < progress.currentLevel) state = "passed";
    else if (idx - 1 === progress.currentLevel) state = "current";
    if (progress.status === "unlocked" && idx > 0) state = idx === 1 ? "current" : "locked";
    return { ...step, state };
  });
}

// The repo's /simulations/*.html files don't declare which mission they
// belong to. ECO-001's file matches its price/demand/revenue mechanic
// closely. The other three files are same-subject but a different scenario
// than the mission's own JSON (e.g. PHY-001 is a circuit, not braking) —
// they're mapped here as the closest available asset per mission slot
// rather than left unused, but this is flagged so it isn't mistaken for a
// verified 1:1 content match. Swap these out once mission-specific
// simulation files exist.
const SIMULATION_FILE_BY_ID = {
  "ECO-001": { file: "/simulations/mission-01-canteen-revenue.html", verifiedMatch: true },
  "ECO-002": { file: "/simulations/mission-02-bus-fare-demand.html", verifiedMatch: false },
  "PHY-001": { file: "/simulations/mission-03-bicycle-braking.html", verifiedMatch: false },
  "PHY-002": { file: "/simulations/mission-04-solar-panel-angle.html", verifiedMatch: false },
};

function transform(mission) {
  const progress = DEMO_PROGRESS_BY_ID[mission.id] || { status: "sealed", currentLevel: 0, totalLevels: 4, percent: 0 };
  return {
    id: mission.id,
    subject: mission.subject,
    title: mission.title,
    domain: mission.domain,
    difficulty: mission.difficulty,
    estimatedTimeMinutes: mission.estimatedTimeMinutes,
    kp: mission.xp,
    coins: mission.coins,
    objective: mission.objective,
    missionBrief: mission.missionBrief,
    resources: mission.resources,
    simulationType: mission.simulation?.type,
    simulationAsset: SIMULATION_FILE_BY_ID[mission.id] || null,
    challengeCount: mission.challenges?.length || 0,
    challengeTypes: (mission.challenges || []).map((c) => c.type),
    status: progress.status, // "in_progress" | "unlocked" | "sealed"
    progressPercent: progress.percent,
    currentLevel: progress.currentLevel,
    totalLevels: progress.totalLevels,
    currentQuestion: progress.currentQuestion,
    totalQuestions: progress.totalQuestions,
    ladder: buildLadder(mission, progress),
  };
}

const ALL_MISSIONS = rawMissions.map(transform);

export function getMissionsBySubject(subject) {
  return ALL_MISSIONS.filter((m) => m.subject.toLowerCase() === subject.toLowerCase());
}

export function getAvailableSubjects() {
  return Array.from(new Set(ALL_MISSIONS.map((m) => m.subject)));
}

export function getActiveMission() {
  // "Active Lab Chamber" card on the dashboard = the mission with status
  // in_progress and the highest progress (mirrors what the backend's
  // /api/progress/active-mission endpoint would return).
  return ALL_MISSIONS.filter((m) => m.status === "in_progress").sort(
    (a, b) => b.progressPercent - a.progressPercent
  )[0];
}

export default ALL_MISSIONS;
