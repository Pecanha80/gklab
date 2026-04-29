import { describe, it, expect } from 'vitest';
import type { TrainingSession, Exercise, Attendance, WellnessLog } from '../types';
import {
  collectAllExercises,
  computeExerciseTypeDistribution,
  computePhysicalCapacityDistribution,
  computeTopDrills,
  computeGameMomentsCoverage,
  computeObjectivesFrequency,
  computeTacticalPrinciplesCoverage,
  computeWellnessTrend,
  computeRpeLoadTrend,
  computeSummaryStats,
  computeIntensityDistribution,
  computeContextDistribution,
  computeWeeklyVolume,
  filterSessionsByPeriod,
  filterSessionsByCategory,
  filterSessionsByMesocycle,
  filterSessionsByGoalkeeper,
} from './analytics';

// ── Helpers ──────────────────────────────────────────────

function makeExercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: crypto.randomUUID(),
    type: 'shotStopping',
    title: 'Diving Save',
    objective: [],
    organization: [],
    execution: [],
    progression: [],
    successCriteria: [],
    duration: '15min',
    intensity: 'medium',
    ...overrides,
  };
}

function makeSession(overrides: Partial<TrainingSession> = {}): TrainingSession {
  return {
    id: crypto.randomUUID(),
    date: '2026-04-20',
    category: 'firstTeam',
    numAthletes: 3,
    duration: '90min',
    generalObjectives: [],
    gym: [],
    warmup: [],
    exercises: [],
    coolDown: '',
    observations: { positives: [], adjustments: [], individualEval: [] },
    titles: [],
    ...overrides,
  };
}

function makeAttendance(overrides: Partial<Attendance> = {}): Attendance {
  return {
    id: crypto.randomUUID(),
    session_id: 's1',
    goalkeeper_id: 'gk1',
    status: 'present',
    rpe: 7,
    created_at: '2026-04-20',
    ...overrides,
  };
}

function makeWellnessLog(overrides: Partial<WellnessLog> = {}): WellnessLog {
  return {
    id: crypto.randomUUID(),
    goalkeeper_id: 'gk1',
    date: '2026-04-20',
    sleep: 4,
    stress: 2,
    fatigue: 3,
    soreness: 2,
    mood: 4,
    score: 3.0,
    created_at: '2026-04-20',
    ...overrides,
  };
}

// ── Tests ────────────────────────────────────────────────

describe('collectAllExercises', () => {
  it('flattens gym, warmup, and exercises from sessions', () => {
    const sessions = [
      makeSession({
        gym: [makeExercise({ type: 'gym', title: 'Squat' })],
        warmup: [makeExercise({ type: 'warmup', title: 'Mobility' })],
        exercises: [makeExercise({ type: 'shotStopping', title: 'Diving' })],
      }),
    ];
    const result = collectAllExercises(sessions);
    expect(result).toHaveLength(3);
    expect(result.map(e => e.title)).toEqual(['Squat', 'Mobility', 'Diving']);
  });

  it('returns empty array for sessions with no exercises', () => {
    const sessions = [makeSession()];
    expect(collectAllExercises(sessions)).toEqual([]);
  });

  it('handles multiple sessions', () => {
    const sessions = [
      makeSession({ exercises: [makeExercise(), makeExercise()] }),
      makeSession({ warmup: [makeExercise()] }),
    ];
    expect(collectAllExercises(sessions)).toHaveLength(3);
  });
});

describe('computeExerciseTypeDistribution', () => {
  it('counts exercises by type', () => {
    const exercises = [
      makeExercise({ type: 'shotStopping' }),
      makeExercise({ type: 'shotStopping' }),
      makeExercise({ type: 'crosses' }),
      makeExercise({ type: 'oneVsOne' }),
    ];
    const result = computeExerciseTypeDistribution(exercises);
    expect(result).toContainEqual({ type: 'shotStopping', count: 2 });
    expect(result).toContainEqual({ type: 'crosses', count: 1 });
    expect(result).toContainEqual({ type: 'oneVsOne', count: 1 });
  });

  it('returns empty array for no exercises', () => {
    expect(computeExerciseTypeDistribution([])).toEqual([]);
  });

  it('sorts by count descending', () => {
    const exercises = [
      makeExercise({ type: 'crosses' }),
      makeExercise({ type: 'shotStopping' }),
      makeExercise({ type: 'shotStopping' }),
      makeExercise({ type: 'shotStopping' }),
    ];
    const result = computeExerciseTypeDistribution(exercises);
    expect(result[0].type).toBe('shotStopping');
    expect(result[0].count).toBe(3);
  });
});

describe('computePhysicalCapacityDistribution', () => {
  it('counts exercises by category', () => {
    const exercises = [
      makeExercise({ category: 'strength' }),
      makeExercise({ category: 'strength' }),
      makeExercise({ category: 'agility' }),
    ];
    const result = computePhysicalCapacityDistribution(exercises);
    expect(result).toContainEqual({ capacity: 'strength', count: 2 });
    expect(result).toContainEqual({ capacity: 'agility', count: 1 });
  });

  it('excludes exercises with no category', () => {
    const exercises = [
      makeExercise({ category: 'strength' }),
      makeExercise({ category: undefined }),
      makeExercise({ category: '' }),
    ];
    const result = computePhysicalCapacityDistribution(exercises);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ capacity: 'strength', count: 1 });
  });
});

describe('computeTopDrills', () => {
  it('returns top N drills by frequency', () => {
    const exercises = [
      makeExercise({ title: 'Diving' }),
      makeExercise({ title: 'Diving' }),
      makeExercise({ title: 'Diving' }),
      makeExercise({ title: 'Crosses' }),
      makeExercise({ title: 'Crosses' }),
      makeExercise({ title: '1v1' }),
    ];
    const result = computeTopDrills(exercises, 2);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ title: 'Diving', count: 3 });
    expect(result[1]).toEqual({ title: 'Crosses', count: 2 });
  });

  it('defaults to 10 results', () => {
    const exercises = Array.from({ length: 15 }, (_, i) =>
      makeExercise({ title: `Drill ${i}` })
    );
    const result = computeTopDrills(exercises);
    expect(result).toHaveLength(10);
  });
});

describe('computeGameMomentsCoverage', () => {
  it('counts from session gameMoments and exercise gameMoment', () => {
    const sessions = [
      makeSession({
        gameMoments: ['momentOrganizedDefense', 'momentOffensiveTransition'],
        exercises: [makeExercise({ gameMoment: 'momentSetPieces' })],
      }),
    ];
    const exercises = collectAllExercises(sessions);
    const result = computeGameMomentsCoverage(sessions, exercises);
    expect(result).toContainEqual({ moment: 'momentOrganizedDefense', count: 1 });
    expect(result).toContainEqual({ moment: 'momentOffensiveTransition', count: 1 });
    expect(result).toContainEqual({ moment: 'momentSetPieces', count: 1 });
  });

  it('returns empty array when no game moments', () => {
    const sessions = [makeSession()];
    expect(computeGameMomentsCoverage(sessions, [])).toEqual([]);
  });
});

describe('computeObjectivesFrequency', () => {
  it('counts generalObjectives across sessions', () => {
    const sessions = [
      makeSession({ generalObjectives: ['improveHandling', 'developAerialDominance'] }),
      makeSession({ generalObjectives: ['improveHandling'] }),
    ];
    const result = computeObjectivesFrequency(sessions);
    expect(result).toContainEqual({ objective: 'improveHandling', count: 2 });
    expect(result).toContainEqual({ objective: 'developAerialDominance', count: 1 });
  });

  it('respects limit parameter', () => {
    const sessions = [
      makeSession({ generalObjectives: ['a', 'b', 'c', 'd'] }),
    ];
    const result = computeObjectivesFrequency(sessions, 2);
    expect(result).toHaveLength(2);
  });

  it('filters out #-prefixed section headers', () => {
    const sessions = [
      makeSession({ generalObjectives: ['#sectionHeader', 'realObjective'] }),
    ];
    const result = computeObjectivesFrequency(sessions);
    expect(result).toHaveLength(1);
    expect(result[0].objective).toBe('realObjective');
  });
});

describe('computeTacticalPrinciplesCoverage', () => {
  it('counts tacticalPrinciples across sessions', () => {
    const sessions = [
      makeSession({ tacticalPrinciples: ['pressing', 'deepLine'] }),
      makeSession({ tacticalPrinciples: ['pressing'] }),
    ];
    const result = computeTacticalPrinciplesCoverage(sessions);
    expect(result).toContainEqual({ principle: 'pressing', count: 2 });
    expect(result).toContainEqual({ principle: 'deepLine', count: 1 });
  });

  it('returns empty for sessions without tactical principles', () => {
    const sessions = [makeSession()];
    expect(computeTacticalPrinciplesCoverage(sessions)).toEqual([]);
  });
});

describe('computeWellnessTrend', () => {
  it('groups wellness logs by date', () => {
    const logs = [
      makeWellnessLog({ date: '2026-04-20', sleep: 4, stress: 2, fatigue: 3, soreness: 2, mood: 4, score: 3.0 }),
      makeWellnessLog({ date: '2026-04-21', sleep: 3, stress: 3, fatigue: 4, soreness: 3, mood: 3, score: 2.8 }),
    ];
    const result = computeWellnessTrend(logs);
    expect(result).toHaveLength(2);
    expect(result[0].date).toBe('2026-04-20');
    expect(result[1].date).toBe('2026-04-21');
  });

  it('filters by goalkeeper when provided', () => {
    const logs = [
      makeWellnessLog({ goalkeeper_id: 'gk1', date: '2026-04-20' }),
      makeWellnessLog({ goalkeeper_id: 'gk2', date: '2026-04-20' }),
    ];
    const result = computeWellnessTrend(logs, 'gk1');
    expect(result).toHaveLength(1);
  });

  it('averages multiple logs on the same date when no GK filter', () => {
    const logs = [
      makeWellnessLog({ goalkeeper_id: 'gk1', date: '2026-04-20', sleep: 4, score: 3.0 }),
      makeWellnessLog({ goalkeeper_id: 'gk2', date: '2026-04-20', sleep: 2, score: 2.0 }),
    ];
    const result = computeWellnessTrend(logs);
    expect(result).toHaveLength(1);
    expect(result[0].sleep).toBe(3); // average of 4 and 2
    expect(result[0].score).toBe(2.5);
  });
});

describe('computeRpeLoadTrend', () => {
  it('computes per-session average RPE and load', () => {
    const sessions = [
      makeSession({ id: 's1', date: '2026-04-20', duration: '90min' }),
    ];
    const attendance = [
      makeAttendance({ session_id: 's1', goalkeeper_id: 'gk1', rpe: 6 }),
      makeAttendance({ session_id: 's1', goalkeeper_id: 'gk2', rpe: 8 }),
    ];
    const result = computeRpeLoadTrend(sessions, attendance);
    expect(result).toHaveLength(1);
    expect(result[0].avgRpe).toBe(7); // (6+8)/2
    expect(result[0].load).toBe(630); // 7 * 90
  });

  it('filters by goalkeeper when provided', () => {
    const sessions = [
      makeSession({ id: 's1', date: '2026-04-20', duration: '90min' }),
    ];
    const attendance = [
      makeAttendance({ session_id: 's1', goalkeeper_id: 'gk1', rpe: 6 }),
      makeAttendance({ session_id: 's1', goalkeeper_id: 'gk2', rpe: 8 }),
    ];
    const result = computeRpeLoadTrend(sessions, attendance, 'gk1');
    expect(result).toHaveLength(1);
    expect(result[0].avgRpe).toBe(6);
    expect(result[0].load).toBe(540); // 6 * 90
  });

  it('computes cumulative load across sessions', () => {
    const sessions = [
      makeSession({ id: 's1', date: '2026-04-20', duration: '60min' }),
      makeSession({ id: 's2', date: '2026-04-21', duration: '60min' }),
    ];
    const attendance = [
      makeAttendance({ session_id: 's1', rpe: 5 }),
      makeAttendance({ session_id: 's2', rpe: 7 }),
    ];
    const result = computeRpeLoadTrend(sessions, attendance);
    expect(result[0].cumulativeLoad).toBe(300); // 5*60
    expect(result[1].cumulativeLoad).toBe(720); // 300 + 7*60
  });

  it('skips sessions with no RPE data', () => {
    const sessions = [
      makeSession({ id: 's1', date: '2026-04-20', duration: '90min' }),
    ];
    const result = computeRpeLoadTrend(sessions, []);
    expect(result).toHaveLength(0);
  });
});

describe('filterSessionsByPeriod', () => {
  it('filters sessions within date range', () => {
    const sessions = [
      makeSession({ date: '2026-04-15' }),
      makeSession({ date: '2026-04-20' }),
      makeSession({ date: '2026-04-25' }),
    ];
    const result = filterSessionsByPeriod(sessions, '2026-04-18', '2026-04-22');
    expect(result).toHaveLength(1);
    expect(result[0].date).toBe('2026-04-20');
  });

  it('includes boundary dates', () => {
    const sessions = [
      makeSession({ date: '2026-04-20' }),
    ];
    const result = filterSessionsByPeriod(sessions, '2026-04-20', '2026-04-20');
    expect(result).toHaveLength(1);
  });
});

describe('filterSessionsByCategory', () => {
  it('filters sessions by string category', () => {
    const sessions = [
      makeSession({ category: 'firstTeam' }),
      makeSession({ category: 'u23' }),
    ];
    const result = filterSessionsByCategory(sessions, 'firstTeam');
    expect(result).toHaveLength(1);
  });

  it('filters sessions by array category', () => {
    const sessions = [
      makeSession({ category: ['firstTeam', 'u23'] }),
      makeSession({ category: ['u18'] }),
    ];
    const result = filterSessionsByCategory(sessions, 'firstTeam');
    expect(result).toHaveLength(1);
  });

  it('returns all sessions when category is "all"', () => {
    const sessions = [
      makeSession({ category: 'firstTeam' }),
      makeSession({ category: 'u23' }),
    ];
    const result = filterSessionsByCategory(sessions, 'all');
    expect(result).toHaveLength(2);
  });
});

// ── New function tests ──────────────────────────────────

describe('computeSummaryStats', () => {
  it('computes all summary statistics correctly', () => {
    const sessions = [
      makeSession({ id: 's1', date: '2026-04-20', duration: '90min', exercises: [makeExercise(), makeExercise()] }),
      makeSession({ id: 's2', date: '2026-04-21', duration: '60min', exercises: [makeExercise()] }),
    ];
    const exercises = collectAllExercises(sessions);
    const attendance = [
      makeAttendance({ session_id: 's1', rpe: 6 }),
      makeAttendance({ session_id: 's2', rpe: 8 }),
    ];
    const wellnessLogs = [
      makeWellnessLog({ score: 3.0 }),
      makeWellnessLog({ score: 4.0 }),
    ];
    const result = computeSummaryStats(sessions, exercises, attendance, wellnessLogs, 30);
    expect(result.totalSessions).toBe(2);
    expect(result.totalExercises).toBe(3);
    expect(result.avgRpe).toBe(7); // (6+8)/2
    expect(result.totalLoad).toBe(1020); // 6*90 + 8*60
    expect(result.avgWellness).toBe(3.5);
    expect(result.sessionsPerWeek).toBeCloseTo(0.5, 1); // 2 sessions / (30/7) weeks
  });

  it('handles empty data', () => {
    const result = computeSummaryStats([], [], [], [], 30);
    expect(result.totalSessions).toBe(0);
    expect(result.avgRpe).toBe(0);
    expect(result.totalLoad).toBe(0);
    expect(result.avgWellness).toBe(0);
    expect(result.sessionsPerWeek).toBe(0);
  });
});

describe('computeIntensityDistribution', () => {
  it('computes distribution of intensity levels', () => {
    const exercises = [
      makeExercise({ intensity: 'low' }),
      makeExercise({ intensity: 'low' }),
      makeExercise({ intensity: 'medium' }),
      makeExercise({ intensity: 'high' }),
    ];
    const result = computeIntensityDistribution(exercises);
    expect(result).toHaveLength(3);
    expect(result.find(d => d.intensity === 'low')).toEqual({ intensity: 'low', count: 2, percentage: 50 });
    expect(result.find(d => d.intensity === 'medium')).toEqual({ intensity: 'medium', count: 1, percentage: 25 });
    expect(result.find(d => d.intensity === 'high')).toEqual({ intensity: 'high', count: 1, percentage: 25 });
  });

  it('returns empty array for no exercises', () => {
    expect(computeIntensityDistribution([])).toEqual([]);
  });

  it('sorts by low, medium, high order', () => {
    const exercises = [
      makeExercise({ intensity: 'high' }),
      makeExercise({ intensity: 'low' }),
      makeExercise({ intensity: 'medium' }),
    ];
    const result = computeIntensityDistribution(exercises);
    expect(result[0].intensity).toBe('low');
    expect(result[1].intensity).toBe('medium');
    expect(result[2].intensity).toBe('high');
  });
});

describe('computeContextDistribution', () => {
  it('counts exercises by context (gym, warmup, main)', () => {
    const sessions = [
      makeSession({
        gym: [makeExercise(), makeExercise()],
        warmup: [makeExercise()],
        exercises: [makeExercise(), makeExercise(), makeExercise()],
      }),
    ];
    const result = computeContextDistribution(sessions);
    expect(result).toContainEqual({ context: 'gym', count: 2 });
    expect(result).toContainEqual({ context: 'warmup', count: 1 });
    expect(result).toContainEqual({ context: 'main', count: 3 });
  });

  it('excludes contexts with zero exercises', () => {
    const sessions = [
      makeSession({
        gym: [],
        warmup: [makeExercise()],
        exercises: [],
      }),
    ];
    const result = computeContextDistribution(sessions);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ context: 'warmup', count: 1 });
  });

  it('returns empty for sessions with no exercises in any context', () => {
    const sessions = [makeSession()];
    const result = computeContextDistribution(sessions);
    expect(result).toEqual([]);
  });
});

describe('computeWeeklyVolume', () => {
  it('groups sessions by ISO week', () => {
    const sessions = [
      makeSession({ date: '2026-04-20', exercises: [makeExercise(), makeExercise()] }),
      makeSession({ date: '2026-04-21', exercises: [makeExercise()] }),
      makeSession({ date: '2026-04-27', exercises: [makeExercise()] }),
    ];
    const result = computeWeeklyVolume(sessions);
    expect(result.length).toBeGreaterThanOrEqual(1);
    // All results should have sessions > 0
    for (const entry of result) {
      expect(entry.sessions).toBeGreaterThan(0);
      expect(entry.week).toMatch(/^W\d+$/);
    }
  });

  it('returns empty array for no sessions', () => {
    expect(computeWeeklyVolume([])).toEqual([]);
  });

  it('counts exercises from all contexts', () => {
    const sessions = [
      makeSession({
        date: '2026-04-20',
        gym: [makeExercise()],
        warmup: [makeExercise()],
        exercises: [makeExercise()],
      }),
    ];
    const result = computeWeeklyVolume(sessions);
    expect(result[0].exercises).toBe(3);
    expect(result[0].sessions).toBe(1);
  });
});

describe('filterSessionsByMesocycle', () => {
  it('filters sessions by mesocycle', () => {
    const sessions = [
      makeSession({ mesocycle: 'Pre-Season' }),
      makeSession({ mesocycle: 'Competition' }),
      makeSession({ mesocycle: undefined }),
    ];
    const result = filterSessionsByMesocycle(sessions, 'Pre-Season');
    expect(result).toHaveLength(1);
    expect(result[0].mesocycle).toBe('Pre-Season');
  });

  it('returns all sessions when mesocycle is "all"', () => {
    const sessions = [
      makeSession({ mesocycle: 'Pre-Season' }),
      makeSession({ mesocycle: undefined }),
    ];
    const result = filterSessionsByMesocycle(sessions, 'all');
    expect(result).toHaveLength(2);
  });
});

describe('filterSessionsByGoalkeeper', () => {
  it('filters sessions by goalkeeper attendance', () => {
    const sessions = [
      makeSession({ id: 's1' }),
      makeSession({ id: 's2' }),
      makeSession({ id: 's3' }),
    ];
    const attendance = [
      makeAttendance({ session_id: 's1', goalkeeper_id: 'gk1', status: 'present' }),
      makeAttendance({ session_id: 's2', goalkeeper_id: 'gk2', status: 'present' }),
      makeAttendance({ session_id: 's3', goalkeeper_id: 'gk1', status: 'late' }),
    ];
    const result = filterSessionsByGoalkeeper(sessions, attendance, 'gk1');
    expect(result).toHaveLength(2);
    expect(result.map(s => s.id)).toContain('s1');
    expect(result.map(s => s.id)).toContain('s3');
  });

  it('excludes sessions where GK was absent', () => {
    const sessions = [makeSession({ id: 's1' })];
    const attendance = [
      makeAttendance({ session_id: 's1', goalkeeper_id: 'gk1', status: 'absent' }),
    ];
    const result = filterSessionsByGoalkeeper(sessions, attendance, 'gk1');
    expect(result).toHaveLength(0);
  });
});
