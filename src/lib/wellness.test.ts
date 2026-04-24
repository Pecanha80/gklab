import { describe, it, expect } from 'vitest';
import {
  computeWellnessStats,
  getLatestLog,
  getScoreBorderColor,
  filterLogsByPeriod,
  computeScore,
} from './wellness';
import type { WellnessLog } from '../types';

// --- Helpers ---

function makeLog(overrides: Partial<WellnessLog> & { goalkeeper_id: string; date: string; score: number }): WellnessLog {
  return {
    id: crypto.randomUUID(),
    sleep: 4,
    stress: 3,
    fatigue: 3,
    soreness: 4,
    mood: 4,
    notes: '',
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

// --- computeWellnessStats ---

describe('computeWellnessStats', () => {
  it('returns zeros for empty logs', () => {
    const stats = computeWellnessStats([]);
    expect(stats.avgScore).toBe(0);
    expect(stats.readinessPercent).toBe(0);
    expect(stats.alertCount).toBe(0);
  });

  it('computes average score from logs', () => {
    const logs = [
      makeLog({ goalkeeper_id: 'gk1', date: '2026-04-24', score: 4.0 }),
      makeLog({ goalkeeper_id: 'gk2', date: '2026-04-24', score: 2.0 }),
    ];
    const stats = computeWellnessStats(logs);
    expect(stats.avgScore).toBe(3.0);
  });

  it('computes readiness as score/5 * 100', () => {
    const logs = [
      makeLog({ goalkeeper_id: 'gk1', date: '2026-04-24', score: 4.0 }),
    ];
    const stats = computeWellnessStats(logs);
    expect(stats.readinessPercent).toBe(80);
  });

  it('counts alerts where score < 3', () => {
    const logs = [
      makeLog({ goalkeeper_id: 'gk1', date: '2026-04-24', score: 4.5 }),
      makeLog({ goalkeeper_id: 'gk2', date: '2026-04-24', score: 2.5 }),
      makeLog({ goalkeeper_id: 'gk3', date: '2026-04-24', score: 1.0 }),
    ];
    const stats = computeWellnessStats(logs);
    expect(stats.alertCount).toBe(2);
  });

  it('rounds avgScore to 1 decimal', () => {
    const logs = [
      makeLog({ goalkeeper_id: 'gk1', date: '2026-04-24', score: 3.33 }),
      makeLog({ goalkeeper_id: 'gk2', date: '2026-04-24', score: 4.67 }),
    ];
    const stats = computeWellnessStats(logs);
    expect(stats.avgScore).toBe(4.0); // (3.33+4.67)/2 = 4.0
  });
});

// --- getLatestLog ---

describe('getLatestLog', () => {
  it('returns undefined when no logs for goalkeeper', () => {
    const logs = [
      makeLog({ goalkeeper_id: 'gk1', date: '2026-04-24', score: 4.0 }),
    ];
    expect(getLatestLog(logs, 'gk2')).toBeUndefined();
  });

  it('returns undefined for empty logs', () => {
    expect(getLatestLog([], 'gk1')).toBeUndefined();
  });

  it('returns the most recent log by date', () => {
    const logs = [
      makeLog({ id: 'old', goalkeeper_id: 'gk1', date: '2026-04-20', score: 3.0 }),
      makeLog({ id: 'new', goalkeeper_id: 'gk1', date: '2026-04-24', score: 4.0 }),
      makeLog({ id: 'mid', goalkeeper_id: 'gk1', date: '2026-04-22', score: 3.5 }),
    ];
    const latest = getLatestLog(logs, 'gk1');
    expect(latest?.id).toBe('new');
    expect(latest?.score).toBe(4.0);
  });

  it('only considers logs for the specified goalkeeper', () => {
    const logs = [
      makeLog({ id: 'gk2-log', goalkeeper_id: 'gk2', date: '2026-04-25', score: 5.0 }),
      makeLog({ id: 'gk1-log', goalkeeper_id: 'gk1', date: '2026-04-24', score: 3.0 }),
    ];
    const latest = getLatestLog(logs, 'gk1');
    expect(latest?.id).toBe('gk1-log');
  });
});

// --- getScoreBorderColor ---

describe('getScoreBorderColor', () => {
  it('returns gray for undefined score', () => {
    expect(getScoreBorderColor(undefined)).toBe('gray');
  });

  it('returns emerald for score >= 4', () => {
    expect(getScoreBorderColor(4.0)).toBe('emerald');
    expect(getScoreBorderColor(5.0)).toBe('emerald');
    expect(getScoreBorderColor(4.5)).toBe('emerald');
  });

  it('returns amber for score >= 3 and < 4', () => {
    expect(getScoreBorderColor(3.0)).toBe('amber');
    expect(getScoreBorderColor(3.5)).toBe('amber');
    expect(getScoreBorderColor(3.9)).toBe('amber');
  });

  it('returns red for score < 3', () => {
    expect(getScoreBorderColor(2.9)).toBe('red');
    expect(getScoreBorderColor(1.0)).toBe('red');
    expect(getScoreBorderColor(0)).toBe('red');
  });
});

// --- filterLogsByPeriod ---

describe('filterLogsByPeriod', () => {
  const today = new Date('2026-04-24T12:00:00Z');

  it('returns empty array for empty logs', () => {
    expect(filterLogsByPeriod([], 7, today)).toEqual([]);
  });

  it('filters logs within 7 days', () => {
    const logs = [
      makeLog({ goalkeeper_id: 'gk1', date: '2026-04-24', score: 4.0 }),
      makeLog({ goalkeeper_id: 'gk1', date: '2026-04-18', score: 3.0 }),
      makeLog({ goalkeeper_id: 'gk1', date: '2026-04-10', score: 2.0 }), // outside 7 days
    ];
    const filtered = filterLogsByPeriod(logs, 7, today);
    expect(filtered).toHaveLength(2);
  });

  it('filters logs within 30 days', () => {
    const logs = [
      makeLog({ goalkeeper_id: 'gk1', date: '2026-04-24', score: 4.0 }),
      makeLog({ goalkeeper_id: 'gk1', date: '2026-03-30', score: 3.0 }),
      makeLog({ goalkeeper_id: 'gk1', date: '2026-03-20', score: 2.0 }), // outside 30 days
    ];
    const filtered = filterLogsByPeriod(logs, 30, today);
    expect(filtered).toHaveLength(2);
  });

  it('includes the boundary date (exactly N days ago)', () => {
    const logs = [
      makeLog({ goalkeeper_id: 'gk1', date: '2026-04-17', score: 3.0 }), // exactly 7 days ago
    ];
    const filtered = filterLogsByPeriod(logs, 7, today);
    expect(filtered).toHaveLength(1);
  });
});

// --- computeScore ---

describe('computeScore', () => {
  it('computes the mean of 5 dimensions', () => {
    expect(computeScore(5, 5, 5, 5, 5)).toBe(5.0);
    expect(computeScore(1, 1, 1, 1, 1)).toBe(1.0);
  });

  it('rounds to 1 decimal place', () => {
    // (4+3+3+4+3) / 5 = 17/5 = 3.4
    expect(computeScore(4, 3, 3, 4, 3)).toBe(3.4);
  });

  it('handles mixed values correctly', () => {
    // (5+1+3+2+4) / 5 = 15/5 = 3.0
    expect(computeScore(5, 1, 3, 2, 4)).toBe(3.0);
  });

  it('rounds .x5 correctly', () => {
    // (3+3+3+3+4) / 5 = 16/5 = 3.2
    expect(computeScore(3, 3, 3, 3, 4)).toBe(3.2);
  });
});
