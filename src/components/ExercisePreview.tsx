import { Target } from 'lucide-react';
import { cn } from '../lib/utils';
import { useTranslation } from '../hooks/useTranslation';
import { Exercise } from '../types';

export const ExercisePreview = ({ drill }: { drill: Omit<Exercise, 'id'> }) => {
  const { t } = useTranslation();

  if (!drill.title && !drill.objective && !drill.organization && !drill.execution && !drill.progression && !drill.successCriteria) {
    return null;
  }

  return (
    <div className="bg-surface-container-highest p-6 rounded-xl border border-black/10 space-y-4">
      <div className="flex items-center gap-2">
        <Target className="w-4 h-4 text-primary" />
        <h4 className="text-sm font-bold text-on-surface">{t('exercisePreview')}</h4>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h5 className="text-[9px] text-primary uppercase font-label font-bold tracking-widest mb-2">{t('titleType')}</h5>
          <p className="text-sm text-on-surface font-medium">{t(drill.title as any) || t('untitledDrill')}</p>
          <span className={cn(
            "inline-block mt-1 px-2 py-1 rounded text-[8px] font-bold",
            drill.type === 'analytical' ? "bg-primary/10 text-primary" :
            drill.type === 'decision' ? "bg-secondary/10 text-secondary" :
            drill.type === 'contextualized' ? "bg-tertiary/10 text-tertiary" :
            "bg-surface-container text-on-surface-variant"
          )}>
            {t(drill.type as any)}
          </span>
        </div>

        <div>
          <h5 className="text-[9px] text-primary uppercase font-label font-bold tracking-widest mb-2">{t('durationIntensity')}</h5>
          <p className="text-sm text-on-surface">{t(drill.duration as any)} • {t(drill.intensity as any)}</p>
        </div>
      </div>

      {drill.objective && (
        <div>
          <h5 className="text-[9px] text-primary uppercase font-label font-bold tracking-widest mb-2">{t('objective')}</h5>
          <p className="text-xs text-on-surface-variant">{t(drill.objective as any)}</p>
        </div>
      )}

      {drill.organization && (
        <div>
          <h5 className="text-[9px] text-primary uppercase font-label font-bold tracking-widest mb-2">{t('organization')}</h5>
          <p className="text-xs text-on-surface-variant">{t(drill.organization as any)}</p>
        </div>
      )}

      {drill.execution && (
        <div>
          <h5 className="text-[9px] text-primary uppercase font-label font-bold tracking-widest mb-2">{t('execution')}</h5>
          <p className="text-xs text-on-surface-variant">{t(drill.execution as any)}</p>
        </div>
      )}

      {drill.progression && (
        <div>
          <h5 className="text-[9px] text-primary uppercase font-label font-bold tracking-widest mb-2">{t('progressionVariables')}</h5>
          <p className="text-xs text-on-surface-variant">{t(drill.progression as any)}</p>
        </div>
      )}

      {drill.successCriteria && (
        <div>
          <h5 className="text-[9px] text-primary uppercase font-label font-bold tracking-widest mb-2">{t('successCriteria')}</h5>
          <p className="text-xs text-on-surface-variant">{t(drill.successCriteria as any)}</p>
        </div>
      )}
    </div>
  );
};
