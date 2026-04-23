import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { useToast } from './useToast';
import type { GoalkeeperNote } from '../types';

export function useAthleteNotes() {
  const { user } = useAuth();
  const { showError } = useToast();
  const [notes, setNotes] = useState<GoalkeeperNote[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotes = useCallback(async (goalkeeperId: string) => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('goalkeeper_notes')
        .select('*')
        .eq('goalkeeper_id', goalkeeperId)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch {
      showError('Erro ao carregar notas');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const addNote = useCallback(async (data: {
    goalkeeper_id: string;
    date: string;
    category: GoalkeeperNote['category'];
    text: string;
  }) => {
    if (!user) return;
    try {
      const { data: inserted, error } = await supabase
        .from('goalkeeper_notes')
        .insert({ ...data, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      if (inserted) setNotes(prev => [inserted, ...prev]);
    } catch {
      showError('Erro ao adicionar nota');
    }
  }, [user]);

  const deleteNote = useCallback(async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('goalkeeper_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;
      setNotes(prev => prev.filter(n => n.id !== noteId));
    } catch {
      showError('Erro ao apagar nota');
    }
  }, []);

  return { notes, loading, fetchNotes, addNote, deleteNote };
}
