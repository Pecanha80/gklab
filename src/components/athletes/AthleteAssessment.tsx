import React, { useState, useEffect } from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';
import { Plus, Trash2, Star, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTranslation } from '../../hooks/useTranslation';
import { useCompetencyAssessments } from '../../hooks/useCompetencyAssessments';
import { getTodayDateString, parseDate } from '../../lib/utils';
import type { Goalkeeper, CompetencyAssessment } from '../../types';

interface AthleteAssessmentProps {
  goalkeeper: Goalkeeper;
}

const GK_COMPETENCIES = [
  'shotStopping',
  'crossesAerial',
  'oneVsOne',
  'distribution',
  'footwork',
  'positioning',
  'decisionMaking',
  'communication',
  'physicalAttributes',
  'psychologicalResilience',
] as const;

export const AthleteAssessment: React.FC<AthleteAssessmentProps> = ({ goalkeeper }) => {
  const { t } = useTranslation();
  const { assessments, loading, fetchAssessments, addAssessment, deleteAssessment } = useCompetencyAssessments();

  const [isAdding, setIsAdding] = useState(false);
  const [scores, setScores] = useState<Record<string, number>>(
    Object.fromEntries(GK_COMPETENCIES.map(c => [c, 5]))
  );
  const [notes, setNotes] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchAssessments(goalkeeper.id);
  }, [goalkeeper.id, fetchAssessments]);

  const latest = assessments.length > 0 ? assessments[0] : null;
  const previous = assessments.length > 1 ? assessments[1] : null;

  // Build radar chart data
  const radarData = GK_COMPETENCIES.map(comp => {
    const entry: Record<string, string | number> = {
      competency: t(comp) || comp,
    };
    if (latest) {
      const found = latest.assessments.find(a => a.category === comp);
      entry.current = found ? found.score : 0;
    }
    if (previous) {
      const found = previous.assessments.find(a => a.category === comp);
      entry.previous = found ? found.score : 0;
    }
    return entry;
  });

  const handleSubmit = async () => {
    const assessmentData = GK_COMPETENCIES.map(comp => ({
      category: comp,
      score: scores[comp],
    }));

    await addAssessment({
      goalkeeper_id: goalkeeper.id,
      date: getTodayDateString(),
      assessments: assessmentData,
      notes: notes.trim() || undefined,
    });

    setIsAdding(false);
    setScores(Object.fromEntries(GK_COMPETENCIES.map(c => [c, 5])));
    setNotes('');
  };

  const handleDelete = (id: string) => {
    if (window.confirm(t('deleteNoteConfirm') || 'Tem a certeza que quer apagar esta avaliação?')) {
      deleteAssessment(id);
    }
  };

  const getAverage = (assessment: CompetencyAssessment) => {
    if (!assessment.assessments.length) return 0;
    const sum = assessment.assessments.reduce((acc, a) => acc + a.score, 0);
    return (sum / assessment.assessments.length).toFixed(1);
  };

  return (
    <div className="space-y-5">
      {/* Radar Chart */}
      <div className="bg-surface rounded-xl border border-black/[0.08] overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 bg-black/[0.02] border-b border-black/[0.06]">
          <div className="w-1 h-5 rounded-full bg-amber-500" />
          <span className="text-[10px] font-bold text-on-surface uppercase tracking-wider">
            {t('competencyProfile') || 'Perfil de Competências'}
          </span>
        </div>

        {latest ? (
          <div className="p-5">
            <ResponsiveContainer width="100%" height={380}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                <PolarGrid stroke="rgba(0,0,0,0.08)" />
                <PolarAngleAxis
                  dataKey="competency"
                  tick={{ fontSize: 11, fill: '#666' }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 10]}
                  tick={{ fontSize: 10, fill: '#999' }}
                  tickCount={6}
                />
                {previous && (
                  <Radar
                    name={t('previousAssessment') || 'Avaliação Anterior'}
                    dataKey="previous"
                    stroke="#94a3b8"
                    fill="#94a3b8"
                    fillOpacity={0.15}
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                  />
                )}
                <Radar
                  name={t('currentAssessment') || 'Avaliação Atual'}
                  dataKey="current"
                  stroke="#f59e0b"
                  fill="#f59e0b"
                  fillOpacity={0.25}
                  strokeWidth={2}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-amber-500 rounded" />
                <span className="text-xs text-on-surface-variant">
                  {t('currentAssessment') || 'Avaliação Atual'}
                </span>
              </div>
              {previous && (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-0.5 bg-slate-400 rounded border-dashed" style={{ borderTop: '2px dashed #94a3b8', height: 0 }} />
                  <span className="text-xs text-on-surface-variant">
                    {t('previousAssessment') || 'Avaliação Anterior'}
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-on-surface-variant">
            <Star className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">{t('noAssessmentsYet') || 'Sem avaliações ainda.'}</p>
          </div>
        )}
      </div>

      {/* New Assessment button / form */}
      {!isAdding ? (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full bg-surface rounded-xl border border-dashed border-black/[0.12] p-4 flex items-center justify-center gap-2 text-on-surface-variant hover:border-accent hover:text-accent transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm font-semibold">{t('newAssessment') || 'Nova Avaliação'}</span>
        </button>
      ) : (
        <div className="bg-surface rounded-xl border border-black/[0.08] overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 bg-black/[0.02] border-b border-black/[0.06]">
            <div className="w-1 h-5 rounded-full bg-accent" />
            <span className="text-[10px] font-bold text-on-surface uppercase tracking-wider">
              {t('newAssessment') || 'Nova Avaliação'}
            </span>
          </div>
          <div className="p-5 space-y-4">
            {/* Sliders */}
            <div className="grid gap-3">
              {GK_COMPETENCIES.map(comp => (
                <div key={comp} className="flex items-center gap-3">
                  <span className="text-sm text-on-surface w-44 shrink-0 truncate">
                    {t(comp) || comp}
                  </span>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={scores[comp]}
                    onChange={e => setScores(prev => ({ ...prev, [comp]: Number(e.target.value) }))}
                    className="flex-1 h-2 bg-black/[0.06] rounded-full appearance-none cursor-pointer accent-accent"
                  />
                  <span className={cn(
                    "text-sm font-bold w-7 text-center rounded-md py-0.5",
                    scores[comp] >= 8 ? "text-green-600 bg-green-500/10" :
                    scores[comp] >= 5 ? "text-amber-600 bg-amber-500/10" :
                    "text-red-600 bg-red-500/10"
                  )}>
                    {scores[comp]}
                  </span>
                </div>
              ))}
            </div>

            {/* Notes */}
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={t('assessmentNotes') || 'Notas da avaliação...'}
              className="w-full bg-background border border-black/[0.1] rounded-lg px-3 py-2.5 text-sm min-h-[70px] resize-none focus:border-accent outline-none"
            />

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setIsAdding(false); setNotes(''); }}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-on-surface-variant hover:bg-black/[0.03] transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-accent text-white hover:brightness-110 transition-all"
              >
                {t('save') || 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assessment History */}
      <div className="bg-surface rounded-xl border border-black/[0.08] overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 bg-black/[0.02] border-b border-black/[0.06]">
          <div className="w-1 h-5 rounded-full bg-blue-500" />
          <span className="text-[10px] font-bold text-on-surface uppercase tracking-wider">
            {t('assessmentHistory') || 'Histórico de Avaliações'} ({assessments.length})
          </span>
        </div>

        {assessments.length > 0 ? (
          <div className="divide-y divide-black/[0.04]">
            {assessments.map(assessment => (
              <div key={assessment.id} className="hover:bg-black/[0.01] transition-colors">
                <div
                  className="px-5 py-4 flex items-center gap-3 cursor-pointer"
                  onClick={() => setExpandedId(expandedId === assessment.id ? null : assessment.id)}
                >
                  <div className="p-1.5 rounded-lg bg-amber-500/10 shrink-0">
                    <Star className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-on-surface">
                        {parseDate(assessment.date).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600">
                        {t('averageScore') || 'Score Médio'}: {getAverage(assessment)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {expandedId === assessment.id ? (
                      <ChevronUp className="w-4 h-4 text-on-surface-variant" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-on-surface-variant" />
                    )}
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(assessment.id); }}
                      className="p-1.5 rounded-lg text-on-surface-variant/30 hover:text-error hover:bg-error/5 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Expanded details */}
                {expandedId === assessment.id && (
                  <div className="px-5 pb-4 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      {assessment.assessments.map(a => (
                        <div key={a.category} className="flex items-center justify-between bg-background rounded-lg px-3 py-2">
                          <span className="text-xs text-on-surface-variant">{t(a.category) || a.category}</span>
                          <span className={cn(
                            "text-xs font-bold",
                            a.score >= 8 ? "text-green-600" :
                            a.score >= 5 ? "text-amber-600" :
                            "text-red-600"
                          )}>
                            {a.score}/10
                          </span>
                        </div>
                      ))}
                    </div>
                    {assessment.notes && (
                      <div className="bg-background rounded-lg px-3 py-2">
                        <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                          {t('assessmentNotes') || 'Notas'}
                        </span>
                        <p className="text-sm text-on-surface mt-1">{assessment.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-on-surface-variant">
            <Star className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">{t('noAssessmentsYet') || 'Sem avaliações ainda.'}</p>
          </div>
        )}
      </div>
    </div>
  );
};
