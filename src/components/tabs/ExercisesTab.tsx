import React, { useState } from 'react';
import {
  Plus,
  X,
  Target,
  Clock,
  Search,
  Edit3,
  Folder,
  ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { Exercise } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';
import { useCustomPresets, type CustomPresetsState } from '../../hooks/useCustomPresets';
import { PRESETS } from '../../data/presets';
import { QuickSelect } from '../ui/QuickSelect';
import { ExercisePreview } from '../ExercisePreview';
import { emptyDrill } from '../../hooks/useSessionForm';

interface ExercisesTabProps {
  exercisesLibrary: Exercise[];
  addExerciseToLibrary: (exercise: Omit<Exercise, 'id'>) => Promise<void>;
  selectedExercise: Exercise | null;
  setSelectedExercise: (exercise: Exercise | null) => void;
  setIsTacticalBoardOpen: (v: boolean) => void;
  currentDrill: Omit<Exercise, 'id'>;
  setCurrentDrill: React.Dispatch<React.SetStateAction<Omit<Exercise, 'id'>>>;
  applyDrillTemplate: (title: string) => void;
  translateContent: (content: string | string[] | undefined) => string;
  updateExercise: (exercise: Exercise) => Promise<void>;
  editingExercise: Exercise | null;
  setEditingExercise: (exercise: Exercise | null) => void;
}

export const ExercisesTab: React.FC<ExercisesTabProps> = ({
  exercisesLibrary,
  addExerciseToLibrary,
  selectedExercise,
  setSelectedExercise,
  setIsTacticalBoardOpen,
  currentDrill,
  setCurrentDrill,
  applyDrillTemplate,
  translateContent,
  updateExercise,
  editingExercise,
  setEditingExercise,
}) => {
  const { t } = useTranslation();
  const { customPresets, getOptions, addCustomPreset, removeCustomPreset, moveCustomPreset } = useCustomPresets();
  const [pendingObjective, setPendingObjective] = useState<any>(null);

  const [isAddingExerciseToLibrary, setIsAddingExerciseToLibrary] = useState(false);
  const [exerciseSearchTerm, setExerciseSearchTerm] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  React.useEffect(() => {
    if (editingExercise) {
      setCurrentDrill({ ...editingExercise });
      setIsAddingExerciseToLibrary(true);
    }
  }, [editingExercise, setCurrentDrill]);

  const handleCloseForm = () => {
    setIsAddingExerciseToLibrary(false);
    setEditingExercise(null);
    setValidationErrors([]);
    setShowPreview(false);
    setCurrentDrill({ ...emptyDrill });
  };

  const validateDrill = (drill: Omit<Exercise, 'id'>): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!drill.title?.trim()) {
      errors.push(t('drillTitleRequiredMsg' as any));
    }
    
    if (!drill.category) {
      errors.push(t('physicalCapacityRequiredMsg' as any));
    }

    // Objective is recommended but not strictly required to block saving
    // unless we really want it. Let's keep it optional for speed.

    return { isValid: errors.length === 0, errors };
  };

  const cleanExerciseData = (exercise: Omit<Exercise, 'id'>): Omit<Exercise, 'id'> => {
    const arrayFields = ['objective', 'organization', 'execution', 'progression', 'successCriteria'] as const;
    const cleaned = { ...exercise };

    arrayFields.forEach(field => {
      let value = cleaned[field];

      // If the field is a string that looks like a JSON array, it's already corrupted
      // We need to strip brackets/quotes if it's being treated as a single string item
      if (Array.isArray(value)) {
        cleaned[field] = value
          .map(item => {
            if (typeof item === 'string') {
              let s = item.trim();
              if (s.startsWith('[') && s.endsWith(']')) {
                try {
                  const parsed = JSON.parse(s);
                  return Array.isArray(parsed) ? parsed[0] : parsed;
                } catch {
                  return s.slice(1, -1).replace(/^["']|["']$/g, '');
                }
              }
              return s;
            }
            return item;
          })
          .filter(Boolean);
      }
    });

    return cleaned;
  };

  const handleAddExerciseToLibrary = async (exercise: Omit<Exercise, 'id'>): Promise<boolean> => {
    const validation = validateDrill(exercise);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return false;
    }
    setValidationErrors([]);
    const cleanedExercise = cleanExerciseData(exercise);
    if (editingExercise) {
      await updateExercise({ ...cleanedExercise, id: editingExercise.id } as Exercise);
    } else {
      await addExerciseToLibrary(cleanedExercise);
    }
    return true;
  };

  const groupedExercises = React.useMemo(() => {
    const filtered = exercisesLibrary.filter(ex => {
      const objectiveStr = Array.isArray(ex.objective) ? ex.objective.join(' ') : (ex.objective || '');
      const searchTerm = exerciseSearchTerm.toLowerCase();
      return ex.title.toLowerCase().includes(searchTerm) ||
        objectiveStr.toLowerCase().includes(searchTerm) ||
        (ex.category && t(ex.category as any).toLowerCase().includes(searchTerm));
    });

    const groups: Record<string, Exercise[]> = {};
    filtered.forEach(ex => {
      const cat = ex.category || 'uncategorized';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(ex);
    });

    return groups;
  }, [exercisesLibrary, exerciseSearchTerm, t]);

  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  const toggleFolder = (folder: string) => {
    setExpandedFolders(prev => ({ ...prev, [folder]: !prev[folder] }));
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black font-headline tracking-tight text-on-surface">{t('exerciseLibrary')}</h2>
        <button
          onClick={() => setIsAddingExerciseToLibrary(true)}
          className="bg-primary hover:bg-primary-dim text-on-primary px-4 py-2 rounded-md font-label text-xs font-bold transition-all active:scale-95 flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('createExercise')}
        </button>
      </div>

      {isAddingExerciseToLibrary ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-surface-container p-0 rounded-xl border border-primary/40 w-full max-w-[98vw] mx-auto overflow-hidden flex flex-col max-h-[85vh]"
        >
          <div className="bg-surface-container-highest p-6 border-b border-primary/40 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-on-surface flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                {editingExercise ? t('editExercise') : t('exercisePlannerEditor')}
              </h3>
              <p className="text-[10px] text-on-surface-variant uppercase font-label tracking-widest mt-1">{t('designUEFAStandardDrills')}</p>
            </div>
            <button
              onClick={handleCloseForm}
              className="text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-thin scrollbar-thumb-white/10">
            {validationErrors.length > 0 && (
              <div className="bg-error/10 border border-error/30 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <X className="w-4 h-4 text-error mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-error mb-1">{t('pleaseCompleteAllRequiredFields')}</p>
                    <ul className="text-xs text-error space-y-1">
                      {validationErrors.map((error, index) => (
                        <li key={index}>&bull; {error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-surface-container-highest p-6 rounded-xl border border-primary/30 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1 md:col-span-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('drillTitle')}</label>
                    <QuickSelect
                      label={t('presets')}
                      options={getOptions('drillTitles', PRESETS.drills.titles)}
                      onSelect={(vals) => applyDrillTemplate(vals[vals.length - 1])}
                      selectedValues={currentDrill.title ? [currentDrill.title] : []}
                      onDelete={(val) => removeCustomPreset('drillTitles', val)}
                      isDeletable={(val) => !val.startsWith('#')}
                      onAdd={(val) => setPendingObjective({ value: val, field: 'drillTitles', mode: 'add' })}
                      onMove={(val) => setPendingObjective({ value: val, field: 'drillTitles', mode: 'move' })}
                    />
                  </div>
                  <input
                    type="text"
                    value={currentDrill.title}
                    onChange={e => {
                      applyDrillTemplate(e.target.value);
                      setValidationErrors([]);
                    }}
                    className={cn(
                      "w-full bg-surface-container border rounded px-3 py-2 text-xs transition-colors",
                      validationErrors.some(e => e.includes('title')) ? "border-error/50 bg-error/5" : "border-black/5"
                    )}
                    placeholder={t('drillTitlePlaceholder')}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('type')}</label>
                  <div className="flex gap-1">
                    {PRESETS.drillTypes.map(dtype => (
                      <button
                        key={dtype}
                        type="button"
                        onClick={() => setCurrentDrill({ ...currentDrill, type: dtype as Exercise['type'] })}
                        className={cn(
                          "flex-1 py-1.5 rounded text-[8px] font-bold border transition-all",
                          currentDrill.type === dtype ? "bg-primary/20 border-primary text-primary" : "bg-surface-container border-black/5 text-on-surface-variant"
                        )}
                      >
                        {t(dtype as any)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('category')}</label>
                  <div className="flex flex-wrap gap-1">
                    {PRESETS.drillCategories.map(cap => (
                      <button
                        key={cap}
                        type="button"
                        onClick={() => setCurrentDrill({ ...currentDrill, category: cap })}
                        className={cn(
                          "px-3 py-1.5 rounded text-[8px] font-bold border transition-all",
                          currentDrill.category === cap ? "bg-secondary/20 border-secondary text-secondary" : "bg-surface-container border-black/5 text-on-surface-variant"
                        )}
                      >
                        {t(cap as any)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('gameMomentsLabel')}</label>
                    <QuickSelect
                      label={t('presets')}
                      multiSelect={false}
                      options={getOptions('gameMoments' as any, [
                        'momentOrganizedDefense',
                        'momentDefensiveTransition',
                        'momentOrganizedAttack',
                        'momentOffensiveTransition',
                        'momentSetPieces'
                      ])}
                      onSelect={(val) => setCurrentDrill({ ...currentDrill, gameMoment: val[0] })}
                      selectedValues={currentDrill.gameMoment ? [currentDrill.gameMoment] : []}
                      onDelete={(val) => removeCustomPreset('gameMoments' as any, val)}
                      isDeletable={(val) => !val.startsWith('#')}
                      onAdd={(val) => addCustomPreset('gameMoments' as any, val, [])}
                      onMove={(val) => moveCustomPreset('gameMoments' as any, val, '')}
                    />
                  </div>
                  <input
                    type="text"
                    readOnly
                    value={currentDrill.gameMoment ? t(currentDrill.gameMoment as any) : ''}
                    className="w-full bg-surface-container border border-black/5 rounded px-3 py-2 text-xs"
                    placeholder={t('select')}
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('tacticalPrinciplesLabel')}</label>
                    <QuickSelect
                      label="Presets"
                      multiSelect={true}
                      options={getOptions('tacticalPrinciples' as any, PRESETS.tacticalPrinciples)}
                      onSelect={(vals) => setCurrentDrill({ ...currentDrill, tacticalPrinciples: vals })}
                      selectedValues={currentDrill.tacticalPrinciples || []}
                      onDelete={(val) => removeCustomPreset('tacticalPrinciples', val)}
                      isDeletable={(val) => !val.startsWith('#')}
                      onAdd={(val) => setPendingObjective({ value: val, field: 'tacticalPrinciples', mode: 'add' })}
                      onMove={(val) => setPendingObjective({ value: val, field: 'tacticalPrinciples', mode: 'move' })}
                    />
                  </div>
                  <textarea
                    value={translateContent(currentDrill.tacticalPrinciples)}
                    onChange={e => setCurrentDrill({ ...currentDrill, tacticalPrinciples: e.target.value.split('\n') })}
                    className="w-full bg-surface-container border border-black/5 rounded px-3 py-2 text-xs min-h-[40px]"
                    placeholder={t('objectivePlaceholder')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('objective')}</label>
                    <QuickSelect
                      label={t('presets')}
                      options={getOptions('drillObjectives', PRESETS.drills.objectives)}
                      onSelect={(val) => setCurrentDrill({ ...currentDrill, objective: val })}
                      selectedValues={Array.isArray(currentDrill.objective) ? currentDrill.objective : [currentDrill.objective]}
                      multiSelect={true}
                      onDelete={(val) => removeCustomPreset('drillObjectives', val)}
                      isDeletable={(val) => !val.startsWith('#')}
                      onAdd={(val) => setPendingObjective({ value: val, field: 'drillObjectives', mode: 'add' })}
                      onMove={(val) => setPendingObjective({ value: val, field: 'drillObjectives', mode: 'move' })}
                    />
                  </div>
                  <textarea
                    value={translateContent(currentDrill.objective)}
                    onChange={e => setCurrentDrill({ ...currentDrill, objective: e.target.value.split('\n') })}
                    className="w-full bg-surface-container border border-black/5 rounded px-3 py-2 text-xs min-h-[60px]"
                    placeholder={t('objectivePlaceholder')}
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('organization')}</label>
                    <QuickSelect
                      label={t('presets')}
                      options={getOptions('drillOrganizations', PRESETS.drills.organizations)}
                      onSelect={(val) => setCurrentDrill({ ...currentDrill, organization: val })}
                      selectedValues={Array.isArray(currentDrill.organization) ? currentDrill.organization : [currentDrill.organization]}
                      multiSelect={true}
                      onDelete={(val) => removeCustomPreset('drillOrganizations', val)}
                      isDeletable={(val) => !val.startsWith('#')}
                      onAdd={(val) => setPendingObjective({ value: val, field: 'drillOrganizations', mode: 'add' })}
                      onMove={(val) => setPendingObjective({ value: val, field: 'drillOrganizations', mode: 'move' })}
                    />
                  </div>
                  <textarea
                    value={translateContent(currentDrill.organization)}
                    onChange={e => setCurrentDrill({ ...currentDrill, organization: e.target.value.split('\n') })}
                    className="w-full bg-surface-container border border-black/5 rounded px-3 py-2 text-xs min-h-[60px]"
                    placeholder={t('organizationPlaceholder')}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('execution')}</label>
                  <QuickSelect
                    label={t('presets')}
                    options={getOptions('drillExecutions', PRESETS.drills.executions)}
                    onSelect={(val) => setCurrentDrill({ ...currentDrill, execution: val })}
                    selectedValues={Array.isArray(currentDrill.execution) ? currentDrill.execution : [currentDrill.execution]}
                    multiSelect={true}
                    onDelete={(val) => removeCustomPreset('drillExecutions', val)}
                    isDeletable={(val) => !val.startsWith('#')}
                    onAdd={(val) => setPendingObjective({ value: val, field: 'drillExecutions', mode: 'add' })}
                    onMove={(val) => setPendingObjective({ value: val, field: 'drillExecutions', mode: 'move' })}
                  />
                </div>
                <textarea
                  value={translateContent(currentDrill.execution)}
                  onChange={e => setCurrentDrill({ ...currentDrill, execution: e.target.value.split('\n') })}
                  className="w-full bg-surface-container border border-black/5 rounded px-3 py-2 text-xs min-h-[60px]"
                  placeholder={t('executionPlaceholder')}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('progressionVariables')}</label>
                    <QuickSelect
                      label={t('presets')}
                      options={getOptions('drillProgressions', PRESETS.drills.progressions)}
                      onSelect={(val) => setCurrentDrill({ ...currentDrill, progression: val })}
                      selectedValues={Array.isArray(currentDrill.progression) ? currentDrill.progression : [currentDrill.progression]}
                      multiSelect={true}
                      onDelete={(val) => removeCustomPreset('drillProgressions', val)}
                      isDeletable={(val) => !val.startsWith('#')}
                      onAdd={(val) => setPendingObjective({ value: val, field: 'drillProgressions', mode: 'add' })}
                      onMove={(val) => setPendingObjective({ value: val, field: 'drillProgressions', mode: 'move' })}
                    />
                  </div>
                  <input
                    type="text"
                    value={translateContent(currentDrill.progression)}
                    onChange={e => setCurrentDrill({ ...currentDrill, progression: e.target.value.split(',') })}
                    className="w-full bg-surface-container border border-black/5 rounded px-3 py-2 text-xs"
                    placeholder={t('progressionPlaceholder')}
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('successCriteria')}</label>
                    <QuickSelect
                      label={t('presets')}
                      options={getOptions('drillSuccessCriteria', PRESETS.drills.successCriteria)}
                      onSelect={(val) => setCurrentDrill({ ...currentDrill, successCriteria: val })}
                      selectedValues={Array.isArray(currentDrill.successCriteria) ? currentDrill.successCriteria : [currentDrill.successCriteria]}
                      multiSelect={true}
                      onDelete={(val) => removeCustomPreset('drillSuccessCriteria', val)}
                      isDeletable={(val) => !val.startsWith('#')}
                      onAdd={(val) => setPendingObjective({ value: val, field: 'drillSuccessCriteria', mode: 'add' })}
                      onMove={(val) => setPendingObjective({ value: val, field: 'drillSuccessCriteria', mode: 'move' })}
                    />
                  </div>
                  <input
                    type="text"
                    value={translateContent(currentDrill.successCriteria)}
                    onChange={e => setCurrentDrill({ ...currentDrill, successCriteria: e.target.value.split(',') })}
                    className="w-full bg-surface-container border border-black/5 rounded px-3 py-2 text-xs"
                    placeholder={t('successCriteriaPlaceholder')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('duration')}</label>
                  <div className="flex gap-2">
                    <input type="text" value={currentDrill.duration} onChange={e => setCurrentDrill({ ...currentDrill, duration: e.target.value })} className="flex-1 bg-surface-container border border-black/5 rounded px-3 py-2 text-xs" />
                    <QuickSelect
                      label={t('presets')}
                      options={getOptions('durations', PRESETS.durations)}
                      onSelect={(val) => setCurrentDrill({ ...currentDrill, duration: val })}
                      selectedValues={Array.isArray(currentDrill.duration) ? currentDrill.duration : [currentDrill.duration]}
                      multiSelect={true}
                      onDelete={(val) => removeCustomPreset('durations', val)}
                      isDeletable={(val) => !val.startsWith('#')}
                      onAdd={(val) => addCustomPreset('durations', val, PRESETS.durations)}
                      onMove={(val) => moveCustomPreset('durations', val, '')}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('intensity')}</label>
                  <div className="flex gap-2">
                    {PRESETS.intensities.map(intens => (
                      <button
                        key={intens}
                        type="button"
                        onClick={() => setCurrentDrill({ ...currentDrill, intensity: intens as Exercise['intensity'] })}
                        className={cn(
                          "flex-1 py-2 rounded text-[8px] font-bold border transition-all",
                          currentDrill.intensity === intens ? "bg-secondary/20 border-secondary text-secondary" : "bg-surface-container border-black/5 text-on-surface-variant"
                        )}
                      >
                        {t(intens as any)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-1 mt-4">
                <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('diagram')}</label>
                <button
                  type="button"
                  onClick={() => setIsTacticalBoardOpen(true)}
                  className={cn(
                    "w-full h-32 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all",
                    currentDrill.diagram ? "border-primary bg-primary/5" : "border-primary/40 hover:border-primary/50"
                  )}
                >
                  {currentDrill.diagram ? (
                    <img src={currentDrill.diagram} alt="Diagram" className="h-full w-full object-contain p-2" referrerPolicy="no-referrer" />
                  ) : (
                    <>
                      <Target className="w-6 h-6 text-on-surface-variant" />
                      <span className="text-[8px] font-bold uppercase">{t('designExercise')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="px-8 pb-4">
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-2 text-[9px] text-primary hover:text-primary-dim font-bold uppercase tracking-widest transition-colors"
              >
                <Target className="w-3 h-3" />
                {showPreview ? t('hidePreview') : t('showPreview')}
              </button>
            </div>

            <AnimatePresence>
              {showPreview && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <ExercisePreview drill={currentDrill} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="bg-surface-container-highest p-6 border-t border-primary/40 flex justify-between items-center">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="px-4 py-2 rounded-md font-label text-xs font-bold text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all"
              >
                {showPreview ? t('hidePreview') : t('preview')}
              </button>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCloseForm}
                className="px-6 py-2 rounded-md font-label text-xs font-bold text-on-surface-variant hover:text-on-surface transition-all"
              >
                {t('discard')}
              </button>
              <button
                onClick={async () => {
                  const success = await handleAddExerciseToLibrary(currentDrill);
                  if (success) handleCloseForm();
                }}
                className="bg-primary hover:bg-primary-dim text-on-primary px-8 py-2 rounded-md font-label text-xs font-bold transition-all shadow-lg shadow-primary/20"
              >
                {editingExercise ? t('saveChanges') : t('saveToLibrary')}
              </button>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
            <input
              type="text"
              value={exerciseSearchTerm}
              onChange={(e) => setExerciseSearchTerm(e.target.value)}
              placeholder={t('searchExercisesPlaceholder')}
              className="w-full bg-surface-container border border-primary/40 rounded-full pl-10 pr-4 py-2 text-sm focus:border-primary transition-all"
            />
          </div>

          <div className="space-y-4">
            {Object.entries(groupedExercises).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-primary/40 rounded-xl">
                <Target className="w-12 h-12 text-on-surface-variant mb-4" />
                <h3 className="text-xl font-bold text-on-surface mb-2">{t('libraryIsEmpty')}</h3>
                <p className="text-on-surface-variant max-w-md mb-6">{t('libraryIsEmptyDescription')}</p>
                <button
                  onClick={() => setIsAddingExerciseToLibrary(true)}
                  className="bg-primary hover:bg-primary-dim text-on-primary px-6 py-3 rounded-md font-label text-sm font-bold transition-all"
                >
                  {t('createFirstExercise')}
                </button>
              </div>
            ) : (
              Object.entries(groupedExercises)
                .sort(([a], [b]) => {
                  if (a === 'uncategorized') return 1;
                  if (b === 'uncategorized') return -1;
                  return a.localeCompare(b);
                })
                .map(([category, exercises]) => (
                  <div key={category} className="space-y-3">
                    <button
                      onClick={() => toggleFolder(category)}
                      className="w-full flex items-center justify-between p-4 bg-surface-container-highest rounded-xl border border-black/5 hover:border-primary/30 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                          <Folder className={cn("w-5 h-5 text-primary", expandedFolders[category] ? "fill-primary/20" : "")} />
                        </div>
                        <div className="text-left">
                          <h3 className="font-bold text-on-surface uppercase tracking-tight text-sm">
                            {category === 'uncategorized' ? t('uncategorized' as any) : t(category as any)}
                          </h3>
                          <p className="text-[10px] text-on-surface-variant font-label">{exercises.length} {t('exercisesLabel' as any)}</p>
                        </div>
                      </div>
                      <ChevronRight className={cn("w-5 h-5 text-on-surface-variant transition-transform", expandedFolders[category] ? "rotate-90" : "")} />
                    </button>

                    <AnimatePresence>
                      {expandedFolders[category] && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-1">
                            {exercises.map(ex => (
                              <motion.div
                                key={ex.id}
                                whileHover={{ y: -4 }}
                                onClick={() => setSelectedExercise(ex)}
                                className="bg-surface-container rounded-xl border border-primary/40 overflow-hidden group cursor-pointer"
                              >
                                {ex.diagram && (
                                  <div className="h-40 bg-black/5 relative overflow-hidden border-b border-black/5">
                                    <img src={ex.diagram} alt={ex.title as string} className="w-full h-full object-contain p-4" referrerPolicy="no-referrer" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-surface-container to-transparent opacity-60" />
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingExercise(ex);
                                      }}
                                      className="absolute top-2 right-2 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all z-10"
                                      title={t('edit' as any)}
                                    >
                                      <Edit3 className="w-4 h-4" />
                                    </button>
                                  </div>
                                )}
                                <div className="p-5 space-y-4">
                                  <div className="flex items-center justify-between">
                                    <span className="bg-primary/20 text-primary text-[8px] font-bold px-2 py-0.5 rounded uppercase tracking-widest">{t(ex.type as any)}</span>
                                    <div className="flex items-center text-[10px] text-on-surface-variant">
                                      <Clock className="w-3 h-3 mr-1" /> {Array.isArray(ex.duration) ? ex.duration.map(d => t(d as any)).join(', ') : t(ex.duration as any)}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="flex items-center justify-between mb-1">
                                      <h3 className="text-lg font-bold text-on-surface group-hover:text-primary transition-colors">{t(ex.title as any)}</h3>
                                      {!ex.diagram && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingExercise(ex);
                                          }}
                                          className="p-1.5 text-on-surface-variant hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                          <Edit3 className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                    <p className="text-xs text-on-surface-variant line-clamp-2">{Array.isArray(ex.objective) ? ex.objective.map(o => t(o as any)).join(', ') : t(ex.objective as any)}</p>
                                  </div>
                                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-black/5">
                                    <div className="space-y-1">
                                      <span className="text-[8px] text-on-surface-variant uppercase font-bold">{t('intensity')}</span>
                                      <div className="text-[10px] text-on-surface font-medium">{t(ex.intensity as any)}</div>
                                    </div>
                                    <div className="space-y-1">
                                      <span className="text-[8px] text-on-surface-variant uppercase font-bold">{t('organization')}</span>
                                      <div className="text-[10px] text-on-surface font-medium line-clamp-1">{t(ex.organization as any)}</div>
                                    </div>
                                  </div>
                                  <button onClick={(e) => { e.stopPropagation(); setSelectedExercise(ex); }} className="w-full py-2 bg-black/5 hover:bg-black/10 rounded text-[10px] font-bold uppercase tracking-widest transition-all">
                                    {t('viewDetails')}
                                  </button>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* ===== REPOSITION / CATEGORIZE MODAL ===== */}
      <AnimatePresence>
        {pendingObjective && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPendingObjective(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-surface-container rounded-2xl shadow-2xl overflow-hidden border border-white/10"
            >
              <div className="p-6 border-b border-black/5 bg-surface-container-high">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase font-black tracking-widest text-primary">
                    {pendingObjective.mode === 'add' ? t('sessionCategorySelect' as any) || 'Selecionar Categoria' : t('moveTo' as any)}
                  </span>
                  <button onClick={() => setPendingObjective(null)} className="p-2 hover:bg-black/5 rounded-full"><X className="w-5 h-5 text-on-surface-variant" /></button>
                </div>
                <h3 className="text-xl font-bold text-on-surface truncate pr-8">
                      {pendingObjective.value.replace(/^\[.*?\]/, '')}
                </h3>
              </div>
              
              <div className="p-6">
                {(() => {
                  const field = pendingObjective.field;
                  let categories: any[] = [...PRESETS.sessionTitles];
                  
                  if (field === 'technical' || field === 'drillTitles' || field === 'drillObjectives') {
                     categories = ['techCategoryHandling', 'techCategoryDiving', 'techCategoryAerial', 'techCategory1v1', 'techCategoryDistribution', 'techCategoryReactions'];
                  } else if (field === 'tactical' || field === 'tacticalPrinciples' || field === 'gameMoments') {
                     categories = ['momentOrganizedDefense', 'momentDefensiveTransition', 'momentOrganizedAttack', 'momentOffensiveTransition', 'momentSetPieces'];
                  } else if (field === 'physical') {
                     categories = ['physCategoryPower', 'physCategoryAgility', 'physCategoryReactions', 'physCategoryConditioning'];
                  } else if (field === 'drillOrganizations') {
                     categories = ['orgCategoryGoals', 'orgCategoryZones', 'orgCategoryEquipment'];
                  } else if (field === 'drillProgressions') {
                     categories = ['progCategoryLoad', 'progCategoryPressure', 'progCategoryConstraints'];
                  } else if (field === 'gameMoments') {
                     categories = ['momentOrganizedDefense', 'momentDefensiveTransition', 'momentOrganizedAttack', 'momentOffensiveTransition', 'momentSetPieces'];
                  } else if (field === 'athleteObservations') {
                     categories = ['# individualFeedback', '# sessionPositives', '# sessionAdjustments'];
                  }

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                      {categories.map((titleKey) => (
                        <button
                          key={titleKey}
                          onClick={() => {
                            if (pendingObjective.mode === 'add') {
                               const defaultOpts = (PRESETS.drills as any)[field.replace('drill', '').toLowerCase()] || [];
                               addCustomPreset(field, pendingObjective.value, defaultOpts, titleKey);
                            } else {
                               moveCustomPreset(field, pendingObjective.value, titleKey);
                            }
                            setPendingObjective(null);
                          }}
                          className="flex items-center gap-3 p-3 bg-surface border border-black/5 rounded-xl hover:border-primary hover:bg-primary/5 transition-all group text-left"
                        >
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Folder className="w-4 h-4 text-primary" />
                          </div>
                          <span className="text-xs font-bold text-on-surface uppercase tracking-tight">{t(titleKey as any)}</span>
                        </button>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
