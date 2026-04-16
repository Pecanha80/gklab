import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TrainingSession, Exercise } from './types';
import { useTranslation } from './hooks/useTranslation';
import { useAuth } from './hooks/useAuth';
import { useAppData } from './hooks/useAppData';
import { AuthPage } from './components/AuthPage';
import { useSessionForm } from './hooks/useSessionForm';
import { useMicrocycle } from './hooks/useMicrocycle';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardTab } from './components/tabs/DashboardTab';
import { TrainingTab } from './components/tabs/TrainingTab';
import { ExercisesTab } from './components/tabs/ExercisesTab';
import { PlanningTab } from './components/tabs/PlanningTab';
import { GoalkeepersTab } from './components/tabs/GoalkeepersTab';
import { WellnessTab } from './components/tabs/WellnessTab';
import { RPETab } from './components/tabs/RPETab';
import { VideosTab } from './components/tabs/VideosTab';
import { MethodologyTab } from './components/tabs/MethodologyTab';
import { SupportTab } from './components/tabs/SupportTab';
import { TacticalBoard } from './components/TacticalBoard';
import { SessionDetailModal } from './components/SessionDetailModal';
import { ExerciseDetailModal } from './components/ExerciseDetailModal';
import { handleExportSession } from './lib/exportSession';

export default function App() {
  const { t } = useTranslation();
  const { user, isLoading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState('Dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [viewingSession, setViewingSession] = useState<TrainingSession | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [exerciseSearchTerm, setExerciseSearchTerm] = useState('');

  const { 
    goalkeepers, 
    sessions, 
    videos, 
    exercisesLibrary, 
    isLoading, 
    addExerciseToLibrary, 
    updateExercise,
    deleteExercise, 
    addSession, 
    updateSession, 
    deleteSession, 
    addGoalkeeper, 
    updateGoalkeeper, 
    deleteGoalkeeper, 
    addVideo, 
    deleteVideo 
  } = useAppData();

  const sessionForm = useSessionForm(addSession, updateSession, addExerciseToLibrary, exercisesLibrary);
  const microcycle = useMicrocycle();

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-on-surface-variant font-label">{t('loading' as any)}</p>
        </div>
      </div>
    );
  }

  return (
    <AppLayout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      isSidebarCollapsed={isSidebarCollapsed}
      setIsSidebarCollapsed={setIsSidebarCollapsed}
    >
      <AnimatePresence mode="wait">

        {/* ===== DASHBOARD TAB ===== */}
        {activeTab === 'Dashboard' && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <DashboardTab
              sessions={sessions}
              goalkeepers={goalkeepers}
              videos={videos}
              microcycleName={microcycle.microcycleName}
              matchDay={microcycle.matchDay}
              getMicrocycleDays={microcycle.getMicrocycleDays}
              getDayDate={microcycle.getDayDate}
              setActiveTab={setActiveTab}
              setViewingSession={setViewingSession}
            />
          </motion.div>
        )}

        {/* ===== TRAINING TAB ===== */}
        {activeTab === 'Training' && (
          <motion.div
            key="training"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <TrainingTab
              sessions={sessions}
              exercisesLibrary={exercisesLibrary}
              deleteSession={deleteSession}
              isAddingSession={sessionForm.isAddingSession}
              setIsAddingSession={sessionForm.setIsAddingSession}
              newSession={sessionForm.newSession}
              setNewSession={sessionForm.setNewSession}
              isAddingDrill={sessionForm.isAddingDrill}
              setIsAddingDrill={sessionForm.setIsAddingDrill}
              drillContext={sessionForm.drillContext}
              setDrillContext={sessionForm.setDrillContext}
              editingDrillId={sessionForm.editingDrillId}
              currentDrill={sessionForm.currentDrill}
              setCurrentDrill={sessionForm.setCurrentDrill}
              isSelectingFromLibrary={sessionForm.isSelectingFromLibrary}
              setIsSelectingFromLibrary={sessionForm.setIsSelectingFromLibrary}
              setIsTacticalBoardOpen={sessionForm.setIsTacticalBoardOpen}
              translateContent={sessionForm.translateContent}
              handleGeneralObjectivesChange={sessionForm.handleGeneralObjectivesChange}
              handleAddSession={sessionForm.handleAddSession}
              handleAddDrill={sessionForm.handleAddDrill}
              handleEditDrill={sessionForm.handleEditDrill}
              handleCancelDrill={sessionForm.handleCancelDrill}
              handleRemoveDrill={sessionForm.handleRemoveDrill}
              applyDrillTemplate={sessionForm.applyDrillTemplate}
              applySessionTemplates={sessionForm.applySessionTemplates}
              loadExample={sessionForm.loadExample}
              handleEditSession={sessionForm.handleEditSession}
              editingSessionId={sessionForm.editingSessionId}
              setActiveTab={setActiveTab}
              setViewingSession={setViewingSession}
              exerciseSearchTerm={exerciseSearchTerm}
              setExerciseSearchTerm={setExerciseSearchTerm}
            />
          </motion.div>
        )}

        {/* ===== EXERCISES TAB ===== */}
        {activeTab === 'Exercises' && (
          <motion.div
            key="exercises"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <ExercisesTab
              exercisesLibrary={exercisesLibrary}
              addExerciseToLibrary={addExerciseToLibrary}
              selectedExercise={selectedExercise}
              setSelectedExercise={setSelectedExercise}
              setIsTacticalBoardOpen={sessionForm.setIsTacticalBoardOpen}
              currentDrill={sessionForm.currentDrill}
              setCurrentDrill={sessionForm.setCurrentDrill}
              applyDrillTemplate={sessionForm.applyDrillTemplate}
              translateContent={sessionForm.translateContent}
              updateExercise={updateExercise}
              editingExercise={editingExercise}
              setEditingExercise={setEditingExercise}
            />
          </motion.div>
        )}

        {/* ===== PLANNING TAB ===== */}
        {activeTab === 'Planning' && (
          <motion.div
            key="planning"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <PlanningTab
              sessions={sessions}
              microcycleName={microcycle.microcycleName}
              setMicrocycleName={microcycle.setMicrocycleName}
              microcycleStartDate={microcycle.microcycleStartDate}
              setMicrocycleStartDate={microcycle.setMicrocycleStartDate}
              microcycleStartDay={microcycle.microcycleStartDay}
              setMicrocycleStartDay={microcycle.setMicrocycleStartDay}
              microcycleEndDay={microcycle.microcycleEndDay}
              setMicrocycleEndDay={microcycle.setMicrocycleEndDay}
              matchDay={microcycle.matchDay}
              setMatchDay={microcycle.setMatchDay}
              savedMicrocycles={microcycle.savedMicrocycles}
              showMicrocycleHistory={microcycle.showMicrocycleHistory}
              setShowMicrocycleHistory={microcycle.setShowMicrocycleHistory}
              getMicrocycleDays={microcycle.getMicrocycleDays}
              getDayDate={microcycle.getDayDate}
              formatDayDate={microcycle.formatDayDate}
              formatMonthLabel={microcycle.formatMonthLabel}
              getMatchDayLabel={microcycle.getMatchDayLabel}
              saveMicrocycle={microcycle.saveMicrocycle}
              loadMicrocycle={microcycle.loadMicrocycle}
              deleteMicrocycle={microcycle.deleteMicrocycle}
              ALL_DAYS={microcycle.ALL_DAYS}
              setActiveTab={setActiveTab}
              setIsAddingSession={sessionForm.setIsAddingSession}
              setViewingSession={setViewingSession}
            />
          </motion.div>
        )}

        {activeTab === 'Goalkeepers' && (
          <motion.div key="goalkeepers" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <GoalkeepersTab goalkeepers={goalkeepers} addGoalkeeper={addGoalkeeper} updateGoalkeeper={updateGoalkeeper} deleteGoalkeeper={deleteGoalkeeper} />
          </motion.div>
        )}
        
        {activeTab === 'Wellness' && (
          <motion.div key="wellness" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <WellnessTab />
          </motion.div>
        )}

        {activeTab === 'RPE' && (
          <motion.div key="rpe" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <RPETab />
          </motion.div>
        )}

        {activeTab === 'Methodology' && (
          <motion.div key="methodology" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <MethodologyTab />
          </motion.div>
        )}

        {activeTab === 'Videos' && (
          <motion.div key="videos" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <VideosTab videos={videos} addVideo={addVideo} deleteVideo={deleteVideo} />
          </motion.div>
        )}

        {activeTab === 'Support' && (
          <motion.div key="support" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <SupportTab />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {sessionForm.isTacticalBoardOpen && (
          <TacticalBoard
            onClose={() => sessionForm.setIsTacticalBoardOpen(false)}
            onSave={(dataUrl) => sessionForm.handleTacticalBoardSave(dataUrl)}
          />
        )}
      </AnimatePresence>

      {/* Detail Modals */}
      {viewingSession && (
        <SessionDetailModal
          session={viewingSession}
          onClose={() => setViewingSession(null)}
          onExport={(id) => { handleExportSession(id); setViewingSession(null); }}
          onDelete={(id) => { deleteSession(id); setViewingSession(null); }}
          onEdit={(session) => { sessionForm.handleEditSession(session); setViewingSession(null); }}
        />
      )}
      {selectedExercise && (
        <ExerciseDetailModal 
          exercise={selectedExercise} 
          onClose={() => setSelectedExercise(null)} 
          onDelete={async (id) => { 
            console.log('App: Deleting exercise', id);
            await deleteExercise(id); 
            setSelectedExercise(null); 
          }}
          onEdit={(ex) => {
            setEditingExercise(ex);
            setActiveTab('Exercises');
            setSelectedExercise(null);
          }}
        />
      )}
    </AppLayout>
  );
}
