import React from 'react';
import {
  Plus,
  Trash2,
  FileText,
  Clock,
  Trophy,
  Moon,
  X,
  CalendarDays,
  Dumbbell,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, getTodayDateString, toDateString } from '../../lib/utils';
import { parseCategory } from '../../lib/dashboard';
import { computeMdDiff, suggestIntensity, computeMicrocycleSummary } from '../../lib/microcycle';
import type { IntensityLevel } from '../../lib/microcycle';
import { TrainingSession } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';
import { QuickSelect } from '../ui/QuickSelect';
import type { DayKey } from '../../hooks/useMicrocycle';
import { SavedMicrocycle } from '../../types';
import { PRESETS } from '../../data/presets';
import { CustomPresetsState } from '../../hooks/useCustomPresets';

interface PlanningTabProps {
  sessions: TrainingSession[];
  // Microcycle state
  microcycleName: string;
  setMicrocycleName: (v: string) => void;
  mesocycle: string;
  setMesocycle: (v: string) => void;
  microcycleStartDate: string;
  setMicrocycleStartDate: (v: string) => void;
  microcycleEndDate: string;
  setMicrocycleEndDate: (v: string) => void;
  matchDay: string | null;
  setMatchDay: (v: string | null) => void;
  matchOpponent: string;
  setMatchOpponent: (v: string) => void;
  matchLocation: string;
  setMatchLocation: (v: string) => void;
  matchTime: string;
  setMatchTime: (v: string) => void;
  matchCompetition: string;
  setMatchCompetition: (v: string) => void;
  restDays: string[];
  toggleRestDay: (date: string) => void;
  isSaving: boolean;
  savedMicrocycles: SavedMicrocycle[];
  showMicrocycleHistory: boolean;
  setShowMicrocycleHistory: (v: boolean) => void;
  getMicrocycleDays: () => string[];
  getDayDate: (dateStr: string) => Date;
  getDayKey: (date: Date) => DayKey;
  formatDayDate: (dateStr: string) => string;
  formatMonthLabel: (dateStr: string) => string;
  getMatchDayLabel: (dateStr: string) => string | null;
  saveMicrocycle: () => void;
  loadMicrocycle: (mc: SavedMicrocycle) => void;
  deleteMicrocycle: (id: string) => void;
  ALL_DAYS: readonly DayKey[];
  // Navigation
  setActiveTab: (tab: string) => void;
  setIsAddingSession: (v: boolean) => void;
  setNewSession: (updater: (prev: Omit<TrainingSession, 'id'>) => Omit<TrainingSession, 'id'>) => void;
  setViewingSession: (session: TrainingSession | null) => void;
  // Preset management
  customPresets: CustomPresetsState;
  addCustomPreset: (field: keyof CustomPresetsState, value: string, defaultOptions: readonly string[], category?: string) => void;
  removeCustomPreset: (field: keyof CustomPresetsState, value: string) => void;
  moveCustomPreset: (field: keyof CustomPresetsState, value: string, newCategory: string) => void;
  getOptions: (field: keyof CustomPresetsState, defaultOptions: readonly string[]) => string[];
}

export const PlanningTab: React.FC<PlanningTabProps> = React.memo(({
  sessions,
  microcycleName,
  setMicrocycleName,
  mesocycle,
  setMesocycle,
  microcycleStartDate,
  setMicrocycleStartDate,
  microcycleEndDate,
  setMicrocycleEndDate,
  matchDay,
  setMatchDay,
  matchOpponent,
  setMatchOpponent,
  matchLocation,
  setMatchLocation,
  matchTime,
  setMatchTime,
  matchCompetition,
  setMatchCompetition,
  restDays,
  toggleRestDay,
  isSaving,
  savedMicrocycles,
  showMicrocycleHistory,
  setShowMicrocycleHistory,
  getMicrocycleDays,
  getDayDate,
  getDayKey,
  formatDayDate,
  formatMonthLabel,
  getMatchDayLabel,
  saveMicrocycle,
  loadMicrocycle,
  deleteMicrocycle,
  ALL_DAYS,
  setActiveTab,
  setIsAddingSession,
  setNewSession,
  setViewingSession,
  customPresets,
  addCustomPreset,
  removeCustomPreset,
  moveCustomPreset,
  getOptions,
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
              showMicrocycleHistory ? "bg-primary/10 border-primary text-primary" : "border-black/[0.08] text-on-surface-variant hover:border-primary hover:text-primary"
            )}
          >
            <Clock className="w-4 h-4 mr-2" />
            {t('history')}
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
            <div className="bg-surface rounded-xl border border-black/[0.08] p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{t('savedMicrocycles')}</h3>
              {savedMicrocycles.length === 0 ? (
                <p className="text-xs text-on-surface-variant italic">{t('noSavedMicrocycles')}</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {savedMicrocycles.map(mc => {
                    const startDate = new Date(mc.startDate);
                    return (
                      <div key={mc.id} className="bg-surface-elevated p-3 rounded-lg border border-black/[0.08] flex items-center justify-between group hover:border-primary transition-all">
                        <button onClick={() => loadMicrocycle(mc)} className="flex-1 text-left">
                          <div className="text-xs font-bold text-on-surface">{mc.name}</div>
                          <div className="text-[10px] text-on-surface-variant mt-0.5">
                            {startDate.toLocaleDateString(isPortuguese ? 'pt-BR' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                            {mc.matchDay && <> · <Trophy className="w-2.5 h-2.5 inline-block text-yellow-500" /> {t(mc.matchDay)}</>}
                          </div>
                        </button>
                        <button aria-label={t('delete')} onClick={() => deleteMicrocycle(mc.id)} className="p-1.5 text-on-surface-variant hover:text-error opacity-0 group-hover:opacity-100 transition-all">
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
      <div className="bg-surface rounded-xl border border-black/[0.08] p-5">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="space-y-1">
            <label className="text-[9px] text-on-surface-variant uppercase font-label tracking-widest">{t('microcycleName')}</label>
            <input
              type="text"
              value={microcycleName}
              onChange={e => setMicrocycleName(e.target.value)}
              placeholder={t('microcycleNamePlaceholder')}
              className="w-full bg-surface-elevated border border-black/[0.08] rounded px-3 py-2 text-xs"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] text-on-surface-variant uppercase font-label tracking-widest">{t('mesocycle')}</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={mesocycle}
                onChange={e => setMesocycle(e.target.value)}
                placeholder={t('mesocyclePlaceholder')}
                className="flex-1 bg-surface-elevated border border-black/[0.08] rounded px-3 py-2 text-xs"
              />
              <QuickSelect
                options={getOptions('mesocycles', PRESETS.mesocycles)}
                onSelect={(vals) => setMesocycle(vals.map(v => t(v)).join(', '))}
                selectedValues={mesocycle.split(', ').filter(Boolean)}
                onDelete={(val) => removeCustomPreset('mesocycles', val)}
                isDeletable={(val) => !val.startsWith('#')}
                onAdd={(val) => addCustomPreset('mesocycles', val, [])}
                onMove={(val) => moveCustomPreset('mesocycles', val, '')}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[9px] text-on-surface-variant uppercase font-label tracking-widest">{t('startDate')}</label>
            <input
              type="date"
              value={microcycleStartDate}
              onChange={e => {
                setMicrocycleStartDate(e.target.value);
              }}
              className="w-full bg-surface-elevated border border-black/[0.08] rounded px-3 py-2 text-xs"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] text-on-surface-variant uppercase font-label tracking-widest">{t('endDate')}</label>
            <input
              type="date"
              value={microcycleEndDate}
              onChange={e => setMicrocycleEndDate(e.target.value)}
              className="w-full bg-surface-elevated border border-black/[0.08] rounded px-3 py-2 text-xs"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] text-on-surface-variant uppercase font-label tracking-widest">{t('matchDay')}</label>
            <div className="flex gap-2">
              <select
                value={matchDay || ''}
                onChange={e => setMatchDay(e.target.value || null)}
                className="flex-1 bg-surface-elevated border border-black/[0.08] rounded px-3 py-2 text-xs"
              >
                <option value="">{t('noMatch')}</option>
                {getMicrocycleDays().map(dateStr => (
                  <option key={dateStr} value={dateStr}>
                    {getDayDate(dateStr).toLocaleDateString(isPortuguese ? 'pt-BR' : 'en-US', { day: '2-digit', month: '2-digit' })} ({t(getDayKey(getDayDate(dateStr)))})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1 flex flex-col justify-end">
            <button
              onClick={saveMicrocycle}
              disabled={!microcycleName.trim() || isSaving}
              className={cn(
                "w-full px-3 py-2 rounded font-label text-xs font-bold transition-all flex items-center justify-center gap-2",
                microcycleName.trim() && !isSaving
                  ? "bg-primary hover:bg-primary-dim text-on-primary active:scale-95"
                  : "bg-black/[0.02] text-on-surface-variant cursor-not-allowed"
              )}
            >
              {isSaving ? (
                <div className="w-3.5 h-3.5 border-2 border-on-surface-variant/30 border-t-on-surface-variant rounded-full animate-spin" />
              ) : (
                <FileText className="w-3.5 h-3.5" />
              )}
              {isSaving ? t('saving') : t('save')}
            </button>
          </div>
        </div>

        {/* Match Details Row (Conditional) */}
        {matchDay && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 pt-4 border-t border-black/[0.06] grid grid-cols-1 sm:grid-cols-4 gap-4"
          >
            <div className="space-y-1">
              <label className="text-[9px] text-on-surface-variant uppercase font-label tracking-widest">{t('opponent')}</label>
              <input
                type="text"
                value={matchOpponent}
                onChange={e => setMatchOpponent(e.target.value)}
                placeholder={t('opponentPlaceholder')}
                className="w-full bg-surface-elevated border border-black/[0.08] rounded px-3 py-2 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] text-on-surface-variant uppercase font-label tracking-widest">{t('location')}</label>
              <input
                type="text"
                value={matchLocation}
                onChange={e => setMatchLocation(e.target.value)}
                placeholder={t('locationPlaceholder')}
                className="w-full bg-surface-elevated border border-black/[0.08] rounded px-3 py-2 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] text-on-surface-variant uppercase font-label tracking-widest">{t('matchTime')}</label>
              <input
                type="time"
                value={matchTime}
                onChange={e => setMatchTime(e.target.value)}
                className="w-full bg-surface-elevated border border-black/[0.08] rounded px-3 py-2 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] text-on-surface-variant uppercase font-label tracking-widest">{t('competition')}</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={matchCompetition}
                  onChange={e => setMatchCompetition(e.target.value)}
                  placeholder={t('competitionPlaceholder')}
                  className="flex-1 bg-surface-elevated border border-black/[0.08] rounded px-3 py-2 text-xs"
                />
                <QuickSelect
                  options={getOptions('competitions', PRESETS.competitions)}
                  onSelect={(vals) => setMatchCompetition(vals.map(v => t(v)).join(', '))}
                  selectedValues={matchCompetition.split(', ').filter(Boolean)}
                  onDelete={(val) => removeCustomPreset('competitions', val)}
                  isDeletable={(val) => !val.startsWith('#')}
                  onAdd={(val) => addCustomPreset('competitions', val, [])}
                  onMove={(val) => moveCustomPreset('competitions', val, '')}
                />
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Weekly Summary */}
      {(() => {
        const days = getMicrocycleDays();
        const summary = computeMicrocycleSummary(days, restDays, matchDay, sessions);
        return summary.totalDays > 0 ? (
          <div className="flex items-center gap-6 bg-surface rounded-xl border border-black/[0.08] px-5 py-3">
            <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant">{t('weeklySummary')}</span>
            <div className="flex items-center gap-1.5">
              <Dumbbell className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-bold text-on-surface">{summary.trainingDays}</span>
              <span className="text-[9px] text-on-surface-variant">{t('totalTrainingDays')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-bold text-on-surface">{summary.sessionsPlanned}</span>
              <span className="text-[9px] text-on-surface-variant">{t('totalSessions')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Moon className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-xs font-bold text-on-surface">{summary.restDays}</span>
              <span className="text-[9px] text-on-surface-variant">{t('totalRestDays')}</span>
            </div>
            {summary.emptyTrainingDays > 0 && (
              <div className="flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-xs font-bold text-amber-600">{summary.emptyTrainingDays}</span>
                <span className="text-[9px] text-on-surface-variant">{t('emptyDays') || 'sem sessão'}</span>
              </div>
            )}
          </div>
        ) : null;
      })()}

      <div className="overflow-x-auto -mx-2 px-2 pb-4">
      <div className="grid grid-cols-1 gap-4" style={{ gridTemplateColumns: `repeat(${getMicrocycleDays().length}, minmax(200px, 1fr))` }}>
        {getMicrocycleDays().map((dateStr) => {
          const allDays = getMicrocycleDays();
          const isMatch = dateStr === matchDay;
          const mdLabel = getMatchDayLabel(dateStr);
          const dayDate = getDayDate(dateStr);
          const dayKey = getDayKey(dayDate);
          const isToday = dateStr === getTodayDateString();
          const isRestDay = restDays.includes(dateStr);
          const daySessions = sessions.filter(s => s.date === dateStr);
          const mdDiff = computeMdDiff(dateStr, matchDay, allDays);
          const intensity = suggestIntensity(mdDiff, isRestDay);
          
          return (
            <div key={dateStr} className="space-y-0">
              <div className={cn(
                "p-3 rounded-t-xl border-b-2 text-center transition-colors",
                isMatch 
                  ? "bg-yellow-500/10 border-yellow-500" 
                  : isRestDay 
                    ? "bg-blue-500/10 border-blue-400" 
                    : isToday 
                      ? "bg-primary/10 border-primary" 
                      : "bg-surface-elevated border-black/[0.08]"
              )}>
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-widest",
                  isMatch ? "text-yellow-600" : isRestDay ? "text-blue-600" : "text-primary"
                )}>{t(dayKey)}</span>
                <div className={cn(
                  "text-lg font-bold mt-0.5",
                  isMatch ? "text-yellow-600" : isToday ? "text-primary" : "text-on-surface"
                )}>
                  {formatDayDate(dateStr)}
                </div>
                <span className="text-[8px] text-on-surface-variant uppercase tracking-widest">{formatMonthLabel(dateStr)}</span>
                {mdLabel && (
                  <div className={cn(
                    "text-[8px] font-bold uppercase tracking-widest mt-1 rounded-full px-2 py-0.5 inline-block",
                    isMatch ? "bg-yellow-500/20 text-yellow-600" : "bg-primary/10 text-primary"
                  )}>
                    {mdLabel}
                  </div>
                )}
                {matchDay && (
                  <IntensityBar level={intensity} />
                )}
              </div>
              <div className={cn(
                "rounded-b-xl border border-black/[0.06] min-h-[300px] p-3 space-y-3 transition-colors",
                isMatch ? "bg-yellow-500/5" : isRestDay ? "bg-blue-500/5" : "bg-surface"
              )}>
                {daySessions.map(session => (
                  <div key={session.id} onClick={() => setViewingSession(session)} className="bg-surface-elevated p-3 rounded-lg border border-black/[0.08] group cursor-pointer hover:border-primary transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[8px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold uppercase tracking-widest">{parseCategory(session.category).map(c => t(c)).join(', ')}</span>
                      <span className="flex items-center gap-1 text-[9px] text-on-surface-variant">
                        {session.duration && <span>{session.duration}</span>}
                        <Clock className="w-3 h-3" />
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-2">{session.titles?.map(t_ => t(t_)).join(' & ')}</h4>
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="text-[9px] text-on-surface-variant">{session.numAthletes} {t('gks')}</span>
                    </div>
                  </div>
                ))}
                {isMatch ? (
                  <div className="flex flex-col items-center justify-center py-6 text-center space-y-1">
                    <Trophy className="w-8 h-8 text-yellow-500 mb-1" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-yellow-600 px-2 py-0.5 bg-yellow-500/10 rounded-full">{t('matchDayLabel')}</span>
                    
                    {matchOpponent && (
                      <div className="mt-2">
                        <p className="text-[10px] font-black text-on-surface uppercase leading-tight">{matchOpponent}</p>
                        {matchCompetition && <p className="text-[8px] text-on-surface-variant uppercase font-bold">{matchCompetition}</p>}
                      </div>
                    )}
                    
                    {(matchLocation || matchTime) && (
                      <div className="flex flex-col items-center pt-1">
                        {matchLocation && <p className="text-[8px] text-on-surface-variant flex items-center gap-1 uppercase"><span className="opacity-50">📍</span> {matchLocation}</p>}
                        {matchTime && <p className="text-[9px] font-bold text-primary mt-1">{matchTime}</p>}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {isRestDay ? (
                      <div className="flex flex-col items-center justify-center py-10 text-center animate-in fade-in zoom-in duration-300">
                        <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mb-2">
                          <Moon className="w-6 h-6 text-blue-500" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">{t('rest')}</span>
                      </div>
                    ) : (
                      <button
                        aria-label={t('newSession')}
                        onClick={() => {
                          setNewSession(prev => ({ ...prev, date: dateStr }));
                          setActiveTab('Training');
                          setIsAddingSession(true);
                        }} 
                        className="w-full py-4 border border-dashed border-black/[0.08] rounded-xl text-on-surface-variant hover:border-primary hover:text-primary transition-all flex flex-col items-center justify-center gap-1 group bg-black/[0.02]"
                      >
                        <Plus className="w-4 h-4" />
                        <span className="text-[8px] font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">{t('newSession')}</span>
                      </button>
                    )}
                    
                    <button 
                      onClick={() => toggleRestDay(dateStr)}
                      className={cn(
                        "w-full py-2 rounded-lg text-[8px] font-bold uppercase tracking-widest transition-all border",
                        isRestDay 
                          ? "bg-blue-500 text-white border-blue-500 hover:bg-blue-600" 
                          : "bg-surface-elevated text-on-surface-variant border-black/[0.06] hover:bg-blue-500/10 hover:text-blue-600 hover:border-blue-500/20"
                      )}
                    >
                      {isRestDay ? t('removeRestDay') : t('markRestDay')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      </div>

    </div>
  );
});
PlanningTab.displayName = 'PlanningTab';

const INTENSITY_CONFIG: Record<IntensityLevel, { color: string; label: string; width: string }> = {
  recovery: { color: 'bg-blue-400', label: 'Recovery', width: 'w-1/5' },
  low: { color: 'bg-emerald-400', label: 'Low', width: 'w-2/5' },
  medium: { color: 'bg-amber-400', label: 'Medium', width: 'w-3/5' },
  high: { color: 'bg-red-400', label: 'High', width: 'w-4/5' },
  match: { color: 'bg-yellow-500', label: 'Match', width: 'w-full' },
  rest: { color: 'bg-blue-200', label: 'Rest', width: 'w-0' },
};

const IntensityBar: React.FC<{ level: IntensityLevel }> = ({ level }) => {
  const config = INTENSITY_CONFIG[level];
  if (level === 'rest') return null;
  return (
    <div className="mt-1.5 flex items-center gap-1.5 justify-center">
      <div className="w-12 h-1.5 bg-black/[0.04] rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", config.color, config.width)} />
      </div>
      <span className="text-[7px] font-bold uppercase tracking-widest text-on-surface-variant">{config.label}</span>
    </div>
  );
};
