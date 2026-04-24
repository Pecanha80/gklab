import type { TrainingSession } from '../types';

export interface MicrocycleSummary {
  totalDays: number;
  trainingDays: number;
  sessionsPlanned: number;
  restDays: number;
  matchDays: number;
  emptyTrainingDays: number;
}

export type IntensityLevel = 'recovery' | 'low' | 'medium' | 'high' | 'match' | 'rest';

export function computeMicrocycleSummary(
  days: string[],
  restDays: string[],
  matchDay: string | null,
  sessions: TrainingSession[]
): MicrocycleSummary {
  const totalDays = days.length;
  const restCount = days.filter(d => restDays.includes(d)).length;
  const matchCount = matchDay && days.includes(matchDay) ? 1 : 0;
  const trainingDays = totalDays - restCount - matchCount;
  const sessionsPlanned = sessions.filter(s => days.includes(s.date)).length;

  // Days that are training days (not rest, not match) AND have at least one session
  const trainingDayDates = days.filter(d => !restDays.includes(d) && d !== matchDay);
  const daysWithSessions = new Set(
    sessions.filter(s => trainingDayDates.includes(s.date)).map(s => s.date)
  );
  const emptyTrainingDays = trainingDays - daysWithSessions.size;

  return {
    totalDays,
    trainingDays,
    sessionsPlanned,
    restDays: restCount,
    matchDays: matchCount,
    emptyTrainingDays,
  };
}

export function computeMdDiff(
  dateStr: string,
  matchDay: string | null,
  days: string[]
): number | null {
  if (!matchDay) return null;
  const matchIdx = days.indexOf(matchDay);
  const dayIdx = days.indexOf(dateStr);
  if (matchIdx === -1 || dayIdx === -1) return null;
  return dayIdx - matchIdx;
}

export function suggestIntensity(mdDiff: number | null, isRest: boolean): IntensityLevel {
  if (isRest) return 'rest';
  if (mdDiff === null) return 'medium';
  if (mdDiff === 0) return 'match';
  if (mdDiff === 1) return 'recovery';
  if (mdDiff >= 2) return 'low';

  // Before match (negative values)
  if (mdDiff === -1) return 'low';
  if (mdDiff === -2) return 'medium';
  if (mdDiff === -3 || mdDiff === -4) return 'high';
  return 'medium'; // MD-5 and beyond
}
