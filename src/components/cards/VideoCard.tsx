import { Play } from 'lucide-react';
import { videoStatusBadgeClass } from '../../lib/utils';
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
    <div className="glass-card rounded-[2rem] overflow-hidden border-primary/50 group cursor-pointer transition-all duration-500 hover:border-primary">
      <div className="aspect-video relative overflow-hidden m-2 rounded-[1.5rem]">
        <img
          src={video.imageUrl}
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/60 transition-colors flex items-center justify-center">
          <div className="w-14 h-14 bg-primary/95 text-white rounded-2xl flex items-center justify-center shadow-2xl scale-75 group-hover:scale-100 transition-all duration-500 backdrop-blur-sm">
            <Play className="w-7 h-7 fill-current ml-1" />
          </div>
        </div>
        <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black tracking-widest text-white border border-white/10">
          {video.duration}
        </div>
      </div>
      
      <div className="p-6">
        <h5 className="font-bold text-sm mb-1 text-on-surface tracking-tight group-hover:text-primary transition-colors">{video.title}</h5>
        <p className="text-[10px] text-on-surface-variant/60 font-bold tracking-wide">{video.subtitle}</p>
        <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
          <span className={videoStatusBadgeClass(video.status).replace('text-[10px] px-2 py-0.5 rounded', 'text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border border-white/5')}>
            {statusLabels[video.status] || video.status}
          </span>
          <span className="text-[9px] font-black text-primary/40 group-hover:text-primary transition-colors uppercase tracking-[0.2em]">Play View</span>
        </div>
      </div>
    </div>
  );
};
