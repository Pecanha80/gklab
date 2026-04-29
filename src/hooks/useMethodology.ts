import { useState, useEffect, useCallback, useRef } from 'react';
import { Methodology, PeriodizationPhase } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { useToast } from './useToast';
import { useTranslation } from './useTranslation';

function createDefaultMethodology(): Methodology {
  return {
    gameModel: [
      { id: crypto.randomUUID(), moment: 'attacking', principles: [] },
      { id: crypto.randomUUID(), moment: 'defending', principles: [] },
      { id: crypto.randomUUID(), moment: 'attackTransition', principles: [] },
      { id: crypto.randomUUID(), moment: 'defenseTransition', principles: [] },
    ],
    competencyProfiles: [
      { id: crypto.randomUUID(), category: 'technical', competencies: [] },
      { id: crypto.randomUUID(), category: 'tactical', competencies: [] },
      { id: crypto.randomUUID(), category: 'physical', competencies: [] },
      { id: crypto.randomUUID(), category: 'psychological', competencies: [] },
    ],
    periodization: [],
    notes: '',
  };
}

export function useMethodology() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { showError } = useToast();
  const [methodology, setMethodology] = useState<Methodology>(createDefaultMethodology);
  const [isLoading, setIsLoading] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const persistToSupabase = useCallback((data: Methodology) => {
    if (!user) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const { error } = await supabase
        .from('methodology')
        .upsert({
          id: 'default',
          user_id: user.id,
          game_model: data.gameModel,
          competency_profiles: data.competencyProfiles,
          periodization: data.periodization,
          notes: data.notes,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        showError(t('methSaveError'));
      }
    }, 500);
  }, [user]);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('methodology')
          .select('*')
          .eq('user_id', user.id)
          .eq('id', 'default')
          .maybeSingle();

        if (error) {
          showError(t('methLoadError'));
        } else if (data) {
          setMethodology({
            gameModel: data.game_model || [],
            competencyProfiles: data.competency_profiles || [],
            periodization: data.periodization || [],
            notes: data.notes || '',
          });
        }
      } catch (err) {
        showError(t('methLoadError'));
      }
      setIsLoading(false);
    };

    load();
  }, [user]);

  const persist = useCallback((updater: (prev: Methodology) => Methodology) => {
    setMethodology(prev => {
      const updated = updater(prev);
      persistToSupabase(updated);
      return updated;
    });
  }, [persistToSupabase]);

  const updateGameModelPrinciples = useCallback((momentId: string, principles: string[]) => {
    persist(prev => ({
      ...prev,
      gameModel: prev.gameModel.map(m => m.id === momentId ? { ...m, principles } : m),
    }));
  }, [persist]);

  const updateCompetencyProfile = useCallback((profileId: string, competencies: string[]) => {
    persist(prev => ({
      ...prev,
      competencyProfiles: prev.competencyProfiles.map(p => p.id === profileId ? { ...p, competencies } : p),
    }));
  }, [persist]);

  const addPeriodizationPhase = useCallback((phase: Omit<PeriodizationPhase, 'id'>) => {
    persist(prev => ({
      ...prev,
      periodization: [...prev.periodization, { ...phase, id: crypto.randomUUID() }],
    }));
  }, [persist]);

  const updatePeriodizationPhase = useCallback((phase: PeriodizationPhase) => {
    persist(prev => ({
      ...prev,
      periodization: prev.periodization.map(p => p.id === phase.id ? phase : p),
    }));
  }, [persist]);

  const deletePeriodizationPhase = useCallback((id: string) => {
    persist(prev => ({
      ...prev,
      periodization: prev.periodization.filter(p => p.id !== id),
    }));
  }, [persist]);

  const updateNotes = useCallback((notes: string) => {
    persist(prev => ({ ...prev, notes }));
  }, [persist]);

  return {
    methodology,
    isLoading,
    updateGameModelPrinciples,
    updateCompetencyProfile,
    addPeriodizationPhase,
    updatePeriodizationPhase,
    deletePeriodizationPhase,
    updateNotes,
  };
}
