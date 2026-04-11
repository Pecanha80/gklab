import { Play } from 'lucide-react';
import { cn } from '../../lib/utils';
import { PerformanceVideo } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';

export const VideoCard = ({ video }: { video: PerformanceVideo }) => {
  const { t } = useTranslation();

  const statusLabels: Record<string, string> = {
    'Analysis Ready': t('analysisReady'),
    'Uncut': t('uncut'),
    'Edited': t('edited'),
  };

  return (
    <div className="bg-surface-container rounded-xl overflow-hidden border border-black/5 group cursor-pointer">
      <div className="aspect-video relative overflow-hidden">
        <img
          src={video.imageUrl}
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-black/5 group-hover:bg-black/40 transition-colors flex items-center justify-center">
          <div className="w-12 h-12 bg-primary/90 text-on-primary rounded-full flex items-center justify-center ring-4 ring-primary/20 scale-90 group-hover:scale-100 transition-transform">
            <Play className="w-6 h-6 fill-current" />
          </div>
        </div>
        <div className="absolute bottom-2 right-2 bg-white/90 px-1.5 py-0.5 rounded text-[10px] font-label text-on-surface">
          {video.duration}
        </div>
      </div>
      <div className="p-4">
        <h5 className="font-bold text-sm mb-1 text-on-surface">{video.title}</h5>
        <p className="text-[10px] text-on-surface-variant font-label">{video.subtitle}</p>
        <div className="mt-3 flex gap-2">
          <span className={cn(
            "text-[9px] px-2 py-0.5 rounded uppercase font-bold",
            video.status === 'Analysis Ready' ? "bg-tertiary/10 text-tertiary" :
            video.status === 'Uncut' ? "bg-surface-container-highest text-on-surface-variant" :
            "bg-secondary/10 text-secondary"
          )}>
            {statusLabels[video.status] || video.status}
          </span>
        </div>
      </div>
    </div>
  );
};
