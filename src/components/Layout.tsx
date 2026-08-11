import { useState, type ReactNode } from 'react';
import {
  LayoutDashboard, ShoppingCart, Users, Package, Truck, Wallet,
  BookOpen, UserCog, BarChart3, FileText, Settings as SettingsIcon,
  Menu, X, ChevronDown, CreditCard, LogOut, MapPin, ClipboardList, Award, Sparkles,
} from 'lucide-react';
import { MODULES, roleLabel, canAccess, type ModuleKey, type Role } from '@/lib/rbac';
import { useAuth } from '@/lib/auth';
import { tr } from '@/lib/i18n';
import { RaqmLogo } from '@/components/RaqmLogo';

const ICONS: Record<string, typeof LayoutDashboard> = {
  LayoutDashboard, ShoppingCart, Users, Package, Truck, Wallet,
  BookOpen, UserCog, BarChart3, FileText, Settings: SettingsIcon, CreditCard, ClipboardList, Award, Sparkles,
};

interface LayoutProps {
  active: ModuleKey;
  onNavigate: (key: ModuleKey) => void;
  children: ReactNode;
}

export function Layout({ active, onNavigate, children }: LayoutProps) {
  const { role, setRole, staffName, setStaffName, lang, setLang, settings, organization, signOut, isDemo } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const visibleModules = MODULES.filter((m) => canAccess(role, m.key, organization?.id));
  const isRTL = lang === 'ar';
  const dir = isRTL ? 'rtl' : 'ltr';
  const sidebarSide = isRTL ? 'right' : 'left';
  const brand = settings?.brand_color ?? '#0e7490';
  const accent = settings?.brand_accent ?? '#2563eb';

  const handleNav = (key: ModuleKey) => {
    onNavigate(key);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-surface-50 flex" dir={dir}>
      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 ${sidebarSide}-0 z-40 w-72 bg-surface-900 text-surface-300 flex-col transition-transform duration-300 lg:flex ${
          sidebarOpen ? 'flex translate-x-0' : 'hidden lg:flex ' + (isRTL ? 'translate-x-full lg:translate-x-0' : '-translate-x-full lg:translate-x-0')
        }`}
      >
        {/* Brand */}
        <div className="flex items-center justify-between gap-2 px-4 h-16 border-b border-surface-800">
          <div className="flex items-center gap-2 overflow-hidden">
            {settings?.logo_url ? (
              <img src={settings.logo_url} alt="logo" className="w-9 h-9 rounded-xl object-cover shrink-0" />
            ) : (
              <RaqmLogo size="sm" lightMode />
            )}
            {(settings?.company_name || organization?.name) && (
              <span className="text-[11px] font-semibold text-primary-300 bg-primary-950/80 border border-primary-800/60 px-2 py-0.5 rounded-full truncate max-w-[100px]">
                {settings?.company_name || organization?.name}
              </span>
            )}
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-surface-400 hover:text-white shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {visibleModules.map((m) => {
            const Icon = ICONS[m.icon] ?? LayoutDashboard;
            const isActive = active === m.key;
            return (
              <button
                key={m.key}
                onClick={() => handleNav(m.key)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'text-white border'
                    : 'text-surface-400 hover:bg-surface-800 hover:text-white'
                }`}
                style={isActive ? { background: `linear-gradient(to ${isRTL ? 'left' : 'right'}, ${brand}33, ${accent}11)`, borderColor: `${brand}55` } : undefined}
              >
                <Icon className={`w-5 h-5 ${isActive ? '' : ''}`} style={isActive ? { color: brand } : undefined} />
                <span>{tr(m.key === 'dashboard' ? 'navDashboard' : `nav${m.key.charAt(0).toUpperCase() + m.key.slice(1)}`, lang)}</span>
              </button>
            );
          })}
        </nav>

        {/* Role badge & Logout */}
        <div className="px-4 py-4 border-t border-surface-800 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ background: `linear-gradient(135deg, ${brand}, ${accent})` }}>
              {staffName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{staffName}</p>
              <p className="text-xs text-surface-400">{roleLabel(role, lang, organization?.id)}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => window.dispatchEvent(new Event('switchUser'))}
              className="flex-1 flex items-center justify-center gap-1 py-2 px-2 bg-surface-800/80 hover:bg-surface-700 hover:text-white text-surface-300 rounded-xl text-xs font-bold transition-colors border border-surface-700"
              title={lang === 'ar' ? 'تبديل المستخدم' : 'Switch User'}
            >
              <UserCog className="w-3.5 h-3.5 text-surface-400" />
              {lang === 'ar' ? 'تبديل' : 'Switch'}
            </button>
            <button
              onClick={() => signOut()}
              className="flex-1 flex items-center justify-center gap-1 py-2 px-2 bg-surface-800/80 hover:bg-rose-950/60 hover:text-rose-300 text-surface-300 rounded-xl text-xs font-bold transition-colors border border-surface-700 hover:border-rose-800"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              {tr('logout', lang)}
            </button>
          </div>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-30 bg-surface-900/40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-surface-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-20">
          <div className="flex items-center gap-3 lg:hidden">
            <button onClick={() => setSidebarOpen(true)} className="text-surface-600 p-1 bg-surface-100 rounded-lg">
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              {settings?.logo_url ? (
                <img src={settings.logo_url} alt="logo" className="w-7 h-7 rounded-lg object-cover" />
              ) : null}
              <span className="text-sm font-bold text-surface-800">
                {settings?.company_name || organization?.name}
              </span>
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-3">
            {settings?.logo_url ? (
              <img src={settings.logo_url} alt="logo" className="w-8 h-8 rounded-lg object-cover" />
            ) : null}
            <div>
              <p className="text-base font-bold text-surface-800">
                {settings?.company_name || organization?.name}
              </p>
              <p className="text-xs text-surface-500">
                {new Date().toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Single Unified Branch Indicator */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-50 border border-primary-200 text-xs font-semibold text-primary-900 shadow-sm" title="منشأة واحدة - الفرع الرئيسي">
              <MapPin className="w-3.5 h-3.5 text-primary-600" />
              <span>الفرع الرئيسي</span>
              <span className="hidden sm:inline-block bg-primary-200/60 text-primary-800 text-[10px] px-1.5 py-0.5 rounded-md font-bold">
                فرع واحد
              </span>
            </div>

            

            {/* Direct Language Switcher Pill */}
            <div className="flex items-center p-1 rounded-xl bg-surface-100 border border-surface-200 shadow-inner">
              <button
                onClick={() => setLang('ar')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                  lang === 'ar'
                    ? 'bg-primary-800 text-white shadow-sm'
                    : 'text-surface-600 hover:text-surface-900 hover:bg-surface-200/50'
                }`}
              >
                <span>🇸🇦</span>
                <span>العربية</span>
              </button>
              <button
                onClick={() => setLang('en')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                  lang === 'en'
                    ? 'bg-primary-800 text-white shadow-sm'
                    : 'text-surface-600 hover:text-surface-900 hover:bg-surface-200/50'
                }`}
              >
                <span>🇬🇧</span>
                <span>English</span>
              </button>
            </div>
            {/* Direct Switch User Button */}
            <button
              onClick={() => window.dispatchEvent(new Event('switchUser'))}
              className="px-3 py-1.5 text-xs font-bold rounded-xl bg-surface-100 hover:bg-surface-200 text-surface-700 border border-surface-200 transition-colors flex items-center gap-1.5 shadow-sm"
              title={lang === 'ar' ? 'تبديل المستخدم' : 'Switch User'}
            >
              <UserCog className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{lang === 'ar' ? 'تبديل المستخدم' : 'Switch User'}</span>
            </button>
            {/* Direct Logout Button */}
            <button
              onClick={() => signOut()}
              className="px-3 py-1.5 text-xs font-bold rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors flex items-center gap-1.5 shadow-sm"
              title={tr('logout', lang)}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{tr('logout', lang)}</span>
            </button>

            {/* Role switcher */}
            <div className="relative">
              <button
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-surface-200 hover:bg-surface-50 transition-colors cursor-default"
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: `linear-gradient(135deg, ${brand}, ${accent})` }}>
                  {staffName.charAt(0)}
                </div>
                <div className={`hidden sm:block text-${isRTL ? 'right' : 'left'}`}>
                  <p className="text-sm font-medium text-surface-700 leading-tight">{staffName}</p>
                  <p className="text-xs text-surface-400 leading-tight">{roleLabel(role, lang, organization?.id)}</p>
                </div>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
