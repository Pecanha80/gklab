import { useState, useEffect } from 'react';
import { useTranslation } from './useTranslation';
import { useToast } from './useToast';
import { toDateString, parseDate } from '../lib/utils';
import { SavedMicrocycle } from '../types';

export const ALL_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
export type DayKey = typeof ALL_DAYS[number];

export function useMicrocycle(
  externalSavedMicrocycles: SavedMicrocycle[],
  onSave: (mc: Omit<SavedMicrocycle, 'id'>) => Promise<void>,
  onDelete: (id: string) => Promise<void>
) {
  const { t, isPortuguese } = useTranslation();
  const { showError } = useToast();

  const [microcycleName, setMicrocycleName] = useState('');
  const [microcycleStartDate, setMicrocycleStartDate] = useState(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);
    return toDateString(monday);
  });
  
  const [microcycleEndDate, setMicrocycleEndDate] = useState(() => {
    const start = new Date();
    const dayOfWeek = start.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const end = new Date(start);
    end.setDate(start.getDate() + (diff + 6)); // Default 7 days
    return toDateString(end);
  });

  const [matchDay, setMatchDay] = useState<string | null>(null);
  const [matchOpponent, setMatchOpponent] = useState('');
  const [matchLocation, setMatchLocation] = useState('');
  const [matchTime, setMatchTime] = useState('');
  const [matchCompetition, setMatchCompetition] = useState('');
  const [restDays, setRestDays] = useState<string[]>([]);
  const [mesocycle, setMesocycle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  const [showMicrocycleHistory, setShowMicrocycleHistory] = useState(false);

  const getMicrocycleDays = () => {
    const start = parseDate(microcycleStartDate);
    const end = parseDate(microcycleEndDate);
    const days: string[] = [];
    
    let current = new Date(start);
    // Limit to 31 days to avoid infinite loops or memory issues
    let count = 0;
    while (current <= end && count < 31) {
      days.push(toDateString(current));
      current.setDate(current.getDate() + 1);
      count++;
    }
    return days;
  };

  const getDayDate = (dateStr: string) => {
    return parseDate(dateStr);
  };

  const getDayKey = (date: Date): DayKey => {
    const jsDay = date.getDay();
    return ALL_DAYS[(jsDay + 6) % 7];
  };

  const formatDayDate = (dateStr: string) => {
    const date = getDayDate(dateStr);
    return date.getDate().toString();
  };

  const formatMonthLabel = (dateStr: string) => {
    const date = getDayDate(dateStr);
    return date.toLocaleDateString(isPortuguese ? 'pt-BR' : 'en-US', { month: 'short' }).toUpperCase();
  };

  const getMatchDayLabel = (dateStr: string) => {
    if (!matchDay) return null;
    const days = getMicrocycleDays();
    const matchIdx = days.indexOf(matchDay);
    const dayIdx = days.indexOf(dateStr);
    if (matchIdx === -1 || dayIdx === -1) return null;
    const diff = dayIdx - matchIdx;
    if (diff === 0) return t('matchDayLabel');
    if (diff > 0) return `${t('md')}+${diff}`;
    return `${t('md')}${diff}`;
  };
  
  const toggleRestDay = (dateStr: string) => {
    setRestDays(prev => 
      prev.includes(dateStr) 
        ? prev.filter(d => d !== dateStr) 
        : [...prev, dateStr]
    );
  };

  const saveMicrocycle = async () => {
    if (!microcycleName.trim()) return;
    setIsSaving(true);
    try {
      await onSave({
        name: microcycleName,
        startDate: microcycleStartDate,
        endDate: microcycleEndDate,
        matchDay,
        matchOpponent,
        matchLocation,
        matchTime,
        matchCompetition,
        restDays,
        mesocycle,
      });
      alert(isPortuguese ? 'Microciclo salvo com sucesso!' : 'Microcycle saved successfully!');
    } catch (err: any) {
      showError(isPortuguese ? 'Erro ao salvar microciclo' : 'Error saving microcycle');
    } finally {
      setIsSaving(false);
    }
  };

  const loadMicrocycle = (mc: SavedMicrocycle) => {
    setMicrocycleName(mc.name);
    setMicrocycleStartDate(mc.startDate);
    setMicrocycleEndDate(mc.endDate);
    setMatchDay(mc.matchDay);
    setMatchOpponent(mc.matchOpponent || '');
    setMatchLocation(mc.matchLocation || '');
    setMatchTime(mc.matchTime || '');
    setMatchCompetition(mc.matchCompetition || '');
    setRestDays(mc.restDays || []);
    setMesocycle(mc.mesocycle || '');
    setShowMicrocycleHistory(false);
  };

  // Auto-load the most recent microcycle when data is fetched from Supabase (only once)
  const [hasAutoLoaded, setHasAutoLoaded] = useState(false);
  useEffect(() => {
    if (externalSavedMicrocycles.length > 0 && !hasAutoLoaded) {
      loadMicrocycle(externalSavedMicrocycles[0]);
      setHasAutoLoaded(true);
    }
  }, [externalSavedMicrocycles]);

  const deleteMicrocycle = async (id: string) => {
    await onDelete(id);
  };

  return {
    microcycleName,
    setMicrocycleName,
    microcycleStartDate,
    setMicrocycleStartDate,
    microcycleEndDate,
    setMicrocycleEndDate,
    matchDay,
    setMatchDay,
    matchOpponent,
    setMatchOpponent,
    matchLocation,
    setMatchLocation,
    matchTime,
    setMatchTime,
    matchCompetition,
    setMatchCompetition,
    restDays,
    setRestDays,
    toggleRestDay,
    mesocycle,
    setMesocycle,
    isSaving,
    savedMicrocycles: externalSavedMicrocycles,
    showMicrocycleHistory,
    setShowMicrocycleHistory,
    getMicrocycleDays,
    getDayDate,
    getDayKey,
    formatDayDate,
    formatMonthLabel,
    getMatchDayLabel,
    saveMicrocycle,
    loadMicrocycle,
    deleteMicrocycle,
    ALL_DAYS,
  };
}
