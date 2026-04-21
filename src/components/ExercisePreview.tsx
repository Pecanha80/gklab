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
    <div className="bg-surface-elevated p-6 rounded-xl border border-white/[0.06] space-y-4">
      <div className="flex items-center gap-2">
        <Target className="w-4 h-4 text-primary" />
        <h4 className="text-sm font-bold text-on-surface">{t('exercisePreview')}</h4>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h5 className="text-[9px] text-primary uppercase font-label font-bold tracking-widest mb-2">{t('titleType')}</h5>
          <p className="text-sm text-on-surface font-medium">{t(drill.title) || t('untitledDrill')}</p>
          <span className={cn(
            "inline-block mt-1 px-2 py-1 rounded text-[8px] font-bold",
            drill.type === 'analytical' ? "bg-primary/10 text-primary" :
            drill.type === 'decision' ? "bg-secondary/10 text-secondary" :
            drill.type === 'contextualized' ? "bg-tertiary/10 text-tertiary" :
            "bg-surface text-on-surface-variant"
          )}>
            {t(drill.type)}
          </span>
          {drill.category && (
            <span className="inline-block mt-1 ml-1 px-2 py-1 rounded text-[8px] font-bold bg-secondary/10 text-secondary">
              {t(drill.category)}
            </span>
          )}
        </div>

        <div>
          <h5 className="text-[9px] text-primary uppercase font-label font-bold tracking-widest mb-2">{t('durationIntensity')}</h5>
          <p className="text-sm text-on-surface">
            {Array.isArray(drill.duration) ? drill.duration.map(d => t(d)).join(', ') : t(drill.duration)} • {t(drill.intensity)}
          </p>
        </div>
      </div>

        <div>
          <h5 className="text-[9px] text-primary uppercase font-label font-bold tracking-widest mb-2">{t('objective')}</h5>
          <p className="text-xs text-on-surface-variant">
            {Array.isArray(drill.objective) ? drill.objective.map(o => t(o)).join(', ') : t(drill.objective)}
          </p>
        </div>

        <div>
          <h5 className="text-[9px] text-primary uppercase font-label font-bold tracking-widest mb-2">{t('organization')}</h5>
          <p className="text-xs text-on-surface-variant">
            {Array.isArray(drill.organization) ? drill.organization.map(o => t(o)).join(', ') : t(drill.organization)}
          </p>
        </div>

        <div>
          <h5 className="text-[9px] text-primary uppercase font-label font-bold tracking-widest mb-2">{t('execution')}</h5>
          <p className="text-xs text-on-surface-variant">
            {Array.isArray(drill.execution) ? drill.execution.map(e => t(e)).join(', ') : t(drill.execution)}
          </p>
        </div>

        <div>
          <h5 className="text-[9px] text-primary uppercase font-label font-bold tracking-widest mb-2">{t('progressionVariables')}</h5>
          <p className="text-xs text-on-surface-variant">
            {Array.isArray(drill.progression) ? drill.progression.map(p => t(p)).join(', ') : t(drill.progression)}
          </p>
        </div>

        <div>
          <h5 className="text-[9px] text-primary uppercase font-label font-bold tracking-widest mb-2">{t('successCriteria')}</h5>
          <p className="text-xs text-on-surface-variant">
            {Array.isArray(drill.successCriteria) ? drill.successCriteria.map(sc => t(sc)).join(', ') : t(drill.successCriteria)}
          </p>
        </div>
    </div>
  );
};
