import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { cn } from '../../lib/utils';
import { useTranslation } from '../../hooks/useTranslation';
import { parseDate, toDateString } from '../../lib/utils';
import type { Goalkeeper, Attendance, TrainingSession } from '../../types';

interface AthleteLoadProps {
  goalkeeper: Goalkeeper;
  attendance: Attendance[];
  sessions: TrainingSession[];
}

export const AthleteLoad: React.FC<AthleteLoadProps> = ({ goalkeeper, attendance, sessions }) => {
  const { t } = useTranslation();

  // Calculate daily loads (RPE × duration) for the last 28 days
  const dailyLoads = useMemo(() => {
    const today = new Date();
    const days: { date: string; load: number; rpe: number; duration: number }[] = [];

    for (let i = 27; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = toDateString(d);

      // Find attendance records for this date
      const dayAttendance = attendance.filter(a => {
        const session = sessions.find(s => s.id === a.session_id);
        return session?.date === dateStr && (a.status === 'present' || a.status === 'late');
      });

      let dayLoad = 0;
      let dayRpe = 0;
      let dayDuration = 0;

      dayAttendance.forEach(a => {
        const session = sessions.find(s => s.id === a.session_id);
        if (session && a.rpe) {
          const dur = typeof session.duration === 'string' ? parseInt(session.duration) || 0 : 0;
          dayLoad += a.rpe * dur;
          dayRpe = a.rpe;
          dayDuration += dur;
        }
      });

      days.push({ date: dateStr, load: dayLoad, rpe: dayRpe, duration: dayDuration });
    }

    return days;
  }, [attendance, sessions]);

  // ACWR calculation
  const acwr = useMemo(() => {
    const acute = dailyLoads.slice(-7).reduce((sum, d) => sum + d.load, 0);
    const chronic = dailyLoads.reduce((sum, d) => sum + d.load, 0) / 4; // 28-day average weekly
    const ratio = chronic > 0 ? acute / chronic : 0;
    return { acute, chronic: Math.round(chronic), ratio: parseFloat(ratio.toFixed(2)) };
  }, [dailyLoads]);

  // Weekly aggregation for chart
  const weeklyData = useMemo(() => {
    const weeks: { week: string; load: number; sessions: number }[] = [];
    for (let w = 0; w < 4; w++) {
      const start = w * 7;
      const end = start + 7;
      const weekDays = dailyLoads.slice(start, end);
      const totalLoad = weekDays.reduce((sum, d) => sum + d.load, 0);
      const sessionCount = weekDays.filter(d => d.load > 0).length;
      const startDate = weekDays[0]?.date.slice(5) || '';
      weeks.push({ week: `S${w + 1} (${startDate})`, load: totalLoad, sessions: sessionCount });
    }
    return weeks;
  }, [dailyLoads]);

  // RPE distribution
  const rpeDistribution = useMemo(() => {
    const dist: Record<number, number> = {};
    attendance.forEach(a => {
      if (a.rpe && (a.status === 'present' || a.status === 'late')) {
        dist[a.rpe] = (dist[a.rpe] || 0) + 1;
      }
    });
    return Array.from({ length: 10 }, (_, i) => ({
      rpe: i + 1,
      count: dist[i + 1] || 0,
    }));
  }, [attendance]);

  const acwrColor = acwr.ratio >= 0.8 && acwr.ratio <= 1.3 ? 'text-success' : acwr.ratio > 1.5 ? 'text-error' : 'text-warning';
  const acwrZone = acwr.ratio >= 0.8 && acwr.ratio <= 1.3 ? (t('optimalZone') || 'Zona Ótima') :
    acwr.ratio > 1.5 ? (t('dangerZone') || 'Zona de Risco') :
    acwr.ratio < 0.8 ? (t('undertraining') || 'Sub-treino') : (t('elevatedZone') || 'Zona Elevada');

  return (
    <div className="space-y-5">
      {/* ACWR Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface rounded-xl border border-black/[0.08] p-5 text-center">
          <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">{t('acuteLoad') || 'Carga Aguda (7d)'}</p>
          <p className="text-3xl font-bold text-on-surface mt-2">{acwr.acute}</p>
          <p className="text-[10px] text-on-surface-variant mt-1">U.A.</p>
        </div>
        <div className="bg-surface rounded-xl border border-black/[0.08] p-5 text-center">
          <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">{t('chronicLoad') || 'Carga Crónica (28d)'}</p>
          <p className="text-3xl font-bold text-on-surface mt-2">{acwr.chronic}</p>
          <p className="text-[10px] text-on-surface-variant mt-1">U.A./sem</p>
        </div>
        <div className="bg-surface rounded-xl border border-black/[0.08] p-5 text-center">
          <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">ACWR</p>
          <p className={cn("text-3xl font-bold mt-2", acwrColor)}>{acwr.ratio}</p>
          <p className={cn("text-[10px] font-semibold mt-1", acwrColor)}>{acwrZone}</p>
        </div>
      </div>

      {/* Weekly Load Chart */}
      <div className="bg-surface rounded-xl border border-black/[0.08] overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 bg-black/[0.02] border-b border-black/[0.06]">
          <div className="w-1 h-5 rounded-full bg-blue-500" />
          <span className="text-[10px] font-bold text-on-surface uppercase tracking-wider">{t('weeklyLoadDistribution') || 'Distribuição de Carga Semanal'}</span>
        </div>
        <div className="p-5">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis dataKey="week" tick={{ fontSize: 10 }} stroke="rgba(0,0,0,0.3)" />
              <YAxis tick={{ fontSize: 10 }} stroke="rgba(0,0,0,0.3)" />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid rgba(0,0,0,0.1)' }} />
              <Bar dataKey="load" name={t('load') || 'Carga'} fill="#4338ca" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* RPE Distribution */}
      <div className="bg-surface rounded-xl border border-black/[0.08] overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 bg-black/[0.02] border-b border-black/[0.06]">
          <div className="w-1 h-5 rounded-full bg-orange-500" />
          <span className="text-[10px] font-bold text-on-surface uppercase tracking-wider">{t('rpeDistribution') || 'Distribuição PSE'}</span>
        </div>
        <div className="p-5">
          {rpeDistribution.some(r => r.count > 0) ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={rpeDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="rpe" tick={{ fontSize: 10 }} stroke="rgba(0,0,0,0.3)" />
                <YAxis tick={{ fontSize: 10 }} stroke="rgba(0,0,0,0.3)" allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid rgba(0,0,0,0.1)' }} />
                <Bar dataKey="count" name={t('frequency') || 'Frequência'} fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8 text-on-surface-variant">
              <p className="text-sm">{t('noRPEData') || 'Sem dados de PSE registados'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
