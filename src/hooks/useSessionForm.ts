import { useState } from 'react';
import { TrainingSession, Exercise } from '../types';
import { useTranslation } from './useTranslation';
import { useCustomPresets, CustomPresetsState } from './useCustomPresets';
import { PRESETS } from '../data/presets';
import { SESSION_TEMPLATES } from '../data/sessionTemplates';
import { OBJECTIVE_MAPPINGS } from '../data/objectiveMappings';
import { getTodayDateString } from '../lib/utils';

export const emptySession: Omit<TrainingSession, 'id'> = {
  date: getTodayDateString(),
  category: [],
  numAthletes: 3,
  duration: [],
  generalObjectives: [],
  objectives: {
    technical: [],
    tactical: [],
    physical: [],
    cognitive: [],
  },
  warmup: [],
  exercises: [],
  integratedWithTeam: [],
  coolDown: [],
  observations: {
    positives: [],
    adjustments: [],
    individualEval: [],
  },
  titles: [],
  focus: [],
  time: '',
  attending: [],
};

export const emptyDrill: Omit<Exercise, 'id'> = {
  type: 'analytical',
  title: '',
  objective: [],
  organization: [],
  execution: [],
  progression: [],
  successCriteria: [],
  duration: [],
  intensity: 'medium',
};

export function useSessionForm(
  addSession: (session: Omit<TrainingSession, 'id'>) => Promise<boolean>,
  updateSession: (session: TrainingSession) => Promise<void>,
  addExerciseToLibrary: (exercise: Omit<Exercise, 'id'>) => Promise<void>,
  exercisesLibrary: Exercise[],
) {
  const { t } = useTranslation();
  const { customPresets, addCustomPreset } = useCustomPresets();

  const [isAddingSession, setIsAddingSession] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [newSession, setNewSession] = useState<Omit<TrainingSession, 'id'>>({ ...emptySession });

  const [isAddingDrill, setIsAddingDrill] = useState(false);
  const [drillContext, setDrillContext] = useState<'warmup' | 'main'>('main');
  const [editingDrillId, setEditingDrillId] = useState<string | null>(null);
  const [currentDrill, setCurrentDrill] = useState<Omit<Exercise, 'id'>>({ ...emptyDrill });
  const [isSelectingFromLibrary, setIsSelectingFromLibrary] = useState(false);
  const [isTacticalBoardOpen, setIsTacticalBoardOpen] = useState(false);

  const translateContent = (content: string | string[] | undefined) => {
    if (!content) return '';
    if (Array.isArray(content)) {
      return content.map(item => t(item as any)).join('\n');
    }
    return t(content as any);
  };

  const handleGeneralObjectivesChange = (selected: string[]) => {
    const updatedSpecifics = { ...newSession.objectives };
    const newWarmupDrills: Exercise[] = [];

    const addToObjective = (field: keyof typeof updatedSpecifics, value: string) => {
      const current = updatedSpecifics[field];
      if (Array.isArray(current)) {
        if (!current.includes(value)) {
          updatedSpecifics[field] = [...current, value];
        }
      } else {
        if (!current.includes(value)) {
          updatedSpecifics[field] = current ? `${current}\n${value}` : value;
        }
      }
    };

    selected.forEach(objKey => {
      const mapping = OBJECTIVE_MAPPINGS[objKey];
      if (mapping) {
        if (mapping.technical) addToObjective('technical', mapping.technical);
        if (mapping.tactical) addToObjective('tactical', mapping.tactical);
        if (mapping.physical) addToObjective('physical', mapping.physical);
        if (mapping.cognitive) addToObjective('cognitive', mapping.cognitive);

        if (mapping.warmupObjective) {
          newWarmupDrills.push({
            id: crypto.randomUUID(),
            type: 'warmup',
            title: mapping.warmupObjective,
            objective: [mapping.warmupObjective],
            organization: [mapping.warmupOrganization || ''],
            execution: [mapping.warmupDescription || ''],
            progression: [],
            successCriteria: [],
            duration: ['dur_10min'],
            intensity: 'low'
          });
        }
      }
    });

    setNewSession({
      ...newSession,
      generalObjectives: selected,
      objectives: updatedSpecifics,
      warmup: newWarmupDrills.length > 0 ? newWarmupDrills : newSession.warmup
    });
  };

  const handleAddSession = async (e: React.FormEvent) => {
    e.preventDefault();

    const savePresets = (field: keyof CustomPresetsState, values: string | string[], defaultOpts: readonly string[]) => {
      const vals = Array.isArray(values) ? values : [values];
      vals.forEach(v => {
        if (v && v.trim()) addCustomPreset(field, v, defaultOpts);
      });
    };

    savePresets('sessionTitles', newSession.titles, PRESETS.sessionTitles);
    savePresets('categories', newSession.category, PRESETS.categories);
    newSession.generalObjectives.forEach(obj => addCustomPreset('generalObjectives', obj, PRESETS.objectives.general));
    savePresets('technical', newSession.objectives.technical, PRESETS.objectives.technical);
    savePresets('tactical', newSession.objectives.tactical, PRESETS.objectives.tactical);
    savePresets('physical', newSession.objectives.physical, PRESETS.objectives.physical);
    savePresets('cognitive', newSession.objectives.cognitive, PRESETS.objectives.cognitive);

    newSession.warmup.forEach(drill => {
      addCustomPreset('drillTitles', drill.title, PRESETS.drills.titles);
      savePresets('drillObjectives', drill.objective, PRESETS.drills.objectives);
      savePresets('drillOrganizations', drill.organization, PRESETS.drills.organizations);
      savePresets('drillExecutions', drill.execution, PRESETS.drills.executions);
      savePresets('drillProgressions', drill.progression, PRESETS.drills.progressions);
      savePresets('drillSuccessCriteria', drill.successCriteria, PRESETS.drills.successCriteria);
    });
    savePresets('coolDowns', newSession.coolDown, PRESETS.coolDowns);
    savePresets('obsPositives', newSession.observations.positives, PRESETS.observations.positives);
    savePresets('obsAdjustments', newSession.observations.adjustments, PRESETS.observations.adjustments);
    savePresets('obsEvaluations', newSession.observations.individualEval, PRESETS.observations.evaluations);

    if (newSession.integratedWithTeam) {
      newSession.integratedWithTeam.forEach(integrated => {
        addCustomPreset('integratedFormats', integrated.format, PRESETS.integrated.formats);
        addCustomPreset('integratedNumbers', integrated.number, PRESETS.integrated.numbers);
        addCustomPreset('integratedSpaces', integrated.space, PRESETS.integrated.spaces);
        addCustomPreset('integratedTimes', integrated.time, PRESETS.integrated.times);
      });
    }

    newSession.exercises.forEach(ex => {
      addCustomPreset('drillTitles', ex.title, PRESETS.drills.titles);
      savePresets('drillObjectives', ex.objective, PRESETS.drills.objectives);
      savePresets('drillOrganizations', ex.organization, PRESETS.drills.organizations);
      savePresets('drillExecutions', ex.execution, PRESETS.drills.executions);
      savePresets('drillProgressions', ex.progression, PRESETS.drills.progressions);
      savePresets('drillSuccessCriteria', ex.successCriteria, PRESETS.drills.successCriteria);
      savePresets('durations', ex.duration, PRESETS.durations);
    });

    if (editingSessionId) {
      await updateSession({ ...newSession, id: editingSessionId } as TrainingSession);
      setIsAddingSession(false);
      setEditingSessionId(null);
      setNewSession({ ...emptySession, date: getTodayDateString() });
    } else {
      const success = await addSession(newSession);
      if (success) {
        setIsAddingSession(false);
        setNewSession({ ...emptySession, date: getTodayDateString() });
      } else {
        alert('Error adding session. Check console for details.');
      }
    }
  };

  const handleEditSession = (session: TrainingSession) => {
    setEditingSessionId(session.id);
    const { id, created_at, ...data } = session as any;
    setNewSession(data);
    setIsAddingSession(true);
  };

  const handleAddDrill = () => {
    if (!currentDrill.title) return;

    const savePresets = (field: keyof CustomPresetsState, values: string | string[], defaultOpts: readonly string[]) => {
      const vals = Array.isArray(values) ? values : [values];
      vals.forEach(v => {
        if (v && v.trim()) addCustomPreset(field, v, defaultOpts);
      });
    };

    addCustomPreset('drillTitles', currentDrill.title, PRESETS.drills.titles);
    savePresets('drillObjectives', currentDrill.objective, PRESETS.drills.objectives);
    savePresets('drillOrganizations', currentDrill.organization, PRESETS.drills.organizations);
    savePresets('drillExecutions', currentDrill.execution, PRESETS.drills.executions);
    savePresets('drillProgressions', currentDrill.progression, PRESETS.drills.progressions);
    savePresets('drillSuccessCriteria', currentDrill.successCriteria, PRESETS.drills.successCriteria);
    savePresets('durations', currentDrill.duration, PRESETS.durations);

    if (currentDrill.title) {
       addExerciseToLibrary(currentDrill);
    }

    if (editingDrillId) {
      setNewSession(prev => ({
        ...prev,
        warmup: drillContext === 'warmup'
          ? prev.warmup.map(d => d.id === editingDrillId ? { ...currentDrill, id: editingDrillId } : d)
          : prev.warmup,
        exercises: drillContext === 'main'
          ? prev.exercises.map(d => d.id === editingDrillId ? { ...currentDrill, id: editingDrillId } : d)
          : prev.exercises
      }));
    } else {
      const drill: Exercise = {
        ...currentDrill,
        id: crypto.randomUUID()
      };
      setNewSession(prev => ({
        ...prev,
        warmup: drillContext === 'warmup' ? [...prev.warmup, drill] : prev.warmup,
        exercises: drillContext === 'main' ? [...prev.exercises, drill] : prev.exercises
      }));
    }

    setCurrentDrill({ ...emptyDrill });
    setIsAddingDrill(false);
    setEditingDrillId(null);
  };

  const handleEditDrill = (drill: Exercise, context: 'warmup' | 'main') => {
    setDrillContext(context);
    setCurrentDrill({
      type: drill.type,
      title: drill.title,
      objective: drill.objective,
      organization: drill.organization,
      execution: drill.execution,
      progression: drill.progression,
      successCriteria: drill.successCriteria,
      duration: drill.duration,
      intensity: drill.intensity,
      diagram: drill.diagram
    });
    setEditingDrillId(drill.id);
    setIsAddingDrill(true);
  };

  const handleCancelDrill = () => {
    setCurrentDrill({ ...emptyDrill });
    setIsAddingDrill(false);
    setEditingDrillId(null);
  };

  const handleRemoveDrill = (id: string) => {
    setNewSession(prev => ({
      ...prev,
      warmup: prev.warmup.filter(d => d.id !== id),
      exercises: prev.exercises.filter(d => d.id !== id)
    }));
  };

  const applyDrillTemplate = (title: string) => {
    const normalizedTitle = title.trim().toLowerCase();
    const allExercises: Exercise[] = [];
    Object.values(SESSION_TEMPLATES).forEach(template => {
      if (Array.isArray(template.exercises)) allExercises.push(...template.exercises);
      if (Array.isArray(template.warmup)) allExercises.push(...template.warmup);
    });

    allExercises.push(...exercisesLibrary);

    const foundExercise = allExercises.find(ex =>
      ex.title === title ||
      ex.title.toLowerCase() === normalizedTitle ||
      t(ex.title as any).toLowerCase() === normalizedTitle
    );

    if (foundExercise) {
      setCurrentDrill(prev => ({
        ...prev,
        title: t(foundExercise.title as any),
        type: foundExercise.type || prev.type,
        objective: Array.isArray(foundExercise.objective) ? foundExercise.objective.map(o => t(o as any)) : [foundExercise.objective ? t(foundExercise.objective as any) : ''],
        organization: Array.isArray(foundExercise.organization) ? foundExercise.organization.map(o => t(o as any)) : [foundExercise.organization ? t(foundExercise.organization as any) : ''],
        execution: Array.isArray(foundExercise.execution) ? foundExercise.execution.map(e => t(e as any)) : [foundExercise.execution ? t(foundExercise.execution as any) : ''],
        progression: Array.isArray(foundExercise.progression) ? foundExercise.progression.map(p => t(p as any)) : [foundExercise.progression ? t(foundExercise.progression as any) : ''],
        successCriteria: Array.isArray(foundExercise.successCriteria) ? foundExercise.successCriteria.map(s => t(s as any)) : [foundExercise.successCriteria ? t(foundExercise.successCriteria as any) : ''],
        duration: Array.isArray(foundExercise.duration) ? foundExercise.duration.map(d => t(d as any)) : [foundExercise.duration ? t(foundExercise.duration as any) : ''],
        intensity: foundExercise.intensity || prev.intensity,
      }));
    } else {
      setCurrentDrill(prev => ({
        ...prev,
        title: t(title as any),
        ...(title.trim() === '' ? {
          objective: [],
          organization: [],
          execution: [],
          progression: [],
          successCriteria: [],
          duration: [],
          type: 'analytical'
        } : {})
      }));
    }
  };

  const resolveTemplateKey = (title: string): string => {
    if (SESSION_TEMPLATES[title]) return title;
    const keys = Object.keys(SESSION_TEMPLATES);
    const found = keys.find(k => t(k as any) === title || t(k as any).toLowerCase() === title.toLowerCase());
    return found || title;
  };

  const applySessionTemplates = (titles: string[]) => {
    const resolvedTitles = titles.map(resolveTemplateKey);

    let allWarmup: Exercise[] = [];
    let allExercises: Exercise[] = [];
    let technical = '';
    let tactical = '';
    let physical = '';
    let cognitive = '';
    let generalObjectives: string[] = [];
    let category = '';

    resolvedTitles.forEach(title => {
      const template = SESSION_TEMPLATES[title];
      if (template) {
        if (template.category) category = t(template.category as any);
        if (template.warmup) {
          allWarmup = [...allWarmup, ...template.warmup.map(ex => ({
            ...ex,
            id: crypto.randomUUID(),
            title: t(ex.title as any),
            objective: Array.isArray(ex.objective) ? ex.objective.map(o => t(o as any)) : [ex.objective ? t(ex.objective as any) : ''],
            organization: Array.isArray(ex.organization) ? ex.organization.map(o => t(o as any)) : [ex.organization ? t(ex.organization as any) : ''],
            execution: Array.isArray(ex.execution) ? ex.execution.map(e => t(e as any)) : [ex.execution ? t(ex.execution as any) : ''],
            progression: Array.isArray(ex.progression) ? ex.progression.map(p => t(p as any)) : [ex.progression ? t(ex.progression as any) : ''],
            successCriteria: Array.isArray(ex.successCriteria) ? ex.successCriteria.map(s => t(s as any)) : [ex.successCriteria ? t(ex.successCriteria as any) : ''],
            duration: Array.isArray(ex.duration) ? ex.duration.map(d => t(d as any)) : [ex.duration ? t(ex.duration as any) : ''],
          }))];
        }
        if (template.exercises) {
          allExercises = [...allExercises, ...template.exercises.map(ex => ({
            ...ex,
            id: crypto.randomUUID(),
            title: t(ex.title as any),
            objective: Array.isArray(ex.objective) ? ex.objective.map(o => t(o as any)) : [ex.objective ? t(ex.objective as any) : ''],
            organization: Array.isArray(ex.organization) ? ex.organization.map(o => t(o as any)) : [ex.organization ? t(ex.organization as any) : ''],
            execution: Array.isArray(ex.execution) ? ex.execution.map(e => t(e as any)) : [ex.execution ? t(ex.execution as any) : ''],
            progression: Array.isArray(ex.progression) ? ex.progression.map(p => t(p as any)) : [ex.progression ? t(ex.progression as any) : ''],
            successCriteria: Array.isArray(ex.successCriteria) ? ex.successCriteria.map(s => t(s as any)) : [ex.successCriteria ? t(ex.successCriteria as any) : ''],
            duration: Array.isArray(ex.duration) ? ex.duration.map(d => t(d as any)) : [ex.duration ? t(ex.duration as any) : ''],
          }))];
        }
        if (template.objectives) {
          if (template.objectives.technical) technical += (technical ? '\n' : '') + t(template.objectives.technical as any);
          if (template.objectives.tactical) tactical += (tactical ? '\n' : '') + t(template.objectives.tactical as any);
          if (template.objectives.physical) physical += (physical ? '\n' : '') + t(template.objectives.physical as any);
          if (template.objectives.cognitive) cognitive += (cognitive ? '\n' : '') + t(template.objectives.cognitive as any);
        }
        if (template.generalObjectives) {
          generalObjectives = Array.from(new Set([...generalObjectives, ...template.generalObjectives]));
        }
      }
    });

    generalObjectives.forEach(objKey => {
      const mapping = OBJECTIVE_MAPPINGS[objKey];
      if (mapping) {
        if (mapping.technical && !technical.includes(t(mapping.technical as any))) {
          technical = technical ? `${technical}\n${t(mapping.technical as any)}` : t(mapping.technical as any);
        }
        if (mapping.tactical && !tactical.includes(t(mapping.tactical as any))) {
          tactical = tactical ? `${tactical}\n${t(mapping.tactical as any)}` : t(mapping.tactical as any);
        }
        if (mapping.physical && !physical.includes(t(mapping.physical as any))) {
          physical = physical ? `${physical}\n${t(mapping.physical as any)}` : t(mapping.physical as any);
        }
        if (mapping.cognitive && !cognitive.includes(t(mapping.cognitive as any))) {
          cognitive = cognitive ? `${cognitive}\n${t(mapping.cognitive as any)}` : t(mapping.cognitive as any);
        }

        if (mapping.warmupObjective && allWarmup.length === 0) {
           allWarmup.push({
             id: crypto.randomUUID(),
             type: 'warmup',
             title: t(mapping.warmupObjective as any),
             objective: [t(mapping.warmupObjective as any)],
             organization: [t(mapping.warmupOrganization as any) || ''],
             execution: [t(mapping.warmupDescription as any) || ''],
             progression: [],
             successCriteria: [],
             duration: [t('dur_15min')],
             intensity: 'medium'
           });
        }
      }
    });

    setNewSession(prev => ({
      ...prev,
      titles: resolvedTitles,
      category: category || prev.category,
      generalObjectives: generalObjectives,
      objectives: {
        technical: technical,
        tactical: tactical,
        physical: physical,
        cognitive: cognitive,
      },
      warmup: allWarmup,
      exercises: allExercises,
    }));
  };

  const loadExample = () => {
    setNewSession({
      date: getTodayDateString(),
      category: [t('firstTeam')],
      numAthletes: 3,
      duration: [t('dur_90min')],
      titles: ['crossesAerialDominance'],
      generalObjectives: ['developAerialDominance'],
      objectives: {
        technical: t('exampleTechnical'),
        tactical: t('exampleTactical'),
        physical: t('examplePhysical'),
        cognitive: 'exampleCognitive',
      },
      warmup: [
        {
          id: 'w1',
          type: 'warmup',
          title: 'exampleWarmupObjective',
          objective: 'exampleWarmupObjective',
          organization: 'ex1Organization',
          execution: 'exampleWarmupDescription',
          progression: 'exampleWarmupProgression',
          successCriteria: 'ex1SuccessCriteria',
          duration: 'dur_15min',
          intensity: 'low',
        }
      ],
      exercises: [
        {
          id: 'ex1',
          type: 'analytical',
          title: 'ex1Title',
          objective: 'ex1Objective',
          organization: 'ex1Organization',
          execution: 'ex1Execution',
          progression: 'ex1Progression',
          successCriteria: 'ex1SuccessCriteria',
          duration: 'dur_15min',
          intensity: 'medium',
        },
        {
          id: 'ex2',
          type: 'decision',
          title: 'ex2Title',
          objective: 'ex2Objective',
          organization: 'ex2Organization',
          execution: 'ex2Execution',
          progression: 'ex2Progression',
          successCriteria: 'ex2SuccessCriteria',
          duration: 'dur_20min',
          intensity: 'high',
        },
        {
          id: 'ex3',
          type: 'contextualized',
          title: 'ex3Title',
          objective: 'ex3Objective',
          organization: 'ex3Organization',
          execution: 'ex3Execution',
          progression: 'ex3Progression',
          successCriteria: 'ex3SuccessCriteria',
          duration: 'dur_25min',
          intensity: 'high',
        }
      ],
      integratedWithTeam: [{ id: crypto.randomUUID(), format: 'crossingDuel', number: 'gkPlus4vs4PlusGk', space: 'halfFieldSpace', time: 'dur_20min' }],
      coolDown: 'recoveryTalkHydration',
      observations: {
        positives: 'excellentFocusThroughout',
        adjustments: 'improveTimingExits',
        individualEval: 'playerGreatProgress',
      },
      focus: ['Crosses', 'Decision Making'],
      time: '10:00 - 11:30',
      attending: ['MV', 'LS'],
    });
  };

  const handleTacticalBoardSave = (dataUrl: string) => {
    if (editingDrillId) {
      setNewSession(prev => ({
        ...prev,
        warmup: drillContext === 'warmup'
          ? prev.warmup.map(d => d.id === editingDrillId ? { ...d, diagram: dataUrl } : d)
          : prev.warmup,
        exercises: drillContext === 'main'
          ? prev.exercises.map(d => d.id === editingDrillId ? { ...d, diagram: dataUrl } : d)
          : prev.exercises
      }));
    } else {
      setCurrentDrill(prev => ({ ...prev, diagram: dataUrl }));
    }
    setIsTacticalBoardOpen(false);
  };

  return {
    // Session state
    isAddingSession,
    setIsAddingSession: (v: boolean) => {
      setIsAddingSession(v);
      if (!v) setEditingSessionId(null);
    },
    editingSessionId,
    newSession,
    setNewSession,
    // Drill state
    isAddingDrill,
    setIsAddingDrill,
    drillContext,
    setDrillContext,
    editingDrillId,
    currentDrill,
    setCurrentDrill,
    isSelectingFromLibrary,
    setIsSelectingFromLibrary,
    isTacticalBoardOpen,
    setIsTacticalBoardOpen,
    // Helpers
    translateContent,
    // Handlers
    handleGeneralObjectivesChange,
    handleAddSession,
    handleAddDrill,
    handleEditDrill,
    handleCancelDrill,
    handleRemoveDrill,
    applyDrillTemplate,
    applySessionTemplates,
    loadExample,
    handleEditSession,
    handleTacticalBoardSave,
    // Constants
    emptySession,
    emptyDrill,
  };
}
