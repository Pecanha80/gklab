import React from 'react';
import {
  Edit3,
  Clock,
  ChevronRight,
  Calendar,
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
                const isToday = dateStr === todayStr;
                const isMatch = dayKey === matchDay;
                const daySessions = sessions.filter(s => s.date === dateStr);
                return (
                  <div
                    key={dayKey}
                    className={cn(
                      "p-3 rounded-lg border-t-2 transition-all",
                      isMatch ? "bg-yellow-500/10 border-yellow-500" : isToday ? "bg-surface-container-high border-primary ring-1 ring-primary/20" : "bg-surface-container border-black/5"
                    )}
                  >
                    <p className={cn("text-[10px] font-label uppercase mb-1", isMatch ? "text-yellow-600" : isToday ? "text-primary" : "text-on-surface-variant")}>
                      {t(dayKey)} {isToday && `(${t('today')})`}
                    </p>
                    <p className={cn("text-lg font-bold", isMatch ? "text-yellow-600" : isToday ? "text-primary" : "text-on-surface")}>
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

          {sessions.length > 0 && (
            <div className="bg-surface-container-low rounded-xl overflow-hidden border border-black/5">
              <div className="grid grid-cols-1 md:grid-cols-3">
                <div className="h-48 md:h-full relative overflow-hidden">
                  <img
                    src={sessions[0].imageUrl}
                    alt="Training"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <span className="bg-primary/90 text-on-primary text-[10px] px-2 py-1 font-bold rounded mb-1 inline-block">{t('liveSession')}</span>
                    <h4 className="text-xl font-black font-headline">{sessions[0].titles?.[0] || ''}</h4>
                  </div>
                </div>
                <div className="md:col-span-2 p-6 space-y-6">
                  <div className="flex flex-wrap items-center gap-8">
                    <div>
                      <p className="text-[10px] text-on-surface-variant font-label uppercase">{t('time')}</p>
                      <p className="text-sm font-bold flex items-center"><Clock className="w-3 h-3 mr-1 text-primary" /> {sessions[0].time}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-on-surface-variant font-label uppercase">{t('focus')}</p>
                      <div className="flex gap-2 mt-1">
                        {sessions[0].focus?.map(f => (
                          <span key={f} className="text-[10px] bg-surface-container-highest px-2 py-0.5 rounded text-secondary">{f}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] text-on-surface-variant font-label uppercase">{t('attending')}</p>
                      <div className="flex -space-x-2 mt-1">
                        {sessions[0].attending?.map((a, i) => (
                          <div key={i} className="w-6 h-6 rounded-full border-2 border-surface-container bg-surface-variant flex items-center justify-center text-[8px] font-bold">
                            {a}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <p className="text-xs text-on-surface-variant font-body leading-relaxed">{sessions[0].generalObjectives?.map(o => t(o as any)).join(', ')}</p>
                    <div className="flex gap-3">
                      <button onClick={() => setViewingSession(sessions[0])} className="bg-surface-container-highest border border-black/5 hover:bg-black/10 text-on-surface px-4 py-2 rounded-md font-label text-[11px] font-bold transition-all">{t('viewDrillPack')}</button>
                      <button onClick={() => setActiveTab('Training')} className="bg-secondary/10 text-secondary border border-secondary/20 hover:bg-secondary/20 px-4 py-2 rounded-md font-label text-[11px] font-bold transition-all">{t('setTargets')}</button>
                    </div>
                  </div>
                </div>
              </div>
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
          </div>

          <div className="glass-card p-6 rounded-xl border border-black/10 relative overflow-hidden">
            <div className="absolute -top-4 -right-4 opacity-5">
              <Edit3 className="w-24 h-24" />
            </div>
            <h4 className="text-xs font-label text-primary uppercase tracking-widest mb-3">{t('tacticalDirective')}</h4>
            <p className="text-sm font-headline italic leading-relaxed text-on-surface relative z-10">
              "Focus on Marcus's footwork when shifting across the goal line. He is leaning 15cm too far forward on lateral shots."
            </p>
            <div className="mt-4 flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
              <p className="text-[10px] text-on-surface-variant uppercase font-label">Updated 2h ago</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {videos.map(video => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      </section>
    </div>
  );
};
