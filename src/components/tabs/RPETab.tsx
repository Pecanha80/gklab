import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { Activity, BarChart3, TrendingUp, Users, Calendar, Clock, ChevronRight, Info, Target, Zap } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTranslation } from '../../hooks/useTranslation';
import { useToast } from '../../hooks/useToast';
import { supabase } from '../../lib/supabase';
import { GoalkeeperComparison } from '../charts/GoalkeeperComparison';
import {
  buildSessionsWithLoad,
  computeRpeStats,
  computeIntensityDistribution,
  computeWeeklyLoads,
  getTeamStatusLevel,
} from '../../lib/rpe';
import type { SessionWithLoad } from '../../lib/rpe';
import type { TrainingSession, Attendance, Goalkeeper, WellnessLog } from '../../types';

export const RPETab: React.FC = () => {
  const { t } = useTranslation();
  const { showError } = useToast();

  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [goalkeepers, setGoalkeepers] = useState<Goalkeeper[]>([]);
  const [allAttendance, setAllAttendance] = useState<Attendance[]>([]);
  const [allWellness, setAllWellness] = useState<WellnessLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);

    try {
      const [sessRes, gkRes, attRes, wellRes] = await Promise.all([
        supabase.from('sessions').select('*').order('created_at', { ascending: false }),
        supabase.from('goalkeepers').select('*'),
        supabase.from('attendance').select('*'),
        supabase.from('wellness_logs').select('*'),
      ]);

      setSessions(sessRes.data || []);
      setGoalkeepers(gkRes.data || []);
      setAllAttendance(attRes.data || []);
      setAllWellness(wellRes.data || []);
    } catch (err) {
      showError(t('rpeLoadError'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const sessionsWithLoad = useMemo(
    () => buildSessionsWithLoad(sessions, allAttendance),
    [sessions, allAttendance]
  );

  const stats = useMemo(
    () => computeRpeStats(sessionsWithLoad, allAttendance),
    [sessionsWithLoad, allAttendance]
  );

  const rpeValues = useMemo(
    () => allAttendance.filter(a => a.rpe != null && a.rpe > 0).map(a => a.rpe!),
    [allAttendance]
  );

  const intensityDistribution = useMemo(
    () => computeIntensityDistribution(rpeValues),
    [rpeValues]
  );

  // Get current week start (Monday)
  const currentWeekStart = useMemo(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day; // Monday
    const monday = new Date(now);
    monday.setDate(now.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  }, []);

  const weeklyLoads = useMemo(
    () => computeWeeklyLoads(sessionsWithLoad, currentWeekStart),
    [sessionsWithLoad, currentWeekStart]
  );

  const athletesWithRpe = useMemo(() => {
    const gkIds = new Set(allAttendance.filter(a => a.rpe != null && a.rpe > 0).map(a => a.goalkeeper_id));
    return gkIds.size;
  }, [allAttendance]);

  const teamStatusLevel = getTeamStatusLevel(stats.avgIntensity);

  const teamStatusConfig: Record<string, { label: string; color: string; ringColor: string }> = {
    none: { label: '—', color: 'text-on-surface-variant', ringColor: 'border-on-surface/20' },
    fresh: { label: t('rpeFreshReady'), color: 'text-blue-500', ringColor: 'border-blue-500' },
    ideal: { label: t('rpeIdealReady'), color: 'text-emerald-600', ringColor: 'border-emerald-500' },
    moderate: { label: t('rpeModFatigue'), color: 'text-amber-600', ringColor: 'border-amber-500' },
    high: { label: t('rpeHighFatigue'), color: 'text-red-600', ringColor: 'border-red-500' },
  };

  const teamStatus = teamStatusConfig[teamStatusLevel];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!sessions.length || !goalkeepers.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-on-surface/5 flex items-center justify-center">
          <Activity className="w-10 h-10 text-on-surface-variant opacity-20" />
        </div>
        <h3 className="text-xl font-bold">{t('rpeTab')}</h3>
        <p className="text-on-surface-variant max-w-md">
          {(!goalkeepers.length)
            ? t('rpeNoGoalkeepers')
            : t('rpeNoSessions')
          }
        </p>
      </div>
    );
  }

  const hasLoad = stats.totalLoad > 0;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black font-headline tracking-tight text-on-surface">
            {t('rpeTab')}
          </h2>
          <p className="text-on-surface-variant font-label mt-1">
            {t('trainingIntensity')} — {t('analysis')}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <StatCard
            label={t('averageIntensity')}
            value={stats.avgIntensity.toFixed(1)}
            subValue="/ 10"
            icon={Activity}
            color="text-primary"
            bg="bg-primary/10"
          />
          <StatCard
            label={t('totalLoad')}
            value={stats.totalLoad.toString()}
            subValue="A.U."
            icon={TrendingUp}
            color="text-secondary"
            bg="bg-secondary/10"
          />
          <StatCard
            label={t('athletes')}
            value={athletesWithRpe.toString()}
            icon={Users}
            color="text-emerald-500"
            bg="bg-emerald-500/10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Load Distribution Area */}
        {hasLoad ? (
          <div className="lg:col-span-12">
            <section className="bg-surface rounded-2xl border border-white/[0.04] p-8 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-headline font-bold text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  {t('rpeLoadBreakdown')}
                </h3>
                <div className="text-xs text-on-surface-variant font-medium flex items-center gap-2">
                  <Info className="w-3 h-3" />
                  {t('rpeLoadFormula')}
                </div>
              </div>

              <div className="grid grid-cols-7 gap-4 h-64 items-end">
                {weeklyLoads.map((day, i) => (
                  <div key={i} className="group relative flex flex-col items-center">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max((day.pct / 100) * 220, day.load > 0 ? 8 : 0)}px` }}
                      transition={{ delay: i * 0.1, type: 'spring' }}
                      className={cn(
                        "w-full rounded-t-xl transition-all duration-500 group-hover:opacity-80 shadow-lg",
                        day.pct > 75 ? "bg-error/80" : day.pct > 40 ? "bg-primary" : "bg-emerald-500/80"
                      )}
                    />
                    <div className="absolute -top-8 bg-surface-container-high px-2 py-1 rounded border border-white/[0.04] text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                      {day.load} AU
                    </div>
                    <span className="mt-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{day.label}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        ) : (
          <div className="lg:col-span-12 bg-surface rounded-2xl p-12 flex items-center justify-center border border-dashed border-white/[0.06]">
            <p className="text-on-surface-variant italic">{t('rpeNoLoadData')}</p>
          </div>
        )}

        <div className="lg:col-span-8 space-y-6">
          <section className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="font-headline font-bold text-lg">{t('rpeRecentSessions')}</h3>
            </div>
            <div className="space-y-3">
              {sessionsWithLoad.slice(0, 4).map((sw) => (
                <SessionExertionRow key={sw.session.id} sw={sw} t={t} />
              ))}
              {sessions.length === 0 && (
                <p className="text-xs text-on-surface-variant px-2 italic">{t('rpeAwaitingData')}</p>
              )}
            </div>
          </section>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <section className="bg-surface-container-low rounded-2xl border border-white/[0.04] p-6 shadow-sm border-t-4 border-t-primary">
            <h4 className="font-headline font-bold mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              {t('rpeIntensityTargets')}
            </h4>
            <div className="space-y-5">
              <IntensityProgress label={t('rpeVeryHigh')} value={intensityDistribution.veryHigh} color="bg-error" />
              <IntensityProgress label={t('rpeHigh')} value={intensityDistribution.high} color="bg-primary" />
              <IntensityProgress label={t('rpeModerate')} value={intensityDistribution.moderate} color="bg-amber-500" />
              <IntensityProgress label={t('rpeRecovery')} value={intensityDistribution.recovery} color="bg-emerald-500" />
            </div>
            <div className="mt-8 pt-6 border-t border-white/[0.04] flex items-center justify-between">
              <div>
                <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">{t('rpeTeamStatus')}</p>
                <p className={cn("text-sm font-bold", teamStatus.color)}>{teamStatus.label}</p>
              </div>
              {hasLoad && (
                <div className={cn(
                  "w-12 h-12 rounded-full border-4 border-t-transparent",
                  teamStatus.ringColor.replace('border-', 'border-') + '/20',
                  teamStatus.ringColor.replace('border-', 'border-t-')
                )}
                  style={{
                    background: `conic-gradient(${
                      teamStatusLevel === 'fresh' ? '#3b82f6' :
                      teamStatusLevel === 'ideal' ? '#10b981' :
                      teamStatusLevel === 'moderate' ? '#f59e0b' :
                      teamStatusLevel === 'high' ? '#ef4444' : '#888'
                    } ${Math.min(stats.avgIntensity * 10, 100)}%, transparent 0)`,
                    borderRadius: '50%',
                  }}
                />
              )}
            </div>
          </section>

          <div className="bg-surface-elevated/30 rounded-2xl p-6 border border-white/[0.04] relative overflow-hidden backdrop-blur-sm">
            <Zap className="absolute -bottom-6 -right-6 w-32 h-32 text-on-surface opacity-5" />
            <h4 className="text-on-surface font-bold mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              {t('rpeWeeklyDistribution')}
            </h4>
            <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-on-surface/5">
              <div style={{ width: `${intensityDistribution.veryHigh}%` }} className="bg-error" />
              <div style={{ width: `${intensityDistribution.high}%` }} className="bg-primary" />
              <div style={{ width: `${intensityDistribution.moderate}%` }} className="bg-amber-500" />
              <div style={{ width: `${intensityDistribution.recovery}%` }} className="bg-emerald-500" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-y-2">
              <LegendItem color="bg-error" label={t('rpeElevated')} />
              <LegendItem color="bg-primary" label={t('rpeStrong')} />
              <LegendItem color="bg-amber-500" label={t('rpeMod')} />
              <LegendItem color="bg-emerald-500" label={t('rpeLight')} />
            </div>
          </div>
        </div>
      </div>

      {/* Goalkeeper Comparison Charts */}
      {goalkeepers.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-black font-headline tracking-tight text-on-surface">
            {t('comparisonCharts')}
          </h2>
          <GoalkeeperComparison
            goalkeepers={goalkeepers}
            sessions={sessions}
            allAttendance={allAttendance}
            allWellness={allWellness}
            t={t}
          />
        </div>
      )}
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: string; subValue?: string; icon: any; color: string; bg: string; trend?: string }> = ({ label, value, subValue, icon: Icon, color, bg, trend }) => (
  <div className="bg-surface-container-low rounded-2xl border border-white/[0.04] p-5 min-w-[180px] flex-1 shadow-sm group hover:scale-[1.02] transition-all">
    <div className="flex items-center justify-between mb-3">
      <div className={cn("p-2.5 rounded-xl", bg)}>
        <Icon className={cn("w-5 h-5", color)} />
      </div>
      {trend && trend !== '—' && (
        <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
          <TrendingUp className="w-3 h-3" /> {trend}
        </span>
      )}
    </div>
    <p className="text-[10px] text-on-surface-variant font-black uppercase tracking-[0.15em] mb-1">{label}</p>
    <div className="flex items-baseline gap-1.5">
      <span className="text-3xl font-black text-on-surface leading-none tracking-tight">{value}</span>
      {subValue && <span className="text-sm text-on-surface-variant font-bold">{subValue}</span>}
    </div>
  </div>
);

const IntensityProgress: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <div className="space-y-1.5">
    <div className="flex justify-between text-[11px] font-bold tracking-tight">
      <span className="text-on-surface-variant">{label}</span>
      <span className="text-on-surface">{value}%</span>
    </div>
    <div className="w-full h-2 bg-on-surface/5 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        className={cn("h-full rounded-full", color)}
      />
    </div>
  </div>
);

const LegendItem: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <div className="flex items-center gap-2">
    <div className={cn("w-2 h-2 rounded-full", color)} />
    <span className="text-[10px] font-bold text-on-surface-variant uppercase">{label}</span>
  </div>
);

const SessionExertionRow: React.FC<{ sw: SessionWithLoad; t: (key: string) => string }> = ({ sw, t }) => {
  const { session, avgRpe, durationMin, load, attendanceCount } = sw;
  const displayRpe = avgRpe > 0 ? avgRpe.toFixed(1) : '—';
  const hasRpe = avgRpe > 0;

  return (
    <div className="bg-surface-container-low rounded-xl border border-white/[0.04] p-4 flex items-center justify-between hover:bg-surface-container-high transition-colors group">
      <div className="flex items-center gap-4">
        <div className={cn(
          "w-12 h-12 rounded-xl flex flex-col items-center justify-center font-bold shadow-sm group-hover:scale-110 transition-transform",
          !hasRpe ? "bg-on-surface/5 text-on-surface/30" :
          avgRpe >= 8 ? "bg-error/10 text-error" :
          avgRpe >= 6 ? "bg-primary/10 text-primary" :
          "bg-emerald-500/10 text-emerald-500"
        )}>
          <span className="text-lg leading-none">{displayRpe}</span>
          <span className="text-[8px] uppercase tracking-tighter">{t('rpe')}</span>
        </div>
        <div>
          <h4 className="font-bold text-sm text-on-surface truncate max-w-[300px]">
            {session.titles?.map(title => t(title)).join(' & ') || 'Session'}
          </h4>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-[10px] text-on-surface-variant flex items-center gap-1">
              <Calendar className="w-3 h-3" /> {session.date}
            </span>
            {durationMin > 0 && (
              <span className="text-[10px] text-on-surface-variant flex items-center gap-1">
                <Clock className="w-3 h-3" /> {durationMin} min
              </span>
            )}
            {attendanceCount > 0 && (
              <span className="text-[10px] text-on-surface-variant flex items-center gap-1">
                <Users className="w-3 h-3" /> {attendanceCount}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-8">
        <div className="hidden sm:block text-right">
          <p className="text-[10px] text-on-surface-variant font-bold uppercase">{t('rpeAccumulatedLoad')}</p>
          <p className="text-sm font-black text-on-surface">{load > 0 ? `${load} AU` : '—'}</p>
        </div>
        <ChevronRight className="w-5 h-5 text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
};
