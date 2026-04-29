import React from 'react';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Video,
  HelpCircle,
  LogOut,
  ChevronRight,
  ChevronLeft,
  Library,
  Globe,
  Dumbbell as DumbbellIcon,
  Heart,
  Activity,
  BookOpen,
  BarChart3,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTranslation } from '../../hooks/useTranslation';
import { useAuth } from '../../hooks/useAuth';
import { SidebarItem } from '../ui/SidebarItem';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isSidebarCollapsed,
  setIsSidebarCollapsed,
}) => {
  const { t, changeLanguage, isPortuguese } = useTranslation();
  const { signOut } = useAuth();

  return (
    <aside className={cn(
      "hidden md:flex flex-col fixed left-0 top-0 h-full z-50 transition-all duration-300 ease-in-out font-body",
      "bg-surface border-r border-white/[0.04]",
      isSidebarCollapsed ? "w-20" : "w-64"
    )}>
      {/* Logo */}
      <div className={cn("sidebar-logo flex items-center shrink-0", isSidebarCollapsed ? "px-0 justify-center" : "px-7 justify-between")}>
        {!isSidebarCollapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center shadow-[0_0_16px_rgba(124,92,252,0.2)]">
              <span className="text-white font-black text-sm">GK</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-on-surface tracking-tighter leading-none">GKLAB</h1>
              <p className="text-[8px] uppercase tracking-[0.2em] text-accent font-bold mt-0.5">PRO HUB</p>
            </div>
          </div>
        ) : (
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shadow-[0_0_16px_rgba(124,92,252,0.2)]">
            <span className="text-white font-black text-lg">G</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 min-h-0 overflow-y-auto space-y-0.5 px-3 sidebar-nav-scroll">
        <SidebarItem icon={LayoutDashboard} labelKey="dashboard" active={activeTab === 'Dashboard'} onClick={() => setActiveTab('Dashboard')} isCollapsed={isSidebarCollapsed} t={t} />
        <SidebarItem icon={DumbbellIcon} labelKey="sessions" active={activeTab === 'Training'} onClick={() => setActiveTab('Training')} isCollapsed={isSidebarCollapsed} t={t} />
        <SidebarItem icon={Library} labelKey="exerciseLibrary" active={activeTab === 'Exercises'} onClick={() => setActiveTab('Exercises')} isCollapsed={isSidebarCollapsed} t={t} />
        <SidebarItem icon={Users} labelKey="athletes" active={activeTab === 'Goalkeepers'} onClick={() => setActiveTab('Goalkeepers')} isCollapsed={isSidebarCollapsed} t={t} />

        {!isSidebarCollapsed && (
          <p className="sidebar-section-label px-4 text-[9px] font-bold uppercase tracking-[0.15em] text-on-surface-variant/50">
            {t('monitoring')}
          </p>
        )}
        {isSidebarCollapsed && <div className="sidebar-section-spacer" />}
        <SidebarItem icon={Heart} labelKey="wellnessTab" active={activeTab === 'Wellness'} onClick={() => setActiveTab('Wellness')} isCollapsed={isSidebarCollapsed} t={t} />
        <SidebarItem icon={Activity} labelKey="rpeTab" active={activeTab === 'RPE'} onClick={() => setActiveTab('RPE')} isCollapsed={isSidebarCollapsed} t={t} />
        <SidebarItem icon={BarChart3} labelKey="analyticsTab" active={activeTab === 'Analytics'} onClick={() => setActiveTab('Analytics')} isCollapsed={isSidebarCollapsed} t={t} />

        {!isSidebarCollapsed && (
          <p className="sidebar-section-label px-4 text-[9px] font-bold uppercase tracking-[0.15em] text-on-surface-variant/50">
            STRATEGY
          </p>
        )}
        {isSidebarCollapsed && <div className="sidebar-section-spacer" />}
        <SidebarItem icon={Calendar} labelKey="planning" active={activeTab === 'Planning'} onClick={() => setActiveTab('Planning')} isCollapsed={isSidebarCollapsed} t={t} />
        <SidebarItem icon={BookOpen} labelKey="methodology" active={activeTab === 'Methodology'} onClick={() => setActiveTab('Methodology')} isCollapsed={isSidebarCollapsed} t={t} />
        <SidebarItem icon={Video} labelKey="videos" active={activeTab === 'Videos'} onClick={() => setActiveTab('Videos')} isCollapsed={isSidebarCollapsed} t={t} />
      </nav>

      {/* Footer actions */}
      <div className="sidebar-footer mt-auto border-t border-white/[0.04] space-y-0.5 px-3 shrink-0">
        <button
          onClick={() => changeLanguage(isPortuguese ? 'en' : 'pt')}
          className={cn(
            "sidebar-item w-full",
            isSidebarCollapsed ? "justify-center px-0" : "px-4"
          )}
          title={isPortuguese ? "Switch to English" : "Mudar para Portugues"}
        >
          <Globe className="w-5 h-5" />
          {!isSidebarCollapsed && <span className="text-xs font-semibold">{isPortuguese ? 'EN' : 'PT'}</span>}
        </button>
        <SidebarItem icon={HelpCircle} labelKey="support" active={activeTab === 'Support'} onClick={() => setActiveTab('Support')} isCollapsed={isSidebarCollapsed} t={t} />
        <button
          onClick={() => signOut()}
          className={cn(
            "sidebar-item w-full text-error hover:text-error hover:bg-error/10",
            isSidebarCollapsed ? "justify-center px-0" : "px-4"
          )}
        >
          <LogOut className="w-5 h-5" />
          {!isSidebarCollapsed && <span className="text-xs font-semibold">{t('logout')}</span>}
        </button>

        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className={cn(
            "flex items-center justify-center p-2 mx-auto mt-3 rounded-xl transition-all",
            "bg-white/[0.03] border border-white/[0.06] text-on-surface-variant hover:text-on-surface hover:bg-white/[0.06]",
            isSidebarCollapsed ? "w-10" : "w-10 ml-auto mr-3"
          )}
        >
          {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
};
