import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Heart, Moon, Brain, Zap, Frown, Activity, TrendingUp, AlertTriangle, ChevronRight, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTranslation } from '../../hooks/useTranslation';
import { useWellness } from '../../hooks/useWellness';
import { useAppData } from '../../hooks/useAppData';
import { computeWellnessStats, getLatestLog, getScoreBorderColor, filterLogsByPeriod } from '../../lib/wellness';
import type { Goalkeeper, WellnessLog } from '../../types';

type Period = 7 | 14 | 30;

export const WellnessTab: React.FC = () => {
  const { t } = useTranslation();
  const { goalkeepers } = useAppData();
  const { logs: allLogs, loading, fetchLogs } = useWellness();
  const [period, setPeriod] = useState<Period>(7);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filteredLogs = useMemo(() => filterLogsByPeriod(allLogs, period), [allLogs, period]);
  const stats = useMemo(() => computeWellnessStats(filteredLogs), [filteredLogs]);

  if (!goalkeepers.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-on-surface/5 flex items-center justify-center">
          <Heart className="w-10 h-10 text-on-surface-variant opacity-20" />
        </div>
        <h3 className="text-xl font-bold">{t('wellnessTab')}</h3>
        <p className="text-on-surface-variant max-w-md">
          {t('wellnessNoGoalkeepers')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header & Quick Stats */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black font-headline tracking-tight text-on-surface">
            {t('wellnessTab')}
          </h2>
          <p className="text-on-surface-variant font-label mt-1">
            {t('monitoring')} — {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <StatCard
            label={t('averageWellness')}
            value={stats.avgScore.toFixed(1)}
            subValue="/ 5.0"
            icon={Heart}
            color="text-emerald-500"
            bg="bg-emerald-500/10"
          />
          <StatCard
            label={t('overallRecovery')}
            value={`${stats.readinessPercent}%`}
            icon={TrendingUp}
            color="text-primary"
            bg="bg-primary/10"
          />
          <StatCard
            label={t('lowRecoveryAlert')}
            value={stats.alertCount.toString()}
            icon={AlertTriangle}
            color="text-amber-500"
            bg="bg-amber-500/10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Chart Area */}
        <div className="lg:col-span-8 space-y-6">
          <section className="bg-surface rounded-2xl border border-white/[0.04] p-6 shadow-sm overflow-hidden relative">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-headline font-bold text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                {t('recoveryTrend')}
              </h3>
              <div className="flex gap-2">
                {([7, 14, 30] as Period[]).map(p => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold transition-all",
                      p === period ? "bg-primary text-on-primary" : "bg-white/[0.03] text-on-surface-variant hover:bg-white/[0.04]"
                    )}
                  >
                    {p}D
                  </button>
                ))}
              </div>
            </div>

            {filteredLogs.length > 0 ? (
              <RecoveryChart logs={filteredLogs} />
            ) : (
              <div className="h-64 w-full flex items-center justify-center border-2 border-dashed border-white/[0.04] rounded-xl">
                <p className="text-on-surface-variant text-sm font-medium">{t('insufficientData')}</p>
              </div>
            )}
          </section>

          {/* Individual Breakdowns */}
          <section className="space-y-4">
            <h3 className="font-headline font-bold text-lg px-2">{t('athletes')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {goalkeepers.map(gk => (
                <AthleteWellnessCard key={gk.id} goalkeeper={gk} allLogs={allLogs} />
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar / Secondary Info */}
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-surface rounded-2xl border border-white/[0.04] p-6 shadow-sm">
            <h3 className="font-headline font-bold text-lg mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-secondary" />
              {t('wellnessHistory')}
            </h3>
            <div className="space-y-4">
              {allLogs.slice(0, 5).map((log) => {
                const gk = goalkeepers.find(k => k.id === log.goalkeeper_id);
                return (
                  <div key={log.id} className="flex gap-4 p-3 rounded-xl hover:bg-white/[0.03] transition-colors group cursor-pointer border border-transparent hover:border-white/[0.04]">
                    <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center font-bold text-primary group-hover:scale-110 transition-transform shadow-sm">
                      {log.score}/5
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{gk?.name || t('athlete')}</p>
                      <p className="text-[10px] text-on-surface-variant uppercase font-medium">
                        {new Date(log.date).toLocaleDateString()}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-on-surface-variant self-center" />
                  </div>
                );
              })}
              {allLogs.length === 0 && (
                <p className="text-center py-8 text-xs text-on-surface-variant italic">
                  {t('wellnessNoRecords')}
                </p>
              )}
            </div>
            {allLogs.length > 5 && (
              <button className="w-full mt-6 py-3 rounded-xl border border-white/[0.04] text-xs font-bold uppercase tracking-widest text-on-surface-variant hover:bg-white/[0.03] transition-all">
                {t('viewAll')}
              </button>
            )}
          </section>

          <div className="bg-primary/10 rounded-2xl p-6 border border-white/[0.06] relative overflow-hidden">
            <Heart className="absolute -bottom-6 -right-6 w-32 h-32 text-primary opacity-5 transform rotate-12" />
            <h4 className="text-primary font-bold mb-2 flex items-center gap-2 italic">
              <Zap className="w-4 h-4" />
              {t('wellnessDailyFact')}
            </h4>
            <p className="text-sm text-on-surface leading-loose italic">
              {t('wellnessDailyFactText')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ label: string, value: string, subValue?: string, icon: any, color: string, bg: string, trend?: string }> = ({ label, value, subValue, icon: Icon, color, bg, trend }) => (
  <div className="bg-surface-container-low rounded-2xl border border-white/[0.04] p-4 min-w-[160px] flex-1 shadow-sm">
    <div className="flex items-center justify-between mb-2">
      <div className={cn("p-2 rounded-lg", bg)}>
        <Icon className={cn("w-4 h-4", color)} />
      </div>
      {trend && (
        <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
          {trend}
        </span>
      )}
    </div>
    <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">{label}</p>
    <div className="flex items-baseline gap-1 mt-1">
      <span className="text-2xl font-black text-on-surface">{value}</span>
      {subValue && <span className="text-xs text-on-surface-variant font-medium">{subValue}</span>}
    </div>
  </div>
);

const RecoveryChart: React.FC<{ logs: WellnessLog[] }> = ({ logs }) => {
  const { t } = useTranslation();

  const sortedLogs = useMemo(() =>
    [...logs].sort((a, b) => a.date.localeCompare(b.date)),
    [logs]
  );

  const points = useMemo(() => {
    if (sortedLogs.length === 0) return [];
    const maxX = 1000;
    const maxY = 260;
    const minY = 40;
    const step = sortedLogs.length > 1 ? maxX / (sortedLogs.length - 1) : maxX / 2;

    return sortedLogs.map((log, i) => ({
      x: sortedLogs.length === 1 ? maxX / 2 : i * step,
      y: maxY - ((log.score / 5) * (maxY - minY)),
      score: log.score,
      date: log.date,
    }));
  }, [sortedLogs]);

  const pathD = useMemo(() => {
    if (points.length === 0) return '';
    if (points.length === 1) return `M${points[0].x},${points[0].y}`;
    return points.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(' ');
  }, [points]);

  const areaD = useMemo(() => {
    if (!pathD || points.length === 0) return '';
    return `${pathD} L${points[points.length - 1].x},300 L${points[0].x},300 Z`;
  }, [pathD, points]);

  return (
    <div className="h-64 w-full relative group">
      <svg className="w-full h-full" viewBox="0 0 1000 300" preserveAspectRatio="none">
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {areaD && <path d={areaD} fill="url(#gradient)" />}
        {pathD && (
          <path
            d={pathD}
            fill="none"
            stroke="var(--primary)"
            strokeWidth="4"
            strokeLinecap="round"
            className="drop-shadow-lg"
          />
        )}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="6" fill="white" stroke="var(--primary)" strokeWidth="3" />
        ))}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[1px]">
        <span className="bg-surface-container-high px-4 py-2 rounded-lg border border-white/[0.06] shadow-xl font-bold text-primary animate-in fade-in zoom-in duration-300">
          {t('recoveryScore')}: {(logs.reduce((s, l) => s + l.score, 0) / logs.length).toFixed(1)}
        </span>
      </div>
    </div>
  );
};

const BORDER_COLORS: Record<string, string> = {
  emerald: 'border-l-emerald-500',
  amber: 'border-l-amber-500',
  red: 'border-l-red-500',
  gray: 'border-l-gray-400',
};

const AthleteWellnessCard: React.FC<{ goalkeeper: Goalkeeper; allLogs: WellnessLog[] }> = ({ goalkeeper, allLogs }) => {
  const { t } = useTranslation();

  const metrics = [
    { icon: Moon, field: 'sleep' as const },
    { icon: Brain, field: 'stress' as const },
    { icon: Zap, field: 'fatigue' as const },
    { icon: Frown, field: 'soreness' as const },
  ];

  const lastLog = useMemo(() => getLatestLog(allLogs, goalkeeper.id), [allLogs, goalkeeper.id]);
  const borderColor = getScoreBorderColor(lastLog?.score);

  return (
    <div className={cn(
      "bg-surface-container-low rounded-2xl border border-white/[0.04] p-5 hover:shadow-md transition-all group border-l-4",
      BORDER_COLORS[borderColor]
    )}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-on-surface/5 overflow-hidden border border-white/[0.04] group-hover:scale-105 transition-transform shadow-sm">
            {goalkeeper.imageUrl ? (
                <img src={goalkeeper.imageUrl} alt={goalkeeper.name} className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-on-surface-variant opacity-30">
                    <Activity className="w-5 h-5" />
                </div>
            )}
          </div>
          <div>
            <h4 className="font-bold text-on-surface text-sm">{goalkeeper.name}</h4>
            <p className="text-[10px] text-on-surface-variant uppercase font-medium">{goalkeeper.category}</p>
          </div>
        </div>
        <div className="text-right">
          <div className={cn("text-lg font-black", lastLog ? `text-${borderColor}-500` : "text-on-surface-variant/40")}>
            {lastLog ? lastLog.score.toFixed(1) : '—'}
          </div>
          <div className="text-[8px] font-bold uppercase text-on-surface-variant leading-none">{t('wellnessScore')}</div>
        </div>
      </div>

      <div className="flex justify-between gap-2 mt-2">
        {metrics.map((m, idx) => {
          const value = lastLog ? lastLog[m.field] : undefined;
          return (
            <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 p-2 rounded-lg bg-surface shadow-inner">
              <m.icon className="w-3.5 h-3.5 text-on-surface-variant opacity-40" />
              <div className="w-full h-1 bg-on-surface/5 rounded-full overflow-hidden">
                {value !== undefined && (
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${(value / 5) * 100}%` }}
                  />
                )}
              </div>
              <span className="text-[9px] font-bold text-on-surface-variant/40">
                {value !== undefined ? `${value}/5` : '—/5'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
