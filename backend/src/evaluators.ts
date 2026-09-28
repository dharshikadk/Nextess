export interface ChallengeEvaluationDefinition {
  answer?: unknown;
  tolerance?: number;
  [key: string]: unknown;
}

export interface ChallengeEvaluationInput {
  type: string;
  value: unknown;
  definition: ChallengeEvaluationDefinition;
}

export interface ChallengeEvaluationResult {
  correct: boolean;
  normalizedAnswer: unknown;
  feedback: { message: string };
  evaluatorVersion: string;
}

const VERSION = 'v3';

const normalizeText = (value: unknown): string =>
  String(value ?? '').trim().toLocaleLowerCase();

const normalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(normalize);
  if (typeof value === 'string') return normalizeText(value);
  return value;
};

const equal = (a: unknown, b: unknown): boolean => {
  const na = normalize(a);
  const nb = normalize(b);
  if (Array.isArray(na) && Array.isArray(nb)) {
    return na.length === nb.length && na.every((v, i) => equal(v, nb[i]));
  }
  return na === nb;
};

const numerical = (value: unknown, expected: unknown, tolerance: unknown): boolean => {
  const actual = Number(value);
  const target = Number(expected);
  if (!Number.isFinite(actual) || !Number.isFinite(target)) return false;
  const allowed = Number.isFinite(Number(tolerance)) ? Number(tolerance) : 0;
  return Math.abs(actual - target) <= Math.max(0, allowed);
};

export function evaluateChallenge(input: ChallengeEvaluationInput): ChallengeEvaluationResult {
  const { type, value, definition } = input;
  const expected = definition.answer;
  const normalizedAnswer = normalize(value);

  if (type === 'numerical') {
    const correct = numerical(value, expected, definition.tolerance);
    return {
      correct,
      normalizedAnswer,
      feedback: { message: correct ? 'Correct.' : 'Not correct. Try again.' },
      evaluatorVersion: VERSION,
    };
  }

  const deterministicTypes = new Set([
    'structured-choice',
    'what-if',
    'data-analysis',
    'quantitative-investigation',
    'engineering-decision',
    'decision',
  ]);

  if (deterministicTypes.has(type)) {
    const correct = equal(value, expected);
    return {
      correct,
      normalizedAnswer,
      feedback: { message: correct ? 'Correct.' : 'Not correct. Try again.' },
      evaluatorVersion: VERSION,
    };
  }

  if (expected !== undefined) {
    const correct = typeof expected === 'number'
      ? numerical(value, expected, definition.tolerance)
      : equal(value, expected);
    return {
      correct,
      normalizedAnswer,
      feedback: { message: correct ? 'Correct.' : 'Not correct. Try again.' },
      evaluatorVersion: VERSION,
    };
  }

  return {
    correct: false,
    normalizedAnswer,
    feedback: { message: `No evaluator answer contract is configured for challenge type "${type}".` },
    evaluatorVersion: VERSION,
  };
}
