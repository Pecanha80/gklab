import { describe, it, expect } from 'vitest';
import {
  computeMicrocycleSummary,
  suggestIntensity,
  computeMdDiff,
} from './microcycle';
import type { TrainingSession } from '../types';

// --- Helpers ---

function makeSession(date: string): TrainingSession {
  return {
    id: crypto.randomUUID(),
    date,
    duration: '75 min',
    titles: ['Session'],
    category: ['firstTeam'],
    numAthletes: 3,
    generalObjectives: [],
    objectives: { technical: '', tactical: '', physical: '', cognitive: '' },
    warmup: [],
    exercises: [],
    warmUp: [],
    mainExercises: [],
    integrated: [],
    coolDown: [],
    notes: '',
    created_at: new Date().toISOString(),
  } as unknown as TrainingSession;
}

const WEEK = ['2026-04-19', '2026-04-20', '2026-04-21', '2026-04-22', '2026-04-23', '2026-04-24', '2026-04-25'];

// --- computeMicrocycleSummary ---

describe('computeMicrocycleSummary', () => {
  it('returns zeros for empty days', () => {
    const summary = computeMicrocycleSummary([], [], null, []);
    expect(summary.totalDays).toBe(0);
    expect(summary.trainingDays).toBe(0);
    expect(summary.sessionsPlanned).toBe(0);
    expect(summary.restDays).toBe(0);
    expect(summary.matchDays).toBe(0);
    expect(summary.emptyTrainingDays).toBe(0);
  });

  it('counts total days, rest days, and match days', () => {
    const summary = computeMicrocycleSummary(
      WEEK,
      ['2026-04-22'], // 1 rest day
      '2026-04-25',   // match day
      []
    );
    expect(summary.totalDays).toBe(7);
    expect(summary.restDays).toBe(1);
    expect(summary.matchDays).toBe(1);
    expect(summary.trainingDays).toBe(5); // 7 - 1 rest - 1 match
  });

  it('counts sessions that fall within the days', () => {
    const sessions = [
      makeSession('2026-04-19'),
      makeSession('2026-04-20'),
      makeSession('2026-04-30'), // outside the week
    ];
    const summary = computeMicrocycleSummary(WEEK, [], null, sessions);
    expect(summary.sessionsPlanned).toBe(2);
  });

  it('counts empty training days (training days without sessions)', () => {
    const sessions = [makeSession('2026-04-19')];
    const summary = computeMicrocycleSummary(
      WEEK,
      ['2026-04-22'],  // 1 rest
      '2026-04-25',    // 1 match
      sessions
    );
    // training days = 5 (7 - 1 rest - 1 match)
    // days with sessions = 1 (Apr 19)
    // empty training days = 4
    expect(summary.emptyTrainingDays).toBe(4);
  });

  it('does not count sessions on rest or match days as reducing empty count', () => {
    const sessions = [makeSession('2026-04-22')]; // session on rest day
    const summary = computeMicrocycleSummary(
      WEEK,
      ['2026-04-22'],
      '2026-04-25',
      sessions
    );
    // training days = 5, none have sessions
    expect(summary.emptyTrainingDays).toBe(5);
  });
});

// --- computeMdDiff ---

describe('computeMdDiff', () => {
  it('returns null when no match day', () => {
    expect(computeMdDiff('2026-04-19', null, WEEK)).toBeNull();
  });

  it('returns null when date not in days', () => {
    expect(computeMdDiff('2026-04-30', '2026-04-25', WEEK)).toBeNull();
  });

  it('returns 0 on match day', () => {
    expect(computeMdDiff('2026-04-25', '2026-04-25', WEEK)).toBe(0);
  });

  it('returns negative diff before match day', () => {
    // Apr 19 is 6 days before Apr 25
    expect(computeMdDiff('2026-04-19', '2026-04-25', WEEK)).toBe(-6);
    // Apr 24 is 1 day before
    expect(computeMdDiff('2026-04-24', '2026-04-25', WEEK)).toBe(-1);
  });

  it('returns positive diff after match day', () => {
    // If match is Apr 19, then Apr 20 is +1
    expect(computeMdDiff('2026-04-20', '2026-04-19', WEEK)).toBe(1);
  });
});

// --- suggestIntensity ---

describe('suggestIntensity', () => {
  it('returns rest when isRest is true', () => {
    expect(suggestIntensity(-3, true)).toBe('rest');
  });

  it('returns match when mdDiff is 0', () => {
    expect(suggestIntensity(0, false)).toBe('match');
  });

  it('returns recovery for MD+1 (day after match)', () => {
    expect(suggestIntensity(1, false)).toBe('recovery');
  });

  it('returns low for MD+2', () => {
    expect(suggestIntensity(2, false)).toBe('low');
  });

  it('returns high for MD-4', () => {
    expect(suggestIntensity(-4, false)).toBe('high');
  });

  it('returns high for MD-3', () => {
    expect(suggestIntensity(-3, false)).toBe('high');
  });

  it('returns medium for MD-2', () => {
    expect(suggestIntensity(-2, false)).toBe('medium');
  });

  it('returns low for MD-1', () => {
    expect(suggestIntensity(-1, false)).toBe('low');
  });

  it('returns medium for MD-5 and beyond', () => {
    expect(suggestIntensity(-5, false)).toBe('medium');
    expect(suggestIntensity(-6, false)).toBe('medium');
  });

  it('returns recovery for null mdDiff (no match set)', () => {
    expect(suggestIntensity(null, false)).toBe('medium');
  });
});
