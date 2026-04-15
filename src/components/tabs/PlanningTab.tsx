import React from 'react';
import {
  Plus,
  Trash2,
  FileText,
  Clock,
  Trophy,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, getTodayDateString, toDateString } from '../../lib/utils';
import { TrainingSession } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';
import { QuickSelect } from '../ui/QuickSelect';
import type { DayKey, SavedMicrocycle } from '../../hooks/useMicrocycle';

interface PlanningTabProps {
  sessions: TrainingSession[];
  // Microcycle state
  microcycleName: string;
  setMicrocycleName: (v: string) => void;
  microcycleStartDate: string;
  setMicrocycleStartDate: (v: string) => void;
  microcycleStartDay: DayKey;
  setMicrocycleStartDay: (v: DayKey) => void;
  microcycleEndDay: DayKey;
  setMicrocycleEndDay: (v: DayKey) => void;
  matchDay: DayKey | '';
  setMatchDay: (v: DayKey | '') => void;
  savedMicrocycles: SavedMicrocycle[];
  showMicrocycleHistory: boolean;
  setShowMicrocycleHistory: (v: boolean) => void;
  getMicrocycleDays: () => readonly DayKey[];
  getDayDate: (dayKey: DayKey) => Date;
  formatDayDate: (dayKey: DayKey) => string;
  formatMonthLabel: (dayKey: DayKey) => string;
  getMatchDayLabel: (dayKey: string) => string | null;
  saveMicrocycle: () => void;
  loadMicrocycle: (mc: SavedMicrocycle) => void;
  deleteMicrocycle: (id: string) => void;
  ALL_DAYS: readonly DayKey[];
  // Navigation
  setActiveTab: (tab: string) => void;
  setIsAddingSession: (v: boolean) => void;
  setViewingSession: (session: TrainingSession | null) => void;
}

export const PlanningTab: React.FC<PlanningTabProps> = ({
  sessions,
  microcycleName,
  setMicrocycleName,
  microcycleStartDate,
  setMicrocycleStartDate,
  setMicrocycleStartDay,
  microcycleEndDay,
  setMicrocycleEndDay,
  matchDay,
  setMatchDay,
  savedMicrocycles,
  showMicrocycleHistory,
  setShowMicrocycleHistory,
  getMicrocycleDays,
  getDayDate,
  formatDayDate,
  formatMonthLabel,
  getMatchDayLabel,
  saveMicrocycle,
  loadMicrocycle,
  deleteMicrocycle,
  ALL_DAYS,
  setActiveTab,
  setIsAddingSession,
  setViewingSession,
}) => {
  const { t, isPortuguese } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black font-headline tracking-tight text-on-surface">{t('microcyclePlanner')}</h2>
          <p className="text-on-surface-variant text-sm mt-1">{t('uefaWeeklyPeriodization')}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowMicrocycleHistory(!showMicrocycleHistory)}
            className={cn(
              "px-4 py-2 rounded-md font-label text-xs font-bold transition-all active:scale-95 flex items-center border",
              showMicrocycleHistory ? "bg-primary/10 border-primary text-primary" : "border-black/10 text-on-surface-variant hover:border-primary hover:text-primary"
            )}
          >
            <Clock className="w-4 h-4 mr-2" />
            {t('history' as any)}
          </button>
          <button onClick={() => { setActiveTab('Training'); setIsAddingSession(true); }} className="bg-primary hover:bg-primary-dim text-on-primary px-4 py-2 rounded-md font-label text-xs font-bold transition-all active:scale-95 flex items-center">
            <Plus className="w-4 h-4 mr-2" />
            {t('newSession')}
          </button>
        </div>
      </div>

      {/* Microcycle History */}
      <AnimatePresence>
        {showMicrocycleHistory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-surface-container rounded-xl border border-black/10 p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{t('savedMicrocycles' as any)}</h3>
              {savedMicrocycles.length === 0 ? (
                <p className="text-xs text-on-surface-variant italic">{t('noSavedMicrocycles' as any)}</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {savedMicrocycles.map(mc => {
                    const startDate = new Date(mc.startDate);
                    return (
                      <div key={mc.id} className="bg-surface-container-highest p-3 rounded-lg border border-black/10 flex items-center justify-between group hover:border-primary transition-all">
                        <button onClick={() => loadMicrocycle(mc)} className="flex-1 text-left">
                          <div className="text-xs font-bold text-on-surface">{mc.name}</div>
                          <div className="text-[10px] text-on-surface-variant mt-0.5">
                            {startDate.toLocaleDateString(isPortuguese ? 'pt-BR' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                            {mc.matchDay && <> · <Trophy className="w-2.5 h-2.5 inline-block text-yellow-500" /> {t(mc.matchDay as any)}</>}
                          </div>
                        </button>
                        <button aria-label={t('delete' as any)} onClick={() => deleteMicrocycle(mc.id)} className="p-1.5 text-on-surface-variant hover:text-error opacity-0 group-hover:opacity-100 transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Microcycle Config */}
      <div className="bg-surface-container rounded-xl border border-black/10 p-5">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="space-y-1">
            <label className="text-[9px] text-on-surface-variant uppercase font-label tracking-widest">{t('microcycleName')}</label>
            <input
              type="text"
              value={microcycleName}
              onChange={e => setMicrocycleName(e.target.value)}
              placeholder={t('microcycleNamePlaceholder')}
              className="w-full bg-surface-container-highest border border-black/10 rounded px-3 py-2 text-xs"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] text-on-surface-variant uppercase font-label tracking-widest">{t('startDate' as any)}</label>
            <input
              type="date"
              value={microcycleStartDate}
              onChange={e => {
                setMicrocycleStartDate(e.target.value);
                const d = new Date(e.target.value);
                const jsDay = d.getDay();
                setMicrocycleStartDay(ALL_DAYS[(jsDay + 6) % 7]);
              }}
              className="w-full bg-surface-container-highest border border-black/10 rounded px-3 py-2 text-xs"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] text-on-surface-variant uppercase font-label tracking-widest">{t('endDay')}</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={microcycleEndDay}
                onChange={e => setMicrocycleEndDay(e.target.value as DayKey)}
                className="flex-1 bg-surface-container-highest border border-black/10 rounded px-3 py-2 text-xs"
              />
              <QuickSelect
                label="Presets"
                options={ALL_DAYS.map(d => ({ value: d, label: t(d as any) }))}
                onSelect={(val) => setMicrocycleEndDay(val as any)}
                onDelete={() => {}}
                isDeletable={() => false}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[9px] text-on-surface-variant uppercase font-label tracking-widest">{t('matchDay')}</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={matchDay}
                onChange={e => setMatchDay(e.target.value as DayKey)}
                className="flex-1 bg-surface-container-highest border border-black/10 rounded px-3 py-2 text-xs"
              />
              <QuickSelect
                label="Presets"
                options={[
                  { value: '', label: t('noMatch') },
                  ...getMicrocycleDays().map(d => ({ value: d, label: t(d as any) }))
                ]}
                onSelect={(val) => setMatchDay(val as any)}
                onDelete={() => {}}
                isDeletable={() => false}
              />
            </div>
          </div>
          <div className="space-y-1 flex flex-col justify-end">
            <button
              onClick={saveMicrocycle}
              disabled={!microcycleName.trim()}
              className={cn(
                "w-full px-3 py-2 rounded font-label text-xs font-bold transition-all flex items-center justify-center gap-2",
                microcycleName.trim()
                  ? "bg-primary hover:bg-primary-dim text-on-primary active:scale-95"
                  : "bg-black/5 text-on-surface-variant cursor-not-allowed"
              )}
            >
              <FileText className="w-3.5 h-3.5" />
              {t('save' as any)}
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto -mx-2 px-2 pb-4">
      <div className="grid grid-cols-1 gap-4" style={{ gridTemplateColumns: `repeat(${getMicrocycleDays().length}, minmax(200px, 1fr))` }}>
        {getMicrocycleDays().map((dayKey) => {
          const isMatch = dayKey === matchDay;
          const mdLabel = getMatchDayLabel(dayKey);
          const dayDate = getDayDate(dayKey);
          const dateStr = toDateString(dayDate);
          const isToday = dateStr === getTodayDateString();
          return (
            <div key={dayKey} className="space-y-0">
              <div className={cn(
                "p-3 rounded-t-xl border-b-2 text-center",
                isMatch ? "bg-yellow-500/10 border-yellow-500" : isToday ? "bg-primary/10 border-primary" : "bg-surface-container-highest border-primary/50"
              )}>
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-widest",
                  isMatch ? "text-yellow-600" : "text-primary"
                )}>{t(dayKey)}</span>
                <div className={cn(
                  "text-lg font-bold mt-0.5",
                  isMatch ? "text-yellow-600" : isToday ? "text-primary" : "text-on-surface"
                )}>
                  {formatDayDate(dayKey)}
                </div>
                <span className="text-[8px] text-on-surface-variant uppercase tracking-widest">{formatMonthLabel(dayKey)}</span>
                {mdLabel && (
                  <div className={cn(
                    "text-[8px] font-bold uppercase tracking-widest mt-1 rounded-full px-2 py-0.5 inline-block",
                    isMatch ? "bg-yellow-500/20 text-yellow-600" : "bg-primary/10 text-primary"
                  )}>
                    {mdLabel}
                  </div>
                )}
              </div>
              <div className={cn(
                "rounded-b-xl border border-black/5 min-h-[300px] p-3 space-y-3",
                isMatch ? "bg-yellow-500/5" : "bg-surface-container"
              )}>
                {sessions.filter(s => s.date === dateStr).map(session => (
                  <div key={session.id} onClick={() => setViewingSession(session)} className="bg-surface-container-highest p-3 rounded-lg border border-black/10 group cursor-pointer hover:border-primary transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[8px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold uppercase tracking-widest">{t(session.category as any)}</span>
                      <Clock className="w-3 h-3 text-on-surface-variant" />
                    </div>
                    <h4 className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-2">{session.titles?.map(t_ => t(t_ as any)).join(' & ')}</h4>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex -space-x-1">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="w-4 h-4 rounded-full border border-surface-container bg-surface-variant text-[6px] flex items-center justify-center font-bold">GK</div>
                        ))}
                      </div>
                      <span className="text-[9px] text-on-surface-variant">{session.numAthletes} {t('gks')}</span>
                    </div>
                  </div>
                ))}
                {isMatch ? (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <Trophy className="w-8 h-8 text-yellow-500 mb-2" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-yellow-600">{t('matchDayLabel')}</span>
                  </div>
                ) : (
                  <button aria-label={t('newSession')} onClick={() => { setActiveTab('Training'); setIsAddingSession(true); }} className="w-full py-3 border border-dashed border-black/10 rounded-lg text-on-surface-variant hover:border-primary hover:text-primary transition-all flex items-center justify-center">
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
};
