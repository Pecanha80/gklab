import type { WellnessLog } from '../types';

export interface WellnessStats {
  avgScore: number;
  readinessPercent: number;
  alertCount: number;
}

export type ScoreColor = 'emerald' | 'amber' | 'red' | 'gray';

export function computeWellnessStats(logs: WellnessLog[]): WellnessStats {
  if (logs.length === 0) {
    return { avgScore: 0, readinessPercent: 0, alertCount: 0 };
  }

  const sum = logs.reduce((acc, log) => acc + log.score, 0);
  const avgScore = Math.round((sum / logs.length) * 10) / 10;
  const readinessPercent = Math.round(avgScore * 20);
  const alertCount = logs.filter(l => l.score < 3).length;

  return { avgScore, readinessPercent, alertCount };
}

export function getLatestLog(logs: WellnessLog[], goalkeeperId: string): WellnessLog | undefined {
  const gkLogs = logs.filter(l => l.goalkeeper_id === goalkeeperId);
  if (gkLogs.length === 0) return undefined;

  return gkLogs.reduce((latest, log) =>
    log.date > latest.date ? log : latest
  );
}

export function getScoreBorderColor(score: number | undefined): ScoreColor {
  if (score === undefined) return 'gray';
  if (score >= 4) return 'emerald';
  if (score >= 3) return 'amber';
  return 'red';
}

export function filterLogsByPeriod(logs: WellnessLog[], days: number, today?: Date): WellnessLog[] {
  const ref = today || new Date();
  const cutoff = new Date(ref);
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  return logs.filter(l => l.date >= cutoffStr);
}

export function computeScore(sleep: number, stress: number, fatigue: number, soreness: number, mood: number): number {
  return Math.round(((sleep + stress + fatigue + soreness + mood) / 5) * 10) / 10;
}
