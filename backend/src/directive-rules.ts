export type DirectiveCondition = 'INVESTIGATION_COMPLETED' | 'LEVEL_REVIEWED' | 'SIMULATION_CHANGED';

export const DIRECTIVE_CONDITIONS: Record<string, DirectiveCondition> = {
  '00000000-0000-0000-0000-000000000001': 'INVESTIGATION_COMPLETED',
  '00000000-0000-0000-0000-000000000002': 'LEVEL_REVIEWED',
  '00000000-0000-0000-0000-000000000003': 'SIMULATION_CHANGED',
};

export function directiveCondition(directiveId: string): DirectiveCondition | null {
  return DIRECTIVE_CONDITIONS[directiveId] || null;
}

export function dayRange(day: Date) {
  const end = new Date(day);
  end.setUTCDate(end.getUTCDate() + 1);
  return { gte: day, lt: end };
}
