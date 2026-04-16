import React, { useState } from 'react';
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
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTranslation } from '../../hooks/useTranslation';
import { useMethodology } from '../../hooks/useMethodology';
import { PeriodizationPhase } from '../../types';

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-headline font-black text-on-surface tracking-tight">{t('methodologyTitle' as any)}</h1>
        <p className="text-sm text-on-surface-variant font-label mt-1">{t('methodologySubtitle' as any)}</p>
      </div>

      {/* ===== 1. GAME MODEL ===== */}
      <div className="bg-surface rounded-2xl border border-black/5 overflow-hidden">
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
                  const Icon = MOMENT_ICONS[moment.moment];
                  return (
                    <div key={moment.id} className="bg-surface-container rounded-xl p-4 border border-black/5">
                      <div className="flex items-center gap-2 mb-3">
                        <Icon className={cn("w-4 h-4", moment.moment === 'defending' ? 'text-blue-500' : moment.moment === 'attacking' ? 'text-red-500' : 'text-amber-500')} />
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
      <div className="bg-surface rounded-2xl border border-black/5 overflow-hidden">
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
                  const Icon = COMPETENCY_ICONS[profile.category];
                  return (
                    <div key={profile.id} className="bg-surface-container rounded-xl p-4 border border-black/5">
                      <div className="flex items-center gap-2 mb-3">
                        <Icon className="w-4 h-4 text-primary" />
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
      <div className="bg-surface rounded-2xl border border-black/5 overflow-hidden">
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
                {/* Info box */}
                <div className="flex items-start gap-3 bg-primary/5 rounded-xl p-4 border border-primary/10">
                  <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs text-on-surface-variant">{t('methPeriodizationInfo' as any)}</p>
                </div>

                {/* Phases */}
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

                {/* Add phase form */}
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
      <div className="bg-surface rounded-2xl border border-black/5 overflow-hidden">
        <SectionHeader
          sectionKey="taxonomy"
          icon={BookOpen}
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
                  {/* Analytical */}
                  <div className="bg-surface-container rounded-xl p-4 border border-black/5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <h4 className="font-headline font-bold text-sm text-on-surface">{t('analytical')}</h4>
                    </div>
                    <p className="text-xs text-on-surface-variant leading-relaxed">{t('methTaxAnalytical' as any)}</p>
                  </div>
                  {/* Decision */}
                  <div className="bg-surface-container rounded-xl p-4 border border-black/5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                      <h4 className="font-headline font-bold text-sm text-on-surface">{t('decision')}</h4>
                    </div>
                    <p className="text-xs text-on-surface-variant leading-relaxed">{t('methTaxDecision' as any)}</p>
                  </div>
                  {/* Contextualized */}
                  <div className="bg-surface-container rounded-xl p-4 border border-black/5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <h4 className="font-headline font-bold text-sm text-on-surface">{t('contextualized')}</h4>
                    </div>
                    <p className="text-xs text-on-surface-variant leading-relaxed">{t('methTaxContextualized' as any)}</p>
                  </div>
                  {/* Warmup */}
                  <div className="bg-surface-container rounded-xl p-4 border border-black/5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-purple-500" />
                      <h4 className="font-headline font-bold text-sm text-on-surface">{t('warmup')}</h4>
                    </div>
                    <p className="text-xs text-on-surface-variant leading-relaxed">{t('methTaxWarmup' as any)}</p>
                  </div>
                </div>

                {/* Progression pyramid */}
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
      <div className="bg-surface rounded-2xl border border-black/5 overflow-hidden">
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
      <div className="bg-surface rounded-2xl border border-black/5 p-5">
        <h3 className="font-headline font-bold text-on-surface mb-3">{t('methNotes' as any)}</h3>
        <textarea
          value={methodology.notes}
          onChange={e => updateNotes(e.target.value)}
          placeholder={t('methNotesPlaceholder' as any)}
          rows={4}
          className="w-full bg-surface-container border border-black/5 rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
        />
      </div>
    </div>
  );
};
