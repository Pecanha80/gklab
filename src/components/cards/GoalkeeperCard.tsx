import { cn } from '../../lib/utils';
import { Goalkeeper } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';

export const GoalkeeperCard = ({ keeper }: { keeper: Goalkeeper }) => {
  const { t } = useTranslation();

  const categoryLabels: Record<string, string> = {
    'First Team': t('firstTeam'),
    'U23': t('u23'),
    'U18': t('u18'),
  };

  const statusLabels: Record<string, string> = {
    'Ready': t('ready'),
    'Minor Strain': t('minorStrain'),
    'In Training': t('inTraining'),
    'Injured': t('injured'),
  };

  return (
    <div className="bg-surface-container p-4 rounded-xl flex items-center gap-4 group hover:bg-surface-container-high transition-all cursor-pointer border border-transparent hover:border-black/5">
      <div className="relative">
        <img
          src={keeper.imageUrl}
          alt={keeper.name}
          className="w-12 h-12 rounded-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300"
          referrerPolicy="no-referrer"
        />
        <div className={cn(
          "absolute bottom-0 right-0 w-3 h-3 border-2 border-surface-container rounded-full",
          keeper.status === 'Ready' ? "bg-tertiary" :
          keeper.status === 'Minor Strain' ? "bg-error" : "bg-primary"
        )} />
      </div>
      <div className="flex-1">
        <h4 className="font-bold text-sm text-on-surface">{keeper.name}</h4>
        <p className="text-[11px] text-on-surface-variant font-label">{categoryLabels[keeper.category] || keeper.category} • {statusLabels[keeper.status] || keeper.status}</p>
      </div>
      <div className="text-right">
        <p className={cn(
          "text-xs font-bold",
          keeper.status === 'Ready' ? "text-tertiary" :
          keeper.status === 'Minor Strain' ? "text-error" : "text-secondary"
        )}>{keeper.status === 'Minor Strain' ? keeper.recovery : keeper.form}%</p>
        <p className="text-[9px] text-on-surface-variant font-label">
          {keeper.status === 'Minor Strain' ? t('recovery') : t('formLabel')}
        </p>
      </div>
    </div>
  );
};
