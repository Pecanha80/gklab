import React from 'react';
import { cn } from '../../lib/utils';
import type { Goalkeeper, SavedMicrocycle } from '../../types';
import type { PeriodFilter } from '../../hooks/useAnalytics';

interface AnalyticsFilterBarProps {
  selectedGkId: 'all' | string;
  setSelectedGkId: (id: 'all' | string) => void;
  period: PeriodFilter;
  setPeriod: (p: PeriodFilter) => void;
  selectedCategory: 'all' | string;
  setSelectedCategory: (c: 'all' | string) => void;
  selectedMesocycle: 'all' | string;
  setSelectedMesocycle: (m: 'all' | string) => void;
  selectedMicrocycle: 'all' | string;
  setSelectedMicrocycle: (m: 'all' | string) => void;
  goalkeepers: Goalkeeper[];
  categories: string[];
  mesocycles: string[];
  microcycles: SavedMicrocycle[];
  t: (key: string) => string;
}

const periodOptions: { value: PeriodFilter; labelKey: string }[] = [
  { value: 'week', labelKey: 'thisWeek' },
  { value: 'month', labelKey: 'thisMonth' },
  { value: '3months', labelKey: 'last3Months' },
  { value: 'all', labelKey: 'allTime' },
];

const Pill: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={cn(
      "px-2 py-1 text-[10px] font-semibold rounded transition-all whitespace-nowrap",
      active
        ? "bg-accent text-white shadow-sm"
        : "text-on-surface-variant hover:text-on-surface hover:bg-white/[0.04]"
    )}
  >
    {children}
  </button>
);

export const AnalyticsFilterBar: React.FC<AnalyticsFilterBarProps> = ({
  selectedGkId,
  setSelectedGkId,
  period,
  setPeriod,
  selectedCategory,
  setSelectedCategory,
  selectedMesocycle,
  setSelectedMesocycle,
  selectedMicrocycle,
  setSelectedMicrocycle,
  goalkeepers,
  categories,
  mesocycles,
  microcycles,
  t,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* GK Selector */}
      <select
        value={selectedGkId}
        onChange={e => setSelectedGkId(e.target.value)}
        className="bg-surface border border-white/[0.06] rounded px-2 py-1 text-[10px] font-semibold text-on-surface focus:outline-none focus:ring-1 focus:ring-accent"
      >
        <option value="all">{t('allGoalkeepers')}</option>
        {goalkeepers.map(gk => (
          <option key={gk.id} value={gk.id}>{gk.name}</option>
        ))}
      </select>

      {/* Microcycle selector (primary periodization filter) */}
      {microcycles.length > 0 && (
        <select
          value={selectedMicrocycle}
          onChange={e => {
            setSelectedMicrocycle(e.target.value);
            if (e.target.value !== 'all') {
              // Reset period filter when microcycle is selected
              setPeriod('all');
            }
          }}
          className="bg-surface border border-white/[0.06] rounded px-2 py-1 text-[10px] font-semibold text-on-surface focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="all">{t('allMicrocycles')}</option>
          {microcycles.map(mc => (
            <option key={mc.id} value={mc.id}>{mc.name}{mc.startDate ? ` (${mc.startDate.slice(5)})` : ''}</option>
          ))}
        </select>
      )}

      {/* Mesocycle selector */}
      {mesocycles.length > 0 && (
        <select
          value={selectedMesocycle}
          onChange={e => {
            setSelectedMesocycle(e.target.value);
            if (e.target.value !== 'all') {
              setSelectedMicrocycle('all');
            }
          }}
          className="bg-surface border border-white/[0.06] rounded px-2 py-1 text-[10px] font-semibold text-on-surface focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="all">{t('allMesocycles')}</option>
          {mesocycles.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      )}

      {/* Period pills (secondary, when no microcycle/mesocycle selected) */}
      {selectedMicrocycle === 'all' && selectedMesocycle === 'all' && (
        <div className="flex items-center gap-0.5 bg-white/[0.02] border border-white/[0.06] rounded p-0.5">
          {periodOptions.map(opt => (
            <Pill key={opt.value} active={period === opt.value} onClick={() => setPeriod(opt.value)}>
              {t(opt.labelKey)}
            </Pill>
          ))}
        </div>
      )}

      {/* Category pills */}
      {categories.length > 1 && (
        <div className="flex items-center gap-0.5 bg-white/[0.02] border border-white/[0.06] rounded p-0.5">
          <Pill active={selectedCategory === 'all'} onClick={() => setSelectedCategory('all')}>
            {t('allCategories')}
          </Pill>
          {categories.map(cat => (
            <Pill key={cat} active={selectedCategory === cat} onClick={() => setSelectedCategory(cat)}>
              {t(cat)}
            </Pill>
          ))}
        </div>
      )}
    </div>
  );
};
