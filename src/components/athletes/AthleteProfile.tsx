import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, User, Heart, Activity, Calendar, FileText, Star } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTranslation } from '../../hooks/useTranslation';
import { useWellness } from '../../hooks/useWellness';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import type { Goalkeeper, TrainingSession, Attendance, WellnessLog } from '../../types';
import { AthleteOverview } from './AthleteOverview';
import { AthleteWellness } from './AthleteWellness';
import { AthleteLoad } from './AthleteLoad';
import { AthleteTrainingHistory } from './AthleteTrainingHistory';
import { AthleteNotes } from './AthleteNotes';
import { AthleteAssessment } from './AthleteAssessment';

interface AthleteProfileProps {
  goalkeeper: Goalkeeper;
  onBack: () => void;
  onUpdate: (gk: Goalkeeper) => Promise<void>;
}

type ProfileTab = 'overview' | 'wellness' | 'load' | 'history' | 'notes' | 'assessment';

export const AthleteProfile: React.FC<AthleteProfileProps> = ({ goalkeeper, onBack, onUpdate }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [wellnessLogs, setWellnessLogs] = useState<WellnessLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAthleteData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const [sessRes, attRes, wellRes] = await Promise.all([
      supabase.from('sessions').select('*').order('date', { ascending: false }).limit(100),
      supabase.from('attendance').select('*').eq('goalkeeper_id', goalkeeper.id),
      supabase.from('wellness_logs').select('*').eq('goalkeeper_id', goalkeeper.id).order('date', { ascending: false }).limit(60),
    ]);

    if (sessRes.data) setSessions(sessRes.data);
    if (attRes.data) setAttendance(attRes.data);
    if (wellRes.data) setWellnessLogs(wellRes.data);
    setLoading(false);
  }, [user, goalkeeper.id]);

  useEffect(() => {
    fetchAthleteData();
  }, [fetchAthleteData]);

  const tabs: { key: ProfileTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: 'overview', label: t('overview') || 'Visão Geral', icon: User },
    { key: 'wellness', label: t('wellness') || 'Bem-estar', icon: Heart },
    { key: 'load', label: t('trainingLoad') || 'Carga', icon: Activity },
    { key: 'history', label: t('trainingHistory') || 'Histórico', icon: Calendar },
    { key: 'notes', label: t('notes') || 'Notas', icon: FileText },
    { key: 'assessment', label: t('assessment') || 'Avaliação', icon: Star },
  ];

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 rounded-lg border border-black/[0.08] hover:bg-black/[0.02] transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-on-surface" />
        </button>
        <div className="flex items-center gap-4 flex-1">
          <div className="w-14 h-14 rounded-xl overflow-hidden border border-black/[0.08] shadow-sm">
            {goalkeeper.imageUrl ? (
              <img src={goalkeeper.imageUrl} alt={goalkeeper.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-full h-full bg-background flex items-center justify-center text-lg font-bold text-on-surface-variant">
                {goalkeeper.name.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-on-surface">{goalkeeper.name}</h2>
            <div className="flex items-center gap-3 mt-0.5">
              <span className={cn(
                "text-xs font-semibold px-2 py-0.5 rounded-full",
                goalkeeper.status === 'Ready' ? "bg-success/10 text-success" :
                goalkeeper.status === 'Injured' ? "bg-error/10 text-error" :
                "bg-warning/10 text-warning"
              )}>
                {t(goalkeeper.status === 'Ready' ? 'ready' : goalkeeper.status === 'Injured' ? 'injured' : goalkeeper.status === 'Minor Strain' ? 'minorStrain' : 'inTraining')}
              </span>
              <span className="text-sm text-on-surface-variant">{goalkeeper.form}% {t('formLabel')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 bg-background rounded-xl p-1 border border-black/[0.06]">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex-1 justify-center",
              activeTab === tab.key
                ? "bg-surface text-on-surface shadow-sm border border-black/[0.06]"
                : "text-on-surface-variant hover:text-on-surface"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="animate-in">
        {activeTab === 'overview' && (
          <AthleteOverview goalkeeper={goalkeeper} onUpdate={onUpdate} wellnessLogs={wellnessLogs} attendance={attendance} sessions={sessions} />
        )}
        {activeTab === 'wellness' && (
          <AthleteWellness goalkeeper={goalkeeper} wellnessLogs={wellnessLogs} onRefresh={fetchAthleteData} />
        )}
        {activeTab === 'load' && (
          <AthleteLoad goalkeeper={goalkeeper} attendance={attendance} sessions={sessions} />
        )}
        {activeTab === 'history' && (
          <AthleteTrainingHistory goalkeeper={goalkeeper} attendance={attendance} sessions={sessions} />
        )}
        {activeTab === 'notes' && (
          <AthleteNotes goalkeeper={goalkeeper} sessions={sessions} />
        )}
        {activeTab === 'assessment' && (
          <AthleteAssessment goalkeeper={goalkeeper} />
        )}
      </div>
    </div>
  );
};
