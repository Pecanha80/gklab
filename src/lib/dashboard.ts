import type { TrainingSession, Goalkeeper, Attendance, SavedMicrocycle } from '../types';
import { parseDate } from './utils';

// ──────────────────────────────────────────────
// 1. MD-X Label — Match Day relative reference
// ──────────────────────────────────────────────

/**
 * Returns match-day relative label (MD-3, MD-2, MD-1, MD, MD+1, etc.)
 * for a given date within a microcycle.
 */
export function getMatchDayLabel(
  dateStr: string,
  matchDay: string | null,
  microcycleDays: string[]
): string | null {
  if (!matchDay) return null;

  const matchIdx = microcycleDays.indexOf(matchDay);
  const dayIdx = microcycleDays.indexOf(dateStr);

  if (matchIdx === -1 || dayIdx === -1) return null;

  const diff = dayIdx - matchIdx;
  if (diff === 0) return 'MD';
  if (diff > 0) return `MD+${diff}`;
  return `MD${diff}`;
}

// ──────────────────────────────────────────────
// 2. Session Load Calculation (sRPE method)
// ──────────────────────────────────────────────

/**
 * Calculates session load using the sRPE method:
 * Load = duration (minutes) × average RPE
 */
export function calculateSessionLoad(durationMinutes: number, avgRPE: number): number {
  return durationMinutes * avgRPE;
}

/**
 * Calculates total weekly load from an array of session load data.
 */
export function calculateWeeklyLoad(
  sessions: Array<{ durationMinutes: number; avgRPE: number }>
): number {
  return sessions.reduce(
    (total, s) => total + calculateSessionLoad(s.durationMinutes, s.avgRPE),
    0
  );
}

// ──────────────────────────────────────────────
// 3. Session Pillars Extraction
// ──────────────────────────────────────────────

export interface SessionPillars {
  technical: boolean;
  tactical: boolean;
  physical: boolean;
  psychological: boolean;
}

/**
 * Determines which of the 4 GK training pillars are addressed in a session.
 * Maps the session's `cognitive` field to `psychological` (UEFA terminology).
 */
export function extractSessionPillars(session: TrainingSession): SessionPillars {
  const objs = session.generalObjectives ?? [];
  // If the session has general objectives, assume all pillars are covered
  // since general objectives typically span multiple pillar categories
  const hasObjectives = objs.length > 0;
  return {
    technical: hasObjectives,
    tactical: hasObjectives,
    physical: hasObjectives,
    psychological: hasObjectives,
  };
}

// ──────────────────────────────────────────────
// 4. Goalkeeper Detailed Status
// ──────────────────────────────────────────────

export interface GoalkeeperDetailedStatus {
  name: string;
  form: number;
  status: string;
  weeklyMinutes: number;
  lastRPE: number | null;
}

/**
 * Builds a detailed status summary for a goalkeeper,
 * including weekly training minutes and last RPE.
 */
export function getGoalkeeperDetailedStatus(
  gk: Goalkeeper,
  sessions: Array<{ id: string; duration: string | string[]; date: string }>,
  attendance: Attendance[]
): GoalkeeperDetailedStatus {
  // Filter attendance for this goalkeeper where they were present
  const presentAttendance = attendance.filter(
    a => a.goalkeeper_id === gk.id && (a.status === 'present' || a.status === 'late')
  );

  // Calculate weekly minutes
  const weeklyMinutes = presentAttendance.reduce((total, att) => {
    const session = sessions.find(s => s.id === att.session_id);
    if (!session) return total;
    const dur = parseDurationMinutes(session.duration);
    return total + dur;
  }, 0);

  // Find last RPE (from most recent attendance with RPE)
  const withRPE = presentAttendance.filter(a => a.rpe != null);
  const lastRPE = withRPE.length > 0 ? withRPE[withRPE.length - 1].rpe! : null;

  return {
    name: gk.name,
    form: gk.form,
    status: gk.status,
    weeklyMinutes,
    lastRPE,
  };
}

// ──────────────────────────────────────────────
// 5. Session Completeness
// ──────────────────────────────────────────────

export interface SessionCompleteness {
  percentage: number;
  isComplete: boolean;
  missing: string[];
}

/**
 * Evaluates how complete a training session is.
 * Checks for essential fields a UEFA A coach would require.
 */
export function getSessionCompleteness(session: TrainingSession): SessionCompleteness {
  const missing: string[] = [];

  const hasContent = (value: unknown): boolean => {
    if (!value) return false;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'string') return value.trim().length > 0;
    return true;
  };

  const checks = [
    { key: 'category', valid: hasContent(session.category) },
    { key: 'duration', valid: hasContent(session.duration) },
    { key: 'objectives', valid: hasContent(session.generalObjectives) },
    { key: 'warmup', valid: Array.isArray(session.warmup) && session.warmup.length > 0 },
    { key: 'exercises', valid: Array.isArray(session.exercises) && session.exercises.length > 0 },
    { key: 'coolDown', valid: hasContent(session.coolDown) },
    { key: 'observations', valid: hasContent(session.observations?.positives) || hasContent(session.observations?.adjustments) },
  ];

  checks.forEach(c => {
    if (!c.valid) missing.push(c.key);
  });

  const filled = checks.filter(c => c.valid).length;
  const percentage = Math.round((filled / checks.length) * 100);

  return {
    percentage,
    isComplete: missing.length === 0,
    missing,
  };
}

// ──────────────────────────────────────────────
// 6. Session Intensity Level
// ──────────────────────────────────────────────

/**
 * Determines overall session intensity from exercise intensities.
 * Uses weighted average: high=3, medium=2, low=1.
 */
export function getSessionIntensityLevel(
  session: TrainingSession
): 'high' | 'medium' | 'low' | null {
  const allExercises = [...(session.warmup || []), ...(session.exercises || [])];
  if (allExercises.length === 0) return null;

  const intensityMap = { high: 3, medium: 2, low: 1 };
  const total = allExercises.reduce(
    (sum, ex) => sum + (intensityMap[ex.intensity] || 2),
    0
  );
  const avg = total / allExercises.length;

  if (avg >= 2.5) return 'high';
  if (avg >= 1.5) return 'medium';
  return 'low';
}

// ──────────────────────────────────────────────
// 7. Resolve Session Microcycle
// ──────────────────────────────────────────────

export interface ResolvedMicrocycle {
  id: string;
  name: string;
  mesocycle?: string;
  matchDay: string | null;
}

/**
 * Finds which microcycle a session date falls within.
 */
export function resolveSessionMicrocycle(
  sessionDate: string,
  microcycles: SavedMicrocycle[]
): ResolvedMicrocycle | null {
  if (microcycles.length === 0) return null;

  const date = parseDate(sessionDate);

  const match = microcycles.find(mc => {
    const start = parseDate(mc.startDate);
    const end = parseDate(mc.endDate);
    return date >= start && date <= end;
  });

  if (!match) return null;

  return {
    id: match.id,
    name: match.name,
    mesocycle: match.mesocycle,
    matchDay: match.matchDay,
  };
}

// ──────────────────────────────────────────────
// 8. Group Sessions by Microcycle
// ──────────────────────────────────────────────

export interface SessionGroup {
  microcycle: ResolvedMicrocycle;
  sessions: TrainingSession[];
}

/**
 * Groups sessions by their microcycle. Sessions outside any microcycle
 * are grouped under an "other" bucket.
 */
export function groupSessionsByMicrocycle(
  sessions: TrainingSession[],
  microcycles: SavedMicrocycle[]
): SessionGroup[] {
  if (sessions.length === 0) return [];

  const groupMap = new Map<string, SessionGroup>();

  for (const session of sessions) {
    const resolved = resolveSessionMicrocycle(session.date, microcycles);
    const key = resolved?.id ?? '__other__';

    if (!groupMap.has(key)) {
      groupMap.set(key, {
        microcycle: resolved ?? { id: '__other__', name: 'other', matchDay: null },
        sessions: [],
      });
    }
    groupMap.get(key)!.sessions.push(session);
  }

  // Sort sessions within each group by date descending
  for (const group of groupMap.values()) {
    group.sessions.sort((a, b) => b.date.localeCompare(a.date));
  }

  // Sort groups: named microcycles first (by startDate desc), "other" last
  return Array.from(groupMap.values()).sort((a, b) => {
    if (a.microcycle.id === '__other__') return 1;
    if (b.microcycle.id === '__other__') return -1;
    // Find original microcycles to sort by startDate
    const mcA = microcycles.find(m => m.id === a.microcycle.id);
    const mcB = microcycles.find(m => m.id === b.microcycle.id);
    if (mcA && mcB) return mcB.startDate.localeCompare(mcA.startDate);
    return 0;
  });
}

// ──────────────────────────────────────────────
// 9. Filter Sessions
// ──────────────────────────────────────────────

export interface SessionFilter {
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  searchTerm?: string;
  microcycleId?: string;
}

/**
 * Filters sessions by category, date range, and/or search term.
 */
export function filterSessions(
  sessions: TrainingSession[],
  filter: SessionFilter
): TrainingSession[] {
  return sessions.filter(session => {
    // Category filter
    if (filter.category) {
      const cats = parseCategory(session.category);
      if (!cats.includes(filter.category)) return false;
    }

    // Date range filter
    if (filter.dateFrom && session.date < filter.dateFrom) return false;
    if (filter.dateTo && session.date > filter.dateTo) return false;

    // Search term in titles
    if (filter.searchTerm) {
      const term = filter.searchTerm.toLowerCase();
      const titles = (session.titles || []).join(' ').toLowerCase();
      const cats = parseCategory(session.category).join(' ').toLowerCase();
      if (!titles.includes(term) && !cats.includes(term)) return false;
    }

    return true;
  });
}

// ──────────────────────────────────────────────
// 10. Format Microcycle Label
// ──────────────────────────────────────────────

/**
 * Formats a microcycle for display in dropdowns: "Name (DD/MM - DD/MM)"
 */
export function formatMicrocycleLabel(mc: SavedMicrocycle): string {
  const start = parseDate(mc.startDate);
  const end = parseDate(mc.endDate);
  const fmt = (d: Date) =>
    `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  return `${mc.name} (${fmt(start)} - ${fmt(end)})`;
}

// ──────────────────────────────────────────────
// 11. Parse Category
// ──────────────────────────────────────────────

/**
 * Normalizes a category field that may be a string, JSON string, or array
 * into a clean string array.
 */
export function parseCategory(category: string | string[]): string[] {
  if (Array.isArray(category)) return category.filter(Boolean);
  if (!category || category.trim() === '') return [];

  // Try JSON parse (handles '["firstTeam"]' and '"["firstTeam"]"')
  let cleaned = category.trim();
  // Strip outer quotes if double-stringified
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    cleaned = cleaned.slice(1, -1);
  }
  if (cleaned.startsWith('[')) {
    try {
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch { /* fall through */ }
  }

  // Comma-separated
  if (cleaned.includes(',')) {
    return cleaned.split(',').map(s => s.trim()).filter(Boolean);
  }

  return [cleaned];
}

// ──────────────────────────────────────────────
// Internal helpers
// ──────────────────────────────────────────────

/**
 * Parses a duration field (string or string[]) into total minutes.
 */
function parseDurationMinutes(duration: string | string[]): number {
  const values = Array.isArray(duration) ? duration : [duration];
  return values.reduce((sum, d) => {
    const match = d.match(/(\d+)/);
    return sum + (match ? parseInt(match[1], 10) : 0);
  }, 0);
}
