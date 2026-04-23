import React from 'react';
import { Ruler, Weight, Calendar, Shield, Users } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTranslation } from '../../hooks/useTranslation';
import type { Goalkeeper, Attendance, TrainingSession, WellnessLog } from '../../types';

interface AthleteOverviewProps {
  goalkeeper: Goalkeeper;
  onUpdate: (gk: Goalkeeper) => Promise<void>;
  wellnessLogs: WellnessLog[];
  attendance: Attendance[];
  sessions: TrainingSession[];
}

export const AthleteOverview: React.FC<AthleteOverviewProps> = ({ goalkeeper, wellnessLogs, attendance, sessions }) => {
  const { t } = useTranslation();

  const age = goalkeeper.birthDate
    ? Math.floor((Date.now() - new Date(goalkeeper.birthDate + 'T00:00:00').getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  const attendedSessions = attendance.filter(a => a.status === 'present' || a.status === 'late');
  const totalSessions = attendance.length;
  const attendanceRate = totalSessions > 0 ? Math.round((attendedSessions.length / totalSessions) * 100) : 0;

  const rpeValues = attendance.filter(a => a.rpe != null).map(a => a.rpe!);
  const avgRPE = rpeValues.length > 0 ? (rpeValues.reduce((a, b) => a + b, 0) / rpeValues.length).toFixed(1) : null;

  const recentWellness = wellnessLogs.length > 0 ? wellnessLogs[0] : null;

  const totalMinutes = attendedSessions.reduce((sum, att) => {
    const session = sessions.find(s => s.id === att.session_id);
    if (!session) return sum;
    const dur = typeof session.duration === 'string' ? parseInt(session.duration) || 0 : 0;
    return sum + dur;
  }, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Bio card */}
      <div className="bg-surface rounded-xl border border-black/[0.08] overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 bg-black/[0.02] border-b border-black/[0.06]">
          <div className="w-1 h-5 rounded-full bg-blue-500" />
          <span className="text-[10px] font-bold text-on-surface uppercase tracking-wider">{t('personalInfo') || 'Dados Pessoais'}</span>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-xl overflow-hidden border border-black/[0.08]">
              {goalkeeper.imageUrl ? (
                <img src={goalkeeper.imageUrl} alt={goalkeeper.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full bg-background flex items-center justify-center text-2xl font-bold text-on-surface-variant">
                  {goalkeeper.name.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-on-surface">{goalkeeper.name}</h3>
              <p className="text-sm text-on-surface-variant">{t(goalkeeper.category) || goalkeeper.category}</p>
              {goalkeeper.membership === 'trial' && (
                <span className="text-[9px] font-bold text-warning bg-warning/10 px-2 py-0.5 rounded mt-1 inline-block">TRIAL</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {age != null && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-on-surface-variant/50" />
                <span className="text-on-surface-variant">{age} {t('years') || 'anos'}</span>
              </div>
            )}
            {goalkeeper.height && (
              <div className="flex items-center gap-2 text-sm">
                <Ruler className="w-4 h-4 text-on-surface-variant/50" />
                <span className="text-on-surface-variant">{goalkeeper.height} cm</span>
              </div>
            )}
            {goalkeeper.weight && (
              <div className="flex items-center gap-2 text-sm">
                <Weight className="w-4 h-4 text-on-surface-variant/50" />
                <span className="text-on-surface-variant">{goalkeeper.weight} kg</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Shield className="w-4 h-4 text-on-surface-variant/50" />
              <span className={cn(
                "font-semibold",
                goalkeeper.status === 'Ready' ? "text-success" :
                goalkeeper.status === 'Injured' ? "text-error" : "text-warning"
              )}>
                {t(goalkeeper.status === 'Ready' ? 'ready' : goalkeeper.status === 'Injured' ? 'injured' : goalkeeper.status === 'Minor Strain' ? 'minorStrain' : 'inTraining')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics card */}
      <div className="bg-surface rounded-xl border border-black/[0.08] overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 bg-black/[0.02] border-b border-black/[0.06]">
          <div className="w-1 h-5 rounded-full bg-green-500" />
          <span className="text-[10px] font-bold text-on-surface uppercase tracking-wider">{t('currentMetrics') || 'Métricas Atuais'}</span>
        </div>
        <div className="p-5 space-y-4">
          {/* Form */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-on-surface-variant font-medium">{t('formLabel')}</span>
              <span className="font-bold text-on-surface">{goalkeeper.form}%</span>
            </div>
            <div className="h-2 bg-background rounded-full overflow-hidden">
              <div className={cn("h-full rounded-full transition-all", goalkeeper.form >= 70 ? "bg-success" : goalkeeper.form >= 40 ? "bg-warning" : "bg-error")} style={{ width: `${goalkeeper.form}%` }} />
            </div>
          </div>
          {/* Recovery */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-on-surface-variant font-medium">{t('recovery')}</span>
              <span className="font-bold text-on-surface">{goalkeeper.recovery}%</span>
            </div>
            <div className="h-2 bg-background rounded-full overflow-hidden">
              <div className={cn("h-full rounded-full transition-all", goalkeeper.recovery >= 70 ? "bg-success" : goalkeeper.recovery >= 40 ? "bg-warning" : "bg-error")} style={{ width: `${goalkeeper.recovery}%` }} />
            </div>
          </div>
          {/* Load */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-on-surface-variant font-medium">{t('load') || 'Carga'}</span>
              <span className="font-bold text-on-surface">{goalkeeper.load}%</span>
            </div>
            <div className="h-2 bg-background rounded-full overflow-hidden">
              <div className={cn("h-full rounded-full transition-all", goalkeeper.load <= 60 ? "bg-success" : goalkeeper.load <= 80 ? "bg-warning" : "bg-error")} style={{ width: `${goalkeeper.load}%` }} />
            </div>
          </div>
          {/* Wellness */}
          {recentWellness && (
            <div className="pt-2 border-t border-black/[0.06]">
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant font-medium">{t('lastWellness') || 'Último Bem-estar'}</span>
                <span className={cn("font-bold", recentWellness.score >= 3.5 ? "text-success" : recentWellness.score >= 2.5 ? "text-warning" : "text-error")}>
                  {recentWellness.score.toFixed(1)}/5
                </span>
              </div>
              <p className="text-[10px] text-on-surface-variant mt-0.5">{recentWellness.date}</p>
            </div>
          )}
        </div>
      </div>

      {/* Stats card */}
      <div className="bg-surface rounded-xl border border-black/[0.08] overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 bg-black/[0.02] border-b border-black/[0.06]">
          <div className="w-1 h-5 rounded-full bg-purple-500" />
          <span className="text-[10px] font-bold text-on-surface uppercase tracking-wider">{t('trainingStats') || 'Estatísticas de Treino'}</span>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-background rounded-lg">
              <p className="text-2xl font-bold text-on-surface">{attendedSessions.length}</p>
              <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">{t('sessionsAttended') || 'Sessões Presentes'}</p>
            </div>
            <div className="text-center p-3 bg-background rounded-lg">
              <p className="text-2xl font-bold text-on-surface">{attendanceRate}%</p>
              <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">{t('attendanceRate') || 'Taxa Presença'}</p>
            </div>
            <div className="text-center p-3 bg-background rounded-lg">
              <p className="text-2xl font-bold text-on-surface">{totalMinutes}</p>
              <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">{t('totalMinutes') || 'Minutos Totais'}</p>
            </div>
            <div className="text-center p-3 bg-background rounded-lg">
              <p className="text-2xl font-bold text-on-surface">{avgRPE || '—'}</p>
              <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">{t('avgRPE') || 'PSE Média'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
