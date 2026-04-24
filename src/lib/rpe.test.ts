import { describe, it, expect } from 'vitest';
import {
  parseDuration,
  computeSessionLoad,
  getTeamStatusLevel,
  computeWeeklyLoads,
  computeIntensityDistribution,
  computeRpeStats,
  buildSessionsWithLoad,
} from './rpe';
import type { SessionWithLoad } from './rpe';
import type { Attendance, TrainingSession } from '../types';

// --- Helpers ---

function makeSession(overrides: Partial<TrainingSession> & { id: string }): TrainingSession {
  return {
    date: '2026-04-19',
    duration: '75 min',
    titles: ['Session'],
    objectives: [],
    warmUp: [],
    mainExercises: [],
    integrated: [],
    coolDown: [],
    notes: '',
    created_at: new Date().toISOString(),
    ...overrides,
  } as TrainingSession;
}

function makeAttendance(overrides: Partial<Attendance> & { session_id: string; goalkeeper_id: string }): Attendance {
  return {
    id: crypto.randomUUID(),
    status: 'present',
    rpe: 6,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

function makeSwl(overrides: Partial<SessionWithLoad>): SessionWithLoad {
  return {
    session: makeSession({ id: 's1' }),
    avgRpe: 6,
    durationMin: 75,
    load: 450,
    attendanceCount: 3,
    ...overrides,
  };
}

// --- parseDuration ---

describe('parseDuration', () => {
  it('parses string like "75 min"', () => {
    expect(parseDuration('75 min')).toBe(75);
  });

  it('parses plain number string', () => {
    expect(parseDuration('90')).toBe(90);
  });

  it('parses number value', () => {
    expect(parseDuration(60)).toBe(60);
  });

  it('parses array with first element', () => {
    expect(parseDuration(['120 min'])).toBe(120);
  });

  it('returns 0 for null/undefined', () => {
    expect(parseDuration(null)).toBe(0);
    expect(parseDuration(undefined)).toBe(0);
  });

  it('returns 0 for empty string', () => {
    expect(parseDuration('')).toBe(0);
  });

  it('returns 0 for non-numeric string', () => {
    expect(parseDuration('abc')).toBe(0);
  });
});

// --- computeSessionLoad ---

describe('computeSessionLoad', () => {
  it('multiplies RPE by duration and rounds', () => {
    expect(computeSessionLoad(6, 75)).toBe(450);
  });

  it('handles fractional RPE', () => {
    expect(computeSessionLoad(5.7, 75)).toBe(428); // Math.round(5.7 * 75) = 428
  });

  it('returns 0 when RPE is 0', () => {
    expect(computeSessionLoad(0, 75)).toBe(0);
  });

  it('returns 0 when duration is 0', () => {
    expect(computeSessionLoad(6, 0)).toBe(0);
  });
});

// --- getTeamStatusLevel ---

describe('getTeamStatusLevel', () => {
  it('returns none for 0', () => {
    expect(getTeamStatusLevel(0)).toBe('none');
  });

  it('returns fresh for 1-3', () => {
    expect(getTeamStatusLevel(1)).toBe('fresh');
    expect(getTeamStatusLevel(2.5)).toBe('fresh');
    expect(getTeamStatusLevel(3)).toBe('fresh');
  });

  it('returns ideal for 4-5', () => {
    expect(getTeamStatusLevel(4)).toBe('ideal');
    expect(getTeamStatusLevel(4.5)).toBe('ideal');
    expect(getTeamStatusLevel(5)).toBe('ideal');
  });

  it('returns moderate for 6-7', () => {
    expect(getTeamStatusLevel(6)).toBe('moderate');
    expect(getTeamStatusLevel(6.5)).toBe('moderate');
    expect(getTeamStatusLevel(7)).toBe('moderate');
  });

  it('returns high for 8+', () => {
    expect(getTeamStatusLevel(8)).toBe('high');
    expect(getTeamStatusLevel(9)).toBe('high');
    expect(getTeamStatusLevel(10)).toBe('high');
  });
});

// --- computeWeeklyLoads ---

describe('computeWeeklyLoads', () => {
  it('returns 7 day slots with correct labels', () => {
    const result = computeWeeklyLoads([]);
    expect(result).toHaveLength(7);
    expect(result.map(d => d.label)).toEqual(['D', 'S', 'T', 'Q', 'Q', 'S', 'S']);
  });

  it('returns all zeros for empty sessions', () => {
    const result = computeWeeklyLoads([]);
    expect(result.every(d => d.load === 0)).toBe(true);
  });

  it('buckets load into correct day of week', () => {
    // 2026-04-19 is a Sunday (getDay() = 0)
    const swl = makeSwl({
      session: makeSession({ id: 's1', date: '2026-04-19' }),
      load: 450,
    });
    // weekStartDate = Monday 2026-04-13
    const weekStart = new Date('2026-04-13T00:00:00');
    const result = computeWeeklyLoads([swl], weekStart);
    expect(result[0].load).toBe(450); // Sunday = index 0
  });

  it('filters out sessions outside the week range', () => {
    const swl1 = makeSwl({
      session: makeSession({ id: 's1', date: '2026-04-19' }),
      load: 450,
    });
    const swl2 = makeSwl({
      session: makeSession({ id: 's2', date: '2026-04-05' }), // outside week
      load: 300,
    });
    // Week of Apr 13-19
    const weekStart = new Date('2026-04-13T00:00:00');
    const result = computeWeeklyLoads([swl1, swl2], weekStart);
    const totalLoad = result.reduce((s, d) => s + d.load, 0);
    expect(totalLoad).toBe(450);
  });

  it('computes pct relative to max load in the week', () => {
    const swl1 = makeSwl({
      session: makeSession({ id: 's1', date: '2026-04-19' }), // Sunday
      load: 500,
    });
    const swl2 = makeSwl({
      session: makeSession({ id: 's2', date: '2026-04-14' }), // Tuesday
      load: 250,
    });
    const weekStart = new Date('2026-04-13T00:00:00');
    const result = computeWeeklyLoads([swl1, swl2], weekStart);
    expect(result[0].pct).toBe(100); // Sunday has max
    expect(result[2].pct).toBe(50);  // Tuesday is half
  });
});

// --- computeIntensityDistribution ---

describe('computeIntensityDistribution', () => {
  it('returns all zeros for empty input', () => {
    const dist = computeIntensityDistribution([]);
    expect(dist).toEqual({ veryHigh: 0, high: 0, moderate: 0, recovery: 0 });
  });

  it('classifies RPE values into correct zones', () => {
    const values = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
    const dist = computeIntensityDistribution(values);
    expect(dist.veryHigh).toBe(20);  // 10, 9 → 2/10
    expect(dist.high).toBe(20);      // 8, 7 → 2/10
    expect(dist.moderate).toBe(20);  // 6, 5 → 2/10
    expect(dist.recovery).toBe(40);  // 4, 3, 2, 1 → 4/10
  });

  it('handles all same zone', () => {
    const dist = computeIntensityDistribution([5, 5, 6, 6]);
    expect(dist.moderate).toBe(100);
    expect(dist.veryHigh).toBe(0);
    expect(dist.high).toBe(0);
    expect(dist.recovery).toBe(0);
  });
});

// --- computeRpeStats ---

describe('computeRpeStats', () => {
  it('returns zeros when no sessions have data', () => {
    const stats = computeRpeStats([], []);
    expect(stats.avgIntensity).toBe(0);
    expect(stats.totalLoad).toBe(0);
  });

  it('computes average intensity from attendance records with RPE', () => {
    const att: Attendance[] = [
      makeAttendance({ session_id: 's1', goalkeeper_id: 'gk1', rpe: 6 }),
      makeAttendance({ session_id: 's1', goalkeeper_id: 'gk2', rpe: 8 }),
    ];
    const swls = [makeSwl({ load: 450, avgRpe: 7 })];
    const stats = computeRpeStats(swls, att);
    expect(stats.avgIntensity).toBe(7); // (6+8)/2
    expect(stats.totalLoad).toBe(450);
  });

  it('ignores attendance without RPE', () => {
    const att: Attendance[] = [
      makeAttendance({ session_id: 's1', goalkeeper_id: 'gk1', rpe: 6 }),
      makeAttendance({ session_id: 's1', goalkeeper_id: 'gk2', rpe: undefined }),
    ];
    const swls = [makeSwl({ load: 300 })];
    const stats = computeRpeStats(swls, att);
    expect(stats.avgIntensity).toBe(6);
  });
});

// --- buildSessionsWithLoad ---

describe('buildSessionsWithLoad', () => {
  it('returns empty array for no sessions', () => {
    expect(buildSessionsWithLoad([], [])).toEqual([]);
  });

  it('computes avgRpe and load for a session', () => {
    const sessions = [makeSession({ id: 's1', duration: '75 min' })];
    const attendance: Attendance[] = [
      makeAttendance({ session_id: 's1', goalkeeper_id: 'gk1', rpe: 6 }),
      makeAttendance({ session_id: 's1', goalkeeper_id: 'gk2', rpe: 8 }),
    ];
    const result = buildSessionsWithLoad(sessions, attendance);
    expect(result).toHaveLength(1);
    expect(result[0].avgRpe).toBe(7);
    expect(result[0].durationMin).toBe(75);
    expect(result[0].load).toBe(525); // 7 * 75
    expect(result[0].attendanceCount).toBe(2);
  });

  it('handles session with no attendance', () => {
    const sessions = [makeSession({ id: 's1', duration: '90 min' })];
    const result = buildSessionsWithLoad(sessions, []);
    expect(result[0].avgRpe).toBe(0);
    expect(result[0].load).toBe(0);
    expect(result[0].attendanceCount).toBe(0);
  });

  it('ignores attendance with rpe=0 or null', () => {
    const sessions = [makeSession({ id: 's1', duration: '60 min' })];
    const attendance: Attendance[] = [
      makeAttendance({ session_id: 's1', goalkeeper_id: 'gk1', rpe: 5 }),
      makeAttendance({ session_id: 's1', goalkeeper_id: 'gk2', rpe: 0 }),
      makeAttendance({ session_id: 's1', goalkeeper_id: 'gk3', rpe: undefined }),
    ];
    const result = buildSessionsWithLoad(sessions, attendance);
    expect(result[0].avgRpe).toBe(5);
    expect(result[0].attendanceCount).toBe(1);
  });
});
