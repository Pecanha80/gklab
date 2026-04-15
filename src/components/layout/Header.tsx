import React from 'react';
import { Search, Bell, Settings } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

export const Header: React.FC = () => {
  const { t } = useTranslation();

  return (
    <header className="flex items-center justify-between px-8 h-16 bg-surface-container-low/50 backdrop-blur-md border-b border-black/5 sticky top-0 z-40">
      <div className="flex items-center gap-6">
        <h2 className="text-lg font-bold text-on-surface font-headline tracking-tight">{t('tacticalHUD')}</h2>
        <div className="hidden lg:flex items-center bg-surface-container-lowest px-4 py-1.5 rounded-lg border border-black/5">
          <Search className="text-on-surface-variant w-4 h-4 mr-2" />
          <input
            type="text"
            placeholder={t('searchDataPoints')}
            className="bg-transparent border-none text-xs focus:ring-0 text-on-surface w-48 font-label placeholder:text-on-surface-variant/50"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button aria-label={t('notifications' as any)} className="p-2 text-on-surface-variant hover:bg-surface-container-high transition-colors rounded-lg relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-surface-container-low" />
        </button>
        <button aria-label={t('settings' as any)} className="p-2 text-on-surface-variant hover:bg-surface-container-high transition-colors rounded-lg">
          <Settings className="w-5 h-5" />
        </button>
        <div className="h-8 w-8 rounded-full overflow-hidden border border-primary/20 ml-2 cursor-pointer hover:scale-110 transition-transform">
          <img
            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=256&h=256&auto=format&fit=crop"
            alt="Coach"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    </header>
  );
};
