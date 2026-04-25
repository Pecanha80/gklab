import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { useToast } from './useToast';
import { useTranslation } from './useTranslation';
import { DEBOUNCE_MS } from '../lib/utils';

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
  obsIndividual: string[];
  tacticalPrinciples: string[];
  gameMoments: string[];
  athleteObservations: string[];
  mesocycles: string[];
  competitions: string[];
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
  obsIndividual: [],
  tacticalPrinciples: [],
  gameMoments: [],
  athleteObservations: [],
  mesocycles: [],
  competitions: [],
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
  const { t } = useTranslation();
  const { showError } = useToast();
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

      if (error) showError(t('errorSavePresets'));
    }, DEBOUNCE_MS);
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
          showError(t('errorLoadPresets'));
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
        showError(t('errorLoadPresets'));
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [user]);

  type PresetKey = keyof CustomPresetsState | (string & {});

  const resolveKey = (key: PresetKey): keyof CustomPresetsState => key as keyof CustomPresetsState;

  const getOptions = (key: PresetKey, defaultOptions?: readonly string[]) => {
    const k = resolveKey(key);
    const safDefaults = defaultOptions ?? [];
    const custom = customPresets[k] || [];
    const deleted = customPresets.deletedDefaults || [];

    const filteredDefaults = safDefaults.filter(opt => !deleted.includes(opt));

    // Separate custom items: those with [category] prefix go into their category section
    const categorized: Record<string, string[]> = {};
    const uncategorized: string[] = [];
    for (const item of custom) {
      const match = item.match(/^\[(.+?)\]/);
      if (match) {
        const cat = match[1];
        if (!categorized[cat]) categorized[cat] = [];
        categorized[cat].push(item);
      } else {
        uncategorized.push(item);
      }
    }

    // If no categorized items, just append all custom at the end
    if (Object.keys(categorized).length === 0) {
      return [...filteredDefaults, ...custom];
    }

    // Insert categorized items after their corresponding header's last item
    const rebuilt: string[] = [];
    for (let i = 0; i < filteredDefaults.length; i++) {
      const opt = filteredDefaults[i];
      const isHeader = opt.startsWith('# ');
      const nextOpt = filteredDefaults[i + 1];
      const nextIsHeader = nextOpt?.startsWith('# ');

      // If current is a header and next is also a header (empty category), insert after header
      if (isHeader) {
        rebuilt.push(opt);
        const cat = opt.replace('# ', '');
        if (categorized[cat]) {
          // If next is also a header or end, insert categorized items here
          if (!nextOpt || nextIsHeader) {
            rebuilt.push(...categorized[cat]);
            delete categorized[cat];
          }
        }
        continue;
      }

      rebuilt.push(opt);

      // If this is the last non-header item before a header or end, insert categorized items
      if (!nextOpt || nextIsHeader) {
        // Find which category this item belongs to
        // Walk backwards to find the header
        for (let j = i - 1; j >= 0; j--) {
          if (filteredDefaults[j].startsWith('# ')) {
            const cat = filteredDefaults[j].replace('# ', '');
            if (categorized[cat]) {
              rebuilt.push(...categorized[cat]);
              delete categorized[cat];
            }
            break;
          }
        }
      }
    }

    // Append any remaining categorized items (no matching header found) and uncategorized
    const remaining = Object.values(categorized).flat();
    return [...rebuilt, ...remaining, ...uncategorized];
  };

  const addCustomPreset = (key: PresetKey, value: string | string[], defaultOptions: readonly string[], category?: string) => {
    const k = resolveKey(key);
    const rawValues = (Array.isArray(value) ? value : [value]);
    const existing = customPresets[k] || [];
    const valuesToAdd = rawValues
      .map(v => (category ? `[${category}]${v}` : v))
      .filter(v => v && v.trim() !== '' && !defaultOptions.includes(v) && !existing.includes(v));

    if (valuesToAdd.length === 0) return;

    const updated = {
      ...customPresets,
      [k]: [...existing, ...valuesToAdd]
    };
    setCustomPresets(updated);
    persistToSupabase(updated);
  };

  const removeCustomPreset = (key: PresetKey, value: string) => {
    const k = resolveKey(key);
    const existing = customPresets[k] || [];
    const isCustom = existing.includes(value);

    const updated = {
      ...customPresets,
      [k]: existing.filter(v => v !== value),
      deletedDefaults: !isCustom ? [...(customPresets.deletedDefaults || []), value] : (customPresets.deletedDefaults || [])
    };
    setCustomPresets(updated);
    persistToSupabase(updated);
  };

  const moveCustomPreset = (key: PresetKey, value: string, newCategory: string) => {
    if (!value) return;
    const k = resolveKey(key);
    const existing = customPresets[k] || [];

    const actualText = value.replace(/^\[.*?\]/, '');
    const newValue = newCategory ? `[${newCategory}]${actualText}` : actualText;

    const isCustom = existing.some(v => {
      const vText = v.replace(/^\[.*?\]/, '').trim();
      return v.trim() === value.trim() || vText === actualText.trim();
    });

    if (isCustom) {
      // Move within custom presets
      const updated = {
        ...customPresets,
        [k]: existing.map(v => {
          const vText = v.replace(/^\[.*?\]/, '').trim();
          return (v.trim() === value.trim() || vText === actualText.trim()) ? newValue : v;
        })
      };
      setCustomPresets(updated);
      persistToSupabase(updated);
    } else {
      // Moving a default preset: mark original as deleted, add as custom with new category
      const updated = {
        ...customPresets,
        deletedDefaults: [...(customPresets.deletedDefaults || []), value],
        [k]: [...existing, newValue]
      };
      setCustomPresets(updated);
      persistToSupabase(updated);
    }
  };

  return { customPresets, isLoading, getOptions, addCustomPreset, removeCustomPreset, moveCustomPreset };
}
