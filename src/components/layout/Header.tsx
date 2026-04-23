import React, { useState, useEffect } from 'react';
import { Search, Bell, Settings, Sun, Moon } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { useAuth } from '../../hooks/useAuth';

export const Header: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('gklab-theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark-mode');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark-mode');
    }
  }, []);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark-mode');
      localStorage.setItem('gklab-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark-mode');
      localStorage.setItem('gklab-theme', 'light');
    }
  };

  const displayName = user?.email?.split('@')[0] || 'Coach';
  const displayEmail = user?.email || '';

  return (
    <header className="flex items-center justify-between px-8 h-16 bg-surface/80 backdrop-blur-xl border-b border-white/[0.04] sticky top-0 z-40 transition-all duration-300">
      {/* Left: Search */}
      <div className="flex items-center gap-4 flex-1">
        <div className="hidden lg:flex items-center bg-white/[0.04] px-4 py-2.5 rounded-xl border border-white/[0.06] focus-within:border-accent/30 focus-within:bg-white/[0.06] transition-all w-72">
          <Search className="text-on-surface-variant w-4 h-4 mr-3 flex-shrink-0" />
          <input
            type="text"
            placeholder={t('searchDataPoints')}
            className="bg-transparent border-none text-sm focus:ring-0 text-on-surface w-full placeholder:text-on-surface-variant/50 outline-none"
          />
        </div>
      </div>

      {/* Right: Actions + Profile */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/[0.06]">
          <button
            onClick={toggleTheme}
            aria-label={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-white/[0.06] transition-all rounded-lg group"
          >
            {isDarkMode ? (
              <Sun className="w-4.5 h-4.5 group-hover:rotate-45 transition-transform" />
            ) : (
              <Moon className="w-4.5 h-4.5 group-hover:-rotate-12 transition-transform" />
            )}
          </button>
          <button aria-label={t('notifications')} className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-white/[0.06] transition-all rounded-lg relative group">
            <Bell className="w-4.5 h-4.5 group-hover:rotate-12 transition-transform" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full border-2 border-surface" />
          </button>
          <button aria-label={t('settings')} className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-white/[0.06] transition-all rounded-lg group">
            <Settings className="w-4.5 h-4.5 group-hover:rotate-45 transition-transform" />
          </button>
        </div>

        {/* User profile */}
        <div className="flex items-center gap-3 pl-3 ml-1 border-l border-white/[0.06]">
          <div className="flex flex-col items-end">
            <span className="text-sm font-semibold text-on-surface capitalize">{displayName}</span>
            <span className="text-[10px] text-on-surface-variant">{displayEmail}</span>
          </div>
          <div className="h-9 w-9 rounded-full overflow-hidden border-2 border-accent/30 shadow-[0_0_12px_rgba(124,92,252,0.15)] cursor-pointer hover:scale-105 transition-transform">
            <div className="w-full h-full bg-accent/20 flex items-center justify-center">
              <span className="text-accent font-bold text-sm">{displayName.charAt(0).toUpperCase()}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
