import React from 'react';
import {
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
  Edit3,
  FileImage,
  Dumbbell,
  Check,
  UserCheck,
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn, getDiagramImage } from '../../lib/utils';
import { TrainingSession, Exercise, SavedMicrocycle } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';
import { PRESETS } from '../../data/presets';
import { getSessionCompleteness, resolveSessionMicrocycle } from '../../lib/dashboard';
import { Section } from '../ui/Section';
import { QuickSelect } from '../ui/QuickSelect';
import { DrillForm } from './DrillForm';
import { emptyDrill } from '../../hooks/useSessionForm';
import type { CustomPresetsState } from '../../hooks/useCustomPresets';

export interface SessionFormProps {
  newSession: Omit<TrainingSession, 'id'>;
  setNewSession: React.Dispatch<React.SetStateAction<Omit<TrainingSession, 'id'>>>;
  editingSessionId: string | null;
  goalkeepers: import('../../types').Goalkeeper[];
  savedMicrocycles?: SavedMicrocycle[];
  exercisesLibrary: Exercise[];
  filteredGeneralObjectives: string[];
  // Custom presets
  customPresets: CustomPresetsState;
  getOptions: (key: string, defaultOptions?: readonly string[]) => string[];
  addCustomPreset: (key: string, value: string | string[], defaultOptions: readonly string[], category?: string) => void;
  removeCustomPreset: (key: string, value: string) => void;
  moveCustomPreset: (key: string, value: string, newCategory: string) => void;
  // Drill state
  isAddingDrill: boolean;
  setIsAddingDrill: (v: boolean) => void;
  drillContext: 'warmup' | 'main' | 'integrated';
  setDrillContext: (v: 'warmup' | 'main' | 'integrated') => void;
  currentDrill: Omit<Exercise, 'id'>;
  setCurrentDrill: React.Dispatch<React.SetStateAction<Omit<Exercise, 'id'>>>;
  editingDrillId: string | null;
  setEditingDrillId: (id: string | null) => void;
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
  setIsAddingSession: (v: boolean) => void;
  setIsTacticalBoardOpen: (v: boolean) => void;
  setIsSelectingFromLibrary: (v: boolean) => void;
}

export const SessionForm: React.FC<SessionFormProps> = React.memo(({
  newSession,
  setNewSession,
  editingSessionId,
  goalkeepers,
  savedMicrocycles = [],
  filteredGeneralObjectives,
  customPresets,
  getOptions,
  addCustomPreset,
  removeCustomPreset,
  moveCustomPreset,
  isAddingDrill,
  setIsAddingDrill,
  drillContext,
  setDrillContext,
  currentDrill,
  setCurrentDrill,
  editingDrillId,
  setEditingDrillId,
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
  setIsAddingSession,
  setIsTacticalBoardOpen,
  setIsSelectingFromLibrary,
}) => {
  const { t } = useTranslation();

  /** Translate a value that may be a string or string array. */
  const tField = (value: string | string[]): string =>
    Array.isArray(value) ? value.map(v => t(v)).join(', ') : t(value);

  // Session completeness for progress bar
  const completeness = getSessionCompleteness(newSession as TrainingSession);

  // Auto-detect microcycle
  const resolvedMc = resolveSessionMicrocycle(newSession.date, savedMicrocycles);

  return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-surface p-0 rounded-2xl border border-white/[0.06] w-full max-w-[98vw] mx-auto overflow-hidden flex flex-col max-h-[calc(95vh-4rem)] md:max-h-[95vh]"
        >
          <div className="bg-surface-elevated border-b border-white/[0.06]">
            <div className="p-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                  <FileText className="w-5 h-5 text-accent" />
                  {editingSessionId ? t('editSession') : t('professionalTrainingSheet')}
                </h3>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-xs text-on-surface-variant">{t('structuredMethodology')}</p>
                  {resolvedMc && (
                    <span className="text-[9px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/10">
                      {resolvedMc.name}
                      {resolvedMc.mesocycle ? ` · ${resolvedMc.mesocycle}` : ''}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={cn(
                  "text-[10px] font-bold px-2 py-1 rounded",
                  completeness.isComplete ? "bg-tertiary/10 text-tertiary" : "bg-yellow-500/10 text-yellow-600"
                )}>
                  {completeness.percentage}%
                </span>
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
            {/* Progress bar */}
            <div className="h-1 bg-white/[0.03]">
              <div
                className={cn(
                  "h-full transition-all duration-500",
                  completeness.isComplete ? "bg-tertiary" : "bg-accent"
                )}
                style={{ width: `${completeness.percentage}%` }}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-thin scrollbar-thumb-white/10">
            <form id="sessionForm" onSubmit={handleAddSession} className="space-y-8">

              {/* 1. Identification */}
               <Section title={t('sessionIdentification')} icon={Users} accentColor="bg-blue-500">

                 <div className="flex flex-wrap items-start gap-2">

                   {/* Título da Sessão */}
                   <div className="flex-[2] min-w-[180px] space-y-1">
                     <div className="flex items-center gap-2">
                       <label className="text-[9px] text-on-surface-variant uppercase font-label font-bold">{t('sessionTitle')}</label>
                       <QuickSelect
                         multiSelect
                         selectedValues={newSession.titles}
                         options={getOptions('sessionTitles', PRESETS.sessionTitles)}
                         onSelect={(val) => applySessionTemplates(val as string[])}
                         onDelete={(val) => removeCustomPreset('sessionTitles', val)}
                         isDeletable={(val) => !val.startsWith('#')}
                         onAdd={(val) => addCustomPreset('sessionTitles', val, [])}
                         onMove={(val) => moveCustomPreset('sessionTitles', val, '')}
                       />
                     </div>
                     <div className="w-full bg-surface-elevated border border-white/[0.06] rounded px-2 py-1.5 min-h-[44px] flex flex-wrap gap-1 transition-all">
                       {newSession.titles.length === 0 && (
                         <span className="text-[10px] text-on-surface-variant/40 py-1">{t('drillTitlePlaceholder')}</span>
                       )}
                       {newSession.titles.map(title => (
                         <span key={title} className="inline-flex items-center gap-1 bg-primary/10 text-primary text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                           {t(title)}
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
                         multiSelect
                         selectedValues={newSession.generalObjectives}
                         options={filteredGeneralObjectives}
                         onSelect={(val) => handleGeneralObjectivesChange(val as string[])}
                         onDelete={(val) => removeCustomPreset('generalObjectives', val)}
                         isDeletable={(val) => !val.startsWith('#')}
                         onAdd={(val) => addCustomPreset('generalObjectives', val, [])}
                         onMove={(val) => moveCustomPreset('generalObjectives', val, '')}
                       />
                     </div>
                     <textarea
                       value={newSession.generalObjectives.filter(Boolean).map(o => t(o)).join(', ')}
                       onChange={e => handleGeneralObjectivesChange(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                       className="w-full bg-surface-elevated border border-white/[0.06] rounded px-2 py-1.5 text-[11px] min-h-[44px] outline-none resize-none leading-tight font-medium"
                       placeholder={t('objectivePlaceholder')}
                     />
                   </div>

                   {/* Categoria */}
                   <div className="flex-1 min-w-[120px] space-y-1">
                     <div className="flex items-center gap-2">
                       <label className="text-[9px] text-on-surface-variant uppercase font-label font-bold">{t('category')}</label>
                       <QuickSelect
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
                       value={Array.isArray(newSession.category) ? newSession.category.map(c => t(c)).join(', ') : t(newSession.category)}
                       onChange={e => setNewSession({ ...newSession, category: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                       className="w-full bg-surface-elevated border border-white/[0.06] rounded px-2 py-1.5 text-[11px] h-[44px] outline-none font-medium text-center"
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
                       className="w-full bg-surface-elevated border border-white/[0.06] rounded px-2 py-1.5 text-[11px] h-[44px] outline-none font-medium"
                     />
                   </div>

                   {/* Duração Total */}
                   <div className="w-[85px] shrink-0 space-y-1">
                     <div className="flex items-center gap-2">
                       <label className="text-[9px] text-on-surface-variant uppercase font-label font-bold">DUR.</label>
                       <QuickSelect
                         options={getOptions('durations', PRESETS.durations)}
                         onSelect={(vals) => setNewSession({ ...newSession, duration: vals.map(v => t(v)).join(' + ') })}
                         selectedValues={typeof newSession.duration === 'string' ? newSession.duration.split(' + ') : newSession.duration}
                         onDelete={(val) => removeCustomPreset('durations', val)}
                         isDeletable={(val) => !val.startsWith('#')}
                         onAdd={(val) => addCustomPreset('durations', val, [])}
                         onMove={(val) => moveCustomPreset('durations', val, '')}
                       />
                     </div>
                     <input
                       type="text"
                       value={Array.isArray(newSession.duration) ? (newSession.duration.length > 0 ? newSession.duration[0] : '') : newSession.duration}
                       onChange={e => setNewSession({ ...newSession, duration: [e.target.value] })}
                       className="w-full bg-surface-elevated border border-white/[0.06] rounded px-2 py-1.5 text-[12px] font-bold text-primary h-[44px] outline-none text-center"
                       placeholder="min"
                     />
                   </div>

                   {/* Nº Atletas */}
                   <div className="w-[70px] shrink-0 space-y-1">
                     <label className="text-[9px] text-on-surface-variant uppercase font-label font-bold">{t('athletes')}</label>
                     <input
                       type="number"
                       min={1}
                       max={20}
                       value={newSession.numAthletes || ''}
                       onChange={e => setNewSession({ ...newSession, numAthletes: parseInt(e.target.value) || 0 })}
                       className="w-full bg-surface-elevated border border-white/[0.06] rounded px-2 py-1.5 text-[12px] font-bold text-primary h-[44px] outline-none text-center"
                       placeholder="3"
                     />
                   </div>

                 </div>

                </Section>




              {/* 2. Specific Objectives */}
              <Section title={t('sectionObjectives')} icon={Target} accentColor="bg-green-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(['technical', 'tactical', 'physical', 'cognitive'] as const).map((objKey) => (
                    <div key={objKey} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <label className="text-[9px] text-on-surface-variant uppercase font-label font-bold">{t(objKey)}</label>
                        <QuickSelect
                          options={getOptions(objKey, PRESETS.objectives[objKey])}
                          onSelect={(val) => setNewSession({
                            ...newSession,
                            objectives: { ...newSession.objectives, [objKey]: val }
                          })}
                          multiSelect={true}
                          selectedValues={Array.isArray(newSession.objectives[objKey]) ? newSession.objectives[objKey] as string[] : [newSession.objectives[objKey] as string]}
                          onDelete={(val) => removeCustomPreset(objKey, val)}
                          isDeletable={(val) => !val.startsWith('#')}
                          onAdd={(val) => addCustomPreset(objKey, val, PRESETS.objectives[objKey])}
                          onMove={(val, cat) => moveCustomPreset(objKey, val, cat)}
                        />
                      </div>
                      <textarea
                        value={translateContent(newSession.objectives[objKey])}
                        onChange={e => setNewSession({
                          ...newSession,
                          objectives: { ...newSession.objectives, [objKey]: e.target.value.split('\n') }
                        })}
                        className="w-full bg-surface-elevated border border-white/[0.06] rounded px-3 py-2 text-xs min-h-[60px]"
                        placeholder={t(`${objKey}Placeholder`)}
                      />
                    </div>
                  ))}
                </div>
              </Section>

              {/* 3. Warm-up */}
              <Section title={t('sectionWarmUp')} icon={Clock} accentColor="bg-orange-500">
                <div className="space-y-4">
                  {newSession.warmup.map((drill, idx) => (
                    <div key={drill.id} className="bg-surface-elevated p-4 rounded-lg border border-white/[0.06] group">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-primary/20 text-primary text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest">{t(drill.type)}</span>
                        <h5 className="text-sm font-bold text-on-surface">{idx + 1}. {t(drill.title)}</h5>
                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                          <button type="button" onClick={() => handleEditDrill(drill, 'warmup')} className="text-on-surface-variant hover:text-primary p-0.5">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button type="button" onClick={() => handleRemoveDrill(drill.id)} className="text-on-surface-variant hover:text-error p-0.5">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <span className="text-[10px] text-on-surface-variant ml-auto flex items-center"><Clock className="w-3 h-3 mr-1" /> {tField(drill.duration)}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-[10px]">
                        <div><span className="text-primary uppercase font-bold">{t('objective')}:</span> {tField(drill.objective)}</div>
                        <div><span className="text-primary uppercase font-bold">{t('organization')}:</span> {tField(drill.organization)}</div>
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
                        className="flex-1 py-4 border-2 border-dashed border-white/[0.06] rounded-lg text-on-surface-variant hover:border-primary hover:text-primary transition-all flex flex-col items-center justify-center gap-2"
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
                        className="flex-1 py-4 border-2 border-dashed border-white/[0.06] rounded-lg text-on-surface-variant hover:border-secondary hover:text-secondary transition-all flex flex-col items-center justify-center gap-2"
                      >
                        <Library className="w-6 h-6" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">{t('addFromLibrary')}</span>
                      </button>
                    </div>
                  )}
                </div>
              </Section>

              {/* 4. Main Part */}
              <Section title={t('mainPartExercises')} icon={Dumbbell} accentColor="bg-red-500">
                <div className="space-y-4">
                  {newSession.exercises.map((drill, idx) => (
                    <div key={drill.id} className="bg-surface-elevated p-4 rounded-lg border border-white/[0.06] group">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-primary/20 text-primary text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest">{t(drill.type)}</span>
                        <h5 className="text-sm font-bold text-on-surface">{idx + 1}. {t(drill.title)}</h5>
                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                          <button type="button" onClick={() => handleEditDrill(drill, 'main')} className="text-on-surface-variant hover:text-primary p-0.5">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button type="button" onClick={() => handleRemoveDrill(drill.id)} className="text-on-surface-variant hover:text-error p-0.5">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <span className="text-[10px] text-on-surface-variant ml-auto flex items-center"><Clock className="w-3 h-3 mr-1" /> {tField(drill.duration)}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-[10px]">
                        <div><span className="text-primary uppercase font-bold">{t('objective')}:</span> {tField(drill.objective)}</div>
                        <div><span className="text-primary uppercase font-bold">{t('organization')}:</span> {tField(drill.organization)}</div>
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
                        className="flex-1 py-4 border-2 border-dashed border-white/[0.06] rounded-lg text-on-surface-variant hover:border-primary hover:text-primary transition-all flex flex-col items-center justify-center gap-2"
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
                        className="flex-1 py-4 border-2 border-dashed border-white/[0.06] rounded-lg text-on-surface-variant hover:border-secondary hover:text-secondary transition-all flex flex-col items-center justify-center gap-2"
                      >
                        <Library className="w-6 h-6" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">{t('addFromLibrary')}</span>
                      </button>
                    </div>
                  )}
                </div>
              </Section>

              {/* 5. Integrated with Team */}
              <Section title={t('sectionIntegrated')} icon={Trophy} accentColor="bg-yellow-500">
                <div className="space-y-4">
                  {newSession.integratedWithTeam?.map((integrated) => (
                    <div key={integrated.id} className="bg-surface-elevated p-4 rounded-lg border border-white/[0.06] relative group">
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
                              <label className="text-[9px] text-on-surface-variant uppercase font-label font-bold">{t('format')}</label>
                              <QuickSelect
                                      options={getOptions('integratedFormats', PRESETS.integrated.formats)}
                                onSelect={(vals) => setNewSession(prev => ({ ...prev, integratedWithTeam: prev.integratedWithTeam?.map(i => i.id === integrated.id ? { ...i, format: vals.map(v => t(v)).join(', ') } : i) }))}
                                selectedValues={integrated.format ? (typeof integrated.format === 'string' ? integrated.format.split(', ') : integrated.format) : []}
                                onDelete={(val) => removeCustomPreset('integratedFormats', val)}
                                isDeletable={(val) => !val.startsWith('#')}
                                onAdd={(val) => addCustomPreset('integratedFormats', val, [])}
                                onMove={(val) => moveCustomPreset('integratedFormats', val, '')}
                              />
                            </div>
                            <input
                              type="text"
                              value={Array.isArray(integrated.format) ? integrated.format.map(f => t(f)).join(', ') : t(integrated.format)}
                              onChange={e => setNewSession(prev => ({ ...prev, integratedWithTeam: prev.integratedWithTeam?.map(i => i.id === integrated.id ? { ...i, format: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } : i) }))}
                              className="w-full bg-surface border border-white/[0.06] rounded px-3 py-2 text-xs"
                            />
                          </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <label className="text-[9px] text-on-surface-variant uppercase font-label font-bold">{t('number')}</label>
                            <QuickSelect
                                  options={getOptions('integratedNumbers', PRESETS.integrated.numbers)}
                              onSelect={(vals) => setNewSession(prev => ({ ...prev, integratedWithTeam: prev.integratedWithTeam?.map(i => i.id === integrated.id ? { ...i, number: vals.map(v => t(v)).join(', ') } : i) }))}
                              selectedValues={integrated.number ? (typeof integrated.number === 'string' ? integrated.number.split(', ') : integrated.number) : []}
                              onDelete={(val) => removeCustomPreset('integratedNumbers', val)}
                              isDeletable={(val) => !val.startsWith('#')}
                              onAdd={(val) => addCustomPreset('integratedNumbers', val, [])}
                              onMove={(val) => moveCustomPreset('integratedNumbers', val, '')}
                            />
                          </div>
                          <input
                            type="text"
                            value={Array.isArray(integrated.number) ? integrated.number.map(n => t(n)).join(', ') : t(integrated.number)}
                            onChange={e => setNewSession(prev => ({ ...prev, integratedWithTeam: prev.integratedWithTeam?.map(i => i.id === integrated.id ? { ...i, number: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } : i) }))}
                            className="w-full bg-surface border border-white/[0.06] rounded px-3 py-2 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <label className="text-[9px] text-on-surface-variant uppercase font-label font-bold">{t('space')}</label>
                            <QuickSelect
                                  options={getOptions('integratedSpaces', PRESETS.integrated.spaces)}
                              onSelect={(vals) => setNewSession(prev => ({ ...prev, integratedWithTeam: prev.integratedWithTeam?.map(i => i.id === integrated.id ? { ...i, space: vals.map(v => t(v)).join(', ') } : i) }))}
                              selectedValues={integrated.space ? (typeof integrated.space === 'string' ? integrated.space.split(', ') : integrated.space) : []}
                              onDelete={(val) => removeCustomPreset('integratedSpaces', val)}
                              isDeletable={(val) => !val.startsWith('#')}
                              onAdd={(val) => addCustomPreset('integratedSpaces', val, [])}
                              onMove={(val) => moveCustomPreset('integratedSpaces', val, '')}
                            />
                          </div>
                          <input
                            type="text"
                            value={Array.isArray(integrated.space) ? integrated.space.map(s => t(s)).join(', ') : t(integrated.space)}
                            onChange={e => setNewSession(prev => ({ ...prev, integratedWithTeam: prev.integratedWithTeam?.map(i => i.id === integrated.id ? { ...i, space: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } : i) }))}
                            className="w-full bg-surface border border-white/[0.06] rounded px-3 py-2 text-xs"
                            placeholder={t('spacePlaceholder')}
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <label className="text-[9px] text-on-surface-variant uppercase font-label font-bold">{t('time')}</label>
                            <QuickSelect
                                  options={getOptions('integratedTimes', PRESETS.integrated.times)}
                              onSelect={(vals) => setNewSession(prev => ({ ...prev, integratedWithTeam: prev.integratedWithTeam?.map(i => i.id === integrated.id ? { ...i, time: vals.map(v => t(v)).join(', ') } : i) }))}
                              selectedValues={integrated.time ? (typeof integrated.time === 'string' ? integrated.time.split(', ') : integrated.time) : []}
                              onDelete={(val) => removeCustomPreset('integratedTimes', val)}
                              isDeletable={(val) => !val.startsWith('#')}
                              onAdd={(val) => addCustomPreset('integratedTimes', val, [])}
                              onMove={(val) => moveCustomPreset('integratedTimes', val, '')}
                            />
                          </div>
                          <input
                            type="text"
                            value={Array.isArray(integrated.time) ? integrated.time.map(time => t(time)).join(', ') : t(integrated.time)}
                            onChange={e => setNewSession(prev => ({ ...prev, integratedWithTeam: prev.integratedWithTeam?.map(i => i.id === integrated.id ? { ...i, time: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } : i) }))}
                            className="w-full bg-surface border border-white/[0.06] rounded px-3 py-2 text-xs"
                            placeholder={t('durationPlaceholder')}
                          />
                        </div>
                      </div>
                      {/* Diagram */}
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setDrillContext('integrated');
                            setEditingDrillId(integrated.id);
                            setIsTacticalBoardOpen(true);
                          }}
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border",
                            integrated.diagram
                              ? "border-primary/20 bg-primary/5 text-primary hover:bg-primary/10"
                              : "border-dashed border-black/20 text-on-surface-variant hover:text-primary hover:border-primary"
                          )}
                        >
                          <Target className="w-3.5 h-3.5" />
                          {integrated.diagram ? t('editDiagram') : t('addDiagram')}
                        </button>
                        {integrated.diagram && (
                          <button
                            type="button"
                            onClick={() => setNewSession(prev => ({ ...prev, integratedWithTeam: prev.integratedWithTeam?.map(i => i.id === integrated.id ? { ...i, diagram: undefined } : i) }))}
                            className="text-[10px] font-bold text-error/60 hover:text-error transition-colors"
                          >
                            {t('removeDiagram')}
                          </button>
                        )}
                      </div>
                      {integrated.diagram && (
                        <div className="mt-2">
                          <img src={getDiagramImage(integrated.diagram)} alt="Diagram" className="rounded-lg border border-white/[0.04] max-h-32 w-full object-contain" referrerPolicy="no-referrer" />
                        </div>
                      )}
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
              <Section title={t('sectionCoolDown')} icon={Wind} accentColor="bg-cyan-500">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <label className="text-[9px] text-on-surface-variant uppercase font-label font-bold">{t('coolDownExercises')}</label>
                    <QuickSelect
                      options={getOptions('coolDowns', PRESETS.coolDowns)}
                      onSelect={(vals) => setNewSession({ ...newSession, coolDown: vals.map(v => t(v)).join('\n') })}
                      selectedValues={typeof newSession.coolDown === 'string' ? newSession.coolDown.split('\n') : newSession.coolDown}
                      onDelete={(val) => removeCustomPreset('coolDowns', val)}
                      isDeletable={(val) => !val.startsWith('#')}
                      onAdd={(val) => addCustomPreset('coolDowns', val, [])}
                      onMove={(val) => moveCustomPreset('coolDowns', val, '')}
                    />
                  </div>
                  <textarea
                    value={translateContent(newSession.coolDown)}
                    onChange={e => setNewSession({ ...newSession, coolDown: e.target.value.split('\n') })}
                    className="w-full bg-surface-elevated border border-white/[0.06] rounded px-3 py-2 text-xs min-h-[60px]"
                  />
                </div>
              </Section>

              {/* 7. Observations */}
              <Section title={t('coachObservations')} icon={Edit3} accentColor="bg-purple-500">
                <div className="space-y-8">
                  {/* Session Observations */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] text-on-surface-variant font-black uppercase tracking-widest flex items-center gap-2">
                       {t('sessionObservations')}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <label className="text-[9px] text-on-surface-variant uppercase font-label font-bold">{t('positivePoints')}</label>
                          <QuickSelect
                              options={getOptions('obsPositives', PRESETS.observations.positives)}
                            onSelect={(vals) => setNewSession({ ...newSession, observations: { ...newSession.observations, positives: vals.map(v => t(v)).join('\n') } })}
                            selectedValues={typeof newSession.observations.positives === 'string' ? newSession.observations.positives.split('\n') : newSession.observations.positives}
                            multiSelect={true}
                            onDelete={(val) => removeCustomPreset('obsPositives', val)}
                            isDeletable={(val) => !val.startsWith('#')}
                            onAdd={(val) => addCustomPreset('obsPositives', val, [])}
                            onMove={(val) => moveCustomPreset('obsPositives', val, '')}
                          />
                        </div>
                        <textarea
                          value={translateContent(newSession.observations.positives)}
                          onChange={e => setNewSession({
                            ...newSession,
                            observations: { ...newSession.observations, positives: e.target.value.split('\n') }
                          })}
                          className="w-full bg-surface-elevated border border-white/[0.06] rounded px-3 py-2 text-xs min-h-[60px]"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <label className="text-[9px] text-on-surface-variant uppercase font-label font-bold">{t('adjustmentsForNext')}</label>
                          <QuickSelect
                              options={getOptions('obsAdjustments', PRESETS.observations.adjustments)}
                            onSelect={(vals) => setNewSession({ ...newSession, observations: { ...newSession.observations, adjustments: vals.map(v => t(v)).join('\n') } })}
                            selectedValues={typeof newSession.observations.adjustments === 'string' ? newSession.observations.adjustments.split('\n') : newSession.observations.adjustments}
                            multiSelect={true}
                            onDelete={(val) => removeCustomPreset('obsAdjustments', val)}
                            isDeletable={(val) => !val.startsWith('#')}
                            onAdd={(val) => addCustomPreset('obsAdjustments', val, [])}
                            onMove={(val) => moveCustomPreset('obsAdjustments', val, '')}
                          />
                        </div>
                        <textarea
                          value={translateContent(newSession.observations.adjustments)}
                          onChange={e => setNewSession({
                            ...newSession,
                            observations: { ...newSession.observations, adjustments: e.target.value.split('\n') }
                          })}
                          className="w-full bg-surface-elevated border border-white/[0.06] rounded px-3 py-2 text-xs min-h-[60px]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Attendance & Athlete Observations */}
                  <div className="space-y-6 border-t border-white/[0.06] pt-8">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] text-on-surface-variant font-black uppercase tracking-widest flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-accent/60" />
                        {t('attendanceAndAthletes')}
                      </h4>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setNewSession(prev => ({ ...prev, attending: goalkeepers.map(g => g.id) }))}
                          className="text-[9px] text-accent font-bold hover:text-accent/80 transition-colors"
                        >
                          {t('selectAll')}
                        </button>
                        <span className="text-white/10">|</span>
                        <button
                          type="button"
                          onClick={() => setNewSession(prev => ({ ...prev, attending: [] }))}
                          className="text-[9px] text-on-surface-variant font-bold hover:text-on-surface transition-colors"
                        >
                          {t('deselectAll')}
                        </button>
                      </div>
                    </div>

                    {/* Goalkeeper cards with avatar + attendance */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {goalkeepers.map(gk => {
                        const isSelected = (newSession.attending ?? []).includes(gk.id);
                        return (
                          <button
                            key={gk.id}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setNewSession(prev => ({ ...prev, attending: (prev.attending ?? []).filter(id => id !== gk.id) }));
                              } else {
                                setNewSession(prev => ({ ...prev, attending: [...(prev.attending ?? []), gk.id] }));
                              }
                            }}
                            className={cn(
                              "relative flex flex-col items-center gap-2 p-3 rounded-xl transition-all",
                              isSelected
                                ? "bg-accent/10 border border-accent/30 shadow-[0_0_12px_rgba(124,92,252,0.1)]"
                                : "bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.1] opacity-60 hover:opacity-100"
                            )}
                          >
                            {/* Check badge */}
                            {isSelected && (
                              <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-accent flex items-center justify-center shadow-lg">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            )}
                            {/* Avatar */}
                            <div className={cn(
                              "w-12 h-12 rounded-full overflow-hidden border-2 transition-all",
                              isSelected ? "border-accent/50" : "border-white/[0.06]"
                            )}>
                              {gk.imageUrl ? (
                                <img src={gk.imageUrl} alt={gk.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <div className="w-full h-full bg-surface-elevated flex items-center justify-center">
                                  <span className="text-sm font-bold text-on-surface-variant/50">{gk.name.charAt(0)}</span>
                                </div>
                              )}
                            </div>
                            {/* Name */}
                            <span className={cn(
                              "text-[10px] font-bold text-center leading-tight truncate w-full",
                              isSelected ? "text-on-surface" : "text-on-surface-variant"
                            )}>
                              {gk.name.split(' ')[0]}
                            </span>
                            {/* Status badge */}
                            <span className={cn(
                              "text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full",
                              isSelected ? "bg-success/10 text-success" : "bg-white/[0.03] text-on-surface-variant/40"
                            )}>
                              {isSelected ? t('present') : '—'}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Attendance summary */}
                    {(newSession.attending ?? []).length > 0 && (
                      <div className="flex items-center gap-2 text-[10px] text-on-surface-variant">
                        <Users className="w-3.5 h-3.5 text-accent/50" />
                        <span className="font-bold">{(newSession.attending ?? []).length}/{goalkeepers.length}</span>
                        <span>{t('present').toLowerCase()}</span>
                      </div>
                    )}

                    {/* Individual observations */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <label className="text-[9px] text-on-surface-variant uppercase font-label font-bold">
                          {t('individualNotes')}
                        </label>
                        <QuickSelect
                          options={getOptions('obsIndividual', PRESETS.observations.individual)}
                          onSelect={(vals) => {
                            const text = vals.map(v => t(v)).join('\n');
                            const currentObs = typeof newSession.observations.individualEval === 'string'
                              ? newSession.observations.individualEval
                              : (newSession.observations.individualEval || []).join('\n');

                            const names = (newSession.attending ?? [])
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
                          onAdd={(val) => addCustomPreset('obsIndividual', val, [])}
                          onMove={(val) => moveCustomPreset('obsIndividual', val, '')}
                        />
                      </div>
                      <textarea
                        value={translateContent(newSession.observations.individualEval)}
                        onChange={e => setNewSession({
                          ...newSession,
                          observations: { ...newSession.observations, individualEval: e.target.value.split('\n') }
                        })}
                        className="w-full bg-surface-elevated border border-white/[0.06] rounded px-3 py-2 text-xs min-h-[80px]"
                        placeholder={t('individualObsPlaceholder')}
                      />
                    </div>
                  </div>
                </div>
              </Section>
            </form>
          </div>

          <div className="bg-surface-elevated border-t border-white/[0.06]">
            {/* Mini progress bar */}
            <div className="h-0.5 bg-white/[0.03]">
              <div
                className={cn(
                  "h-full transition-all duration-500",
                  completeness.isComplete ? "bg-tertiary" : "bg-accent"
                )}
                style={{ width: `${completeness.percentage}%` }}
              />
            </div>
            <div className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={cn(
                  "text-[10px] font-bold",
                  completeness.isComplete ? "text-tertiary" : "text-on-surface-variant/50"
                )}>
                  {completeness.percentage}% {completeness.isComplete ? t('complete') : ''}
                </span>
                {!completeness.isComplete && completeness.missing.length > 0 && (
                  <span className="text-[9px] text-on-surface-variant/30">
                    {completeness.missing.length} {t('fieldsMissing')}
                  </span>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddingSession(false)}
                  className="px-6 py-2.5 rounded-xl font-label text-xs font-bold text-on-surface-variant hover:bg-white/[0.05] transition-all border border-white/[0.06]"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  form="sessionForm"
                  className="bg-primary text-on-primary px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg hover:shadow-primary/20 transition-all active:scale-95"
                >
                  {editingSessionId ? t('updateSession') : t('saveSession')}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
  );
});

SessionForm.displayName = 'SessionForm';
