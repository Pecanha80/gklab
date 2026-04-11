import { useState, useEffect } from 'react';

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
};

function loadPresets(): CustomPresetsState {
  const saved = localStorage.getItem('gk_custom_presets');
  if (saved) {
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
      return defaultStructure;
    }
  }
  return defaultStructure;
}

export function useCustomPresets() {
  const [customPresets, setCustomPresets] = useState<CustomPresetsState>(loadPresets);

  useEffect(() => {
    localStorage.setItem('gk_custom_presets', JSON.stringify(customPresets));
  }, [customPresets]);

  const getOptions = (key: keyof CustomPresetsState, defaultOptions: string[]) => {
    const custom = Array.isArray(customPresets[key]) ? customPresets[key] : [];
    const combined = [...defaultOptions, ...custom];
    return Array.from(new Set(combined));
  };

  const addCustomPreset = (key: keyof CustomPresetsState, value: string, defaultOptions: string[]) => {
    if (!value || value.trim() === '' || defaultOptions.includes(value) || customPresets[key].includes(value)) return;
    setCustomPresets(prev => ({
      ...prev,
      [key]: [...prev[key], value]
    }));
  };

  const removeCustomPreset = (key: keyof CustomPresetsState, value: string) => {
    setCustomPresets(prev => ({
      ...prev,
      [key]: prev[key].filter(v => v !== value)
    }));
  };

  return { customPresets, getOptions, addCustomPreset, removeCustomPreset };
}
