import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Plus, X, Trash2, Edit3, Activity, Upload, Image as ImageIcon, UserCheck, Heart, Moon, Brain, Frown, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, getTodayDateString } from '../../lib/utils';
import { useTranslation } from '../../hooks/useTranslation';
import { useWellness } from '../../hooks/useWellness';
import { useCustomPresets } from '../../hooks/useCustomPresets';
import { PRESETS } from '../../data/presets';
import { WellnessModal } from '../WellnessModal';
import type { Goalkeeper } from '../../types';
import { useGoalkeeperMetrics } from '../../hooks/useGoalkeeperMetrics';
import { AthleteProfile } from '../athletes/AthleteProfile';
import { SquadSummary } from '../athletes/SquadSummary';

interface GoalkeepersTabProps {
  goalkeepers: Goalkeeper[];
  addGoalkeeper: (gk: Omit<Goalkeeper, 'id'>) => Promise<void>;
  updateGoalkeeper: (gk: Goalkeeper) => Promise<void>;
  deleteGoalkeeper: (id: string) => Promise<void>;
}

type MembershipFilter = 'All' | 'permanent' | 'trial';

const DEFAULT_IMAGE_URL =
  'https://images.unsplash.com/photo-1518331647614-7a1f04cd34cf?q=80&w=256&h=256&auto=format&fit=crop';

const statuses: Goalkeeper['status'][] = ['Ready', 'Minor Strain', 'In Training', 'Injured'];

function getStatusClasses(status: Goalkeeper['status']): string {
  switch (status) {
    case 'Ready':
      return 'bg-tertiary/10 text-tertiary';
    case 'Minor Strain':
      return 'bg-error/10 text-error';
    case 'In Training':
      return 'bg-secondary/10 text-secondary';
    case 'Injured':
      return 'bg-error/10 text-error';
  }
}

interface FormState {
  name: string;
  category: Goalkeeper['category'];
  status: Goalkeeper['status'];
  form: number;
  recovery: number;
  load: number;
  imageUrl: string;
  birthDate: string;
  height: number | '';
  weight: number | '';
  membership: 'permanent' | 'trial';
  trialStartDate: string;
  trialEndDate: string;
  trialNotes: string;
}

const defaultForm: FormState = {
  name: '',
  category: 'firstTeam',
  status: 'Ready',
  form: 50,
  recovery: 50,
  load: 50,
  imageUrl: DEFAULT_IMAGE_URL,
  birthDate: '',
  height: '',
  weight: '',
  membership: 'permanent',
  trialStartDate: '',
  trialEndDate: '',
  trialNotes: '',
};

function getTrialStatus(gk: Goalkeeper): 'active' | 'expiring' | 'expired' | null {
  if ((gk.membership || 'permanent') !== 'trial') return null;
  if (!gk.trialEndDate) return 'active';
  const end = new Date(gk.trialEndDate);
  const now = new Date();
  const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (daysLeft < 0) return 'expired';
  if (daysLeft <= 3) return 'expiring';
  return 'active';
}

function calculateAge(birthDate: string): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export const GoalkeepersTab: React.FC<GoalkeepersTabProps> = React.memo(({
  goalkeepers,
  addGoalkeeper,
  updateGoalkeeper,
  deleteGoalkeeper,
}) => {
  const { t } = useTranslation();
  const { saveWellnessLog, fetchLogs } = useWellness();
  const { recalculateMetrics, recalculateAll } = useGoalkeeperMetrics(updateGoalkeeper);
  const { getOptions, addCustomPreset, removeCustomPreset } = useCustomPresets();

  // Dynamic categories from presets + custom
  const gkCategories = useMemo(() => getOptions('categories', PRESETS.categories), [getOptions]);
  const allFilterCategories = useMemo(() => ['All', ...gkCategories], [gkCategories]);

  // State for adding new category
  const [newCategoryInput, setNewCategoryInput] = useState('');

  const getCategoryLabel = (cat: string): string => {
    const translated = t(cat);
    return translated !== cat ? translated : cat;
  };

  const handleAddCategory = () => {
    const val = newCategoryInput.trim();
    if (!val) return;
    addCustomPreset('categories', val, PRESETS.categories);
    setNewCategoryInput('');
  };

  const handleRemoveCategory = (cat: string) => {
    if (cat === 'firstTeam') return; // Never remove default
    removeCustomPreset('categories', cat);
    // If filtering by this category, reset
    if (activeCategory === cat) setActiveCategory('All');
  };

  // Recalculate metrics when tab opens to pick up any wellness/RPE changes
  const [hasRecalculated, setHasRecalculated] = useState(false);
  useEffect(() => {
    if (goalkeepers.length > 0 && !hasRecalculated) {
      recalculateAll(goalkeepers).then(() => setHasRecalculated(true));
    }
  }, [goalkeepers.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const [selectedAthlete, setSelectedAthlete] = useState<Goalkeeper | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [activeMembership, setActiveMembership] = useState<MembershipFilter>('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGoalkeeper, setEditingGoalkeeper] = useState<Goalkeeper | null>(null);
  const [formState, setFormState] = useState<FormState>(defaultForm);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Wellness
  const [wellnessModalOpen, setWellnessModalOpen] = useState(false);
  const [wellnessGk, setWellnessGk] = useState<Goalkeeper | null>(null);

  const openWellnessModal = (gk: Goalkeeper) => {
    setWellnessGk(gk);
    setWellnessModalOpen(true);
  };

  const closeWellnessModal = () => {
    setWellnessModalOpen(false);
    setWellnessGk(null);
  };

  const statusLabels: Record<Goalkeeper['status'], string> = {
    'Ready': t('ready'),
    'Minor Strain': t('minorStrain'),
    'In Training': t('inTraining'),
    'Injured': t('injured'),
  };

  const membershipLabels: Record<MembershipFilter, string> = {
    'All': t('all'),
    'permanent': t('permanentAthletes'),
    'trial': t('trialAthletes'),
  };

  const filteredGoalkeepers = goalkeepers.filter((gk) => {
    const catMatch = activeCategory === 'All' || gk.category === activeCategory;
    const memMatch = activeMembership === 'All' || (gk.membership || 'permanent') === activeMembership;
    return catMatch && memMatch;
  });

  const openAddModal = () => {
    setEditingGoalkeeper(null);
    setFormState(defaultForm);
    setModalOpen(true);
  };

  const openEditModal = (gk: Goalkeeper) => {
    setEditingGoalkeeper(gk);
    setFormState({
      name: gk.name,
      category: gk.category,
      status: gk.status,
      form: gk.form,
      recovery: gk.recovery,
      load: gk.load,
      imageUrl: gk.imageUrl,
      birthDate: gk.birthDate || '',
      height: gk.height || '',
      weight: gk.weight || '',
      membership: gk.membership || 'permanent',
      trialStartDate: gk.trialStartDate || '',
      trialEndDate: gk.trialEndDate || '',
      trialNotes: gk.trialNotes || '',
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingGoalkeeper(null);
  };

  React.useEffect(() => {
    if (!modalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [modalOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formState,
      height: formState.height === '' ? undefined : Number(formState.height),
      weight: formState.weight === '' ? undefined : Number(formState.weight),
      birthDate: formState.birthDate || undefined,
      membership: formState.membership,
      trialStartDate: formState.membership === 'trial' ? (formState.trialStartDate || undefined) : undefined,
      trialEndDate: formState.membership === 'trial' ? (formState.trialEndDate || undefined) : undefined,
      trialNotes: formState.membership === 'trial' ? (formState.trialNotes || undefined) : undefined,
    };
    if (editingGoalkeeper) {
      await updateGoalkeeper({ id: editingGoalkeeper.id, ...data } as Goalkeeper);
    } else {
      await addGoalkeeper(data as Omit<Goalkeeper, 'id'>);
    }
    closeModal();
  };

  // If an athlete is selected, show their profile
  if (selectedAthlete) {
    return (
      <AthleteProfile
        goalkeeper={selectedAthlete}
        onBack={() => setSelectedAthlete(null)}
        onUpdate={async (gk) => { await updateGoalkeeper(gk); setSelectedAthlete(gk); }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Squad Summary */}
      <SquadSummary goalkeepers={goalkeepers} />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-headline text-2xl font-bold text-on-surface">{t('goalkeepersTitle')}</h1>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 rounded-lg bg-surface p-1 flex-wrap">
            {allFilterCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  'rounded-md px-3 py-1.5 font-label text-sm font-medium transition-colors',
                  activeCategory === cat
                    ? 'bg-primary text-on-primary'
                    : 'text-on-surface-variant hover:bg-surface-elevated'
                )}
              >
                {getCategoryLabel(cat)}
              </button>
            ))}
          </div>
          <div className="flex gap-1 rounded-lg bg-surface p-1">
            {(['All', 'permanent', 'trial'] as MembershipFilter[]).map((mem) => (
              <button
                key={mem}
                onClick={() => setActiveMembership(mem)}
                className={cn(
                  'rounded-md px-3 py-1.5 font-label text-sm font-medium transition-colors',
                  activeMembership === mem
                    ? 'bg-primary text-on-primary'
                    : 'text-on-surface-variant hover:bg-surface-elevated'
                )}
              >
                {membershipLabels[mem]}
              </button>
            ))}
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-label text-sm font-semibold text-on-primary transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            {t('addGoalkeeper')}
          </button>
        </div>
      </div>

      {/* Grid */}
      {filteredGoalkeepers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl bg-surface py-20">
          <Activity className="mb-3 h-10 w-10 text-on-surface-variant/40" />
          <p className="font-label text-on-surface-variant">{t('noGoalkeepersFound')}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredGoalkeepers.map((gk) => (
            <div
              key={gk.id}
              className="group relative rounded-xl border border-black/[0.08] bg-surface p-5 transition-all hover:shadow-md cursor-pointer"
              onClick={() => setSelectedAthlete(gk)}
            >
              {/* Hover actions */}
              <div className="absolute right-3 top-3 flex gap-1 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100" onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => openWellnessModal(gk)}
                  className="flex items-center gap-1.5 rounded-md bg-emerald-500/10 p-1.5 text-emerald-700 transition-colors hover:bg-emerald-500 hover:text-white"
                  title={t('logWellness')}
                >
                  <Heart className="h-4 w-4" />
                  <span className="text-[10px] font-bold uppercase tracking-tight pr-1">{t('wellness')}</span>
                </button>
                {(gk.membership || 'permanent') === 'trial' && (
                  <button
                    onClick={() => {
                      if (confirm(t('confirmConvert'))) {
                        updateGoalkeeper({ ...gk, membership: 'permanent', trialStartDate: undefined, trialEndDate: undefined, trialNotes: undefined });
                      }
                    }}
                    className="rounded-md bg-surface-elevated p-1.5 text-on-surface-variant transition-colors hover:text-tertiary"
                    title={t('convertToPermanent')}
                  >
                    <UserCheck className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => openEditModal(gk)}
                  className="rounded-md bg-surface-elevated p-1.5 text-on-surface-variant transition-colors hover:text-primary"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => { if (window.confirm(t('confirmDeleteGoalkeeper'))) deleteGoalkeeper(gk.id); }}
                  className="rounded-md bg-surface-elevated p-1.5 text-on-surface-variant transition-colors hover:text-error"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Profile */}
              <div className="mb-4 flex items-center gap-4">
                <img
                  src={gk.imageUrl}
                  alt={gk.name}
                  className="h-16 w-16 rounded-full object-cover"
                />
                <div>
                  <h3 className="font-headline text-base font-semibold text-on-surface">
                    {gk.name}
                  </h3>
                  <p className="font-label text-sm text-on-surface-variant">{getCategoryLabel(gk.category)}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <span
                      className={cn(
                        'inline-block rounded-md px-2 py-0.5 font-label text-xs font-medium',
                        getStatusClasses(gk.status)
                      )}
                    >
                      {statusLabels[gk.status]}
                    </span>
                    {(() => {
                      const trialStatus = getTrialStatus(gk);
                      if (!trialStatus) return null;
                      const badgeClasses = {
                        active: 'bg-amber-100 text-amber-700',
                        expiring: 'bg-orange-100 text-orange-700',
                        expired: 'bg-red-100 text-red-700',
                      };
                      const badgeText = {
                        active: t('trial'),
                        expiring: t('trialExpiring'),
                        expired: t('trialExpired'),
                      };
                      return (
                        <span className={cn('inline-block rounded-md px-2 py-0.5 font-label text-xs font-medium', badgeClasses[trialStatus])}>
                          {badgeText[trialStatus]}
                        </span>
                      );
                    })()}

                    {/* Quick Wellness Info */}
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600/60">Wellness:</span>
                      <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">NEW</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="flex flex-wrap gap-3 text-xs">
                {gk.birthDate && (
                  <div className="rounded-md bg-surface-elevated px-2.5 py-1.5">
                    <span className="text-on-surface-variant">{t('age')}: </span>
                    <span className="font-medium text-on-surface">{calculateAge(gk.birthDate)} {t('years')}</span>
                  </div>
                )}
                {gk.height && (
                  <div className="rounded-md bg-surface-elevated px-2.5 py-1.5">
                    <span className="text-on-surface-variant">{t('height')}: </span>
                    <span className="font-medium text-on-surface">{gk.height} cm</span>
                  </div>
                )}
                {gk.weight && (
                  <div className="rounded-md bg-surface-elevated px-2.5 py-1.5">
                    <span className="text-on-surface-variant">{t('weight')}: </span>
                    <span className="font-medium text-on-surface">{gk.weight} kg</span>
                  </div>
                )}
                {(gk.membership || 'permanent') === 'trial' && gk.trialStartDate && (
                  <div className="rounded-md bg-amber-50 px-2.5 py-1.5">
                    <span className="text-amber-600">{t('trialStartDate')}: </span>
                    <span className="font-medium text-amber-800">{new Date(gk.trialStartDate).toLocaleDateString()}</span>
                  </div>
                )}
                {(gk.membership || 'permanent') === 'trial' && gk.trialEndDate && (
                  <div className="rounded-md bg-amber-50 px-2.5 py-1.5">
                    <span className="text-amber-600">{t('trialEndDate')}: </span>
                    <span className="font-medium text-amber-800">{new Date(gk.trialEndDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }}
              role="dialog"
              aria-modal="true"
              aria-label={editingGoalkeeper ? t('editGoalkeeper') : t('addGoalkeeperTitle')}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-surface-container-low p-6 shadow-xl"
            >
              <div className="mb-5 flex items-center justify-between">
                <h2 className="font-headline text-lg font-bold text-on-surface">
                  {editingGoalkeeper ? t('editGoalkeeper') : t('addGoalkeeperTitle')}
                </h2>
                <button
                  aria-label={t('close')}
                  onClick={closeModal}
                  className="rounded-md p-1 text-on-surface-variant transition-colors hover:bg-surface-elevated"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                <div>
                  <label className="mb-1 block font-label text-sm font-medium text-on-surface-variant">
                    {t('name')}
                  </label>
                  <input
                    type="text"
                    required
                    value={formState.name}
                    onChange={(e) => setFormState((s) => ({ ...s, name: e.target.value }))}
                    className="w-full rounded-lg border border-white/[0.06] bg-surface px-3 py-2 font-label text-sm text-on-surface outline-none focus:border-primary"
                    placeholder={t('goalkeeperName')}
                  />
                </div>

                {/* Category, Status & Membership */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="mb-1 block font-label text-sm font-medium text-on-surface-variant">
                      {t('category')}
                    </label>
                    <select
                      value={formState.category}
                      onChange={(e) =>
                        setFormState((s) => ({
                          ...s,
                          category: e.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-white/[0.06] bg-surface px-3 py-2 font-label text-sm text-on-surface outline-none focus:border-primary"
                    >
                      {gkCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {getCategoryLabel(cat)}
                        </option>
                      ))}
                    </select>
                    {/* Add/remove custom categories */}
                    <div className="mt-2 flex items-center gap-1.5">
                      <input
                        type="text"
                        value={newCategoryInput}
                        onChange={(e) => setNewCategoryInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                        placeholder={t('newCategory') || 'Nova categoria...'}
                        className="flex-1 rounded-md border border-white/[0.06] bg-surface px-2 py-1 text-xs text-on-surface outline-none focus:border-primary"
                      />
                      <button
                        type="button"
                        onClick={handleAddCategory}
                        className="rounded-md bg-primary/10 p-1 text-primary hover:bg-primary/20 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {gkCategories.filter(c => c !== 'firstTeam').length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {gkCategories.filter(c => c !== 'firstTeam').map(cat => (
                          <span key={cat} className="inline-flex items-center gap-1 rounded-md bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-on-surface-variant">
                            {getCategoryLabel(cat)}
                            <button
                              type="button"
                              onClick={() => handleRemoveCategory(cat)}
                              className="text-error/60 hover:text-error"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block font-label text-sm font-medium text-on-surface-variant">
                      {t('status')}
                    </label>
                    <select
                      value={formState.status}
                      onChange={(e) =>
                        setFormState((s) => ({
                          ...s,
                          status: e.target.value as Goalkeeper['status'],
                        }))
                      }
                      className="w-full rounded-lg border border-white/[0.06] bg-surface px-3 py-2 font-label text-sm text-on-surface outline-none focus:border-primary"
                    >
                      {statuses.map((st) => (
                        <option key={st} value={st}>
                          {statusLabels[st]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block font-label text-sm font-medium text-on-surface-variant">
                      {t('membership')}
                    </label>
                    <select
                      value={formState.membership}
                      onChange={(e) =>
                        setFormState((s) => ({
                          ...s,
                          membership: e.target.value as 'permanent' | 'trial',
                        }))
                      }
                      className="w-full rounded-lg border border-white/[0.06] bg-surface px-3 py-2 font-label text-sm text-on-surface outline-none focus:border-primary"
                    >
                      <option value="permanent">{t('permanent')}</option>
                      <option value="trial">{t('trial')}</option>
                    </select>
                  </div>
                </div>

                {/* Trial fields (conditional) */}
                {formState.membership === 'trial' && (
                  <div className="space-y-4 rounded-lg border border-amber-200 bg-amber-50/50 p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="mb-1 block font-label text-sm font-medium text-on-surface-variant">
                          {t('trialStartDate')}
                        </label>
                        <input
                          type="date"
                          value={formState.trialStartDate}
                          onChange={(e) => setFormState((s) => ({ ...s, trialStartDate: e.target.value }))}
                          className="w-full rounded-lg border border-white/[0.06] bg-surface px-3 py-2 font-label text-sm text-on-surface outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block font-label text-sm font-medium text-on-surface-variant">
                          {t('trialEndDate')}
                        </label>
                        <input
                          type="date"
                          value={formState.trialEndDate}
                          onChange={(e) => setFormState((s) => ({ ...s, trialEndDate: e.target.value }))}
                          className="w-full rounded-lg border border-white/[0.06] bg-surface px-3 py-2 font-label text-sm text-on-surface outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block font-label text-sm font-medium text-on-surface-variant">
                        {t('trialNotes')}
                      </label>
                      <textarea
                        value={formState.trialNotes}
                        onChange={(e) => setFormState((s) => ({ ...s, trialNotes: e.target.value }))}
                        rows={3}
                        className="w-full rounded-lg border border-white/[0.06] bg-surface px-3 py-2 font-label text-sm text-on-surface outline-none focus:border-primary resize-none"
                        placeholder={t('trialNotesPlaceholder')}
                      />
                    </div>
                  </div>
                )}

                {/* Form, Recovery, Load */}
                <div className="space-y-3 rounded-lg border border-white/[0.04] bg-surface p-4">
                  <p className="font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{t('physicalMetrics')}</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <label className="w-24 font-label text-sm text-on-surface-variant">{t('formLabel')}</label>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={formState.form}
                        onChange={(e) => setFormState((s) => ({ ...s, form: Number(e.target.value) }))}
                        className="flex-1 accent-tertiary"
                      />
                      <span className="w-10 text-right font-label text-sm font-bold text-tertiary">{formState.form}%</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="w-24 font-label text-sm text-on-surface-variant">{t('recovery')}</label>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={formState.recovery}
                        onChange={(e) => setFormState((s) => ({ ...s, recovery: Number(e.target.value) }))}
                        className="flex-1 accent-secondary"
                      />
                      <span className="w-10 text-right font-label text-sm font-bold text-secondary">{formState.recovery}%</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="w-24 font-label text-sm text-on-surface-variant">{t('loadLabel')}</label>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={formState.load}
                        onChange={(e) => setFormState((s) => ({ ...s, load: Number(e.target.value) }))}
                        className="flex-1 accent-primary"
                      />
                      <span className="w-10 text-right font-label text-sm font-bold text-primary">{formState.load}%</span>
                    </div>
                  </div>
                </div>

                {/* Birth Date, Height, Weight */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="mb-1 block font-label text-sm font-medium text-on-surface-variant">
                      {t('birthDate')}
                    </label>
                    <input
                      type="date"
                      max={getTodayDateString()}
                      value={formState.birthDate}
                      onChange={(e) => setFormState((s) => ({ ...s, birthDate: e.target.value }))}
                      className="w-full rounded-lg border border-white/[0.06] bg-surface px-3 py-2 font-label text-sm text-on-surface outline-none focus:border-primary"
                    />
                    {formState.birthDate && (
                      <p className="mt-1 font-label text-xs text-primary font-medium">
                        {calculateAge(formState.birthDate)} {t('years')}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block font-label text-sm font-medium text-on-surface-variant">
                      {t('height')} (cm)
                    </label>
                    <input
                      type="number"
                      min={100}
                      max={220}
                      value={formState.height}
                      onChange={(e) => setFormState((s) => ({ ...s, height: e.target.value === '' ? '' : Number(e.target.value) }))}
                      className="w-full rounded-lg border border-white/[0.06] bg-surface px-3 py-2 font-label text-sm text-on-surface outline-none focus:border-primary"
                      placeholder="185"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block font-label text-sm font-medium text-on-surface-variant">
                      {t('weight')} (kg)
                    </label>
                    <input
                      type="number"
                      min={40}
                      max={150}
                      value={formState.weight}
                      onChange={(e) => setFormState((s) => ({ ...s, weight: e.target.value === '' ? '' : Number(e.target.value) }))}
                      className="w-full rounded-lg border border-white/[0.06] bg-surface px-3 py-2 font-label text-sm text-on-surface outline-none focus:border-primary"
                      placeholder="80"
                    />
                  </div>
                </div>

                {/* Image Upload */}
                <div>
                  <label className="mb-1 block font-label text-sm font-medium text-on-surface-variant">
                    {t('imageUrl')}
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-dashed border-white/[0.06] bg-surface">
                      {formState.imageUrl ? (
                        <img src={formState.imageUrl} alt="Preview" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-on-surface-variant/40" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        aria-label={t('uploadImage')}
                        className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-surface px-3 py-2 font-label text-sm text-on-surface-variant transition-colors hover:border-primary hover:text-primary"
                      >
                        <Upload className="h-4 w-4" />
                        {t('uploadImage')}
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          // Compress image to max 256x256 to avoid bloating storage
                          const img = new window.Image();
                          img.onload = () => {
                            const canvas = document.createElement('canvas');
                            const maxSize = 256;
                            let w = img.width;
                            let h = img.height;
                            if (w > h) { h = Math.round(h * maxSize / w); w = maxSize; }
                            else { w = Math.round(w * maxSize / h); h = maxSize; }
                            canvas.width = w;
                            canvas.height = h;
                            const ctx = canvas.getContext('2d');
                            ctx?.drawImage(img, 0, 0, w, h);
                            const compressed = canvas.toDataURL('image/jpeg', 0.8);
                            setFormState((s) => ({ ...s, imageUrl: compressed }));
                          };
                          img.src = URL.createObjectURL(file);
                          e.target.value = '';
                        }}
                      />
                      <input
                        type="text"
                        value={formState.imageUrl.startsWith('data:') ? '' : formState.imageUrl}
                        onChange={(e) => setFormState((s) => ({ ...s, imageUrl: e.target.value }))}
                        className="w-full rounded-lg border border-white/[0.06] bg-surface px-3 py-1.5 font-label text-xs text-on-surface outline-none focus:border-primary"
                        placeholder={t('orPasteUrl')}
                      />
                    </div>
                  </div>
                </div>

                {/* Submit */}
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-lg border border-white/[0.06] px-4 py-2 font-label text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-elevated"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-primary px-5 py-2 font-label text-sm font-semibold text-on-primary transition-opacity hover:opacity-90"
                  >
                    {editingGoalkeeper ? t('update') : t('add')}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Wellness Modal */}
      <AnimatePresence>
        {wellnessModalOpen && wellnessGk && (
          <WellnessModal 
            goalkeeper={wellnessGk} 
            onClose={closeWellnessModal} 
            onSuccess={() => {
              fetchLogs(wellnessGk.id);
              recalculateMetrics(wellnessGk);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
});
GoalkeepersTab.displayName = 'GoalkeepersTab';
