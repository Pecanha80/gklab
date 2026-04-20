import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface CustomPresetsState {
  sessionTitles: string[];
  categories: string[];
  generalObjectives: string[];
  technical: string[];
  tactical: string[];
  physical: string[];
  cognitive: string[];
  warmupDescriptions: string[];
  warmupObjectives: string[];
  warmupProgressions: string[];
  drillTitles: string[];
  drillObjectives: string[];
  drillOrganizations: string[];
  drillExecutions: string[];
  drillProgressions: string[];
  drillSuccessCriteria: string[];
  durations: string[];
  integratedFormats: string[];
  integratedNumbers: string[];
  integratedSpaces: string[];
  integratedTimes: string[];
  coolDowns: string[];
  obsPositives: string[];
  obsAdjustments: string[];
  obsEvaluations: string[];
  deletedDefaults: string[];
}

const defaultStructure: CustomPresetsState = {
  sessionTitles: [],
  categories: [],
  generalObjectives: [],
  technical: [],
  tactical: [],
  physical: [],
  cognitive: [],
  warmupDescriptions: [],
  warmupObjectives: [],
  warmupProgressions: [],
  drillTitles: [],
  drillObjectives: [],
  drillOrganizations: [],
  drillExecutions: [],
  drillProgressions: [],
  drillSuccessCriteria: [],
  durations: [],
  integratedFormats: [],
  integratedNumbers: [],
  integratedSpaces: [],
  integratedTimes: [],
  coolDowns: [],
  obsPositives: [],
  obsAdjustments: [],
  obsEvaluations: [],
  deletedDefaults: [],
};

// Internal migration helper
function loadLocalPresets(): CustomPresetsState | null {
  const saved = localStorage.getItem('gk_custom_presets');
  if (!saved) return null;
  try {
    const parsed = JSON.parse(saved);
    const merged = { ...defaultStructure };
    Object.keys(defaultStructure).forEach((key) => {
      if (Array.isArray(parsed[key])) {
        merged[key as keyof CustomPresetsState] = parsed[key];
      }
    });
    return merged;
  } catch {
    return null;
  }
}

export function useCustomPresets() {
  const { user } = useAuth();
  const [customPresets, setCustomPresets] = useState<CustomPresetsState>(defaultStructure);
  const [isLoading, setIsLoading] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const persistToSupabase = useCallback(async (data: CustomPresetsState) => {
    if (!user) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const { error } = await supabase
        .from('user_presets')
        .upsert({
          user_id: user.id,
          presets: data,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) console.error('Error saving presets:', error);
    }, 1000);
  }, [user]);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('user_presets')
          .select('presets')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading presets:', error);
        } else if (data && data.presets) {
          setCustomPresets(data.presets);
          // Once successfully loaded from DB, we can consider migrating finished
          localStorage.removeItem('gk_custom_presets');
        } else {
          // No data in DB, check if we should migrate from localStorage
          const local = loadLocalPresets();
          if (local) {
            setCustomPresets(local);
            persistToSupabase(local);
          }
        }
      } catch (err) {
        console.error('Error in useCustomPresets load:', err);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [user]);

  const getOptions = (key: keyof CustomPresetsState, defaultOptions: readonly string[]) => {
    const custom = customPresets[key] || [];
    const deleted = customPresets.deletedDefaults || [];
    return [...defaultOptions.filter(opt => !deleted.includes(opt)), ...custom];
  };

  const addCustomPreset = (key: keyof CustomPresetsState, value: string | string[], defaultOptions: readonly string[], category?: string) => {
    const rawValues = (Array.isArray(value) ? value : [value]);
    const valuesToAdd = rawValues
      .map(v => (category ? `[${category}]${v}` : v))
      .filter(v => v && v.trim() !== '' && !defaultOptions.includes(v) && !customPresets[key].includes(v));
    
    if (valuesToAdd.length === 0) return;
    
    const updated = {
      ...customPresets,
      [key]: [...customPresets[key], ...valuesToAdd]
    };
    setCustomPresets(updated);
    persistToSupabase(updated);
  };

  const removeCustomPreset = (key: keyof CustomPresetsState, value: string) => {
    const isCustom = customPresets[key].includes(value);
    
    const updated = {
      ...customPresets,
      [key]: customPresets[key].filter(v => v !== value),
      deletedDefaults: !isCustom ? [...(customPresets.deletedDefaults || []), value] : (customPresets.deletedDefaults || [])
    };
    setCustomPresets(updated);
    persistToSupabase(updated);
  };

  const moveCustomPreset = (key: keyof CustomPresetsState, value: string, newCategory: string) => {
    if (!value) return;
    
    // Extract the base objective text (removing any [prefix])
    const actualText = value.replace(/^\[.*?\]/, '');
    
    // Construct the new storage string (e.g., [category]Objective Text)
    const newValue = newCategory ? `[${newCategory}]${actualText}` : actualText;
    
    console.log(`Moving preset: ${value} -> ${newValue}`);
    
    const updated = {
      ...customPresets,
      [key]: customPresets[key].map(v => {
        const vText = v.replace(/^\[.*?\]/, '').trim();
        return (v.trim() === value.trim() || vText === actualText.trim()) ? newValue : v;
      })
    };
    
    setCustomPresets(updated);
    persistToSupabase(updated);
  };

  return { customPresets, isLoading, getOptions, addCustomPreset, removeCustomPreset, moveCustomPreset };
}
