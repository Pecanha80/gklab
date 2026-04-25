import React from 'react';
import { X, Target, Library, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Exercise } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';
import { useCustomPresets } from '../../hooks/useCustomPresets';
import { PRESETS } from '../../data/presets';
import { QuickSelect } from '../ui/QuickSelect';

interface DrillFormProps {
  currentDrill: Omit<Exercise, 'id'>;
  setCurrentDrill: React.Dispatch<React.SetStateAction<Omit<Exercise, 'id'>>>;
  editingDrillId: string | null;
  context: 'warmup' | 'main';
  translateContent: (content: string | string[] | undefined) => string;
  applyDrillTemplate: (title: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onOpenTacticalBoard: () => void;
  onOpenLibrary?: () => void;
}

export const DrillForm: React.FC<DrillFormProps> = ({
  currentDrill,
  setCurrentDrill,
  editingDrillId,
  context,
  translateContent,
  applyDrillTemplate,
  onSave,
  onCancel,
  onOpenTacticalBoard,
  onOpenLibrary,
}) => {
  const { t } = useTranslation();
  const { customPresets, getOptions, addCustomPreset, removeCustomPreset, moveCustomPreset } = useCustomPresets();

  const headerLabel = context === 'warmup'
    ? (editingDrillId ? t('editWarmup') : t('newWarmup'))
    : (editingDrillId ? t('editExercise') : t('newExercise'));

  return (
    <div className="bg-surface-elevated rounded-xl border border-white/[0.06] overflow-hidden">
      {/* ── Header bar ── */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-white/[0.04] bg-white/[0.02]">
        <h4 className="text-[11px] font-bold text-primary uppercase tracking-widest">{headerLabel}</h4>
        <div className="flex-1" />
        {/* Inline metadata pills */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-surface rounded-md border border-white/[0.06] px-1.5 py-1">
            <input
              type="text"
              value={(currentDrill.repetitions || '').replace(/\s*(reps|min)$/i, '')}
              onChange={e => {
                const unit = (currentDrill.repetitions || '').match(/\s*(reps|min)$/i)?.[1] || 'reps';
                setCurrentDrill({ ...currentDrill, repetitions: e.target.value ? `${e.target.value} ${unit}` : '' });
              }}
              className="w-10 bg-transparent text-[11px] font-bold text-on-surface text-center outline-none placeholder:text-on-surface-variant/40"
              placeholder="3x6"
            />
            <select
              value={(currentDrill.repetitions || '').match(/\s*(reps|min)$/i)?.[1] || 'reps'}
              onChange={e => {
                const num = (currentDrill.repetitions || '').replace(/\s*(reps|min)$/i, '').trim();
                setCurrentDrill({ ...currentDrill, repetitions: num ? `${num} ${e.target.value}` : '' });
              }}
              className="bg-transparent text-[9px] font-bold text-accent outline-none cursor-pointer"
            >
              <option value="reps">reps</option>
              <option value="min">min</option>
            </select>
          </div>
          <div className="flex items-center gap-1 bg-surface rounded-md border border-white/[0.06] px-1.5 py-1">
            <Clock className="w-3 h-3 text-on-surface-variant/50" />
            <input
              type="text"
              value={translateContent(currentDrill.duration)}
              onChange={e => setCurrentDrill({ ...currentDrill, duration: e.target.value })}
              className="w-12 bg-transparent text-[11px] font-bold text-on-surface text-center outline-none placeholder:text-on-surface-variant/40"
              placeholder="15'"
            />
            <QuickSelect
              options={getOptions('durations', PRESETS.durations)}
              onSelect={(vals) => setCurrentDrill({ ...currentDrill, duration: vals.map(v => t(v)).join(' + ') })}
              selectedValues={typeof currentDrill.duration === 'string' ? currentDrill.duration.split(' + ') : currentDrill.duration}
              onDelete={(val) => removeCustomPreset('durations', val)}
              isDeletable={(val) => !val.startsWith('#')}
              onAdd={(val) => addCustomPreset('durations', val, [])}
              onMove={(val) => moveCustomPreset('durations', val, '')}
            />
          </div>
          <select
            value={currentDrill.intensity}
            onChange={e => setCurrentDrill({ ...currentDrill, intensity: e.target.value as Exercise['intensity'] })}
            className={cn(
              "text-[10px] font-bold rounded-md border px-2 py-1.5 outline-none cursor-pointer",
              currentDrill.intensity === 'high' ? "bg-error/10 text-error border-error/20" :
              currentDrill.intensity === 'medium' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
              "bg-green-500/10 text-green-500 border-green-500/20"
            )}
          >
            {PRESETS.intensities.map(intensity => (
              <option key={intensity} value={intensity}>{t(intensity)}</option>
            ))}
          </select>
        </div>
        <button type="button" onClick={onCancel} className="text-on-surface-variant hover:text-error transition-colors ml-1">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ── Body ── */}
      <div className="p-5 space-y-5">
        {/* Row 1: Type + Title (+ Game Moment for warmup) */}
        <div className="flex gap-3 items-end">
          <div className="space-y-1 w-[130px] shrink-0">
            <label className="text-[9px] text-on-surface-variant uppercase font-label font-bold">{t('type')}</label>
            <select value={currentDrill.type} onChange={e => setCurrentDrill({ ...currentDrill, type: e.target.value as Exercise['type'] })} className="w-full bg-surface border border-white/[0.04] rounded px-2.5 py-1.5 text-xs">
              {PRESETS.drillTypes.filter((t: any) => t !== 'warmup').map(type => (
                <option key={type} value={type}>{t(type)}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <label className="text-[9px] text-on-surface-variant uppercase font-label font-bold">{t('drillTitle')}</label>
              <QuickSelect
                options={getOptions('drillTitles', PRESETS.drills.titles)}
                onSelect={(vals) => applyDrillTemplate(vals[vals.length - 1])}
                selectedValues={currentDrill.title ? [currentDrill.title] : []}
                onDelete={(val) => removeCustomPreset('drillTitles', val)}
                isDeletable={(val) => !val.startsWith('#')}
                onAdd={(val) => addCustomPreset('drillTitles', val, [])}
                onMove={(val) => moveCustomPreset('drillTitles', val, '')}
              />
            </div>
            <input
              type="text"
              value={translateContent(currentDrill.title)}
              onChange={e => setCurrentDrill({ ...currentDrill, title: e.target.value })}
              onBlur={() => context === 'main' && addCustomPreset('drillTitles', currentDrill.title, PRESETS.drills.titles)}
              className="w-full bg-surface border border-white/[0.04] rounded px-2.5 py-1.5 text-xs"
            />
          </div>
          <div className="space-y-1 w-[180px] shrink-0">
            <div className="flex items-center gap-2">
              <label className="text-[9px] text-on-surface-variant uppercase font-label font-bold">{t('gameMomentsLabel')}</label>
              <QuickSelect
                multiSelect={false}
                selectedValues={currentDrill.gameMoment ? [currentDrill.gameMoment] : []}
                options={getOptions('gameMoments', [
                  'momentOrganizedDefense',
                  'momentDefensiveTransition',
                  'momentOrganizedAttack',
                  'momentOffensiveTransition',
                  'momentSetPieces'
                ])}
                onSelect={(vals) => setCurrentDrill({ ...currentDrill, gameMoment: vals[vals.length - 1] })}
                onDelete={(val) => removeCustomPreset('gameMoments', val)}
                isDeletable={(val) => !val.startsWith('#')}
                onAdd={(val) => addCustomPreset('gameMoments', val, [])}
                onMove={(val) => moveCustomPreset('gameMoments', val, '')}
              />
            </div>
            <input
              type="text"
              readOnly
              value={currentDrill.gameMoment ? t(currentDrill.gameMoment) : ''}
              className="w-full bg-surface border border-white/[0.04] rounded px-2.5 py-1.5 text-xs"
              placeholder={t('select')}
            />
          </div>
        </div>

        {/* Row 2: Main content grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Left column */}
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <label className="text-[9px] text-on-surface-variant uppercase font-label font-bold">{t('objective')}</label>
                <QuickSelect
                  options={getOptions('drillObjectives', PRESETS.drills.objectives)}
                  onSelect={(vals) => setCurrentDrill({ ...currentDrill, objective: vals.map(v => t(v)).join('\n') })}
                  selectedValues={typeof currentDrill.objective === 'string' ? currentDrill.objective.split('\n') : currentDrill.objective}
                  onDelete={(val) => removeCustomPreset('drillObjectives', val)}
                  isDeletable={(val) => !val.startsWith('#')}
                  onAdd={(val) => addCustomPreset('drillObjectives', val, [])}
                  onMove={(val) => moveCustomPreset('drillObjectives', val, '')}
                />
              </div>
              <textarea
                value={translateContent(currentDrill.objective)}
                onChange={e => setCurrentDrill({ ...currentDrill, objective: e.target.value })}
                onBlur={() => addCustomPreset('drillObjectives', currentDrill.objective, PRESETS.drills.objectives)}
                className="w-full bg-surface border border-white/[0.04] rounded px-2.5 py-1.5 text-xs min-h-[52px]"
              />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <label className="text-[9px] text-on-surface-variant uppercase font-label font-bold">{t('coachingPoints')}</label>
              </div>
              <textarea
                value={translateContent(currentDrill.coachingPoints)}
                onChange={e => setCurrentDrill({ ...currentDrill, coachingPoints: e.target.value })}
                className="w-full bg-surface border border-white/[0.04] rounded px-2.5 py-1.5 text-xs min-h-[52px]"
                placeholder="Primary & Secondary KCPs..."
              />
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <label className="text-[9px] text-on-surface-variant uppercase font-label font-bold">{t('tacticalPrinciplesLabel')}</label>
                <QuickSelect
                  multiSelect={true}
                  options={getOptions('tacticalPrinciples', PRESETS.tacticalPrinciples)}
                  onSelect={(vals) => setCurrentDrill({ ...currentDrill, tacticalPrinciples: vals })}
                  selectedValues={currentDrill.tacticalPrinciples || []}
                  onDelete={(val) => removeCustomPreset('tacticalPrinciples', val)}
                  isDeletable={(val) => !val.startsWith('#')}
                  onAdd={(val) => addCustomPreset('tacticalPrinciples', val, [])}
                  onMove={(val) => moveCustomPreset('tacticalPrinciples', val, '')}
                />
              </div>
              <textarea
                value={translateContent(currentDrill.tacticalPrinciples)}
                onChange={e => setCurrentDrill({ ...currentDrill, tacticalPrinciples: e.target.value.split('\n') })}
                className="w-full bg-surface border border-white/[0.04] rounded px-2.5 py-1.5 text-xs min-h-[52px]"
                placeholder={t('objectivePlaceholder')}
              />
            </div>
          </div>
        </div>

        {/* Row 3: Execution + Progression */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <label className="text-[9px] text-on-surface-variant uppercase font-label font-bold">{t('execution')}</label>
              <QuickSelect
                options={getOptions('drillExecutions', PRESETS.drills.executions)}
                onSelect={(vals) => setCurrentDrill({ ...currentDrill, execution: vals.map(v => t(v)).join('\n') })}
                multiSelect={true}
                selectedValues={typeof currentDrill.execution === 'string' ? currentDrill.execution.split('\n') : currentDrill.execution}
                onDelete={(val) => removeCustomPreset('drillExecutions', val)}
                isDeletable={(val) => !val.startsWith('#')}
                onAdd={(val) => addCustomPreset('drillExecutions', val, [])}
                onMove={(val) => moveCustomPreset('drillExecutions', val, '')}
              />
            </div>
            <textarea
              value={translateContent(currentDrill.execution)}
              onChange={e => setCurrentDrill({ ...currentDrill, execution: e.target.value })}
              onBlur={() => addCustomPreset('drillExecutions', currentDrill.execution, PRESETS.drills.executions)}
              className="w-full bg-surface border border-white/[0.04] rounded px-2.5 py-1.5 text-xs min-h-[52px]"
            />
          </div>
          {context === 'main' && (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <label className="text-[9px] text-on-surface-variant uppercase font-label font-bold">{t('progression')}</label>
                <QuickSelect
                  options={getOptions('drillProgressions', PRESETS.drills.progressions)}
                  onSelect={(vals) => setCurrentDrill({ ...currentDrill, progression: vals.map(v => t(v)).join('\n') })}
                  selectedValues={typeof currentDrill.progression === 'string' ? currentDrill.progression.split('\n') : currentDrill.progression}
                  onDelete={(val) => removeCustomPreset('drillProgressions', val)}
                  isDeletable={(val) => !val.startsWith('#')}
                  onAdd={(val) => addCustomPreset('drillProgressions', val, [])}
                  onMove={(val) => moveCustomPreset('drillProgressions', val, '')}
                />
              </div>
              <textarea
                value={translateContent(currentDrill.progression)}
                onChange={e => setCurrentDrill({ ...currentDrill, progression: e.target.value })}
                onBlur={() => addCustomPreset('drillProgressions', currentDrill.progression, PRESETS.drills.progressions)}
                className="w-full bg-surface border border-white/[0.04] rounded px-2.5 py-1.5 text-xs min-h-[52px]"
              />
            </div>
          )}
        </div>
        {/* Diagram — full width */}
        <div className="space-y-1">
          <label className="text-[9px] text-on-surface-variant uppercase font-label font-bold">{t('diagram')}</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onOpenTacticalBoard}
              className={cn(
                "flex-1 h-24 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1.5 transition-all",
                currentDrill.diagram ? "border-primary bg-primary/5" : "border-white/[0.06] hover:border-white/[0.1]"
              )}
            >
              {currentDrill.diagram ? (
                <img src={currentDrill.diagram} alt="Diagram" className="h-full w-full object-contain p-1.5" referrerPolicy="no-referrer" />
              ) : (
                <>
                  <Target className="w-5 h-5 text-on-surface-variant" />
                  <span className="text-[8px] font-bold uppercase">{t('designExercise')}</span>
                </>
              )}
            </button>
            {onOpenLibrary && (
              <button
                type="button"
                onClick={onOpenLibrary}
                className="flex-1 h-24 border-2 border-dashed border-white/[0.06] rounded-lg text-on-surface-variant hover:border-secondary hover:text-secondary transition-all flex flex-col items-center justify-center gap-1.5"
              >
                <Library className="w-5 h-5" />
                <span className="text-[8px] font-bold uppercase tracking-widest">{t('fromLibrary')}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Footer actions ── */}
      <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-white/[0.04] bg-white/[0.01]">
        <button
          type="button"
          onClick={async () => {
            if (!currentDrill.title) {
              alert(t('drillTitleRequiredMsg'));
              return;
            }
            await onSave();
          }}
          className="flex items-center gap-1.5 text-[10px] font-bold text-primary hover:text-primary-dim uppercase tracking-widest transition-all"
        >
          <Library className="w-3.5 h-3.5" />
          {t('saveToLibrary')}
        </button>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onCancel} className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest hover:bg-white/[0.03] rounded transition-all">{t('discard')}</button>
          <button type="button" onClick={onSave} className="bg-primary text-on-primary px-5 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest hover:bg-primary-dim transition-all active:scale-95 shadow-lg shadow-primary/20">{editingDrillId ? t('saveChanges') : t('addExerciseToSession')}</button>
        </div>
      </div>
    </div>
  );
};
