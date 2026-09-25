// src/services/api.js
//
// React Components -> this service layer -> Backend API (Section 57 of the
// frontend spec). No component should import fetch/axios directly, and
// nothing here talks to Postgres/Prisma directly.
//
// Right now these functions resolve local demo data (src/data/*) so the UI
// can be built and reviewed before the real backend endpoints exist. Each
// function documents the endpoint it should call once the contract is
// confirmed with the backend/database owners (Section 62, Source-of-Truth
// Rule) — swap the body, keep the signature, and every component that
// consumes it keeps working unchanged.

import guestSession from "../data/session";
import { getMissionsBySubject, getAvailableSubjects, getActiveMission } from "../data/missions";

const SIMULATED_LATENCY_MS = 250;

function resolveAfterDelay(value) {
  return new Promise((resolve) => setTimeout(() => resolve(value), SIMULATED_LATENCY_MS));
}

// GET /api/session/me
export function fetchSession() {
  return resolveAfterDelay(guestSession);
}

// GET /api/missions/active  (the "Active Lab Chamber" resume card)
export function fetchActiveMission() {
  return resolveAfterDelay(getActiveMission());
}

// GET /api/subjects
export function fetchSubjects() {
  return resolveAfterDelay(getAvailableSubjects());
}

// GET /api/missions?subject=Physics
export function fetchMissionsBySubject(subject) {
  return resolveAfterDelay(getMissionsBySubject(subject));
}
