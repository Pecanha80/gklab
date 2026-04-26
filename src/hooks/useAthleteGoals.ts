import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import type { DevelopmentGoal } from '../types';

export function useAthleteGoals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<DevelopmentGoal[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchGoals = useCallback(async (goalkeeperId: string) => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('development_goals')
        .select('*')
        .eq('goalkeeper_id', goalkeeperId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch {
      setGoals([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const addGoal = useCallback(async (goalkeeperId: string, data: Omit<DevelopmentGoal, 'id' | 'user_id' | 'goalkeeper_id' | 'created_at'>) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('development_goals').insert({
        user_id: user.id,
        goalkeeper_id: goalkeeperId,
        ...data,
      });
      if (error) throw error;
      await fetchGoals(goalkeeperId);
    } catch {
      // silent fail
    }
  }, [user, fetchGoals]);

  const updateGoal = useCallback(async (goalId: string, goalkeeperId: string, data: Partial<DevelopmentGoal>) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('development_goals')
        .update(data)
        .eq('id', goalId);
      if (error) throw error;
      await fetchGoals(goalkeeperId);
    } catch {
      // silent fail
    }
  }, [user, fetchGoals]);

  const deleteGoal = useCallback(async (goalId: string, goalkeeperId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('development_goals')
        .delete()
        .eq('id', goalId);
      if (error) throw error;
      await fetchGoals(goalkeeperId);
    } catch {
      // silent fail
    }
  }, [user, fetchGoals]);

  return { goals, loading, fetchGoals, addGoal, updateGoal, deleteGoal };
}
