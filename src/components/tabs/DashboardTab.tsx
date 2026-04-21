import React, { useMemo } from 'react';
import {
  Edit3,
  Clock,
  ChevronRight,
  Calendar,
  Video,
  Users,
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

export const DashboardTab: React.FC<DashboardTabProps> = ({
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
        const asKey = t(d as any);
        if (asKey !== d) return asKey;
        const withPrefix = t(`dur_${d}` as any);
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
    return featuredSession.titles?.map(title => t(title as any)) || [];
  }, [featuredSession, t]);

  // Build attending from goalkeepers if session has no attending data
  const attendingDisplay = useMemo(() => {
    if (!featuredSession) return [];
    if (featuredSession.attending && featuredSession.attending.length > 0) return featuredSession.attending;
    return goalkeepers.map(gk => gk.name.split(' ')[0].slice(0, 2).toUpperCase());
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
                  <span className="text-sm font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-lg border border-primary/20">
                    {microcycleName}
                  </span>
                  <span className="text-xs text-on-surface-variant font-medium tracking-wide">Microcycle Phase</span>
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
            <div className="overflow-x-auto -mx-2 px-2 pb-4 scrollbar-thin">
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
                        "p-5 rounded-3xl transition-all duration-300 w-[150px] flex flex-col relative group",
                        isMatch 
                          ? "bg-yellow-500/10 border border-yellow-500/30 shadow-[0_0_20px_rgba(234,179,8,0.1)]" 
                          : isRestDay 
                            ? "bg-white/5 border border-white/5 opacity-60" 
                            : isDayToday 
                              ? "bg-white/10 border border-white/60 shadow-[0_0_25px_rgba(255,255,255,0.1)]" 
                              : "glass-card border border-primary/40 hover:bg-white/10 hover:border-primary"
                      )}
                    >
                      {isDayToday && (
                        <div className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                      )}
                      
                      <div className="flex flex-col mb-4">
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-[0.1em]",
                          isMatch ? "text-yellow-500" : isDayToday ? "text-primary" : "text-on-surface-variant/40"
                        )}>
                          {new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(dayDate)}
                        </span>
                        <span className={cn(
                          "text-3xl font-black tracking-tighter",
                          isMatch ? "text-yellow-500" : isDayToday ? "text-primary" : "text-on-surface"
                        )}>
                          {dayDate.getDate()}
                        </span>
                      </div>
                      
                      <div className="flex-1 space-y-2">
                        {isMatch && (
                          <div className="space-y-1">
                            <span className="text-[9px] font-black uppercase bg-yellow-500/20 text-yellow-600 px-2 py-0.5 rounded-lg border border-yellow-500/20 block w-fit">MATCH</span>
                            {matchOpponent && (
                              <p className="text-[11px] font-bold text-on-surface leading-tight truncate">Vs. {matchOpponent}</p>
                            )}
                          </div>
                        )}
                        
                        {daySessions.map(s => (
                          <div key={s.id} className="flex flex-col gap-1">
                            <p className="text-[10px] font-bold text-on-surface truncate bg-white/5 px-2 py-1 rounded-lg border border-white/5">
                              {s.titles?.map(t_ => t(t_ as any)).join(' & ')}
                            </p>
                            <div className="flex items-center gap-1 text-[8px] text-on-surface-variant/60 font-bold ml-1">
                              <Clock className="w-2.5 h-2.5" />
                              {s.duration}
                            </div>
                          </div>
                        ))}
                        
                        {isRestDay && (
                          <span className="text-[9px] font-black uppercase text-secondary/60">OFF</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="glass-card rounded-[2.5rem] border-dashed border-white/10 p-12 text-center">
              <Calendar className="w-12 h-12 text-on-surface-variant/20 mx-auto mb-4" />
              <p className="text-base text-on-surface-variant/60 font-medium">{t('noMicrocycleYet' as any)}</p>
              <button 
                onClick={() => setActiveTab('Planning')} 
                className="mt-4 text-primary text-sm font-black uppercase tracking-widest hover:text-primary-dim transition-colors"
              >
                {t('createFirstMicrocycle' as any)}
              </button>
            </div>
          )}

          {featuredSession ? (
            <div className="glass-card rounded-[2.5rem] overflow-hidden relative min-h-[340px] group border-primary/50">
              <div className="absolute inset-0 z-0">
                {featuredSession.imageUrl ? (
                  <img
                    src={featuredSession.imageUrl}
                    alt={t(sessionTimeLabel as any)}
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
                    {t(sessionTimeLabel as any)}
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
                    {featuredSession.titles?.map(title => t(title as any)).join(' & ') || ''}
                  </h4>
                  <p className="text-lg text-on-surface-variant font-medium leading-relaxed max-w-xl">
                    {featuredSession.generalObjectives?.map(o => t(o as any)).join(', ')}
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
                    {attendingDisplay.length > 0 && (
                      <div className="flex items-center gap-3">
                        <div className="flex -space-x-3">
                          {attendingDisplay.slice(0, 4).map((a, i) => (
                            <div key={i} className="w-10 h-10 rounded-2xl border-2 border-background bg-surface-container-highest flex items-center justify-center text-xs font-black shadow-xl ring-2 ring-white/5">
                              {a}
                            </div>
                          ))}
                        </div>
                        <span className="text-[10px] font-black text-on-surface-variant/40 uppercase tracking-widest">
                          {attendingDisplay.length} Active GKs
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
            <div className="glass-card rounded-[2.5rem] p-16 text-center border-dashed border-white/10">
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
              <div className="glass-card rounded-[2rem] p-8 text-center border-dashed border-white/5">
                <Users className="w-8 h-8 text-on-surface-variant/20 mx-auto mb-3" />
                <p className="text-xs text-on-surface-variant/40 font-medium">{t('noGoalkeepers' as any)}</p>
              </div>
            )}
          </Reorder.Group>

          <div className="glass-card p-8 rounded-[2rem] border-primary/20 relative overflow-hidden bg-gradient-to-br from-primary/5 to-transparent">
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
                    {t('tacticalDirectiveText' as any)}
                  </p>
                )}
                <div className="mt-6 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
                  <p className="text-[9px] text-on-surface-variant font-black uppercase tracking-widest">{t('updatedRecently' as any)}</p>
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
            <span className="px-3 py-1 rounded-lg bg-secondary/10 text-secondary text-[10px] font-black uppercase tracking-widest border border-secondary/20">Video Center</span>
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
          <div className="glass-card rounded-[2.5rem] p-16 text-center border-dashed border-white/5">
            <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Video className="w-8 h-8 text-on-surface-variant/20" />
            </div>
            <p className="text-base text-on-surface-variant/60 font-medium">{t('noVideosYetDashboard' as any)}</p>
            <p className="text-xs text-on-surface-variant/30 mt-2 max-w-[200px] mx-auto uppercase tracking-widest font-bold">Training footage will appear here</p>
          </div>
        )}
      </section>
    </div>
  );
};
