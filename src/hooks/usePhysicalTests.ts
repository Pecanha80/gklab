import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { useToast } from './useToast';
import { useTranslation } from './useTranslation';
import type { PhysicalTest } from '../types/physicalTest';

export function usePhysicalTests() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { showError } = useToast();
  const [tests, setTests] = useState<PhysicalTest[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTests = useCallback(async (goalkeeperId: string) => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('physical_tests')
        .select('*')
        .eq('goalkeeper_id', goalkeeperId)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTests(
        (data || []).map((row: Record<string, unknown>) => ({
          id: row.id as string,
          user_id: row.user_id as string,
          goalkeeper_id: row.goalkeeper_id as string,
          date: row.date as string,
          testType: row.test_type as string,
          value: Number(row.value),
          unit: row.unit as string,
          notes: row.notes as string | undefined,
          created_at: row.created_at as string,
        }))
      );
    } catch {
      showError(t('errorLoadPhysicalTests'));
    } finally {
      setLoading(false);
    }
  }, [user]);

  const addTest = useCallback(async (data: {
    goalkeeper_id: string;
    date: string;
    testType: string;
    value: number;
    unit: string;
    notes?: string;
  }) => {
    if (!user) return;
    try {
      const { data: inserted, error } = await supabase
        .from('physical_tests')
        .insert({
          goalkeeper_id: data.goalkeeper_id,
          date: data.date,
          test_type: data.testType,
          value: data.value,
          unit: data.unit,
          notes: data.notes || null,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      if (inserted) {
        const row = inserted as Record<string, unknown>;
        const mapped: PhysicalTest = {
          id: row.id as string,
          user_id: row.user_id as string,
          goalkeeper_id: row.goalkeeper_id as string,
          date: row.date as string,
          testType: row.test_type as string,
          value: Number(row.value),
          unit: row.unit as string,
          notes: row.notes as string | undefined,
          created_at: row.created_at as string,
        };
        setTests(prev => [mapped, ...prev]);
      }
    } catch {
      showError(t('errorAddPhysicalTest'));
    }
  }, [user]);

  const deleteTest = useCallback(async (testId: string) => {
    try {
      const { error } = await supabase
        .from('physical_tests')
        .delete()
        .eq('id', testId);

      if (error) throw error;
      setTests(prev => prev.filter(t => t.id !== testId));
    } catch {
      showError(t('errorDeletePhysicalTest'));
    }
  }, []);

  return { tests, loading, fetchTests, addTest, deleteTest };
}
