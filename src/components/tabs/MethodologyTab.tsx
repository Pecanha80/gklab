import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen,
  Target,
  Shield,
  ArrowRightLeft,
  Swords,
  Brain,
  Dumbbell,
  Heart,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Info,
  Edit3,
  Check,
  X,
  Calendar,
  BarChart3,
  TrendingUp,
  Activity,
  Zap,
  Layout,
  PieChart as PieChartIcon,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { cn } from '../../lib/utils';
import { useTranslation } from '../../hooks/useTranslation';
import { useMethodology } from '../../hooks/useMethodology';
import { supabase } from '../../lib/supabase';
import { PeriodizationPhase, Goalkeeper, TrainingSession, Attendance, WellnessLog, Exercise } from '../../types';

const MOMENT_ICONS = {
  attacking: Swords,
  defending: Shield,
  attackTransition: ArrowRightLeft,
  defenseTransition: ArrowRightLeft,
};

const COMPETENCY_ICONS = {
  technical: Target,
  tactical: Brain,
  physical: Dumbbell,
  psychological: Heart,
};

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export const MethodologyTab: React.FC = () => {
  const { t } = useTranslation();
  const {
    methodology,
    updateGameModelPrinciples,
    updateCompetencyProfile,
    addPeriodizationPhase,
    updatePeriodizationPhase,
    deletePeriodizationPhase,
    updateNotes,
  } = useMethodology();

  // Navigation State
  const [activeTab, setActiveTab] = useState<'analytics' | 'guide'>('analytics');

  // Local Data State
  const [goalkeepers, setGoalkeepers] = useState<Goalkeeper[]>([]);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [wellnessLogs, setWellnessLogs] = useState<WellnessLog[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  // Guide UI State
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    gameModel: true,
    competencies: false,
    periodization: false,
    taxonomy: false,
    references: false,
  });

  const [editingPrinciple, setEditingPrinciple] = useState<{ momentId: string; index: number } | null>(null);
  const [editingCompetency, setEditingCompetency] = useState<{ profileId: string; index: number } | null>(null);
  const [newPrincipleText, setNewPrincipleText] = useState('');
  const [newCompetencyText, setNewCompetencyText] = useState('');
  const [addingPhase, setAddingPhase] = useState(false);
  const [editingPhaseId, setEditingPhaseId] = useState<string | null>(null);
  const [phaseForm, setPhaseForm] = useState({ name: '', duration: '', objectives: '', intensity: '' });
  const [editValue, setEditValue] = useState('');

  // --- Data Fetching ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [gkRes, sessRes, attRes, wellRes, exeRes] = await Promise.all([
        supabase.from('goalkeepers').select('*'),
        supabase.from('sessions').select('*').order('date', { ascending: true }),
        supabase.from('attendance').select('*'),
        supabase.from('wellness_logs').select('*'),
        supabase.from('exercises').select('*'),
      ]);

      setGoalkeepers(gkRes.data || []);
      setSessions(sessRes.data || []);
      setAttendance(attRes.data || []);
      setWellnessLogs(wellRes.data || []);
      setExercises(exeRes.data || []);
    } catch (err) {
      console.error('Error fetching methodology analytics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Analytics Aggregation ---
  const analyticsData = useMemo(() => {
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    // 1. Exercise Distribution by Taxonomy
    const taxonomyCounts = {
      analytical: exercises.filter(e => e.type === 'analytical').length,
      decision: exercises.filter(e => e.type === 'decision').length,
      contextualized: exercises.filter(e => e.type === 'contextualized').length,
      warmup: exercises.filter(e => e.type === 'warmup').length,
    };

    const exerciseDonutData = [
      { name: t('analytical'), value: taxonomyCounts.analytical, color: '#3b82f6' },
      { name: t('decision'), value: taxonomyCounts.decision, color: '#f59e0b' },
      { name: t('contextualized'), value: taxonomyCounts.contextualized, color: '#10b981' },
      { name: t('warmup'), value: taxonomyCounts.warmup, color: '#8b5cf6' },
    ].filter(d => d.value > 0);

    // 2. Load Trend (Aggregated Daily Load for Team)
    const dailyLoadMap = new Map<string, number>();
    sessions.forEach(session => {
      const sessionAtt = attendance.filter(a => a.session_id === session.id);
      const avgRpe = sessionAtt.length > 0 
        ? sessionAtt.reduce((sum, a) => sum + (a.rpe || 0), 0) / sessionAtt.length 
        : 0;
      
      const durationMatch = String(session.duration).match(/(\d+)/);
      const durationMin = durationMatch ? parseInt(durationMatch[1], 10) : 60;
      const totalSessionLoad = Math.round(avgRpe * durationMin);
      
      const current = dailyLoadMap.get(session.date) || 0;
      dailyLoadMap.set(session.date, current + totalSessionLoad);
    });

    const loadTrendData = Array.from(dailyLoadMap.entries())
      .map(([date, load]) => ({ date, load }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-15);

    // 3. Team Wellness Average (Current State)
    const recentWellness = wellnessLogs.filter(l => new Date(l.date) >= last30Days);
    const wellnessRadar = [
      { subject: t('sleep'), A: 0, fullMark: 5 },
      { subject: t('stress'), A: 0, fullMark: 5 },
      { subject: t('fatigue'), A: 0, fullMark: 5 },
      { subject: t('soreness'), A: 0, fullMark: 5 },
      { subject: t('moodLabel'), A: 0, fullMark: 5 },
    ];

    if (recentWellness.length > 0) {
      wellnessRadar[0].A = recentWellness.reduce((s, l) => s + l.sleep, 0) / recentWellness.length;
      wellnessRadar[1].A = recentWellness.reduce((s, l) => s + l.stress, 0) / recentWellness.length;
      wellnessRadar[2].A = recentWellness.reduce((s, l) => s + l.fatigue, 0) / recentWellness.length;
      wellnessRadar[3].A = recentWellness.reduce((s, l) => s + l.soreness, 0) / recentWellness.length;
      wellnessRadar[4].A = recentWellness.reduce((s, l) => s + l.mood, 0) / recentWellness.length;
    }

    // 4. Global Stats
    const totalExercises = exercises.length;
    const avgTeamWellness = recentWellness.length > 0 
      ? recentWellness.reduce((s, l) => s + (l.score || 0), 0) / recentWellness.length 
      : 0;
    
    const sessionsWithData = sessions.filter(s => attendance.some(a => a.session_id === s.id && a.rpe && a.rpe > 0));
    const avgIntensity = sessionsWithData.length > 0
      ? attendance.filter(a => a.rpe && a.rpe > 0).reduce((s, a) => s + a.rpe!, 0) / attendance.filter(a => a.rpe && a.rpe > 0).length
      : 0;

    return {
      exerciseDonutData,
      loadTrendData,
      wellnessRadar,
      stats: {
        totalExercises,
        avgTeamWellness,
        avgIntensity,
        totalSessions: sessions.length
      }
    };
  }, [exercises, sessions, attendance, wellnessLogs, t]);

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // --- Principle helpers ---
  const handleAddPrinciple = (momentId: string) => {
    if (!newPrincipleText.trim()) return;
    const moment = methodology.gameModel.find(m => m.id === momentId);
    if (moment) {
      updateGameModelPrinciples(momentId, [...moment.principles, newPrincipleText.trim()]);
      setNewPrincipleText('');
    }
  };

  const handleRemovePrinciple = (momentId: string, index: number) => {
    const moment = methodology.gameModel.find(m => m.id === momentId);
    if (moment) {
      updateGameModelPrinciples(momentId, moment.principles.filter((_, i) => i !== index));
    }
  };

  const handleEditPrinciple = (momentId: string, index: number, value: string) => {
    const moment = methodology.gameModel.find(m => m.id === momentId);
    if (moment) {
      const updated = [...moment.principles];
      updated[index] = value;
      updateGameModelPrinciples(momentId, updated);
    }
    setEditingPrinciple(null);
  };

  // --- Competency helpers ---
  const handleAddCompetency = (profileId: string) => {
    if (!newCompetencyText.trim()) return;
    const profile = methodology.competencyProfiles.find(p => p.id === profileId);
    if (profile) {
      updateCompetencyProfile(profileId, [...profile.competencies, newCompetencyText.trim()]);
      setNewCompetencyText('');
    }
  };

  const handleRemoveCompetency = (profileId: string, index: number) => {
    const profile = methodology.competencyProfiles.find(p => p.id === profileId);
    if (profile) {
      updateCompetencyProfile(profileId, profile.competencies.filter((_, i) => i !== index));
    }
  };

  const handleEditCompetency = (profileId: string, index: number, value: string) => {
    const profile = methodology.competencyProfiles.find(p => p.id === profileId);
    if (profile) {
      const updated = [...profile.competencies];
      updated[index] = value;
      updateCompetencyProfile(profileId, updated);
    }
    setEditingCompetency(null);
  };

  // --- Phase helpers ---
  const handleAddPhase = () => {
    if (!phaseForm.name.trim()) return;
    addPeriodizationPhase({
      name: phaseForm.name.trim(),
      duration: phaseForm.duration.trim(),
      objectives: phaseForm.objectives.split('\n').filter(o => o.trim()),
      intensity: phaseForm.intensity.trim(),
    });
    setPhaseForm({ name: '', duration: '', objectives: '', intensity: '' });
    setAddingPhase(false);
  };

  const handleEditPhase = (phase: PeriodizationPhase) => {
    updatePeriodizationPhase(phase);
    setEditingPhaseId(null);
  };

  const SectionHeader: React.FC<{
    sectionKey: string;
    icon: React.ElementType;
    titleKey: string;
    descriptionKey: string;
    badge?: string;
  }> = ({ sectionKey, icon: Icon, titleKey, descriptionKey, badge }) => (
    <button
      onClick={() => toggleSection(sectionKey)}
      className="w-full flex items-center justify-between p-5 hover:bg-surface-container-highest/50 transition-colors rounded-xl"
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div className="text-left">
          <div className="flex items-center gap-2">
            <h3 className="font-headline font-bold text-on-surface">{t(titleKey as any)}</h3>
            {badge && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                {badge}
              </span>
            )}
          </div>
          <p className="text-xs text-on-surface-variant font-label mt-0.5">{t(descriptionKey as any)}</p>
        </div>
      </div>
      {expandedSections[sectionKey] ? (
        <ChevronUp className="w-5 h-5 text-on-surface-variant" />
      ) : (
        <ChevronDown className="w-5 h-5 text-on-surface-variant" />
      )}
    </button>
  );

  const EditableList: React.FC<{
    items: string[];
    parentId: string;
    onAdd: (parentId: string) => void;
    onRemove: (parentId: string, index: number) => void;
    onEdit: (parentId: string, index: number, value: string) => void;
    editing: { momentId?: string; profileId?: string; index: number } | null;
    setEditing: (val: any) => void;
    newText: string;
    setNewText: (val: string) => void;
    placeholderKey: string;
    idField: 'momentId' | 'profileId';
  }> = ({ items, parentId, onAdd, onRemove, onEdit, editing, setEditing, newText, setNewText, placeholderKey, idField }) => (
    <div className="space-y-2">
      {items.map((item, index) => {
        const isEditing = editing && editing[idField] === parentId && editing.index === index;
        return (
          <div key={index} className="flex items-center gap-2 group">
            {isEditing ? (
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="text"
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') onEdit(parentId, index, editValue); if (e.key === 'Escape') setEditing(null); }}
                  className="flex-1 bg-surface-container border border-primary/30 rounded-lg px-3 py-1.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                  autoFocus
                />
                <button onClick={() => onEdit(parentId, index, editValue)} className="p-1 text-primary hover:bg-primary/10 rounded">
                  <Check className="w-4 h-4" />
                </button>
                <button onClick={() => setEditing(null)} className="p-1 text-on-surface-variant hover:bg-surface-container-highest rounded">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />
                <span className="flex-1 text-sm text-on-surface">{item}</span>
                <button
                  onClick={() => { setEditing({ [idField]: parentId, index }); setEditValue(item); }}
                  className="p-1 opacity-0 group-hover:opacity-100 text-on-surface-variant hover:text-primary transition-all rounded"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onRemove(parentId, index)}
                  className="p-1 opacity-0 group-hover:opacity-100 text-on-surface-variant hover:text-red-500 transition-all rounded"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        );
      })}
      <div className="flex items-center gap-2 mt-3">
        <input
          type="text"
          value={newText}
          onChange={e => setNewText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') onAdd(parentId); }}
          placeholder={t(placeholderKey as any)}
          className="flex-1 bg-surface-container border border-black/5 rounded-lg px-3 py-1.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <button
          onClick={() => onAdd(parentId)}
          className="p-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent shadow-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header & Sub-nav */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-headline font-black text-on-surface tracking-tight uppercase">{t('methodologyTitle' as any)}</h1>
          <p className="text-on-surface-variant font-label mt-1">{t('methodologySubtitle' as any)}</p>
        </div>

        <div className="flex bg-surface-container rounded-2xl p-1 shadow-inner border border-black/5 self-start md:self-auto">
          <button
            onClick={() => setActiveTab('analytics')}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all",
              activeTab === 'analytics' 
                ? "bg-surface text-primary shadow-sm" 
                : "text-on-surface-variant hover:text-on-surface"
            )}
          >
            <BarChart3 className="w-4 h-4" />
            {t('analytics' as any)}
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all",
              activeTab === 'guide' 
                ? "bg-surface text-primary shadow-sm" 
                : "text-on-surface-variant hover:text-on-surface"
            )}
          >
            <BookOpen className="w-4 h-4" />
            {t('theoryGuide' as any)}
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'analytics' ? (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {/* Global Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard 
                label={t('averageWellness' as any)} 
                value={analyticsData.stats.avgTeamWellness.toFixed(1)} 
                subValue="/ 5.0"
                icon={Heart} 
                color="text-red-500" 
                bg="bg-red-500/10" 
              />
              <StatCard 
                label={t('averageIntensity' as any)} 
                value={analyticsData.stats.avgIntensity.toFixed(1)} 
                subValue="/ 10"
                icon={Zap} 
                color="text-amber-500" 
                bg="bg-amber-500/10" 
              />
              <StatCard 
                label={t('exercisesCount' as any)} 
                value={analyticsData.stats.totalExercises.toString()} 
                icon={Target} 
                color="text-primary" 
                bg="bg-primary/10" 
              />
              <StatCard 
                label={t('sessionsCreated' as any)} 
                value={analyticsData.stats.totalSessions.toString()} 
                icon={Calendar} 
                color="text-emerald-500" 
                bg="bg-emerald-500/10" 
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Wellness Radar & Exercise Pie */}
              <div className="lg:col-span-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
                <section className="lg:col-span-2 bg-surface-container rounded-3xl p-8 border border-black/5 shadow-sm">
                   <div className="flex items-center justify-between mb-8">
                     <h3 className="font-headline font-black text-lg flex items-center gap-2">
                       <Activity className="w-5 h-5 text-primary" />
                       {t('teamWellnessAvg' as any)}
                     </h3>
                     <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant bg-on-surface/5 px-3 py-1 rounded-full">
                       {t('last30Days' as any)}
                     </span>
                   </div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart data={analyticsData.wellnessRadar}>
                            <PolarGrid stroke="#e5e7eb" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 10, fontWeight: 700 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} axisLine={false} />
                            <Radar
                              name="Team"
                              dataKey="A"
                              stroke="#3b82f6"
                              fill="#3b82f6"
                              fillOpacity={0.5}
                            />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: '#fff', 
                                border: 'none', 
                                borderRadius: '12px', 
                                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                                fontSize: '12px',
                                fontWeight: 600
                              }} 
                            />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                      
                      <div className="space-y-4 flex flex-col justify-center">
                        {analyticsData.wellnessRadar.map((item, i) => (
                          <div key={i} className="flex flex-col gap-1">
                            <div className="flex justify-between items-center text-xs font-black uppercase tracking-tight">
                              <span className="text-on-surface-variant">{item.subject}</span>
                              <span className="text-on-surface">{item.A.toFixed(1)} / 5.0</span>
                            </div>
                            <div className="h-1.5 w-full bg-on-surface/5 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${(item.A / 5) * 100}%` }}
                                className="h-full bg-primary"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                   </div>
                </section>

                <section className="bg-surface-container rounded-3xl p-8 border border-black/5 shadow-sm">
                  <h3 className="font-headline font-black text-lg flex items-center gap-2 mb-8">
                    <PieChartIcon className="w-5 h-5 text-primary" />
                    {t('exerciseDistribution' as any)}
                  </h3>
                  
                  <div className="h-64 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analyticsData.exerciseDonutData}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={8}
                          dataKey="value"
                        >
                          {analyticsData.exerciseDonutData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                           contentStyle={{ 
                            backgroundColor: '#fff', 
                            border: 'none', 
                            borderRadius: '12px', 
                            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                            fontSize: '12px',
                            fontWeight: 600
                          }} 
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-3xl font-black text-on-surface">{analyticsData.stats.totalExercises}</span>
                      <span className="text-[8px] font-black uppercase tracking-widest text-on-surface-variant">{t('total' as any)}</span>
                    </div>
                  </div>

                  <div className="mt-8 space-y-3">
                    {analyticsData.exerciseDonutData.map((item, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-xs font-bold text-on-surface-variant">{item.name}</span>
                        </div>
                        <span className="text-xs font-black text-on-surface">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              {/* Load Trend Chart */}
              <section className="lg:col-span-12 bg-surface-container rounded-3xl p-8 border border-black/5 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="font-headline font-black text-lg flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    {t('loadTrend' as any)}
                  </h3>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                      <div className="w-3 h-3 rounded bg-primary/20 border border-primary/50" />
                      AU (Volume × RPE)
                    </div>
                  </div>
                </div>

                <div className="h-80 w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData.loadTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="loadGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8}/>
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 600 }}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 600 }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: 'none', 
                          borderRadius: '16px', 
                          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
                          fontSize: '12px',
                          fontWeight: 700
                        }} 
                        cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                      />
                      <Bar 
                        dataKey="load" 
                        fill="url(#loadGradient)" 
                        radius={[8, 8, 0, 0]} 
                        maxBarSize={45}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="guide"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Existing Theoretical Content */}
            {/* ===== 1. GAME MODEL ===== */}
            <div className="bg-surface rounded-2xl border border-black/5 overflow-hidden shadow-sm">
              <SectionHeader
                sectionKey="gameModel"
                icon={Target}
                titleKey="methGameModel"
                descriptionKey="methGameModelDesc"
                badge={t('methEditable' as any)}
              />
              <AnimatePresence>
                {expandedSections.gameModel && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-5 pt-0 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {methodology.gameModel.map(moment => {
                        const Icon = MOMENT_ICONS[moment.moment as keyof typeof MOMENT_ICONS];
                        return (
                          <div key={moment.id} className="bg-surface-container rounded-xl p-4 border border-black/5">
                            <div className="flex items-center gap-2 mb-3">
                              {Icon && <Icon className={cn("w-4 h-4", moment.moment === 'defending' ? 'text-blue-500' : moment.moment === 'attacking' ? 'text-red-500' : 'text-amber-500')} />}
                              <h4 className="font-headline font-bold text-sm text-on-surface">{t(`methMoment_${moment.moment}` as any)}</h4>
                            </div>
                            <EditableList
                              items={moment.principles}
                              parentId={moment.id}
                              onAdd={handleAddPrinciple}
                              onRemove={handleRemovePrinciple}
                              onEdit={handleEditPrinciple}
                              editing={editingPrinciple}
                              setEditing={setEditingPrinciple}
                              newText={newPrincipleText}
                              setNewText={setNewPrincipleText}
                              placeholderKey="methAddPrinciple"
                              idField="momentId"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ===== 2. COMPETENCY PROFILES ===== */}
            <div className="bg-surface rounded-2xl border border-black/5 overflow-hidden shadow-sm">
              <SectionHeader
                sectionKey="competencies"
                icon={Brain}
                titleKey="methCompetencies"
                descriptionKey="methCompetenciesDesc"
                badge={t('methEditable' as any)}
              />
              <AnimatePresence>
                {expandedSections.competencies && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-5 pt-0 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {methodology.competencyProfiles.map(profile => {
                        const Icon = COMPETENCY_ICONS[profile.category as keyof typeof COMPETENCY_ICONS];
                        return (
                          <div key={profile.id} className="bg-surface-container rounded-xl p-4 border border-black/5">
                            <div className="flex items-center gap-2 mb-3">
                              {Icon && <Icon className="w-4 h-4 text-primary" />}
                              <h4 className="font-headline font-bold text-sm text-on-surface">{t(`methComp_${profile.category}` as any)}</h4>
                            </div>
                            <EditableList
                              items={profile.competencies}
                              parentId={profile.id}
                              onAdd={handleAddCompetency}
                              onRemove={handleRemoveCompetency}
                              onEdit={handleEditCompetency}
                              editing={editingCompetency}
                              setEditing={setEditingCompetency}
                              newText={newCompetencyText}
                              setNewText={setNewCompetencyText}
                              placeholderKey="methAddCompetency"
                              idField="profileId"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ===== 3. PERIODIZATION ===== */}
            <div className="bg-surface rounded-2xl border border-black/5 overflow-hidden shadow-sm">
              <SectionHeader
                sectionKey="periodization"
                icon={Calendar}
                titleKey="methPeriodization"
                descriptionKey="methPeriodizationDesc"
                badge={t('methEditable' as any)}
              />
              <AnimatePresence>
                {expandedSections.periodization && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-5 pt-0 space-y-3">
                      <div className="flex items-start gap-3 bg-primary/5 rounded-xl p-4 border border-primary/10">
                        <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <p className="text-xs text-on-surface-variant">{t('methPeriodizationInfo' as any)}</p>
                      </div>

                      {methodology.periodization.map(phase => {
                        const isEditing = editingPhaseId === phase.id;
                        if (isEditing) {
                          return (
                            <div key={phase.id} className="bg-surface-container rounded-xl p-4 border border-primary/20 space-y-3">
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <input
                                  value={phaseForm.name}
                                  onChange={e => setPhaseForm(prev => ({ ...prev, name: e.target.value }))}
                                  placeholder={t('methPhaseName' as any)}
                                  className="bg-surface border border-black/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                                <input
                                  value={phaseForm.duration}
                                  onChange={e => setPhaseForm(prev => ({ ...prev, duration: e.target.value }))}
                                  placeholder={t('methPhaseDuration' as any)}
                                  className="bg-surface border border-black/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                                <input
                                  value={phaseForm.intensity}
                                  onChange={e => setPhaseForm(prev => ({ ...prev, intensity: e.target.value }))}
                                  placeholder={t('methPhaseIntensity' as any)}
                                  className="bg-surface border border-black/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                              </div>
                              <textarea
                                value={phaseForm.objectives}
                                onChange={e => setPhaseForm(prev => ({ ...prev, objectives: e.target.value }))}
                                placeholder={t('methPhaseObjectives' as any)}
                                rows={3}
                                className="w-full bg-surface border border-black/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                              />
                              <div className="flex justify-end gap-2">
                                <button onClick={() => setEditingPhaseId(null)} className="px-3 py-1.5 text-sm text-on-surface-variant hover:bg-surface-container-highest rounded-lg transition-colors">
                                  {t('cancel' as any)}
                                </button>
                                <button
                                  onClick={() => handleEditPhase({
                                    ...phase,
                                    name: phaseForm.name,
                                    duration: phaseForm.duration,
                                    objectives: phaseForm.objectives.split('\n').filter(o => o.trim()),
                                    intensity: phaseForm.intensity,
                                  })}
                                  className="px-3 py-1.5 text-sm bg-primary text-on-primary rounded-lg hover:bg-primary/90 transition-colors"
                                >
                                  {t('save' as any)}
                                </button>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div key={phase.id} className="bg-surface-container rounded-xl p-4 border border-black/5 group">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h4 className="font-headline font-bold text-sm text-on-surface">{phase.name}</h4>
                                  {phase.duration && (
                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant">
                                      {phase.duration}
                                    </span>
                                  )}
                                  {phase.intensity && (
                                    <span className={cn(
                                      "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                                      phase.intensity.toLowerCase().includes('high') || phase.intensity.toLowerCase().includes('alt')
                                        ? 'bg-red-100 text-red-700'
                                        : phase.intensity.toLowerCase().includes('low') || phase.intensity.toLowerCase().includes('baix')
                                          ? 'bg-green-100 text-green-700'
                                          : 'bg-amber-100 text-amber-700'
                                    )}>
                                      {phase.intensity}
                                    </span>
                                  )}
                                </div>
                                {phase.objectives.length > 0 && (
                                  <ul className="space-y-1">
                                    {phase.objectives.map((obj, i) => (
                                      <li key={i} className="flex items-center gap-2 text-sm text-on-surface-variant">
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />
                                        {obj}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => {
                                    setEditingPhaseId(phase.id);
                                    setPhaseForm({
                                      name: phase.name,
                                      duration: phase.duration,
                                      objectives: phase.objectives.join('\n'),
                                      intensity: phase.intensity,
                                    });
                                  }}
                                  className="p-1.5 text-on-surface-variant hover:text-primary rounded-lg hover:bg-primary/10 transition-colors"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (window.confirm(t('confirmDelete' as any))) {
                                      deletePeriodizationPhase(phase.id);
                                    }
                                  }}
                                  className="p-1.5 text-on-surface-variant hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {addingPhase ? (
                        <div className="bg-surface-container rounded-xl p-4 border border-primary/20 space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <input
                              value={phaseForm.name}
                              onChange={e => setPhaseForm(prev => ({ ...prev, name: e.target.value }))}
                              placeholder={t('methPhaseName' as any)}
                              className="bg-surface border border-black/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                              autoFocus
                            />
                            <input
                              value={phaseForm.duration}
                              onChange={e => setPhaseForm(prev => ({ ...prev, duration: e.target.value }))}
                              placeholder={t('methPhaseDuration' as any)}
                              className="bg-surface border border-black/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                            <input
                              value={phaseForm.intensity}
                              onChange={e => setPhaseForm(prev => ({ ...prev, intensity: e.target.value }))}
                              placeholder={t('methPhaseIntensity' as any)}
                              className="bg-surface border border-black/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                          </div>
                          <textarea
                            value={phaseForm.objectives}
                            onChange={e => setPhaseForm(prev => ({ ...prev, objectives: e.target.value }))}
                            placeholder={t('methPhaseObjectives' as any)}
                            rows={3}
                            className="w-full bg-surface border border-black/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                          />
                          <div className="flex justify-end gap-2">
                             <button onClick={() => { setAddingPhase(false); setPhaseForm({ name: '', duration: '', objectives: '', intensity: '' }); }} className="px-3 py-1.5 text-sm text-on-surface-variant hover:bg-surface-container-highest rounded-lg transition-colors">
                              {t('cancel' as any)}
                            </button>
                            <button onClick={handleAddPhase} className="px-3 py-1.5 text-sm bg-primary text-on-primary rounded-lg hover:bg-primary/90 transition-colors">
                              {t('add' as any)}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setAddingPhase(true)}
                          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-black/10 rounded-xl text-sm text-on-surface-variant hover:border-primary/30 hover:text-primary transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          {t('methAddPhase' as any)}
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ===== 4. EXERCISE TAXONOMY (Reference) ===== */}
            <div className="bg-surface rounded-2xl border border-black/5 overflow-hidden shadow-sm">
              <SectionHeader
                sectionKey="taxonomy"
                icon={Layout}
                titleKey="methTaxonomy"
                descriptionKey="methTaxonomyDesc"
                badge={t('methReference' as any)}
              />
              <AnimatePresence>
                {expandedSections.taxonomy && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-5 pt-0 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-surface-container rounded-xl p-4 border border-black/5">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                            <h4 className="font-headline font-bold text-sm text-on-surface">{t('analytical')}</h4>
                          </div>
                          <p className="text-xs text-on-surface-variant leading-relaxed">{t('methTaxAnalytical' as any)}</p>
                        </div>
                        <div className="bg-surface-container rounded-xl p-4 border border-black/5">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-2 h-2 rounded-full bg-amber-500" />
                            <h4 className="font-headline font-bold text-sm text-on-surface">{t('decision')}</h4>
                          </div>
                          <p className="text-xs text-on-surface-variant leading-relaxed">{t('methTaxDecision' as any)}</p>
                        </div>
                        <div className="bg-surface-container rounded-xl p-4 border border-black/5">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            <h4 className="font-headline font-bold text-sm text-on-surface">{t('contextualized')}</h4>
                          </div>
                          <p className="text-xs text-on-surface-variant leading-relaxed">{t('methTaxContextualized' as any)}</p>
                        </div>
                        <div className="bg-surface-container rounded-xl p-4 border border-black/5">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-2 h-2 rounded-full bg-purple-500" />
                            <h4 className="font-headline font-bold text-sm text-on-surface">{t('warmup')}</h4>
                          </div>
                          <p className="text-xs text-on-surface-variant leading-relaxed">{t('methTaxWarmup' as any)}</p>
                        </div>
                      </div>

                      <div className="bg-surface-container rounded-xl p-4 border border-black/5">
                        <h4 className="font-headline font-bold text-sm text-on-surface mb-3">{t('methProgression' as any)}</h4>
                        <div className="flex flex-col items-center gap-1">
                          {[
                            { label: t('methProgLevel4' as any), width: 'w-1/4', bg: 'bg-red-500/20 text-red-700' },
                            { label: t('methProgLevel3' as any), width: 'w-2/4', bg: 'bg-amber-500/20 text-amber-700' },
                            { label: t('methProgLevel2' as any), width: 'w-3/4', bg: 'bg-blue-500/20 text-blue-700' },
                            { label: t('methProgLevel1' as any), width: 'w-full', bg: 'bg-green-500/20 text-green-700' },
                          ].map((level, i) => (
                            <div key={i} className={cn("rounded-lg py-2 px-4 text-center text-xs font-bold", level.width, level.bg)}>
                              {level.label}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ===== 5. REFERENCES ===== */}
            <div className="bg-surface rounded-2xl border border-black/5 overflow-hidden shadow-sm">
              <SectionHeader
                sectionKey="references"
                icon={BookOpen}
                titleKey="methReferences"
                descriptionKey="methReferencesDesc"
                badge={t('methReference' as any)}
              />
              <AnimatePresence>
                {expandedSections.references && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-5 pt-0 space-y-3">
                      {[
                        { author: 'UEFA', title: t('methRefUEFA' as any) },
                        { author: 'Vitor Frade', title: t('methRefFrade' as any) },
                        { author: 'Francisco Silveira Ramos', title: t('methRefRamos' as any) },
                        { author: 'Jorge Maciel', title: t('methRefMaciel' as any) },
                        { author: 'Daniel Gaspar', title: t('methRefGaspar' as any) },
                      ].map((ref, i) => (
                        <div key={i} className="flex items-start gap-3 bg-surface-container rounded-xl p-3 border border-black/5">
                          <BookOpen className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-bold text-on-surface">{ref.author}</p>
                            <p className="text-xs text-on-surface-variant">{ref.title}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ===== NOTES ===== */}
            <div className="bg-surface rounded-2xl border border-black/5 p-5 shadow-sm">
              <h3 className="font-headline font-bold text-on-surface mb-3 uppercase tracking-wider text-xs">{t('methNotes' as any)}</h3>
              <textarea
                value={methodology.notes}
                onChange={e => updateNotes(e.target.value)}
                placeholder={t('methNotesPlaceholder' as any)}
                rows={4}
                className="w-full bg-surface-container border border-black/5 rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: string; subValue?: string; icon: any; color: string; bg: string }> = ({ label, value, subValue, icon: Icon, color, bg }) => (
  <div className="bg-surface-container rounded-3xl border border-black/5 p-6 flex-1 shadow-sm group hover:scale-[1.02] transition-all">
    <div className="flex items-center justify-between mb-4">
      <div className={cn("p-3 rounded-2xl transition-transform group-hover:rotate-12", bg)}>
        <Icon className={cn("w-5 h-5", color)} />
      </div>
    </div>
    <p className="text-[10px] text-on-surface-variant font-black uppercase tracking-[0.15em] mb-1">{label}</p>
    <div className="flex items-baseline gap-1.5">
      <span className="text-3xl font-black text-on-surface leading-none tracking-tight">{value}</span>
      {subValue && <span className="text-sm text-on-surface-variant font-bold">{subValue}</span>}
    </div>
  </div>
);

