import React, { useState } from 'react';
import { Ruler, Weight, Phone, Mail, UserCheck, Building2, Calendar, Hand, Hash, Info } from 'lucide-react';
import { cn, getLoadZone } from '../../lib/utils';
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
  const [showLoadInfo, setShowLoadInfo] = useState(false);

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

  // Load context: sessions in last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentSessionIds = sessions
    .filter(s => new Date(s.date) >= sevenDaysAgo)
    .map(s => s.id);
  const sessionsThisWeek = attendance.filter(
    a => recentSessionIds.includes(a.session_id) && (a.status === 'present' || a.status === 'late')
  ).length;

  const loadZone = getLoadZone(goalkeeper.load);
  const loadZoneLabel = loadZone === 'low' ? t('loadZoneLow') : loadZone === 'optimal' ? t('loadZoneOptimal') : t('loadZoneHigh');
  const loadZoneColor = loadZone === 'low' ? 'text-blue-500' : loadZone === 'optimal' ? 'text-success' : 'text-error';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Physical Profile + Contact card (no redundancies with header) */}
      <div className="bg-surface rounded-xl border border-black/[0.08] overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 bg-black/[0.02] border-b border-black/[0.06]">
          <div className="w-1 h-5 rounded-full bg-blue-500" />
          <span className="text-[10px] font-bold text-on-surface uppercase tracking-wider">{t('physicalProfile')}</span>
        </div>
        <div className="p-5 space-y-4">
          {/* Physical Measurements - prominent */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-background rounded-lg">
              <p className="text-xl font-bold text-on-surface">{goalkeeper.height || '—'}</p>
              <p className="text-[9px] text-on-surface-variant font-bold uppercase tracking-wider mt-0.5">{t('height') || 'Altura'} (cm)</p>
            </div>
            <div className="text-center p-3 bg-background rounded-lg">
              <p className="text-xl font-bold text-on-surface">{goalkeeper.wingspan || '—'}</p>
              <p className="text-[9px] text-on-surface-variant font-bold uppercase tracking-wider mt-0.5">{t('wingspan') || 'Enverg.'} (cm)</p>
            </div>
            <div className="text-center p-3 bg-background rounded-lg">
              <p className="text-xl font-bold text-on-surface">{goalkeeper.weight || '—'}</p>
              <p className="text-[9px] text-on-surface-variant font-bold uppercase tracking-wider mt-0.5">{t('weight') || 'Peso'} (kg)</p>
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-3">
            {goalkeeper.jerseyNumber != null && (
              <div className="flex items-center gap-2 text-sm">
                <Hash className="w-4 h-4 text-on-surface-variant/50" />
                <span className="text-on-surface-variant">#{goalkeeper.jerseyNumber}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-[10px] text-on-surface-variant">{t(goalkeeper.category) || goalkeeper.category}</span>
            </div>
            {goalkeeper.preferredFoot && (
              <div className="flex items-center gap-2 text-sm">
                <Hand className="w-4 h-4 text-on-surface-variant/50" />
                <span className="text-on-surface-variant">
                  {t('preferredFoot')}: {t(goalkeeper.preferredFoot === 'left' ? 'leftFoot' : goalkeeper.preferredFoot === 'right' ? 'rightFoot' : 'bothFeet')}
                </span>
              </div>
            )}
            {goalkeeper.dominantHand && (
              <div className="flex items-center gap-2 text-sm">
                <Hand className="w-4 h-4 text-on-surface-variant/50" />
                <span className="text-on-surface-variant">
                  {t('dominantHand')}: {t(goalkeeper.dominantHand === 'left' ? 'leftHand' : 'rightHand')}
                </span>
              </div>
            )}
            {goalkeeper.membership === 'trial' && (
              <span className="text-[9px] font-bold text-warning bg-warning/10 px-2 py-0.5 rounded inline-block">TRIAL</span>
            )}
          </div>

          {/* Contact Info */}
          {(goalkeeper.phone || goalkeeper.email) && (
            <div className="pt-3 border-t border-black/[0.06] space-y-2">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">{t('contactInfo')}</p>
              {goalkeeper.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-on-surface-variant/50" />
                  <span className="text-on-surface-variant">{goalkeeper.phone}</span>
                </div>
              )}
              {goalkeeper.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-on-surface-variant/50" />
                  <span className="text-on-surface-variant">{goalkeeper.email}</span>
                </div>
              )}
            </div>
          )}

          {/* Guardian Info */}
          {(goalkeeper.guardianName || goalkeeper.guardianPhone) && (
            <div className="pt-3 border-t border-black/[0.06] space-y-2">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">{t('guardianName')}</p>
              {goalkeeper.guardianName && (
                <div className="flex items-center gap-2 text-sm">
                  <UserCheck className="w-4 h-4 text-on-surface-variant/50" />
                  <span className="text-on-surface-variant">{goalkeeper.guardianName}</span>
                </div>
              )}
              {goalkeeper.guardianPhone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-on-surface-variant/50" />
                  <span className="text-on-surface-variant">{goalkeeper.guardianPhone}</span>
                </div>
              )}
            </div>
          )}

          {/* Club & Registration */}
          {(goalkeeper.clubAffiliation || goalkeeper.registrationDate) && (
            <div className="pt-3 border-t border-black/[0.06] space-y-2">
              {goalkeeper.clubAffiliation && (
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="w-4 h-4 text-on-surface-variant/50" />
                  <span className="text-on-surface-variant">{goalkeeper.clubAffiliation}</span>
                </div>
              )}
              {goalkeeper.registrationDate && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-on-surface-variant/50" />
                  <span className="text-on-surface-variant">{t('registrationDate')}: {new Date(goalkeeper.registrationDate).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          )}
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
          {/* Load with tooltip */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <div className="flex items-center gap-1.5">
                <span className="text-on-surface-variant font-medium">{t('loadLabel') || 'Carga'}</span>
                <button
                  onClick={() => setShowLoadInfo(!showLoadInfo)}
                  className="text-on-surface-variant/40 hover:text-on-surface-variant transition-colors"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className="font-bold text-on-surface">{goalkeeper.load}%</span>
            </div>
            <div className="h-2 bg-background rounded-full overflow-hidden">
              <div className={cn("h-full rounded-full transition-all", goalkeeper.load <= 60 ? "bg-success" : goalkeeper.load <= 80 ? "bg-warning" : "bg-error")} style={{ width: `${goalkeeper.load}%` }} />
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className={cn("text-[9px] font-bold uppercase tracking-wider", loadZoneColor)}>{loadZoneLabel}</span>
            </div>
            {showLoadInfo && (
              <div className="mt-2 p-3 bg-background rounded-lg text-xs space-y-1.5 border border-black/[0.06]">
                <p className="text-on-surface-variant">
                  <span className="font-bold">{sessionsThisWeek}</span> {t('loadContextSessions')}
                </p>
                <p className="text-on-surface-variant/70 text-[10px]">{t('loadContextFormula')}</p>
                <div className="flex gap-3 pt-1 border-t border-black/[0.04]">
                  <span className="text-[9px] text-blue-500 font-semibold">{'< 40%'} {t('loadZoneLow')}</span>
                  <span className="text-[9px] text-success font-semibold">40-70% {t('loadZoneOptimal')}</span>
                  <span className="text-[9px] text-error font-semibold">{'> 70%'} {t('loadZoneHigh')}</span>
                </div>
              </div>
            )}
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
