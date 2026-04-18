import React, { useState } from 'react';
import { Plus, X, Trash2, Play, Search, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, videoStatusBadgeClass } from '../../lib/utils';
import { PerformanceVideo } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';

interface VideosTabProps {
  videos: PerformanceVideo[];
  addVideo: (v: Omit<PerformanceVideo, 'id'>) => Promise<void>;
  deleteVideo: (id: string) => Promise<void>;
}

const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?q=80&w=800&auto=format&fit=crop'; // Generic field placeholder

const STATUS_OPTIONS: PerformanceVideo['status'][] = ['Analysis Ready', 'Uncut', 'Edited'];

const FILTER_OPTIONS = ['All', ...STATUS_OPTIONS] as const;


export const VideosTab: React.FC<VideosTabProps> = ({ videos, addVideo, deleteVideo }) => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<(typeof FILTER_OPTIONS)[number]>('All');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    duration: '',
    imageUrl: '',
    status: 'Uncut' as PerformanceVideo['status'],
  });
  const [submitting, setSubmitting] = useState(false);

  const statusLabels: Record<string, string> = {
    'All': t('all'),
    'Analysis Ready': t('analysisReady'),
    'Uncut': t('uncut'),
    'Edited': t('edited'),
  };

  React.useEffect(() => {
    if (!showModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowModal(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showModal]);

  const filtered = filter === 'All' ? videos : videos.filter((v) => v.status === filter);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    setSubmitting(true);
    try {
      await addVideo({
        title: formData.title.trim(),
        subtitle: formData.subtitle.trim(),
        duration: formData.duration.trim() || '0:00',
        imageUrl: formData.imageUrl.trim() || DEFAULT_IMAGE,
        status: formData.status,
      });
      setFormData({ title: '', subtitle: '', duration: '', imageUrl: '', status: 'Uncut' });
      setShowModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="font-headline text-xl text-on-surface font-bold">{t('videoAnalysis')}</h2>

        <div className="flex items-center gap-2 flex-wrap">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={() => setFilter(opt)}
              className={cn(
                'px-3 py-1.5 rounded-full text-[10px] font-label font-bold uppercase tracking-wider transition-colors',
                filter === opt
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-highest text-on-surface-variant hover:bg-primary/10 hover:text-primary',
              )}
            >
              {statusLabels[opt]}
            </button>
          ))}

          <button
            onClick={() => setShowModal(true)}
            className="ml-2 flex items-center gap-1.5 bg-primary text-on-primary px-4 py-1.5 rounded-full text-[10px] font-label font-bold uppercase tracking-wider hover:bg-primary-dim transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            {t('addVideo')}
          </button>
        </div>
      </div>

      {/* Video Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Search className="w-10 h-10 text-on-surface-variant/30 mb-3" />
          <p className="text-sm text-on-surface-variant font-label">
            {filter === 'All'
              ? t('noVideosYet')
              : `${t('noVideosWithStatus')} "${statusLabels[filter]}" ${t('found')}`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((video) => (
              <motion.div
                key={video.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="bg-surface-container rounded-xl overflow-hidden border border-black/5 group cursor-pointer"
              >
                {/* Thumbnail */}
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

                  {/* Duration badge */}
                  <div className="absolute bottom-2 right-2 bg-white/90 px-1.5 py-0.5 rounded text-[10px] font-label text-on-surface flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {video.duration}
                  </div>

                  {/* Delete button on hover */}
                  <button
                    aria-label={t('delete' as any)}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(t('confirmDeleteVideo' as any))) deleteVideo(video.id);
                    }}
                    className="absolute top-2 right-2 w-7 h-7 bg-error/90 text-on-primary rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-error"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h5 className="font-bold text-sm mb-1 text-on-surface">{video.title}</h5>
                  <p className="text-[10px] text-on-surface-variant font-label">
                    {video.subtitle}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <span className={videoStatusBadgeClass(video.status)}>{statusLabels[video.status]}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add Video Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[80]"
              onClick={() => setShowModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-0 z-[90] flex items-center justify-center p-4 pointer-events-none"
            >
              <div role="dialog" aria-modal="true" aria-label={t('addVideo')} className="bg-surface-container rounded-2xl shadow-2xl border border-black/10 w-full max-w-md pointer-events-auto">
                {/* Modal header */}
                <div className="flex items-center justify-between p-5 border-b border-black/5">
                  <h3 className="font-headline text-base text-on-surface font-bold">
                    {t('addVideo')}
                  </h3>
                  <button
                    aria-label={t('close')}
                    onClick={() => setShowModal(false)}
                    className="w-7 h-7 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Modal body */}
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                  <div>
                    <label className="block text-[10px] font-label font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      {t('title')}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder={t('matchPlaceholder')}
                      className="w-full bg-surface-container-highest border border-black/5 rounded-lg px-3 py-2 text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-label font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      {t('subtitle')}
                    </label>
                    <input
                      type="text"
                      value={formData.subtitle}
                      onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                      placeholder={t('leaguePlaceholder')}
                      className="w-full bg-surface-container-highest border border-black/5 rounded-lg px-3 py-2 text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-label font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                        {t('duration')}
                      </label>
                      <input
                        type="text"
                        value={formData.duration}
                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                        placeholder="12:34"
                        className="w-full bg-surface-container-highest border border-black/5 rounded-lg px-3 py-2 text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-label font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                        {t('status')}
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            status: e.target.value as PerformanceVideo['status'],
                          })
                        }
                        className="w-full bg-surface-container-highest border border-black/5 rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {statusLabels[s]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-label font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      {t('imageUrl')}
                    </label>
                    <input
                      type="text"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      placeholder={DEFAULT_IMAGE}
                      className="w-full bg-surface-container-highest border border-black/5 rounded-lg px-3 py-2 text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <p className="text-[9px] text-on-surface-variant mt-1">
                      {t('leaveBlankDefault')}
                    </p>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 rounded-full text-[10px] font-label font-bold uppercase tracking-wider text-on-surface-variant hover:text-on-surface transition-colors"
                    >
                      {t('cancel')}
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex items-center gap-1.5 bg-primary text-on-primary px-5 py-2 rounded-full text-[10px] font-label font-bold uppercase tracking-wider hover:bg-primary-dim transition-colors disabled:opacity-50"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {submitting ? t('adding') : t('addVideo')}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
