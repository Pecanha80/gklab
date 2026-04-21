import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { WellnessLog } from '../types';
import { useAuth } from './useAuth';
import { useToast } from './useToast';

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function useWellness(goalkeeperId?: string) {
  const { user } = useAuth();
  const { showError } = useToast();
  const [logs, setLogs] = useState<WellnessLog[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = useCallback(async (gkId?: string) => {
    const targetId = gkId || goalkeeperId;
    if (!targetId || !user) return;

    setLoading(true);

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
      showError('Erro ao carregar registos de bem-estar');
    } finally {
      setLoading(false);
    }
  }, [goalkeeperId, user]);

  const getTodayLog = useCallback((gkId: string): WellnessLog | undefined => {
    const today = getTodayString();
    return logs.find(l => l.goalkeeper_id === gkId && l.date === today);
  }, [logs]);

  const saveWellnessLog = async (log: Omit<WellnessLog, 'id' | 'created_at' | 'score' | 'date'>) => {
    if (!user) return;

    const score = Math.round(((log.sleep + log.stress + log.fatigue + log.soreness + log.mood) / 5) * 10) / 10;
    const today = getTodayString();

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
          user_id: user.id,
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
      showError('Erro ao salvar bem-estar');
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
