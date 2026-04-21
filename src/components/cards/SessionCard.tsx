import React from 'react';
import { motion } from 'motion/react';
import { Calendar, Clock, Users, Download, Edit3, Trash2, ChevronRight } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { handleExportSession } from '../../lib/exportSession';
import { parseDate } from '../../lib/utils';
import type { TrainingSession, Goalkeeper } from '../../types';

interface SessionCardProps {
  session: TrainingSession;
  index: number;
  goalkeepers: Goalkeeper[];
  onView: (session: TrainingSession) => void;
  onEdit: (session: TrainingSession) => void;
  onDelete: (id: string) => void;
}

export const SessionCard = React.memo(function SessionCard({
  session,
  index,
  goalkeepers,
  onView,
  onEdit,
  onDelete,
}: SessionCardProps) {
  const { t } = useTranslation();

  return (
    <motion.div
      transition={{ delay: index * 0.05 }}
      key={session.id}
      layoutId={session.id}
      className="glass-card group flex flex-col rounded-2xl border border-white/[0.06] hover:border-accent/30 transition-all duration-300 overflow-hidden"
    >
      <div className="p-5 space-y-4">
        <div className="flex justify-between items-start">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-accent/60" />
              <span className="text-[10px] font-semibold text-on-surface-variant">
                {parseDate(session.date).toLocaleDateString(t('locale'))}
              </span>
            </div>
            <h4 className="text-base font-bold text-on-surface leading-tight">
              {Array.isArray(session.titles) ? session.titles.map(t_ => t(t_)).join(' + ') : t(session.titles)}
            </h4>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => handleExportSession(session.id)}
              className="p-2 hover:bg-accent/10 text-on-surface-variant hover:text-accent rounded-lg transition-colors"
              title={t('exportPdf')}
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => onEdit(session)}
              className="p-2 hover:bg-accent/10 text-on-surface-variant hover:text-accent rounded-lg transition-colors"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(session.id)}
              className="p-2 hover:bg-error/10 text-on-surface-variant hover:text-error rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <span className="px-2 py-0.5 bg-accent/10 text-accent text-[9px] font-bold uppercase rounded tracking-wider">
            {Array.isArray(session.category) ? session.category.map(c => t(c)).join(', ') : t(session.category)}
          </span>
          <span className="px-2 py-0.5 bg-white/[0.04] text-on-surface-variant text-[9px] font-bold uppercase rounded tracking-wider">
            {session.duration}
          </span>
        </div>

        <div className="flex items-center gap-3 text-[10px] text-on-surface-variant font-medium">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-accent/50" />
            {session.warmup.length + session.exercises.length} {t('exercises')}
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-accent/50" />
            {session.attending?.length || 0} {t('goalkeepers')}
          </div>
        </div>

        <button
          onClick={() => onView(session)}
          className="w-full mt-1 py-2.5 bg-white/[0.03] hover:bg-accent/10 hover:text-accent text-on-surface-variant font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 border border-white/[0.04]"
        >
          {t('viewDetails')} <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </motion.div>
  );
});
