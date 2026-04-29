import type { TrainingSession, Exercise, Attendance, WellnessLog } from '../types';
import { parseCategory } from './dashboard';
import { parseDuration } from './rpe';

// ── Exercise Collection ─────────────────────────────────

export function collectAllExercises(sessions: TrainingSession[]): Exercise[] {
  return sessions.flatMap(s => [
    ...(s.gym || []),
    ...(s.warmup || []),
    ...(s.exercises || []),
  ]);
}

// ── Training Content Aggregation ────────────────────────

export function computeExerciseTypeDistribution(
  exercises: Exercise[],
): Array<{ type: string; count: number }> {
  if (exercises.length === 0) return [];
  const counts = new Map<string, number>();
  for (const ex of exercises) {
    counts.set(ex.type, (counts.get(ex.type) || 0) + 1);
  }
  return Array.from(counts, ([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);
}

export function computePhysicalCapacityDistribution(
  exercises: Exercise[],
): Array<{ capacity: string; count: number }> {
  const counts = new Map<string, number>();
  for (const ex of exercises) {
    if (ex.category && ex.category.trim()) {
      counts.set(ex.category, (counts.get(ex.category) || 0) + 1);
    }
  }
  return Array.from(counts, ([capacity, count]) => ({ capacity, count }))
    .sort((a, b) => b.count - a.count);
}

export function computeTopDrills(
  exercises: Exercise[],
  limit = 10,
): Array<{ title: string; count: number }> {
  const counts = new Map<string, number>();
  for (const ex of exercises) {
    if (ex.title) {
      counts.set(ex.title, (counts.get(ex.title) || 0) + 1);
    }
  }
  return Array.from(counts, ([title, count]) => ({ title, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function computeGameMomentsCoverage(
  sessions: TrainingSession[],
  exercises: Exercise[],
): Array<{ moment: string; count: number }> {
  const counts = new Map<string, number>();

  for (const s of sessions) {
    if (s.gameMoments) {
      for (const m of s.gameMoments) {
        if (m) counts.set(m, (counts.get(m) || 0) + 1);
      }
    }
  }

  for (const ex of exercises) {
    if (ex.gameMoment) {
      counts.set(ex.gameMoment, (counts.get(ex.gameMoment) || 0) + 1);
    }
  }

  if (counts.size === 0) return [];
  return Array.from(counts, ([moment, count]) => ({ moment, count }))
    .sort((a, b) => b.count - a.count);
}

export function computeObjectivesFrequency(
  sessions: TrainingSession[],
  limit = 15,
): Array<{ objective: string; count: number }> {
  const counts = new Map<string, number>();
  for (const s of sessions) {
    for (const obj of s.generalObjectives || []) {
      if (obj && !obj.startsWith('#')) {
        counts.set(obj, (counts.get(obj) || 0) + 1);
      }
    }
  }
  return Array.from(counts, ([objective, count]) => ({ objective, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function computeTacticalPrinciplesCoverage(
  sessions: TrainingSession[],
): Array<{ principle: string; count: number }> {
  const counts = new Map<string, number>();
  for (const s of sessions) {
    if (s.tacticalPrinciples) {
      for (const p of s.tacticalPrinciples) {
        if (p) counts.set(p, (counts.get(p) || 0) + 1);
      }
    }
  }
  if (counts.size === 0) return [];
  return Array.from(counts, ([principle, count]) => ({ principle, count }))
    .sort((a, b) => b.count - a.count);
}

// ── Athlete Monitoring ──────────────────────────────────

export function computeWellnessTrend(
  logs: WellnessLog[],
  goalkeeperId?: string,
): Array<{ date: string; sleep: number; stress: number; fatigue: number; soreness: number; mood: number; score: number }> {
  const filtered = goalkeeperId ? logs.filter(l => l.goalkeeper_id === goalkeeperId) : logs;

  const byDate = new Map<string, WellnessLog[]>();
  for (const log of filtered) {
    const arr = byDate.get(log.date) || [];
    arr.push(log);
    byDate.set(log.date, arr);
  }

  return Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, dayLogs]) => {
      const n = dayLogs.length;
      return {
        date,
        sleep: Math.round(dayLogs.reduce((s, l) => s + l.sleep, 0) / n),
        stress: Math.round(dayLogs.reduce((s, l) => s + l.stress, 0) / n),
        fatigue: Math.round(dayLogs.reduce((s, l) => s + l.fatigue, 0) / n),
        soreness: Math.round(dayLogs.reduce((s, l) => s + l.soreness, 0) / n),
        mood: Math.round(dayLogs.reduce((s, l) => s + l.mood, 0) / n),
        score: +(dayLogs.reduce((s, l) => s + l.score, 0) / n).toFixed(1),
      };
    });
}

export function computeRpeLoadTrend(
  sessions: TrainingSession[],
  attendance: Attendance[],
  goalkeeperId?: string,
): Array<{ date: string; avgRpe: number; load: number; cumulativeLoad: number }> {
  const attBySession = new Map<string, Attendance[]>();
  for (const a of attendance) {
    if (a.rpe == null) continue;
    if (goalkeeperId && a.goalkeeper_id !== goalkeeperId) continue;
    const arr = attBySession.get(a.session_id) || [];
    arr.push(a);
    attBySession.set(a.session_id, arr);
  }

  const sorted = [...sessions].sort((a, b) => a.date.localeCompare(b.date));
  const results: Array<{ date: string; avgRpe: number; load: number; cumulativeLoad: number }> = [];
  let cumulative = 0;

  for (const s of sorted) {
    const recs = attBySession.get(s.id);
    if (!recs || recs.length === 0) continue;

    const avgRpe = Math.round(recs.reduce((sum, r) => sum + (r.rpe || 0), 0) / recs.length);
    const durationMin = parseDuration(s.duration);
    const load = avgRpe * durationMin;
    cumulative += load;

    results.push({
      date: s.date,
      avgRpe,
      load,
      cumulativeLoad: cumulative,
    });
  }

  return results;
}

// ── Summary Stats ───────────────────────────────────────

export function computeSummaryStats(
  sessions: TrainingSession[],
  exercises: Exercise[],
  attendance: Attendance[],
  wellnessLogs: WellnessLog[],
  periodDays: number,
): { totalSessions: number; totalExercises: number; avgRpe: number; totalLoad: number; avgWellness: number; sessionsPerWeek: number } {
  const totalSessions = sessions.length;
  const totalExercises = exercises.length;

  // Average RPE from all attendance records with RPE
  const rpeRecords = attendance.filter(a => a.rpe != null && a.rpe > 0);
  const avgRpe = rpeRecords.length > 0
    ? +(rpeRecords.reduce((sum, a) => sum + a.rpe!, 0) / rpeRecords.length).toFixed(1)
    : 0;

  // Total load: for each session, avgRpe * duration
  let totalLoad = 0;
  const attBySession = new Map<string, number[]>();
  for (const a of attendance) {
    if (a.rpe == null || a.rpe <= 0) continue;
    const arr = attBySession.get(a.session_id) || [];
    arr.push(a.rpe);
    attBySession.set(a.session_id, arr);
  }
  for (const s of sessions) {
    const rpes = attBySession.get(s.id);
    if (!rpes || rpes.length === 0) continue;
    const sessionAvgRpe = rpes.reduce((sum, v) => sum + v, 0) / rpes.length;
    const durationMin = parseDuration(s.duration);
    totalLoad += Math.round(sessionAvgRpe * durationMin);
  }

  // Average wellness score
  const avgWellness = wellnessLogs.length > 0
    ? +(wellnessLogs.reduce((sum, l) => sum + l.score, 0) / wellnessLogs.length).toFixed(1)
    : 0;

  // Sessions per week
  const weeks = Math.max(periodDays / 7, 1);
  const sessionsPerWeek = +(totalSessions / weeks).toFixed(1);

  return { totalSessions, totalExercises, avgRpe, totalLoad, avgWellness, sessionsPerWeek };
}

// ── Intensity Distribution ──────────────────────────────

export function computeIntensityDistribution(
  exercises: Exercise[],
): Array<{ intensity: string; count: number; percentage: number }> {
  if (exercises.length === 0) return [];
  const counts = new Map<string, number>();
  for (const ex of exercises) {
    const key = ex.intensity || 'medium';
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  const total = exercises.length;
  return Array.from(counts, ([intensity, count]) => ({
    intensity,
    count,
    percentage: Math.round((count / total) * 100),
  })).sort((a, b) => {
    const order = ['low', 'medium', 'high'];
    return order.indexOf(a.intensity) - order.indexOf(b.intensity);
  });
}

// ── Context Distribution ────────────────────────────────

export function computeContextDistribution(
  sessions: TrainingSession[],
): Array<{ context: string; count: number }> {
  let gym = 0;
  let warmup = 0;
  let main = 0;
  for (const s of sessions) {
    gym += (s.gym || []).length;
    warmup += (s.warmup || []).length;
    main += (s.exercises || []).length;
  }
  const result: Array<{ context: string; count: number }> = [];
  if (gym > 0) result.push({ context: 'gym', count: gym });
  if (warmup > 0) result.push({ context: 'warmup', count: warmup });
  if (main > 0) result.push({ context: 'main', count: main });
  return result;
}

// ── Weekly Volume ───────────────────────────────────────

export function computeWeeklyVolume(
  sessions: TrainingSession[],
): Array<{ week: string; sessions: number; exercises: number }> {
  if (sessions.length === 0) return [];

  const weekMap = new Map<string, { sessions: number; exercises: number }>();

  for (const s of sessions) {
    const date = new Date(s.date + 'T12:00:00');
    if (isNaN(date.getTime())) continue;

    // ISO week number
    const jan4 = new Date(date.getFullYear(), 0, 4);
    const dayOfYear = Math.floor((date.getTime() - jan4.getTime()) / 86400000) + 4;
    const weekNum = Math.ceil(dayOfYear / 7);
    const weekKey = `W${weekNum}`;

    const entry = weekMap.get(weekKey) || { sessions: 0, exercises: 0 };
    entry.sessions += 1;
    entry.exercises += (s.gym || []).length + (s.warmup || []).length + (s.exercises || []).length;
    weekMap.set(weekKey, entry);
  }

  return Array.from(weekMap.entries())
    .map(([week, data]) => ({ week, ...data }))
    .sort((a, b) => {
      const numA = parseInt(a.week.slice(1), 10);
      const numB = parseInt(b.week.slice(1), 10);
      return numA - numB;
    });
}

// ── Filters ─────────────────────────────────────────────

export function filterSessionsByPeriod(
  sessions: TrainingSession[],
  from: string,
  to: string,
): TrainingSession[] {
  return sessions.filter(s => s.date >= from && s.date <= to);
}

export function filterSessionsByCategory(
  sessions: TrainingSession[],
  category: string,
): TrainingSession[] {
  if (category === 'all') return sessions;
  return sessions.filter(s => {
    const cats = parseCategory(s.category);
    return cats.includes(category);
  });
}

export function filterSessionsByMesocycle(
  sessions: TrainingSession[],
  mesocycle: string,
): TrainingSession[] {
  if (mesocycle === 'all') return sessions;
  return sessions.filter(s => s.mesocycle === mesocycle);
}

export function filterSessionsByGoalkeeper(
  sessions: TrainingSession[],
  attendance: Attendance[],
  goalkeeperId: string,
): TrainingSession[] {
  const sessionIds = new Set(
    attendance
      .filter(a => a.goalkeeper_id === goalkeeperId && (a.status === 'present' || a.status === 'late'))
      .map(a => a.session_id)
  );
  return sessions.filter(s => sessionIds.has(s.id));
}
