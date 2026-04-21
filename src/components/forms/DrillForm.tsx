import React from 'react';
import { X, Target, Library } from 'lucide-react';
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
    <div className="bg-surface-elevated p-6 rounded-xl border border-white/[0.06] space-y-6">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-xs font-bold text-primary uppercase tracking-widest">{headerLabel}</h4>
        <button type="button" onClick={onCancel} className="text-on-surface-variant hover:text-error transition-colors"><X className="w-4 h-4" /></button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          {context === 'warmup' ? (
            <>
              {/* Warmup: title first, then type */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('drillTitle')}</label>
                  <QuickSelect
                    label="Presets"
                    options={getOptions('drillTitles', PRESETS.drills.titles)}
                    onSelect={(vals) => applyDrillTemplate(vals[vals.length - 1])}
                    selectedValues={currentDrill.title ? [currentDrill.title] : []}
                    onDelete={(val) => removeCustomPreset('drillTitles', val)}
                    isDeletable={(val) => !val.startsWith('#')}
                    onAdd={(val) => addCustomPreset('drillTitles', val, [])}
                    onMove={(val) => moveCustomPreset('drillTitles', val, '')}
                  />
                </div>
                <input type="text" value={translateContent(currentDrill.title)} onChange={e => setCurrentDrill({ ...currentDrill, title: e.target.value })} className="w-full bg-surface border border-white/[0.04] rounded px-3 py-2 text-xs" />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('type')}</label>
                </div>
                <select value={currentDrill.type} onChange={e => setCurrentDrill({ ...currentDrill, type: e.target.value as Exercise['type'] })} className="w-full bg-surface border border-white/[0.04] rounded px-3 py-2 text-xs">
                  {PRESETS.drillTypes.filter((t: any) => t !== 'warmup').map(type => (
                    <option key={type} value={type}>{t(type)}</option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <>
              {/* Main: type first, then title */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('type')}</label>
                </div>
                <select value={currentDrill.type} onChange={e => setCurrentDrill({ ...currentDrill, type: e.target.value as Exercise['type'] })} className="w-full bg-surface border border-white/[0.04] rounded px-3 py-2 text-xs">
                  {PRESETS.drillTypes.filter((t: any) => t !== 'warmup').map(type => (
                    <option key={type} value={type}>{t(type)}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('drillTitle')}</label>
                  <QuickSelect
                    label="Presets"
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
                  onBlur={() => addCustomPreset('drillTitles', currentDrill.title, PRESETS.drills.titles)}
                  className="w-full bg-surface border border-white/[0.04] rounded px-3 py-2 text-xs"
                />
              </div>
            </>
          )}
          
          <div className="space-y-1">
            <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('category')}</label>
            <div className="flex flex-wrap gap-1">
              {PRESETS.drillCategories.map(cap => (
                <button
                  key={cap}
                  type="button"
                  onClick={() => setCurrentDrill({ ...currentDrill, category: cap })}
                  className={cn(
                    "px-3 py-1.5 rounded text-[8px] font-bold border transition-all",
                    currentDrill.category === cap ? "bg-secondary/20 border-secondary text-secondary" : "bg-surface border-white/[0.04] text-on-surface-variant"
                  )}
                >
                  {t(cap)}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('objective')}</label>
              <QuickSelect
                label="Presets"
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
              className="w-full bg-surface border border-white/[0.04] rounded px-3 py-2 text-xs min-h-[60px]"
            />
          </div>

          {/* UEFA A: Starting Point */}
          <div className="space-y-1">
            <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('startingPoint')}</label>
            <input 
              type="text" 
              value={translateContent(currentDrill.startingPoint)} 
              onChange={e => setCurrentDrill({ ...currentDrill, startingPoint: e.target.value })} 
              className="w-full bg-surface border border-white/[0.04] rounded px-3 py-2 text-xs"
              placeholder="e.g. Pass from CB to Fullback..."
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('duration')}</label>
              <div className="flex gap-2">
                <input type="text" value={translateContent(currentDrill.duration)} onChange={e => setCurrentDrill({ ...currentDrill, duration: e.target.value })} className="flex-1 bg-surface border border-white/[0.04] rounded px-3 py-2 text-xs" />
                <QuickSelect
                  label="Presets"
                  options={getOptions('durations', PRESETS.durations)}
                  onSelect={(vals) => setCurrentDrill({ ...currentDrill, duration: vals.map(v => t(v)).join(' + ') })}
                  selectedValues={typeof currentDrill.duration === 'string' ? currentDrill.duration.split(' + ') : currentDrill.duration}
                  onDelete={(val) => removeCustomPreset('durations', val)}
                  isDeletable={(val) => !val.startsWith('#')}
                  onAdd={(val) => addCustomPreset('durations', val, [])}
                  onMove={(val) => moveCustomPreset('durations', val, '')}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('intensity')}</label>
              <select value={currentDrill.intensity} onChange={e => setCurrentDrill({ ...currentDrill, intensity: e.target.value as Exercise['intensity'] })} className="w-full bg-surface border border-white/[0.04] rounded px-3 py-2 text-xs">
                {PRESETS.intensities.map(intensity => (
                  <option key={intensity} value={intensity}>{t(intensity)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
             <div className="space-y-1">
               <div className="flex justify-between items-center">
                 <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('gameMomentsLabel')}</label>
                 <QuickSelect
                   label="Presets"
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
                 className="w-full bg-surface border border-white/[0.04] rounded px-3 py-2 text-xs"
                 placeholder={t('select')}
               />
             </div>
             <div className="space-y-1">
               <div className="flex justify-between items-center">
                 <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('tacticalPrinciplesLabel')}</label>
                 <QuickSelect
                   label="Presets"
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
                 className="w-full bg-surface border border-white/[0.04] rounded px-3 py-2 text-xs min-h-[40px]"
                 placeholder={t('objectivePlaceholder')}
               />
             </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('coachingPoints')}</label>
            </div>
            <textarea
              value={translateContent(currentDrill.coachingPoints)}
              onChange={e => setCurrentDrill({ ...currentDrill, coachingPoints: e.target.value })}
              className="w-full bg-surface border border-white/[0.04] rounded px-3 py-2 text-xs min-h-[80px]"
              placeholder="Primary & Secondary KCPs..."
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('diagram')}</label>
            {context === 'warmup' ? (
              <button
                type="button"
                onClick={onOpenTacticalBoard}
                className={cn(
                  "w-full h-32 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all",
                  currentDrill.diagram ? "border-primary bg-primary/5" : "border-white/[0.06] hover:border-white/[0.06]"
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
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onOpenTacticalBoard}
                  className={cn(
                    "flex-1 h-32 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all",
                    currentDrill.diagram ? "border-primary bg-primary/5" : "border-white/[0.06] hover:border-white/[0.06]"
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
                {onOpenLibrary && (
                  <button
                    type="button"
                    onClick={onOpenLibrary}
                    className="flex-1 h-32 border-2 border-dashed border-white/[0.06] rounded-lg text-on-surface-variant hover:border-secondary hover:text-secondary transition-all flex flex-col items-center justify-center gap-2"
                  >
                    <Library className="w-6 h-6" />
                    <span className="text-[8px] font-bold uppercase tracking-widest">{t('fromLibrary')}</span>
                  </button>
                )}
              </div>
            )}
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
                onSelect={(vals) => setCurrentDrill({ ...currentDrill, organization: vals.map(v => t(v)).join('\n') })}
                selectedValues={typeof currentDrill.organization === 'string' ? currentDrill.organization.split('\n') : currentDrill.organization}
                onDelete={(val) => removeCustomPreset('drillOrganizations', val)}
                isDeletable={(val) => !val.startsWith('#')}
                onAdd={(val) => addCustomPreset('drillOrganizations', val, [])}
                onMove={(val) => moveCustomPreset('drillOrganizations', val, '')}
              />
            </div>
            <textarea
              value={translateContent(currentDrill.organization)}
              onChange={e => setCurrentDrill({ ...currentDrill, organization: e.target.value })}
              onBlur={() => addCustomPreset('drillOrganizations', currentDrill.organization, PRESETS.drills.organizations)}
              className="w-full bg-surface border border-white/[0.04] rounded px-3 py-2 text-xs min-h-[60px]"
            />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('execution')}</label>
              <QuickSelect
                label="Presets"
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
              className="w-full bg-surface border border-white/[0.04] rounded px-3 py-2 text-xs min-h-[60px]"
            />
          </div>
        </div>
        {context === 'main' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('progression')}</label>
                <QuickSelect
                  label="Presets"
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
                className="w-full bg-surface border border-white/[0.04] rounded px-3 py-2 text-xs min-h-[60px]"
              />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-[9px] text-on-surface-variant uppercase font-label">{t('successCriteria')}</label>
                <QuickSelect
                  label="Presets"
                  options={getOptions('drillSuccessCriteria', PRESETS.drills.successCriteria)}
                  onSelect={(vals) => setCurrentDrill({ ...currentDrill, successCriteria: vals.map(v => t(v)).join('\n') })}
                  selectedValues={typeof currentDrill.successCriteria === 'string' ? currentDrill.successCriteria.split('\n') : currentDrill.successCriteria}
                  onDelete={(val) => removeCustomPreset('drillSuccessCriteria', val)}
                  isDeletable={(val) => !val.startsWith('#')}
                  onAdd={(val) => addCustomPreset('drillSuccessCriteria', val, [])}
                  onMove={(val) => moveCustomPreset('drillSuccessCriteria', val, '')}
                />
              </div>
              <textarea
                value={translateContent(currentDrill.successCriteria)}
                onChange={e => setCurrentDrill({ ...currentDrill, successCriteria: e.target.value })}
                onBlur={() => addCustomPreset('drillSuccessCriteria', currentDrill.successCriteria, PRESETS.drills.successCriteria)}
                className="w-full bg-surface border border-white/[0.04] rounded px-3 py-2 text-xs min-h-[60px]"
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-white/[0.04]">
        <button
          type="button"
          onClick={async () => {
            if (!currentDrill.title) {
              alert(t('drillTitleRequiredMsg'));
              return;
            }
            await onSave();
          }}
          className="flex items-center gap-2 text-[10px] font-bold text-primary hover:text-primary-dim uppercase tracking-widest transition-all"
        >
          <Library className="w-4 h-4" />
          {t('saveToLibrary')}
        </button>
        <div className="flex gap-3">
          <button type="button" onClick={onCancel} className="px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-white/[0.03] rounded transition-all">{t('discard')}</button>
          <button type="button" onClick={onSave} className="bg-primary text-on-primary px-6 py-2 rounded text-xs font-bold uppercase tracking-widest hover:bg-primary-dim transition-all active:scale-95 shadow-lg shadow-primary/20">{editingDrillId ? t('saveChanges') : t('addExerciseToSession')}</button>
        </div>
      </div>
    </div>
  );
};
