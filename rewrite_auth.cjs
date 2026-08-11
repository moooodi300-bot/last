const fs = require('fs');

const code = `
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import type { Role } from './rbac';
import type { Lang } from './i18n';
import type { Settings, Organization, Profile, SubscriptionPlan } from './types';
import { generateMockData } from './mockDataGenerator';

interface AuthState {
  session: Session | null;
  user: User | null;
  booting: boolean;
  isDemo: boolean;
  role: Role;
  staffName: string;
  lang: Lang;
  settings: Settings | null;
  organization: Organization | null;
  profile: Profile | null;
  plan: SubscriptionPlan | null;
  setRole: (r: Role) => void;
  setStaffName: (n: string) => void;
  setLang: (l: Lang) => void;
  setSettings: (s: Settings | null) => void;
  refreshSettings: () => Promise<void>;
  refreshOrg: () => Promise<void>;
  signIn: (phone: string, password: string) => Promise<{ error: string | null }>;
  signUp: (phone: string, password: string) => Promise<{ error: string | null; autoSignedIn?: boolean }>;
  resetPassword: (phone: string) => Promise<{ error: string | null }>;
  resendConfirmationEmail: (phone: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const DEFAULT_FALLBACK_SETTINGS: Settings = {
  id: 'default-settings-id',
  organization_id: 'default-org-id',
  company_name: 'مغسلة السيارات الذكية',
  vat_number: '310022334400003',
  cr_number: '1010889900',
  city: 'الرياض',
  district: 'حي الملقا',
  street: 'طريق الملك فهد',
  postal_code: '11564',
  building_number: '7412',
  vat_rate: 15,
  daily_volume_target: 30,
  working_days: 30,
  avg_service_price: 40,
  loyalty_target: 10,
  currency: 'SAR',
  language: 'ar',
  logo_url: null,
  phone: null,
  address: null,
  brand_color: '#0e7490',
  brand_accent: '#2563eb',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  whatsapp_in_progress: 'عميلنا العزيز، جاري العمل على مركبتك الآن.',
  whatsapp_completed: 'عميلنا العزيز، انتهينا من خدمة مركبتك.',
  whatsapp_delivered: 'عميلنا العزيز، شكراً لزيارتك، تم تسليم مركبتك.',
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [booting, setBooting] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [role, setRole] = useState<Role>('owner');
  const [staffName, setStaffName] = useState<string>('');
  const [lang, setLang] = useState<Lang>('ar');
  const [settings, setSettingsState] = useState<Settings | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);

  useEffect(() => {
    // Check if we have a persisted session in local storage
    const storedUser = localStorage.getItem('demo_auth_user');
    if (storedUser) {
      try {
        const u = JSON.parse(storedUser);
        loadUserEnv(u);
      } catch (e) {
        setBooting(false);
      }
    } else {
      setBooting(false);
    }
  }, []);

  const loadUserEnv = (u: any) => {
    setUser(u);
    setSession({ user: u } as any);
    
    let orgId = '11111111-1111-1111-1111-111111111111';
    let orgName = 'مغسلة الرياض';
    if (u.email === 'jeddah@test.com') {
      orgId = '22222222-2222-2222-2222-222222222222';
      orgName = 'مغسلة جدة';
    }

    const org = {
      id: orgId,
      name: orgName,
      owner_id: u.id,
      subscription_status: 'active' as any,
      created_at: new Date().toISOString(),
      subscription_plan_id: null,
      trial_ends_at: null,
    };
    
    setOrganization(org);
    setProfile({ id: u.id, organization_id: org.id, full_name: 'مدير النظام', role: 'owner' });
    setRole('owner');
    setStaffName('مدير النظام');

    const storedSettings = localStorage.getItem('raqm_app_settings_' + org.id);
    if (storedSettings) {
      setSettingsState(JSON.parse(storedSettings));
    } else {
      setSettingsState({ ...DEFAULT_FALLBACK_SETTINGS, company_name: org.name });
    }

    generateMockData(org.id);
    setBooting(false);
  };

  const setSettings = (s: Settings | null) => {
    setSettingsState(s);
    if (s && organization) {
      localStorage.setItem('raqm_app_settings_' + organization.id, JSON.stringify(s));
    }
  };

  const refreshSettings = async () => {
    if (organization) {
      const stored = localStorage.getItem('raqm_app_settings_' + organization.id);
      if (stored) setSettingsState(JSON.parse(stored));
    }
  };

  const refreshOrg = async () => {};

  const signIn = async (phone: string, password: string) => {
    if (phone === 'riyadh@test.com' && password === '123456') {
      const mockUser = { id: 'riyadh-mock-id', email: 'riyadh@test.com' };
      localStorage.setItem('demo_auth_user', JSON.stringify(mockUser));
      loadUserEnv(mockUser);
      return { error: null };
    }
    if (phone === 'jeddah@test.com' && password === '123456') {
      const mockUser = { id: 'jeddah-mock-id', email: 'jeddah@test.com' };
      localStorage.setItem('demo_auth_user', JSON.stringify(mockUser));
      loadUserEnv(mockUser);
      return { error: null };
    }
    return { error: 'بيانات الدخول غير صحيحة' };
  };

  const signUp = async () => { return { error: 'التسجيل معطل حاليا' }; };

  const signOut = async () => {
    localStorage.removeItem('demo_auth_user');
    setSession(null);
    setUser(null);
    setOrganization(null);
    setProfile(null);
  };

  const value: AuthState = {
    session,
    user,
    booting,
    isDemo,
    role,
    staffName,
    lang,
    settings,
    organization,
    profile,
    plan,
    setRole,
    setStaffName,
    setLang,
    setSettings,
    refreshSettings,
    refreshOrg,
    signIn,
    signUp,
    resetPassword: async () => ({ error: null }),
    resendConfirmationEmail: async () => ({ error: null }),
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

import { hasPermission as rbacHasPermission, type Permission } from './rbac';

export function usePermissions() {
  const { role } = useAuth();
  return {
    can: (perm: Permission) => rbacHasPermission(role, perm),
    role
  };
}
`;

fs.writeFileSync('src/lib/auth.tsx', code);
