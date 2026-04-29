import React from 'react';

const INTENSITY_COLORS: Record<string, string> = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#ef4444',
};

interface Props {
  data: Array<{ intensity: string; count: number; percentage: number }>;
  t: (key: string) => string;
}

export const IntensityDistributionChart: React.FC<Props> = ({ data, t }) => {
  if (data.length === 0) return <p className="text-sm text-on-surface-variant">{t('analyticsNoData')}</p>;

  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="space-y-4">
      {/* Stacked bar */}
      <div className="flex h-8 rounded-lg overflow-hidden">
        {data.map(d => (
          <div
            key={d.intensity}
            className="flex items-center justify-center text-[10px] font-bold text-white transition-all"
            style={{
              width: `${d.percentage}%`,
              backgroundColor: INTENSITY_COLORS[d.intensity] || '#6366f1',
              minWidth: d.percentage > 0 ? '24px' : '0',
            }}
          >
            {d.percentage > 8 ? `${d.percentage}%` : ''}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4">
        {data.map(d => (
          <div key={d.intensity} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: INTENSITY_COLORS[d.intensity] || '#6366f1' }}
            />
            <span className="text-xs text-on-surface-variant">
              {t(d.intensity) || d.intensity}: {d.count} ({d.percentage}%)
            </span>
          </div>
        ))}
      </div>

      {/* Total */}
      <p className="text-xs text-on-surface-variant">
        {t('totalExercisesLabel') || 'Total'}: {total}
      </p>
    </div>
  );
};
