import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useTranslation } from '../../hooks/useTranslation';
import { cn } from '../../lib/utils';
import type { Goalkeeper, WellnessLog } from '../../types';

interface AthleteWellnessProps {
  goalkeeper: Goalkeeper;
  wellnessLogs: WellnessLog[];
  onRefresh: () => void;
}

export const AthleteWellness: React.FC<AthleteWellnessProps> = ({ goalkeeper, wellnessLogs }) => {
  const { t } = useTranslation();

  // Prepare chart data (reverse to show oldest first)
  const chartData = [...wellnessLogs].reverse().map(log => ({
    date: log.date.slice(5), // MM-DD
    score: log.score,
    sleep: log.sleep,
    stress: log.stress,
    fatigue: log.fatigue,
    soreness: log.soreness,
    mood: log.mood,
  }));

  // Current wellness dimensions
  const latest = wellnessLogs.length > 0 ? wellnessLogs[0] : null;

  const dimensions = latest ? [
    { key: 'sleep', label: t('sleep') || 'Sono', value: latest.sleep, color: 'bg-blue-500' },
    { key: 'stress', label: t('stress') || 'Stresse', value: latest.stress, color: 'bg-red-500' },
    { key: 'fatigue', label: t('fatigue') || 'Fadiga', value: latest.fatigue, color: 'bg-orange-500' },
    { key: 'soreness', label: t('soreness') || 'Dor', value: latest.soreness, color: 'bg-yellow-500' },
    { key: 'mood', label: t('mood') || 'Humor', value: latest.mood, color: 'bg-green-500' },
  ] : [];

  return (
    <div className="space-y-5">
      {/* Current wellness */}
      {latest && (
        <div className="bg-surface rounded-xl border border-black/[0.08] overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 bg-black/[0.02] border-b border-black/[0.06]">
            <div className="w-1 h-5 rounded-full bg-pink-500" />
            <span className="text-[10px] font-bold text-on-surface uppercase tracking-wider">{t('currentWellness') || 'Bem-estar Atual'} — {latest.date}</span>
            <span className={cn(
              "ml-auto text-sm font-bold px-2 py-0.5 rounded",
              latest.score >= 3.5 ? "bg-success/10 text-success" : latest.score >= 2.5 ? "bg-warning/10 text-warning" : "bg-error/10 text-error"
            )}>
              {latest.score.toFixed(1)}/5
            </span>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-5 gap-3">
              {dimensions.map(dim => (
                <div key={dim.key} className="text-center">
                  <div className="text-2xl font-bold text-on-surface">{dim.value}</div>
                  <div className="h-1.5 bg-background rounded-full mt-1.5 overflow-hidden">
                    <div className={cn("h-full rounded-full", dim.color)} style={{ width: `${(dim.value / 5) * 100}%` }} />
                  </div>
                  <p className="text-[10px] text-on-surface-variant font-medium mt-1">{dim.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Trend chart */}
      <div className="bg-surface rounded-xl border border-black/[0.08] overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 bg-black/[0.02] border-b border-black/[0.06]">
          <div className="w-1 h-5 rounded-full bg-indigo-500" />
          <span className="text-[10px] font-bold text-on-surface uppercase tracking-wider">{t('wellnessTrend') || 'Tendência de Bem-estar'} ({chartData.length} {t('days') || 'dias'})</span>
        </div>
        <div className="p-5">
          {chartData.length > 1 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="rgba(0,0,0,0.3)" />
                <YAxis domain={[0, 5]} tick={{ fontSize: 10 }} stroke="rgba(0,0,0,0.3)" />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid rgba(0,0,0,0.1)' }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Line type="monotone" dataKey="score" name={t('overallScore') || 'Score'} stroke="#4338ca" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="sleep" name={t('sleep') || 'Sono'} stroke="#3b82f6" strokeWidth={1} dot={false} strokeDasharray="4 4" />
                <Line type="monotone" dataKey="fatigue" name={t('fatigue') || 'Fadiga'} stroke="#f97316" strokeWidth={1} dot={false} strokeDasharray="4 4" />
                <Line type="monotone" dataKey="mood" name={t('mood') || 'Humor'} stroke="#22c55e" strokeWidth={1} dot={false} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-on-surface-variant">
              <p className="text-sm font-medium">{t('insufficientData') || 'Dados insuficientes para mostrar tendência'}</p>
              <p className="text-xs mt-1">{t('needMoreWellnessLogs') || 'Registe pelo menos 2 dias de bem-estar'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
