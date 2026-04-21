import React from 'react';
import { Search, X, Target, Library } from 'lucide-react';
import { motion } from 'motion/react';
import { Exercise } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';

interface LibraryPickerModalProps {
  exercisesLibrary: Exercise[];
  exerciseSearchTerm: string;
  onSearchChange: (term: string) => void;
  onSelect: (exercise: Exercise) => void;
  onClose: () => void;
  onGoToLibrary: () => void;
}

export const LibraryPickerModal: React.FC<LibraryPickerModalProps> = ({
  exercisesLibrary,
  exerciseSearchTerm,
  onSearchChange,
  onSelect,
  onClose,
  onGoToLibrary,
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-surface/80 backdrop-blur-sm z-0"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        role="dialog"
        aria-modal="true"
        aria-label={t('selectFromLibrary')}
        className="relative z-10 bg-surface border border-white/[0.06] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b border-white/[0.06] flex items-center justify-between bg-surface-elevated">
          <div>
            <h3 className="text-xl font-bold text-on-surface flex items-center gap-2">
              <Library className="w-5 h-5 text-secondary" />
              {t('selectFromLibrary')}
            </h3>
            <p className="text-[10px] text-on-surface-variant uppercase font-label tracking-widest mt-1">{t('choosePreDesignedExercise')}</p>
          </div>
          <button aria-label={t('close')} onClick={onClose} className="text-on-surface-variant hover:text-on-surface transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
            <input
              type="text"
              value={exerciseSearchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t('searchSavedExercises')}
              className="w-full bg-surface-elevated border border-white/[0.06] rounded-full pl-10 pr-4 py-2 text-sm focus:border-secondary transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {exercisesLibrary
              .filter(ex => {
                const objectiveStr = Array.isArray(ex.objective) ? ex.objective.join(' ') : (ex.objective || '');
                return ex.title.toLowerCase().includes(exerciseSearchTerm.toLowerCase()) ||
                       objectiveStr.toLowerCase().includes(exerciseSearchTerm.toLowerCase());
              })
              .map(ex => (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => onSelect(ex)}
                  className="bg-surface-elevated p-4 rounded-xl border border-white/[0.04] hover:border-secondary transition-all text-left group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="bg-secondary/20 text-secondary text-[8px] font-bold px-2 py-0.5 rounded uppercase tracking-widest">{ex.type}</span>
                    <span className="text-[10px] text-on-surface-variant">{ex.duration}</span>
                  </div>
                  <h4 className="text-sm font-bold text-on-surface group-hover:text-secondary transition-colors line-clamp-1">{ex.title}</h4>
                  <p className="text-[10px] text-on-surface-variant line-clamp-2 mt-1">{ex.objective}</p>
                </button>
              ))}

            {exercisesLibrary.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-white/[0.06] rounded-xl">
                <Target className="w-10 h-10 text-on-surface-variant mb-3" />
                <h4 className="text-lg font-bold text-on-surface mb-1">{t('libraryEmpty')}</h4>
                <p className="text-[10px] text-on-surface-variant max-w-xs mb-4">{t('libraryEmptyDescription')}</p>
                <button
                  type="button"
                  onClick={onGoToLibrary}
                  className="text-secondary text-[10px] font-bold uppercase hover:underline"
                >
                  {t('goToExerciseLibrary')}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-white/[0.06] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-md font-label text-xs font-bold text-on-surface-variant hover:text-on-surface transition-all"
          >
            {t('cancel').toUpperCase()}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
