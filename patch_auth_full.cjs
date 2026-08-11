const fs = require('fs');
const file = 'src/lib/auth.tsx';

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
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (data: any) => Promise<{ error: string | null; autoSignedIn?: boolean }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  resendConfirmationEmail: (email: string) => Promise<{ error: string | null }>;
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

function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

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
    setUser(u as any);
    setSession({ user: u } as any);
    
    // Load Org
    const orgs = JSON.parse(localStorage.getItem('saas_orgs') || '[]');
    let org = orgs.find((o: any) => o.id === u.tenant_id);
    
    if (!org) {
       // fallback for legacy demo
       org = {
         id: u.tenant_id,
         name: u.email === 'jeddah@test.com' ? 'مغسلة جدة' : 'مغسلة الرياض',
         owner_id: u.id,
         subscription_status: 'active',
         created_at: new Date().toISOString(),
       };
    }

    setOrganization(org);
    setProfile({ id: u.id, organization_id: org.id, full_name: u.name || 'مدير النظام', role: 'owner' });
    setRole('owner');
    setStaffName(u.name || 'مدير النظام');

    const storedSettings = localStorage.getItem('raqm_app_settings_' + org.id);
    if (storedSettings) {
      setSettingsState(JSON.parse(storedSettings));
    } else {
      setSettingsState({ ...DEFAULT_FALLBACK_SETTINGS, company_name: org.name });
    }

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

  const initDemos = () => {
     let users = JSON.parse(localStorage.getItem('saas_users') || '[]');
     if (users.length === 0) {
        users = [
          { id: 'riyadh-mock-id', name: 'مغسلة الرياض', email: 'riyadh@test.com', password: '123456', tenant_id: '11111111-1111-1111-1111-111111111111' },
          { id: 'jeddah-mock-id', name: 'مغسلة جدة', email: 'jeddah@test.com', password: '123456', tenant_id: '22222222-2222-2222-2222-222222222222' }
        ];
        localStorage.setItem('saas_users', JSON.stringify(users));
        localStorage.setItem('saas_orgs', JSON.stringify([
          { id: '11111111-1111-1111-1111-111111111111', name: 'مغسلة الرياض', owner_id: 'riyadh-mock-id', subscription_status: 'active' },
          { id: '22222222-2222-2222-2222-222222222222', name: 'مغسلة جدة', owner_id: 'jeddah-mock-id', subscription_status: 'active' }
        ]));
     }
  };

  const signIn = async (email: string, password: string) => {
    initDemos();
    const users = JSON.parse(localStorage.getItem('saas_users') || '[]');
    const user = users.find((u: any) => u.email === email && u.password === password);
    
    if (user) {
      localStorage.setItem('demo_auth_user', JSON.stringify(user));
      loadUserEnv(user);
      return { error: null };
    }
    return { error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' };
  };

  const signUp = async (data: any) => {
    initDemos();
    const users = JSON.parse(localStorage.getItem('saas_users') || '[]');
    
    if (users.find((u: any) => u.email === data.email)) {
       return { error: 'البريد الإلكتروني مستخدم مسبقًا' };
    }

    const tenantId = generateId();
    const userId = generateId();

    const newUser = {
       id: userId,
       email: data.email,
       name: data.fullName,
       phone: data.userPhone,
       password: data.password,
       tenant_id: tenantId
    };

    const newOrg = {
       id: tenantId,
       name: data.orgName,
       cr_number: data.crNumber,
       city: data.city,
       address: data.address,
       owner_id: userId,
       subscription_status: 'active',
       created_at: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem('saas_users', JSON.stringify(users));

    const orgs = JSON.parse(localStorage.getItem('saas_orgs') || '[]');
    orgs.push(newOrg);
    localStorage.setItem('saas_orgs', JSON.stringify(orgs));

    // Initialize default settings for this tenant
    localStorage.setItem('raqm_app_settings_' + tenantId, JSON.stringify({
       ...DEFAULT_FALLBACK_SETTINGS,
       company_name: data.orgName,
       organization_id: tenantId,
       cr_number: data.crNumber,
       city: data.city,
       address: data.address
    }));

    generateMockData(tenantId);

    // Auto login
    localStorage.setItem('demo_auth_user', JSON.stringify(newUser));
    loadUserEnv(newUser);

    return { error: null, autoSignedIn: true };
  };

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

fs.writeFileSync(file, code);
