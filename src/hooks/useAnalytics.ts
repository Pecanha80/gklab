import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { getTodayDateString } from '../lib/utils';
import { parseCategory } from '../lib/dashboard';
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
} from '../lib/analytics';
import type { TrainingSession, Goalkeeper, Attendance, WellnessLog, SavedMicrocycle } from '../types';

export type PeriodFilter = 'week' | 'month' | '3months' | 'all';

function getDateRange(period: PeriodFilter): { from: string; to: string } {
  const to = getTodayDateString();
  const d = new Date();
  switch (period) {
    case 'week':
      d.setDate(d.getDate() - 7);
      break;
    case 'month':
      d.setDate(d.getDate() - 30);
      break;
    case '3months':
      d.setDate(d.getDate() - 90);
      break;
    case 'all':
      return { from: '2000-01-01', to };
  }
  const from = d.toISOString().split('T')[0];
  return { from, to };
}

function getPeriodDays(period: PeriodFilter, microcycle?: SavedMicrocycle): number {
  if (microcycle) {
    const start = new Date(microcycle.startDate);
    const end = new Date(microcycle.endDate);
    return Math.max(Math.ceil((end.getTime() - start.getTime()) / 86400000), 1);
  }
  switch (period) {
    case 'week': return 7;
    case 'month': return 30;
    case '3months': return 90;
    case 'all': return 365;
  }
}

export function useAnalytics() {
  const { user } = useAuth();

  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [goalkeepers, setGoalkeepers] = useState<Goalkeeper[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [wellnessLogs, setWellnessLogs] = useState<WellnessLog[]>([]);
  const [savedMicrocycles, setSavedMicrocycles] = useState<SavedMicrocycle[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [selectedGkId, setSelectedGkId] = useState<'all' | string>('all');
  const [period, setPeriod] = useState<PeriodFilter>('all');
  const [selectedCategory, setSelectedCategory] = useState<'all' | string>('all');
  const [selectedMesocycle, setSelectedMesocycle] = useState<'all' | string>('all');
  const [selectedMicrocycle, setSelectedMicrocycle] = useState<'all' | string>('all');

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const [sessRes, gkRes, attRes, wellRes] = await Promise.all([
        supabase.from('sessions').select('*').eq('user_id', user.id),
        supabase.from('goalkeepers').select('*').eq('user_id', user.id),
        supabase.from('attendance').select('*').eq('user_id', user.id),
        supabase.from('wellness_logs').select('*').eq('user_id', user.id),
      ]);
      setSessions((sessRes.data as TrainingSession[] | null) ?? []);
      setGoalkeepers((gkRes.data as Goalkeeper[] | null) ?? []);
      setAttendance((attRes.data as Attendance[] | null) ?? []);
      setWellnessLogs((wellRes.data as WellnessLog[] | null) ?? []);

      // Microcycles may not exist yet — fetch separately to avoid blocking
      try {
        const mcRes = await supabase.from('microcycles').select('*').order('created_at', { ascending: false }).limit(50);
        const rawMc = ((mcRes.data as SavedMicrocycle[] | null) ?? []).filter(m => m.startDate && m.endDate);
        setSavedMicrocycles(rawMc.sort((a, b) => a.startDate.localeCompare(b.startDate)));
      } catch {
        // Table may not exist; continue without microcycles
      }
      setLoading(false);
    };
    load();
  }, [user]);

  // Unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    for (const s of sessions) {
      for (const c of parseCategory(s.category)) cats.add(c);
    }
    return Array.from(cats).sort();
  }, [sessions]);

  // Mesocycles derived from saved microcycles
  const mesocycles = useMemo(() => {
    const set = new Set<string>();
    for (const mc of savedMicrocycles) {
      if (mc.mesocycle) set.add(mc.mesocycle);
    }
    // Also check session-level mesocycle
    for (const s of sessions) {
      if (s.mesocycle) set.add(s.mesocycle);
    }
    return Array.from(set).sort();
  }, [savedMicrocycles, sessions]);

  // Microcycles for filter (name + date range)
  const microcycles = useMemo(() => savedMicrocycles, [savedMicrocycles]);

  // Determine active date range based on filters
  const activeDateRange = useMemo((): { from: string; to: string } => {
    // Microcycle takes precedence
    if (selectedMicrocycle !== 'all') {
      const mc = savedMicrocycles.find(m => m.id === selectedMicrocycle);
      if (mc) return { from: mc.startDate, to: mc.endDate };
    }
    // Mesocycle: find all microcycles in that mesocycle and span from first start to last end
    if (selectedMesocycle !== 'all') {
      const mcsInMeso = savedMicrocycles.filter(m => m.mesocycle === selectedMesocycle);
      if (mcsInMeso.length > 0) {
        const from = mcsInMeso[0].startDate;
        const to = mcsInMeso[mcsInMeso.length - 1].endDate;
        return { from, to };
      }
      // fallback: filter sessions by mesocycle field (no date range)
    }
    return getDateRange(period);
  }, [selectedMicrocycle, selectedMesocycle, savedMicrocycles, period]);

  const activePeriodDays = useMemo(() => {
    if (selectedMicrocycle !== 'all') {
      const mc = savedMicrocycles.find(m => m.id === selectedMicrocycle);
      return getPeriodDays(period, mc);
    }
    if (selectedMesocycle !== 'all') {
      const start = new Date(activeDateRange.from);
      const end = new Date(activeDateRange.to);
      return Math.max(Math.ceil((end.getTime() - start.getTime()) / 86400000), 1);
    }
    return getPeriodDays(period);
  }, [selectedMicrocycle, selectedMesocycle, activeDateRange, savedMicrocycles, period]);

  // Filtered sessions
  const filteredSessions = useMemo(() => {
    let result = filterSessionsByPeriod(sessions, activeDateRange.from, activeDateRange.to);
    result = filterSessionsByCategory(result, selectedCategory);
    if (selectedMesocycle !== 'all' && savedMicrocycles.filter(m => m.mesocycle === selectedMesocycle).length === 0) {
      // If mesocycle selected but no microcycles match it, filter by session mesocycle field
      result = filterSessionsByMesocycle(result, selectedMesocycle);
    }
    if (selectedGkId !== 'all') {
      result = filterSessionsByGoalkeeper(result, attendance, selectedGkId);
    }
    return result;
  }, [sessions, activeDateRange, selectedCategory, selectedMesocycle, selectedGkId, attendance, savedMicrocycles]);

  // Filtered wellness logs
  const filteredWellnessLogs = useMemo(() => {
    return wellnessLogs.filter(l => l.date >= activeDateRange.from && l.date <= activeDateRange.to);
  }, [wellnessLogs, activeDateRange]);

  // Filtered attendance
  const filteredAttendance = useMemo(() => {
    const sessionIds = new Set(filteredSessions.map(s => s.id));
    return attendance.filter(a => sessionIds.has(a.session_id));
  }, [filteredSessions, attendance]);

  // All exercises
  const allExercises = useMemo(() => collectAllExercises(filteredSessions), [filteredSessions]);

  // Summary stats
  const summaryStats = useMemo(
    () => computeSummaryStats(filteredSessions, allExercises, filteredAttendance, filteredWellnessLogs, activePeriodDays),
    [filteredSessions, allExercises, filteredAttendance, filteredWellnessLogs, activePeriodDays],
  );

  // Chart data
  const exerciseTypeData = useMemo(() => computeExerciseTypeDistribution(allExercises), [allExercises]);
  const physicalCapacityData = useMemo(() => computePhysicalCapacityDistribution(allExercises), [allExercises]);
  const topDrillsData = useMemo(() => computeTopDrills(allExercises), [allExercises]);
  const gameMomentsData = useMemo(() => computeGameMomentsCoverage(filteredSessions, allExercises), [filteredSessions, allExercises]);
  const objectivesData = useMemo(() => computeObjectivesFrequency(filteredSessions), [filteredSessions]);
  const tacticalPrinciplesData = useMemo(() => computeTacticalPrinciplesCoverage(filteredSessions), [filteredSessions]);
  const intensityDistributionData = useMemo(() => computeIntensityDistribution(allExercises), [allExercises]);
  const contextDistributionData = useMemo(() => computeContextDistribution(filteredSessions), [filteredSessions]);
  const weeklyVolumeData = useMemo(() => computeWeeklyVolume(filteredSessions), [filteredSessions]);

  const wellnessTrendData = useMemo(
    () => computeWellnessTrend(filteredWellnessLogs, selectedGkId === 'all' ? undefined : selectedGkId),
    [filteredWellnessLogs, selectedGkId],
  );

  const rpeLoadTrendData = useMemo(
    () => computeRpeLoadTrend(filteredSessions, attendance, selectedGkId === 'all' ? undefined : selectedGkId),
    [filteredSessions, attendance, selectedGkId],
  );

  return {
    loading,
    // Filters
    selectedGkId, setSelectedGkId,
    period, setPeriod,
    selectedCategory, setSelectedCategory,
    selectedMesocycle, setSelectedMesocycle,
    selectedMicrocycle, setSelectedMicrocycle,
    // Reference data
    goalkeepers,
    categories,
    mesocycles,
    microcycles,
    // Summary
    totalSessions: filteredSessions.length,
    totalExercises: allExercises.length,
    summaryStats,
    // Chart data
    exerciseTypeData,
    physicalCapacityData,
    topDrillsData,
    gameMomentsData,
    objectivesData,
    tacticalPrinciplesData,
    intensityDistributionData,
    contextDistributionData,
    weeklyVolumeData,
    wellnessTrendData,
    rpeLoadTrendData,
  };
}
