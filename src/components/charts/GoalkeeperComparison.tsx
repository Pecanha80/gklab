import React, { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Cell,
} from 'recharts';
import { Users, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { Attendance, Goalkeeper, TrainingSession, WellnessLog } from '../../types';

const GK_COLORS = [
  '#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6',
  '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#14b8a6',
];

interface Props {
  goalkeepers: Goalkeeper[];
  sessions: TrainingSession[];
  allAttendance: Attendance[];
  allWellness: WellnessLog[];
  t: (key: string) => string;
}

function parseDuration(dur: unknown): number {
  if (!dur) return 0;
  const str = Array.isArray(dur) ? dur[0] : String(dur);
  const match = String(str).match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

export const GoalkeeperComparison: React.FC<Props> = ({
  goalkeepers, sessions, allAttendance, allWellness, t,
}) => {
  const [selectedGkIds, setSelectedGkIds] = useState<Set<string>>(
    new Set(goalkeepers.map(g => g.id))
  );

  const toggleGk = (id: string) => {
    setSelectedGkIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size > 1) next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => setSelectedGkIds(new Set(goalkeepers.map(g => g.id)));

  const filteredGks = goalkeepers.filter(g => selectedGkIds.has(g.id));

  // 1. Average RPE per goalkeeper
  const avgRpeData = useMemo(() => {
    return filteredGks.map((gk, i) => {
      const gkAtt = allAttendance.filter(a => a.goalkeeper_id === gk.id && a.rpe != null && a.rpe > 0);
      const avg = gkAtt.length > 0
        ? gkAtt.reduce((sum, a) => sum + a.rpe!, 0) / gkAtt.length
        : 0;
      return { name: gk.name, avg: Math.round(avg * 10) / 10, fill: GK_COLORS[i % GK_COLORS.length] };
    });
  }, [filteredGks, allAttendance]);

  // 2. Total load per goalkeeper
  const totalLoadData = useMemo(() => {
    return filteredGks.map((gk, i) => {
      let totalLoad = 0;
      sessions.forEach(session => {
        const att = allAttendance.find(a => a.session_id === session.id && a.goalkeeper_id === gk.id && a.rpe != null && a.rpe > 0);
        if (att) {
          totalLoad += att.rpe! * parseDuration(session.duration);
        }
      });
      return { name: gk.name, load: totalLoad, fill: GK_COLORS[i % GK_COLORS.length] };
    });
  }, [filteredGks, sessions, allAttendance]);

  // 3. Attendance per goalkeeper
  const attendanceData = useMemo(() => {
    const totalSessions = sessions.length;
    return filteredGks.map((gk, i) => {
      const gkAtt = allAttendance.filter(a => a.goalkeeper_id === gk.id);
      const present = gkAtt.filter(a => a.status === 'present').length;
      const late = gkAtt.filter(a => a.status === 'late').length;
      const absent = gkAtt.filter(a => a.status === 'absent').length;
      const justified = gkAtt.filter(a => a.status === 'justified').length;
      const attended = present + late;
      const missed = absent;
      const rate = totalSessions > 0 ? Math.round((attended / totalSessions) * 100) : 0;

      return {
        name: gk.name,
        [t('compPresent' as any)]: present,
        [t('compLate' as any)]: late,
        [t('compAbsent' as any)]: absent,
        [t('compJustified' as any)]: justified,
        attended,
        missed,
        justified,
        rate,
        total: totalSessions,
        color: GK_COLORS[i % GK_COLORS.length],
      };
    });
  }, [filteredGks, sessions, allAttendance, t]);

  // 4. RPE trend per goalkeeper over sessions (ordered by date)
  const rpeTrendData = useMemo(() => {
    const sortedSessions = [...sessions]
      .filter(s => s.date)
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''));

    return sortedSessions.map(session => {
      const point: Record<string, any> = {
        date: session.date,
        session: session.titles?.map(title => t(title as any)).join(' & ').substring(0, 20) || session.date,
      };
      filteredGks.forEach(gk => {
        const att = allAttendance.find(
          a => a.session_id === session.id && a.goalkeeper_id === gk.id && a.rpe != null && a.rpe > 0
        );
        point[gk.name] = att?.rpe || null;
      });
      return point;
    });
  }, [filteredGks, sessions, allAttendance, t]);

  // 5. Wellness radar per goalkeeper
  const wellnessRadarData = useMemo(() => {
    const dims = [
      { key: 'sleep', label: t('sleep' as any) },
      { key: 'stress', label: t('stress' as any) },
      { key: 'fatigue', label: t('fatigue' as any) },
      { key: 'soreness', label: t('soreness' as any) },
      { key: 'mood', label: t('moodLabel' as any) },
    ];

    return dims.map(dim => {
      const point: Record<string, any> = { dimension: dim.label };
      filteredGks.forEach(gk => {
        const logs = allWellness.filter(w => w.goalkeeper_id === gk.id);
        if (logs.length > 0) {
          const avg = logs.reduce((sum, l) => sum + (l[dim.key as keyof WellnessLog] as number || 0), 0) / logs.length;
          point[gk.name] = Math.round(avg * 10) / 10;
        } else {
          point[gk.name] = 0;
        }
      });
      return point;
    });
  }, [filteredGks, allWellness, t]);

  const hasAnyData = allAttendance.length > 0;
  const hasWellnessData = allWellness.length > 0;

  if (!hasAnyData) {
    return (
      <div className="bg-slate-50 rounded-2xl border border-dashed border-black/10 p-12 text-center shadow-md">
        <Users className="w-10 h-10 text-on-surface-variant/20 mx-auto mb-3" />
        <p className="text-on-surface-variant italic">{t('compNoData' as any)}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* GK Selector */}
      <div className="bg-slate-50 rounded-2xl border border-black/10 p-5 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
            {t('compSelectGk' as any)}
          </h4>
          <button
            onClick={selectAll}
            className="text-[10px] font-bold text-primary hover:underline"
          >
            {t('compAllGk' as any)}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {goalkeepers.map((gk, i) => {
            const selected = selectedGkIds.has(gk.id);
            return (
              <button
                key={gk.id}
                onClick={() => toggleGk(gk.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border",
                  selected
                    ? "text-white border-transparent shadow-sm"
                    : "text-on-surface-variant border-black/10 bg-surface hover:bg-surface-container-high"
                )}
                style={selected ? { backgroundColor: GK_COLORS[i % GK_COLORS.length] } : undefined}
              >
                {selected && <Check className="w-3 h-3" />}
                {gk.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chart 1: Average RPE */}
      <ChartSection title={t('compAvgRpe' as any)}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={avgRpeData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#0000000a" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 600 }} />
            <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: '1px solid #0000000d', fontSize: 12 }}
              formatter={(value: number) => [value.toFixed(1), 'RPE']}
            />
            <Bar dataKey="avg" radius={[8, 8, 0, 0]} maxBarSize={60}>
              {avgRpeData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartSection>

      {/* Chart 2: Total Load */}
      <ChartSection title={t('compTotalLoad' as any)}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={totalLoadData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#0000000a" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 600 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: '1px solid #0000000d', fontSize: 12 }}
              formatter={(value: number) => [`${value} A.U.`, t('totalLoad' as any)]}
            />
            <Bar dataKey="load" radius={[8, 8, 0, 0]} maxBarSize={60}>
              {totalLoadData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartSection>

      {/* Chart 3: Attendance */}
      <ChartSection title={t('compAttendance' as any)}>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={attendanceData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#0000000a" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 600 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #0000000d', fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11, fontWeight: 600 }} />
            <Bar dataKey={t('compPresent' as any)} stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} maxBarSize={50} />
            <Bar dataKey={t('compLate' as any)} stackId="a" fill="#f59e0b" />
            <Bar dataKey={t('compAbsent' as any)} stackId="a" fill="#ef4444" />
            <Bar dataKey={t('compJustified' as any)} stackId="a" fill="#6366f1" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>

        {/* Attendance detail cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mt-6">
          {attendanceData.map((gk, i) => (
            <div key={i} className="bg-white rounded-xl border border-black/10 p-4 space-y-2 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: GK_COLORS[i % GK_COLORS.length] }} />
                <span className="text-sm font-bold text-on-surface">{gk.name}</span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                <span className="text-on-surface-variant">{t('compSessionsAttended' as any)}</span>
                <span className="font-bold text-emerald-600 text-right">{gk.attended}</span>
                <span className="text-on-surface-variant">{t('compSessionsMissed' as any)}</span>
                <span className="font-bold text-error text-right">{gk.missed}</span>
                <span className="text-on-surface-variant">{t('compSessionsJustified' as any)}</span>
                <span className="font-bold text-indigo-500 text-right">{gk.justified}</span>
                <span className="text-on-surface-variant font-semibold">{t('compAttendanceRate' as any)}</span>
                <span className={cn(
                  "font-black text-right",
                  gk.rate >= 80 ? "text-emerald-600" : gk.rate >= 50 ? "text-amber-600" : "text-error"
                )}>{gk.rate}%</span>
              </div>
              {/* Mini bar */}
              <div className="flex gap-0.5 h-2 rounded-full overflow-hidden bg-on-surface/5 mt-1">
                {gk.attended > 0 && <div className="bg-emerald-500 h-full" style={{ width: `${(gk.attended / gk.total) * 100}%` }} />}
                {gk.missed > 0 && <div className="bg-error h-full" style={{ width: `${(gk.missed / gk.total) * 100}%` }} />}
                {gk.justified > 0 && <div className="bg-indigo-500 h-full" style={{ width: `${(gk.justified / gk.total) * 100}%` }} />}
              </div>
              <p className="text-[10px] text-on-surface-variant text-center">
                {gk.attended + gk.missed + gk.justified} / {gk.total} {t('sessions' as any).toLowerCase()}
              </p>
            </div>
          ))}
        </div>
      </ChartSection>

      {/* Chart 4: RPE Trend */}
      {rpeTrendData.length > 0 && (
        <ChartSection title={t('compRpeTrend' as any)}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={rpeTrendData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#0000000a" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #0000000d', fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11, fontWeight: 600 }} />
              {filteredGks.map((gk, i) => (
                <Line
                  key={gk.id}
                  type="monotone"
                  dataKey={gk.name}
                  stroke={GK_COLORS[i % GK_COLORS.length]}
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: GK_COLORS[i % GK_COLORS.length] }}
                  connectNulls={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </ChartSection>
      )}

      {/* Chart 5: Wellness Radar */}
      {hasWellnessData && (
        <ChartSection title={t('compWellnessRadar' as any)}>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={wellnessRadarData} cx="50%" cy="50%" outerRadius="75%">
              <PolarGrid stroke="#0000000a" />
              <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11, fontWeight: 600 }} />
              <PolarRadiusAxis domain={[0, 5]} tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #0000000d', fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11, fontWeight: 600 }} />
              {filteredGks.map((gk, i) => (
                <Radar
                  key={gk.id}
                  name={gk.name}
                  dataKey={gk.name}
                  stroke={GK_COLORS[i % GK_COLORS.length]}
                  fill={GK_COLORS[i % GK_COLORS.length]}
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              ))}
            </RadarChart>
          </ResponsiveContainer>
        </ChartSection>
      )}
    </div>
  );
};

const ChartSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="bg-slate-50 rounded-2xl border border-black/10 p-6 shadow-md">
    <h3 className="font-headline font-bold text-lg mb-6">{title}</h3>
    {children}
  </section>
);
