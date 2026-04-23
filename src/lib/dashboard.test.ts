import { describe, it, expect } from 'vitest';
import {
  getMatchDayLabel,
  calculateSessionLoad,
  calculateWeeklyLoad,
  extractSessionPillars,
  getGoalkeeperDetailedStatus,
  getSessionCompleteness,
  getSessionIntensityLevel,
  resolveSessionMicrocycle,
  groupSessionsByMicrocycle,
  filterSessions,
} from './dashboard';
import type { TrainingSession, Goalkeeper, Attendance, SavedMicrocycle } from '../types';

// ──────────────────────────────────────────────
// 1. MD-X Label Calculation
// ──────────────────────────────────────────────
describe('getMatchDayLabel', () => {
  const days = ['2026-04-19', '2026-04-20', '2026-04-21', '2026-04-22', '2026-04-23', '2026-04-24', '2026-04-25'];
  const matchDay = '2026-04-24';

  it('returns "MD" for the match day itself', () => {
    expect(getMatchDayLabel('2026-04-24', matchDay, days)).toBe('MD');
  });

  it('returns "MD-1" for the day before match', () => {
    expect(getMatchDayLabel('2026-04-23', matchDay, days)).toBe('MD-1');
  });

  it('returns "MD-3" for three days before match', () => {
    expect(getMatchDayLabel('2026-04-21', matchDay, days)).toBe('MD-3');
  });

  it('returns "MD+1" for the day after match', () => {
    expect(getMatchDayLabel('2026-04-25', matchDay, days)).toBe('MD+1');
  });

  it('returns null when no match day is set', () => {
    expect(getMatchDayLabel('2026-04-21', null, days)).toBeNull();
  });

  it('returns null when the date is not in the microcycle', () => {
    expect(getMatchDayLabel('2026-05-01', matchDay, days)).toBeNull();
  });
});

// ──────────────────────────────────────────────
// 2. Session Load Calculation (RPE × Duration)
// ──────────────────────────────────────────────
describe('calculateSessionLoad', () => {
  it('calculates load as avgRPE × duration in minutes', () => {
    const result = calculateSessionLoad(75, 7);
    expect(result).toBe(525); // 75 * 7
  });

  it('returns 0 when duration is 0', () => {
    expect(calculateSessionLoad(0, 5)).toBe(0);
  });

  it('returns 0 when RPE is 0', () => {
    expect(calculateSessionLoad(60, 0)).toBe(0);
  });

  it('handles decimal RPE values', () => {
    expect(calculateSessionLoad(90, 6.5)).toBe(585);
  });
});

describe('calculateWeeklyLoad', () => {
  it('sums all session loads for a given list of sessions', () => {
    const sessions: Array<{ durationMinutes: number; avgRPE: number }> = [
      { durationMinutes: 75, avgRPE: 7 },
      { durationMinutes: 60, avgRPE: 5 },
      { durationMinutes: 90, avgRPE: 8 },
    ];
    // 525 + 300 + 720 = 1545
    expect(calculateWeeklyLoad(sessions)).toBe(1545);
  });

  it('returns 0 for empty array', () => {
    expect(calculateWeeklyLoad([])).toBe(0);
  });
});

// ──────────────────────────────────────────────
// 3. Session Pillars Extraction
// ──────────────────────────────────────────────
describe('extractSessionPillars', () => {
  it('identifies which pillars have content in a session', () => {
    const session = {
      objectives: {
        technical: 'Shot stopping',
        tactical: '',
        physical: 'Agility',
        cognitive: '',
      },
    } as unknown as TrainingSession;

    const pillars = extractSessionPillars(session);
    expect(pillars).toEqual({
      technical: true,
      tactical: false,
      physical: true,
      psychological: false,
    });
  });

  it('handles array objectives', () => {
    const session = {
      objectives: {
        technical: ['Diving', 'Positioning'],
        tactical: [],
        physical: [],
        cognitive: ['Decision making'],
      },
    } as unknown as TrainingSession;

    const pillars = extractSessionPillars(session);
    expect(pillars).toEqual({
      technical: true,
      tactical: false,
      physical: false,
      psychological: true,
    });
  });

  it('returns all false when no objectives exist', () => {
    const session = {
      objectives: {
        technical: '',
        tactical: '',
        physical: '',
        cognitive: '',
      },
    } as unknown as TrainingSession;

    const pillars = extractSessionPillars(session);
    expect(pillars).toEqual({
      technical: false,
      tactical: false,
      physical: false,
      psychological: false,
    });
  });
});

// ──────────────────────────────────────────────
// 4. Goalkeeper Detailed Status
// ──────────────────────────────────────────────
describe('getGoalkeeperDetailedStatus', () => {
  const baseGk: Goalkeeper = {
    id: '1',
    name: 'Test GK',
    category: 'firstTeam',
    status: 'Ready',
    form: 85,
    recovery: 90,
    load: 70,
    imageUrl: '',
  };

  it('returns basic info from goalkeeper data', () => {
    const status = getGoalkeeperDetailedStatus(baseGk, [], []);
    expect(status.name).toBe('Test GK');
    expect(status.form).toBe(85);
    expect(status.status).toBe('Ready');
  });

  it('calculates weekly training minutes from attendance records', () => {
    const sessions: Array<{ id: string; duration: string | string[]; date: string }> = [
      { id: 's1', duration: '75', date: '2026-04-20' },
      { id: 's2', duration: '60', date: '2026-04-21' },
    ];
    const attendance: Attendance[] = [
      { id: 'a1', session_id: 's1', goalkeeper_id: '1', status: 'present', created_at: '' },
      { id: 'a2', session_id: 's2', goalkeeper_id: '1', status: 'present', created_at: '' },
    ];

    const status = getGoalkeeperDetailedStatus(baseGk, sessions, attendance);
    expect(status.weeklyMinutes).toBe(135);
  });

  it('excludes sessions where GK was absent', () => {
    const sessions: Array<{ id: string; duration: string | string[]; date: string }> = [
      { id: 's1', duration: '75', date: '2026-04-20' },
      { id: 's2', duration: '60', date: '2026-04-21' },
    ];
    const attendance: Attendance[] = [
      { id: 'a1', session_id: 's1', goalkeeper_id: '1', status: 'present', created_at: '' },
      { id: 'a2', session_id: 's2', goalkeeper_id: '1', status: 'absent', created_at: '' },
    ];

    const status = getGoalkeeperDetailedStatus(baseGk, sessions, attendance);
    expect(status.weeklyMinutes).toBe(75);
  });

  it('calculates last RPE from most recent attendance', () => {
    const sessions: Array<{ id: string; duration: string | string[]; date: string }> = [
      { id: 's1', duration: '75', date: '2026-04-20' },
    ];
    const attendance: Attendance[] = [
      { id: 'a1', session_id: 's1', goalkeeper_id: '1', status: 'present', rpe: 7, created_at: '' },
    ];

    const status = getGoalkeeperDetailedStatus(baseGk, sessions, attendance);
    expect(status.lastRPE).toBe(7);
  });

  it('returns null lastRPE when no RPE data exists', () => {
    const status = getGoalkeeperDetailedStatus(baseGk, [], []);
    expect(status.lastRPE).toBeNull();
  });
});

// ──────────────────────────────────────────────
// 5. Duration parsing helper
// ──────────────────────────────────────────────
describe('parseDurationMinutes', () => {
  it('is used internally by other functions', () => {
    const sessions = [{ durationMinutes: 90, avgRPE: 6 }];
    expect(calculateWeeklyLoad(sessions)).toBe(540);
  });
});

// ──────────────────────────────────────────────
// 6. Session Completeness
// ──────────────────────────────────────────────
describe('getSessionCompleteness', () => {
  const makeSession = (overrides: Partial<TrainingSession> = {}): TrainingSession => ({
    id: '1',
    date: '2026-04-19',
    category: 'footwork',
    numAthletes: 3,
    duration: '75min',
    generalObjectives: ['Improve shot stopping'],
    objectives: { technical: 'Diving', tactical: '', physical: '', cognitive: '' },
    warmup: [{ id: 'w1', type: 'warmup', title: 'Warmup', objective: '', organization: '', execution: '', progression: '', successCriteria: '', duration: '10min', intensity: 'low' }],
    exercises: [{ id: 'e1', type: 'analytical', title: 'Drill 1', objective: '', organization: '', execution: '', progression: '', successCriteria: '', duration: '15min', intensity: 'medium' }],
    coolDown: 'Stretching',
    observations: { positives: 'Good', adjustments: '', individualEval: '' },
    titles: ['footwork'],
    ...overrides,
  } as TrainingSession);

  it('returns 100% for a fully complete session', () => {
    const session = makeSession();
    const result = getSessionCompleteness(session);
    expect(result.percentage).toBe(100);
    expect(result.isComplete).toBe(true);
  });

  it('returns lower percentage when exercises are missing', () => {
    const session = makeSession({ warmup: [], exercises: [] });
    const result = getSessionCompleteness(session);
    expect(result.percentage).toBeLessThan(100);
    expect(result.isComplete).toBe(false);
    expect(result.missing).toContain('exercises');
  });

  it('returns lower percentage when objectives are missing', () => {
    const session = makeSession({ generalObjectives: [] });
    const result = getSessionCompleteness(session);
    expect(result.percentage).toBeLessThan(100);
    expect(result.missing).toContain('objectives');
  });

  it('returns lower percentage when coolDown is missing', () => {
    const session = makeSession({ coolDown: '' });
    const result = getSessionCompleteness(session);
    expect(result.percentage).toBeLessThan(100);
    expect(result.missing).toContain('coolDown');
  });

  it('detects missing warmup', () => {
    const session = makeSession({ warmup: [] });
    const result = getSessionCompleteness(session);
    expect(result.missing).toContain('warmup');
  });
});

// ──────────────────────────────────────────────
// 7. Session Intensity Level
// ──────────────────────────────────────────────
describe('getSessionIntensityLevel', () => {
  const makeSession = (overrides: Partial<TrainingSession> = {}): TrainingSession => ({
    id: '1',
    date: '2026-04-19',
    category: 'footwork',
    numAthletes: 3,
    duration: '75min',
    generalObjectives: [],
    objectives: { technical: '', tactical: '', physical: '', cognitive: '' },
    warmup: [],
    exercises: [],
    coolDown: '',
    observations: { positives: '', adjustments: '', individualEval: '' },
    titles: [],
    ...overrides,
  } as TrainingSession);

  it('returns "high" when majority of exercises are high intensity', () => {
    const session = makeSession({
      exercises: [
        { id: '1', type: 'analytical', title: '', objective: '', organization: '', execution: '', progression: '', successCriteria: '', duration: '', intensity: 'high' },
        { id: '2', type: 'analytical', title: '', objective: '', organization: '', execution: '', progression: '', successCriteria: '', duration: '', intensity: 'high' },
        { id: '3', type: 'analytical', title: '', objective: '', organization: '', execution: '', progression: '', successCriteria: '', duration: '', intensity: 'medium' },
      ],
    });
    expect(getSessionIntensityLevel(session)).toBe('high');
  });

  it('returns "medium" when exercises are mixed', () => {
    const session = makeSession({
      exercises: [
        { id: '1', type: 'analytical', title: '', objective: '', organization: '', execution: '', progression: '', successCriteria: '', duration: '', intensity: 'low' },
        { id: '2', type: 'analytical', title: '', objective: '', organization: '', execution: '', progression: '', successCriteria: '', duration: '', intensity: 'high' },
      ],
    });
    expect(getSessionIntensityLevel(session)).toBe('medium');
  });

  it('returns "low" when all exercises are low intensity', () => {
    const session = makeSession({
      exercises: [
        { id: '1', type: 'analytical', title: '', objective: '', organization: '', execution: '', progression: '', successCriteria: '', duration: '', intensity: 'low' },
        { id: '2', type: 'analytical', title: '', objective: '', organization: '', execution: '', progression: '', successCriteria: '', duration: '', intensity: 'low' },
      ],
    });
    expect(getSessionIntensityLevel(session)).toBe('low');
  });

  it('returns null when no exercises exist', () => {
    const session = makeSession({ exercises: [] });
    expect(getSessionIntensityLevel(session)).toBeNull();
  });
});

// ──────────────────────────────────────────────
// 8. Resolve Session Microcycle
// ──────────────────────────────────────────────
describe('resolveSessionMicrocycle', () => {
  const microcycles: SavedMicrocycle[] = [
    {
      id: 'mc1',
      name: 'Semana 1',
      startDate: '2026-04-14',
      endDate: '2026-04-20',
      matchDay: '2026-04-20',
      matchOpponent: 'Al Shahania',
      mesocycle: 'Pre-Season',
    },
    {
      id: 'mc2',
      name: 'Semana 2',
      startDate: '2026-04-21',
      endDate: '2026-04-27',
      matchDay: '2026-04-27',
      mesocycle: 'Pre-Season',
    },
  ];

  it('returns the matching microcycle for a date within range', () => {
    const result = resolveSessionMicrocycle('2026-04-19', microcycles);
    expect(result).not.toBeNull();
    expect(result!.name).toBe('Semana 1');
    expect(result!.mesocycle).toBe('Pre-Season');
  });

  it('returns the second microcycle for a date in its range', () => {
    const result = resolveSessionMicrocycle('2026-04-25', microcycles);
    expect(result).not.toBeNull();
    expect(result!.name).toBe('Semana 2');
  });

  it('returns null when date is outside all microcycles', () => {
    const result = resolveSessionMicrocycle('2026-05-10', microcycles);
    expect(result).toBeNull();
  });

  it('returns null when microcycles array is empty', () => {
    const result = resolveSessionMicrocycle('2026-04-19', []);
    expect(result).toBeNull();
  });

  it('matches on boundary dates (start and end)', () => {
    const resultStart = resolveSessionMicrocycle('2026-04-14', microcycles);
    const resultEnd = resolveSessionMicrocycle('2026-04-20', microcycles);
    expect(resultStart!.name).toBe('Semana 1');
    expect(resultEnd!.name).toBe('Semana 1');
  });
});

// ──────────────────────────────────────────────
// 9. Group Sessions by Microcycle
// ──────────────────────────────────────────────
describe('groupSessionsByMicrocycle', () => {
  const microcycles: SavedMicrocycle[] = [
    { id: 'mc1', name: 'Semana 1', startDate: '2026-04-14', endDate: '2026-04-20', matchDay: '2026-04-20', mesocycle: 'Pre-Season' },
    { id: 'mc2', name: 'Semana 2', startDate: '2026-04-21', endDate: '2026-04-27', matchDay: '2026-04-27', mesocycle: 'Pre-Season' },
  ];

  const makeSession = (id: string, date: string): TrainingSession => ({
    id, date, category: 'footwork', numAthletes: 3, duration: '75min',
    generalObjectives: [], objectives: { technical: '', tactical: '', physical: '', cognitive: '' },
    warmup: [], exercises: [], coolDown: '', observations: { positives: '', adjustments: '', individualEval: '' }, titles: [],
  } as unknown as TrainingSession);

  it('groups sessions under their microcycle', () => {
    const sessions = [
      makeSession('s1', '2026-04-15'),
      makeSession('s2', '2026-04-18'),
      makeSession('s3', '2026-04-22'),
    ];

    const groups = groupSessionsByMicrocycle(sessions, microcycles);
    expect(groups).toHaveLength(2);
    // Sorted by startDate descending (most recent microcycle first)
    expect(groups[0].microcycle.name).toBe('Semana 2');
    expect(groups[0].sessions).toHaveLength(1);
    expect(groups[1].microcycle.name).toBe('Semana 1');
    expect(groups[1].sessions).toHaveLength(2);
  });

  it('puts unmatched sessions in an "Other" group', () => {
    const sessions = [
      makeSession('s1', '2026-04-15'),
      makeSession('s2', '2026-05-10'), // outside any microcycle
    ];

    const groups = groupSessionsByMicrocycle(sessions, microcycles);
    const otherGroup = groups.find(g => g.microcycle.name === 'other');
    expect(otherGroup).toBeDefined();
    expect(otherGroup!.sessions).toHaveLength(1);
    expect(otherGroup!.sessions[0].id).toBe('s2');
  });

  it('returns empty array when no sessions', () => {
    const groups = groupSessionsByMicrocycle([], microcycles);
    expect(groups).toHaveLength(0);
  });

  it('sorts sessions within each group by date descending', () => {
    const sessions = [
      makeSession('s1', '2026-04-15'),
      makeSession('s2', '2026-04-18'),
      makeSession('s3', '2026-04-14'),
    ];

    const groups = groupSessionsByMicrocycle(sessions, microcycles);
    expect(groups[0].sessions[0].id).toBe('s2'); // 18th first (descending)
    expect(groups[0].sessions[2].id).toBe('s3'); // 14th last
  });
});

// ──────────────────────────────────────────────
// 10. Filter Sessions
// ──────────────────────────────────────────────
describe('filterSessions', () => {
  const makeSession = (id: string, date: string, category: string | string[], titles: string[]): TrainingSession => ({
    id, date, category, numAthletes: 3, duration: '75min',
    generalObjectives: [], objectives: { technical: '', tactical: '', physical: '', cognitive: '' },
    warmup: [], exercises: [], coolDown: '', observations: { positives: '', adjustments: '', individualEval: '' }, titles,
  } as unknown as TrainingSession);

  const sessions = [
    makeSession('s1', '2026-04-15', 'footwork', ['footwork']),
    makeSession('s2', '2026-04-18', ['shotStopping', 'crosses'], ['shotStopping']),
    makeSession('s3', '2026-04-22', 'distribution', ['distribution']),
  ];

  it('returns all sessions when no filter is applied', () => {
    const result = filterSessions(sessions, {});
    expect(result).toHaveLength(3);
  });

  it('filters by category', () => {
    const result = filterSessions(sessions, { category: 'footwork' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('s1');
  });

  it('filters by category within array categories', () => {
    const result = filterSessions(sessions, { category: 'shotStopping' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('s2');
  });

  it('filters by date range', () => {
    const result = filterSessions(sessions, { dateFrom: '2026-04-16', dateTo: '2026-04-25' });
    expect(result).toHaveLength(2);
  });

  it('filters by search term in titles', () => {
    const result = filterSessions(sessions, { searchTerm: 'distribution' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('s3');
  });

  it('combines multiple filters', () => {
    const result = filterSessions(sessions, { category: 'footwork', dateFrom: '2026-04-10', dateTo: '2026-04-20' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('s1');
  });
});
