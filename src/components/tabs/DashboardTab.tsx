import React, { useMemo } from 'react';
import {
  Edit3,
  Clock,
  ChevronRight,
  Calendar,
  Video,
  Users,
} from 'lucide-react';
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
  matchDay: DayKey | '';
  getMicrocycleDays: () => readonly DayKey[];
  getDayDate: (dayKey: DayKey) => Date;
  setActiveTab: (tab: string) => void;
  setViewingSession: (session: TrainingSession | null) => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  sessions,
  goalkeepers,
  videos,
  microcycleName,
  matchDay,
  getMicrocycleDays,
  getDayDate,
  setActiveTab,
  setViewingSession,
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
    <div className="space-y-8">
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold font-headline tracking-tight">
              {t('trainingSchedule')}
              {microcycleName && <span className="text-on-surface-variant font-medium text-lg ml-2">{microcycleName}</span>}
            </h3>
            <button onClick={() => setActiveTab('Planning')} className="bg-primary hover:bg-primary-dim text-on-primary px-4 py-2 rounded-md font-label text-xs font-bold transition-all active:scale-95 flex items-center">
              <Edit3 className="w-3 h-3 mr-2" />
              {t('modifyPlan')}
            </button>
          </div>

          {getMicrocycleDays().length > 0 ? (
            <div className="overflow-x-auto -mx-2 px-2 pb-2">
            <div className="grid grid-cols-2 md:grid-cols-7 gap-2" style={{ gridTemplateColumns: `repeat(${getMicrocycleDays().length}, minmax(120px, 1fr))` }}>
              {getMicrocycleDays().map((dayKey) => {
                const dayDate = getDayDate(dayKey);
                const dateStr = toDateString(dayDate);
                const todayStr = getTodayDateString();
                const isDayToday = dateStr === todayStr;
                const isMatch = dayKey === matchDay;
                const daySessions = sessions.filter(s => s.date === dateStr);
                return (
                  <div
                    key={dayKey}
                    className={cn(
                      "p-3 rounded-lg border-t-2 transition-all",
                      isMatch ? "bg-yellow-500/10 border-yellow-500" : isDayToday ? "bg-surface-container-high border-primary ring-1 ring-primary/20" : "bg-surface-container border-black/5"
                    )}
                  >
                    <p className={cn("text-[10px] font-label uppercase mb-1", isMatch ? "text-yellow-600" : isDayToday ? "text-primary" : "text-on-surface-variant")}>
                      {t(dayKey)} {isDayToday && `(${t('today')})`}
                    </p>
                    <p className={cn("text-lg font-bold", isMatch ? "text-yellow-600" : isDayToday ? "text-primary" : "text-on-surface")}>
                      {dayDate.getDate()}
                    </p>
                    {isMatch && (
                      <span className="text-[8px] font-bold uppercase text-yellow-600">{t('matchDayLabel')}</span>
                    )}
                    {daySessions.map(s => (
                      <p key={s.id} className="text-[10px] font-bold text-on-surface mt-1 truncate">{s.titles?.map(t_ => t(t_ as any)).join(' & ')}</p>
                    ))}
                    {!isMatch && daySessions.length === 0 && (
                      <p className="text-[10px] text-on-surface-variant mt-1">—</p>
                    )}
                  </div>
                );
              })}
            </div>
            </div>
          ) : (
            <div className="bg-surface-container rounded-xl border border-dashed border-black/10 p-8 text-center">
              <Calendar className="w-8 h-8 text-on-surface-variant/30 mx-auto mb-3" />
              <p className="text-sm text-on-surface-variant">{t('noMicrocycleYet' as any)}</p>
              <button onClick={() => setActiveTab('Planning')} className="mt-3 text-primary text-xs font-bold uppercase hover:underline">
                {t('createFirstMicrocycle' as any)}
              </button>
            </div>
          )}

          {featuredSession ? (
            <div className="bg-surface-container-low rounded-xl overflow-hidden border border-black/5">
              <div className="grid grid-cols-1 md:grid-cols-3">
                <div className="h-48 md:h-full relative overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20">
                  {featuredSession.imageUrl ? (
                    <img
                      src={featuredSession.imageUrl}
                      alt={t('todaysSession' as any)}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Calendar className="w-16 h-16 text-primary/30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <span className={cn(
                      "text-on-primary text-[10px] px-2 py-1 font-bold rounded mb-1 inline-block",
                      sessionTimeLabel === 'todaysSession' ? "bg-primary/90" :
                      sessionTimeLabel === 'nextSession' ? "bg-secondary/90" : "bg-on-surface-variant/80"
                    )}>
                      {t(sessionTimeLabel as any)}
                    </span>
                    <h4 className="text-xl font-black font-headline">
                      {featuredSession.titles?.map(title => t(title as any)).join(' & ') || ''}
                    </h4>
                  </div>
                </div>
                <div className="md:col-span-2 p-6 space-y-6">
                  <div className="flex flex-wrap items-center gap-8">
                    {durationDisplay && (
                      <div>
                        <p className="text-[10px] text-on-surface-variant font-label uppercase">{t('sessionDuration' as any)}</p>
                        <p className="text-sm font-bold flex items-center"><Clock className="w-3 h-3 mr-1 text-primary" /> {durationDisplay}</p>
                      </div>
                    )}
                    {focusDisplay.length > 0 && (
                      <div>
                        <p className="text-[10px] text-on-surface-variant font-label uppercase">{t('focus')}</p>
                        <div className="flex gap-2 mt-1 flex-wrap">
                          {focusDisplay.map(f => (
                            <span key={f} className="text-[10px] bg-surface-container-highest px-2 py-0.5 rounded text-secondary">{f}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {attendingDisplay.length > 0 && (
                      <div>
                        <p className="text-[10px] text-on-surface-variant font-label uppercase">{t('attending')}</p>
                        <div className="flex -space-x-2 mt-1">
                          {attendingDisplay.map((a, i) => (
                            <div key={i} className="w-6 h-6 rounded-full border-2 border-surface-container bg-surface-variant flex items-center justify-center text-[8px] font-bold">
                              {a}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    <p className="text-xs text-on-surface-variant font-body leading-relaxed">{featuredSession.generalObjectives?.map(o => t(o as any)).join(', ')}</p>
                    <div className="flex gap-3">
                      <button onClick={() => setViewingSession(featuredSession)} className="bg-surface-container-highest border border-black/5 hover:bg-black/10 text-on-surface px-4 py-2 rounded-md font-label text-[11px] font-bold transition-all">{t('viewDrillPack')}</button>
                      <button onClick={() => setActiveTab('Training')} className="bg-secondary/10 text-secondary border border-secondary/20 hover:bg-secondary/20 px-4 py-2 rounded-md font-label text-[11px] font-bold transition-all">{t('setTargets')}</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : sessions.length === 0 && (
            <div className="bg-surface-container rounded-xl border border-dashed border-black/10 p-8 text-center">
              <Calendar className="w-8 h-8 text-on-surface-variant/30 mx-auto mb-3" />
              <p className="text-sm text-on-surface-variant">{t('noTrainingSessions')}</p>
              <button onClick={() => setActiveTab('Training')} className="mt-3 text-primary text-xs font-bold uppercase hover:underline">
                {t('createFirstSession')}
              </button>
            </div>
          )}
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold font-headline tracking-tight">{t('goalkeepersStatus')}</h3>
            <button onClick={() => setActiveTab('Goalkeepers')} className="text-primary text-xs font-label hover:underline">{t('viewAll')}</button>
          </div>
          <div className="space-y-4">
            {goalkeepers.map(keeper => (
              <GoalkeeperCard key={keeper.id} keeper={keeper} />
            ))}
            {goalkeepers.length === 0 && (
              <div className="bg-surface-container rounded-xl border border-dashed border-black/10 p-6 text-center">
                <Users className="w-6 h-6 text-on-surface-variant/30 mx-auto mb-2" />
                <p className="text-xs text-on-surface-variant">{t('noGoalkeepers' as any)}</p>
              </div>
            )}
          </div>

          <div className="glass-card p-6 rounded-xl border border-black/10 relative overflow-hidden">
            <div className="absolute -top-4 -right-4 opacity-5">
              <Edit3 className="w-24 h-24" />
            </div>
            <h4 className="text-xs font-label text-primary uppercase tracking-widest mb-3">{t('tacticalDirective')}</h4>
            {featuredSession?.observations?.adjustments && (
              Array.isArray(featuredSession.observations.adjustments)
                ? featuredSession.observations.adjustments
                : [featuredSession.observations.adjustments]
            ).filter(Boolean).length > 0 ? (
              <p className="text-sm font-headline italic leading-relaxed text-on-surface relative z-10">
                "{(Array.isArray(featuredSession!.observations.adjustments)
                  ? featuredSession!.observations.adjustments
                  : [featuredSession!.observations.adjustments]
                ).filter(Boolean).join('. ')}"
              </p>
            ) : (
              <p className="text-sm text-on-surface-variant italic leading-relaxed relative z-10">
                {t('tacticalDirectiveText' as any)}
              </p>
            )}
            <div className="mt-4 flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
              <p className="text-[10px] text-on-surface-variant uppercase font-label">{t('updatedRecently' as any)}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold font-headline tracking-tight">{t('recentAnalysis')}</h3>
          <button onClick={() => setActiveTab('Videos')} className="text-secondary text-sm font-label flex items-center hover:underline">
            {t('viewAllFootage')}
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>
        {videos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {videos.map(video => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        ) : (
          <div className="bg-surface-container rounded-xl border border-dashed border-black/10 p-8 text-center">
            <Video className="w-8 h-8 text-on-surface-variant/30 mx-auto mb-3" />
            <p className="text-sm text-on-surface-variant">{t('noVideosYetDashboard' as any)}</p>
            <p className="text-xs text-on-surface-variant/60 mt-1">{t('noVideosYetDashboardDesc' as any)}</p>
          </div>
        )}
      </section>
    </div>
  );
};
