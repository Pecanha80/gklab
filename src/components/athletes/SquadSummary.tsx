import React from 'react';
import { CheckCircle2, AlertTriangle, Activity, Heart } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTranslation } from '../../hooks/useTranslation';
import type { Goalkeeper } from '../../types';

interface SquadSummaryProps {
  goalkeepers: Goalkeeper[];
}

export const SquadSummary: React.FC<SquadSummaryProps> = ({ goalkeepers }) => {
  const { t } = useTranslation();

  const ready = goalkeepers.filter(g => g.status === 'Ready').length;
  const injured = goalkeepers.filter(g => g.status === 'Injured').length;
  const strain = goalkeepers.filter(g => g.status === 'Minor Strain').length;
  const training = goalkeepers.filter(g => g.status === 'In Training').length;
  const avgForm = goalkeepers.length > 0 ? Math.round(goalkeepers.reduce((s, g) => s + g.form, 0) / goalkeepers.length) : 0;
  const avgRecovery = goalkeepers.length > 0 ? Math.round(goalkeepers.reduce((s, g) => s + g.recovery, 0) / goalkeepers.length) : 0;

  const stats = [
    { label: t('ready') || 'Prontos', value: ready, total: goalkeepers.length, icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10' },
    { label: t('injured') || 'Lesionados', value: injured + strain, total: goalkeepers.length, icon: AlertTriangle, color: 'text-error', bg: 'bg-error/10' },
    { label: t('avgForm') || 'Forma Média', value: `${avgForm}%`, total: null, icon: Activity, color: 'text-accent', bg: 'bg-accent/10' },
    { label: t('avgRecovery') || 'Recuperação', value: `${avgRecovery}%`, total: null, icon: Heart, color: 'text-pink-500', bg: 'bg-pink-500/10' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map(stat => (
        <div key={stat.label} className="bg-surface rounded-xl border border-black/[0.08] p-4 flex items-center gap-3">
          <div className={cn("p-2 rounded-lg", stat.bg)}>
            <stat.icon className={cn("w-5 h-5", stat.color)} />
          </div>
          <div>
            <p className="text-xl font-bold text-on-surface">
              {stat.value}
              {stat.total != null && <span className="text-sm text-on-surface-variant font-normal">/{stat.total}</span>}
            </p>
            <p className="text-[10px] text-on-surface-variant font-medium">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
