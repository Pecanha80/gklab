import React, { useState } from 'react';
import { Plus, X, Trash2, Edit3, Search, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { useTranslation } from '../../hooks/useTranslation';
import type { Goalkeeper } from '../../types';

interface GoalkeepersTabProps {
  goalkeepers: Goalkeeper[];
  addGoalkeeper: (gk: Omit<Goalkeeper, 'id'>) => Promise<void>;
  updateGoalkeeper: (gk: Goalkeeper) => Promise<void>;
  deleteGoalkeeper: (id: string) => Promise<void>;
}

type Category = 'All' | 'First Team' | 'U23' | 'U18';

const DEFAULT_IMAGE_URL =
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=256&h=256&auto=format&fit=crop';

const categories: Category[] = ['All', 'First Team', 'U23', 'U18'];
const gkCategories: Goalkeeper['category'][] = ['First Team', 'U23', 'U18'];
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
}

const defaultForm: FormState = {
  name: '',
  category: 'First Team',
  status: 'Ready',
  form: 50,
  recovery: 50,
  load: 50,
  imageUrl: DEFAULT_IMAGE_URL,
};

export const GoalkeepersTab: React.FC<GoalkeepersTabProps> = ({
  goalkeepers,
  addGoalkeeper,
  updateGoalkeeper,
  deleteGoalkeeper,
}) => {
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState<Category>('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGoalkeeper, setEditingGoalkeeper] = useState<Goalkeeper | null>(null);
  const [formState, setFormState] = useState<FormState>(defaultForm);

  const categoryLabels: Record<Category, string> = {
    'All': t('all'),
    'First Team': t('firstTeam'),
    'U23': t('u23'),
    'U18': t('u18'),
  };

  const statusLabels: Record<Goalkeeper['status'], string> = {
    'Ready': t('ready'),
    'Minor Strain': t('minorStrain'),
    'In Training': t('inTraining'),
    'Injured': t('injured'),
  };

  const filteredGoalkeepers =
    activeCategory === 'All'
      ? goalkeepers
      : goalkeepers.filter((gk) => gk.category === activeCategory);

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
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingGoalkeeper(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingGoalkeeper) {
      await updateGoalkeeper({ id: editingGoalkeeper.id, ...formState });
    } else {
      await addGoalkeeper(formState);
    }
    closeModal();
  };

  const clampValue = (val: number) => Math.max(0, Math.min(100, val));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-headline text-2xl font-bold text-on-surface">{t('goalkeepersTitle')}</h1>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 rounded-lg bg-surface-container p-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  'rounded-md px-3 py-1.5 font-label text-sm font-medium transition-colors',
                  activeCategory === cat
                    ? 'bg-primary text-on-primary'
                    : 'text-on-surface-variant hover:bg-surface-container-highest'
                )}
              >
                {categoryLabels[cat]}
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
        <div className="flex flex-col items-center justify-center rounded-xl bg-surface-container py-20">
          <Activity className="mb-3 h-10 w-10 text-on-surface-variant/40" />
          <p className="font-label text-on-surface-variant">{t('noGoalkeepersFound')}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredGoalkeepers.map((gk) => (
            <div
              key={gk.id}
              className="group relative rounded-xl border border-black/5 bg-surface-container p-5 transition-shadow hover:shadow-md"
            >
              {/* Hover actions */}
              <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={() => openEditModal(gk)}
                  className="rounded-md bg-surface-container-highest p-1.5 text-on-surface-variant transition-colors hover:text-primary"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => deleteGoalkeeper(gk.id)}
                  className="rounded-md bg-surface-container-highest p-1.5 text-on-surface-variant transition-colors hover:text-error"
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
                  <p className="font-label text-sm text-on-surface-variant">{categoryLabels[gk.category]}</p>
                  <span
                    className={cn(
                      'mt-1 inline-block rounded-md px-2 py-0.5 font-label text-xs font-medium',
                      getStatusClasses(gk.status)
                    )}
                  >
                    {statusLabels[gk.status]}
                  </span>
                </div>
              </div>

              {/* Progress bars */}
              <div className="space-y-3">
                {([
                  { label: t('formLabel'), value: gk.form },
                  { label: t('recovery'), value: gk.recovery },
                  { label: t('loadLabel'), value: gk.load },
                ] as const).map((item) => (
                  <div key={item.label}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="font-label text-xs text-on-surface-variant">
                        {item.label}
                      </span>
                      <span className="font-label text-xs font-medium text-on-surface">
                        {item.value}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-black/5">
                      <div
                        style={{ width: `${item.value}%` }}
                        className="h-full rounded-full bg-primary"
                      />
                    </div>
                  </div>
                ))}
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
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-xl bg-surface-container-low p-6 shadow-xl"
            >
              <div className="mb-5 flex items-center justify-between">
                <h2 className="font-headline text-lg font-bold text-on-surface">
                  {editingGoalkeeper ? t('editGoalkeeper') : t('addGoalkeeperTitle')}
                </h2>
                <button
                  onClick={closeModal}
                  className="rounded-md p-1 text-on-surface-variant transition-colors hover:bg-surface-container-highest"
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
                    className="w-full rounded-lg border border-black/10 bg-surface-container px-3 py-2 font-label text-sm text-on-surface outline-none focus:border-primary"
                    placeholder={t('goalkeeperName')}
                  />
                </div>

                {/* Category & Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block font-label text-sm font-medium text-on-surface-variant">
                      {t('category')}
                    </label>
                    <select
                      value={formState.category}
                      onChange={(e) =>
                        setFormState((s) => ({
                          ...s,
                          category: e.target.value as Goalkeeper['category'],
                        }))
                      }
                      className="w-full rounded-lg border border-black/10 bg-surface-container px-3 py-2 font-label text-sm text-on-surface outline-none focus:border-primary"
                    >
                      {gkCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {categoryLabels[cat]}
                        </option>
                      ))}
                    </select>
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
                      className="w-full rounded-lg border border-black/10 bg-surface-container px-3 py-2 font-label text-sm text-on-surface outline-none focus:border-primary"
                    >
                      {statuses.map((st) => (
                        <option key={st} value={st}>
                          {statusLabels[st]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Form / Recovery / Load */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="mb-1 block font-label text-sm font-medium text-on-surface-variant">
                      {t('formLabel')}
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={formState.form}
                      onChange={(e) =>
                        setFormState((s) => ({ ...s, form: clampValue(Number(e.target.value)) }))
                      }
                      className="w-full rounded-lg border border-black/10 bg-surface-container px-3 py-2 font-label text-sm text-on-surface outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block font-label text-sm font-medium text-on-surface-variant">
                      {t('recovery')}
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={formState.recovery}
                      onChange={(e) =>
                        setFormState((s) => ({
                          ...s,
                          recovery: clampValue(Number(e.target.value)),
                        }))
                      }
                      className="w-full rounded-lg border border-black/10 bg-surface-container px-3 py-2 font-label text-sm text-on-surface outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block font-label text-sm font-medium text-on-surface-variant">
                      {t('loadLabel')}
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={formState.load}
                      onChange={(e) =>
                        setFormState((s) => ({ ...s, load: clampValue(Number(e.target.value)) }))
                      }
                      className="w-full rounded-lg border border-black/10 bg-surface-container px-3 py-2 font-label text-sm text-on-surface outline-none focus:border-primary"
                    />
                  </div>
                </div>

                {/* Image URL */}
                <div>
                  <label className="mb-1 block font-label text-sm font-medium text-on-surface-variant">
                    {t('imageUrl')}
                  </label>
                  <input
                    type="text"
                    value={formState.imageUrl}
                    onChange={(e) => setFormState((s) => ({ ...s, imageUrl: e.target.value }))}
                    className="w-full rounded-lg border border-black/10 bg-surface-container px-3 py-2 font-label text-sm text-on-surface outline-none focus:border-primary"
                    placeholder="https://..."
                  />
                </div>

                {/* Submit */}
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-lg border border-black/10 px-4 py-2 font-label text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container-highest"
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
    </div>
  );
};
