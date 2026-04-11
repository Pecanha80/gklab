import React, { useState } from 'react';
import {
  LayoutDashboard,
  Dumbbell,
  Target,
  Users,
  Calendar,
  Video,
  HelpCircle,
  LogOut,
  Search,
  Bell,
  Settings,
  Play,
  Edit3,
  Clock,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  FileText,
  X,
  Trophy,
  Wind,
  Library,
  Download,
  Filter,
  Dumbbell as DumbbellIcon,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { TrainingSession, Exercise } from './types';
import { useTranslation } from './hooks/useTranslation';
import { useAppData } from './hooks/useAppData';
import { useCustomPresets } from './hooks/useCustomPresets';
import { PRESETS } from './data/presets';
import { SESSION_TEMPLATES } from './data/sessionTemplates';
import { SidebarItem } from './components/ui/SidebarItem';
import { Section } from './components/ui/Section';
import { QuickSelect } from './components/ui/QuickSelect';
import { GoalkeeperCard } from './components/cards/GoalkeeperCard';
import { VideoCard } from './components/cards/VideoCard';
import { ExercisePreview } from './components/ExercisePreview';
import { TacticalBoard } from './components/TacticalBoard';
import { GoalkeepersTab } from './components/tabs/GoalkeepersTab';
import { VideosTab } from './components/tabs/VideosTab';
import { SupportTab } from './components/tabs/SupportTab';
import { SessionDetailModal } from './components/SessionDetailModal';
import { ExerciseDetailModal } from './components/ExerciseDetailModal';
import { OBJECTIVE_MAPPINGS } from './data/objectiveMappings';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const emptySession: Omit<TrainingSession, 'id'> = {
  date: new Date().toISOString().split('T')[0],
  category: 'firstTeam',
  numAthletes: 3,
  duration: 'dur_90min',
  generalObjectives: [],
  objectives: {
    technical: '',
    tactical: '',
    physical: '',
    cognitive: '',
  },
  warmup: [],
  exercises: [],
  integratedWithTeam: [],
  coolDown: '',
  observations: {
    positives: '',
    adjustments: '',
    individualEval: '',
  },
  titles: [],
  focus: [],
  time: '',
  attending: [],
};

const emptyDrill: Omit<Exercise, 'id'> = {
  type: 'analytical',
  title: '',
  objective: '',
  organization: '',
  execution: '',
  progression: '',
  successCriteria: '',
  duration: 'dur_15min',
  intensity: 'medium',
};

export default function App() {
  const { t, language, changeLanguage, isPortuguese } = useTranslation();
  const { goalkeepers, sessions, videos, exercisesLibrary, isLoading, addExerciseToLibrary, deleteExercise, addSession, deleteSession, addGoalkeeper, updateGoalkeeper, deleteGoalkeeper, addVideo, deleteVideo } = useAppData();
  const { customPresets, getOptions, addCustomPreset, removeCustomPreset } = useCustomPresets();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [isAddingSession, setIsAddingSession] = useState(false);
  const [isAddingExerciseToLibrary, setIsAddingExerciseToLibrary] = useState(false);
  const [isSelectingFromLibrary, setIsSelectingFromLibrary] = useState(false);
  const [isTacticalBoardOpen, setIsTacticalBoardOpen] = useState(false);
  const [exerciseSearchTerm, setExerciseSearchTerm] = useState('');
  const [viewingSession, setViewingSession] = useState<TrainingSession | null>(null);
  const [viewingExercise, setViewingExercise] = useState<Exercise | null>(null);

  const [newSession, setNewSession] = useState<Omit<TrainingSession, 'id'>>({ ...emptySession });

  const [isAddingDrill, setIsAddingDrill] = useState(false);
  const [drillContext, setDrillContext] = useState<'warmup' | 'main'>('main');
  const [editingDrillId, setEditingDrillId] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [currentDrill, setCurrentDrill] = useState<Omit<Exercise, 'id'>>({ ...emptyDrill });

  const translateContent = (content: string) => {
    if (!content) return '';
    return content
      .split('\n')
      .map(line => t(line.trim() as any))
      .join('\n');
  };

  const handleExportSession = async (sessionId: string) => {
    const element = document.getElementById(`session-card-${sessionId}`);
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        backgroundColor: '#f8fafc',
        scale: 2,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`training-session-${sessionId}.pdf`);
    } catch (error) {
      console.error('Error exporting session:', error);
    }
  };

  const validateDrill = (drill: Omit<Exercise, 'id'>): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    if (!drill.title.trim()) errors.push(t('drillTitleRequiredMsg'));
    if (!drill.objective.trim()) errors.push(t('objectiveRequiredMsg'));
    if (!drill.organization.trim()) errors.push(t('organizationRequiredMsg'));
    if (!drill.execution.trim()) errors.push(t('executionRequiredMsg'));
    if (!drill.progression.trim()) errors.push(t('progressionRequiredMsg'));
    if (!drill.successCriteria.trim()) errors.push(t('successCriteriaRequiredMsg'));
    return { isValid: errors.length === 0, errors };
  };

  const handleAddExerciseToLibrary = async (exercise: Omit<Exercise, 'id'>) => {
    const validation = validateDrill(exercise);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }
    setValidationErrors([]);
    await addExerciseToLibrary(exercise);
  };

  const handleGeneralObjectivesChange = (selected: string[]) => {
    const updatedSpecifics = { ...newSession.objectives };
    const newWarmupDrills: Exercise[] = [];

    selected.forEach(objKey => {
      const mapping = OBJECTIVE_MAPPINGS[objKey];
      if (mapping) {
        if (mapping.technical && !updatedSpecifics.technical.includes(mapping.technical)) {
          updatedSpecifics.technical = updatedSpecifics.technical 
            ? `${updatedSpecifics.technical}\n${mapping.technical}` 
            : mapping.technical;
        }
        if (mapping.tactical && !updatedSpecifics.tactical.includes(mapping.tactical)) {
          updatedSpecifics.tactical = updatedSpecifics.tactical 
            ? `${updatedSpecifics.tactical}\n${mapping.tactical}` 
            : mapping.tactical;
        }
        if (mapping.physical && !updatedSpecifics.physical.includes(mapping.physical)) {
          updatedSpecifics.physical = updatedSpecifics.physical 
            ? `${updatedSpecifics.physical}\n${mapping.physical}` 
            : mapping.physical;
        }
        if (mapping.cognitive && !updatedSpecifics.cognitive.includes(mapping.cognitive)) {
          updatedSpecifics.cognitive = updatedSpecifics.cognitive 
            ? `${updatedSpecifics.cognitive}\n${mapping.cognitive}` 
            : mapping.cognitive;
        }
        
        if (mapping.warmupObjective) {
          newWarmupDrills.push({
            id: crypto.randomUUID(),
            type: 'warmup',
            title: mapping.warmupObjective,
            objective: mapping.warmupObjective,
            organization: mapping.warmupOrganization || '',
            execution: mapping.warmupDescription || '',
            progression: '',
            successCriteria: '',
            duration: 'dur_10min',
            intensity: 'low'
          });
        }
      }
    });

    setNewSession({ 
      ...newSession, 
      generalObjectives: selected,
      objectives: updatedSpecifics,
      warmup: newWarmupDrills.length > 0 ? newWarmupDrills : newSession.warmup
    });
  };

  const handleAddSession = async (e: React.FormEvent) => {
    e.preventDefault();

    addCustomPreset('sessionTitles', newSession.title, PRESETS.sessionTitles);
    addCustomPreset('categories', newSession.category, PRESETS.categories);
    newSession.generalObjectives.forEach(obj => addCustomPreset('generalObjectives', obj, PRESETS.objectives.general));
    addCustomPreset('technical', newSession.objectives.technical, PRESETS.objectives.technical);
    addCustomPreset('tactical', newSession.objectives.tactical, PRESETS.objectives.tactical);
    addCustomPreset('physical', newSession.objectives.physical, PRESETS.objectives.physical);
    addCustomPreset('cognitive', newSession.objectives.cognitive, PRESETS.objectives.cognitive);
    newSession.warmup.forEach(drill => {
      addCustomPreset('drillTitles', drill.title, PRESETS.drills.titles);
      addCustomPreset('drillObjectives', drill.objective, PRESETS.drills.objectives);
      addCustomPreset('drillOrganizations', drill.organization, PRESETS.drills.organizations);
      addCustomPreset('drillExecutions', drill.execution, PRESETS.drills.executions);
      addCustomPreset('drillProgressions', drill.progression, PRESETS.drills.progressions);
      addCustomPreset('drillSuccessCriteria', drill.successCriteria, PRESETS.drills.successCriteria);
    });
    addCustomPreset('coolDowns', newSession.coolDown, PRESETS.coolDowns);
    addCustomPreset('obsPositives', newSession.observations.positives, PRESETS.observations.positives);
    addCustomPreset('obsAdjustments', newSession.observations.adjustments, PRESETS.observations.adjustments);
    addCustomPreset('obsEvaluations', newSession.observations.individualEval, PRESETS.observations.evaluations);

    if (newSession.integratedWithTeam) {
      newSession.integratedWithTeam.forEach(integrated => {
        addCustomPreset('integratedFormats', integrated.format, PRESETS.integrated.formats);
        addCustomPreset('integratedNumbers', integrated.number, PRESETS.integrated.numbers);
        addCustomPreset('integratedSpaces', integrated.space, PRESETS.integrated.spaces);
        addCustomPreset('integratedTimes', integrated.time, PRESETS.integrated.times);
      });
    }

    newSession.exercises.forEach(ex => {
      addCustomPreset('drillTitles', ex.title, PRESETS.drills.titles);
      addCustomPreset('drillObjectives', ex.objective, PRESETS.drills.objectives);
      addCustomPreset('drillOrganizations', ex.organization, PRESETS.drills.organizations);
      addCustomPreset('drillExecutions', ex.execution, PRESETS.drills.executions);
      addCustomPreset('drillProgressions', ex.progression, PRESETS.drills.progressions);
      addCustomPreset('drillSuccessCriteria', ex.successCriteria, PRESETS.drills.successCriteria);
      addCustomPreset('durations', ex.duration, PRESETS.durations);
    });

    const success = await addSession(newSession);
    if (success) {
      setIsAddingSession(false);
      setNewSession({ ...emptySession, date: new Date().toISOString().split('T')[0] });
    } else {
      alert('Error adding session. Check console for details.');
    }
  };

  const handleAddDrill = () => {
    if (!currentDrill.title) return;

    // Auto-save individual fields to presets for immediate use in dropdowns
    addCustomPreset('drillTitles', currentDrill.title, PRESETS.drills.titles);
    addCustomPreset('drillObjectives', currentDrill.objective, PRESETS.drills.objectives);
    addCustomPreset('drillOrganizations', currentDrill.organization, PRESETS.drills.organizations);
    addCustomPreset('drillExecutions', currentDrill.execution, PRESETS.drills.executions);
    addCustomPreset('drillProgressions', currentDrill.progression, PRESETS.drills.progressions);
    addCustomPreset('drillSuccessCriteria', currentDrill.successCriteria, PRESETS.drills.successCriteria);
    addCustomPreset('durations', currentDrill.duration, PRESETS.durations);

    // Auto-save to library to enable future pre-filling by title
    if (currentDrill.title && currentDrill.objective && currentDrill.organization) {
      const alreadyInLibrary = exercisesLibrary.find(ex => ex.title === currentDrill.title);
      if (!alreadyInLibrary) {
        addExerciseToLibrary(currentDrill);
      }
    }

    if (editingDrillId) {
      setNewSession(prev => ({
        ...prev,
        warmup: drillContext === 'warmup' 
          ? prev.warmup.map(d => d.id === editingDrillId ? { ...currentDrill, id: editingDrillId } : d) 
          : prev.warmup,
        exercises: drillContext === 'main' 
          ? prev.exercises.map(d => d.id === editingDrillId ? { ...currentDrill, id: editingDrillId } : d) 
          : prev.exercises
      }));
    } else {
      const drill: Exercise = {
        ...currentDrill,
        id: crypto.randomUUID()
      };
      setNewSession(prev => ({
        ...prev,
        warmup: drillContext === 'warmup' ? [...prev.warmup, drill] : prev.warmup,
        exercises: drillContext === 'main' ? [...prev.exercises, drill] : prev.exercises
      }));
    }

    setCurrentDrill({ ...emptyDrill });
    setIsAddingDrill(false);
    setEditingDrillId(null);
  };

  const handleEditDrill = (drill: Exercise, context: 'warmup' | 'main') => {
    setDrillContext(context);
    setCurrentDrill({
      type: drill.type,
      title: drill.title,
      objective: drill.objective,
      organization: drill.organization,
      execution: drill.execution,
      progression: drill.progression,
      successCriteria: drill.successCriteria,
      duration: drill.duration,
      intensity: drill.intensity,
      diagram: drill.diagram
    });
    setEditingDrillId(drill.id);
    setIsAddingDrill(true);
  };

  const handleCancelDrill = () => {
    setCurrentDrill({ ...emptyDrill });
    setIsAddingDrill(false);
    setEditingDrillId(null);
  };

  const handleRemoveDrill = (id: string) => {
    setNewSession(prev => ({
      ...prev,
      warmup: prev.warmup.filter(d => d.id !== id),
      exercises: prev.exercises.filter(d => d.id !== id)
    }));
  };

  const applyDrillTemplate = (title: string) => {
    const normalizedTitle = title.trim().toLowerCase();
    const allExercises: Exercise[] = [];
    Object.values(SESSION_TEMPLATES).forEach(template => {
      if (template.exercises) allExercises.push(...(template.exercises as Exercise[]));
      if (template.warmup) allExercises.push(...(template.warmup as Exercise[]));
    });

    // Add drills from library as well
    allExercises.push(...exercisesLibrary);

    const foundExercise = allExercises.find(ex => 
      ex.title === title || 
      ex.title.toLowerCase() === normalizedTitle ||
      t(ex.title as any).toLowerCase() === normalizedTitle
    );

    if (foundExercise) {
      setCurrentDrill(prev => ({
        ...prev,
        title: t(foundExercise.title as any),
        type: foundExercise.type || prev.type,
        objective: foundExercise.objective ? t(foundExercise.objective as any) : '',
        organization: foundExercise.organization ? t(foundExercise.organization as any) : '',
        execution: foundExercise.execution ? t(foundExercise.execution as any) : '',
        progression: foundExercise.progression ? t(foundExercise.progression as any) : '',
        successCriteria: foundExercise.successCriteria ? t(foundExercise.successCriteria as any) : '',
        duration: foundExercise.duration || prev.duration,
        intensity: foundExercise.intensity || prev.intensity,
      }));
    } else {
      setCurrentDrill(prev => ({ 
        ...prev, 
        title,
        ...(title.trim() === '' ? {
          objective: '',
          organization: '',
          execution: '',
          progression: '',
          successCriteria: '',
          type: 'analytical'
        } : {})
      }));
    }
  };

  const applySessionTemplates = (titles: string[]) => {
    let allWarmup: Exercise[] = [];
    let allExercises: Exercise[] = [];
    let technical = '';
    let tactical = '';
    let physical = '';
    let cognitive = '';
    let generalObjectives: string[] = [];
    let category = '';

    titles.forEach(title => {
      const template = SESSION_TEMPLATES[title];
      if (template) {
        if (template.category) category = template.category;
        if (template.warmup) {
          allWarmup = [...allWarmup, ...template.warmup.map(ex => ({ ...ex, id: crypto.randomUUID() }))];
        }
        if (template.exercises) {
          allExercises = [...allExercises, ...template.exercises.map(ex => ({ ...ex, id: crypto.randomUUID() }))];
        }
        if (template.objectives) {
          if (template.objectives.technical) technical += (technical ? '\n' : '') + template.objectives.technical;
          if (template.objectives.tactical) tactical += (tactical ? '\n' : '') + template.objectives.tactical;
          if (template.objectives.physical) physical += (physical ? '\n' : '') + template.objectives.physical;
          if (template.objectives.cognitive) cognitive += (cognitive ? '\n' : '') + template.objectives.cognitive;
        }
        if (template.generalObjectives) {
          generalObjectives = Array.from(new Set([...generalObjectives, ...template.generalObjectives]));
        }
      }
    });

    // Cross-map general objectives to specific technical data if not already filled by session template
    generalObjectives.forEach(objKey => {
      const mapping = OBJECTIVE_MAPPINGS[objKey];
      if (mapping) {
        if (mapping.technical && !technical.includes(mapping.technical)) {
          technical = technical ? `${technical}\n${mapping.technical}` : mapping.technical;
        }
        if (mapping.tactical && !tactical.includes(mapping.tactical)) {
          tactical = tactical ? `${tactical}\n${mapping.tactical}` : mapping.tactical;
        }
        if (mapping.physical && !physical.includes(mapping.physical)) {
          physical = physical ? `${physical}\n${mapping.physical}` : mapping.physical;
        }
        if (mapping.cognitive && !cognitive.includes(mapping.cognitive)) {
          cognitive = cognitive ? `${cognitive}\n${mapping.cognitive}` : mapping.cognitive;
        }
        
        if (mapping.warmupObjective && allWarmup.length === 0) {
           allWarmup.push({
             id: crypto.randomUUID(),
             type: 'warmup',
             title: mapping.warmupObjective,
             objective: mapping.warmupObjective,
             organization: mapping.warmupOrganization || '',
             execution: mapping.warmupDescription || '',
             progression: '',
             successCriteria: '',
             duration: 'dur_15min',
             intensity: 'medium'
           });
        }
      }
    });

    setNewSession(prev => ({
      ...prev,
      titles,
      category: category || prev.category,
      generalObjectives: generalObjectives,
      objectives: {
        technical: technical,
        tactical: tactical,
        physical: physical,
        cognitive: cognitive,
      },
      warmup: allWarmup,
      exercises: allExercises,
    }));
  };

  const loadExample = () => {
    setNewSession({
      date: new Date().toISOString().split('T')[0],
      category: 'firstTeam',
      numAthletes: 3,
      duration: 'dur_90min',
      titles: ['crossesAerialDominance'],
      generalObjectives: ['developAerialDominance'],
      objectives: {
        technical: 'exampleTechnical',
        tactical: 'exampleTactical',
        physical: 'examplePhysical',
        cognitive: 'exampleCognitive',
      },
      warmup: [
        {
          id: 'w1',
          type: 'warmup',
          title: 'exampleWarmupObjective',
          objective: 'exampleWarmupObjective',
          organization: 'ex1Organization',
          execution: 'exampleWarmupDescription',
          progression: 'exampleWarmupProgression',
          successCriteria: 'ex1SuccessCriteria',
          duration: 'dur_15min',
          intensity: 'low',
        }
      ],
      exercises: [
        {
          id: 'ex1',
          type: 'analytical',
          title: 'ex1Title',
          objective: 'ex1Objective',
          organization: 'ex1Organization',
          execution: 'ex1Execution',
          progression: 'ex1Progression',
          successCriteria: 'ex1SuccessCriteria',
          duration: 'dur_15min',
          intensity: 'medium',
        },
        {
          id: 'ex2',
          type: 'decision',
          title: 'ex2Title',
          objective: 'ex2Objective',
          organization: 'ex2Organization',
          execution: 'ex2Execution',
          progression: 'ex2Progression',
          successCriteria: 'ex2SuccessCriteria',
          duration: 'dur_20min',
          intensity: 'high',
        },
        {
          id: 'ex3',
          type: 'contextualized',
          title: 'ex3Title',
          objective: 'ex3Objective',
          organization: 'ex3Organization',
          execution: 'ex3Execution',
          progression: 'ex3Progression',
          successCriteria: 'ex3SuccessCriteria',
          duration: 'dur_25min',
          intensity: 'high',
        }
      ],
      integratedWithTeam: [{ id: crypto.randomUUID(), format: 'crossingDuel', number: 'gkPlus4vs4PlusGk', space: 'halfFieldSpace', time: 'dur_20min' }],
      coolDown: 'recoveryTalkHydration',
      observations: {
        positives: 'excellentFocusThroughout',
        adjustments: 'improveTimingExits',
        individualEval: 'playerGreatProgress',
      },
      focus: ['Crosses', 'Decision Making'],
      time: '10:00 - 11:30',
      attending: ['MV', 'LS'],
    });
  };

  return (
    <div className="flex min-h-screen bg-background text-on-surface selection:bg-primary selection:text-on-primary">
      {/* Sidebar */}
      <aside className={cn(
        "hidden md:flex flex-col fixed left-0 top-0 h-full bg-surface/80 backdrop-blur-xl border-r border-black/5 z-50 transition-all duration-300 ease-in-out",
        isSidebarCollapsed ? "w-20" : "w-64"
      )}>
        <div className={cn("py-8 flex items-center", isSidebarCollapsed ? "px-0 justify-center" : "px-6 justify-between")}>
          {!isSidebarCollapsed && (
            <div>
              <h1 className="text-xl font-black text-on-surface font-headline tracking-tight">GKLAB</h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-label mt-1">{t('commandCenter')}</p>
            </div>
          )}
          {isSidebarCollapsed && (
            <h1 className="text-xl font-black text-on-surface font-headline tracking-tight">GK</h1>
          )}
        </div>

        <nav className="flex-1 space-y-1">
          <SidebarItem icon={LayoutDashboard} labelKey="dashboard" active={activeTab === 'Dashboard'} onClick={() => setActiveTab('Dashboard')} isCollapsed={isSidebarCollapsed} t={t} />
          <SidebarItem icon={DumbbellIcon} labelKey="sessions" active={activeTab === 'Training'} onClick={() => setActiveTab('Training')} isCollapsed={isSidebarCollapsed} t={t} />
          <SidebarItem icon={Target} labelKey="exercises" active={activeTab === 'Exercises'} onClick={() => setActiveTab('Exercises')} isCollapsed={isSidebarCollapsed} t={t} />
          <SidebarItem icon={Users} labelKey="athletes" active={activeTab === 'Goalkeepers'} onClick={() => setActiveTab('Goalkeepers')} isCollapsed={isSidebarCollapsed} t={t} />
          <SidebarItem icon={Calendar} labelKey="planning" active={activeTab === 'Planning'} onClick={() => setActiveTab('Planning')} isCollapsed={isSidebarCollapsed} t={t} />
          <SidebarItem icon={Video} labelKey="videos" active={activeTab === 'Videos'} onClick={() => setActiveTab('Videos')} isCollapsed={isSidebarCollapsed} t={t} />
        </nav>

        <div className="mt-auto py-6 border-t border-black/5 space-y-1">
          <button
            onClick={() => changeLanguage(isPortuguese ? 'en' : 'pt')}
            className={cn(
              "flex items-center w-full py-3 transition-all duration-200 ease-in-out font-label text-sm font-semibold group",
              isSidebarCollapsed ? "justify-center px-0" : "px-6",
              "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
            )}
            title={isPortuguese ? "Switch to English" : "Mudar para Portugues"}
          >
            <Globe className={cn("w-5 h-5 transition-transform group-hover:scale-110", !isSidebarCollapsed && "mr-3")} />
            {!isSidebarCollapsed && (
              <span className="text-xs font-bold uppercase tracking-widest">
                {isPortuguese ? 'EN' : 'PT'}
              </span>
            )}
          </button>
          <SidebarItem icon={HelpCircle} labelKey="support" active={activeTab === 'Support'} onClick={() => setActiveTab('Support')} isCollapsed={isSidebarCollapsed} t={t} />
          <SidebarItem icon={LogOut} labelKey="logout" active={false} onClick={() => alert(t('authNotConfigured'))} isCollapsed={isSidebarCollapsed} t={t} />
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className={cn(
              "flex items-center w-full py-3 mt-4 transition-all duration-200 ease-in-out font-label text-sm font-semibold group text-on-surface-variant hover:text-on-surface hover:bg-surface-container",
              isSidebarCollapsed ? "justify-center px-0" : "px-6"
            )}
            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="w-5 h-5 transition-transform group-hover:scale-110" />
            ) : (
              <>
                <ChevronLeft className="w-5 h-5 mr-3 transition-transform group-hover:scale-110" />
                {t('collapse')}
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "flex-1 min-h-screen transition-all duration-300 ease-in-out",
        isSidebarCollapsed ? "md:ml-20" : "md:ml-64"
      )}>
        {/* Header */}
        <header className="flex items-center justify-between px-8 h-16 bg-surface-container-low/50 backdrop-blur-md border-b border-black/5 sticky top-0 z-40">
          <div className="flex items-center gap-6">
            <h2 className="text-lg font-bold text-on-surface font-headline tracking-tight">{t('tacticalHUD')}</h2>
            <div className="hidden lg:flex items-center bg-surface-container-lowest px-4 py-1.5 rounded-lg border border-black/5">
              <Search className="text-on-surface-variant w-4 h-4 mr-2" />
              <input
                type="text"
                placeholder={t('searchDataPoints')}
                className="bg-transparent border-none text-xs focus:ring-0 text-on-surface w-48 font-label placeholder:text-on-surface-variant/50"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-on-surface-variant hover:bg-surface-container-high transition-colors rounded-lg relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-surface-container-low" />
            </button>
            <button className="p-2 text-on-surface-variant hover:bg-surface-container-high transition-colors rounded-lg">
              <Settings className="w-5 h-5" />
            </button>
            <div className="h-8 w-8 rounded-full overflow-hidden border border-primary/20 ml-2 cursor-pointer hover:scale-110 transition-transform">
              <img
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=256&h=256&auto=format&fit=crop"
                alt="Coach"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </header>

        {/* Tab Content */}
        <div className="p-8 max-w-[1600px] mx-auto space-y-8">
          <AnimatePresence mode="wait">

            {/* ===== DASHBOARD TAB ===== */}
            {activeTab === 'Dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-8 space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-bold font-headline tracking-tight">{t('trainingSchedule')} <span className="text-on-surface-variant font-medium text-lg ml-2">{t('week')} 42</span></h3>
                      <button onClick={() => setActiveTab('Planning')} className="bg-primary hover:bg-primary-dim text-on-primary px-4 py-2 rounded-md font-label text-xs font-bold transition-all active:scale-95 flex items-center">
                        <Edit3 className="w-3 h-3 mr-2" />
                        {t('modifyPlan')}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-7 gap-2">
                      {(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const).map((dayKey, i) => {
                        const day = t(dayKey);
                        const isToday = dayKey === 'wed';
                        const isOff = dayKey === 'sun' || dayKey === 'sat';
                        return (
                          <div
                            key={dayKey}
                            className={cn(
                              "p-4 rounded-lg border-t-2 transition-all",
                              isToday ? "bg-surface-container-high border-primary ring-1 ring-primary/20" : "bg-surface-container border-black/5",
                              isOff && "opacity-50"
                            )}
                          >
                            <p className={cn("text-[10px] font-label uppercase mb-2", isToday ? "text-primary" : "text-on-surface-variant")}>
                              {day} {isToday && `(${t('today')})`}
                            </p>
                            <p className="text-xs font-bold font-headline">
                              {i === 0 ? t('recovery') : i === 1 ? t('reaction') : i === 2 ? t('u23Dev') : i === 3 ? t('crosses') : i === 4 ? t('matchPrep') : t('off')}
                            </p>
                            {isToday && <span className="text-[9px] text-on-surface-variant block mt-1">02:30 PM</span>}
                          </div>
                        );
                      })}
                    </div>

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
                              <h4 className="text-xl font-black font-headline">{sessions[0].title}</h4>
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
                              <p className="text-xs text-on-surface-variant font-body leading-relaxed">{sessions[0].generalObjective}</p>
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
              </motion.div>
            )}

            {/* ===== TRAINING TAB ===== */}
            {activeTab === 'Training' && (
              <motion.div
                key="training"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-black font-headline tracking-tight text-on-surface">{t('trainingSessions')}</h2>
                  {!isAddingSession && (
                    <button
                      onClick={() => setIsAddingSession(true)}
                      className="bg-primary hover:bg-primary-dim text-on-primary px-4 py-2 rounded-md font-label text-xs font-bold transition-all active:scale-95 flex items-center"
                    >
                      <Dumbbell className="w-4 h-4 mr-2" />
                      {t('newSession')}
                    </button>
                  )}
                </div>

                <AnimatePresence>
                  {isTacticalBoardOpen && (
                    <TacticalBoard
                      onClose={() => setIsTacticalBoardOpen(false)}
                      onSave={(dataUrl) => {
                        if (editingDrillId) {
                          setNewSession(prev => ({
                            ...prev,
                            warmup: drillContext === 'warmup'
                              ? prev.warmup.map(d => d.id === editingDrillId ? { ...d, diagram: dataUrl } : d)
                              : prev.warmup,
                            exercises: drillContext === 'main'
                              ? prev.exercises.map(d => d.id === editingDrillId ? { ...d, diagram: dataUrl } : d)
                              : prev.exercises
                          }));
                        } else {
                          setCurrentDrill(prev => ({ ...prev, diagram: dataUrl }));
                        }
                        setIsTacticalBoardOpen(false);
                      }}
                    />
                  )}
                  {isSelectingFromLibrary && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsSelectingFromLibrary(false)}
                        className="absolute inset-0 bg-surface/80 backdrop-blur-sm"
                      />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative bg-surface-container border border-black/10 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col"
                      >
                        <div className="p-6 border-b border-black/10 flex items-center justify-between bg-surface-container-highest">
                          <div>
                            <h3 className="text-xl font-bold text-on-surface flex items-center gap-2">
                              <Library className="w-5 h-5 text-secondary" />
                              {t('selectFromLibrary')}
                            </h3>
                            <p className="text-[10px] text-on-surface-variant uppercase font-label tracking-widest mt-1">{t('choosePreDesignedExercise')}</p>
                          </div>
                          <button onClick={() => setIsSelectingFromLibrary(false)} className="text-on-surface-variant hover:text-on-surface transition-colors">
                            <X className="w-6 h-6" />
                          </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10">
                          <div className="relative max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                            <input
                              type="text"
                              value={exerciseSearchTerm}
                              onChange={(e) => setExerciseSearchTerm(e.target.value)}
                              placeholder={t('searchSavedExercises')}
                              className="w-full bg-surface-container-highest border border-black/10 rounded-full pl-10 pr-4 py-2 text-sm focus:border-secondary transition-all"
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {exercisesLibrary
                              .filter(ex =>
                                ex.title.toLowerCase().includes(exerciseSearchTerm.toLowerCase()) ||
                                ex.objective.toLowerCase().includes(exerciseSearchTerm.toLowerCase())
                              )
                              .map(ex => (
                                <button
                                  key={ex.id}
                                  type="button"
                                  onClick={() => {
                                    setNewSession(prev => ({
                                      ...prev,
                                      exercises: [...prev.exercises, ex]
                                    }));
                                    setIsSelectingFromLibrary(false);
                                  }}
                                  className="bg-surface-container-highest p-4 rounded-xl border border-black/5 hover:border-secondary transition-all text-left group"
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="bg-secondary/20 text-secondary text-[8px] font-bold px-2 py-0.5 rounded uppercase tracking-widest">{ex.type}</span>
                                    <span className="text-[10px] text-on-surface-variant">{ex.duration}</span>
                                  </div>
                                  <h4 className="text-sm font-bold text-on-surface group-hover:text-secondary transition-colors line-clamp-1">{ex.title}</h4>
                                  <p className="text-[10px] text-on-surface-variant line-clamp-2 mt-1">{ex.objective}</p>
                                </button>
                              ))}

                            {exercisesLibrary.length === 0 && (
                              <div className="col-span-full flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-black/10 rounded-xl">
                                <Target className="w-10 h-10 text-on-surface-variant mb-3" />
                                <h4 className="text-lg font-bold text-on-surface mb-1">{t('libraryEmpty')}</h4>
                                <p className="text-[10px] text-on-surface-variant max-w-xs mb-4">{t('libraryEmptyDescription')}</p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsSelectingFromLibrary(false);
                                    setActiveTab('Exercises');
                                  }}
                                  className="text-secondary text-[10px] font-bold uppercase hover:underline"
                                >
                                  {t('goToExerciseLibrary')}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="p-6 border-t border-black/10 flex justify-end">
                          <button
                            type="button"
                            onClick={() => setIsSelectingFromLibrary(false)}
                            className="px-6 py-2 rounded-md font-label text-xs font-bold text-on-surface-variant hover:text-on-surface transition-all"
                          >
                            {t('cancel').toUpperCase()}
                          </button>
                        </div>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>

                {isAddingSession ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-surface-container p-0 rounded-xl border border-black/10 w-full max-w-[98vw] mx-auto overflow-hidden flex flex-col max-h-[95vh]"
                  >
                    <div className="bg-surface-container-highest p-6 border-b border-black/10 flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-on-surface flex items-center gap-2">
                          <FileText className="w-5 h-5 text-primary" />
                          {t('professionalTrainingSheet')}
                        </h3>
                        <p className="text-[10px] text-on-surface-variant uppercase font-label tracking-widest mt-1">{t('structuredMethodology')}</p>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={loadExample}
                          className="text-[10px] bg-secondary/10 text-secondary border border-secondary/20 px-3 py-1.5 rounded hover:bg-secondary/20 transition-all font-bold"
                        >
                          {t('loadExampleCrosses')}
                        </button>
                        <button
                          onClick={() => setIsAddingSession(false)}
                          className="text-on-surface-variant hover:text-on-surface transition-colors"
                        >
                          <X className="w-6 h-6" />
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-thin scrollbar-thumb-white/10">
                      <form id="sessionForm" onSubmit={handleAddSession} className="space-y-8">

                        {/* 1. Identification */}
                        <Section title={t('sessionIdentification')} icon={Users}>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1">
                               <div className="flex justify-between items-center">
                                 <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('sessionTitle')}</label>
                                 <QuickSelect
                                   label="Presets"
                                   multiSelect
                                   selectedValues={newSession.titles}
                                   options={getOptions('sessionTitles', PRESETS.sessionTitles)}
                                   onSelect={(val) => applySessionTemplates(val as string[])}
                                   onDelete={(val) => removeCustomPreset('sessionTitles', val)}
                                   isDeletable={(val) => customPresets.sessionTitles.includes(val)}
                                 />
                               </div>
                               <textarea 
                                 value={newSession.titles.map(t_ => t(t_ as any)).join(', ')} 
                                 onChange={e => setNewSession({ ...newSession, titles: e.target.value.split(',').map(s => s.trim()).filter(s => s !== '') })} 
                                 onBlur={() => newSession.titles.forEach(t_ => addCustomPreset('sessionTitles', t_, PRESETS.sessionTitles))}
                                 className="w-full bg-surface-container-highest border border-black/10 rounded px-3 py-2 text-sm min-h-[40px]" 
                                 placeholder={t('drillTitlePlaceholder')} 
                               />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('date')}</label>
                              <input type="date" value={newSession.date} onChange={e => setNewSession({ ...newSession, date: e.target.value })} className="w-full bg-surface-container-highest border border-black/10 rounded px-3 py-2 text-sm" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('category')}</label>
                              <div className="flex gap-2">
                                <input 
                                  type="text" 
                                  value={translateContent(newSession.category as string)} 
                                  onChange={e => setNewSession({ ...newSession, category: e.target.value })} 
                                  onBlur={() => addCustomPreset('categories', newSession.category, PRESETS.categories)}
                                  className="flex-1 bg-surface-container-highest border border-black/10 rounded px-3 py-2 text-sm" 
                                />
                                <QuickSelect
                                  label="Presets"
                                  options={getOptions('categories', PRESETS.categories)}
                                  onSelect={(val) => setNewSession({ ...newSession, category: val })}
                                  onDelete={(val) => removeCustomPreset('categories', val)}
                                  isDeletable={(val) => customPresets.categories.includes(val)}
                                />
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1">
                              <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('numAthletes')}</label>
                              <input type="number" value={newSession.numAthletes} onChange={e => setNewSession({ ...newSession, numAthletes: parseInt(e.target.value) })} className="w-full bg-surface-container-highest border border-black/10 rounded px-3 py-2 text-sm" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('totalDuration')}</label>
                              <div className="flex gap-2">
                                <input type="text" value={translateContent(newSession.duration as string)} onChange={e => setNewSession({ ...newSession, duration: e.target.value })} className="flex-1 bg-surface-container-highest border border-black/10 rounded px-3 py-2 text-sm" placeholder={t('duration')} />
                                <QuickSelect
                                  label="Presets"
                                  options={getOptions('durations', PRESETS.durations)}
                                  onSelect={(val) => setNewSession({ ...newSession, duration: val })}
                                  onDelete={(val) => removeCustomPreset('durations', val)}
                                  isDeletable={(val) => customPresets.durations.includes(val)}
                                />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between items-center">
                                <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('generalObjective')}</label>
                                <QuickSelect
                                  label="Presets"
                                  multiSelect
                                  selectedValues={newSession.generalObjectives}
                                  options={getOptions('generalObjectives', PRESETS.objectives.general)}
                                  onSelect={(val) => handleGeneralObjectivesChange(val as string[])}
                                  onDelete={(val) => removeCustomPreset('generalObjectives', val)}
                                  isDeletable={(val) => customPresets.generalObjectives.includes(val)}
                                />
                              </div>
                               <textarea 
                                 value={newSession.generalObjectives.map(o => t(o as any)).join(', ')} 
                                 onChange={e => setNewSession({ ...newSession, generalObjectives: e.target.value.split(',').map(s => s.trim()) })} 
                                 className="w-full bg-surface-container-highest border border-black/10 rounded px-3 py-2 text-sm min-h-[60px]" 
                                 placeholder={t('objectivePlaceholder')} 
                               />
                            </div>
                          </div>
                        </Section>

                        {/* 2. Specific Objectives */}
                        <Section title={t('sectionObjectives')} icon={Target}>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <div className="flex justify-between items-center">
                                <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('technical')}</label>
                                <QuickSelect
                                  label="Presets"
                                  options={getOptions('technical', PRESETS.objectives.technical)}
                                  onSelect={(val) => setNewSession({ ...newSession, objectives: { ...newSession.objectives, technical: val } })}
                                  onDelete={(val) => removeCustomPreset('technical', val)}
                                  isDeletable={(val) => customPresets.technical.includes(val)}
                                />
                              </div>
                              <textarea value={translateContent(newSession.objectives.technical as string)} onChange={e => setNewSession({ ...newSession, objectives: { ...newSession.objectives, technical: e.target.value } })} className="w-full bg-surface-container-highest border border-black/10 rounded px-3 py-2 text-xs min-h-[60px]" placeholder={t('technical')} />
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between items-center">
                                <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('tactical')}</label>
                                <QuickSelect
                                  label="Presets"
                                  options={getOptions('tactical', PRESETS.objectives.tactical)}
                                  onSelect={(val) => setNewSession({ ...newSession, objectives: { ...newSession.objectives, tactical: val } })}
                                  onDelete={(val) => removeCustomPreset('tactical', val)}
                                  isDeletable={(val) => customPresets.tactical.includes(val)}
                                />
                              </div>
                              <textarea value={translateContent(newSession.objectives.tactical as string)} onChange={e => setNewSession({ ...newSession, objectives: { ...newSession.objectives, tactical: e.target.value } })} className="w-full bg-surface-container-highest border border-black/10 rounded px-3 py-2 text-xs min-h-[60px]" placeholder="Tactical positioning/decisions..." />
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between items-center">
                                <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('physical')}</label>
                                <QuickSelect
                                  label="Presets"
                                  options={getOptions('physical', PRESETS.objectives.physical)}
                                  onSelect={(val) => setNewSession({ ...newSession, objectives: { ...newSession.objectives, physical: val } })}
                                  onDelete={(val) => removeCustomPreset('physical', val)}
                                  isDeletable={(val) => customPresets.physical.includes(val)}
                                />
                              </div>
                              <textarea value={translateContent(newSession.objectives.physical as string)} onChange={e => setNewSession({ ...newSession, objectives: { ...newSession.objectives, physical: e.target.value } })} className="w-full bg-surface-container-highest border border-black/10 rounded px-3 py-2 text-xs min-h-[60px]" placeholder="Physical load/focus..." />
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between items-center">
                                <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('cognitive')}</label>
                                <QuickSelect
                                  label="Presets"
                                  options={getOptions('cognitive', PRESETS.objectives.cognitive)}
                                  onSelect={(val) => setNewSession({ ...newSession, objectives: { ...newSession.objectives, cognitive: val } })}
                                  onDelete={(val) => removeCustomPreset('cognitive', val)}
                                  isDeletable={(val) => customPresets.cognitive.includes(val)}
                                />
                              </div>
                              <textarea value={translateContent(newSession.objectives.cognitive as string)} onChange={e => setNewSession({ ...newSession, objectives: { ...newSession.objectives, cognitive: e.target.value } })} className="w-full bg-surface-container-highest border border-black/10 rounded px-3 py-2 text-xs min-h-[60px]" placeholder="Decision making focus..." />
                            </div>
                          </div>
                        </Section>

                        {/* 3. Warm-up */}
                        <Section title={t('sectionWarmUp')} icon={Clock}>
                          <div className="space-y-4">
                            {newSession.warmup.map((drill, idx) => (
                              <div key={drill.id} className="bg-surface-container-highest p-4 rounded-lg border border-black/5 relative group">
                                <div className="absolute top-2 right-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                  <button
                                    type="button"
                                    onClick={() => handleEditDrill(drill, 'warmup')}
                                    className="text-on-surface-variant hover:text-primary"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveDrill(drill.id)}
                                    className="text-on-surface-variant hover:text-error"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="bg-primary/20 text-primary text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest">{t(drill.type as any)}</span>
                                  <h5 className="text-sm font-bold text-on-surface">{idx + 1}. {t(drill.title as any)}</h5>
                                  <span className="text-[10px] text-on-surface-variant ml-auto flex items-center"><Clock className="w-3 h-3 mr-1" /> {t(drill.duration as any)}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-[10px]">
                                  <div><span className="text-primary uppercase font-bold">{t('objective')}:</span> {t(drill.objective as any)}</div>
                                  <div><span className="text-primary uppercase font-bold">{t('organization')}:</span> {t(drill.organization as any)}</div>
                                </div>
                                {drill.diagram && (
                                  <div className="mt-2 text-[8px] text-primary flex items-center gap-1 font-bold">
                                    <FileImage className="w-3 h-3" /> {t('diagramAttached')}
                                  </div>
                                )}
                              </div>
                            ))}

                            {isAddingDrill && drillContext === 'warmup' ? (
                              <div className="bg-surface-container-highest p-6 rounded-xl border border-primary/20 space-y-6">
                                <div className="flex justify-between items-center mb-2">
                                  <h4 className="text-xs font-bold text-primary uppercase tracking-widest">{editingDrillId ? t('editWarmup') : t('newWarmup')}</h4>
                                  <button type="button" onClick={handleCancelDrill} className="text-on-surface-variant hover:text-error transition-colors"><X className="w-4 h-4" /></button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div className="space-y-4">
                                    <div className="space-y-1">
                                      <div className="flex justify-between items-center">
                                        <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('drillTitle')}</label>
                                        <QuickSelect
                                          label="Presets"
                                          options={getOptions('drillTitles', PRESETS.drills.titles)}
                                          onSelect={(val) => applyDrillTemplate(val as string)}
                                          onDelete={(val) => removeCustomPreset('drillTitles', val)}
                                          isDeletable={(val) => customPresets.drillTitles.includes(val)}
                                        />
                                      </div>
                                      <input type="text" value={translateContent(currentDrill.title)} onChange={e => setCurrentDrill({ ...currentDrill, title: e.target.value })} className="w-full bg-surface-container border border-black/5 rounded px-3 py-2 text-xs" />
                                    </div>
                                    <div className="space-y-1">
                                      <div className="flex justify-between items-center">
                                        <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('type')}</label>
                                      </div>
                                      <select value={currentDrill.type} onChange={e => setCurrentDrill({ ...currentDrill, type: e.target.value as any })} className="w-full bg-surface-container border border-black/5 rounded px-3 py-2 text-xs">
                                        {PRESETS.drillTypes.map(type => (
                                          <option key={type} value={type}>{t(type as any)}</option>
                                        ))}
                                      </select>
                                    </div>
                                    <div className="space-y-1">
                                      <div className="flex justify-between items-center">
                                        <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('objective')}</label>
                                        <QuickSelect
                                          label="Presets"
                                          options={getOptions('drillObjectives', PRESETS.drills.objectives)}
                                          onSelect={(val) => setCurrentDrill({ ...currentDrill, objective: val })}
                                          onDelete={(val) => removeCustomPreset('drillObjectives', val)}
                                          isDeletable={(val) => customPresets.drillObjectives.includes(val)}
                                        />
                                      </div>
                                      <textarea 
                                        value={translateContent(currentDrill.objective)} 
                                        onChange={e => setCurrentDrill({ ...currentDrill, objective: e.target.value })} 
                                        onBlur={() => addCustomPreset('drillObjectives', currentDrill.objective, PRESETS.drills.objectives)}
                                        className="w-full bg-surface-container border border-black/5 rounded px-3 py-2 text-xs min-h-[60px]" 
                                      />
                                    </div>
                                  </div>

                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-1">
                                        <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('duration')}</label>
                                        <div className="flex gap-2">
                                          <input type="text" value={translateContent(currentDrill.duration)} onChange={e => setCurrentDrill({ ...currentDrill, duration: e.target.value })} className="flex-1 bg-surface-container border border-black/5 rounded px-3 py-2 text-xs" />
                                          <QuickSelect
                                            label="Presets"
                                            options={getOptions('durations', PRESETS.durations)}
                                            onSelect={(val) => setCurrentDrill({ ...currentDrill, duration: val })}
                                            onDelete={(val) => removeCustomPreset('durations', val)}
                                            isDeletable={(val) => customPresets.durations.includes(val)}
                                          />
                                        </div>
                                      </div>
                                      <div className="space-y-1">
                                        <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('intensity')}</label>
                                        <select value={currentDrill.intensity} onChange={e => setCurrentDrill({ ...currentDrill, intensity: e.target.value as any })} className="w-full bg-surface-container border border-black/5 rounded px-3 py-2 text-xs">
                                          {PRESETS.intensities.map(intensity => (
                                            <option key={intensity} value={intensity}>{t(intensity as any)}</option>
                                          ))}
                                        </select>
                                      </div>
                                    </div>

                                    <div className="space-y-1">
                                      <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('diagram')}</label>
                                      <button
                                        type="button"
                                        onClick={() => setIsTacticalBoardOpen(true)}
                                        className={cn(
                                          "w-full h-32 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all",
                                          currentDrill.diagram ? "border-primary bg-primary/5" : "border-black/10 hover:border-primary/50"
                                        )}
                                      >
                                        {currentDrill.diagram ? (
                                          <img src={currentDrill.diagram} alt="Diagram" className="h-full w-full object-contain p-2" referrerPolicy="no-referrer" />
                                        ) : (
                                          <>
                                            <Target className="w-6 h-6 text-on-surface-variant" />
                                            <span className="text-[8px] font-bold uppercase">{t('designExercise')}</span>
                                          </>
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                      <div className="flex justify-between items-center">
                                        <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('organization')}</label>
                                        <QuickSelect
                                          label="Presets"
                                          options={getOptions('drillOrganizations', PRESETS.drills.organizations)}
                                          onSelect={(val) => setCurrentDrill({ ...currentDrill, organization: val })}
                                          onDelete={(val) => removeCustomPreset('drillOrganizations', val)}
                                          isDeletable={(val) => customPresets.drillOrganizations.includes(val)}
                                        />
                                      </div>
                                      <textarea 
                                        value={translateContent(currentDrill.organization)} 
                                        onChange={e => setCurrentDrill({ ...currentDrill, organization: e.target.value })} 
                                        onBlur={() => addCustomPreset('drillOrganizations', currentDrill.organization, PRESETS.drills.organizations)}
                                        className="w-full bg-surface-container border border-black/5 rounded px-3 py-2 text-xs min-h-[60px]" 
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <div className="flex justify-between items-center">
                                        <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('execution')}</label>
                                        <QuickSelect
                                          label="Presets"
                                          options={getOptions('drillExecutions', PRESETS.drills.executions)}
                                          onSelect={(val) => setCurrentDrill({ ...currentDrill, execution: val })}
                                          onDelete={(val) => removeCustomPreset('drillExecutions', val)}
                                          isDeletable={(val) => customPresets.drillExecutions.includes(val)}
                                        />
                                      </div>
                                      <textarea 
                                        value={translateContent(currentDrill.execution)} 
                                        onChange={e => setCurrentDrill({ ...currentDrill, execution: e.target.value })} 
                                        onBlur={() => addCustomPreset('drillExecutions', currentDrill.execution, PRESETS.drills.executions)}
                                        className="w-full bg-surface-container border border-black/5 rounded px-3 py-2 text-xs min-h-[60px]" 
                                      />
                                    </div>
                                  </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t border-black/5">
                                  <button type="button" onClick={handleCancelDrill} className="px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-black/5 rounded transition-all">{t('discard')}</button>
                                  <button type="button" onClick={handleAddDrill} className="bg-primary text-on-primary px-6 py-2 rounded text-xs font-bold uppercase tracking-widest hover:bg-primary-dim transition-all active:scale-95 shadow-lg shadow-primary/20">{editingDrillId ? t('saveChanges') : t('addExerciseToSession')}</button>
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setDrillContext('warmup');
                                  setIsAddingDrill(true);
                                  setCurrentDrill({ ...emptyDrill, type: 'warmup' });
                                }}
                                className="w-full py-4 border-2 border-dashed border-black/10 rounded-lg text-on-surface-variant hover:border-primary hover:text-primary transition-all flex flex-col items-center justify-center gap-2"
                              >
                                <Plus className="w-6 h-6" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">{t('addWarmup')}</span>
                              </button>
                            )}
                          </div>
                        </Section>

                        {/* 4. Main Part */}
                        <Section title={t('mainPartExercises')} icon={Dumbbell}>
                          <div className="space-y-4">
                            {newSession.exercises.map((drill, idx) => (
                              <div key={drill.id} className="bg-surface-container-highest p-4 rounded-lg border border-black/5 relative group">
                                <div className="absolute top-2 right-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                  <button
                                    type="button"
                                    onClick={() => handleEditDrill(drill, 'main')}
                                    className="text-on-surface-variant hover:text-primary"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveDrill(drill.id)}
                                    className="text-on-surface-variant hover:text-error"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="bg-primary/20 text-primary text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest">{t(drill.type as any)}</span>
                                  <h5 className="text-sm font-bold text-on-surface">{idx + 1}. {t(drill.title as any)}</h5>
                                  <span className="text-[10px] text-on-surface-variant ml-auto flex items-center"><Clock className="w-3 h-3 mr-1" /> {t(drill.duration as any)}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-[10px]">
                                  <div><span className="text-primary uppercase font-bold">{t('objective')}:</span> {t(drill.objective as any)}</div>
                                  <div><span className="text-primary uppercase font-bold">{t('organization')}:</span> {t(drill.organization as any)}</div>
                                </div>
                                {drill.diagram && (
                                  <div className="mt-2 text-[8px] text-primary flex items-center gap-1 font-bold">
                                    <FileImage className="w-3 h-3" /> {t('diagramAttached')}
                                  </div>
                                )}
                              </div>
                            ))}

                            {isAddingDrill && drillContext === 'main' ? (
                              <div className="bg-surface-container-highest p-6 rounded-xl border border-primary/20 space-y-6">
                                <div className="flex justify-between items-center mb-2">
                                  <h4 className="text-xs font-bold text-primary uppercase tracking-widest">{editingDrillId ? t('editExercise') : t('newExercise')}</h4>
                                  <button type="button" onClick={handleCancelDrill} className="text-on-surface-variant hover:text-error transition-colors"><X className="w-4 h-4" /></button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div className="space-y-4">
                                    <div className="space-y-1">
                                      <div className="flex justify-between items-center">
                                        <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('type')}</label>
                                      </div>
                                      <select value={currentDrill.type} onChange={e => setCurrentDrill({ ...currentDrill, type: e.target.value as any })} className="w-full bg-surface-container border border-black/5 rounded px-3 py-2 text-xs">
                                        {PRESETS.drillTypes.map(type => (
                                          <option key={type} value={type}>{t(type as any)}</option>
                                        ))}
                                      </select>
                                    </div>
                                    <div className="space-y-1">
                                      <div className="flex justify-between items-center">
                                        <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('drillTitle')}</label>
                                        <QuickSelect
                                          label="Presets"
                                          options={getOptions('drillTitles', PRESETS.drills.titles)}
                                          onSelect={(val) => applyDrillTemplate(val as string)}
                                          onDelete={(val) => removeCustomPreset('drillTitles', val)}
                                          isDeletable={(val) => customPresets.drillTitles.includes(val)}
                                        />
                                      </div>
                                      <input 
                                        type="text" 
                                        value={translateContent(currentDrill.title)} 
                                        onChange={e => setCurrentDrill({ ...currentDrill, title: e.target.value })} 
                                        onBlur={() => addCustomPreset('drillTitles', currentDrill.title, PRESETS.drills.titles)}
                                        className="w-full bg-surface-container border border-black/5 rounded px-3 py-2 text-xs" 
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <div className="flex justify-between items-center">
                                        <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('objective')}</label>
                                        <QuickSelect
                                          label="Presets"
                                          options={getOptions('drillObjectives', PRESETS.drills.objectives)}
                                          onSelect={(val) => setCurrentDrill({ ...currentDrill, objective: val })}
                                          onDelete={(val) => removeCustomPreset('drillObjectives', val)}
                                          isDeletable={(val) => customPresets.drillObjectives.includes(val)}
                                        />
                                      </div>
                                      <textarea 
                                        value={translateContent(currentDrill.objective)} 
                                        onChange={e => setCurrentDrill({ ...currentDrill, objective: e.target.value })} 
                                        onBlur={() => addCustomPreset('drillObjectives', currentDrill.objective, PRESETS.drills.objectives)}
                                        className="w-full bg-surface-container border border-black/5 rounded px-3 py-2 text-xs min-h-[60px]" 
                                      />
                                    </div>
                                  </div>

                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-1">
                                        <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('duration')}</label>
                                        <div className="flex gap-2">
                                          <input type="text" value={translateContent(currentDrill.duration)} onChange={e => setCurrentDrill({ ...currentDrill, duration: e.target.value })} className="flex-1 bg-surface-container border border-black/5 rounded px-3 py-2 text-xs" />
                                          <QuickSelect
                                            label="Presets"
                                            options={getOptions('durations', PRESETS.durations)}
                                            onSelect={(val) => setCurrentDrill({ ...currentDrill, duration: val })}
                                            onDelete={(val) => removeCustomPreset('durations', val)}
                                            isDeletable={(val) => customPresets.durations.includes(val)}
                                          />
                                        </div>
                                      </div>
                                      <div className="space-y-1">
                                        <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('intensity')}</label>
                                        <select value={currentDrill.intensity} onChange={e => setCurrentDrill({ ...currentDrill, intensity: e.target.value as any })} className="w-full bg-surface-container border border-black/5 rounded px-3 py-2 text-xs">
                                          {PRESETS.intensities.map(intensity => (
                                            <option key={intensity} value={intensity}>{t(intensity as any)}</option>
                                          ))}
                                        </select>
                                      </div>
                                    </div>

                                    <div className="space-y-1">
                                      <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('diagram')}</label>
                                      <div className="flex gap-2">
                                        <button
                                          type="button"
                                          onClick={() => setIsTacticalBoardOpen(true)}
                                          className={cn(
                                            "flex-1 h-32 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all",
                                            currentDrill.diagram ? "border-primary bg-primary/5" : "border-black/10 hover:border-primary/50"
                                          )}
                                        >
                                          {currentDrill.diagram ? (
                                            <img src={currentDrill.diagram} alt="Diagram" className="h-full w-full object-contain p-2" referrerPolicy="no-referrer" />
                                          ) : (
                                            <>
                                              <Target className="w-6 h-6 text-on-surface-variant" />
                                              <span className="text-[8px] font-bold uppercase">{t('designExercise')}</span>
                                            </>
                                          )}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setIsSelectingFromLibrary(true)}
                                          className="flex-1 h-32 border-2 border-dashed border-black/10 rounded-lg text-on-surface-variant hover:border-secondary hover:text-secondary transition-all flex flex-col items-center justify-center gap-2"
                                        >
                                          <Library className="w-6 h-6" />
                                          <span className="text-[8px] font-bold uppercase tracking-widest">{t('fromLibrary')}</span>
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                      <div className="flex justify-between items-center">
                                        <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('organization')}</label>
                                        <QuickSelect
                                          label="Presets"
                                          options={getOptions('drillOrganizations', PRESETS.drills.organizations)}
                                          onSelect={(val) => setCurrentDrill({ ...currentDrill, organization: val })}
                                          onDelete={(val) => removeCustomPreset('drillOrganizations', val)}
                                          isDeletable={(val) => customPresets.drillOrganizations.includes(val)}
                                        />
                                      </div>
                                      <textarea 
                                        value={translateContent(currentDrill.organization)} 
                                        onChange={e => setCurrentDrill({ ...currentDrill, organization: e.target.value })} 
                                        onBlur={() => addCustomPreset('drillOrganizations', currentDrill.organization, PRESETS.drills.organizations)}
                                        className="w-full bg-surface-container border border-black/5 rounded px-3 py-2 text-xs min-h-[60px]" 
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <div className="flex justify-between items-center">
                                        <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('execution')}</label>
                                        <QuickSelect
                                          label="Presets"
                                          options={getOptions('drillExecutions', PRESETS.drills.executions)}
                                          onSelect={(val) => setCurrentDrill({ ...currentDrill, execution: val })}
                                          onDelete={(val) => removeCustomPreset('drillExecutions', val)}
                                          isDeletable={(val) => customPresets.drillExecutions.includes(val)}
                                        />
                                      </div>
                                      <textarea 
                                        value={translateContent(currentDrill.execution)} 
                                        onChange={e => setCurrentDrill({ ...currentDrill, execution: e.target.value })} 
                                        onBlur={() => addCustomPreset('drillExecutions', currentDrill.execution, PRESETS.drills.executions)}
                                        className="w-full bg-surface-container border border-black/5 rounded px-3 py-2 text-xs min-h-[60px]" 
                                      />
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                      <div className="flex justify-between items-center">
                                        <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('progression')}</label>
                                        <QuickSelect
                                          label="Presets"
                                          options={getOptions('drillProgressions', PRESETS.drills.progressions)}
                                          onSelect={(val) => setCurrentDrill({ ...currentDrill, progression: val })}
                                          onDelete={(val) => removeCustomPreset('drillProgressions', val)}
                                          isDeletable={(val) => customPresets.drillProgressions.includes(val)}
                                        />
                                      </div>
                                      <textarea 
                                        value={translateContent(currentDrill.progression)} 
                                        onChange={e => setCurrentDrill({ ...currentDrill, progression: e.target.value })} 
                                        onBlur={() => addCustomPreset('drillProgressions', currentDrill.progression, PRESETS.drills.progressions)}
                                        className="w-full bg-surface-container border border-black/5 rounded px-3 py-2 text-xs min-h-[60px]" 
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <div className="flex justify-between items-center">
                                        <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('successCriteria')}</label>
                                        <QuickSelect
                                          label="Presets"
                                          options={getOptions('drillSuccessCriteria', PRESETS.drills.successCriteria)}
                                          onSelect={(val) => setCurrentDrill({ ...currentDrill, successCriteria: val })}
                                          onDelete={(val) => removeCustomPreset('drillSuccessCriteria', val)}
                                          isDeletable={(val) => customPresets.drillSuccessCriteria.includes(val)}
                                        />
                                      </div>
                                      <textarea 
                                        value={translateContent(currentDrill.successCriteria)} 
                                        onChange={e => setCurrentDrill({ ...currentDrill, successCriteria: e.target.value })} 
                                        onBlur={() => addCustomPreset('drillSuccessCriteria', currentDrill.successCriteria, PRESETS.drills.successCriteria)}
                                        className="w-full bg-surface-container border border-black/5 rounded px-3 py-2 text-xs min-h-[60px]" 
                                      />
                                    </div>
                                  </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t border-black/5">
                                  <button type="button" onClick={handleCancelDrill} className="px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-black/5 rounded transition-all">{t('discard')}</button>
                                  <button type="button" onClick={handleAddDrill} className="bg-primary text-on-primary px-6 py-2 rounded text-xs font-bold uppercase tracking-widest hover:bg-primary-dim transition-all active:scale-95 shadow-lg shadow-primary/20">{editingDrillId ? t('saveChanges') : t('addExerciseToSession')}</button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex gap-4">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDrillContext('main');
                                    setIsAddingDrill(true);
                                    setCurrentDrill({ ...emptyDrill });
                                  }}
                                  className="flex-1 py-4 border-2 border-dashed border-black/10 rounded-lg text-on-surface-variant hover:border-primary hover:text-primary transition-all flex flex-col items-center justify-center gap-2"
                                >
                                  <Plus className="w-6 h-6" />
                                  <span className="text-[10px] font-bold uppercase tracking-widest">{t('createNewExercise')}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDrillContext('main');
                                    setIsSelectingFromLibrary(true)
                                  }}
                                  className="flex-1 py-4 border-2 border-dashed border-black/10 rounded-lg text-on-surface-variant hover:border-secondary hover:text-secondary transition-all flex flex-col items-center justify-center gap-2"
                                >
                                  <Library className="w-6 h-6" />
                                  <span className="text-[10px] font-bold uppercase tracking-widest">{t('addFromLibrary')}</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </Section>

                        {/* 5. Integrated with Team */}
                        <Section title={t('sectionIntegrated')} icon={Trophy}>
                          <div className="space-y-4">
                            {newSession.integratedWithTeam?.map((integrated) => (
                              <div key={integrated.id} className="bg-surface-container-highest p-4 rounded-lg border border-black/5 relative group">
                                <button
                                  type="button"
                                  onClick={() => setNewSession(prev => ({ ...prev, integratedWithTeam: prev.integratedWithTeam?.filter(i => i.id !== integrated.id) }))}
                                  className="absolute -top-2 -right-2 bg-error text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                  <div className="space-y-1">
                                    <div className="flex justify-between items-center">
                                      <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('format')}</label>
                                      <QuickSelect
                                        label="Presets"
                                        options={getOptions('integratedFormats', PRESETS.integrated.formats)}
                                        onSelect={(val) => setNewSession(prev => ({ ...prev, integratedWithTeam: prev.integratedWithTeam?.map(i => i.id === integrated.id ? { ...i, format: val } : i) }))}
                                        onDelete={(val) => removeCustomPreset('integratedFormats', val)}
                                        isDeletable={(val) => customPresets.integratedFormats.includes(val)}
                                      />
                                    </div>
                                    <input type="text" value={translateContent(integrated.format)} onChange={e => setNewSession(prev => ({ ...prev, integratedWithTeam: prev.integratedWithTeam?.map(i => i.id === integrated.id ? { ...i, format: e.target.value } : i) }))} className="w-full bg-surface border border-black/10 rounded px-3 py-2 text-xs" />
                                  </div>
                                  <div className="space-y-1">
                                    <div className="flex justify-between items-center">
                                      <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('number')}</label>
                                      <QuickSelect
                                        label="Presets"
                                        options={getOptions('integratedNumbers', PRESETS.integrated.numbers)}
                                        onSelect={(val) => setNewSession(prev => ({ ...prev, integratedWithTeam: prev.integratedWithTeam?.map(i => i.id === integrated.id ? { ...i, number: val } : i) }))}
                                        onDelete={(val) => removeCustomPreset('integratedNumbers', val)}
                                        isDeletable={(val) => customPresets.integratedNumbers.includes(val)}
                                      />
                                    </div>
                                    <input type="text" value={translateContent(integrated.number)} onChange={e => setNewSession(prev => ({ ...prev, integratedWithTeam: prev.integratedWithTeam?.map(i => i.id === integrated.id ? { ...i, number: e.target.value } : i) }))} className="w-full bg-surface border border-black/10 rounded px-3 py-2 text-xs" />
                                  </div>
                                  <div className="space-y-1">
                                    <div className="flex justify-between items-center">
                                      <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('space')}</label>
                                      <QuickSelect
                                        label="Presets"
                                        options={getOptions('integratedSpaces', PRESETS.integrated.spaces)}
                                        onSelect={(val) => setNewSession(prev => ({ ...prev, integratedWithTeam: prev.integratedWithTeam?.map(i => i.id === integrated.id ? { ...i, space: val } : i) }))}
                                        onDelete={(val) => removeCustomPreset('integratedSpaces', val)}
                                        isDeletable={(val) => customPresets.integratedSpaces.includes(val)}
                                      />
                                    </div>
                                    <input type="text" value={translateContent(integrated.space)} onChange={e => setNewSession(prev => ({ ...prev, integratedWithTeam: prev.integratedWithTeam?.map(i => i.id === integrated.id ? { ...i, space: e.target.value } : i) }))} className="w-full bg-surface border border-black/10 rounded px-3 py-2 text-xs" placeholder={t('spacePlaceholder' as any)} />
                                  </div>
                                  <div className="space-y-1">
                                    <div className="flex justify-between items-center">
                                      <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('time')}</label>
                                      <QuickSelect
                                        label="Presets"
                                        options={getOptions('integratedTimes', PRESETS.integrated.times)}
                                        onSelect={(val) => setNewSession(prev => ({ ...prev, integratedWithTeam: prev.integratedWithTeam?.map(i => i.id === integrated.id ? { ...i, time: val } : i) }))}
                                        onDelete={(val) => removeCustomPreset('integratedTimes', val)}
                                        isDeletable={(val) => customPresets.integratedTimes.includes(val)}
                                      />
                                    </div>
                                    <input type="text" value={translateContent(integrated.time)} onChange={e => setNewSession(prev => ({ ...prev, integratedWithTeam: prev.integratedWithTeam?.map(i => i.id === integrated.id ? { ...i, time: e.target.value } : i) }))} className="w-full bg-surface border border-black/10 rounded px-3 py-2 text-xs" placeholder={t('durationPlaceholder' as any)} />
                                  </div>
                                </div>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => setNewSession(prev => ({ ...prev, integratedWithTeam: [...(prev.integratedWithTeam || []), { id: crypto.randomUUID(), format: '', number: '', space: '', time: '' }] }))}
                              className="w-full py-2 border border-dashed border-black/20 rounded-lg text-on-surface-variant hover:text-primary hover:border-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2 text-xs font-bold"
                            >
                              <Plus className="w-4 h-4" /> {t('addIntegratedExercise')}
                            </button>
                          </div>
                        </Section>

                        {/* 6. Cool Down */}
                        <Section title={t('sectionCoolDown')} icon={Wind}>
                          <div className="space-y-1">
                            <div className="flex justify-between items-center">
                              <label className="text-[9px] text-on-surface-variant uppercase font-label">Exercises</label>
                              <QuickSelect
                                label="Presets"
                                options={getOptions('coolDowns', PRESETS.coolDowns)}
                                onSelect={(val) => setNewSession({ ...newSession, coolDown: val })}
                                onDelete={(val) => removeCustomPreset('coolDowns', val)}
                                isDeletable={(val) => customPresets.coolDowns.includes(val)}
                              />
                            </div>
                            <textarea value={translateContent(newSession.coolDown as string)} onChange={e => setNewSession({ ...newSession, coolDown: e.target.value })} className="w-full bg-surface-container-highest border border-black/10 rounded px-3 py-2 text-xs min-h-[60px]" />
                          </div>
                        </Section>

                        {/* 7. Observations */}
                        <Section title={t('coachObservations')} icon={Edit3}>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1">
                              <div className="flex justify-between items-center">
                                <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('positivePoints')}</label>
                                <QuickSelect
                                  label="Presets"
                                  options={getOptions('obsPositives', PRESETS.observations.positives)}
                                  onSelect={(val) => setNewSession({ ...newSession, observations: { ...newSession.observations, positives: val } })}
                                  onDelete={(val) => removeCustomPreset('obsPositives', val)}
                                  isDeletable={(val) => customPresets.obsPositives.includes(val)}
                                />
                              </div>
                              <textarea value={translateContent(newSession.observations.positives as string)} onChange={e => setNewSession({ ...newSession, observations: { ...newSession.observations, positives: e.target.value } })} className="w-full bg-surface-container-highest border border-black/10 rounded px-3 py-2 text-xs min-h-[80px]" />
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between items-center">
                                <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('necessaryAdjustments')}</label>
                                <QuickSelect
                                  label="Presets"
                                  options={getOptions('obsAdjustments', PRESETS.observations.adjustments)}
                                  onSelect={(val) => setNewSession({ ...newSession, observations: { ...newSession.observations, adjustments: val } })}
                                  onDelete={(val) => removeCustomPreset('obsAdjustments', val)}
                                  isDeletable={(val) => customPresets.obsAdjustments.includes(val)}
                                />
                              </div>
                              <textarea value={translateContent(newSession.observations.adjustments as string)} onChange={e => setNewSession({ ...newSession, observations: { ...newSession.observations, adjustments: e.target.value } })} className="w-full bg-surface-container-highest border border-black/10 rounded px-3 py-2 text-xs min-h-[80px]" />
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between items-center">
                                <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('individualEvaluation')}</label>
                                <QuickSelect
                                  label="Presets"
                                  options={getOptions('obsEvaluations', PRESETS.observations.evaluations)}
                                  onSelect={(val) => setNewSession({ ...newSession, observations: { ...newSession.observations, individualEval: val } })}
                                  onDelete={(val) => removeCustomPreset('obsEvaluations', val)}
                                  isDeletable={(val) => customPresets.obsEvaluations.includes(val)}
                                />
                              </div>
                              <textarea value={translateContent(newSession.observations.individualEval as string)} onChange={e => setNewSession({ ...newSession, observations: { ...newSession.observations, individualEval: e.target.value } })} className="w-full bg-surface-container-highest border border-black/10 rounded px-3 py-2 text-xs min-h-[80px]" />
                            </div>
                          </div>
                        </Section>

                      </form>
                    </div>

                    <div className="bg-surface-container-highest p-6 border-t border-black/10 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setIsAddingSession(false)}
                        className="px-6 py-2 rounded-md font-label text-xs font-bold text-on-surface-variant hover:text-on-surface transition-all"
                      >
                        {t('discard')}
                      </button>
                      <button
                        form="sessionForm"
                        type="submit"
                        className="bg-primary hover:bg-primary-dim text-on-primary px-8 py-2 rounded-md font-label text-xs font-bold transition-all shadow-lg shadow-primary/20"
                      >
                        {t('saveTrainingSheet')}
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sessions.map(session => (
                      <div key={session.id} id={`session-card-${session.id}`} onClick={() => setViewingSession(session)} className="bg-surface-container-low rounded-xl overflow-hidden border border-black/5 hover:border-black/10 transition-all group cursor-pointer flex flex-col">
                        <div className="h-48 relative overflow-hidden shrink-0">
                          <img
                            src={session.imageUrl || "https://images.unsplash.com/photo-1526232761682-d26e03ac148e?q=80&w=800&auto=format&fit=crop"}
                            alt={session.titles?.map(t_ => t(t_ as any)).join(' & ')}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low to-transparent" />
                          <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleExportSession(session.id);
                              }}
                              className="p-2 bg-white/80 backdrop-blur-md rounded-md text-on-surface hover:bg-primary hover:text-on-primary transition-all"
                              title={t('exportPdf')}
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(t('deleteThisSession'))) {
                                  deleteSession(session.id);
                                }
                              }}
                              className="p-2 bg-white/80 backdrop-blur-md rounded-md text-on-surface hover:bg-error hover:text-on-primary transition-all"
                              title="Delete Session"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="absolute bottom-4 left-4 right-4">
                            {session.isLive && <span className="bg-primary/90 text-on-primary text-[10px] px-2 py-1 font-bold rounded mb-2 inline-block">{t('live')}</span>}
                            <h4 className="text-xl font-black font-headline truncate">{session.titles?.map(t_ => t(t_ as any)).join(' & ')}</h4>
                            <div className="flex items-center gap-3 mt-1">
                              <p className="text-[10px] text-on-surface-variant flex items-center"><Calendar className="w-3 h-3 mr-1" /> {session.date}</p>
                              <p className="text-[10px] text-on-surface-variant flex items-center"><Clock className="w-3 h-3 mr-1" /> {session.duration}</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-6 flex flex-col flex-1">
                          <div className="mb-4">
                            <p className="text-[10px] text-on-surface-variant font-label uppercase mb-2">{t('category')}: {t(session.category as any)}</p>
                            <p className="text-[10px] text-primary font-bold uppercase mb-1">{t('objective')}</p>
                            <p className="text-xs text-on-surface line-clamp-2">{session.generalObjectives?.map(o => t(o as any)).join(', ')}</p>
                          </div>
                          <div className="pt-4 border-t border-black/5 flex justify-between items-center mt-auto">
                            <div className="flex items-center gap-4">
                              <div className="flex -space-x-2">
                                {session.attending?.map((a, i) => (
                                  <div key={i} className="w-8 h-8 rounded-full border-2 border-surface-container bg-surface-variant flex items-center justify-center text-[10px] font-bold">
                                    {a}
                                  </div>
                                ))}
                              </div>
                              {session.exercises && session.exercises.length > 0 && (
                                <div className="flex items-center text-[10px] text-primary font-bold bg-primary/10 px-2 py-1 rounded">
                                  <Target className="w-3 h-3 mr-1" /> {session.exercises.length} {t('exercises')}
                                </div>
                              )}
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); setViewingSession(session); }} className="text-primary text-xs font-label hover:underline flex items-center">
                              {t('viewSheet')} <ChevronRight className="w-3 h-3 ml-1" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {sessions.length === 0 && (
                      <div className="col-span-full flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-black/10 rounded-xl">
                        <DumbbellIcon className="w-12 h-12 text-on-surface-variant mb-4" />
                        <h3 className="text-xl font-bold text-on-surface mb-2">{t('noTrainingSessions')}</h3>
                        <p className="text-on-surface-variant max-w-md mb-6">{t('noTrainingSessionsDescription')}</p>
                        <button
                          onClick={() => setIsAddingSession(true)}
                          className="bg-primary hover:bg-primary-dim text-on-primary px-6 py-3 rounded-md font-label text-sm font-bold transition-all"
                        >
                          {t('createFirstSession')}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* ===== EXERCISES TAB ===== */}
            {activeTab === 'Exercises' && (
              <motion.div
                key="exercises"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-black font-headline tracking-tight text-on-surface">{t('exerciseLibrary')}</h2>
                  <button
                    onClick={() => setIsAddingExerciseToLibrary(true)}
                    className="bg-primary hover:bg-primary-dim text-on-primary px-4 py-2 rounded-md font-label text-xs font-bold transition-all active:scale-95 flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {t('createExercise')}
                  </button>
                </div>

                {isAddingExerciseToLibrary ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-surface-container p-0 rounded-xl border border-black/10 w-full max-w-[98vw] mx-auto overflow-hidden flex flex-col max-h-[85vh]"
                  >
                    <div className="bg-surface-container-highest p-6 border-b border-black/10 flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-on-surface flex items-center gap-2">
                          <Target className="w-5 h-5 text-primary" />
                          {t('exercisePlannerEditor')}
                        </h3>
                        <p className="text-[10px] text-on-surface-variant uppercase font-label tracking-widest mt-1">{t('designUEFAStandardDrills')}</p>
                      </div>
                      <button
                        onClick={() => setIsAddingExerciseToLibrary(false)}
                        className="text-on-surface-variant hover:text-on-surface transition-colors"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-thin scrollbar-thumb-white/10">
                      {validationErrors.length > 0 && (
                        <div className="bg-error/10 border border-error/30 rounded-lg p-4">
                          <div className="flex items-start gap-2">
                            <X className="w-4 h-4 text-error mt-0.5" />
                            <div>
                              <p className="text-sm font-bold text-error mb-1">{t('pleaseCompleteAllRequiredFields')}</p>
                              <ul className="text-xs text-error space-y-1">
                                {validationErrors.map((error, index) => (
                                  <li key={index}>&bull; {error}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="bg-surface-container-highest p-6 rounded-xl border border-primary/30 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1 md:col-span-2">
                            <div className="flex justify-between items-center">
                              <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('drillTitle')}</label>
                              <QuickSelect
                                label={t('presets')}
                                options={getOptions('drillTitles', PRESETS.drills.titles)}
                                onSelect={applyDrillTemplate}
                                onDelete={(val) => removeCustomPreset('drillTitles', val)}
                                isDeletable={(val) => customPresets.drillTitles.includes(val)}
                              />
                            </div>
                            <input
                              type="text"
                              value={currentDrill.title}
                              onChange={e => {
                                applyDrillTemplate(e.target.value);
                                setValidationErrors([]);
                              }}
                              className={cn(
                                "w-full bg-surface-container border rounded px-3 py-2 text-xs transition-colors",
                                validationErrors.some(e => e.includes('title')) ? "border-error/50 bg-error/5" : "border-black/5"
                              )}
                              placeholder={t('drillTitlePlaceholder')}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('type')}</label>
                            <div className="flex gap-1">
                              {PRESETS.drillTypes.map(dtype => (
                                <button
                                  key={dtype}
                                  type="button"
                                  onClick={() => setCurrentDrill({ ...currentDrill, type: dtype as Exercise['type'] })}
                                  className={cn(
                                    "flex-1 py-1.5 rounded text-[8px] font-bold border transition-all",
                                    currentDrill.type === dtype ? "bg-primary/20 border-primary text-primary" : "bg-surface-container border-black/5 text-on-surface-variant"
                                  )}
                                >
                                  {t(dtype as any)}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <div className="flex justify-between items-center">
                              <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('objective')}</label>
                              <QuickSelect
                                label={t('presets')}
                                options={getOptions('drillObjectives', PRESETS.drills.objectives)}
                                onSelect={(val) => setCurrentDrill({ ...currentDrill, objective: val })}
                                onDelete={(val) => removeCustomPreset('drillObjectives', val)}
                                isDeletable={(val) => customPresets.drillObjectives.includes(val)}
                              />
                            </div>
                            <textarea value={currentDrill.objective} onChange={e => setCurrentDrill({ ...currentDrill, objective: e.target.value })} className="w-full bg-surface-container border border-black/5 rounded px-3 py-2 text-xs min-h-[60px]" placeholder={t('objectivePlaceholder')} />
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between items-center">
                              <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('organization')}</label>
                              <QuickSelect
                                label={t('presets')}
                                options={getOptions('drillOrganizations', PRESETS.drills.organizations)}
                                onSelect={(val) => setCurrentDrill({ ...currentDrill, organization: val })}
                                onDelete={(val) => removeCustomPreset('drillOrganizations', val)}
                                isDeletable={(val) => customPresets.drillOrganizations.includes(val)}
                              />
                            </div>
                            <textarea value={currentDrill.organization} onChange={e => setCurrentDrill({ ...currentDrill, organization: e.target.value })} className="w-full bg-surface-container border border-black/5 rounded px-3 py-2 text-xs min-h-[60px]" placeholder={t('organizationPlaceholder')} />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('execution')}</label>
                            <QuickSelect
                              label={t('presets')}
                              options={getOptions('drillExecutions', PRESETS.drills.executions)}
                              onSelect={(val) => setCurrentDrill({ ...currentDrill, execution: val })}
                              onDelete={(val) => removeCustomPreset('drillExecutions', val)}
                              isDeletable={(val) => customPresets.drillExecutions.includes(val)}
                            />
                          </div>
                          <textarea value={currentDrill.execution} onChange={e => setCurrentDrill({ ...currentDrill, execution: e.target.value })} className="w-full bg-surface-container border border-black/5 rounded px-3 py-2 text-xs min-h-[60px]" placeholder={t('executionPlaceholder')} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <div className="flex justify-between items-center">
                              <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('progressionVariables')}</label>
                              <QuickSelect
                                label={t('presets')}
                                options={getOptions('drillProgressions', PRESETS.drills.progressions)}
                                onSelect={(val) => setCurrentDrill({ ...currentDrill, progression: val })}
                                onDelete={(val) => removeCustomPreset('drillProgressions', val)}
                                isDeletable={(val) => customPresets.drillProgressions.includes(val)}
                              />
                            </div>
                            <input type="text" value={currentDrill.progression} onChange={e => setCurrentDrill({ ...currentDrill, progression: e.target.value })} className="w-full bg-surface-container border border-black/5 rounded px-3 py-2 text-xs" placeholder={t('progressionPlaceholder')} />
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between items-center">
                              <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('successCriteria')}</label>
                              <QuickSelect
                                label={t('presets')}
                                options={getOptions('drillSuccessCriteria', PRESETS.drills.successCriteria)}
                                onSelect={(val) => setCurrentDrill({ ...currentDrill, successCriteria: val })}
                                onDelete={(val) => removeCustomPreset('drillSuccessCriteria', val)}
                                isDeletable={(val) => customPresets.drillSuccessCriteria.includes(val)}
                              />
                            </div>
                            <input type="text" value={currentDrill.successCriteria} onChange={e => setCurrentDrill({ ...currentDrill, successCriteria: e.target.value })} className="w-full bg-surface-container border border-black/5 rounded px-3 py-2 text-xs" placeholder={t('successCriteriaPlaceholder')} />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('duration')}</label>
                            <div className="flex gap-2">
                              <input type="text" value={currentDrill.duration} onChange={e => setCurrentDrill({ ...currentDrill, duration: e.target.value })} className="flex-1 bg-surface-container border border-black/5 rounded px-3 py-2 text-xs" />
                              <QuickSelect
                                label={t('presets')}
                                options={getOptions('durations', PRESETS.durations)}
                                onSelect={(val) => setCurrentDrill({ ...currentDrill, duration: val })}
                                onDelete={(val) => removeCustomPreset('durations', val)}
                                isDeletable={(val) => customPresets.durations.includes(val)}
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('intensity')}</label>
                            <div className="flex gap-2">
                              {PRESETS.intensities.map(intens => (
                                <button
                                  key={intens}
                                  type="button"
                                  onClick={() => setCurrentDrill({ ...currentDrill, intensity: intens as Exercise['intensity'] })}
                                  className={cn(
                                    "flex-1 py-2 rounded text-[8px] font-bold border transition-all",
                                    currentDrill.intensity === intens ? "bg-secondary/20 border-secondary text-secondary" : "bg-surface-container border-black/5 text-on-surface-variant"
                                  )}
                                >
                                  {t(intens as any)}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="px-8 pb-4">
                      <div className="flex items-center justify-between mb-4">
                        <button
                          type="button"
                          onClick={() => setShowPreview(!showPreview)}
                          className="flex items-center gap-2 text-[9px] text-primary hover:text-primary-dim font-bold uppercase tracking-widest transition-colors"
                        >
                          <Target className="w-3 h-3" />
                          {showPreview ? t('hidePreview') : t('showPreview')}
                        </button>
                      </div>

                      <AnimatePresence>
                        {showPreview && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <ExercisePreview drill={currentDrill} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="bg-surface-container-highest p-6 border-t border-black/10 flex justify-between items-center">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setShowPreview(!showPreview)}
                          className="px-4 py-2 rounded-md font-label text-xs font-bold text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all"
                        >
                          {showPreview ? t('hidePreview') : t('preview')}
                        </button>
                      </div>

                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingExerciseToLibrary(false);
                            setValidationErrors([]);
                            setShowPreview(false);
                          }}
                          className="px-6 py-2 rounded-md font-label text-xs font-bold text-on-surface-variant hover:text-on-surface transition-all"
                        >
                          {t('discard')}
                        </button>
                        <button
                          onClick={() => {
                            handleAddExerciseToLibrary(currentDrill);
                            setIsAddingExerciseToLibrary(false);
                            setValidationErrors([]);
                            setShowPreview(false);
                            setCurrentDrill({ ...emptyDrill });
                          }}
                          className="bg-primary hover:bg-primary-dim text-on-primary px-8 py-2 rounded-md font-label text-xs font-bold transition-all shadow-lg shadow-primary/20"
                        >
                          {t('saveToLibrary')}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="space-y-6">
                    <div className="relative max-w-md">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                      <input
                        type="text"
                        value={exerciseSearchTerm}
                        onChange={(e) => setExerciseSearchTerm(e.target.value)}
                        placeholder={t('searchExercisesPlaceholder')}
                        className="w-full bg-surface-container border border-black/10 rounded-full pl-10 pr-4 py-2 text-sm focus:border-primary transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {exercisesLibrary
                        .filter(ex =>
                          ex.title.toLowerCase().includes(exerciseSearchTerm.toLowerCase()) ||
                          ex.objective.toLowerCase().includes(exerciseSearchTerm.toLowerCase())
                        )
                        .map(ex => (
                          <motion.div
                            key={ex.id}
                            whileHover={{ y: -4 }}
                            onClick={() => setViewingExercise(ex)}
                            className="bg-surface-container rounded-xl border border-black/10 overflow-hidden group cursor-pointer"
                          >
                            {ex.diagram && (
                              <div className="h-40 bg-black/5 relative overflow-hidden border-b border-black/5">
                                <img src={ex.diagram} alt={ex.title} className="w-full h-full object-contain p-4" referrerPolicy="no-referrer" />
                                <div className="absolute inset-0 bg-gradient-to-t from-surface-container to-transparent opacity-60" />
                              </div>
                            )}
                            <div className="p-5 space-y-4">
                              <div className="flex items-center justify-between">
                                <span className="bg-primary/20 text-primary text-[8px] font-bold px-2 py-0.5 rounded uppercase tracking-widest">{t(ex.type as any)}</span>
                                <div className="flex items-center text-[10px] text-on-surface-variant">
                                  <Clock className="w-3 h-3 mr-1" /> {t(ex.duration as any)}
                                </div>
                              </div>
                              <div>
                                <h3 className="text-lg font-bold text-on-surface group-hover:text-primary transition-colors">{t(ex.title as any)}</h3>
                                <p className="text-xs text-on-surface-variant line-clamp-2 mt-1">{t(ex.objective as any)}</p>
                              </div>
                              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-black/5">
                                <div className="space-y-1">
                                  <span className="text-[8px] text-on-surface-variant uppercase font-bold">{t('intensity')}</span>
                                  <div className="text-[10px] text-on-surface font-medium">{t(ex.intensity as any)}</div>
                                </div>
                                <div className="space-y-1">
                                  <span className="text-[8px] text-on-surface-variant uppercase font-bold">{t('organization')}</span>
                                  <div className="text-[10px] text-on-surface font-medium line-clamp-1">{t(ex.organization as any)}</div>
                                </div>
                              </div>
                              <button onClick={(e) => { e.stopPropagation(); setViewingExercise(ex); }} className="w-full py-2 bg-black/5 hover:bg-black/10 rounded text-[10px] font-bold uppercase tracking-widest transition-all">
                                {t('viewDetails')}
                              </button>
                            </div>
                          </motion.div>
                        ))}

                      {exercisesLibrary.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-black/10 rounded-xl">
                          <Target className="w-12 h-12 text-on-surface-variant mb-4" />
                          <h3 className="text-xl font-bold text-on-surface mb-2">{t('libraryIsEmpty')}</h3>
                          <p className="text-on-surface-variant max-w-md mb-6">{t('libraryIsEmptyDescription')}</p>
                          <button
                            onClick={() => setIsAddingExerciseToLibrary(true)}
                            className="bg-primary hover:bg-primary-dim text-on-primary px-6 py-3 rounded-md font-label text-sm font-bold transition-all"
                          >
                            {t('createFirstExercise')}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ===== PLANNING TAB ===== */}
            {activeTab === 'Planning' && (
              <motion.div
                key="planning"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-black font-headline tracking-tight text-on-surface">{t('microcyclePlanner')}</h2>
                    <p className="text-on-surface-variant text-sm mt-1">{t('uefaWeeklyPeriodization')}</p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => { setActiveTab('Training'); setIsAddingSession(true); }} className="bg-primary hover:bg-primary-dim text-on-primary px-4 py-2 rounded-md font-label text-xs font-bold transition-all active:scale-95 flex items-center">
                      <Plus className="w-4 h-4 mr-2" />
                      {t('newSession')}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
                  {(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const).map((dayKey, idx) => (
                    <div key={dayKey} className="space-y-4">
                      <div className="bg-surface-container-highest p-3 rounded-t-xl border-b-2 border-primary text-center">
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">{t(dayKey)}</span>
                        <div className="text-xl font-bold text-on-surface mt-1">{idx + 6} APR</div>
                      </div>
                      <div className="bg-surface-container rounded-b-xl border border-black/5 min-h-[400px] p-3 space-y-3">
                        {sessions.filter(s => {
                          const sessionDate = new Date(s.date);
                          return sessionDate.getDay() === (idx + 1) % 7;
                        }).map(session => (
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
                        <button onClick={() => { setActiveTab('Training'); setIsAddingSession(true); }} className="w-full py-3 border border-dashed border-black/10 rounded-lg text-on-surface-variant hover:border-primary hover:text-primary transition-all flex items-center justify-center">
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'Goalkeepers' && (
              <motion.div key="goalkeepers" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <GoalkeepersTab goalkeepers={goalkeepers} addGoalkeeper={addGoalkeeper} updateGoalkeeper={updateGoalkeeper} deleteGoalkeeper={deleteGoalkeeper} />
              </motion.div>
            )}

            {activeTab === 'Videos' && (
              <motion.div key="videos" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <VideosTab videos={videos} addVideo={addVideo} deleteVideo={deleteVideo} />
              </motion.div>
            )}

            {activeTab === 'Support' && (
              <motion.div key="support" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <SupportTab />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Detail Modals */}
      {viewingSession && (
        <SessionDetailModal session={viewingSession} onClose={() => setViewingSession(null)} onExport={(id) => { handleExportSession(id); setViewingSession(null); }} />
      )}
      {viewingExercise && (
        <ExerciseDetailModal exercise={viewingExercise} onClose={() => setViewingExercise(null)} onDelete={(id) => { deleteExercise(id); setViewingExercise(null); }} />
      )}

      {/* Mobile Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-surface/95 backdrop-blur-lg border-t border-black/5 flex items-center justify-around h-16 z-50 px-2">
        {[
          { id: 'Dashboard', icon: LayoutDashboard, labelKey: 'dashboard' as const },
          { id: 'Training', icon: DumbbellIcon, labelKey: 'sessions' as const },
          { id: 'Goalkeepers', icon: Users, labelKey: 'athletes' as const },
          { id: 'Planning', icon: Calendar, labelKey: 'planning' as const },
          { id: 'Videos', icon: Video, labelKey: 'videos' as const }
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "flex flex-col items-center gap-1 transition-colors",
              activeTab === item.id ? "text-primary" : "text-on-surface-variant"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-label">{t(item.labelKey)}</span>
          </button>
        ))}
      </nav>

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </div>
  );
}
