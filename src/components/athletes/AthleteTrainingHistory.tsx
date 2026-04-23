import React, { useMemo, useState } from 'react';
import { Calendar, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { cn, parseDate } from '../../lib/utils';
import { useTranslation } from '../../hooks/useTranslation';
import { parseCategory } from '../../lib/dashboard';
import type { Goalkeeper, Attendance, TrainingSession } from '../../types';

interface AthleteTrainingHistoryProps {
  goalkeeper: Goalkeeper;
  attendance: Attendance[];
  sessions: TrainingSession[];
}

export const AthleteTrainingHistory: React.FC<AthleteTrainingHistoryProps> = ({ goalkeeper, attendance, sessions }) => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<'all' | 'present' | 'absent'>('all');

  // Build history: merge attendance with session data
  const history = useMemo(() => {
    return attendance
      .map(att => {
        const session = sessions.find(s => s.id === att.session_id);
        if (!session) return null;
        return {
          id: att.id,
          date: session.date,
          title: (session.titles || []).map(t_ => t(t_)).join(' + ') || '—',
          categories: parseCategory(session.category).map(c => t(c)).join(', '),
          duration: typeof session.duration === 'string' ? session.duration : Array.isArray(session.duration) ? session.duration[0] : '',
          status: att.status,
          rpe: att.rpe,
          notes: att.notes,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b!.date.localeCompare(a!.date)) as {
        id: string; date: string; title: string; categories: string;
        duration: string; status: string; rpe?: number; notes?: string;
      }[];
  }, [attendance, sessions, t]);

  const filtered = filter === 'all' ? history :
    filter === 'present' ? history.filter(h => h.status === 'present' || h.status === 'late') :
    history.filter(h => h.status === 'absent' || h.status === 'justified');

  const statusIcon = (status: string) => {
    switch (status) {
      case 'present': return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'late': return <AlertCircle className="w-4 h-4 text-warning" />;
      case 'absent': return <XCircle className="w-4 h-4 text-error" />;
      case 'justified': return <AlertCircle className="w-4 h-4 text-on-surface-variant" />;
      default: return null;
    }
  };

  const statusLabel = (status: string) => {
    const labels: Record<string, string> = {
      present: t('present') || 'Presente',
      late: t('late') || 'Atrasado',
      absent: t('absent') || 'Ausente',
      justified: t('justified') || 'Justificado',
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-5">
      {/* Filter tabs */}
      <div className="flex items-center gap-2">
        {(['all', 'present', 'absent'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-semibold transition-all",
              filter === f
                ? "bg-accent text-white"
                : "bg-background border border-black/[0.08] text-on-surface-variant hover:border-black/[0.15]"
            )}
          >
            {f === 'all' ? (t('all') || 'Todos') : f === 'present' ? (t('present') || 'Presentes') : (t('absent') || 'Ausentes')}
            <span className="ml-1.5 text-[10px] opacity-70">
              ({f === 'all' ? history.length : f === 'present' ? history.filter(h => h.status === 'present' || h.status === 'late').length : history.filter(h => h.status === 'absent' || h.status === 'justified').length})
            </span>
          </button>
        ))}
      </div>

      {/* History table */}
      <div className="bg-surface rounded-xl border border-black/[0.08] overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 bg-black/[0.02] border-b border-black/[0.06]">
          <div className="w-1 h-5 rounded-full bg-cyan-500" />
          <span className="text-[10px] font-bold text-on-surface uppercase tracking-wider">{t('sessionLog') || 'Registo de Sessões'} ({filtered.length})</span>
        </div>

        {filtered.length > 0 ? (
          <div className="divide-y divide-black/[0.04]">
            {filtered.map(entry => (
              <div key={entry.id} className="px-5 py-3 flex items-center gap-4 hover:bg-black/[0.01] transition-colors">
                {/* Status icon */}
                <div className="shrink-0">{statusIcon(entry.status)}</div>

                {/* Date */}
                <div className="w-24 shrink-0">
                  <p className="text-sm font-semibold text-on-surface">
                    {parseDate(entry.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                  </p>
                </div>

                {/* Session info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-on-surface truncate">{entry.title}</p>
                  <p className="text-[10px] text-on-surface-variant">{entry.categories}</p>
                </div>

                {/* Duration */}
                <div className="flex items-center gap-1 shrink-0">
                  <Clock className="w-3.5 h-3.5 text-on-surface-variant/50" />
                  <span className="text-xs text-on-surface-variant">{entry.duration}</span>
                </div>

                {/* RPE */}
                {entry.rpe != null && (
                  <div className={cn(
                    "text-xs font-bold px-2 py-0.5 rounded shrink-0",
                    entry.rpe >= 8 ? "bg-error/10 text-error" :
                    entry.rpe >= 6 ? "bg-warning/10 text-warning" :
                    "bg-success/10 text-success"
                  )}>
                    PSE {entry.rpe}
                  </div>
                )}

                {/* Status label */}
                <span className={cn(
                  "text-[10px] font-semibold shrink-0",
                  entry.status === 'present' ? "text-success" :
                  entry.status === 'late' ? "text-warning" :
                  "text-error"
                )}>
                  {statusLabel(entry.status)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-on-surface-variant">
            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">{t('noTrainingHistory') || 'Sem histórico de treino'}</p>
          </div>
        )}
      </div>
    </div>
  );
};
