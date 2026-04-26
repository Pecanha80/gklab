import React, { useState, useEffect } from 'react';
import { Plus, X, Target, Trash2, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTranslation } from '../../hooks/useTranslation';
import { useAthleteGoals } from '../../hooks/useAthleteGoals';
import type { Goalkeeper, DevelopmentGoal } from '../../types';

interface AthleteIDPProps {
  goalkeeper: Goalkeeper;
}

const CATEGORIES = ['technical', 'tactical', 'physical', 'psychological'] as const;
const STATUSES = ['pending', 'in_progress', 'achieved'] as const;
const PRIORITIES = ['low', 'medium', 'high'] as const;

const CATEGORY_COLORS: Record<string, string> = {
  technical: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  tactical: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  physical: 'bg-red-500/10 text-red-500 border-red-500/20',
  psychological: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-on-surface/5 text-on-surface-variant',
  in_progress: 'bg-blue-500/10 text-blue-500',
  achieved: 'bg-success/10 text-success',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: 'text-on-surface-variant',
  medium: 'text-amber-500',
  high: 'text-error',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'goalStatusPending',
  in_progress: 'goalStatusInProgress',
  achieved: 'goalStatusAchieved',
};

export const AthleteIDP: React.FC<AthleteIDPProps> = ({ goalkeeper }) => {
  const { t } = useTranslation();
  const { goals, loading, fetchGoals, addGoal, updateGoal, deleteGoal } = useAthleteGoals();
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [form, setForm] = useState({
    title: '',
    category: 'technical' as DevelopmentGoal['category'],
    description: '',
    targetDate: '',
    priority: 'medium' as DevelopmentGoal['priority'],
  });

  useEffect(() => {
    fetchGoals(goalkeeper.id);
  }, [goalkeeper.id, fetchGoals]);

  const handleSubmit = async () => {
    if (!form.title.trim()) return;
    await addGoal(goalkeeper.id, {
      ...form,
      targetDate: form.targetDate || undefined,
      description: form.description || undefined,
      status: 'pending',
    });
    setForm({ title: '', category: 'technical', description: '', targetDate: '', priority: 'medium' });
    setShowForm(false);
  };

  const handleStatusCycle = async (goal: DevelopmentGoal) => {
    const next = goal.status === 'pending' ? 'in_progress' : goal.status === 'in_progress' ? 'achieved' : 'pending';
    await updateGoal(goal.id, goalkeeper.id, { status: next });
  };

  const handleDelete = async (goal: DevelopmentGoal) => {
    if (window.confirm(t('confirmDeleteExercise'))) {
      await deleteGoal(goal.id, goalkeeper.id);
    }
  };

  const filteredGoals = filterStatus === 'all' ? goals : goals.filter(g => g.status === filterStatus);
  const achievedCount = goals.filter(g => g.status === 'achieved').length;
  const progressPct = goals.length > 0 ? Math.round((achievedCount / goals.length) * 100) : 0;

  if (loading) {
    return <div className="text-center py-12 text-on-surface-variant">{t('loading')}...</div>;
  }

  return (
    <div className="space-y-5">
      {/* Progress Summary */}
      {goals.length > 0 && (
        <div className="bg-surface rounded-xl border border-black/[0.08] overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 bg-black/[0.02] border-b border-black/[0.06]">
            <div className="w-1 h-5 rounded-full bg-primary" />
            <span className="text-[10px] font-bold text-on-surface uppercase tracking-wider">{t('goalsProgress')}</span>
          </div>
          <div className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-on-surface-variant">{achievedCount}/{goals.length} {t('goalStatusAchieved').toLowerCase()}</span>
              <span className="text-sm font-bold text-on-surface">{progressPct}%</span>
            </div>
            <div className="h-2 bg-background rounded-full overflow-hidden">
              <div className="h-full bg-success rounded-full transition-all" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* Header + Add */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-on-surface">{t('developmentGoals')}</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary hover:bg-primary-dim text-on-primary px-4 py-2 rounded-md font-label text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? t('discard') : t('addGoal')}
        </button>
      </div>

      {/* Add Goal Form */}
      {showForm && (
        <div className="bg-surface rounded-xl border border-black/[0.08] p-5 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] text-on-surface-variant font-semibold uppercase tracking-wide">{t('goalTitle')}</label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                className="w-full bg-background border border-black/[0.1] rounded-lg px-3 py-2.5 text-sm"
                placeholder={t('goalTitle')}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-on-surface-variant font-semibold uppercase tracking-wide">{t('category')}</label>
                <select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value as DevelopmentGoal['category'] })}
                  className="w-full bg-background border border-black/[0.1] rounded-lg px-3 py-2.5 text-sm"
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{t(c)}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-on-surface-variant font-semibold uppercase tracking-wide">{t('goalPriority')}</label>
                <select
                  value={form.priority}
                  onChange={e => setForm({ ...form, priority: e.target.value as DevelopmentGoal['priority'] })}
                  className="w-full bg-background border border-black/[0.1] rounded-lg px-3 py-2.5 text-sm"
                >
                  {PRIORITIES.map(p => (
                    <option key={p} value={p}>{t(p)}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-on-surface-variant font-semibold uppercase tracking-wide">{t('targetDate')}</label>
                <input
                  type="date"
                  value={form.targetDate}
                  onChange={e => setForm({ ...form, targetDate: e.target.value })}
                  className="w-full bg-background border border-black/[0.1] rounded-lg px-3 py-2.5 text-sm"
                />
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-on-surface-variant font-semibold uppercase tracking-wide">{t('goalDescription')}</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full bg-background border border-black/[0.1] rounded-lg px-3 py-2.5 text-sm min-h-[60px]"
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={!form.title.trim()}
              className="bg-primary hover:bg-primary-dim text-on-primary px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50"
            >
              {t('save')}
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2">
        {['all', ...STATUSES].map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
              filterStatus === s ? "bg-primary/10 text-primary" : "bg-background text-on-surface-variant hover:text-on-surface"
            )}
          >
            {s === 'all' ? t('all') || 'All' : t(STATUS_LABELS[s])}
            {s !== 'all' && (
              <span className="ml-1 opacity-60">({goals.filter(g => g.status === s).length})</span>
            )}
          </button>
        ))}
      </div>

      {/* Goals List */}
      {filteredGoals.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-black/[0.06] rounded-xl">
          <Target className="w-10 h-10 text-on-surface-variant mx-auto mb-3" />
          <p className="text-sm text-on-surface-variant">{t('noGoalsYet')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {CATEGORIES.map(cat => {
            const catGoals = filteredGoals.filter(g => g.category === cat);
            if (catGoals.length === 0) return null;
            return (
              <div key={cat} className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-widest", CATEGORY_COLORS[cat])}>
                    {t(cat)}
                  </span>
                  <div className="flex-1 border-t border-black/[0.04]" />
                </div>
                {catGoals.map(goal => (
                  <div
                    key={goal.id}
                    className="bg-surface rounded-xl border border-black/[0.08] p-4 flex items-center gap-4 group hover:border-black/[0.12] transition-all"
                  >
                    <button
                      onClick={() => handleStatusCycle(goal)}
                      className={cn(
                        "w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                        goal.status === 'achieved' ? "bg-success border-success text-white" :
                        goal.status === 'in_progress' ? "border-blue-500 bg-blue-500/10" :
                        "border-black/[0.15] hover:border-primary"
                      )}
                      title={t(STATUS_LABELS[goal.status])}
                    >
                      {goal.status === 'achieved' && <ChevronRight className="w-4 h-4 rotate-[-45deg]" />}
                      {goal.status === 'in_progress' && <div className="w-3 h-3 rounded-full bg-blue-500" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn("text-sm font-semibold", goal.status === 'achieved' ? "line-through text-on-surface-variant" : "text-on-surface")}>
                          {goal.title}
                        </span>
                        <span className={cn("text-[8px] font-bold uppercase", PRIORITY_COLORS[goal.priority])}>
                          {goal.priority === 'high' ? '!!!' : goal.priority === 'medium' ? '!!' : '!'}
                        </span>
                      </div>
                      {goal.description && (
                        <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-1">{goal.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1">
                        <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded", STATUS_COLORS[goal.status])}>
                          {t(STATUS_LABELS[goal.status])}
                        </span>
                        {goal.targetDate && (
                          <span className="text-[10px] text-on-surface-variant">
                            {t('targetDate')}: {new Date(goal.targetDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(goal)}
                      className="p-1.5 text-on-surface-variant hover:text-error transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
