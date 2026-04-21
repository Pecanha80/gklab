import { cn, CATEGORY_LABEL_KEYS, STATUS_LABEL_KEYS } from '../../lib/utils';
import { Goalkeeper } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';

export const GoalkeeperCard = ({ keeper }: { keeper: Goalkeeper }) => {
  const { t } = useTranslation();

  const categoryLabel = CATEGORY_LABEL_KEYS[keeper.category]
    ? t(CATEGORY_LABEL_KEYS[keeper.category] as any)
    : keeper.category;
  const statusLabel = STATUS_LABEL_KEYS[keeper.status]
    ? t(STATUS_LABEL_KEYS[keeper.status] as any)
    : keeper.status;

  return (
    <div className="glass-card p-5 rounded-3xl flex items-center gap-6 group hover:scale-[1.02] transition-all cursor-pointer border border-primary/50 hover:border-primary w-full max-w-[320px] ml-auto">
      <div className="relative">
        <div className="w-14 h-14 rounded-2xl overflow-hidden ring-2 ring-white/5 shadow-xl">
          <img
            src={keeper.imageUrl}
            alt={keeper.name}
            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className={cn(
          "absolute -bottom-1 -right-1 w-4 h-4 border-2 border-surface rounded-full shadow-lg",
          keeper.status === 'Ready' ? "bg-tertiary" :
          keeper.status === 'Minor Strain' ? "bg-error" : "bg-primary"
        )} />
      </div>
      
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-sm text-on-surface truncate tracking-tight">{keeper.name}</h4>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">{categoryLabel}</span>
          <span className="w-1 h-1 rounded-full bg-on-surface-variant/20" />
          <span className="text-[10px] font-bold text-on-surface-variant">{statusLabel}</span>
        </div>
      </div>
      
      <div className="text-right">
        <p className={cn(
          "text-sm font-black tracking-tight",
          keeper.status === 'Ready' ? "text-tertiary" :
          keeper.status === 'Minor Strain' ? "text-error" : "text-secondary"
        )}>{keeper.status === 'Minor Strain' ? keeper.recovery : keeper.form}%</p>
        <p className="text-[8px] font-black uppercase tracking-widest text-on-surface-variant/40 mt-0.5">
          {keeper.status === 'Minor Strain' ? t('recovery') : t('formLabel')}
        </p>
      </div>
    </div>
  );
};
