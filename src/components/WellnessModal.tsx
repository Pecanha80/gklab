import React, { useState, useEffect } from 'react';
import { X, Heart, Moon, Brain, Zap, Frown, Activity } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { useTranslation } from '../hooks/useTranslation';
import { useWellness } from '../hooks/useWellness';
import type { Goalkeeper } from '../types';

interface WellnessModalProps {
  goalkeeper: Goalkeeper;
  onClose: () => void;
  onSuccess?: () => void;
}

export const WellnessModal: React.FC<WellnessModalProps> = ({
  goalkeeper,
  onClose,
  onSuccess
}) => {
  const { t } = useTranslation();
  const { saveWellnessLog } = useWellness(goalkeeper.id);
  
  const [wellnessForm, setWellnessForm] = useState({
    goalkeeper_id: goalkeeper.id,
    sleep: 3,
    stress: 3,
    fatigue: 3,
    soreness: 3,
    mood: 3,
    notes: '',
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const wellnessScore = Math.round(((wellnessForm.sleep + wellnessForm.stress + wellnessForm.fatigue + wellnessForm.soreness + wellnessForm.mood) / 5) * 10) / 10;

  const getWellnessScaleColor = (val: number) => {
    if (val <= 1) return 'bg-red-500';
    if (val <= 2) return 'bg-orange-500';
    if (val <= 3) return 'bg-amber-500';
    if (val <= 4) return 'bg-lime-500';
    return 'bg-emerald-500';
  };

  const handleWellnessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveWellnessLog(wellnessForm);
      setSaved(true);
      if (onSuccess) onSuccess();
      setTimeout(onClose, 1500);
    } catch (err) {
      console.error('Failed to save wellness log', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-xl bg-surface-container-low p-6 shadow-xl border border-black/5"
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <Heart className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="font-headline text-lg font-bold text-on-surface">
                {t('wellnessQuestionnaire' as any)}
              </h2>
              <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">{goalkeeper.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-on-surface-variant transition-colors hover:bg-surface-container-highest"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {saved ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center justify-center py-10 gap-3"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <Heart className="h-8 w-8 text-emerald-500" />
            </div>
            <p className="text-sm font-bold text-on-surface">{t('wellnessSaved' as any)}</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-emerald-600">{wellnessScore}</span>
              <span className="text-xs text-on-surface-variant">/ 5</span>
            </div>
          </motion.div>
        ) : (
          <form onSubmit={handleWellnessSubmit} className="space-y-5">
            {[
              { key: 'sleep', icon: Moon, label: t('sleep' as any) },
              { key: 'stress', icon: Brain, label: t('stress' as any) },
              { key: 'fatigue', icon: Zap, label: t('fatigue' as any) },
              { key: 'soreness', icon: Frown, label: t('soreness' as any) },
              { key: 'mood', icon: Activity, label: t('moodLabel' as any) },
            ].map(({ key, icon: Icon, label }) => (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-on-surface-variant" />
                    <span className="text-sm font-semibold text-on-surface">{label}</span>
                  </div>
                  <span className={cn(
                    'text-[10px] font-bold text-white px-2 py-0.5 rounded-full',
                    getWellnessScaleColor(wellnessForm[key as keyof typeof wellnessForm] as number)
                  )}>
                    {t(`wellnessScale${wellnessForm[key as keyof typeof wellnessForm]}` as any)}
                  </span>
                </div>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setWellnessForm(prev => ({ ...prev, [key]: val }))}
                      className={cn(
                        'flex-1 py-1.5 rounded-lg text-xs font-bold transition-all border-2',
                        (wellnessForm[key as keyof typeof wellnessForm] as number) === val
                          ? cn('text-white shadow-md border-transparent', getWellnessScaleColor(val))
                          : 'bg-on-surface/5 text-on-surface/40 border-transparent hover:bg-on-surface/10'
                      )}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <div>
              <textarea
                value={wellnessForm.notes}
                onChange={(e) => setWellnessForm(prev => ({ ...prev, notes: e.target.value }))}
                rows={2}
                className="w-full rounded-lg border border-black/10 bg-surface-container px-3 py-2 font-label text-sm text-on-surface outline-none focus:border-primary resize-none"
                placeholder={t('notesPlaceholder')}
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-black/5">
              <div className="flex items-center gap-3">
                <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">{t('wellnessScore' as any)}</span>
                <span className={cn(
                  'text-lg font-black px-3 py-1 rounded-lg text-white',
                  getWellnessScaleColor(Math.round(wellnessScore))
                )}>
                  {wellnessScore}
                </span>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-black/10 px-4 py-2 font-label text-sm font-medium text-on-surface-variant hover:bg-surface-container-highest"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-emerald-600 px-5 py-2 font-label text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {saving ? '...' : t('save')}
                </button>
              </div>
            </div>
          </form>
        )}
      </motion.div>
    </motion.div>
  );
};
