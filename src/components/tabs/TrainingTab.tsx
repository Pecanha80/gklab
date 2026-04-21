import React, { useMemo } from 'react';
import {
  Dumbbell,
  Plus,
  FileText,
  X,
  Edit3,
} from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { getTodayDateString, parseDate } from '../../lib/utils';
import { TrainingSession, Exercise, Goalkeeper, SavedMicrocycle } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';
import { useCustomPresets } from '../../hooks/useCustomPresets';
import { PRESETS } from '../../data/presets';
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.length === 0 ? (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-on-surface-variant space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                <FileText className="w-8 h-8 text-on-surface-variant/30" />
              </div>
              <p className="text-sm font-medium text-on-surface-variant/50">{t('noSessionsFound')}</p>
            </div>
          ) : (
            sessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((session, index) => (
              <SessionCard
                key={session.id}
                session={session}
                index={index}
                goalkeepers={goalkeepers}
                onView={setViewingSession}
                onEdit={handleEditSession}
                onDelete={deleteSession}
              />
            ))
          )}
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
