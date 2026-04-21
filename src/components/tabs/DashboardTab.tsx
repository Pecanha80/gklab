import React, { useMemo, useRef, useCallback } from 'react';
import {
  Edit3,
  Clock,
  ChevronRight,
  Calendar,
  Video,
  Users,
  MapPin,
  Trophy,
  Target,
  Zap,
} from 'lucide-react';
import { motion, Reorder } from 'motion/react';
import { cn, getTodayDateString, toDateString } from '../../lib/utils';
import { TrainingSession, PerformanceVideo, Goalkeeper } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';
import { GoalkeeperCard } from '../cards/GoalkeeperCard';
import { VideoCard } from '../cards/VideoCard';
import type { DayKey } from '../../hooks/useMicrocycle';

interface DashboardTabProps {
  sessions: TrainingSession[];
  goalkeepers: Goalkeeper[];
  videos: PerformanceVideo[];
  microcycleName: string;
  matchDay: string | null;
  matchOpponent?: string;
  matchLocation?: string;
  matchTime?: string;
  matchCompetition?: string;
  restDays?: string[];
  getMicrocycleDays: () => string[];
  getDayDate: (dateStr: string) => Date;
  getDayKey: (date: Date) => string;
  setActiveTab: (tab: string) => void;
  setViewingSession: (session: TrainingSession | null) => void;
  onReorderGoalkeepers: (orderedGks: Goalkeeper[]) => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = React.memo(({
  sessions,
  goalkeepers,
  videos,
  microcycleName,
  matchDay,
  matchOpponent,
  matchLocation,
  matchTime,
  matchCompetition,
  restDays = [],
  getMicrocycleDays,
  getDayDate,
  setActiveTab,
  setViewingSession,
  onReorderGoalkeepers,
}) => {
  const { t } = useTranslation();

  // Drag-to-scroll for microcycle timeline
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const el = scrollRef.current;
    if (!el) return;
    isDragging.current = true;
    startX.current = e.pageX - el.offsetLeft;
    scrollLeft.current = el.scrollLeft;
    el.style.cursor = 'grabbing';
    el.style.userSelect = 'none';
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const el = scrollRef.current;
    if (!el) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    el.scrollLeft = scrollLeft.current - walk;
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    const el = scrollRef.current;
    if (el) {
      el.style.cursor = 'grab';
      el.style.userSelect = '';
    }
  }, []);

  // Find today's session, or the next upcoming, or the most recent past session
  const featuredSession = useMemo(() => {
    if (sessions.length === 0) return null;
    const todayStr = getTodayDateString();
    const todaySession = sessions.find(s => s.date === todayStr);
    if (todaySession) return todaySession;
    // Find next upcoming session
    const upcoming = sessions
      .filter(s => s.date > todayStr)
      .sort((a, b) => a.date.localeCompare(b.date));
    if (upcoming.length > 0) return upcoming[0];
    // Fallback: most recent past session
    const past = sessions
      .filter(s => s.date < todayStr)
      .sort((a, b) => b.date.localeCompare(a.date));
    return past[0] || sessions[0];
  }, [sessions]);

  const sessionTimeLabel = useMemo(() => {
    if (!featuredSession) return '';
    const todayStr = getTodayDateString();
    if (featuredSession.date === todayStr) return 'todaysSession';
    if (featuredSession.date > todayStr) return 'nextSession';
    return 'lastSession';
  }, [featuredSession]);

  // Build duration display from the session's duration field
  const durationDisplay = useMemo(() => {
    if (!featuredSession) return '';
    if (featuredSession.time) return featuredSession.time;
    const rawDur = featuredSession.duration;
    if (!rawDur) return '';
    // Handle double-stringified arrays (e.g. "[\"60min\"]")
    let vals: string[];
    if (typeof rawDur === 'string') {
      try {
        const parsed = JSON.parse(rawDur);
        vals = Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        vals = [rawDur];
      }
    } else {
      vals = rawDur;
    }
    return vals
      .map(d => {
        // Try translating as-is and with dur_ prefix
        const asKey = t(d);
        if (asKey !== d) return asKey;
        const withPrefix = t(`dur_${d}`);
        if (withPrefix !== `dur_${d}`) return withPrefix;
        // Fallback: clean up raw value (e.g. "60min" -> "60 min")
        return d.replace(/(\d+)(min)/, '$1 $2');
      })
      .filter(Boolean)
      .join(', ');
  }, [featuredSession, t]);

  // Build focus from session titles (training categories)
  const focusDisplay = useMemo(() => {
    if (!featuredSession) return [];
    if (featuredSession.focus && featuredSession.focus.length > 0) return featuredSession.focus;
    return featuredSession.titles?.map(title => t(title)) || [];
  }, [featuredSession, t]);

  // Build attending from goalkeepers if session has no attending data
  const attendingGks = useMemo(() => {
    if (!featuredSession) return [];
    if (featuredSession.attending && featuredSession.attending.length > 0) {
      // Resolve IDs to goalkeeper objects
      return featuredSession.attending
        .map(idOrName => goalkeepers.find(gk => gk.id === idOrName || gk.name === idOrName))
        .filter(Boolean) as Goalkeeper[];
    }
    return goalkeepers;
  }, [featuredSession, goalkeepers]);

  return (
    <div className="space-y-10 animate-in">
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-9 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-3xl font-black text-on-surface tracking-tight">
                {t('trainingSchedule')}
              </h3>
              {microcycleName && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-lg border border-white/[0.06]">
                    {microcycleName}
                  </span>
                  <span className="text-xs text-on-surface-variant font-medium tracking-wide">{t('microcyclePhase')}</span>
                </div>
              )}
            </div>
            <button 
              onClick={() => setActiveTab('Planning')} 
              className="button-primary flex items-center gap-2 shadow-premium"
            >
              <Edit3 className="w-4 h-4" />
              <span>{t('modifyPlan')}</span>
            </button>
          </div>

          {getMicrocycleDays().length > 0 ? (
            <div
              ref={scrollRef}
              className="overflow-x-auto -mx-2 px-2 pb-4 cursor-grab select-none"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{ scrollbarWidth: 'thin' }}
            >
              <div className="flex gap-4 min-w-max">
                {getMicrocycleDays().map((day) => {
                  const dateStr = day;
                  const dayDate = getDayDate(day);
                  const todayStr = getTodayDateString();
                  const isDayToday = dateStr === todayStr;
                  const isMatch = dateStr === matchDay;
                  const isRestDay = restDays.includes(dateStr);
                  const daySessions = sessions.filter(s => s.date === dateStr);

                  return (
                    <div
                      key={day}
                      className={cn(
                        "p-5 rounded-2xl transition-all duration-300 w-[200px] flex flex-col relative group shrink-0",
                        isMatch
                          ? "bg-yellow-500/10 border border-yellow-500/30 shadow-[0_0_20px_rgba(234,179,8,0.1)]"
                          : isRestDay
                            ? "bg-white/[0.03] border border-white/[0.04] opacity-60"
                            : isDayToday
                              ? "bg-white/[0.08] border border-accent/40 shadow-[0_0_20px_rgba(124,92,252,0.1)]"
                              : "glass-card hover:border-white/[0.1]"
                      )}
                    >
                      {isDayToday && (
                        <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-accent animate-pulse" />
                      )}

                      {/* Date header */}
                      <div className="flex items-end justify-between mb-3">
                        <div className="flex flex-col">
                          <span className={cn(
                            "text-[10px] font-bold uppercase tracking-wide",
                            isMatch ? "text-yellow-500" : isDayToday ? "text-accent" : "text-on-surface-variant/50"
                          )}>
                            {new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(dayDate)}
                          </span>
                          <span className={cn(
                            "text-2xl font-black tracking-tighter leading-none",
                            isMatch ? "text-yellow-500" : isDayToday ? "text-on-surface" : "text-on-surface"
                          )}>
                            {dayDate.getDate()}
                          </span>
                        </div>
                        <span className="text-[9px] text-on-surface-variant/40 font-medium">
                          {new Intl.DateTimeFormat(undefined, { month: 'short' }).format(dayDate)}
                        </span>
                      </div>

                      {/* Events */}
                      <div className="flex-1 space-y-2">
                        {/* Match day info */}
                        {isMatch && (
                          <div className="space-y-2 bg-yellow-500/5 rounded-xl p-2.5 border border-yellow-500/10">
                            <span className="text-[9px] font-black uppercase bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded-md block w-fit">MATCH DAY</span>
                            {matchOpponent && (
                              <p className="text-xs font-bold text-on-surface leading-tight">vs {matchOpponent}</p>
                            )}
                            {matchCompetition && (
                              <div className="flex items-center gap-1.5 text-[10px] text-on-surface-variant">
                                <Trophy className="w-3 h-3 text-yellow-500/70" />
                                <span>{matchCompetition}</span>
                              </div>
                            )}
                            {matchLocation && (
                              <div className="flex items-center gap-1.5 text-[10px] text-on-surface-variant">
                                <MapPin className="w-3 h-3 text-yellow-500/70" />
                                <span>{matchLocation}</span>
                              </div>
                            )}
                            {matchTime && (
                              <div className="flex items-center gap-1.5 text-[10px] text-on-surface-variant">
                                <Clock className="w-3 h-3 text-yellow-500/70" />
                                <span>{matchTime}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Session cards with full info */}
                        {daySessions.map(s => {
                          const sessionDuration = Array.isArray(s.duration)
                            ? s.duration.map(d => t(d)).join(', ')
                            : t(s.duration) !== s.duration ? t(s.duration) : s.duration;
                          const sessionCategories = Array.isArray(s.category) ? s.category : [s.category];

                          return (
                            <div
                              key={s.id}
                              className="flex flex-col gap-1.5 bg-white/[0.03] rounded-xl p-2.5 border border-white/[0.04] hover:border-accent/20 transition-colors cursor-pointer"
                              onClick={() => setViewingSession(s)}
                            >
                              {/* Title */}
                              <p className="text-[11px] font-bold text-on-surface leading-tight">
                                {s.titles?.map(t_ => t(t_)).join(' & ')}
                              </p>

                              {/* Duration + Athletes */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <div className="flex items-center gap-1 text-[9px] text-on-surface-variant font-medium">
                                  <Clock className="w-3 h-3 text-accent/60" />
                                  {sessionDuration}
                                </div>
                                {s.numAthletes > 0 && (
                                  <div className="flex items-center gap-1 text-[9px] text-on-surface-variant font-medium">
                                    <Users className="w-3 h-3 text-accent/60" />
                                    {s.numAthletes}
                                  </div>
                                )}
                              </div>

                              {/* Categories */}
                              <div className="flex flex-wrap gap-1">
                                {sessionCategories.slice(0, 2).map(cat => (
                                  <span key={cat} className="text-[8px] font-bold uppercase tracking-wider text-accent/80 bg-accent/10 px-1.5 py-0.5 rounded">
                                    {t(cat)}
                                  </span>
                                ))}
                              </div>

                              {/* General Objectives (first 2) */}
                              {s.generalObjectives?.length > 0 && (
                                <div className="flex items-start gap-1 mt-0.5">
                                  <Target className="w-3 h-3 text-success/60 mt-0.5 shrink-0" />
                                  <p className="text-[9px] text-on-surface-variant leading-tight line-clamp-2">
                                    {s.generalObjectives.slice(0, 2).map(o => t(o)).join(', ')}
                                  </p>
                                </div>
                              )}

                              {/* Exercise count */}
                              {(s.exercises?.length > 0 || s.warmup?.length > 0) && (
                                <div className="flex items-center gap-1 text-[9px] text-on-surface-variant/60 font-medium">
                                  <Zap className="w-3 h-3" />
                                  {(s.warmup?.length || 0) + (s.exercises?.length || 0)} {t('exercises')}
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* Rest day */}
                        {isRestDay && !isMatch && daySessions.length === 0 && (
                          <div className="flex items-center justify-center py-4">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/30">OFF</span>
                          </div>
                        )}

                        {/* Empty day */}
                        {!isRestDay && !isMatch && daySessions.length === 0 && (
                          <div className="flex items-center justify-center py-4">
                            <span className="text-[10px] text-on-surface-variant/20">—</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="glass-card rounded-2xl border-dashed border-white/10 p-12 text-center">
              <Calendar className="w-12 h-12 text-on-surface-variant/20 mx-auto mb-4" />
              <p className="text-base text-on-surface-variant/60 font-medium">{t('noMicrocycleYet')}</p>
              <button 
                onClick={() => setActiveTab('Planning')} 
                className="mt-4 text-primary text-sm font-black uppercase tracking-widest hover:text-primary-dim transition-colors"
              >
                {t('createFirstMicrocycle')}
              </button>
            </div>
          )}

          {featuredSession ? (
            <div className="glass-card rounded-2xl overflow-hidden relative min-h-[340px] group border-white/[0.06]">
              <div className="absolute inset-0 z-0">
                {featuredSession.imageUrl ? (
                  <img
                    src={featuredSession.imageUrl}
                    alt={t(sessionTimeLabel)}
                    className="w-full h-full object-cover opacity-30 grayscale transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0 group-hover:opacity-40"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/10 to-transparent" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />
              </div>

              <div className="relative z-10 p-10 h-full flex flex-col">
                <div className="flex items-center gap-3 mb-6">
                  <span className={cn(
                    "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg",
                    sessionTimeLabel === 'todaysSession' ? "bg-primary text-white" :
                    sessionTimeLabel === 'nextSession' ? "bg-secondary text-white" : "bg-white/10 text-on-surface-variant backdrop-blur-md"
                  )}>
                    {t(sessionTimeLabel)}
                  </span>
                  {durationDisplay && (
                    <div className="px-4 py-1.5 rounded-full bg-white/5 backdrop-blur-md text-white border border-white/10 flex items-center gap-2">
                       <Clock className="w-3 h-3 text-secondary" />
                       <span className="text-[10px] font-black tracking-widest uppercase">{durationDisplay}</span>
                    </div>
                  )}
                </div>

                <div className="max-w-2xl space-y-4">
                  <h4 className="text-5xl font-black text-on-surface tracking-tighter leading-[0.9]">
                    {featuredSession.titles?.map(title => t(title)).join(' & ') || ''}
                  </h4>
                  <p className="text-lg text-on-surface-variant font-medium leading-relaxed max-w-xl">
                    {featuredSession.generalObjectives?.map(o => t(o)).join(', ')}
                  </p>
                </div>

                <div className="mt-auto pt-8 flex items-center justify-between">
                  <div className="flex items-center gap-8">
                    {focusDisplay.length > 0 && (
                      <div className="flex gap-2">
                        {focusDisplay.map(f => (
                          <span key={f} className="text-[10px] font-black uppercase tracking-widest text-primary/80 bg-primary/10 px-3 py-1 rounded-lg border border-primary/10">
                            {f}
                          </span>
                        ))}
                      </div>
                    )}
                    {attendingGks.length > 0 && (
                      <div className="flex items-center gap-3">
                        <div className="flex -space-x-3">
                          {attendingGks.slice(0, 4).map((gk, i) => (
                            <div key={gk.id || i} className="w-10 h-10 rounded-2xl border-2 border-background overflow-hidden shadow-xl ring-2 ring-white/5">
                              {gk.imageUrl ? (
                                <img src={gk.imageUrl} alt={gk.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <div className="w-full h-full bg-surface-elevated flex items-center justify-center text-xs font-black text-on-surface-variant/50">
                                  {gk.name.split(' ')[0].slice(0, 2).toUpperCase()}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        <span className="text-[10px] font-black text-on-surface-variant/40 uppercase tracking-widest">
                          {attendingGks.length} {t('activeGKs')}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-4">
                    <button 
                      onClick={() => setViewingSession(featuredSession)} 
                      className="button-primary px-8 shadow-premium"
                    >
                      {t('viewDrillPack')}
                    </button>
                    <button 
                      onClick={() => setActiveTab('Training')} 
                      className="px-8 py-3 rounded-xl bg-white/5 border border-white/10 text-on-surface font-bold text-sm hover:bg-white/10 transition-all backdrop-blur-md"
                    >
                      {t('setTargets')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : sessions.length === 0 && (
            <div className="glass-card rounded-2xl p-16 text-center border-dashed border-white/10">
              <Calendar className="w-16 h-16 text-on-surface-variant/20 mx-auto mb-4" />
              <p className="text-lg text-on-surface-variant/60 font-medium">{t('noTrainingSessions')}</p>
              <button 
                onClick={() => setActiveTab('Training')} 
                className="button-primary mt-6 px-10 shadow-premium"
              >
                {t('createFirstSession')}
              </button>
            </div>
          )}
        </div>

        <div className="lg:col-span-3 space-y-8">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-bold text-on-surface tracking-tight">{t('goalkeepersStatus')}</h3>
            <button 
              onClick={() => setActiveTab('Goalkeepers')} 
              className="text-primary text-[11px] font-black uppercase tracking-widest hover:text-primary-dim transition-colors"
            >
              {t('viewAll')}
            </button>
          </div>
          
          <Reorder.Group
            axis="y"
            values={goalkeepers}
            onReorder={onReorderGoalkeepers}
            className="space-y-4"
          >
            {goalkeepers.map(keeper => (
              <Reorder.Item
                key={keeper.id}
                value={keeper}
                className="select-none cursor-grab active:cursor-grabbing transform transition-transform hover:scale-[1.02]"
              >
                <GoalkeeperCard keeper={keeper} />
              </Reorder.Item>
            ))}
            {goalkeepers.length === 0 && (
              <div className="glass-card rounded-2xl p-8 text-center border-dashed border-white/5">
                <Users className="w-8 h-8 text-on-surface-variant/20 mx-auto mb-3" />
                <p className="text-xs text-on-surface-variant/40 font-medium">{t('noGoalkeepers')}</p>
              </div>
            )}
          </Reorder.Group>

          <div className="glass-card p-8 rounded-2xl border-white/[0.06] relative overflow-hidden bg-gradient-to-br from-primary/5 to-transparent">
            <div className="absolute -top-6 -right-6 opacity-[0.03]">
              <Edit3 className="w-24 h-24" />
            </div>
            <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4">{t('tacticalDirective')}</h4>
            
            <div className="relative z-10 flex gap-4">
              <div className="w-1 bg-primary/20 rounded-full" />
              <div>
                {featuredSession?.observations?.adjustments && (
                  Array.isArray(featuredSession.observations.adjustments)
                    ? featuredSession.observations.adjustments
                    : [featuredSession.observations.adjustments]
                ).filter(Boolean).length > 0 ? (
                  <p className="text-sm font-medium leading-relaxed text-on-surface italic">
                    "{(Array.isArray(featuredSession!.observations.adjustments)
                      ? featuredSession!.observations.adjustments
                      : [featuredSession!.observations.adjustments]
                    ).filter(Boolean).join('. ')}"
                  </p>
                ) : (
                  <p className="text-sm text-on-surface-variant/60 italic leading-relaxed">
                    {t('tacticalDirectiveText')}
                  </p>
                )}
                <div className="mt-6 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
                  <p className="text-[9px] text-on-surface-variant font-black uppercase tracking-widest">{t('updatedRecently')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-8">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-4">
            <h3 className="text-2xl font-black text-on-surface tracking-tight">{t('recentAnalysis')}</h3>
            <span className="px-3 py-1 rounded-lg bg-secondary/10 text-secondary text-[10px] font-black uppercase tracking-widest border border-secondary/20">{t('videoCenter')}</span>
          </div>
          <button 
            onClick={() => setActiveTab('Videos')} 
            className="flex items-center gap-1 text-on-surface-variant/60 hover:text-primary text-[11px] font-black uppercase tracking-[0.1em] transition-colors group"
          >
            {t('viewAllFootage')}
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
        
        {videos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {videos.slice(0, 4).map(video => (
              <div key={video.id} className="transform transition-all hover:scale-[1.05]">
                <VideoCard video={video} />
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card rounded-2xl p-16 text-center border-dashed border-white/5">
            <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Video className="w-8 h-8 text-on-surface-variant/20" />
            </div>
            <p className="text-base text-on-surface-variant/60 font-medium">{t('noVideosYetDashboard')}</p>
            <p className="text-xs text-on-surface-variant/30 mt-2 max-w-[200px] mx-auto uppercase tracking-widest font-bold">{t('trainingFootageHint')}</p>
          </div>
        )}
      </section>
    </div>
  );
});
DashboardTab.displayName = 'DashboardTab';
