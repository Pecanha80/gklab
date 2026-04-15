import React from 'react';
import { X, Clock, Users, Target, Dumbbell, Trophy, Wind, Edit3, Download, Calendar, CheckCircle2, XCircle, AlertCircle, MessageSquare, Trash2, Activity } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { useTranslation } from '../hooks/useTranslation';
import { useAttendance } from '../hooks/useAttendance';
import { WellnessModal } from './WellnessModal';
import { AnimatePresence } from 'motion/react';
import { Field } from './ui/Field';
import { Heart } from 'lucide-react';
import type { TrainingSession, AttendanceStatus, Goalkeeper } from '../types';

interface SessionDetailModalProps {
  session: TrainingSession;
  onClose: () => void;
  onExport: (id: string) => void;
  onDelete?: (id: string) => void;
  onEdit?: (session: TrainingSession) => void;
}

const SectionHeading: React.FC<{ title: string; icon?: React.ComponentType<{ className?: string }> }> = ({
  title,
  icon: Icon,
}) => (
  <div className="flex items-center gap-2 pt-6 border-t border-black/5 first:border-t-0 first:pt-0">
    {Icon && <Icon className="w-4 h-4 text-primary" />}
    <h4 className="text-[10px] text-primary uppercase font-label font-bold tracking-widest">
      {title}
    </h4>
  </div>
);


function getTypeBadgeClasses(type: string): string {
  switch (type) {
    case 'analytical':
      return 'bg-secondary/10 text-secondary';
    case 'decision':
      return 'bg-tertiary/10 text-tertiary';
    case 'contextualized':
      return 'bg-primary/10 text-primary';
    case 'warmup':
      return 'bg-error/10 text-error';
    default:
      return 'bg-on-surface/10 text-on-surface';
  }
}

export const SessionDetailModal: React.FC<SessionDetailModalProps> = ({
  session,
  onClose,
  onExport,
  onDelete,
  onEdit,
}) => {
  const { t } = useTranslation();
  const { 
    attendance, 
    eligibleGoalkeepers, 
    loading, 
    fetchAttendanceData, 
    updateAttendance,
    updateRpe 
  } = useAttendance(session.id);

  const [localAttendance, setLocalAttendance] = React.useState<Record<string, { status: AttendanceStatus; notes: string; rpe?: number }>>({});
  const [wellnessModalOpen, setWellnessModalOpen] = React.useState(false);
  const [wellnessGk, setWellnessGk] = React.useState<Goalkeeper | null>(null);

  const openWellnessModal = (gk: Goalkeeper) => {
    setWellnessGk(gk);
    setWellnessModalOpen(true);
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  React.useEffect(() => {
    fetchAttendanceData(session.category);
  }, [session.id, session.category, fetchAttendanceData]);

  React.useEffect(() => {
    if (attendance.length > 0) {
      const mapped = attendance.reduce((acc, curr) => ({
        ...acc,
        [curr.goalkeeper_id]: { status: curr.status, notes: curr.notes || '', rpe: curr.rpe }
      }), {});
      setLocalAttendance(mapped);
    }
  }, [attendance]);

  const handleStatusChange = async (gkId: string, status: AttendanceStatus) => {
    const existing = localAttendance[gkId];
    const currentNotes = existing?.notes || '';
    const currentRpe = existing?.rpe;
    setLocalAttendance(prev => ({
      ...prev,
      [gkId]: { ...prev[gkId], status, notes: currentNotes, rpe: currentRpe }
    }));
    try {
      await updateAttendance(gkId, status, currentNotes);
    } catch (err) {
      console.error('Failed to update attendance', err);
    }
  };

  const handleNotesChange = async (gkId: string, notes: string) => {
    const currentStatus = localAttendance[gkId]?.status || 'absent';
    setLocalAttendance(prev => ({
      ...prev,
      [gkId]: { status: currentStatus, notes }
    }));
  };

  const saveNotes = async (gkId: string) => {
    const data = localAttendance[gkId];
    if (!data) return;
    try {
      await updateAttendance(gkId, data.status, data.notes);
    } catch (err) {
      console.error('Failed to save notes', err);
    }
  };

  const handleRpeChange = async (gkId: string, rpe: number) => {
    setLocalAttendance(prev => ({
      ...prev,
      [gkId]: { ...prev[gkId], rpe }
    }));
    try {
      await updateRpe(gkId, rpe);
    } catch (err) {
      console.error('Failed to update RPE', err);
    }
  };

  const getRpeColor = (rpe: number): string => {
    if (rpe <= 2) return 'bg-emerald-500';
    if (rpe <= 4) return 'bg-lime-500';
    if (rpe <= 6) return 'bg-amber-500';
    if (rpe <= 8) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getRpeLabel = (rpe: number): string => {
    const key = `rpeScale${rpe}` as any;
    return t(key);
  };

  const hasObjectives =
    session.objectives.technical ||
    session.objectives.tactical ||
    session.objectives.physical ||
    session.objectives.cognitive;

  const hasWarmup = session.warmup && session.warmup.length > 0;

  const hasObservations =
    session.observations.positives ||
    session.observations.adjustments ||
    session.observations.individualEval;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-surface/90 backdrop-blur-md p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          role="dialog"
          aria-modal="true"
          aria-label={session.titles?.map(t_ => t(t_ as any)).join(' & ') || t('sessionDetails' as any)}
          className="bg-surface-container border border-black/5 rounded-2xl w-full max-w-[95vw] max-h-[90vh] overflow-y-auto shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-surface-container border-b border-black/5 px-6 py-4 flex items-center justify-between rounded-t-2xl">
            <h2 className="font-headline text-lg text-on-surface font-bold truncate pr-4">
              {session.titles?.map(t_ => t(t_ as any)).join(' & ')}
            </h2>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => onExport(session.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                {t('exportPdf')}
              </button>
              {onEdit && (
                <button
                  onClick={() => onEdit(session)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  {t('editSession')}
                </button>
              )}
              <button
                aria-label={t('close')}
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-black/5 transition-colors text-on-surface/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Info Row */}
            <div className="flex flex-wrap gap-4">
              {session.date && (
                <div className="flex items-center gap-1.5 text-on-surface/60 text-xs">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{session.date}</span>
                </div>
              )}
              {session.category && (
                <div className="flex items-center gap-1.5 text-on-surface/60 text-xs">
                  <Trophy className="w-3.5 h-3.5" />
                  <span>{Array.isArray(session.category) ? session.category.map(c => t(c as any)).join(', ') : t(session.category as any)}</span>
                </div>
              )}
              {session.duration && (
                <div className="flex items-center gap-1.5 text-on-surface/60 text-xs">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{Array.isArray(session.duration) ? session.duration.map(d => t(d as any)).join(', ') : t(session.duration as any)}</span>
                </div>
              )}
              {session.numAthletes > 0 && (
                <div className="flex items-center gap-1.5 text-on-surface/60 text-xs">
                  <Users className="w-3.5 h-3.5" />
                  <span>{session.numAthletes} {t('athletes_count')}</span>
                </div>
              )}
            </div>

            {/* General Objective */}
            {session.generalObjectives && session.generalObjectives.length > 0 && (
              <div className="space-y-3">
                <SectionHeading title={t('generalObjectiveHeading')} icon={Target} />
                <p className="text-sm text-on-surface leading-relaxed">
                  {session.generalObjectives.map(o => t(o as any)).join(', ')}
                </p>
              </div>
            )}

            {/* Specific Objectives */}
            {hasObjectives && (
              <div className="space-y-3">
                <SectionHeading title={t('specificObjectivesHeading')} icon={Target} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label={t('technical')} value={session.objectives.technical} />
                  <Field label={t('tactical')} value={session.objectives.tactical} />
                  <Field label={t('physical')} value={session.objectives.physical} />
                  <Field label={t('cognitive')} value={session.objectives.cognitive} />
                </div>
              </div>
            )}

            {/* Warm Up */}
            {hasWarmup && (
              <div className="space-y-3">
                <SectionHeading title={t('warmUpHeading')} icon={Wind} />
                <div className="space-y-4">
                  {session.warmup.map((drill, idx) => (
                    <div key={drill.id} className="bg-surface rounded-xl border border-black/5 p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded">
                          {idx + 1}
                        </span>
                        <h4 className="text-sm font-bold text-on-surface">{drill.title}</h4>
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        <Field label={t('objective')} value={drill.objective} />
                        <Field label={t('execution')} value={drill.execution} />
                        <Field label={t('duration')} value={drill.duration} />
                        <Field label={t('progression')} value={drill.progression} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Exercises */}
            {session.exercises.length > 0 && (
              <div className="space-y-3">
                <SectionHeading title={t('exercisesHeading')} icon={Dumbbell} />
                <div className="space-y-4">
                  {session.exercises.map((exercise, idx) => (
                    <div
                      key={exercise.id}
                      className="bg-surface rounded-xl border border-black/5 p-4 space-y-3"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-on-surface/5 text-on-surface/50 font-bold px-2 py-0.5 rounded-md">
                          #{idx + 1}
                        </span>
                        <span
                          className={cn(
                            'text-[10px] font-bold px-2 py-0.5 rounded-md',
                            getTypeBadgeClasses(exercise.type)
                          )}
                        >
                          {exercise.type}
                        </span>
                        <h5 className="text-sm text-on-surface font-semibold">
                          {exercise.title}
                        </h5>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        <Field label={t('objective')} value={exercise.objective} />
                        <Field label={t('organization')} value={exercise.organization} />
                        <Field label={t('execution')} value={exercise.execution} />
                        <Field label={t('progression')} value={exercise.progression} />
                        <Field label={t('successCriteriaLabel')} value={exercise.successCriteria} />
                        {(exercise.duration || exercise.intensity) && (
                          <div className="flex gap-4">
                            <Field label={t('duration')} value={exercise.duration} />
                            <Field label={t('intensity')} value={exercise.intensity} />
                          </div>
                        )}
                      </div>
                      {exercise.diagram && (
                        <div className="mt-2">
                          <img
                            src={exercise.diagram}
                            alt={`Diagram for ${exercise.title}`}
                            className="rounded-lg border border-black/5 max-h-64 object-contain"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Integrated with Team */}
            {session.integratedWithTeam && session.integratedWithTeam.length > 0 && (
              <div className="space-y-3">
                <SectionHeading title={t('integratedWithTeamHeading')} icon={Users} />
                <div className="space-y-3">
                  {session.integratedWithTeam.map((item) => (
                    <div
                      key={item.id}
                      className="bg-surface rounded-xl border border-black/5 p-4 grid grid-cols-2 sm:grid-cols-4 gap-3"
                    >
                      <Field label={t('format')} value={item.format} />
                      <Field label={t('number')} value={item.number} />
                      <Field label={t('space')} value={item.space} />
                      <Field label={t('time')} value={item.time} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cool Down */}
            {session.coolDown && (
              <div className="space-y-3">
                <SectionHeading title={t('coolDownHeading')} icon={Wind} />
                <p className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap">
                  {Array.isArray(session.coolDown) ? session.coolDown.join('\n') : session.coolDown}
                </p>
              </div>
            )}

            {/* Observations */}
            {hasObservations && (
              <div className="space-y-3">
                <SectionHeading title={t('observationsHeading')} icon={Edit3} />
                <div className="grid grid-cols-1 gap-3">
                  <Field label={t('positives')} value={session.observations.positives} />
                  <Field label={t('adjustments')} value={session.observations.adjustments} />
                  <Field label={t('individualEvaluation')} value={session.observations.individualEval} />
                </div>
              </div>
            )}

            {/* Attendance Section */}
            <div className="space-y-4 pt-6 border-t border-black/5">
              <SectionHeading title={t('attendanceHeading')} icon={Users} />
              
              {loading && eligibleGoalkeepers.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {eligibleGoalkeepers.length === 0 && !loading && (
                      <p className="text-xs text-on-surface/50 italic">
                        {t('noGoalkeepersForCategory' as any)}
                      </p>
                  )}
                  {eligibleGoalkeepers.map((gk) => {
                    const att = localAttendance[gk.id] || { status: 'absent', notes: '', rpe: undefined };
                    const isPresent = att.status === 'present';
                    const isLate = att.status === 'late';
                    const isJustified = att.status === 'justified';
                    const isAbsent = att.status === 'absent';
                    const showRpe = isPresent || isLate;

                    return (
                      <div key={gk.id} className="bg-surface rounded-xl border border-black/5 p-3 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-on-surface/5 flex items-center justify-center overflow-hidden border border-black/5">
                              {gk.imageUrl ? (
                                <img src={gk.imageUrl} alt={gk.name} className="w-full h-full object-cover" />
                              ) : (
                                <Users className="w-4 h-4 text-on-surface/30" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-on-surface">{gk.name}</p>
                              <p className="text-[10px] text-on-surface/40 uppercase font-semibold">{gk.category}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 p-1">
                            <div className="p-1 bg-on-surface/5 rounded-lg flex items-center gap-1.5">
                              <button
                                onClick={() => handleStatusChange(gk.id, 'present')}
                                className={cn(
                                  "p-1.5 rounded-md transition-all flex items-center gap-1.5",
                                  isPresent ? "bg-primary text-white shadow-sm" : "text-on-surface/40 hover:text-on-surface/60"
                                )}
                                title={t('present')}
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                {isPresent && <span className="text-[10px] font-bold pr-1">{t('present')}</span>}
                              </button>
                              <button
                                onClick={() => handleStatusChange(gk.id, 'late')}
                                className={cn(
                                  "p-1.5 rounded-md transition-all flex items-center gap-1.5",
                                  isLate ? "bg-amber-500 text-white shadow-sm" : "text-on-surface/40 hover:text-on-surface/60"
                                )}
                                title={t('late')}
                              >
                                <Clock className="w-4 h-4" />
                                {isLate && <span className="text-[10px] font-bold pr-1">{t('late')}</span>}
                              </button>
                              <button
                                onClick={() => handleStatusChange(gk.id, 'justified')}
                                className={cn(
                                  "p-1.5 rounded-md transition-all flex items-center gap-1.5",
                                  isJustified ? "bg-blue-500 text-white shadow-sm" : "text-on-surface/40 hover:text-on-surface/60"
                                )}
                                title={t('justified')}
                              >
                                <AlertCircle className="w-4 h-4" />
                                {isJustified && <span className="text-[10px] font-bold pr-1">{t('justified')}</span>}
                              </button>
                              <button
                                onClick={() => handleStatusChange(gk.id, 'absent')}
                                className={cn(
                                  "p-1.5 rounded-md transition-all flex items-center gap-1.5",
                                  isAbsent ? "bg-error text-white shadow-sm" : "text-on-surface/40 hover:text-on-surface/60"
                                )}
                                title={t('absent')}
                              >
                                <XCircle className="w-4 h-4" />
                                {isAbsent && <span className="text-[10px] font-bold pr-1">{t('absent')}</span>}
                              </button>
                            </div>
                            <button
                              onClick={() => openWellnessModal(gk)}
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-all flex items-center gap-1.5 ml-2 border border-emerald-100 bg-white shadow-sm"
                              title={t('logWellness' as any)}
                            >
                              <Heart className={cn("w-4 h-4", "fill-emerald-100")} />
                              <span className="text-[10px] font-bold">Wellness</span>
                            </button>
                          </div>
                        </div>

                        {/* RPE Selector — only for present/late athletes */}
                        {showRpe ? (
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <Activity className="w-3.5 h-3.5 text-primary" />
                              <span className="text-[10px] font-bold text-primary uppercase tracking-wider">{t('rpeLabel' as any)}</span>
                              {att.rpe && (
                                <span className={cn(
                                  'text-[10px] font-bold text-white px-2 py-0.5 rounded-full ml-auto',
                                  getRpeColor(att.rpe)
                                )}>
                                  {att.rpe}/10 — {getRpeLabel(att.rpe)}
                                </span>
                              )}
                            </div>
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(val => (
                                <button
                                  key={val}
                                  onClick={() => handleRpeChange(gk.id, val)}
                                  className={cn(
                                    'flex-1 py-1.5 rounded-md text-[10px] font-bold transition-all border',
                                    att.rpe === val
                                      ? cn('text-white shadow-sm border-transparent', getRpeColor(val))
                                      : 'bg-on-surface/5 text-on-surface/50 border-transparent hover:bg-on-surface/10'
                                  )}
                                  title={getRpeLabel(val)}
                                >
                                  {val}
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 px-1 py-1 opacity-40">
                            <Activity className="w-3.5 h-3.5" />
                            <span className="text-[9px] font-medium tracking-tight">Marque presença para registrar o esforço (PSE)</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 group">
                          <MessageSquare className="w-3.5 h-3.5 text-on-surface/30 group-focus-within:text-primary transition-colors" />
                          <input
                            type="text"
                            value={att.notes}
                            onChange={(e) => handleNotesChange(gk.id, e.target.value)}
                            onBlur={() => saveNotes(gk.id)}
                            placeholder={t('notesPlaceholder')}
                            className="flex-1 bg-transparent text-xs text-on-surface placeholder:text-on-surface/20 outline-none border-b border-transparent focus:border-primary/30 transition-all font-medium"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-surface-container border-t border-black/5 px-6 py-4 flex items-center justify-between rounded-b-2xl">
            <div className="flex items-center gap-3">
              {onDelete && (
                <button
                  onClick={() => {
                    if (window.confirm(t('deleteThisSession'))) {
                      onDelete(session.id);
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-error/10 text-error text-xs font-semibold hover:bg-error/20 transition-colors"
                  title={t('deleteSession')}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {t('deleteSession')}
                </button>
              )}
              <button
                onClick={() => onExport(session.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                {t('exportPdf')}
              </button>
              {onEdit && (
                <button
                  onClick={() => onEdit(session)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  {t('editSession')}
                </button>
              )}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-on-surface/5 text-on-surface text-xs font-semibold hover:bg-on-surface/10 transition-colors"
            >
              {t('close')}
            </button>
          </div>
        </motion.div>
        
        <AnimatePresence>
          {wellnessModalOpen && wellnessGk && (
            <WellnessModal 
              goalkeeper={wellnessGk} 
              onClose={() => setWellnessModalOpen(false)} 
            />
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
};
