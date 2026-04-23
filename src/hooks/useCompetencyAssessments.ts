import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { useToast } from './useToast';
import type { CompetencyAssessment } from '../types';

export function useCompetencyAssessments() {
  const { user } = useAuth();
  const { showError } = useToast();
  const [assessments, setAssessments] = useState<CompetencyAssessment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAssessments = useCallback(async (goalkeeperId: string) => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('competency_assessments')
        .select('*')
        .eq('goalkeeper_id', goalkeeperId)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssessments(data || []);
    } catch {
      showError('Erro ao carregar avaliações');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const addAssessment = useCallback(async (data: {
    goalkeeper_id: string;
    date: string;
    assessments: { category: string; score: number }[];
    notes?: string;
  }) => {
    if (!user) return;
    try {
      const { data: inserted, error } = await supabase
        .from('competency_assessments')
        .insert({ ...data, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      if (inserted) setAssessments(prev => [inserted, ...prev]);
    } catch {
      showError('Erro ao adicionar avaliação');
    }
  }, [user]);

  const deleteAssessment = useCallback(async (assessmentId: string) => {
    try {
      const { error } = await supabase
        .from('competency_assessments')
        .delete()
        .eq('id', assessmentId);

      if (error) throw error;
      setAssessments(prev => prev.filter(a => a.id !== assessmentId));
    } catch {
      showError('Erro ao apagar avaliação');
    }
  }, []);

  return { assessments, loading, fetchAssessments, addAssessment, deleteAssessment };
}
