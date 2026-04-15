import { useState } from 'react';
import { useTranslation } from './useTranslation';
import { toDateString } from '../lib/utils';

export const ALL_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
export type DayKey = typeof ALL_DAYS[number];

export interface SavedMicrocycle {
  id: string;
  name: string;
  startDate: string;
  startDay: DayKey;
  endDay: DayKey;
  matchDay: DayKey | '';
}

export function useMicrocycle() {
  const { t, isPortuguese } = useTranslation();

  const [microcycleName, setMicrocycleName] = useState('');
  const [microcycleStartDate, setMicrocycleStartDate] = useState(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);
    return toDateString(monday);
  });
  const [microcycleStartDay, setMicrocycleStartDay] = useState<DayKey>('monday');
  const [microcycleEndDay, setMicrocycleEndDay] = useState<DayKey>('sunday');
  const [matchDay, setMatchDay] = useState<DayKey | ''>('');
  const [savedMicrocycles, setSavedMicrocycles] = useState<SavedMicrocycle[]>(() => {
    try { return JSON.parse(localStorage.getItem('gk_microcycles') || '[]'); } catch { return []; }
  });
  const [showMicrocycleHistory, setShowMicrocycleHistory] = useState(false);

  const getMicrocycleDays = () => {
    const startIdx = ALL_DAYS.indexOf(microcycleStartDay);
    const endIdx = ALL_DAYS.indexOf(microcycleEndDay);
    if (endIdx >= startIdx) {
      return ALL_DAYS.slice(startIdx, endIdx + 1);
    }
    return [...ALL_DAYS.slice(startIdx), ...ALL_DAYS.slice(0, endIdx + 1)];
  };

  const getDayDate = (dayKey: DayKey) => {
    const startDayIdx = ALL_DAYS.indexOf(microcycleStartDay);
    const dayIdx = ALL_DAYS.indexOf(dayKey);
    let offset = dayIdx - startDayIdx;
    if (offset < 0) offset += 7;
    const date = new Date(microcycleStartDate);
    date.setDate(date.getDate() + offset);
    return date;
  };

  const formatDayDate = (dayKey: DayKey) => {
    const date = getDayDate(dayKey);
    return date.getDate().toString();
  };

  const formatMonthLabel = (dayKey: DayKey) => {
    const date = getDayDate(dayKey);
    return date.toLocaleDateString(isPortuguese ? 'pt-BR' : 'en-US', { month: 'short' }).toUpperCase();
  };

  const getMatchDayLabel = (dayKey: string) => {
    if (!matchDay) return null;
    const days = getMicrocycleDays();
    const matchIdx = days.indexOf(matchDay as DayKey);
    const dayIdx = days.indexOf(dayKey as DayKey);
    if (matchIdx === -1 || dayIdx === -1) return null;
    const diff = dayIdx - matchIdx;
    if (diff === 0) return t('matchDayLabel');
    if (diff > 0) return `${t('md')}+${diff}`;
    return `${t('md')}${diff}`;
  };

  const saveMicrocycle = () => {
    if (!microcycleName.trim()) return;
    const mc: SavedMicrocycle = {
      id: crypto.randomUUID(),
      name: microcycleName,
      startDate: microcycleStartDate,
      startDay: microcycleStartDay,
      endDay: microcycleEndDay,
      matchDay,
    };
    const updated = [mc, ...savedMicrocycles];
    setSavedMicrocycles(updated);
    localStorage.setItem('gk_microcycles', JSON.stringify(updated));
  };

  const loadMicrocycle = (mc: SavedMicrocycle) => {
    setMicrocycleName(mc.name);
    setMicrocycleStartDate(mc.startDate);
    setMicrocycleStartDay(mc.startDay);
    setMicrocycleEndDay(mc.endDay);
    setMatchDay(mc.matchDay);
    setShowMicrocycleHistory(false);
  };

  const deleteMicrocycle = (id: string) => {
    const updated = savedMicrocycles.filter(m => m.id !== id);
    setSavedMicrocycles(updated);
    localStorage.setItem('gk_microcycles', JSON.stringify(updated));
  };

  return {
    microcycleName,
    setMicrocycleName,
    microcycleStartDate,
    setMicrocycleStartDate,
    microcycleStartDay,
    setMicrocycleStartDay,
    microcycleEndDay,
    setMicrocycleEndDay,
    matchDay,
    setMatchDay,
    savedMicrocycles,
    showMicrocycleHistory,
    setShowMicrocycleHistory,
    getMicrocycleDays,
    getDayDate,
    formatDayDate,
    formatMonthLabel,
    getMatchDayLabel,
    saveMicrocycle,
    loadMicrocycle,
    deleteMicrocycle,
    ALL_DAYS,
  };
}
