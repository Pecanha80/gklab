import React, { useMemo, useState } from 'react';
import {
  Dumbbell,
  Plus,
  FileText,
  X,
  Edit3,
  Filter,
  Calendar,
} from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { cn, getTodayDateString, parseDate } from '../../lib/utils';
import { TrainingSession, Exercise, Goalkeeper, SavedMicrocycle } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';
import { useCustomPresets } from '../../hooks/useCustomPresets';
import { PRESETS } from '../../data/presets';
import { resolveSessionMicrocycle, getMatchDayLabel, groupSessionsByMicrocycle, filterSessions } from '../../lib/dashboard';
import { DrillForm } from '../forms/DrillForm';
import { SessionForm } from '../forms/SessionForm';
import { LibraryPickerModal } from '../forms/LibraryPickerModal';
import { SessionCard } from '../cards/SessionCard';
import type { SessionFormState } from '../../hooks/useSessionForm';

interface TrainingTabProps {
  sessions: TrainingSession[];
  goalkeepers: Goalkeeper[];
  exercisesLibrary: Exercise[];
  savedMicrocycles: SavedMicrocycle[];
  deleteSession: (id: string) => Promise<void>;
  sessionForm: SessionFormState;
  setActiveTab: (tab: string) => void;
  setViewingSession: (session: TrainingSession | null) => void;
  exerciseSearchTerm: string;
  setExerciseSearchTerm: (term: string) => void;
}

export const TrainingTab: React.FC<TrainingTabProps> = React.memo(({
  sessions,
  goalkeepers,
  exercisesLibrary,
  savedMicrocycles,
  deleteSession,
  sessionForm,
  setActiveTab,
  setViewingSession,
  exerciseSearchTerm,
  setExerciseSearchTerm,
}) => {
  const {
    isAddingSession, setIsAddingSession, editingSessionId,
    newSession, setNewSession,
    isAddingDrill, setIsAddingDrill, drillContext, setDrillContext,
    editingDrillId, currentDrill, setCurrentDrill,
    isSelectingFromLibrary, setIsSelectingFromLibrary, setIsTacticalBoardOpen,
    translateContent, handleGeneralObjectivesChange,
    handleAddSession, handleAddDrill, handleEditDrill, handleCancelDrill, handleRemoveDrill,
    applyDrillTemplate, applySessionTemplates, loadExample, handleEditSession,
  } = sessionForm;
  const { t } = useTranslation();
  const { customPresets, getOptions, addCustomPreset, removeCustomPreset, moveCustomPreset } = useCustomPresets();

  // Filter state
  const [filterMicrocycleId, setFilterMicrocycleId] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  // Filtered + grouped sessions
  const filteredSessions = useMemo(() => {
    let result = filterSessions(sessions, {
      category: filterCategory || undefined,
    });
    if (filterMicrocycleId) {
      result = result.filter(s => {
        const resolved = resolveSessionMicrocycle(s.date, savedMicrocycles);
        return resolved?.id === filterMicrocycleId;
      });
    }
    return result;
  }, [sessions, filterCategory, filterMicrocycleId, savedMicrocycles]);

  const sessionGroups = useMemo(
    () => groupSessionsByMicrocycle(filteredSessions, savedMicrocycles),
    [filteredSessions, savedMicrocycles]
  );

  // Unique categories for filter dropdown
  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    sessions.forEach(s => {
      const sessionCats = Array.isArray(s.category) ? s.category : [s.category];
      sessionCats.forEach(c => cats.add(c));
    });
    return Array.from(cats).sort();
  }, [sessions]);

  const hasActiveFilters = filterMicrocycleId || filterCategory;

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
    const sessionDate = parseDate(newSession.date);
    const matchedMc = savedMicrocycles.find(mc => {
      const start = parseDate(mc.startDate);
      const end = parseDate(mc.endDate);
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
        <div className="glass-card p-8 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
              <Dumbbell className="w-7 h-7 text-accent" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-on-surface tracking-tight">{t('trainingSessions')}</h2>
              <p className="text-xs text-on-surface-variant mt-1">{t('manageSessionsSubtitle')}</p>
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
        <SessionForm
          newSession={newSession}
          setNewSession={setNewSession}
          editingSessionId={editingSessionId}
          goalkeepers={goalkeepers}
          exercisesLibrary={exercisesLibrary}
          filteredGeneralObjectives={filteredGeneralObjectives}
          customPresets={customPresets}
          getOptions={getOptions}
          addCustomPreset={addCustomPreset}
          removeCustomPreset={removeCustomPreset}
          moveCustomPreset={moveCustomPreset}
          isAddingDrill={isAddingDrill}
          setIsAddingDrill={setIsAddingDrill}
          drillContext={drillContext}
          setDrillContext={setDrillContext}
          currentDrill={currentDrill}
          setCurrentDrill={setCurrentDrill}
          editingDrillId={editingDrillId}
          translateContent={translateContent}
          handleGeneralObjectivesChange={handleGeneralObjectivesChange}
          handleAddSession={handleAddSession}
          handleAddDrill={handleAddDrill}
          handleEditDrill={handleEditDrill}
          handleCancelDrill={handleCancelDrill}
          handleRemoveDrill={handleRemoveDrill}
          applyDrillTemplate={applyDrillTemplate}
          applySessionTemplates={applySessionTemplates}
          loadExample={loadExample}
          setIsAddingSession={setIsAddingSession}
          setIsTacticalBoardOpen={setIsTacticalBoardOpen}
          setIsSelectingFromLibrary={setIsSelectingFromLibrary}
        />
      ) : (
        <div className="space-y-6">
          {/* Filter bar */}
          {sessions.length > 0 && (
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border",
                  hasActiveFilters
                    ? "bg-accent/10 text-accent border-accent/20"
                    : "bg-white/[0.03] text-on-surface-variant border-white/[0.06] hover:border-white/[0.1]"
                )}
              >
                <Filter className="w-3.5 h-3.5" />
                {t('filter') || 'Filtrar'}
                {hasActiveFilters && (
                  <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                )}
              </button>

              {showFilters && (
                <>
                  {/* Microcycle filter */}
                  {savedMicrocycles.length > 0 && (
                    <select
                      value={filterMicrocycleId}
                      onChange={e => setFilterMicrocycleId(e.target.value)}
                      className="px-3 py-2 rounded-xl text-xs font-medium bg-white/[0.03] border border-white/[0.06] text-on-surface focus:border-accent/40 outline-none"
                    >
                      <option value="">{t('allMicrocycles') || 'Todos os Microciclos'}</option>
                      {savedMicrocycles.map(mc => (
                        <option key={mc.id} value={mc.id}>{mc.name}</option>
                      ))}
                    </select>
                  )}

                  {/* Category filter */}
                  {allCategories.length > 0 && (
                    <select
                      value={filterCategory}
                      onChange={e => setFilterCategory(e.target.value)}
                      className="px-3 py-2 rounded-xl text-xs font-medium bg-white/[0.03] border border-white/[0.06] text-on-surface focus:border-accent/40 outline-none"
                    >
                      <option value="">{t('allCategories') || 'Todas as Categorias'}</option>
                      {allCategories.map(cat => (
                        <option key={cat} value={cat}>{t(cat)}</option>
                      ))}
                    </select>
                  )}

                  {hasActiveFilters && (
                    <button
                      onClick={() => { setFilterMicrocycleId(''); setFilterCategory(''); }}
                      className="px-3 py-2 rounded-xl text-xs font-bold text-error/70 hover:text-error hover:bg-error/5 transition-colors"
                    >
                      {t('clearFilters') || 'Limpar'}
                    </button>
                  )}
                </>
              )}

              <span className="text-[10px] text-on-surface-variant/40 font-medium ml-auto">
                {filteredSessions.length} {t('sessions').toLowerCase()}
              </span>
            </div>
          )}

          {/* Grouped session list */}
          {filteredSessions.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-on-surface-variant space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                <FileText className="w-8 h-8 text-on-surface-variant/30" />
              </div>
              <p className="text-sm font-medium text-on-surface-variant/50">{t('noSessionsFound')}</p>
            </div>
          ) : sessionGroups.length > 0 ? (
            sessionGroups.map(group => {
              const mc = savedMicrocycles.find(m => m.id === group.microcycle.id);
              const mcDays: string[] = mc ? (() => {
                const days: string[] = [];
                const start = parseDate(mc.startDate);
                const end = parseDate(mc.endDate);
                const cur = new Date(start);
                while (cur <= end) {
                  days.push(cur.toISOString().split('T')[0]);
                  cur.setDate(cur.getDate() + 1);
                }
                return days;
              })() : [];

              return (
                <div key={group.microcycle.id} className="space-y-4">
                  {/* Group header */}
                  {group.microcycle.id !== '__other__' && (
                    <div className="flex items-center gap-3 px-1">
                      <Calendar className="w-4 h-4 text-primary/60" />
                      <h3 className="text-sm font-bold text-on-surface">{group.microcycle.name}</h3>
                      {group.microcycle.mesocycle && (
                        <span className="text-[9px] font-bold uppercase tracking-wider text-primary/60 bg-primary/10 px-2 py-0.5 rounded">
                          {group.microcycle.mesocycle}
                        </span>
                      )}
                      <span className="text-[10px] text-on-surface-variant/40 font-medium">
                        {group.sessions.length} {t('sessions').toLowerCase()}
                      </span>
                      <div className="flex-1 h-px bg-white/[0.06]" />
                    </div>
                  )}

                  {group.microcycle.id === '__other__' && (
                    <div className="flex items-center gap-3 px-1">
                      <h3 className="text-sm font-bold text-on-surface-variant/50">{t('otherSessions') || 'Outras Sessões'}</h3>
                      <div className="flex-1 h-px bg-white/[0.06]" />
                    </div>
                  )}

                  {/* Session cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {group.sessions.map((session, index) => {
                      const mdLabel = group.microcycle.matchDay
                        ? getMatchDayLabel(session.date, group.microcycle.matchDay, mcDays)
                        : null;

                      return (
                        <SessionCard
                          key={session.id}
                          session={session}
                          index={index}
                          goalkeepers={goalkeepers}
                          mdLabel={mdLabel}
                          microcycleName={group.microcycle.id !== '__other__' ? undefined : undefined}
                          mesocycleName={group.microcycle.mesocycle}
                          onView={setViewingSession}
                          onEdit={handleEditSession}
                          onDelete={deleteSession}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })
          ) : null}
        </div>
      )}
      </div>

      <AnimatePresence>
        {editingDrillId && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] flex items-center justify-center p-4">
             <div className="bg-surface border border-white/10 p-8 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto scrollbar-thin overflow-x-hidden">
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
                />
             </div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
});
TrainingTab.displayName = 'TrainingTab';
