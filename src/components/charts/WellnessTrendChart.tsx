import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Props {
  data: Array<{ date: string; sleep: number; stress: number; fatigue: number; soreness: number; mood: number; score: number }>;
  t: (key: string) => string;
}

const LINES = [
  { key: 'sleep', color: '#6366f1', labelKey: 'sleep' },
  { key: 'stress', color: '#f43f5e', labelKey: 'stress' },
  { key: 'fatigue', color: '#f59e0b', labelKey: 'fatigue' },
  { key: 'soreness', color: '#ec4899', labelKey: 'soreness' },
  { key: 'mood', color: '#10b981', labelKey: 'mood' },
] as const;

export const WellnessTrendChart: React.FC<Props> = ({ data, t }) => {
  if (data.length === 0) return <p className="text-sm text-on-surface-variant">{t('analyticsNoData')}</p>;

  return (
    <ResponsiveContainer width="100%" minWidth={0} height={220}>
      <LineChart data={data} margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
        <XAxis dataKey="date" tick={{ fill: '#a6adc8', fontSize: 11 }} />
        <YAxis domain={[1, 5]} tick={{ fill: '#a6adc8', fontSize: 11 }} />
        <Tooltip
          contentStyle={{ backgroundColor: '#1e1e2e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8 }}
          labelStyle={{ color: '#cdd6f4' }}
          itemStyle={{ color: '#cdd6f4' }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} formatter={(value: string) => t(value) || value} />
        {LINES.map(line => (
          <Line
            key={line.key}
            type="monotone"
            dataKey={line.key}
            name={line.labelKey}
            stroke={line.color}
            strokeWidth={2}
            dot={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};
