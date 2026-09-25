// src/data/enrollment.js
//
// New requirement: a user must enroll in a subject before solving its
// missions. This is not yet in the backend contract (Section 62 —
// source-of-truth rule: this is a frontend-only placeholder, flagged here
// so it's obvious it needs a real `/api/enrollments` endpoint later).
//
// Generic by design: keyed by subject name only, so enrolling in a brand
// new subject (Chemistry, Biology, ...) needs no new code path — this is
// the "same rule/structure for any subject" requirement.

import { useEffect, useState, useCallback } from "react";

const STORAGE_KEY = "nextess:enrolled-subjects";

function readEnrolled() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeEnrolled(list) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function useEnrollment() {
  const [enrolled, setEnrolled] = useState(readEnrolled);

  useEffect(() => {
    writeEnrolled(enrolled);
  }, [enrolled]);

  const isEnrolled = useCallback((subject) => enrolled.includes(subject), [enrolled]);

  const enroll = useCallback((subject) => {
    setEnrolled((prev) => (prev.includes(subject) ? prev : [...prev, subject]));
  }, []);

  return { enrolled, isEnrolled, enroll };
}
