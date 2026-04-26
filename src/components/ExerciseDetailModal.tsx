import React from 'react';
import { X, Clock, Zap, Trash2, Edit3 } from 'lucide-react';
import { motion } from 'motion/react';
import { cn, getDiagramImage } from '../lib/utils';
import { useTranslation } from '../hooks/useTranslation';
import { Field } from './ui/Field';
import type { Exercise } from '../types';

interface ExerciseDetailModalProps {
  exercise: Exercise;
  onClose: () => void;
  onDelete: (id: string) => void;
  onEdit?: (exercise: Exercise) => void;
}

function getTypeBadgeClasses(type: Exercise['type']): string {
  switch (type) {
    case 'shotStopping':
      return 'bg-blue-500/10 text-blue-400';
    case 'crosses':
      return 'bg-amber-500/10 text-amber-400';
    case 'oneVsOne':
      return 'bg-red-500/10 text-red-400';
    case 'footwork':
      return 'bg-green-500/10 text-green-400';
    case 'distribution':
      return 'bg-indigo-500/10 text-indigo-400';
    case 'depthControl':
      return 'bg-pink-500/10 text-pink-400';
    case 'setPieces':
      return 'bg-teal-500/10 text-teal-400';
    case 'warmup':
      return 'bg-purple-500/10 text-purple-400';
  }
}

function getIntensityClasses(intensity: Exercise['intensity']): string {
  switch (intensity) {
    case 'low':
      return 'bg-tertiary/10 text-tertiary';
    case 'medium':
      return 'bg-secondary/10 text-secondary';
    case 'high':
      return 'bg-error/10 text-error';
  }
}


export const ExerciseDetailModal: React.FC<ExerciseDetailModalProps> = ({
  exercise,
  onClose,
  onDelete,
  onEdit,
}) => {
  const { t } = useTranslation();

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

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
        role="dialog"
        aria-modal="true"
        aria-label={exercise.title}
        className="bg-surface border border-white/[0.04] rounded-2xl w-full max-w-[95vw] max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-surface border-b border-white/[0.04] px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-2.5 min-w-0">
            <h2 className="font-headline text-lg text-on-surface font-bold truncate">
              {exercise.title}
            </h2>
            <span
              className={cn(
                'text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0',
                getTypeBadgeClasses(exercise.type)
              )}
            >
              {exercise.type}
            </span>
          </div>
          <button
            aria-label={t('close')}
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/[0.03] transition-colors text-on-surface/60 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Duration, Intensity & Physical Capacity Row */}
          <div className="flex items-center gap-4">
            {exercise.category && (
              <span
                className={cn(
                  'text-[10px] font-bold px-2 py-0.5 rounded-md',
                  exercise.category === 'strength' ? 'bg-red-500/10 text-red-400' :
                  exercise.category === 'velocity' ? 'bg-blue-500/10 text-blue-400' :
                  exercise.category === 'reactionSpeed' ? 'bg-amber-500/10 text-amber-400' :
                  'bg-green-500/10 text-green-400'
                )}
              >
                {t(exercise.category)}
              </span>
            )}
            {exercise.duration && (
              <div className="flex items-center gap-1.5 text-on-surface/60 text-xs">
                <Clock className="w-3.5 h-3.5" />
                <span>{Array.isArray(exercise.duration) ? exercise.duration.map(d => t(d)).join(', ') : t(exercise.duration)}</span>
              </div>
            )}
            {exercise.intensity && (
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-on-surface/60" />
                <span
                  className={cn(
                    'text-[10px] font-bold px-2 py-0.5 rounded-md',
                    getIntensityClasses(exercise.intensity)
                  )}
                >
                  {exercise.intensity}
                </span>
              </div>
            )}
          </div>

          {/* Sections */}
          <div className="space-y-4">
            <Field label={t('objective')} value={exercise.objective} className="space-y-1.5" />
            <Field label={t('organization')} value={exercise.organization} className="space-y-1.5" />
            <Field label={t('execution')} value={exercise.execution} className="space-y-1.5" />
            <Field label={t('progression')} value={exercise.progression} className="space-y-1.5" />
            <Field label={t('successCriteriaLabel')} value={exercise.successCriteria} className="space-y-1.5" />
          </div>

          {/* Diagram */}
          {exercise.diagram && (
            <div className="space-y-1.5">
              <p className="text-[10px] text-on-surface/50 uppercase font-label font-bold tracking-wider">
                {t('diagram')}
              </p>
              <img
                src={getDiagramImage(exercise.diagram)}
                alt={`Diagram for ${exercise.title}`}
                className="rounded-lg border border-white/[0.04] w-full object-contain max-h-72"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-surface border-t border-white/[0.04] px-6 py-4 flex items-center justify-between rounded-b-2xl">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (window.confirm(t('confirmDeleteExercise'))) {
                  onDelete(exercise.id);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-error/10 text-error text-xs font-semibold hover:bg-error/20 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {t('delete')}
            </button>
            {onEdit && (
              <button
                onClick={() => onEdit(exercise)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                {t('edit')}
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
    </motion.div>
  );
};
