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
  gameMoments: [],
  tacticalPrinciples: [],
  numAthletes: 3,
  duration: [],
  generalObjectives: [],
  gym: [],
  warmup: [],
  exercises: [],
  integratedWithTeam: [],
  coolDown: [],
  observations: {
    positives: [],
    adjustments: [],
    individualEval: [],
  },
  athleteObservations: [],
  titles: [],
  focus: [],
  time: '',
  attending: [],
};

export const emptyDrill: Omit<Exercise, 'id'> = {
  type: 'shotStopping',
  title: '',
  category: '',
  objective: [],
  organization: [],
  execution: [],
  progression: [],
  successCriteria: [],
  repetitions: '',
  duration: [],
  intensity: 'medium',
  gameMoment: '',
  startingPoint: '',
  coachingPoints: [],
};

/** Return type of useSessionForm — used as a prop bundle to reduce prop drilling. */
export type SessionFormState = ReturnType<typeof useSessionForm>;

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
  const [drillContext, setDrillContext] = useState<'warmup' | 'main' | 'integrated' | 'gym'>('main');
  const [editingDrillId, setEditingDrillId] = useState<string | null>(null);
  const [currentDrill, setCurrentDrill] = useState<Omit<Exercise, 'id'>>({ ...emptyDrill });
  const [isSelectingFromLibrary, setIsSelectingFromLibrary] = useState(false);
  const [isTacticalBoardOpen, setIsTacticalBoardOpen] = useState(false);

  /** Translate a value that may be a string, string array, or undefined. */
  const tField = (value: string | string[] | undefined): string => {
    if (!value) return '';
    if (Array.isArray(value)) return value.map(item => t(item)).join('\n');
    return t(value);
  };

  const translateContent = (content: string | string[] | undefined) => {
    return tField(content);
  };

  const handleGeneralObjectivesChange = (selected: string[]) => {
    const newWarmupDrills: Exercise[] = [];

    selected.forEach(objKey => {
      const mapping = OBJECTIVE_MAPPINGS[objKey];
      if (mapping) {
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
    newSession.gym.forEach(drill => {
      addCustomPreset('drillTitles', drill.title, PRESETS.drills.titles);
      savePresets('drillObjectives', drill.objective, PRESETS.drills.objectives);
      savePresets('drillOrganizations', drill.organization, PRESETS.drills.organizations);
      savePresets('drillExecutions', drill.execution, PRESETS.drills.executions);
      savePresets('drillProgressions', drill.progression, PRESETS.drills.progressions);
      savePresets('drillSuccessCriteria', drill.successCriteria, PRESETS.drills.successCriteria);
    });

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
    savePresets('obsEvaluations', newSession.observations.individualEval, PRESETS.observations.individual);

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
        // Error toast is shown by useAppData
      }
    }
  };

  const handleEditSession = (session: TrainingSession) => {
    setEditingSessionId(session.id);
    const { id, created_at, user_id, ...data } = session as TrainingSession & { created_at?: string; user_id?: string };
    setNewSession(data);
    setIsAddingSession(true);
  };

  const handleAddDrill = async () => {
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
       await addExerciseToLibrary(currentDrill);
    }

    if (editingDrillId) {
      setNewSession(prev => ({
        ...prev,
        gym: drillContext === 'gym'
          ? prev.gym.map(d => d.id === editingDrillId ? { ...currentDrill, id: editingDrillId } : d)
          : prev.gym,
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
        gym: drillContext === 'gym' ? [...prev.gym, drill] : prev.gym,
        warmup: drillContext === 'warmup' ? [...prev.warmup, drill] : prev.warmup,
        exercises: drillContext === 'main' ? [...prev.exercises, drill] : prev.exercises
      }));
    }

    setCurrentDrill({ ...emptyDrill });
    setIsAddingDrill(false);
    setEditingDrillId(null);
  };

  const handleEditDrill = (drill: Exercise, context: 'warmup' | 'main' | 'gym') => {
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
      gym: prev.gym.filter(d => d.id !== id),
      warmup: prev.warmup.filter(d => d.id !== id),
      exercises: prev.exercises.filter(d => d.id !== id)
    }));
  };

  const applyDrillTemplate = (title: string) => {
    if (!title) return;
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
      t(ex.title).toLowerCase() === normalizedTitle
    );

    if (foundExercise) {
      setCurrentDrill(prev => ({
        ...prev,
        title: t(foundExercise.title),
        type: foundExercise.type || prev.type,
        objective: Array.isArray(foundExercise.objective) ? foundExercise.objective.map(o => t(o)) : [foundExercise.objective ? t(foundExercise.objective) : ''],
        organization: Array.isArray(foundExercise.organization) ? foundExercise.organization.map(o => t(o)) : [foundExercise.organization ? t(foundExercise.organization) : ''],
        execution: Array.isArray(foundExercise.execution) ? foundExercise.execution.map(e => t(e)) : [foundExercise.execution ? t(foundExercise.execution) : ''],
        progression: Array.isArray(foundExercise.progression) ? foundExercise.progression.map(p => t(p)) : [foundExercise.progression ? t(foundExercise.progression) : ''],
        successCriteria: Array.isArray(foundExercise.successCriteria) ? foundExercise.successCriteria.map(s => t(s)) : [foundExercise.successCriteria ? t(foundExercise.successCriteria) : ''],
        duration: Array.isArray(foundExercise.duration) ? foundExercise.duration.map(d => t(d)) : [foundExercise.duration ? t(foundExercise.duration) : ''],
        intensity: foundExercise.intensity || prev.intensity,
      }));
    } else {
      setCurrentDrill(prev => ({
        ...prev,
        title: t(title),
        ...(title.trim() === '' ? {
          objective: [],
          organization: [],
          execution: [],
          progression: [],
          successCriteria: [],
          duration: [],
          type: 'shotStopping'
        } : {})
      }));
    }
  };

  const resolveTemplateKey = (title: string): string => {
    if (SESSION_TEMPLATES[title]) return title;
    const keys = Object.keys(SESSION_TEMPLATES);
    const found = keys.find(k => t(k) === title || t(k).toLowerCase() === title.toLowerCase());
    return found || title;
  };

  const applySessionTemplates = (titles: string[]) => {
    const resolvedTitles = titles.map(resolveTemplateKey);

    let allWarmup: Exercise[] = [];
    let allExercises: Exercise[] = [];
    let generalObjectives: string[] = [];
    let category: string | string[] = '';

    resolvedTitles.forEach(title => {
      const template = SESSION_TEMPLATES[title];
      if (template) {
        if (template.category) category = template.category;
        if (template.warmup) {
          allWarmup = [...allWarmup, ...template.warmup.map(ex => ({
            ...ex,
            id: crypto.randomUUID(),
            title: t(ex.title),
            objective: Array.isArray(ex.objective) ? ex.objective.map(o => t(o)) : [ex.objective ? t(ex.objective) : ''],
            organization: Array.isArray(ex.organization) ? ex.organization.map(o => t(o)) : [ex.organization ? t(ex.organization) : ''],
            execution: Array.isArray(ex.execution) ? ex.execution.map(e => t(e)) : [ex.execution ? t(ex.execution) : ''],
            progression: Array.isArray(ex.progression) ? ex.progression.map(p => t(p)) : [ex.progression ? t(ex.progression) : ''],
            successCriteria: Array.isArray(ex.successCriteria) ? ex.successCriteria.map(s => t(s)) : [ex.successCriteria ? t(ex.successCriteria) : ''],
            duration: Array.isArray(ex.duration) ? ex.duration.map(d => t(d)) : [ex.duration ? t(ex.duration) : ''],
          }))];
        }
        if (template.exercises) {
          allExercises = [...allExercises, ...template.exercises.map(ex => ({
            ...ex,
            id: crypto.randomUUID(),
            title: t(ex.title),
            objective: Array.isArray(ex.objective) ? ex.objective.map(o => t(o)) : [ex.objective ? t(ex.objective) : ''],
            organization: Array.isArray(ex.organization) ? ex.organization.map(o => t(o)) : [ex.organization ? t(ex.organization) : ''],
            execution: Array.isArray(ex.execution) ? ex.execution.map(e => t(e)) : [ex.execution ? t(ex.execution) : ''],
            progression: Array.isArray(ex.progression) ? ex.progression.map(p => t(p)) : [ex.progression ? t(ex.progression) : ''],
            successCriteria: Array.isArray(ex.successCriteria) ? ex.successCriteria.map(s => t(s)) : [ex.successCriteria ? t(ex.successCriteria) : ''],
            duration: Array.isArray(ex.duration) ? ex.duration.map(d => t(d)) : [ex.duration ? t(ex.duration) : ''],
          }))];
        }
        if (template.generalObjectives) {
          generalObjectives = Array.from(new Set([...generalObjectives, ...template.generalObjectives]));
        }
      }
    });

    generalObjectives.forEach(objKey => {
      const mapping = OBJECTIVE_MAPPINGS[objKey];
      if (mapping) {
        if (mapping.warmupObjective && allWarmup.length === 0) {
           allWarmup.push({
             id: crypto.randomUUID(),
             type: 'warmup',
             title: t(mapping.warmupObjective),
             objective: [t(mapping.warmupObjective)],
             organization: [mapping.warmupOrganization ? t(mapping.warmupOrganization) : ''],
             execution: [mapping.warmupDescription ? t(mapping.warmupDescription) : ''],
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
      warmup: allWarmup,
      exercises: allExercises,
    }));
  };

  const loadExample = () => {
    setNewSession({
      date: getTodayDateString(),
      category: ['firstTeam'],
      numAthletes: 3,
      duration: [t('dur_90min')],
      titles: ['crossesAerialDominance'],
      generalObjectives: ['developAerialDominance'],
      gym: [],
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
          type: 'shotStopping',
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
          type: 'oneVsOne',
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
          type: 'shotStopping',
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
      athleteObservations: [
        { athleteId: 'gk_1', text: 'Excelente posicionamento em cruzamentos.' },
        { athleteId: 'gk_2', text: 'Necessita melhorar a comunicação com a defesa.' }
      ],
      focus: ['Crosses', 'Decision Making'],
      time: '10:00 - 11:30',
      attending: ['MV', 'LS'],
    });
  };

  const handleTacticalBoardSave = (dataUrl: string) => {
    if (editingDrillId) {
      setNewSession(prev => ({
        ...prev,
        gym: drillContext === 'gym'
          ? prev.gym.map(d => d.id === editingDrillId ? { ...d, diagram: dataUrl } : d)
          : prev.gym,
        warmup: drillContext === 'warmup'
          ? prev.warmup.map(d => d.id === editingDrillId ? { ...d, diagram: dataUrl } : d)
          : prev.warmup,
        exercises: drillContext === 'main'
          ? prev.exercises.map(d => d.id === editingDrillId ? { ...d, diagram: dataUrl } : d)
          : prev.exercises,
        integratedWithTeam: drillContext === 'integrated'
          ? prev.integratedWithTeam?.map(d => d.id === editingDrillId ? { ...d, diagram: dataUrl } : d)
          : prev.integratedWithTeam,
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
    setEditingDrillId,
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
