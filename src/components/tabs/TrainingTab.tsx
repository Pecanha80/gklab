import React, { useState, useEffect, useMemo } from 'react';
import {
  Dumbbell,
  Target,
  Users,
  Clock,
  Plus,
  Trash2,
  FileText,
  X,
  Trophy,
  Wind,
  Library,
  Download,
  Calendar,
  ChevronRight,
  Edit3,
  FileImage,
  Dumbbell as DumbbellIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, getTodayDateString } from '../../lib/utils';
import { TrainingSession, Exercise } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';
import { useCustomPresets, type CustomPresetsState } from '../../hooks/useCustomPresets';
import { PRESETS } from '../../data/presets';
import { Section } from '../ui/Section';
import { QuickSelect } from '../ui/QuickSelect';
import { DrillForm } from '../forms/DrillForm';
import { LibraryPickerModal } from '../forms/LibraryPickerModal';
import { emptyDrill } from '../../hooks/useSessionForm';

import { handleExportSession } from '../../lib/exportSession';

interface TrainingTabProps {
  sessions: TrainingSession[];
  exercisesLibrary: Exercise[];
  savedMicrocycles: import('../../types').SavedMicrocycle[];
  deleteSession: (id: string) => Promise<void>;
  // Session form state
  isAddingSession: boolean;
  setIsAddingSession: (v: boolean) => void;
  newSession: Omit<TrainingSession, 'id'>;
  setNewSession: React.Dispatch<React.SetStateAction<Omit<TrainingSession, 'id'>>>;
  // Drill state
  isAddingDrill: boolean;
  setIsAddingDrill: (v: boolean) => void;
  drillContext: 'warmup' | 'main';
  setDrillContext: (v: 'warmup' | 'main') => void;
  editingDrillId: string | null;
  currentDrill: Omit<Exercise, 'id'>;
  setCurrentDrill: React.Dispatch<React.SetStateAction<Omit<Exercise, 'id'>>>;
  isSelectingFromLibrary: boolean;
  setIsSelectingFromLibrary: (v: boolean) => void;
  setIsTacticalBoardOpen: (v: boolean) => void;
  // Handlers
  translateContent: (content: string | string[] | undefined) => string;
  handleGeneralObjectivesChange: (selected: string[]) => void;
  handleAddSession: (e: React.FormEvent) => Promise<void>;
  handleAddDrill: () => void;
  handleEditDrill: (drill: Exercise, context: 'warmup' | 'main') => void;
  handleCancelDrill: () => void;
  handleRemoveDrill: (id: string) => void;
  applyDrillTemplate: (title: string) => void;
  applySessionTemplates: (titles: string[]) => void;
  loadExample: () => void;
  handleEditSession: (session: TrainingSession) => void;
  editingSessionId: string | null;
  // Navigation
  setActiveTab: (tab: string) => void;
  setViewingSession: (session: TrainingSession | null) => void;
  // Exercise search
  exerciseSearchTerm: string;
  setExerciseSearchTerm: (term: string) => void;
}

export const TrainingTab: React.FC<TrainingTabProps> = ({
  sessions,
  exercisesLibrary,
  savedMicrocycles,
  deleteSession,
  isAddingSession,
  setIsAddingSession,
  newSession,
  setNewSession,
  isAddingDrill,
  setIsAddingDrill,
  drillContext,
  setDrillContext,
  editingDrillId,
  currentDrill,
  setCurrentDrill,
  isSelectingFromLibrary,
  setIsSelectingFromLibrary,
  setIsTacticalBoardOpen,
  translateContent,
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
  editingSessionId,
  setActiveTab,
  setViewingSession,
  exerciseSearchTerm,
  setExerciseSearchTerm,
}) => {
  const { t } = useTranslation();
  const { customPresets, getOptions, addCustomPreset, removeCustomPreset, moveCustomPreset } = useCustomPresets();
  const [pendingObjective, setPendingObjective] = useState<{ value: string; field: keyof CustomPresetsState; mode: 'move' | 'add' } | null>(null);

  const emptySessionTemplate = {
    date: getTodayDateString(),
    category: [] as string[],
    numAthletes: 3,
    duration: [] as string[],
    generalObjectives: [] as string[],
    objectives: { technical: [] as string[], tactical: [] as string[], physical: [] as string[], cognitive: [] as string[] },
    warmup: [] as Exercise[],
    exercises: [] as Exercise[],
    integratedWithTeam: [],
    coolDown: [] as string[],
    observations: { positives: [] as string[], adjustments: [] as string[], individualEval: [] as string[] },
    titles: [] as string[],
    focus: [] as string[],
    time: '',
    attending: [] as string[],
    mesocycle: '',
    microcycleId: '',
  };

  // Auto-detect Mesocycle/Microcycle based on date
  React.useEffect(() => {
    const sessionDate = new Date(newSession.date + 'T00:00:00');
    const matchedMc = savedMicrocycles.find(mc => {
      const start = new Date(mc.startDate + 'T00:00:00');
      const end = new Date(mc.endDate + 'T00:00:00');
      return sessionDate >= start && sessionDate <= end;
    });

    if (matchedMc) {
      if (newSession.mesocycle !== matchedMc.mesocycle || newSession.microcycleId !== matchedMc.id) {
        setNewSession(prev => ({
          ...prev,
          mesocycle: matchedMc.mesocycle || '',
          microcycleId: matchedMc.id
        }));
      }
    }
  }, [newSession.date, savedMicrocycles]);

  const filteredGeneralObjectives = useMemo(() => {
    const allGeneral = getOptions('generalObjectives', PRESETS.objectives.general);
    if (!newSession.titles || newSession.titles.length === 0) return allGeneral;

    const filtered: string[] = [];
    let isCurrentGroupSelected = false;

    allGeneral.forEach(item => {
      if (item.startsWith('# ')) {
        const groupKey = item.replace('# ', '');
        isCurrentGroupSelected = newSession.titles.includes(groupKey);
        if (isCurrentGroupSelected) {
          filtered.push(item);
        }
      } else if (isCurrentGroupSelected) {
        filtered.push(item);
      }
    });

    // Handle custom presets
    const customGeneral = customPresets.generalObjectives;
    
    customGeneral.forEach(cg => {
      if (cg.startsWith('[')) {
        const match = cg.match(/^\[(.*?)\]/);
        const itemCategory = match ? match[1] : null;
        
        if (itemCategory && newSession.titles.includes(itemCategory)) {
          // Find where this category header is in the filtered list
          const headerIdx = filtered.findIndex(f => f === `# ${itemCategory}`);
          if (headerIdx !== -1) {
            // Insert after header (but after existing items in that group?)
            // For simplicity, find the end of that group
            let insertPos = headerIdx + 1;
            while (insertPos < filtered.length && !filtered[insertPos].startsWith('# ')) {
              insertPos++;
            }
            if (!filtered.includes(cg)) {
              filtered.splice(insertPos, 0, cg);
            }
          }
        }
      } else {
        // Flat custom presets (no category) go to 'Other'
        if (filtered.length > 0) {
          if (!filtered.includes('# sessionCategoryOther')) {
            filtered.push('# sessionCategoryOther');
          }
          if (!filtered.includes(cg)) filtered.push(cg);
        }
      }
    });

    return filtered.length > 0 ? filtered : allGeneral;
  }, [newSession.titles, customPresets.generalObjectives, getOptions]);

  return (
    <>
      <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black font-headline tracking-tight text-on-surface">{t('trainingSessions')}</h2>
        {!isAddingSession && (
          <button
            onClick={() => setIsAddingSession(true)}
            className="bg-primary hover:bg-primary-dim text-on-primary px-4 py-2 rounded-md font-label text-xs font-bold transition-all active:scale-95 flex items-center"
          >
            <Dumbbell className="w-4 h-4 mr-2" />
            {t('newSession')}
          </button>
        )}
      </div>

      <AnimatePresence>
        {isSelectingFromLibrary && (
          <LibraryPickerModal
            exercisesLibrary={exercisesLibrary}
            exerciseSearchTerm={exerciseSearchTerm}
            onSearchChange={setExerciseSearchTerm}
            onSelect={(ex) => {
              const exerciseWithNewId = { ...ex, id: crypto.randomUUID() };
              setNewSession(prev => ({
                ...prev,
                warmup: drillContext === 'warmup' ? [...prev.warmup, exerciseWithNewId] : prev.warmup,
                exercises: drillContext === 'main' ? [...prev.exercises, exerciseWithNewId] : prev.exercises,
              }));
              setIsSelectingFromLibrary(false);
            }}
            onClose={() => setIsSelectingFromLibrary(false)}
            onGoToLibrary={() => {
              setIsSelectingFromLibrary(false);
              setActiveTab('Exercises');
            }}
          />
        )}
      </AnimatePresence>

      {isAddingSession ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-surface-container p-0 rounded-xl border border-black/10 w-full max-w-[98vw] mx-auto overflow-hidden flex flex-col max-h-[calc(95vh-4rem)] md:max-h-[95vh]"
        >
          <div className="bg-surface-container-highest p-6 border-b border-black/10 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-on-surface flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                {editingSessionId ? t('editSession') : t('professionalTrainingSheet')}
              </h3>
              <p className="text-[10px] text-on-surface-variant uppercase font-label tracking-widest mt-1">{t('structuredMethodology')}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={loadExample}
                className="text-[10px] bg-secondary/10 text-secondary border border-secondary/20 px-3 py-1.5 rounded hover:bg-secondary/20 transition-all font-bold"
              >
                {t('loadExampleCrosses')}
              </button>
              <button
                onClick={() => setIsAddingSession(false)}
                className="text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-thin scrollbar-thumb-white/10">
            <form id="sessionForm" onSubmit={handleAddSession} className="space-y-8">

              {/* 1. Identification */}
              <Section title={t('sessionIdentification')} icon={Users}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                     <div className="flex justify-between items-center">
                       <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('sessionTitle')}</label>
                       <QuickSelect
                         label="Presets"
                         multiSelect
                         selectedValues={newSession.titles}
                         options={getOptions('sessionTitles', PRESETS.sessionTitles)}
                         onSelect={(val) => applySessionTemplates(val as string[])}
                         onDelete={(val) => removeCustomPreset('sessionTitles', val)}
                         isDeletable={(val) => !val.startsWith('#')}
                         onAdd={(val) => setPendingObjective({ value: val, field: 'sessionTitles', mode: 'add' })}
                         onMove={(val) => setPendingObjective({ value: val, field: 'sessionTitles', mode: 'move' })}
                       />
                     </div>
                     <div className="flex flex-wrap gap-1.5 min-h-[40px] bg-surface-container-highest border border-black/10 rounded px-2 py-2">
                       {newSession.titles.length === 0 && (
                         <span className="text-xs text-on-surface-variant/50 py-0.5">{t('drillTitlePlaceholder')}</span>
                       )}
                       {newSession.titles.map(title => (
                         <span key={title} className="inline-flex items-center gap-1 bg-primary/10 text-primary text-[10px] font-bold px-2 py-1 rounded-full">
                           {t(title as any)}
                           <button
                             type="button"
                             onClick={() => {
                               const updated = newSession.titles.filter(t_ => t_ !== title);
                               if (updated.length === 0) {
                                 setNewSession({ ...emptySessionTemplate, date: newSession.date, category: newSession.category, numAthletes: newSession.numAthletes });
                               } else {
                                 applySessionTemplates(updated);
                               }
                             }}
                             className="hover:text-error transition-colors"
                           >
                             <X className="w-3 h-3" />
                           </button>
                         </span>
                       ))}
                     </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('date')}</label>
                    <input type="date" value={newSession.date} onChange={e => setNewSession({ ...newSession, date: e.target.value })} className="w-full bg-surface-container-highest border border-black/10 rounded px-3 py-2 text-sm" />
                    {newSession.mesocycle && (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="text-[8px] bg-secondary/10 text-secondary px-1.5 py-0.5 rounded font-black uppercase tracking-widest">
                          {newSession.mesocycle}
                        </span>
                        {newSession.microcycleId && (
                           <span className="text-[8px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-black uppercase tracking-widest">
                             {savedMicrocycles.find(m => m.id === newSession.microcycleId)?.name}
                           </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('category')}</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={Array.isArray(newSession.category) ? newSession.category.map(c => t(c as any)).join(', ') : t(newSession.category as any)}
                        onChange={e => setNewSession({ ...newSession, category: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                        className="flex-1 bg-surface-container-highest border border-black/10 rounded px-3 py-2 text-sm"
                      />
                      <QuickSelect
                        label="Presets"
                        options={getOptions('categories', PRESETS.categories)}
                        onSelect={(vals) => setNewSession({ ...newSession, category: vals })}
                        selectedValues={typeof newSession.category === 'string' ? newSession.category.split(', ') : newSession.category}
                        onDelete={(val) => removeCustomPreset('categories', val)}
                        isDeletable={(val) => customPresets.categories.includes(val)}
                        onAdd={(val) => addCustomPreset('categories', val, PRESETS.categories)}
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('numAthletes')}</label>
                    <input type="number" value={newSession.numAthletes} onChange={e => setNewSession({ ...newSession, numAthletes: parseInt(e.target.value) })} className="w-full bg-surface-container-highest border border-black/10 rounded px-3 py-2 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('totalDuration')}</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={Array.isArray(newSession.duration) ? newSession.duration.map(d => t(d as any)).join(', ') : t(newSession.duration as any)}
                        onChange={e => setNewSession({ ...newSession, duration: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                        className="flex-1 bg-surface-container-highest border border-black/10 rounded px-3 py-2 text-sm"
                        placeholder={t('duration')}
                      />
                      <QuickSelect
                        label="Presets"
                        options={getOptions('durations', PRESETS.durations)}
                        onSelect={(vals) => setNewSession({ ...newSession, duration: vals.map(v => t(v as any)).join(' + ') })}
                        selectedValues={typeof newSession.duration === 'string' ? newSession.duration.split(' + ') : newSession.duration}
                        onDelete={(val) => removeCustomPreset('durations', val)}
                        isDeletable={(val) => !val.startsWith('#')}
                        onAdd={(val) => setPendingObjective({ value: val, field: 'durations', mode: 'add' })}
                        onMove={(val) => setPendingObjective({ value: val, field: 'durations', mode: 'move' })}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('generalObjective')}</label>
                      <QuickSelect
                        label="Presets"
                        multiSelect
                        selectedValues={newSession.generalObjectives}
                        options={filteredGeneralObjectives}
                        onSelect={(val) => handleGeneralObjectivesChange(val as string[])}
                        onDelete={(val) => removeCustomPreset('generalObjectives', val)}
                        isDeletable={(val) => !val.startsWith('#')}
                        onAdd={(val) => setPendingObjective({ value: val, field: 'generalObjectives', mode: 'add' })}
                        onMove={(val) => setPendingObjective({ value: val, field: 'generalObjectives', mode: 'move' })}
                      />
                    </div>
                     <textarea
                       value={newSession.generalObjectives.filter(Boolean).map(o => t(o as any)).join(', ')}
                       onChange={e => handleGeneralObjectivesChange(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                       className="w-full bg-surface-container-highest border border-black/10 rounded px-3 py-2 text-sm min-h-[60px]"
                       placeholder={t('objectivePlaceholder')}
                     />
                  </div>
                </div>
              </Section>

              {/* 2. Specific Objectives */}
              <Section title={t('sectionObjectives')} icon={Target}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(['technical', 'tactical', 'physical', 'cognitive'] as const).map((objKey) => (
                    <div key={objKey} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-[9px] text-on-surface-variant uppercase font-label">{t(objKey)}</label>
                        <QuickSelect
                          label="Presets"
                          options={getOptions(objKey, PRESETS.objectives[objKey])}
                          onSelect={(val) => setNewSession({
                            ...newSession,
                            objectives: { ...newSession.objectives, [objKey]: val }
                          })}
                          multiSelect={true}
                          selectedValues={Array.isArray(newSession.objectives[objKey]) ? newSession.objectives[objKey] as string[] : [newSession.objectives[objKey] as string]}
                          onDelete={(val) => removeCustomPreset(objKey, val)}
                          isDeletable={(val) => !val.startsWith('#')}
                          onAdd={(val) => setPendingObjective({ value: val, field: objKey, mode: 'add' })}
                          onMove={(val) => setPendingObjective({ value: val, field: objKey, mode: 'move' })}
                        />
                      </div>
                      <textarea
                        value={translateContent(newSession.objectives[objKey])}
                        onChange={e => setNewSession({
                          ...newSession,
                          objectives: { ...newSession.objectives, [objKey]: e.target.value.split('\n') }
                        })}
                        className="w-full bg-surface-container-highest border border-black/10 rounded px-3 py-2 text-xs min-h-[60px]"
                        placeholder={t(`${objKey}Placeholder` as any)}
                      />
                    </div>
                  ))}
                </div>
              </Section>

              {/* 3. Warm-up */}
              <Section title={t('sectionWarmUp')} icon={Clock}>
                <div className="space-y-4">
                  {newSession.warmup.map((drill, idx) => (
                    <div key={drill.id} className="bg-surface-container-highest p-4 rounded-lg border border-black/5 relative group">
                      <div className="absolute top-2 right-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button type="button" onClick={() => handleEditDrill(drill, 'warmup')} className="text-on-surface-variant hover:text-primary">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => handleRemoveDrill(drill.id)} className="text-on-surface-variant hover:text-error">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-primary/20 text-primary text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest">{t(drill.type as any)}</span>
                        <h5 className="text-sm font-bold text-on-surface">{idx + 1}. {t(drill.title as any)}</h5>
                        <span className="text-[10px] text-on-surface-variant ml-auto flex items-center"><Clock className="w-3 h-3 mr-1" /> {t(drill.duration as any)}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-[10px]">
                        <div><span className="text-primary uppercase font-bold">{t('objective')}:</span> {t(drill.objective as any)}</div>
                        <div><span className="text-primary uppercase font-bold">{t('organization')}:</span> {t(drill.organization as any)}</div>
                      </div>
                      {drill.diagram && (
                        <div className="mt-2 text-[8px] text-primary flex items-center gap-1 font-bold">
                          <FileImage className="w-3 h-3" /> {t('diagramAttached')}
                        </div>
                      )}
                    </div>
                  ))}

                  {isAddingDrill && drillContext === 'warmup' ? (
                    <DrillForm
                      currentDrill={currentDrill}
                      setCurrentDrill={setCurrentDrill}
                      editingDrillId={editingDrillId}
                      context="warmup"
                      translateContent={translateContent}
                      applyDrillTemplate={applyDrillTemplate}
                      onSave={handleAddDrill}
                      onCancel={handleCancelDrill}
                      onOpenTacticalBoard={() => setIsTacticalBoardOpen(true)}
                      onOpenLibrary={() => setIsSelectingFromLibrary(true)}
                      setPendingObjective={setPendingObjective}
                    />
                  ) : (
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => {
                          setDrillContext('warmup');
                          setIsAddingDrill(true);
                          setCurrentDrill({ ...emptyDrill, type: 'warmup' });
                        }}
                        className="flex-1 py-4 border-2 border-dashed border-black/10 rounded-lg text-on-surface-variant hover:border-primary hover:text-primary transition-all flex flex-col items-center justify-center gap-2"
                      >
                        <Plus className="w-6 h-6" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">{t('createNewExercise')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDrillContext('warmup');
                          setIsSelectingFromLibrary(true);
                        }}
                        className="flex-1 py-4 border-2 border-dashed border-black/10 rounded-lg text-on-surface-variant hover:border-secondary hover:text-secondary transition-all flex flex-col items-center justify-center gap-2"
                      >
                        <Library className="w-6 h-6" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">{t('addFromLibrary')}</span>
                      </button>
                    </div>
                  )}
                </div>
              </Section>

              {/* 4. Main Part */}
              <Section title={t('mainPartExercises')} icon={Dumbbell}>
                <div className="space-y-4">
                  {newSession.exercises.map((drill, idx) => (
                    <div key={drill.id} className="bg-surface-container-highest p-4 rounded-lg border border-black/5 relative group">
                      <div className="absolute top-2 right-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button type="button" onClick={() => handleEditDrill(drill, 'main')} className="text-on-surface-variant hover:text-primary">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => handleRemoveDrill(drill.id)} className="text-on-surface-variant hover:text-error">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-primary/20 text-primary text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest">{t(drill.type as any)}</span>
                        <h5 className="text-sm font-bold text-on-surface">{idx + 1}. {t(drill.title as any)}</h5>
                        <span className="text-[10px] text-on-surface-variant ml-auto flex items-center"><Clock className="w-3 h-3 mr-1" /> {t(drill.duration as any)}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-[10px]">
                        <div><span className="text-primary uppercase font-bold">{t('objective')}:</span> {t(drill.objective as any)}</div>
                        <div><span className="text-primary uppercase font-bold">{t('organization')}:</span> {t(drill.organization as any)}</div>
                      </div>
                      {drill.diagram && (
                        <div className="mt-2 text-[8px] text-primary flex items-center gap-1 font-bold">
                          <FileImage className="w-3 h-3" /> {t('diagramAttached')}
                        </div>
                      )}
                    </div>
                  ))}

                  {isAddingDrill && drillContext === 'main' ? (
                    <DrillForm
                      currentDrill={currentDrill}
                      setCurrentDrill={setCurrentDrill}
                      editingDrillId={editingDrillId}
                      context="main"
                      translateContent={translateContent}
                      applyDrillTemplate={applyDrillTemplate}
                      onSave={handleAddDrill}
                      onCancel={handleCancelDrill}
                      onOpenTacticalBoard={() => setIsTacticalBoardOpen(true)}
                      onOpenLibrary={() => setIsSelectingFromLibrary(true)}
                      setPendingObjective={setPendingObjective}
                    />
                  ) : (
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => {
                          setDrillContext('main');
                          setIsAddingDrill(true);
                          setCurrentDrill({ ...emptyDrill });
                        }}
                        className="flex-1 py-4 border-2 border-dashed border-black/10 rounded-lg text-on-surface-variant hover:border-primary hover:text-primary transition-all flex flex-col items-center justify-center gap-2"
                      >
                        <Plus className="w-6 h-6" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">{t('createNewExercise')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDrillContext('main');
                          setIsSelectingFromLibrary(true)
                        }}
                        className="flex-1 py-4 border-2 border-dashed border-black/10 rounded-lg text-on-surface-variant hover:border-secondary hover:text-secondary transition-all flex flex-col items-center justify-center gap-2"
                      >
                        <Library className="w-6 h-6" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">{t('addFromLibrary')}</span>
                      </button>
                    </div>
                  )}
                </div>
              </Section>

              {/* 5. Integrated with Team */}
              <Section title={t('sectionIntegrated' as any)} icon={Trophy}>
                <div className="space-y-4">
                  {newSession.integratedWithTeam?.map((integrated) => (
                    <div key={integrated.id} className="bg-surface-container-highest p-4 rounded-lg border border-black/5 relative group">
                      <button
                        type="button"
                        onClick={() => setNewSession(prev => ({ ...prev, integratedWithTeam: prev.integratedWithTeam?.filter(i => i.id !== integrated.id) }))}
                        className="absolute -top-2 -right-2 bg-error text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex justify-between items-center">
                              <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('format')}</label>
                              <QuickSelect
                                label="Presets"
                                options={getOptions('integratedFormats', PRESETS.integrated.formats)}
                                onSelect={(vals) => setNewSession(prev => ({ ...prev, integratedWithTeam: prev.integratedWithTeam?.map(i => i.id === integrated.id ? { ...i, format: vals.map(v => t(v as any)).join(', ') } : i) }))}
                                selectedValues={integrated.format ? (typeof integrated.format === 'string' ? integrated.format.split(', ') : integrated.format) : []}
                                onDelete={(val) => removeCustomPreset('integratedFormats', val)}
                                isDeletable={(val) => !val.startsWith('#')}
                                onAdd={(val) => setPendingObjective({ value: val, field: 'integratedFormats', mode: 'add' })}
                                onMove={(val) => setPendingObjective({ value: val, field: 'integratedFormats', mode: 'move' })}
                              />
                            </div>
                            <input
                              type="text"
                              value={Array.isArray(integrated.format) ? integrated.format.map(f => t(f as any)).join(', ') : t(integrated.format as any)}
                              onChange={e => setNewSession(prev => ({ ...prev, integratedWithTeam: prev.integratedWithTeam?.map(i => i.id === integrated.id ? { ...i, format: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } : i) }))}
                              className="w-full bg-surface border border-black/10 rounded px-3 py-2 text-xs"
                            />
                          </div>
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('number')}</label>
                            <QuickSelect
                              label="Presets"
                              options={getOptions('integratedNumbers', PRESETS.integrated.numbers)}
                              onSelect={(vals) => setNewSession(prev => ({ ...prev, integratedWithTeam: prev.integratedWithTeam?.map(i => i.id === integrated.id ? { ...i, number: vals.map(v => t(v as any)).join(', ') } : i) }))}
                              selectedValues={integrated.number ? (typeof integrated.number === 'string' ? integrated.number.split(', ') : integrated.number) : []}
                              onDelete={(val) => removeCustomPreset('integratedNumbers', val)}
                              isDeletable={(val) => !val.startsWith('#')}
                              onAdd={(val) => setPendingObjective({ value: val, field: 'integratedNumbers', mode: 'add' })}
                              onMove={(val) => setPendingObjective({ value: val, field: 'integratedNumbers', mode: 'move' })}
                            />
                          </div>
                          <input
                            type="text"
                            value={Array.isArray(integrated.number) ? integrated.number.map(n => t(n as any)).join(', ') : t(integrated.number as any)}
                            onChange={e => setNewSession(prev => ({ ...prev, integratedWithTeam: prev.integratedWithTeam?.map(i => i.id === integrated.id ? { ...i, number: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } : i) }))}
                            className="w-full bg-surface border border-black/10 rounded px-3 py-2 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('space')}</label>
                            <QuickSelect
                              label="Presets"
                              options={getOptions('integratedSpaces', PRESETS.integrated.spaces)}
                              onSelect={(vals) => setNewSession(prev => ({ ...prev, integratedWithTeam: prev.integratedWithTeam?.map(i => i.id === integrated.id ? { ...i, space: vals.map(v => t(v as any)).join(', ') } : i) }))}
                              selectedValues={integrated.space ? (typeof integrated.space === 'string' ? integrated.space.split(', ') : integrated.space) : []}
                              onDelete={(val) => removeCustomPreset('integratedSpaces', val)}
                              isDeletable={(val) => !val.startsWith('#')}
                              onAdd={(val) => setPendingObjective({ value: val, field: 'integratedSpaces', mode: 'add' })}
                              onMove={(val) => setPendingObjective({ value: val, field: 'integratedSpaces', mode: 'move' })}
                            />
                          </div>
                          <input
                            type="text"
                            value={Array.isArray(integrated.space) ? integrated.space.map(s => t(s as any)).join(', ') : t(integrated.space as any)}
                            onChange={e => setNewSession(prev => ({ ...prev, integratedWithTeam: prev.integratedWithTeam?.map(i => i.id === integrated.id ? { ...i, space: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } : i) }))}
                            className="w-full bg-surface border border-black/10 rounded px-3 py-2 text-xs"
                            placeholder={t('spacePlaceholder' as any)}
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('time')}</label>
                            <QuickSelect
                              label="Presets"
                              options={getOptions('integratedTimes', PRESETS.integrated.times)}
                              onSelect={(vals) => setNewSession(prev => ({ ...prev, integratedWithTeam: prev.integratedWithTeam?.map(i => i.id === integrated.id ? { ...i, time: vals.map(v => t(v as any)).join(', ') } : i) }))}
                              selectedValues={integrated.time ? (typeof integrated.time === 'string' ? integrated.time.split(', ') : integrated.time) : []}
                              onDelete={(val) => removeCustomPreset('integratedTimes', val)}
                              isDeletable={(val) => !val.startsWith('#')}
                              onAdd={(val) => setPendingObjective({ value: val, field: 'integratedTimes', mode: 'add' })}
                              onMove={(val) => setPendingObjective({ value: val, field: 'integratedTimes', mode: 'move' })}
                            />
                          </div>
                          <input
                            type="text"
                            value={Array.isArray(integrated.time) ? integrated.time.map(time => t(time as any)).join(', ') : t(integrated.time as any)}
                            onChange={e => setNewSession(prev => ({ ...prev, integratedWithTeam: prev.integratedWithTeam?.map(i => i.id === integrated.id ? { ...i, time: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } : i) }))}
                            className="w-full bg-surface border border-black/10 rounded px-3 py-2 text-xs"
                            placeholder={t('durationPlaceholder' as any)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setNewSession(prev => ({ ...prev, integratedWithTeam: [...(prev.integratedWithTeam || []), { id: crypto.randomUUID(), format: '', number: '', space: '', time: '' }] }))}
                    className="w-full py-2 border border-dashed border-black/20 rounded-lg text-on-surface-variant hover:text-primary hover:border-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2 text-xs font-bold"
                  >
                    <Plus className="w-4 h-4" /> {t('addIntegratedExercise')}
                  </button>
                </div>
              </Section>

              {/* 6. Cool Down */}
              <Section title={t('sectionCoolDown' as any)} icon={Wind}>
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[9px] text-on-surface-variant uppercase font-label">Exercises</label>
                    <QuickSelect
                      label="Presets"
                      options={getOptions('coolDowns', PRESETS.coolDowns)}
                      onSelect={(vals) => setNewSession({ ...newSession, coolDown: vals.map(v => t(v as any)).join('\n') })}
                      selectedValues={typeof newSession.coolDown === 'string' ? newSession.coolDown.split('\n') : newSession.coolDown}
                      onDelete={(val) => removeCustomPreset('coolDowns', val)}
                      isDeletable={(val) => !val.startsWith('#')}
                      onAdd={(val) => setPendingObjective({ value: val, field: 'coolDowns', mode: 'add' })}
                      onMove={(val) => setPendingObjective({ value: val, field: 'coolDowns', mode: 'move' })}
                    />
                  </div>
                  <textarea
                    value={translateContent(newSession.coolDown)}
                    onChange={e => setNewSession({ ...newSession, coolDown: e.target.value.split('\n') })}
                    className="w-full bg-surface-container-highest border border-black/10 rounded px-3 py-2 text-xs min-h-[60px]"
                  />
                </div>
              </Section>

              {/* 7. Observations */}
              <Section title={t('coachObservations')} icon={Edit3}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('positivePoints')}</label>
                      <QuickSelect
                        label="Presets"
                        options={getOptions('obsPositives', PRESETS.observations.positives)}
                        onSelect={(vals) => setNewSession({ ...newSession, observations: { ...newSession.observations, positives: vals.map(v => t(v as any)).join('\n') } })}
                        selectedValues={typeof newSession.observations.positives === 'string' ? newSession.observations.positives.split('\n') : newSession.observations.positives}
                        multiSelect={true}
                        onDelete={(val) => removeCustomPreset('obsPositives', val)}
                        isDeletable={(val) => !val.startsWith('#')}
                        onAdd={(val) => setPendingObjective({ value: val, field: 'obsPositives', mode: 'add' })}
                        onMove={(val) => setPendingObjective({ value: val, field: 'obsPositives', mode: 'move' })}
                      />
                    </div>
                    <textarea
                      value={translateContent(newSession.observations.positives)}
                      onChange={e => setNewSession({ ...newSession, observations: { ...newSession.observations, positives: e.target.value.split('\n') } })}
                      className="w-full bg-surface-container-highest border border-black/10 rounded px-3 py-2 text-xs min-h-[80px]"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('necessaryAdjustments')}</label>
                      <QuickSelect
                        label="Presets"
                        options={getOptions('obsAdjustments', PRESETS.observations.adjustments)}
                        onSelect={(vals) => setNewSession({ ...newSession, observations: { ...newSession.observations, adjustments: vals.map(v => t(v as any)).join('\n') } })}
                        selectedValues={typeof newSession.observations.adjustments === 'string' ? newSession.observations.adjustments.split('\n') : newSession.observations.adjustments}
                        multiSelect={true}
                        onDelete={(val) => removeCustomPreset('obsAdjustments', val)}
                        isDeletable={(val) => !val.startsWith('#')}
                        onAdd={(val) => setPendingObjective({ value: val, field: 'obsAdjustments', mode: 'add' })}
                        onMove={(val) => setPendingObjective({ value: val, field: 'obsAdjustments', mode: 'move' })}
                      />
                    </div>
                    <textarea
                      value={translateContent(newSession.observations.adjustments)}
                      onChange={e => setNewSession({ ...newSession, observations: { ...newSession.observations, adjustments: e.target.value.split('\n') } })}
                      className="w-full bg-surface-container-highest border border-black/10 rounded px-3 py-2 text-xs min-h-[80px]"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('individualEvaluation')}</label>
                      <QuickSelect
                        label="Presets"
                        options={getOptions('obsEvaluations', PRESETS.observations.evaluations)}
                        onSelect={(vals) => setNewSession({ ...newSession, observations: { ...newSession.observations, individualEval: vals.map(v => t(v as any)).join('\n') } })}
                        selectedValues={typeof newSession.observations.individualEval === 'string' ? newSession.observations.individualEval.split('\n') : newSession.observations.individualEval}
                        multiSelect={true}
                        onDelete={(val) => removeCustomPreset('obsEvaluations', val)}
                        isDeletable={(val) => !val.startsWith('#')}
                        onAdd={(val) => setPendingObjective({ value: val, field: 'obsEvaluations', mode: 'add' })}
                        onMove={(val) => setPendingObjective({ value: val, field: 'obsEvaluations', mode: 'move' })}
                      />
                    </div>
                    <textarea
                      value={translateContent(newSession.observations.individualEval)}
                      onChange={e => setNewSession({ ...newSession, observations: { ...newSession.observations, individualEval: e.target.value.split('\n') } })}
                      className="w-full bg-surface-container-highest border border-black/10 rounded px-3 py-2 text-xs min-h-[80px]"
                    />
                  </div>
                </div>
              </Section>

            </form>
          </div>

          <div className="bg-surface-container-highest p-6 border-t border-black/10 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsAddingSession(false)}
              className="px-6 py-2 rounded-md font-label text-xs font-bold text-on-surface-variant hover:text-on-surface transition-all"
            >
              {t('discard')}
            </button>
            <button
              form="sessionForm"
              type="submit"
              className="bg-primary hover:bg-primary-dim text-on-primary px-8 py-2 rounded-md font-label text-xs font-bold transition-all shadow-lg shadow-primary/20"
            >
              {editingSessionId ? t('saveChanges') : t('saveTrainingSheet')}
            </button>
          </div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map(session => (
            <div key={session.id} id={`session-card-${session.id}`} onClick={() => setViewingSession(session)} className="bg-surface-container-low rounded-xl overflow-hidden border border-black/5 hover:border-black/10 transition-all group cursor-pointer flex flex-col">
              <div className="h-48 relative overflow-hidden shrink-0">
                <img
                  src={session.imageUrl || "https://images.unsplash.com/photo-1526232761682-d26e03ac148e?q=80&w=800&auto=format&fit=crop"}
                  alt={session.titles?.map(t_ => t(t_ as any)).join(' & ')}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low to-transparent" />
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExportSession(session.id);
                    }}
                    className="p-2 bg-white/80 backdrop-blur-md rounded-md text-on-surface hover:bg-primary hover:text-on-primary transition-all"
                    title={t('exportPdf')}
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditSession(session);
                    }}
                    className="p-2 bg-white/80 backdrop-blur-md rounded-md text-on-surface hover:bg-primary hover:text-on-primary transition-all"
                    title={t('editSession')}
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(t('deleteThisSession'))) {
                        deleteSession(session.id);
                      }
                    }}
                    className="p-2 bg-white/80 backdrop-blur-md rounded-md text-on-surface hover:bg-error hover:text-on-primary transition-all"
                    title="Delete Session"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="absolute bottom-4 left-4 right-4">
                  {session.isLive && <span className="bg-primary/90 text-on-primary text-[10px] px-2 py-1 font-bold rounded mb-2 inline-block">{t('live')}</span>}
                  <h4 className="text-xl font-black font-headline truncate">{session.titles?.map(t_ => t(t_ as any)).join(' & ')}</h4>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-[10px] text-on-surface-variant flex items-center"><Calendar className="w-3 h-3 mr-1" /> {session.date}</p>
                    <p className="text-[10px] text-on-surface-variant flex items-center"><Clock className="w-3 h-3 mr-1" /> {session.duration}</p>
                  </div>
                </div>
              </div>
              <div className="p-6 flex flex-col flex-1">
                <div className="mb-4">
                  <p className="text-[10px] text-on-surface-variant font-label uppercase mb-2">{t('category')}: {t(session.category as any)}</p>
                  <p className="text-[10px] text-primary font-bold uppercase mb-1">{t('objective')}</p>
                  <p className="text-xs text-on-surface line-clamp-2">{session.generalObjectives?.map(o => t(o as any)).join(', ')}</p>
                </div>
                <div className="pt-4 border-t border-black/5 flex justify-between items-center mt-auto">
                  <div className="flex items-center gap-4">
                    <div className="flex -space-x-2">
                      {session.attending?.map((a, i) => (
                        <div key={i} className="w-8 h-8 rounded-full border-2 border-surface-container bg-surface-variant flex items-center justify-center text-[10px] font-bold">
                          {a}
                        </div>
                      ))}
                    </div>
                    {session.exercises && session.exercises.length > 0 && (
                      <div className="flex items-center text-[10px] text-primary font-bold bg-primary/10 px-2 py-1 rounded">
                        <Target className="w-3 h-3 mr-1" /> {session.exercises.length} {t('exercises')}
                      </div>
                    )}
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setViewingSession(session); }} className="text-primary text-xs font-label hover:underline flex items-center">
                    {t('viewSheet')} <ChevronRight className="w-3 h-3 ml-1" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {sessions.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-black/10 rounded-xl">
              <DumbbellIcon className="w-12 h-12 text-on-surface-variant mb-4" />
              <h3 className="text-xl font-bold text-on-surface mb-2">{t('noTrainingSessions')}</h3>
              <p className="text-on-surface-variant max-w-md mb-6">{t('noTrainingSessionsDescription')}</p>
              <button
                onClick={() => setIsAddingSession(true)}
                className="bg-primary hover:bg-primary-dim text-on-primary px-6 py-3 rounded-md font-label text-sm font-bold transition-all"
              >
                {t('createFirstSession')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>

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
                  } else if (field === 'tactical') {
                     categories = ['tactCategoryOrganization', 'tactCategorySetPieces', 'tactCategoryPositioning', 'tactCategoryProtection', 'tactCategorySupport', 'tactCategoryTransition'];
                  } else if (field === 'physical') {
                     categories = ['physCategoryPower', 'physCategoryAgility', 'physCategoryReactions', 'physCategoryConditioning'];
                  } else if (field === 'drillOrganizations') {
                     categories = ['orgCategoryGoals', 'orgCategoryZones', 'orgCategoryEquipment'];
                  } else if (field === 'drillProgressions') {
                     categories = ['progCategoryLoad', 'progCategoryPressure', 'progCategoryConstraints'];
                  }

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                      {categories.map((titleKey) => (
                        <button
                          key={titleKey}
                          onClick={() => {
                            const { value, field, mode } = pendingObjective;
                            const actualValue = value.replace(/^\[.*?\]/, '');
                            const newFullValue = titleKey ? `[${titleKey}]${actualValue}` : actualValue;
                            
                            let defaultOptions: readonly string[] = [];
                            if (field === 'generalObjectives') defaultOptions = PRESETS.objectives.general;
                            else if (field === 'sessionTitles') defaultOptions = PRESETS.sessionTitles;
                            else if (field === 'durations') defaultOptions = PRESETS.durations;
                            else if (['technical', 'tactical', 'physical', 'cognitive'].includes(field)) defaultOptions = PRESETS.objectives[field as keyof typeof PRESETS.objectives] as any;
                            else {
                               const p = PRESETS as any;
                               defaultOptions = p[field] || p.drills?.[field.replace('drill', '').toLowerCase()] || [];
                            }

                            if (mode === 'add') {
                              addCustomPreset(field, value, defaultOptions, titleKey);
                              if (field === 'generalObjectives') {
                                handleGeneralObjectivesChange([...newSession.generalObjectives.filter(Boolean), newFullValue]);
                              } else if (field === 'sessionTitles') {
                                setNewSession(prev => ({ ...prev, titles: [...prev.titles, newFullValue] }));
                              } else if (field === 'durations') {
                                setNewSession(prev => ({ ...prev, duration: newFullValue }));
                              } else if (['technical', 'tactical', 'physical', 'cognitive'].includes(field)) {
                                setNewSession(prev => ({
                                  ...prev,
                                  objectives: { ...prev.objectives, [field]: [...((prev.objectives as any)[field] || []), newFullValue] }
                                }));
                              }
                            } else {
                              moveCustomPreset(field, value, titleKey);
                              
                              if (field === 'generalObjectives' && newSession.generalObjectives.includes(value)) {
                                handleGeneralObjectivesChange(
                                  newSession.generalObjectives.filter(Boolean).map(o => o === value ? newFullValue : o)
                                );
                              } else if (field === 'sessionTitles' && newSession.titles.includes(value)) {
                                setNewSession(prev => ({ ...prev, titles: prev.titles.map(o => o === value ? newFullValue : o) }));
                              } else if (field === 'durations' && newSession.duration === value) {
                                setNewSession(prev => ({ ...prev, duration: newFullValue }));
                              } else if (['technical', 'tactical', 'physical', 'cognitive'].includes(field)) {
                                 setNewSession(prev => ({
                                   ...prev,
                                   objectives: { 
                                     ...prev.objectives, 
                                     [field]: ((prev.objectives as any)[field] || []).map((o: string) => o.trim() === value.trim() ? newFullValue : o)
                                   }
                                 }));
                              }
                            }
                            setPendingObjective(null);
                          }}
                          className="group flex items-center gap-3 p-4 bg-surface-container-highest hover:bg-primary/10 border border-black/5 rounded-xl transition-all text-left"
                        >
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform shrinking-0">
                            <Plus className="w-4 h-4 text-primary" />
                          </div>
                          <span className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">
                            {t(titleKey as any)}
                          </span>
                        </button>
                      ))}
                      <button
                        onClick={() => {
                          const { value, field, mode } = pendingObjective;
                          const actualValue = (value as string).replace(/^\[.*?\]/, '');
                          let defaultOptions: readonly string[] = [];
                          if (field === 'generalObjectives') defaultOptions = PRESETS.objectives.general;
                          else if (field === 'sessionTitles') defaultOptions = PRESETS.sessionTitles;
                          else if (field === 'durations') defaultOptions = PRESETS.durations;
                          else if (['technical', 'tactical', 'physical', 'cognitive'].includes(field)) defaultOptions = PRESETS.objectives[field as keyof typeof PRESETS.objectives] as any;
                          else {
                             const p = PRESETS as any;
                             defaultOptions = p[field] || p.drills?.[field.replace('drill', '').toLowerCase()] || [];
                          }
                          
                          if (mode === 'add') {
                            addCustomPreset(field as any, value as any, defaultOptions, '');
                            if (field === 'generalObjectives') {
                               handleGeneralObjectivesChange([...newSession.generalObjectives.filter(Boolean), actualValue]);
                            } else if (field === 'sessionTitles') {
                               setNewSession(prev => ({ ...prev, titles: [...prev.titles, actualValue] }));
                            } else if (field === 'durations') {
                               setNewSession(prev => ({ ...prev, duration: actualValue }));
                            } else if (['technical', 'tactical', 'physical', 'cognitive'].includes(field)) {
                              setNewSession(prev => ({
                                ...prev,
                                objectives: { ...prev.objectives, [field]: [...((prev.objectives as any)[field] || []), actualValue] }
                              }));
                            }
                          } else {
                            moveCustomPreset(field as any, value as any, '');
                            if (field === 'generalObjectives' && newSession.generalObjectives.includes(value)) {
                               handleGeneralObjectivesChange(
                                 newSession.generalObjectives.filter(Boolean).map(o => o === value ? actualValue : o)
                               );
                            } else if (field === 'sessionTitles' && newSession.titles.includes(value)) {
                               setNewSession(prev => ({ ...prev, titles: prev.titles.map(o => o === value ? actualValue : o) }));
                            } else if (field === 'durations' && newSession.duration === value) {
                               setNewSession(prev => ({ ...prev, duration: actualValue }));
                            } else if (['technical', 'tactical', 'physical', 'cognitive'].includes(field)) {
                               setNewSession(prev => ({
                                 ...prev,
                                 objectives: { 
                                   ...prev.objectives, 
                                   [field]: ((prev.objectives as any)[field] || []).map((o: string) => o === value ? actualValue : o)
                                 }
                               }));
                            }
                          }
                          setPendingObjective(null);
                        }}
                        className="group flex items-center gap-3 p-4 bg-on-surface/5 hover:bg-on-surface/10 border border-dashed border-black/10 rounded-xl transition-all text-left col-span-full mt-2"
                      >
                        <div className="w-8 h-8 rounded-lg bg-on-surface/10 flex items-center justify-center">
                          <X className="w-4 h-4 text-on-surface-variant" />
                        </div>
                        <span className="text-sm font-bold text-on-surface opacity-70 italic">
                          {t('sessionCategoryNone' as any) || 'Sem Categoria / Geral'}
                        </span>
                      </button>
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
