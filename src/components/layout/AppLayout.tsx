import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Video,
  Dumbbell as DumbbellIcon,
  Library,
  MoreHorizontal,
  HelpCircle,
  Globe,
  Heart,
  Activity,
  BookOpen,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTranslation } from '../../hooks/useTranslation';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface AppLayoutProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  activeTab,
  setActiveTab,
  isSidebarCollapsed,
  setIsSidebarCollapsed,
  children,
}) => {
  const { t, changeLanguage, isPortuguese } = useTranslation();
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setMoreMenuOpen(false);
      }
    };
    if (moreMenuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [moreMenuOpen]);

  return (
    <div className="flex min-h-screen bg-background text-on-surface selection:bg-primary selection:text-on-primary">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
      />

      <main className={cn(
        "flex-1 min-h-screen transition-all duration-300 ease-in-out",
        isSidebarCollapsed ? "md:ml-20" : "md:ml-64"
      )}>
        <Header />

        <div className="p-8 max-w-[1600px] mx-auto space-y-8 pb-24 md:pb-8">
          {children}
        </div>
      </main>

      {/* Mobile Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-surface/95 backdrop-blur-xl border-t border-white/[0.04] flex items-center justify-around h-16 z-50 px-2" role="navigation" aria-label="Mobile navigation">
        {[
          { id: 'Dashboard', icon: LayoutDashboard, labelKey: 'dashboard' as const },
          { id: 'Training', icon: DumbbellIcon, labelKey: 'sessions' as const },
          { id: 'Exercises', icon: Library, labelKey: 'exerciseLibrary' as const },
          { id: 'Goalkeepers', icon: Users, labelKey: 'athletes' as const },
          { id: 'Planning', icon: Calendar, labelKey: 'planning' as const },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => { setActiveTab(item.id); setMoreMenuOpen(false); }}
            aria-label={t(item.labelKey)}
            className={cn(
              "flex flex-col items-center gap-1 transition-colors",
              activeTab === item.id ? "text-primary" : "text-on-surface-variant"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-label">{t(item.labelKey)}</span>
          </button>
        ))}
        {/* More menu */}
        <div className="relative" ref={moreMenuRef}>
          <button
            onClick={() => setMoreMenuOpen(prev => !prev)}
            aria-label={t('more')}
            aria-expanded={moreMenuOpen}
            className={cn(
              "flex flex-col items-center gap-1 transition-colors",
              moreMenuOpen || ['Videos', 'Methodology', 'Support'].includes(activeTab) ? "text-primary" : "text-on-surface-variant"
            )}
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[10px] font-label">{t('more')}</span>
          </button>
          {moreMenuOpen && (
            <div className="absolute bottom-14 right-0 bg-surface-elevated border border-white/[0.06] rounded-xl shadow-xl py-2 min-w-[180px] z-50">
              <button
                onClick={() => { setActiveTab('Videos'); setMoreMenuOpen(false); }}
                className={cn(
                  "flex items-center gap-3 w-full px-4 py-2.5 text-sm font-label transition-colors",
                  activeTab === 'Videos' ? "text-accent bg-accent/10" : "text-on-surface-variant hover:bg-white/[0.04]"
                )}
              >
                <Video className="w-4 h-4" />
                {t('videos')}
              </button>
              <button
                onClick={() => { setActiveTab('Wellness'); setMoreMenuOpen(false); }}
                className={cn(
                  "flex items-center gap-3 w-full px-4 py-2.5 text-sm font-label transition-colors",
                  activeTab === 'Wellness' ? "text-accent bg-accent/10" : "text-on-surface-variant hover:bg-white/[0.04]"
                )}
              >
                <Heart className="w-4 h-4" />
                {t('wellnessTab')}
              </button>
              <button
                onClick={() => { setActiveTab('RPE'); setMoreMenuOpen(false); }}
                className={cn(
                  "flex items-center gap-3 w-full px-4 py-2.5 text-sm font-label transition-colors",
                  activeTab === 'RPE' ? "text-accent bg-accent/10" : "text-on-surface-variant hover:bg-white/[0.04]"
                )}
              >
                <Activity className="w-4 h-4" />
                {t('rpeTab')}
              </button>
              <button
                onClick={() => { setActiveTab('Methodology'); setMoreMenuOpen(false); }}
                className={cn(
                  "flex items-center gap-3 w-full px-4 py-2.5 text-sm font-label transition-colors",
                  activeTab === 'Methodology' ? "text-accent bg-accent/10" : "text-on-surface-variant hover:bg-white/[0.04]"
                )}
              >
                <BookOpen className="w-4 h-4" />
                {t('methodology')}
              </button>
              <button
                onClick={() => { setActiveTab('Support'); setMoreMenuOpen(false); }}
                className={cn(
                  "flex items-center gap-3 w-full px-4 py-2.5 text-sm font-label transition-colors",
                  activeTab === 'Support' ? "text-accent bg-accent/10" : "text-on-surface-variant hover:bg-white/[0.04]"
                )}
              >
                <HelpCircle className="w-4 h-4" />
                {t('support')}
              </button>
              <div className="border-t border-white/[0.04] my-1" />
              <button
                onClick={() => { changeLanguage(isPortuguese ? 'en' : 'pt'); setMoreMenuOpen(false); }}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-label text-on-surface-variant hover:bg-white/[0.04] transition-colors"
                aria-label={isPortuguese ? 'Switch to English' : 'Mudar para Portugues'}
              >
                <Globe className="w-4 h-4" />
                {isPortuguese ? 'English' : 'Portugues'}
              </button>
            </div>
          )}
        </div>
      </nav>

    </div>
  );
};
