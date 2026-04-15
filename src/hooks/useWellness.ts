import { useState, useCallback } from 'react';
import { supabase, hasSupabaseConfig } from '../lib/supabase';
import type { WellnessLog } from '../types';

const STORAGE_KEY = 'gk_wellness_logs';

function loadFromStorage(): WellnessLog[] {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      console.error('Failed to parse wellness logs from localStorage');
    }
  }
  return [];
}

function saveToStorage(data: WellnessLog[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function useWellness(goalkeeperId?: string) {
  const [logs, setLogs] = useState<WellnessLog[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = useCallback(async (gkId?: string) => {
    const targetId = gkId || goalkeeperId;
    if (!targetId) return;

    setLoading(true);

    if (!hasSupabaseConfig) {
      const all = loadFromStorage();
      setLogs(all.filter(l => l.goalkeeper_id === targetId));
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('wellness_logs')
        .select('*')
        .eq('goalkeeper_id', targetId)
        .order('date', { ascending: false })
        .limit(30);

      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      console.error('Error fetching wellness logs:', err);
      // Fallback to local
      const all = loadFromStorage();
      setLogs(all.filter(l => l.goalkeeper_id === targetId));
    } finally {
      setLoading(false);
    }
  }, [goalkeeperId]);

  const getTodayLog = useCallback((gkId: string): WellnessLog | undefined => {
    const today = getTodayString();
    return logs.find(l => l.goalkeeper_id === gkId && l.date === today);
  }, [logs]);

  const saveWellnessLog = async (log: Omit<WellnessLog, 'id' | 'created_at' | 'score' | 'date'>) => {
    const score = Math.round(((log.sleep + log.stress + log.fatigue + log.soreness + log.mood) / 5) * 10) / 10;
    const today = getTodayString();

    if (!hasSupabaseConfig) {
      const all = loadFromStorage();
      // Check if there's already a log for this GK today
      const existingIdx = all.findIndex(
        l => l.goalkeeper_id === log.goalkeeper_id && l.date === today
      );

      const record: WellnessLog = {
        id: existingIdx >= 0 ? all[existingIdx].id : crypto.randomUUID(),
        ...log,
        date: today,
        score,
        created_at: existingIdx >= 0 ? all[existingIdx].created_at : new Date().toISOString(),
      };

      if (existingIdx >= 0) {
        all[existingIdx] = record;
      } else {
        all.unshift(record);
      }
      saveToStorage(all);

      setLogs(prev => {
        const idx = prev.findIndex(l => l.id === record.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = record;
          return updated;
        }
        return [record, ...prev];
      });

      return record;
    }

    try {
      const { data, error } = await supabase
        .from('wellness_logs')
        .upsert({
          goalkeeper_id: log.goalkeeper_id,
          date: today,
          sleep: log.sleep,
          stress: log.stress,
          fatigue: log.fatigue,
          soreness: log.soreness,
          mood: log.mood,
          score,
          notes: log.notes,
        }, {
          onConflict: 'goalkeeper_id,date'
        })
        .select()
        .single();

      if (error) throw error;

      setLogs(prev => {
        const idx = prev.findIndex(l => l.goalkeeper_id === log.goalkeeper_id && l.date === today);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = data;
          return updated;
        }
        return [data, ...prev];
      });

      return data;
    } catch (err) {
      console.error('Error saving wellness log:', err);
      throw err;
    }
  };

  return {
    logs,
    loading,
    fetchLogs,
    getTodayLog,
    saveWellnessLog,
  };
}
