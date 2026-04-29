import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Activity, TrendingUp, Award } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '../../lib/utils';
import { useTranslation } from '../../hooks/useTranslation';
import { usePhysicalTests } from '../../hooks/usePhysicalTests';
import { getTodayDateString, parseDate } from '../../lib/utils';
import type { Goalkeeper } from '../../types';
import type { PhysicalTest } from '../../types/physicalTest';

interface AthletePhysicalTestsProps {
  goalkeeper: Goalkeeper;
}

const TEST_TYPES = [
  'verticalJump',
  'sprint5m',
  'sprint10m',
  'sprint20m',
  'agility',
  'flexibility',
  'gripStrength',
  'reactionTime',
] as const;

type TestType = (typeof TEST_TYPES)[number];

const TEST_UNITS: Record<string, string> = {
  verticalJump: 'cm',
  sprint5m: 's',
  sprint10m: 's',
  sprint20m: 's',
  agility: 's',
  flexibility: 'cm',
  gripStrength: 'kg',
  reactionTime: 'ms',
};

/** For sprint/agility/reaction, lower is better. For the rest, higher is better. */
const LOWER_IS_BETTER: Record<string, boolean> = {
  verticalJump: false,
  sprint5m: true,
  sprint10m: true,
  sprint20m: true,
  agility: true,
  flexibility: false,
  gripStrength: false,
  reactionTime: true,
};

const TEST_COLORS: Record<string, string> = {
  verticalJump: '#3b82f6',
  sprint5m: '#ef4444',
  sprint10m: '#f97316',
  sprint20m: '#f59e0b',
  agility: '#10b981',
  flexibility: '#8b5cf6',
  gripStrength: '#06b6d4',
  reactionTime: '#ec4899',
};

export const AthletePhysicalTests: React.FC<AthletePhysicalTestsProps> = ({ goalkeeper }) => {
  const { t } = useTranslation();
  const { tests, loading, fetchTests, addTest, deleteTest } = usePhysicalTests();

  const [isAdding, setIsAdding] = useState(false);
  const [formTestType, setFormTestType] = useState<TestType>('verticalJump');
  const [formValue, setFormValue] = useState('');
  const [formDate, setFormDate] = useState(getTodayDateString());
  const [formNotes, setFormNotes] = useState('');

  useEffect(() => {
    fetchTests(goalkeeper.id);
  }, [goalkeeper.id, fetchTests]);

  // Group tests by type
  const grouped = useMemo(() => {
    const map = new Map<string, PhysicalTest[]>();
    tests.forEach(test => {
      const arr = map.get(test.testType) || [];
      arr.push(test);
      map.set(test.testType, arr);
    });
    return map;
  }, [tests]);

  const handleSubmit = async () => {
    const val = parseFloat(formValue);
    if (isNaN(val)) return;
    await addTest({
      goalkeeper_id: goalkeeper.id,
      date: formDate,
      testType: formTestType,
      value: val,
      unit: TEST_UNITS[formTestType],
      notes: formNotes.trim() || undefined,
    });
    setFormValue('');
    setFormNotes('');
    setIsAdding(false);
  };

  const handleDelete = (testId: string) => {
    if (window.confirm(t('deleteTestConfirm') || 'Tem a certeza que quer apagar este teste?')) {
      deleteTest(testId);
    }
  };

  const getTestLabel = (type: string): string => {
    return t(type) || type;
  };

  const getBestValue = (items: PhysicalTest[], type: string): number => {
    const values = items.map(i => i.value);
    return LOWER_IS_BETTER[type] ? Math.min(...values) : Math.max(...values);
  };

  return (
    <div className="space-y-5">
      {/* A) Add Test Form */}
      {!isAdding ? (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full bg-surface rounded-xl border border-dashed border-black/[0.12] p-4 flex items-center justify-center gap-2 text-on-surface-variant hover:border-accent hover:text-accent transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm font-semibold">{t('addPhysicalTest') || 'Registar Teste'}</span>
        </button>
      ) : (
        <div className="bg-surface rounded-xl border border-black/[0.08] overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 bg-black/[0.02] border-b border-black/[0.06]">
            <div className="w-1 h-5 rounded-full bg-accent" />
            <span className="text-[10px] font-bold text-on-surface uppercase tracking-wider">
              {t('addPhysicalTest') || 'Registar Teste'}
            </span>
          </div>
          <div className="p-5 space-y-3">
            {/* Test type selector */}
            <div>
              <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">
                {t('testType') || 'Tipo de Teste'}
              </label>
              <select
                value={formTestType}
                onChange={e => setFormTestType(e.target.value as TestType)}
                className="w-full bg-background border border-black/[0.1] rounded-lg px-3 py-2.5 text-sm focus:border-accent outline-none"
              >
                {TEST_TYPES.map(type => (
                  <option key={type} value={type}>
                    {getTestLabel(type)}
                  </option>
                ))}
              </select>
            </div>

            {/* Value + Unit */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">
                  {t('value') || 'Valor'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    value={formValue}
                    onChange={e => setFormValue(e.target.value)}
                    placeholder="0"
                    className="w-full bg-background border border-black/[0.1] rounded-lg px-3 py-2.5 text-sm focus:border-accent outline-none pr-12"
                    autoFocus
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-on-surface-variant font-medium">
                    {TEST_UNITS[formTestType]}
                  </span>
                </div>
              </div>
              <div className="w-40">
                <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">
                  {t('date') || 'Data'}
                </label>
                <input
                  type="date"
                  value={formDate}
                  onChange={e => setFormDate(e.target.value)}
                  className="w-full bg-background border border-black/[0.1] rounded-lg px-3 py-2.5 text-sm focus:border-accent outline-none"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">
                {t('notes') || 'Notas'} ({t('optional') || 'opcional'})
              </label>
              <textarea
                value={formNotes}
                onChange={e => setFormNotes(e.target.value)}
                placeholder={t('testNotesPlaceholder') || 'Observações sobre o teste...'}
                className="w-full bg-background border border-black/[0.1] rounded-lg px-3 py-2.5 text-sm min-h-[60px] resize-none focus:border-accent outline-none"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setIsAdding(false); setFormValue(''); setFormNotes(''); }}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-on-surface-variant hover:bg-black/[0.03] transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleSubmit}
                disabled={!formValue || isNaN(parseFloat(formValue))}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-accent text-white disabled:opacity-40 hover:brightness-110 transition-all"
              >
                {t('save') || 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* B) Results by Test Type */}
      {grouped.size > 0 && (
        <div className="space-y-4">
          {Array.from(grouped.entries()).map(([type, items]) => {
            const sorted = [...items].sort((a, b) => a.date.localeCompare(b.date));
            const latest = items[0]; // items already sorted DESC from hook
            const best = getBestValue(items, type);
            const chartData = sorted.map(item => ({
              date: parseDate(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
              value: item.value,
            }));
            const color = TEST_COLORS[type] || '#6366f1';

            return (
              <div key={type} className="bg-surface rounded-xl border border-black/[0.08] overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3 bg-black/[0.02] border-b border-black/[0.06]">
                  <div className="w-1 h-5 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-[10px] font-bold text-on-surface uppercase tracking-wider">
                    {getTestLabel(type)}
                  </span>
                  <span className="text-[10px] text-on-surface-variant ml-1">({items.length})</span>
                </div>
                <div className="p-5">
                  {/* Stats row */}
                  <div className="flex gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-accent/10">
                        <TrendingUp className="w-3.5 h-3.5 text-accent" />
                      </div>
                      <div>
                        <div className="text-[10px] text-on-surface-variant font-medium uppercase">
                          {t('latest') || 'Último'}
                        </div>
                        <div className="text-sm font-bold text-on-surface">
                          {latest.value} {latest.unit}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-amber-500/10">
                        <Award className="w-3.5 h-3.5 text-amber-600" />
                      </div>
                      <div>
                        <div className="text-[10px] text-on-surface-variant font-medium uppercase">
                          {t('best') || 'Melhor'}
                        </div>
                        <div className="text-sm font-bold text-on-surface">
                          {best} {TEST_UNITS[type]}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Chart */}
                  {chartData.length >= 2 && (
                    <div className="h-40">
                      <ResponsiveContainer width="100%" minWidth={0} height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                          <XAxis
                            dataKey="date"
                            tick={{ fontSize: 10, fill: 'var(--color-on-surface-variant)' }}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            tick={{ fontSize: 10, fill: 'var(--color-on-surface-variant)' }}
                            tickLine={false}
                            axisLine={false}
                            domain={['auto', 'auto']}
                          />
                          <Tooltip
                            contentStyle={{
                              fontSize: 12,
                              borderRadius: 8,
                              border: '1px solid rgba(0,0,0,0.08)',
                            }}
                            formatter={(val) => [`${val} ${TEST_UNITS[type]}`, getTestLabel(type)]}
                          />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke={color}
                            strokeWidth={2}
                            dot={{ r: 3, fill: color }}
                            activeDot={{ r: 5 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* C) Recent Tests Table */}
      <div className="bg-surface rounded-xl border border-black/[0.08] overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 bg-black/[0.02] border-b border-black/[0.06]">
          <div className="w-1 h-5 rounded-full bg-emerald-500" />
          <span className="text-[10px] font-bold text-on-surface uppercase tracking-wider">
            {t('recentTests') || 'Testes Recentes'} ({tests.length})
          </span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-on-surface-variant">
            <p className="text-sm">{t('loading') || 'A carregar...'}</p>
          </div>
        ) : tests.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/[0.06]">
                  <th className="text-left px-5 py-2.5 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                    {t('date') || 'Data'}
                  </th>
                  <th className="text-left px-5 py-2.5 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                    {t('testType') || 'Tipo'}
                  </th>
                  <th className="text-right px-5 py-2.5 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                    {t('value') || 'Valor'}
                  </th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04]">
                {tests.map(test => (
                  <tr key={test.id} className="hover:bg-black/[0.01] transition-colors">
                    <td className="px-5 py-3 text-on-surface-variant">
                      {parseDate(test.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${TEST_COLORS[test.testType] || '#6366f1'}15`,
                          color: TEST_COLORS[test.testType] || '#6366f1',
                        }}
                      >
                        {getTestLabel(test.testType)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-mono font-semibold text-on-surface">
                      {test.value} <span className="text-on-surface-variant font-normal">{test.unit}</span>
                    </td>
                    <td className="px-3 py-3">
                      <button
                        onClick={() => handleDelete(test.id)}
                        className="p-1.5 rounded-lg text-on-surface-variant/30 hover:text-error hover:bg-error/5 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-on-surface-variant">
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">{t('noPhysicalTests') || 'Sem testes registados.'}</p>
          </div>
        )}
      </div>
    </div>
  );
};
