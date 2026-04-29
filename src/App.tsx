import React, { useState, useCallback, lazy, Suspense } from 'react';
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
import { TacticalBoard } from './components/TacticalBoard';
import { SessionDetailModal } from './components/SessionDetailModal';
import { ExerciseDetailModal } from './components/ExerciseDetailModal';
import { handleExportSession } from './lib/exportSession';
import { useCustomPresets } from './hooks/useCustomPresets';

// Lazy-loaded tabs (less frequently accessed on initial load)
const WellnessTab = lazy(() => import('./components/tabs/WellnessTab').then(m => ({ default: m.WellnessTab })));
const RPETab = lazy(() => import('./components/tabs/RPETab').then(m => ({ default: m.RPETab })));
const VideosTab = lazy(() => import('./components/tabs/VideosTab').then(m => ({ default: m.VideosTab })));
const MethodologyTab = lazy(() => import('./components/tabs/MethodologyTab').then(m => ({ default: m.MethodologyTab })));
const AnalyticsTab = lazy(() => import('./components/tabs/AnalyticsTab'));
const SupportTab = lazy(() => import('./components/tabs/SupportTab').then(m => ({ default: m.SupportTab })));

const TabFallback = () => (
  <div className="flex items-center justify-center py-20">
    <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
  </div>
);

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
    updateVideo,
    deleteVideo,
    reorderGoalkeepers,
    savedMicrocycles,
    addMicrocycle,
    updateMicrocycle,
    deleteMicrocycle
  } = useAppData();

  const sessionForm = useSessionForm(addSession, updateSession, addExerciseToLibrary, exercisesLibrary);
  const microcycle = useMicrocycle(
    savedMicrocycles,
    addMicrocycle,
    deleteMicrocycle
  );
  
  const { customPresets, addCustomPreset, removeCustomPreset, moveCustomPreset, getOptions } = useCustomPresets();

  // Memoized callbacks for modals
  const handleCloseTacticalBoard = useCallback(() => sessionForm.setIsTacticalBoardOpen(false), [sessionForm]);
  const handleSaveTacticalBoard = useCallback((dataUrl: string) => sessionForm.handleTacticalBoardSave(dataUrl), [sessionForm]);
  const handleCloseSessionModal = useCallback(() => setViewingSession(null), []);
  const handleExportAndClose = useCallback((id: string) => { handleExportSession(id); setViewingSession(null); }, []);
  const handleDeleteAndClose = useCallback((id: string) => { deleteSession(id); setViewingSession(null); }, [deleteSession]);
  const handleEditAndClose = useCallback((session: TrainingSession) => { sessionForm.handleEditSession(session); setViewingSession(null); setActiveTab('Training'); }, [sessionForm]);
  const handleCloseExerciseModal = useCallback(() => setSelectedExercise(null), []);
  const handleDeleteExercise = useCallback(async (id: string) => { await deleteExercise(id); setSelectedExercise(null); }, [deleteExercise]);
  const handleEditExerciseNav = useCallback((ex: Exercise) => { setEditingExercise(ex); setActiveTab('Exercises'); setSelectedExercise(null); }, []);

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
          <p className="text-sm text-on-surface-variant font-label">{t('loading')}</p>
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
              matchOpponent={microcycle.matchOpponent}
              matchLocation={microcycle.matchLocation}
              matchTime={microcycle.matchTime}
              matchCompetition={microcycle.matchCompetition}
              restDays={microcycle.restDays}
              getMicrocycleDays={microcycle.getMicrocycleDays}
              getDayDate={microcycle.getDayDate}
              getDayKey={microcycle.getDayKey}
              setActiveTab={setActiveTab}
              setViewingSession={setViewingSession}
              onReorderGoalkeepers={reorderGoalkeepers}
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
              goalkeepers={goalkeepers}
              exercisesLibrary={exercisesLibrary}
              savedMicrocycles={microcycle.savedMicrocycles}
              deleteSession={deleteSession}
              sessionForm={sessionForm}
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
              mesocycle={microcycle.mesocycle}
              setMesocycle={microcycle.setMesocycle}
              microcycleStartDate={microcycle.microcycleStartDate}
              setMicrocycleStartDate={microcycle.setMicrocycleStartDate}
              microcycleEndDate={microcycle.microcycleEndDate}
              setMicrocycleEndDate={microcycle.setMicrocycleEndDate}
              matchDay={microcycle.matchDay}
              setMatchDay={microcycle.setMatchDay}
              matchOpponent={microcycle.matchOpponent}
              setMatchOpponent={microcycle.setMatchOpponent}
              matchLocation={microcycle.matchLocation}
              setMatchLocation={microcycle.setMatchLocation}
              matchTime={microcycle.matchTime}
              setMatchTime={microcycle.setMatchTime}
              matchCompetition={microcycle.matchCompetition}
              setMatchCompetition={microcycle.setMatchCompetition}
              restDays={microcycle.restDays}
              toggleRestDay={microcycle.toggleRestDay}
              isSaving={microcycle.isSaving}
              savedMicrocycles={microcycle.savedMicrocycles}
              showMicrocycleHistory={microcycle.showMicrocycleHistory}
              setShowMicrocycleHistory={microcycle.setShowMicrocycleHistory}
              getMicrocycleDays={microcycle.getMicrocycleDays}
              getDayDate={microcycle.getDayDate}
              getDayKey={microcycle.getDayKey}
              formatDayDate={microcycle.formatDayDate}
              formatMonthLabel={microcycle.formatMonthLabel}
              getMatchDayLabel={microcycle.getMatchDayLabel}
              saveMicrocycle={microcycle.saveMicrocycle}
              loadMicrocycle={microcycle.loadMicrocycle}
              deleteMicrocycle={microcycle.deleteMicrocycle}
              ALL_DAYS={microcycle.ALL_DAYS}
              setActiveTab={setActiveTab}
              setIsAddingSession={sessionForm.setIsAddingSession}
              setNewSession={sessionForm.setNewSession}
              setViewingSession={setViewingSession}
              customPresets={customPresets}
              addCustomPreset={addCustomPreset}
              removeCustomPreset={removeCustomPreset}
              moveCustomPreset={moveCustomPreset}
              getOptions={getOptions}
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
            <Suspense fallback={<TabFallback />}><WellnessTab /></Suspense>
          </motion.div>
        )}

        {activeTab === 'RPE' && (
          <motion.div key="rpe" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <Suspense fallback={<TabFallback />}><RPETab /></Suspense>
          </motion.div>
        )}

        {activeTab === 'Analytics' && (
          <motion.div key="analytics" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <Suspense fallback={<TabFallback />}><AnalyticsTab /></Suspense>
          </motion.div>
        )}

        {activeTab === 'Methodology' && (
          <motion.div key="methodology" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <Suspense fallback={<TabFallback />}><MethodologyTab /></Suspense>
          </motion.div>
        )}

        {activeTab === 'Videos' && (
          <motion.div key="videos" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <Suspense fallback={<TabFallback />}><VideosTab videos={videos} addVideo={addVideo} deleteVideo={deleteVideo} /></Suspense>
          </motion.div>
        )}

        {activeTab === 'Support' && (
          <motion.div key="support" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <Suspense fallback={<TabFallback />}><SupportTab /></Suspense>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {sessionForm.isTacticalBoardOpen && (
          <TacticalBoard
            onClose={handleCloseTacticalBoard}
            onSave={handleSaveTacticalBoard}
            initialData={sessionForm.currentDrill.diagram}
          />
        )}
      </AnimatePresence>

      {/* Detail Modals */}
      {viewingSession && (
        <SessionDetailModal
          session={viewingSession}
          onClose={handleCloseSessionModal}
          onExport={handleExportAndClose}
          onDelete={handleDeleteAndClose}
          onEdit={handleEditAndClose}
        />
      )}
      {selectedExercise && (
        <ExerciseDetailModal
          exercise={selectedExercise}
          onClose={handleCloseExerciseModal}
          onDelete={handleDeleteExercise}
          onEdit={handleEditExerciseNav}
        />
      )}
    </AppLayout>
  );
}
