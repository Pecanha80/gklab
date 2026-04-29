import React from 'react';
import { BarChart3, Calendar, Activity, TrendingUp, Heart, Layers, Dumbbell } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { useAnalytics } from '../../hooks/useAnalytics';
import { AnalyticsFilterBar } from '../analytics/AnalyticsFilterBar';
import { ExerciseTypeChart } from '../charts/ExerciseTypeChart';
import { PhysicalCapacityChart } from '../charts/PhysicalCapacityChart';
import { TopDrillsChart } from '../charts/TopDrillsChart';
import { GameMomentsChart } from '../charts/GameMomentsChart';
import { ObjectivesChart } from '../charts/ObjectivesChart';
import { TacticalPrinciplesChart } from '../charts/TacticalPrinciplesChart';
import { WellnessTrendChart } from '../charts/WellnessTrendChart';
import { RpeLoadTrendChart } from '../charts/RpeLoadTrendChart';
import { IntensityDistributionChart } from '../charts/IntensityDistributionChart';
import { ContextDistributionChart } from '../charts/ContextDistributionChart';
import { WeeklyVolumeChart } from '../charts/WeeklyVolumeChart';

const ChartCard: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className = '' }) => (
  <div className={`bg-surface rounded-lg border border-white/[0.04] p-3 ${className}`}>
    <h4 className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">{title}</h4>
    {children}
  </div>
);

export const AnalyticsTab: React.FC = () => {
  const { t } = useTranslation();
  const analytics = useAnalytics();

  if (analytics.loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  const hasData = analytics.totalSessions > 0;
  const stats = analytics.summaryStats;

  return (
    <div className="space-y-4 max-w-[1400px] mx-auto">
      {/* Header + Filters compact */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2 shrink-0">
          <BarChart3 className="w-4 h-4 text-accent" />
          <h2 className="text-sm font-bold text-on-surface">{t('analyticsTab')}</h2>
          <span className="text-[10px] text-on-surface-variant bg-white/[0.04] px-2 py-0.5 rounded">
            {analytics.totalSessions} {t('sessionsCount')} · {analytics.totalExercises} {t('exercisesCount')}
          </span>
        </div>
        <div className="flex-1" />
        <AnalyticsFilterBar
          selectedGkId={analytics.selectedGkId}
          setSelectedGkId={analytics.setSelectedGkId}
          period={analytics.period}
          setPeriod={analytics.setPeriod}
          selectedCategory={analytics.selectedCategory}
          setSelectedCategory={analytics.setSelectedCategory}
          selectedMesocycle={analytics.selectedMesocycle}
          setSelectedMesocycle={analytics.setSelectedMesocycle}
          goalkeepers={analytics.goalkeepers}
          categories={analytics.categories}
          mesocycles={analytics.mesocycles}
          microcycles={analytics.microcycles}
          selectedMicrocycle={analytics.selectedMicrocycle}
          setSelectedMicrocycle={analytics.setSelectedMicrocycle}
          t={t}
        />
      </div>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-16 text-on-surface-variant">
          <BarChart3 className="w-10 h-10 mb-2 opacity-20" />
          <p className="text-xs">{t('analyticsNoData')}</p>
        </div>
      ) : (
        <>
          {/* KPI Row — compact */}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            <div className="bg-surface rounded-lg border border-white/[0.04] px-3 py-2 text-center">
              <p className="text-lg font-black text-on-surface leading-none">{stats.totalSessions}</p>
              <p className="text-[8px] font-bold text-on-surface-variant uppercase mt-0.5">{t('sessionsCount')}</p>
            </div>
            <div className="bg-surface rounded-lg border border-white/[0.04] px-3 py-2 text-center">
              <p className="text-lg font-black text-rose-400 leading-none">{stats.avgRpe}</p>
              <p className="text-[8px] font-bold text-on-surface-variant uppercase mt-0.5">{t('avgRpeLabel')}</p>
            </div>
            <div className="bg-surface rounded-lg border border-white/[0.04] px-3 py-2 text-center">
              <p className="text-lg font-black text-amber-400 leading-none">{stats.totalLoad.toLocaleString()}</p>
              <p className="text-[8px] font-bold text-on-surface-variant uppercase mt-0.5">{t('totalLoad')}</p>
            </div>
            <div className="bg-surface rounded-lg border border-white/[0.04] px-3 py-2 text-center">
              <p className="text-lg font-black text-emerald-400 leading-none">{stats.avgWellness}</p>
              <p className="text-[8px] font-bold text-on-surface-variant uppercase mt-0.5">{t('avgWellness')}</p>
            </div>
            <div className="bg-surface rounded-lg border border-white/[0.04] px-3 py-2 text-center">
              <p className="text-lg font-black text-cyan-400 leading-none">{stats.sessionsPerWeek}</p>
              <p className="text-[8px] font-bold text-on-surface-variant uppercase mt-0.5">{t('sessionsPerWeek')}</p>
            </div>
          </div>

          {/* Main grid — compact charts */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Row 1: Overview distributions */}
            <ChartCard title={t('exerciseTypeDistribution')}>
              <ExerciseTypeChart data={analytics.exerciseTypeData} t={t} />
            </ChartCard>
            <ChartCard title={t('intensityDistribution')}>
              <IntensityDistributionChart data={analytics.intensityDistributionData} t={t} />
            </ChartCard>
            <ChartCard title={t('contextDistribution')}>
              <ContextDistributionChart data={analytics.contextDistributionData} t={t} />
            </ChartCard>

            {/* Row 2: Game model */}
            <ChartCard title={t('gameMomentsCoverage')}>
              <GameMomentsChart data={analytics.gameMomentsData} t={t} />
            </ChartCard>
            <ChartCard title={t('tacticalPrinciplesCoverage')}>
              <TacticalPrinciplesChart data={analytics.tacticalPrinciplesData} t={t} />
            </ChartCard>
            <ChartCard title={t('physicalCapacityDistribution')}>
              <PhysicalCapacityChart data={analytics.physicalCapacityData} t={t} />
            </ChartCard>

            {/* Row 3: Objectives & Drills */}
            <ChartCard title={t('objectivesFrequency')} className="lg:col-span-2">
              <ObjectivesChart data={analytics.objectivesData} t={t} />
            </ChartCard>
            <ChartCard title={t('topDrills')}>
              <TopDrillsChart data={analytics.topDrillsData} t={t} />
            </ChartCard>
          </div>

          {/* Monitoring section — full width */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <ChartCard title={t('weeklyVolume')}>
              <WeeklyVolumeChart data={analytics.weeklyVolumeData} t={t} />
            </ChartCard>
            <ChartCard title={t('rpeLoadTrends')}>
              <RpeLoadTrendChart data={analytics.rpeLoadTrendData} t={t} />
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <ChartCard title={t('wellnessTrends')}>
              <WellnessTrendChart data={analytics.wellnessTrendData} t={t} />
            </ChartCard>
          </div>
        </>
      )}
    </div>
  );
};

export default AnalyticsTab;
