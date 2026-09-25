// src/data/subjects.js
export const SUBJECT_DISPLAY_NAMES = {
  Physics: "Classical & Modern Physics",
  Economics: "Quantitative Economics",
};

export function getSubjectDisplayName(subject) {
  return SUBJECT_DISPLAY_NAMES[subject] || subject;
}
