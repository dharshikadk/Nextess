export const SUPPORTED_CHALLENGE_TYPES = [
  "structured-choice",
  "numerical",
  "what-if",
  "data-analysis",
  "quantitative-investigation",
  "engineering-decision",
  "decision"
] as const;

export type ValidationIssue = { path: string; message: string };

const hasOwn = (v: unknown, key: string) =>
  !!v && typeof v === "object" && Object.prototype.hasOwnProperty.call(v, key);

const isRecord = (v: unknown): v is Record<string, any> =>
  !!v && typeof v === "object" && !Array.isArray(v);

const isPositiveInt = (v: unknown): v is number =>
  typeof v === "number" && Number.isInteger(v) && v > 0;

export function validateMissionPackage(pkg: any): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!isRecord(pkg)) return [{ path: "$", message: "Package must be an object." }];
  if (!isPositiveInt(pkg.contentPackageVersion))
    issues.push({ path: "contentPackageVersion", message: "Must be a positive integer." });
  if (!Array.isArray(pkg.projects) || pkg.projects.length === 0)
    return [...issues, { path: "projects", message: "Must contain at least one mission." }];

  const keys = new Set<string>();
  for (let i = 0; i < pkg.projects.length; i++) {
    const mission = pkg.projects[i];
    const path = `projects[${i}]`;
    if (!isRecord(mission)) { issues.push({ path, message: "Mission must be an object." }); continue; }
    for (const field of ["key","subject","title","mission"]) {
      if (typeof mission[field] !== "string" || !mission[field].trim())
        issues.push({ path: `${path}.${field}`, message: "Required non-empty string." });
    }
    if (!isPositiveInt(mission.version)) issues.push({ path: `${path}.version`, message: "Must be a positive integer." });
    if (keys.has(mission.key)) issues.push({ path: `${path}.key`, message: "Duplicate mission key." });
    keys.add(mission.key);
    if (!Array.isArray(mission.levels) || mission.levels.length === 0) {
      issues.push({ path: `${path}.levels`, message: "Must contain at least one level." });
      continue;
    }
    const levelNumbers = new Set<number>();
    let previous = 0;
    mission.levels.forEach((level: any, li: number) => {
      const lp = `${path}.levels[${li}]`;
      if (!isPositiveInt(level?.number)) issues.push({ path: `${lp}.number`, message: "Must be a positive integer." });
      if (levelNumbers.has(level?.number)) issues.push({ path: `${lp}.number`, message: "Duplicate level number." });
      if (level?.number <= previous) issues.push({ path: `${lp}.number`, message: "Levels must be strictly ordered." });
      levelNumbers.add(level?.number); previous = level?.number;
      if (typeof level?.title !== "string" || !level.title.trim()) issues.push({ path: `${lp}.title`, message: "Required non-empty string." });
      if (!Array.isArray(level?.questions) || level.questions.length === 0) {
        issues.push({ path: `${lp}.questions`, message: "Must contain at least one task." }); return;
      }
      const questionNumbers = new Set<number>();
      level.questions.forEach((q: any, qi: number) => {
        const qp = `${lp}.questions[${qi}]`;
        if (!isPositiveInt(q?.number)) issues.push({ path: `${qp}.number`, message: "Must be a positive integer." });
        if (questionNumbers.has(q?.number)) issues.push({ path: `${qp}.number`, message: "Duplicate question number." });
        questionNumbers.add(q?.number);
        if (typeof q?.type !== "string" || !q.type.trim()) issues.push({ path: `${qp}.type`, message: "Challenge type is required." });
        else if (!SUPPORTED_CHALLENGE_TYPES.includes(q.type)) issues.push({ path: `${qp}.type`, message: `Unsupported challenge type "${q.type}".` });
        if (typeof q?.prompt !== "string" || !q.prompt.trim()) issues.push({ path: `${qp}.prompt`, message: "Required non-empty string." });
        if (Array.isArray(q?.options) && q.options.length === 0) issues.push({ path: `${qp}.options`, message: "Options cannot be empty when supplied." });
        if (["structured-choice","what-if","data-analysis","quantitative-investigation","engineering-decision","decision"].includes(q?.type) &&
            !hasOwn(q, "answer")) issues.push({ path: `${qp}.answer`, message: "Deterministic challenge requires an answer contract." });
        if (q?.type === "numerical" && !hasOwn(q, "answer")) issues.push({ path: `${qp}.answer`, message: "Numerical challenge requires an answer contract." });
        if (hasOwn(q, "tolerance") && (typeof q.tolerance !== "number" || q.tolerance < 0 || !Number.isFinite(q.tolerance)))
          issues.push({ path: `${qp}.tolerance`, message: "Tolerance must be a finite non-negative number." });
        if (q?.options && (!Array.isArray(q.options) || q.options.some((x: any) => typeof x !== "string" || !x.trim())))
          issues.push({ path: `${qp}.options`, message: "Options must be non-empty strings." });
        if (q?.hints && (!Array.isArray(q.hints) || q.hints.some((x: any) => typeof x !== "string" || !x.trim())))
          issues.push({ path: `${qp}.hints`, message: "Hints must be non-empty strings." });
      });
    });
    if (mission.requiredSimulation && typeof mission.requiredSimulation.fileName !== "string")
      issues.push({ path: `${path}.requiredSimulation.fileName`, message: "Simulation fileName is required." });
    if (mission.requiredEvidence && !Array.isArray(mission.requiredEvidence.files))
      issues.push({ path: `${path}.requiredEvidence.files`, message: "Evidence files must be an array." });
  }
  return issues;
}

export function assertValidMissionPackage(pkg: any): asserts pkg is { contentPackageVersion:number; projects:any[] } {
  const issues = validateMissionPackage(pkg);
  if (issues.length) {
    const message = issues.slice(0, 25).map(x => `${x.path}: ${x.message}`).join("\n");
    throw new Error(`Mission package validation failed (${issues.length} issue(s)):\n${message}`);
  }
}

export function buildDefaultStages(mission: any) {
  const stages = [
    { key: "brief", type: "brief", order: 1, title: "Mission Brief" },
    ...(mission.learningCapsule ? [{ key: "learning-capsule", type: "learning-capsule", order: 2, title: mission.learningCapsule.title || "Learning Capsule" }] : [])
  ];
  const offset = stages.length;
  for (const level of mission.levels ?? []) {
    stages.push({ key: `level-${level.number}`, type: "level", order: offset + level.number, levelNumber: level.number, title: level.title });
  }
  stages.push({ key: "completion", type: "completion", order: stages.length + 1, title: "Mission Complete" });
  return stages;
}