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
  goalkeepers: import('../../types').Goalkeeper[];
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
  goalkeepers,
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
      <div className="space-y-10 animate-in">
        <div className="glass-card p-8 rounded-[2.5rem] border-primary/50 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-[1.5rem] bg-white/5 border border-white/10 flex items-center justify-center shadow-[0_0_25px_rgba(255,255,255,0.05)]">
              <Dumbbell className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-on-surface tracking-tighter leading-none">{t('trainingSessions')}</h2>
              <p className="text-[10px] text-primary font-black uppercase tracking-[0.2em] mt-2">Manage your tactical drills</p>
            </div>
          </div>
          {!isAddingSession && (
            <button
              onClick={() => setIsAddingSession(true)}
              className="button-primary flex items-center justify-center gap-3 px-10 shadow-premium group"
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
              <span>{t('newSession')}</span>
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
          className="bg-surface-container p-0 rounded-xl border border-primary/40 w-full max-w-[98vw] mx-auto overflow-hidden flex flex-col max-h-[calc(95vh-4rem)] md:max-h-[95vh]"
        >
          <div className="bg-surface-container-highest p-6 border-b border-primary/40 flex items-center justify-between">
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

                 <div className="flex flex-wrap items-start gap-2">

                   {/* Título da Sessão */}
                   <div className="flex-[2] min-w-[180px] space-y-1">
                     <div className="flex items-center gap-2">
                       <label className="text-[9px] text-on-surface-variant uppercase font-label font-bold">{t('sessionTitle')}</label>
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
                     <div className="w-full bg-surface-container-highest border border-primary/40 rounded px-2 py-1.5 min-h-[44px] flex flex-wrap gap-1 transition-all">
                       {newSession.titles.length === 0 && (
                         <span className="text-[10px] text-on-surface-variant/40 py-1">{t('drillTitlePlaceholder')}</span>
                       )}
                       {newSession.titles.map(title => (
                         <span key={title} className="inline-flex items-center gap-1 bg-primary/10 text-primary text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                           {t(title as any)}
                           <button type="button" onClick={() => { const u = newSession.titles.filter(t_ => t_ !== title); u.length === 0 ? setNewSession({ ...newSession, titles: [] }) : applySessionTemplates(u); }} className="hover:text-error transition-colors"><X className="w-2.5 h-2.5" /></button>
                         </span>
                       ))}
                     </div>
                   </div>

                   {/* Objetivo Geral */}
                   <div className="flex-[3] min-w-[250px] space-y-1">
                     <div className="flex items-center gap-2">
                       <label className="text-[9px] text-on-surface-variant uppercase font-label font-bold">{t('generalObjective')}</label>
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
                       className="w-full bg-surface-container-highest border border-primary/40 rounded px-2 py-1.5 text-[11px] min-h-[44px] outline-none resize-none leading-tight font-medium"
                       placeholder={t('objectivePlaceholder')}
                     />
                   </div>

                   {/* Categoria */}
                   <div className="flex-1 min-w-[120px] space-y-1">
                     <div className="flex items-center gap-2">
                       <label className="text-[9px] text-on-surface-variant uppercase font-label font-bold">{t('category')}</label>
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
                     <input
                       type="text"
                       value={Array.isArray(newSession.category) ? newSession.category.map(c => t(c as any)).join(', ') : t(newSession.category as any)}
                       onChange={e => setNewSession({ ...newSession, category: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                       className="w-full bg-surface-container-highest border border-primary/40 rounded px-2 py-1.5 text-[11px] h-[44px] outline-none font-medium text-center"
                     />
                   </div>

                   {/* Data */}
                   <div className="w-[130px] shrink-0 space-y-1">
                     <div className="flex items-center gap-2">
                       <label className="text-[9px] text-on-surface-variant uppercase font-label font-bold">{t('date')}</label>
                     </div>
                     <input
                       type="date"
                       value={newSession.date}
                       onChange={e => setNewSession({ ...newSession, date: e.target.value })}
                       className="w-full bg-surface-container-highest border border-primary/40 rounded px-2 py-1.5 text-[11px] h-[44px] outline-none font-medium"
                     />
                   </div>

                   {/* Duração Total */}
                   <div className="w-[85px] shrink-0 space-y-1">
                     <div className="flex items-center gap-2">
                       <label className="text-[9px] text-on-surface-variant uppercase font-label font-bold">DUR.</label>
                       <QuickSelect
                         label=""
                         options={getOptions('durations', PRESETS.durations)}
                         onSelect={(vals) => setNewSession({ ...newSession, duration: vals.map(v => t(v as any)).join(' + ') })}
                         selectedValues={typeof newSession.duration === 'string' ? newSession.duration.split(' + ') : newSession.duration}
                         onDelete={(val) => removeCustomPreset('durations', val)}
                         isDeletable={(val) => !val.startsWith('#')}
                         onAdd={(val) => setPendingObjective({ value: val, field: 'durations', mode: 'add' })}
                         onMove={(val) => setPendingObjective({ value: val, field: 'durations', mode: 'move' })}
                       />
                     </div>
                     <input
                       type="text"
                       value={Array.isArray(newSession.duration) ? (newSession.duration.length > 0 ? newSession.duration[0] : '') : newSession.duration}
                       onChange={e => setNewSession({ ...newSession, duration: [e.target.value] })}
                       className="w-full bg-surface-container-highest border border-primary/40 rounded px-2 py-1.5 text-[12px] font-bold text-primary h-[44px] outline-none text-center"
                       placeholder="min"
                     />
                   </div>

                 </div>

                 {/* UEFA A Parameters Divider */}
                 <div className="border-t border-primary/20 pt-4 mt-2">
                     <p className="text-[9px] text-primary/50 font-black uppercase tracking-[0.2em] mb-3">{t('uefaAParameters' as any) || 'UEFA A GK Parameters'}</p>
                   </div>

                   {/* Momentos do Jogo */}
                   <div className="space-y-1">
                     <div className="flex items-center gap-2">
                       <label className="text-[9px] text-on-surface-variant uppercase font-label font-bold">{t('gameMomentsLabel')}</label>
                       <QuickSelect
                         label="Presets"
                         multiSelect
                         selectedValues={newSession.gameMoments || []}
                         options={getOptions('gameMoments' as any, ['momentOrganizedDefense','momentDefensiveTransition','momentOrganizedAttack','momentOffensiveTransition','momentSetPieces'])}
                         onSelect={(val) => setNewSession({ ...newSession, gameMoments: val })}
                         onDelete={(val) => removeCustomPreset('gameMoments' as any, val)}
                         isDeletable={(val) => !val.startsWith('#')}
                         onAdd={(val) => setPendingObjective({ value: val, field: 'gameMoments' as any, mode: 'add' })}
                         onMove={(val) => setPendingObjective({ value: val, field: 'gameMoments' as any, mode: 'move' })}
                       />
                     </div>
                     <div className="w-full bg-surface-container-highest border border-primary/40 rounded px-3 py-2 min-h-[44px] flex flex-wrap gap-1.5 transition-all">
                       {(newSession.gameMoments || []).length === 0 && (
                         <span className="text-[11px] text-on-surface-variant/40 py-0.5">{t('all')}</span>
                       )}
                       {(newSession.gameMoments || []).map(moment => (
                         <span key={moment} className="inline-flex items-center gap-1 bg-secondary/10 text-secondary text-[10px] font-bold px-2 py-0.5 rounded-full">
                           {t(moment as any)}
                           <button type="button" onClick={() => setNewSession({ ...newSession, gameMoments: newSession.gameMoments?.filter(m => m !== moment) })} className="hover:text-error transition-colors"><X className="w-3 h-3" /></button>
                         </span>
                       ))}
                     </div>
                   </div>

                   {/* Princípios Táticos */}
                   <div className="space-y-1">
                     <div className="flex items-center gap-2">
                       <label className="text-[9px] text-on-surface-variant uppercase font-label font-bold">{t('tacticalPrinciplesLabel')}</label>
                       <QuickSelect
                         label="Presets"
                         multiSelect
                         selectedValues={newSession.tacticalPrinciples || []}
                         options={getOptions('tacticalPrinciples' as any, PRESETS.tacticalPrinciples || [])}
                         onSelect={(val) => setNewSession({ ...newSession, tacticalPrinciples: val })}
                         onDelete={(val) => removeCustomPreset('tacticalPrinciples' as any, val)}
                         isDeletable={(val) => !val.startsWith('#')}
                         onAdd={(val) => setPendingObjective({ value: val, field: 'tacticalPrinciples' as any, mode: 'add' })}
                         onMove={(val) => setPendingObjective({ value: val, field: 'tacticalPrinciples' as any, mode: 'move' })}
                       />
                     </div>
                       <textarea
                         value={(newSession.tacticalPrinciples || []).map(o => t(o as any)).join(', ')}
                         onChange={e => setNewSession({ ...newSession, tacticalPrinciples: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                         className="w-full bg-surface-container-highest border border-primary/40 rounded px-3 py-2 text-[11px] min-h-[44px] outline-none resize-none leading-tight font-medium"
                         placeholder="Ex: Proteção do gol, controle de profundidade..."
                       />
                     </div>
 
                </Section>




              {/* 2. Specific Objectives */}
              <Section title={t('sectionObjectives')} icon={Target}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(['technical', 'tactical', 'physical', 'cognitive'] as const).map((objKey) => (
                    <div key={objKey} className="space-y-1">
                      <div className="flex items-center gap-2">
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
                        className="w-full bg-surface-container-highest border border-primary/40 rounded px-3 py-2 text-xs min-h-[60px]"
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
                    <div key={drill.id} className="bg-surface-container-highest p-4 rounded-lg border border-primary/20 relative group">
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
                        className="flex-1 py-4 border-2 border-dashed border-primary/40 rounded-lg text-on-surface-variant hover:border-primary hover:text-primary transition-all flex flex-col items-center justify-center gap-2"
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
                        className="flex-1 py-4 border-2 border-dashed border-primary/40 rounded-lg text-on-surface-variant hover:border-secondary hover:text-secondary transition-all flex flex-col items-center justify-center gap-2"
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
                    <div key={drill.id} className="bg-surface-container-highest p-4 rounded-lg border border-primary/20 relative group">
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
                        className="flex-1 py-4 border-2 border-dashed border-primary/40 rounded-lg text-on-surface-variant hover:border-primary hover:text-primary transition-all flex flex-col items-center justify-center gap-2"
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
                        className="flex-1 py-4 border-2 border-dashed border-primary/40 rounded-lg text-on-surface-variant hover:border-secondary hover:text-secondary transition-all flex flex-col items-center justify-center gap-2"
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
                    <div key={integrated.id} className="bg-surface-container-highest p-4 rounded-lg border border-primary/20 relative group">
                      <button
                        type="button"
                        onClick={() => setNewSession(prev => ({ ...prev, integratedWithTeam: prev.integratedWithTeam?.filter(i => i.id !== integrated.id) }))}
                        className="absolute -top-2 -right-2 bg-error text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
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
                              className="w-full bg-surface border border-primary/40 rounded px-3 py-2 text-xs"
                            />
                          </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
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
                            className="w-full bg-surface border border-primary/40 rounded px-3 py-2 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
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
                            className="w-full bg-surface border border-primary/40 rounded px-3 py-2 text-xs"
                            placeholder={t('spacePlaceholder' as any)}
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
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
                            className="w-full bg-surface border border-primary/40 rounded px-3 py-2 text-xs"
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
                  <div className="flex items-center gap-2">
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
                    className="w-full bg-surface-container-highest border border-primary/40 rounded px-3 py-2 text-xs min-h-[60px]"
                  />
                </div>
              </Section>

              {/* 7. Observations */}
              <Section title={t('coachObservations')} icon={Edit3}>
                <div className="space-y-8">
                  {/* Session Observations */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] text-on-surface-variant font-black uppercase tracking-widest flex items-center gap-2">
                       {t('sessionObservations')}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
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
                          onChange={e => setNewSession({
                            ...newSession,
                            observations: { ...newSession.observations, positives: e.target.value.split('\n') }
                          })}
                          className="w-full bg-surface-container-highest border border-primary/40 rounded px-3 py-2 text-xs min-h-[60px]"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('adjustmentsForNext')}</label>
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
                          onChange={e => setNewSession({
                            ...newSession,
                            observations: { ...newSession.observations, adjustments: e.target.value.split('\n') }
                          })}
                          className="w-full bg-surface-container-highest border border-primary/40 rounded px-3 py-2 text-xs min-h-[60px]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Athlete Observations */}
                  <div className="space-y-4 border-t border-primary/20 pt-8">
                    <h4 className="text-[10px] text-on-surface-variant font-black uppercase tracking-widest flex items-center gap-2">
                       {t('athletesObservations' as any) || 'ObservaÃ§Ãµes dos Atletas'}
                    </h4>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="md:col-span-1 space-y-1">
                            <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('selectAthletes' as any) || 'Selecionar Atletas'}</label>
                            <div className="flex flex-wrap gap-1.5 p-2 bg-surface-container-highest border border-primary/40 rounded min-h-[100px]">
                              {goalkeepers.map(gk => (
                                <button
                                  key={gk.id}
                                  type="button"
                                  onClick={() => {
                                    const isSelected = newSession.attending.includes(gk.id);
                                    if (isSelected) {
                                      setNewSession(prev => ({ ...prev, attending: prev.attending.filter(id => id !== gk.id) }));
                                    } else {
                                      setNewSession(prev => ({ ...prev, attending: [...prev.attending, gk.id] }));
                                    }
                                  }}
                                  className={cn(
                                    "px-2 py-1 rounded text-[10px] font-bold transition-all",
                                    newSession.attending.includes(gk.id)
                                      ? "bg-primary text-on-primary shadow-sm"
                                      : "bg-surface text-on-surface-variant border border-primary/40 hover:border-primary/30"
                                  )}
                                >
                                  {gk.name}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="md:col-span-3 space-y-1">
                            <div className="flex items-center gap-2">
                              <label className="text-[9px] text-on-surface-variant uppercase font-label">
                                {t('individualNotes' as any) || 'Notas Individuais'} 
                                {newSession.attending.length > 0 && ` (${newSession.attending.length} ${t('selected' as any) || 'selecionados'})`}
                              </label>
                              <QuickSelect
                                label="Presets"
                                options={getOptions('obsIndividual', PRESETS.observations.individual)}
                                onSelect={(vals) => {
                                  const text = vals.map(v => t(v as any)).join('\n');
                                  const currentObs = typeof newSession.observations.individualEval === 'string' 
                                    ? newSession.observations.individualEval 
                                    : (newSession.observations.individualEval || []).join('\n');
                                  
                                  const names = newSession.attending
                                    .map(id => goalkeepers.find(g => g.id === id)?.name)
                                    .filter(Boolean)
                                    .join(', ');
                                  
                                  const newEntry = names ? `[${names}]: ${text}` : text;
                                  setNewSession({ ...newSession, observations: { ...newSession.observations, individualEval: currentObs ? `${currentObs}\n${newEntry}` : newEntry } });
                                }}
                                selectedValues={[]}
                                multiSelect={true}
                                onDelete={(val) => removeCustomPreset('obsIndividual', val)}
                                isDeletable={(val) => !val.startsWith('#')}
                                onAdd={(val) => setPendingObjective({ value: val, field: 'obsIndividual', mode: 'add' })}
                                onMove={(val) => setPendingObjective({ value: val, field: 'obsIndividual', mode: 'move' })}
                              />
                            </div>
                            <textarea
                              value={translateContent(newSession.observations.individualEval)}
                              onChange={e => setNewSession({
                                ...newSession,
                                observations: { ...newSession.observations, individualEval: e.target.value.split('\n') }
                              })}
                              className="w-full bg-surface-container-highest border border-primary/40 rounded px-3 py-2 text-xs min-h-[100px]"
                              placeholder={t('individualObsPlaceholder' as any) || 'Selecione os atletas Ã  esquerda e insira as observaÃ§Ãµes aqui...'}
                            />
                          </div>
                        </div>
                    </div>
                  </div>
                </div>
              </Section>
            </form>
          </div>

          <div className="bg-surface-container-highest p-6 border-t border-primary/40 flex justify-end gap-3">
             <button
              type="button"
              onClick={() => setIsAddingSession(false)}
              className="px-6 py-2 rounded-md font-label text-xs font-bold text-on-surface-variant hover:bg-black/5 transition-all"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              form="sessionForm"
              className="bg-primary text-on-primary px-8 py-2 rounded-md font-label text-xs font-bold shadow-lg shadow-primary/20 hover:bg-primary-dim transition-all active:scale-95"
            >
              {editingSessionId ? t('updateSession') : t('saveSession')}
            </button>
          </div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.length === 0 ? (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-on-surface-variant opacity-50 space-y-4">
              <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center">
                <FileText className="w-10 h-10" />
              </div>
              <p className="font-label text-sm uppercase tracking-widest">{t('noSessionsFound')}</p>
            </div>
          ) : (
            sessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((session, index) => (
              <motion.div
                transition={{ delay: index * 0.05 }}
                key={session.id}
                layoutId={session.id}
                className="glass-card group flex flex-col rounded-[2.5rem] border border-on-surface/10 hover:border-primary transition-all duration-500 overflow-hidden"
              >
                <div className="p-5 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-primary" />
                        <span className="text-[10px] font-black font-label text-on-surface-variant uppercase tracking-widest">
                          {new Date(session.date + 'T00:00:00').toLocaleDateString(t('locale' as any))}
                        </span>
                      </div>
                      <h4 className="text-lg font-black text-on-surface leading-tight">
                        {Array.isArray(session.titles) ? session.titles.map(t_ => t(t_ as any)).join(' + ') : t(session.titles as any)}
                      </h4>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleExportSession(session, goalkeepers, t)}
                        className="p-2 hover:bg-primary/10 text-on-surface-variant hover:text-primary rounded-lg transition-colors"
                        title={t('exportPdf')}
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditSession(session)}
                        className="p-2 hover:bg-primary/10 text-on-surface-variant hover:text-primary rounded-lg transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteSession(session.id)}
                        className="p-2 hover:bg-error/10 text-on-surface-variant hover:text-error rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-[9px] font-black uppercase rounded tracking-wider">
                      {Array.isArray(session.category) ? session.category.map(c => t(c as any)).join(', ') : t(session.category as any)}
                    </span>
                    <span className="px-2 py-0.5 bg-secondary/10 text-secondary text-[9px] font-black uppercase rounded tracking-wider">
                      {session.duration}
                    </span>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-3 text-[10px] text-on-surface-variant font-bold uppercase tracking-wide">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {session.warmup.length + session.exercises.length} {t('exercises')}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        {session.attending?.length || 0} {t('goalkeepers')}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setViewingSession(session)}
                    className="w-full mt-2 py-3 bg-surface-container-highest hover:bg-primary hover:text-on-primary text-on-surface font-black text-[10px] uppercase tracking-[0.2em] rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    {t('viewDetails')} <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}
      </div>

      <AnimatePresence>
        {pendingObjective && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-surface-container border border-white/10 p-6 rounded-xl max-w-md w-full shadow-2xl"
            >
              <h3 className="text-lg font-bold text-on-surface mb-2">
                {pendingObjective.mode === 'add' ? t('addNewPreset') : t('categorizePreset')}
              </h3>
              <p className="text-sm text-on-surface-variant mb-6">
                {pendingObjective.mode === 'add' 
                  ? t('addPresetDescription').replace('{value}', pendingObjective.value)
                  : t('categorizeDescription').replace('{value}', pendingObjective.value)}
              </p>
              
              <div className="space-y-4 mb-6">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{t('selectCategory')}</label>
                <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto pr-2 scrollbar-thin">
                  {getOptions('sessionTitles', PRESETS.sessionTitles)
                    .filter(opt => opt.startsWith('# '))
                    .map(group => {
                      const groupKey = group.replace('# ', '');
                      return (
                        <button
                          key={group}
                          onClick={() => {
                            addCustomPreset(pendingObjective.field, `[${groupKey}]${pendingObjective.value}`, PRESETS.objectives[pendingObjective.field as keyof typeof PRESETS.objectives] as any);
                            if (pendingObjective.mode === 'move') {
                              removeCustomPreset(pendingObjective.field, pendingObjective.value);
                            }
                            setPendingObjective(null);
                          }}
                          className="text-left px-4 py-3 rounded-lg bg-surface hover:bg-primary/10 text-on-surface text-xs font-bold transition-all border border-primary/40 hover:border-primary/30 flex justify-between items-center group"
                        >
                          {t(groupKey as any)}
                          <Plus className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      );
                    })}
                  <button
                    onClick={() => {
                      addCustomPreset(pendingObjective.field, pendingObjective.value, PRESETS.objectives[pendingObjective.field as keyof typeof PRESETS.objectives] as any);
                      setPendingObjective(null);
                    }}
                    className="text-left px-4 py-3 rounded-lg bg-surface hover:bg-primary/10 text-on-surface text-xs font-bold transition-all border border-primary/40 hover:border-primary/30"
                  >
                    {t('noCategorySpecial')}
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setPendingObjective(null)}
                  className="px-4 py-2 text-xs font-bold text-on-surface-variant hover:text-on-surface"
                >
                  {t('cancel')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingDrillId && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] flex items-center justify-center p-4">
             <div className="bg-surface-container border border-white/10 p-8 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto scrollbar-thin overflow-x-hidden">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-on-surface flex items-center gap-2">
                    <Edit3 className="w-5 h-5 text-primary" />
                    {t('editExercise')}
                  </h3>
                  <button onClick={handleCancelDrill} className="text-on-surface-variant hover:text-on-surface">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <DrillForm
                  currentDrill={currentDrill}
                  setCurrentDrill={setCurrentDrill}
                  editingDrillId={editingDrillId}
                  context={drillContext}
                  translateContent={translateContent}
                  applyDrillTemplate={applyDrillTemplate}
                  onSave={handleAddDrill}
                  onCancel={handleCancelDrill}
                  onOpenTacticalBoard={() => setIsTacticalBoardOpen(true)}
                  onOpenLibrary={() => setIsSelectingFromLibrary(true)}
                  setPendingObjective={setPendingObjective}
                />
             </div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
