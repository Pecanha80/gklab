import React, { useState, useEffect } from 'react';
import { Search, Bell, Settings, Sun, Moon } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

export const Header: React.FC = () => {
  const { t } = useTranslation();
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    const savedTheme = localStorage.getItem('gklab-theme');
    if (savedTheme === 'light') {
      setIsDarkMode(false);
      document.documentElement.classList.add('light-mode');
    } else {
      setIsDarkMode(true);
      document.documentElement.classList.remove('light-mode');
    }
  }, []);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (!newMode) {
      document.documentElement.classList.add('light-mode');
      localStorage.setItem('gklab-theme', 'light');
    } else {
      document.documentElement.classList.remove('light-mode');
      localStorage.setItem('gklab-theme', 'dark');
    }
  };

  return (
    <header className="flex items-center justify-between px-8 h-20 bg-background/50 backdrop-blur-xl border-b border-primary/20 sticky top-0 z-40 transition-all duration-300">
      <div className="flex items-center gap-8">
        <div>
          <h2 className="text-lg font-bold text-on-surface tracking-tight">{t('tacticalHUD')}</h2>
          <p className="text-[10px] text-primary font-black uppercase tracking-[0.2em]">{t('commandCenter')}</p>
        </div>
        
        <div className="hidden lg:flex items-center bg-white/5 px-4 py-2 rounded-xl border border-primary/30 focus-within:border-primary transition-all">
          <Search className="text-on-surface-variant w-4 h-4 mr-3" />
          <input
            type="text"
            placeholder={t('searchDataPoints')}
            className="bg-transparent border-none text-xs focus:ring-0 text-on-surface w-64 placeholder:text-on-surface-variant/40"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-primary/30">
          <button 
            onClick={toggleTheme}
            aria-label={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-white/10 transition-all rounded-lg group"
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5 group-hover:rotate-45 transition-transform" />
            ) : (
              <Moon className="w-5 h-5 group-hover:-rotate-12 transition-transform" />
            )}
          </button>
          <div className="w-[1px] h-4 bg-primary/20 mx-1" />
          <button aria-label={t('notifications' as any)} className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-white/10 transition-all rounded-lg relative group">
            <Bell className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-background" />
          </button>
          <button aria-label={t('settings' as any)} className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-white/10 transition-all rounded-lg group">
            <Settings className="w-5 h-5 group-hover:rotate-45 transition-transform" />
          </button>
        </div>
        
        <div className="flex items-center gap-3 pl-4 border-l border-primary/20 ml-2">
          <div className="flex flex-col items-end">
            <span className="text-xs font-bold text-on-surface">Pro Coach</span>
            <span className="text-[10px] text-on-surface-variant">UEFA A Candidate</span>
          </div>
          <div className="h-10 w-10 rounded-xl overflow-hidden border-2 border-primary/40 shadow-lg cursor-pointer hover:scale-105 transition-transform">
            <img
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=256&h=256&auto=format&fit=crop"
              alt="Coach"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </div>
    </header>
  );
};
