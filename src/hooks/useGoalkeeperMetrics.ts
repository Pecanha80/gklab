import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Goalkeeper, WellnessLog, Attendance, TrainingSession } from '../types';

/**
 * Parse duration field (string | string[]) into minutes.
 * Handles formats: "60min", "dur_60min", "60 min", ["dur_15min", "dur_20min"]
 */
function parseDurationToMinutes(duration: string | string[]): number {
  const vals = Array.isArray(duration) ? duration : [duration];
  let total = 0;
  for (const v of vals) {
    const match = v.replace(/^dur_/, '').match(/(\d+)/);
    if (match) total += parseInt(match[1], 10);
  }
  return total || 60; // default 60min if unparseable
}

/**
 * Calculate goalkeeper metrics from wellness logs and RPE/attendance data.
 *
 * Form (0-100):     Weighted average of recent wellness scores (last 7 days).
 * Recovery (0-100): Based on last 3 days of sleep, stress, fatigue, soreness.
 * Load (0-100):     Rolling 7-day training load (RPE × duration in minutes).
 */
export function calculateMetrics(
  goalkeeper: Goalkeeper,
  wellnessLogs: WellnessLog[],
  attendanceRecords: Attendance[],
  sessions: TrainingSession[],
): { form: number; recovery: number; load: number } {
  const now = new Date();
  const day = 24 * 60 * 60 * 1000;

  // --- FORM: last 7 days of wellness scores ---
  const recent7 = wellnessLogs
    .filter(l => {
      const diff = now.getTime() - new Date(l.date).getTime();
      return diff >= 0 && diff <= 7 * day;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  let form = goalkeeper.form;
  if (recent7.length > 0) {
    const weights = [3, 2.5, 2, 1.5, 1, 0.75, 0.5];
    let weightedSum = 0;
    let totalWeight = 0;
    recent7.forEach((log, i) => {
      const w = weights[i] ?? 0.5;
      weightedSum += log.score * w;
      totalWeight += w;
    });
    const avgScore = weightedSum / totalWeight;
    form = Math.round(Math.min(100, Math.max(0, (avgScore / 5) * 100)));
  }

  // --- RECOVERY: last 3 days ---
  const recent3 = wellnessLogs
    .filter(l => {
      const diff = now.getTime() - new Date(l.date).getTime();
      return diff >= 0 && diff <= 3 * day;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  let recovery = goalkeeper.recovery;
  if (recent3.length > 0) {
    const weights = [3, 2, 1];
    let weightedSum = 0;
    let totalWeight = 0;
    recent3.forEach((log, i) => {
      const w = weights[i] ?? 1;
      const recoveryScore = (log.sleep + log.fatigue + log.soreness) / 3;
      weightedSum += recoveryScore * w;
      totalWeight += w;
    });
    const avgRecovery = weightedSum / totalWeight;
    recovery = Math.round(Math.min(100, Math.max(0, (avgRecovery / 5) * 100)));
  }

  // --- LOAD: 7-day cumulative RPE × duration ---
  const sessionsMap = new Map(sessions.map(s => [s.id, s]));
  const recent7Attendance = attendanceRecords.filter(a => {
    const session = sessionsMap.get(a.session_id);
    if (!session) return false;
    const diff = now.getTime() - new Date(session.date).getTime();
    return diff >= 0 && diff <= 7 * day && a.rpe && a.rpe > 0;
  });

  let load = goalkeeper.load;
  if (recent7Attendance.length > 0) {
    let totalLoad = 0;
    for (const att of recent7Attendance) {
      const session = sessionsMap.get(att.session_id);
      if (!session) continue;
      const durMin = parseDurationToMinutes(session.duration);
      totalLoad += (att.rpe || 0) * durMin;
    }
    const maxExpectedLoad = 7 * 10 * 90;
    load = Math.round(Math.min(100, Math.max(0, (totalLoad / maxExpectedLoad) * 100)));
  }

  return { form, recovery, load };
}

/**
 * Hook that provides a function to recalculate and update goalkeeper metrics.
 */
export function useGoalkeeperMetrics(
  updateGoalkeeper: (gk: Goalkeeper) => Promise<void>,
) {
  const recalculateMetrics = useCallback(async (goalkeeper: Goalkeeper) => {
    const [wellRes, attRes, sessRes] = await Promise.all([
      supabase.from('wellness_logs').select('*').eq('goalkeeper_id', goalkeeper.id),
      supabase.from('attendance').select('*').eq('goalkeeper_id', goalkeeper.id),
      supabase.from('sessions').select('*'),
    ]);

    const metrics = calculateMetrics(
      goalkeeper,
      wellRes.data || [],
      attRes.data || [],
      sessRes.data || [],
    );

    if (metrics.form !== goalkeeper.form || metrics.recovery !== goalkeeper.recovery || metrics.load !== goalkeeper.load) {
      await updateGoalkeeper({ ...goalkeeper, ...metrics });
    }

    return metrics;
  }, [updateGoalkeeper]);

  const recalculateAll = useCallback(async (goalkeepers: Goalkeeper[]) => {
    const [wellRes, attRes, sessRes] = await Promise.all([
      supabase.from('wellness_logs').select('*'),
      supabase.from('attendance').select('*'),
      supabase.from('sessions').select('*'),
    ]);

    const wellnessLogs = wellRes.data || [];
    const allAttendance = attRes.data || [];
    const sessions = sessRes.data || [];

    for (const gk of goalkeepers) {
      const gkLogs = wellnessLogs.filter(l => l.goalkeeper_id === gk.id);
      const gkAttendance = allAttendance.filter(a => a.goalkeeper_id === gk.id);
      const metrics = calculateMetrics(gk, gkLogs, gkAttendance, sessions);

      if (metrics.form !== gk.form || metrics.recovery !== gk.recovery || metrics.load !== gk.load) {
        await updateGoalkeeper({ ...gk, ...metrics });
      }
    }
  }, [updateGoalkeeper]);

  return { recalculateMetrics, recalculateAll };
}
