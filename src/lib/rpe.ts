import type { Attendance, TrainingSession } from '../types';

export interface SessionWithLoad {
  session: TrainingSession;
  avgRpe: number;
  durationMin: number;
  load: number;
  attendanceCount: number;
}

export interface RpeStats {
  avgIntensity: number;
  totalLoad: number;
}

export interface IntensityDistribution {
  veryHigh: number;
  high: number;
  moderate: number;
  recovery: number;
}

export interface DayLoad {
  label: string;
  load: number;
  pct: number;
}

export type TeamStatusLevel = 'none' | 'fresh' | 'ideal' | 'moderate' | 'high';

const DAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

function formatDateLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseDuration(dur: unknown): number {
  if (!dur) return 0;
  const str = Array.isArray(dur) ? dur[0] : String(dur);
  const match = String(str).match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

export function computeSessionLoad(avgRpe: number, durationMin: number): number {
  return Math.round(avgRpe * durationMin);
}

export function getTeamStatusLevel(avgIntensity: number): TeamStatusLevel {
  if (avgIntensity === 0) return 'none';
  if (avgIntensity <= 3) return 'fresh';
  if (avgIntensity <= 5) return 'ideal';
  if (avgIntensity <= 7) return 'moderate';
  return 'high';
}

export function computeWeeklyLoads(sessionsWithLoad: SessionWithLoad[], weekStartDate?: Date): DayLoad[] {
  const loads = new Array(7).fill(0);

  if (weekStartDate) {
    const weekStart = new Date(weekStartDate);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const startStr = formatDateLocal(weekStart);
    const endStr = formatDateLocal(weekEnd);

    sessionsWithLoad.forEach(sw => {
      if (!sw.session.date || sw.load === 0) return;
      if (sw.session.date < startStr || sw.session.date >= endStr) return;
      const date = new Date(sw.session.date + 'T12:00:00');
      if (!isNaN(date.getTime())) {
        loads[date.getDay()] += sw.load;
      }
    });
  } else {
    sessionsWithLoad.forEach(sw => {
      if (!sw.session.date || sw.load === 0) return;
      const date = new Date(sw.session.date + 'T12:00:00');
      if (!isNaN(date.getTime())) {
        loads[date.getDay()] += sw.load;
      }
    });
  }

  const maxLoad = Math.max(...loads, 1);
  return loads.map((load, i) => ({
    label: DAY_LABELS[i],
    load,
    pct: Math.round((load / maxLoad) * 100),
  }));
}

export function computeIntensityDistribution(rpeValues: number[]): IntensityDistribution {
  const total = rpeValues.length;
  if (total === 0) return { veryHigh: 0, high: 0, moderate: 0, recovery: 0 };

  const veryHigh = rpeValues.filter(v => v >= 9).length;
  const high = rpeValues.filter(v => v >= 7 && v <= 8).length;
  const moderate = rpeValues.filter(v => v >= 5 && v <= 6).length;
  const recovery = rpeValues.filter(v => v <= 4).length;

  return {
    veryHigh: Math.round((veryHigh / total) * 100),
    high: Math.round((high / total) * 100),
    moderate: Math.round((moderate / total) * 100),
    recovery: Math.round((recovery / total) * 100),
  };
}

export function computeRpeStats(sessionsWithLoad: SessionWithLoad[], allAttendance: Attendance[]): RpeStats {
  const withData = sessionsWithLoad.filter(s => s.avgRpe > 0);
  if (withData.length === 0) return { avgIntensity: 0, totalLoad: 0 };

  const rpeRecords = allAttendance.filter(a => a.rpe != null && a.rpe > 0);
  const avgIntensity = rpeRecords.length > 0
    ? rpeRecords.reduce((sum, a) => sum + a.rpe!, 0) / rpeRecords.length
    : 0;
  const totalLoad = withData.reduce((sum, s) => sum + s.load, 0);

  return { avgIntensity, totalLoad };
}

export function buildSessionsWithLoad(sessions: TrainingSession[], allAttendance: Attendance[]): SessionWithLoad[] {
  return sessions.map(session => {
    const sessionAtt = allAttendance.filter(
      a => a.session_id === session.id && a.rpe != null && a.rpe! > 0
    );
    const rpeValues = sessionAtt.map(a => a.rpe!);
    const avgRpe = rpeValues.length > 0
      ? rpeValues.reduce((sum, v) => sum + v, 0) / rpeValues.length
      : 0;
    const durationMin = parseDuration(session.duration);
    const load = computeSessionLoad(avgRpe, durationMin);

    return { session, avgRpe, durationMin, load, attendanceCount: sessionAtt.length };
  });
}
