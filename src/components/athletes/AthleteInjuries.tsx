import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, AlertTriangle, Check, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTranslation } from '../../hooks/useTranslation';
import { useInjuries } from '../../hooks/useInjuries';
import { getTodayDateString, parseDate } from '../../lib/utils';
import type { Goalkeeper, Injury } from '../../types';

interface AthleteInjuriesProps {
  goalkeeper: Goalkeeper;
}

const BODY_PARTS = [
  'shoulder', 'knee', 'ankle', 'wrist', 'finger', 'hip',
  'back', 'groin', 'hamstring', 'quadriceps', 'calf', 'head',
];

const INJURY_TYPES = [
  'muscle', 'ligament', 'tendon', 'fracture', 'concussion',
  'sprain', 'strain', 'contusion', 'dislocation',
];

const RTP_STEPS: Injury['returnToPlayStatus'][] = ['phase_1', 'phase_2', 'phase_3', 'cleared'];

const severityConfig = {
  mild: { color: 'text-amber-700', bg: 'bg-amber-500/10' },
  moderate: { color: 'text-orange-700', bg: 'bg-orange-500/10' },
  severe: { color: 'text-red-700', bg: 'bg-red-500/10' },
};

function daysBetween(start: string, end?: string): number {
  const s = parseDate(start);
  const e = end ? parseDate(end) : new Date();
  return Math.max(0, Math.floor((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)));
}

function rtpIndex(status?: string): number {
  if (!status || status === 'not_started') return -1;
  return RTP_STEPS.indexOf(status as Injury['returnToPlayStatus']);
}

export const AthleteInjuries: React.FC<AthleteInjuriesProps> = ({ goalkeeper }) => {
  const { t } = useTranslation();
  const { injuries, loading, fetchInjuries, addInjury, updateInjury, deleteInjury } = useInjuries();

  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    startDate: getTodayDateString(),
    bodyPart: '',
    injuryType: '',
    severity: 'moderate' as Injury['severity'],
    treatment: '',
    notes: '',
  });

  useEffect(() => {
    fetchInjuries(goalkeeper.id);
  }, [goalkeeper.id, fetchInjuries]);

  const { active, history } = useMemo(() => {
    const active: Injury[] = [];
    const history: Injury[] = [];
    injuries.forEach(inj => {
      if (!inj.endDate && inj.returnToPlayStatus !== 'cleared') {
        active.push(inj);
      } else {
        history.push(inj);
      }
    });
    return { active, history };
  }, [injuries]);

  const handleSubmit = async () => {
    if (!formData.bodyPart.trim() || !formData.injuryType.trim()) return;
    await addInjury({
      goalkeeper_id: goalkeeper.id,
      startDate: formData.startDate,
      bodyPart: formData.bodyPart.trim(),
      injuryType: formData.injuryType.trim(),
      severity: formData.severity,
      treatment: formData.treatment.trim() || undefined,
      notes: formData.notes.trim() || undefined,
    });
    setFormData({ startDate: getTodayDateString(), bodyPart: '', injuryType: '', severity: 'moderate', treatment: '', notes: '' });
    setIsAdding(false);
  };

  const handleRtpClick = (injury: Injury, step: Injury['returnToPlayStatus']) => {
    if (step === 'cleared') {
      updateInjury(injury.id, {
        returnToPlayStatus: 'cleared',
        endDate: getTodayDateString(),
      });
    } else {
      updateInjury(injury.id, { returnToPlayStatus: step });
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm(t('deleteConfirm') || 'Tem a certeza?')) {
      deleteInjury(id);
    }
  };

  const rtpLabel = (step: string) => {
    const map: Record<string, string> = {
      phase_1: t('phase1') || 'Fase 1',
      phase_2: t('phase2') || 'Fase 2',
      phase_3: t('phase3') || 'Fase 3',
      cleared: t('cleared') || 'Liberado',
    };
    return map[step] || step;
  };

  const severityLabel = (s: string) => {
    const map: Record<string, string> = {
      mild: t('mild') || 'Ligeira',
      moderate: t('moderate') || 'Moderada',
      severe: t('severe') || 'Grave',
    };
    return map[s] || s;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Add injury button / form */}
      {!isAdding ? (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full bg-surface rounded-xl border border-dashed border-black/[0.12] p-4 flex items-center justify-center gap-2 text-on-surface-variant hover:border-accent hover:text-accent transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm font-semibold">{t('addInjury') || 'Registar Lesão'}</span>
        </button>
      ) : (
        <div className="bg-surface rounded-xl border border-black/[0.08] overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 bg-black/[0.02] border-b border-black/[0.06]">
            <div className="w-1 h-5 rounded-full bg-red-500" />
            <span className="text-[10px] font-bold text-on-surface uppercase tracking-wider">{t('addInjury') || 'Registar Lesão'}</span>
          </div>
          <div className="p-5 space-y-4">
            {/* Date */}
            <div>
              <label className="text-xs font-semibold text-on-surface-variant mb-1 block">{t('startDate') || 'Data de Início'}</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={e => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full bg-background border border-black/[0.1] rounded-lg px-3 py-2.5 text-sm focus:border-accent outline-none"
              />
            </div>

            {/* Body Part */}
            <div>
              <label className="text-xs font-semibold text-on-surface-variant mb-1 block">{t('bodyPart') || 'Parte do Corpo'}</label>
              <input
                type="text"
                list="body-parts"
                value={formData.bodyPart}
                onChange={e => setFormData(prev => ({ ...prev, bodyPart: e.target.value }))}
                placeholder={t('bodyPart') || 'Parte do Corpo'}
                className="w-full bg-background border border-black/[0.1] rounded-lg px-3 py-2.5 text-sm focus:border-accent outline-none"
              />
              <datalist id="body-parts">
                {BODY_PARTS.map(bp => <option key={bp} value={bp} />)}
              </datalist>
            </div>

            {/* Injury Type */}
            <div>
              <label className="text-xs font-semibold text-on-surface-variant mb-1 block">{t('injuryType') || 'Tipo de Lesão'}</label>
              <input
                type="text"
                list="injury-types"
                value={formData.injuryType}
                onChange={e => setFormData(prev => ({ ...prev, injuryType: e.target.value }))}
                placeholder={t('injuryType') || 'Tipo de Lesão'}
                className="w-full bg-background border border-black/[0.1] rounded-lg px-3 py-2.5 text-sm focus:border-accent outline-none"
              />
              <datalist id="injury-types">
                {INJURY_TYPES.map(it => <option key={it} value={it} />)}
              </datalist>
            </div>

            {/* Severity */}
            <div>
              <label className="text-xs font-semibold text-on-surface-variant mb-1 block">{t('severity') || 'Gravidade'}</label>
              <div className="flex gap-2">
                {(['mild', 'moderate', 'severe'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setFormData(prev => ({ ...prev, severity: s }))}
                    className={cn(
                      "px-4 py-2 rounded-lg text-xs font-semibold transition-all flex-1",
                      formData.severity === s
                        ? s === 'mild' ? "bg-amber-500 text-white" : s === 'moderate' ? "bg-orange-500 text-white" : "bg-red-500 text-white"
                        : "bg-background border border-black/[0.08] text-on-surface-variant hover:border-black/[0.15]"
                    )}
                  >
                    {severityLabel(s)}
                  </button>
                ))}
              </div>
            </div>

            {/* Treatment */}
            <div>
              <label className="text-xs font-semibold text-on-surface-variant mb-1 block">{t('treatment') || 'Tratamento'}</label>
              <textarea
                value={formData.treatment}
                onChange={e => setFormData(prev => ({ ...prev, treatment: e.target.value }))}
                placeholder={t('treatment') || 'Tratamento'}
                className="w-full bg-background border border-black/[0.1] rounded-lg px-3 py-2.5 text-sm min-h-[60px] resize-none focus:border-accent outline-none"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-semibold text-on-surface-variant mb-1 block">{t('notes') || 'Notas'}</label>
              <textarea
                value={formData.notes}
                onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder={t('notes') || 'Notas'}
                className="w-full bg-background border border-black/[0.1] rounded-lg px-3 py-2.5 text-sm min-h-[60px] resize-none focus:border-accent outline-none"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setIsAdding(false); setFormData({ startDate: getTodayDateString(), bodyPart: '', injuryType: '', severity: 'moderate', treatment: '', notes: '' }); }}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-on-surface-variant hover:bg-black/[0.03] transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleSubmit}
                disabled={!formData.bodyPart.trim() || !formData.injuryType.trim()}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-accent text-white disabled:opacity-40 hover:brightness-110 transition-all"
              >
                {t('save') || 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Injuries */}
      <div className="bg-surface rounded-xl border border-black/[0.08] overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 bg-black/[0.02] border-b border-black/[0.06]">
          <div className="w-1 h-5 rounded-full bg-red-500" />
          <span className="text-[10px] font-bold text-on-surface uppercase tracking-wider">
            {t('activeInjuries') || 'Lesões Ativas'} ({active.length})
          </span>
        </div>

        {active.length > 0 ? (
          <div className="divide-y divide-black/[0.04]">
            {active.map(injury => (
              <div key={injury.id} className="px-5 py-4">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg shrink-0 mt-0.5 bg-red-500/10">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {/* Header row */}
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-semibold text-on-surface capitalize">{injury.bodyPart}</span>
                      <span className="text-[10px] text-on-surface-variant">—</span>
                      <span className="text-xs text-on-surface-variant capitalize">{injury.injuryType}</span>
                      <span className={cn(
                        "text-[9px] font-bold px-2 py-0.5 rounded-full",
                        severityConfig[injury.severity].bg,
                        severityConfig[injury.severity].color
                      )}>
                        {severityLabel(injury.severity)}
                      </span>
                      <span className="text-[10px] text-on-surface-variant/60 ml-auto flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {daysBetween(injury.startDate)} {t('daysOut') || 'dias fora'}
                      </span>
                    </div>

                    {/* Treatment */}
                    {injury.treatment && (
                      <p className="text-xs text-on-surface-variant mt-1">
                        <span className="font-semibold">{t('treatment') || 'Tratamento'}:</span> {injury.treatment}
                      </p>
                    )}

                    {/* Notes */}
                    {injury.notes && (
                      <p className="text-xs text-on-surface-variant mt-1">{injury.notes}</p>
                    )}

                    {/* Return-to-play tracker */}
                    <div className="mt-3">
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-2 block">
                        {t('returnToPlay') || 'Retorno ao Jogo'}
                      </span>
                      <div className="flex items-center gap-1">
                        {RTP_STEPS.map((step, idx) => {
                          const currentIdx = rtpIndex(injury.returnToPlayStatus);
                          const isCompleted = idx <= currentIdx;
                          const isCurrent = idx === currentIdx;
                          return (
                            <React.Fragment key={step}>
                              {idx > 0 && (
                                <div className={cn(
                                  "h-0.5 flex-1 rounded-full transition-colors",
                                  idx <= currentIdx ? "bg-accent" : "bg-black/[0.08]"
                                )} />
                              )}
                              <button
                                onClick={() => handleRtpClick(injury, step)}
                                className={cn(
                                  "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all shrink-0",
                                  isCompleted
                                    ? step === 'cleared'
                                      ? "bg-success/10 text-success"
                                      : "bg-accent/10 text-accent"
                                    : "bg-background border border-black/[0.08] text-on-surface-variant hover:border-accent hover:text-accent"
                                )}
                                title={step === 'cleared' ? (t('markAsCleared') || 'Marcar como Liberado') : undefined}
                              >
                                {isCompleted ? (
                                  <Check className="w-3 h-3" />
                                ) : null}
                                {rtpLabel(step!)}
                              </button>
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(injury.id)}
                    className="p-1.5 rounded-lg text-on-surface-variant/30 hover:text-error hover:bg-error/5 transition-colors shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-on-surface-variant">
            <Check className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">{t('noActiveInjuries') || 'Sem lesões ativas'}</p>
          </div>
        )}
      </div>

      {/* Injury History */}
      <div className="bg-surface rounded-xl border border-black/[0.08] overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 bg-black/[0.02] border-b border-black/[0.06]">
          <div className="w-1 h-5 rounded-full bg-gray-400" />
          <span className="text-[10px] font-bold text-on-surface uppercase tracking-wider">
            {t('injuryHistory') || 'Histórico de Lesões'} ({history.length})
          </span>
        </div>

        {history.length > 0 ? (
          <div className="divide-y divide-black/[0.04]">
            {history.map(injury => (
              <div key={injury.id} className="px-5 py-4 hover:bg-black/[0.01] transition-colors">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg shrink-0 mt-0.5 bg-on-surface-variant/10">
                    <AlertTriangle className="w-3.5 h-3.5 text-on-surface-variant" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-semibold text-on-surface capitalize">{injury.bodyPart}</span>
                      <span className="text-[10px] text-on-surface-variant">—</span>
                      <span className="text-xs text-on-surface-variant capitalize">{injury.injuryType}</span>
                      <span className={cn(
                        "text-[9px] font-bold px-2 py-0.5 rounded-full",
                        severityConfig[injury.severity].bg,
                        severityConfig[injury.severity].color
                      )}>
                        {severityLabel(injury.severity)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-on-surface-variant/60">
                      <span>
                        {parseDate(injury.startDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        {injury.endDate && (
                          <> — {parseDate(injury.endDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</>
                        )}
                      </span>
                      <span>{daysBetween(injury.startDate, injury.endDate)} {t('daysOut') || 'dias fora'}</span>
                    </div>
                    {injury.treatment && (
                      <p className="text-xs text-on-surface-variant mt-1">
                        <span className="font-semibold">{t('treatment') || 'Tratamento'}:</span> {injury.treatment}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => handleDelete(injury.id)}
                    className="p-1.5 rounded-lg text-on-surface-variant/30 hover:text-error hover:bg-error/5 transition-colors shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-on-surface-variant">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">{t('noInjuries') || 'Sem lesões registadas.'}</p>
          </div>
        )}
      </div>
    </div>
  );
};
