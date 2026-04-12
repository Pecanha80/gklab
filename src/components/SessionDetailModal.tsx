import React from 'react';
import { X, Clock, Users, Target, Dumbbell, Trophy, Wind, Edit3, Download, Calendar } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { useTranslation } from '../hooks/useTranslation';
import type { TrainingSession } from '../types';

interface SessionDetailModalProps {
  session: TrainingSession;
  onClose: () => void;
  onExport: (id: string) => void;
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

const Field: React.FC<{ label: string; value?: string }> = ({ label, value }) => {
  if (!value) return null;
  return (
    <div className="space-y-1">
      <p className="text-[10px] text-on-surface/50 uppercase font-label font-bold tracking-wider">
        {label}
      </p>
      <p className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap">{value}</p>
    </div>
  );
};

function getTypeBadgeClasses(type: string): string {
  switch (type) {
    case 'Analytical':
      return 'bg-secondary/10 text-secondary';
    case 'Decision':
      return 'bg-tertiary/10 text-tertiary';
    case 'Contextualized':
      return 'bg-primary/10 text-primary';
    case 'Warmup':
      return 'bg-error/10 text-error';
    default:
      return 'bg-on-surface/10 text-on-surface';
  }
}

export const SessionDetailModal: React.FC<SessionDetailModalProps> = ({
  session,
  onClose,
  onExport,
}) => {
  const { t } = useTranslation();
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
            <button
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
                <span>{session.category}</span>
              </div>
            )}
            {session.duration && (
              <div className="flex items-center gap-1.5 text-on-surface/60 text-xs">
                <Clock className="w-3.5 h-3.5" />
                <span>{session.duration}</span>
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
              <p className="text-sm text-on-surface leading-relaxed">
                {session.coolDown}
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
        </div>
      </motion.div>
    </motion.div>
  );
};
