import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { useToast } from './useToast';
import type { Injury } from '../types';

interface InjuryRow {
  id: string;
  user_id: string;
  goalkeeper_id: string;
  start_date: string;
  end_date: string | null;
  body_part: string;
  injury_type: string;
  severity: 'mild' | 'moderate' | 'severe';
  treatment: string | null;
  return_to_play_status: string | null;
  notes: string | null;
  created_at: string;
}

function mapRowToInjury(row: InjuryRow): Injury {
  return {
    id: row.id,
    user_id: row.user_id,
    goalkeeper_id: row.goalkeeper_id,
    startDate: row.start_date,
    endDate: row.end_date ?? undefined,
    bodyPart: row.body_part,
    injuryType: row.injury_type,
    severity: row.severity,
    treatment: row.treatment ?? undefined,
    returnToPlayStatus: (row.return_to_play_status as Injury['returnToPlayStatus']) ?? undefined,
    notes: row.notes ?? undefined,
    created_at: row.created_at,
  };
}

export function useInjuries() {
  const { user } = useAuth();
  const { showError } = useToast();
  const [injuries, setInjuries] = useState<Injury[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchInjuries = useCallback(async (goalkeeperId: string) => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('injuries')
        .select('*')
        .eq('goalkeeper_id', goalkeeperId)
        .order('start_date', { ascending: false });

      if (error) throw error;
      setInjuries((data || []).map((row: InjuryRow) => mapRowToInjury(row)));
    } catch {
      showError('Erro ao carregar lesões');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const addInjury = useCallback(async (data: {
    goalkeeper_id: string;
    startDate: string;
    bodyPart: string;
    injuryType: string;
    severity: Injury['severity'];
    treatment?: string;
    notes?: string;
  }) => {
    if (!user) return;
    try {
      const { data: inserted, error } = await supabase
        .from('injuries')
        .insert({
          user_id: user.id,
          goalkeeper_id: data.goalkeeper_id,
          start_date: data.startDate,
          body_part: data.bodyPart,
          injury_type: data.injuryType,
          severity: data.severity,
          treatment: data.treatment || null,
          notes: data.notes || null,
        })
        .select()
        .single();

      if (error) throw error;
      if (inserted) setInjuries(prev => [mapRowToInjury(inserted as InjuryRow), ...prev]);
    } catch {
      showError('Erro ao registar lesão');
    }
  }, [user]);

  const updateInjury = useCallback(async (id: string, updates: Partial<{
    endDate: string | null;
    returnToPlayStatus: Injury['returnToPlayStatus'];
    treatment: string;
    notes: string;
  }>) => {
    try {
      const dbUpdates: Record<string, unknown> = {};
      if (updates.endDate !== undefined) dbUpdates.end_date = updates.endDate;
      if (updates.returnToPlayStatus !== undefined) dbUpdates.return_to_play_status = updates.returnToPlayStatus;
      if (updates.treatment !== undefined) dbUpdates.treatment = updates.treatment;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

      const { data: updated, error } = await supabase
        .from('injuries')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      if (updated) {
        setInjuries(prev => prev.map(inj =>
          inj.id === id ? mapRowToInjury(updated as InjuryRow) : inj
        ));
      }
    } catch {
      showError('Erro ao atualizar lesão');
    }
  }, []);

  const deleteInjury = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('injuries')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setInjuries(prev => prev.filter(inj => inj.id !== id));
    } catch {
      showError('Erro ao apagar lesão');
    }
  }, []);

  return { injuries, loading, fetchInjuries, addInjury, updateInjury, deleteInjury };
}
