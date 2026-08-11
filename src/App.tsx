import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/lib/auth';
import { Layout } from '@/components/Layout';
import { canAccess, type ModuleKey } from '@/lib/rbac';
import { generateMockData } from '@/lib/mockDataGenerator';
import { LoginPage } from '@/pages/LoginPage';
import { SignUpPage } from '@/pages/SignUpPage';
import { Card, CardBody, Spinner } from '@/components/ui';
import { ShieldAlert } from 'lucide-react';
import { tr } from '@/lib/i18n';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
import { PinEntryScreen } from '@/components/PinEntryScreen';
import type { Staff } from '@/lib/types';

import { DashboardPage } from '@/pages/DashboardPage';
import { SalesPage } from '@/pages/SalesPage';
import { InvoicesPage } from '@/pages/InvoicesPage';
import { CustomersPage } from '@/pages/CustomersPage';
import { PurchasesPage } from '@/pages/PurchasesPage';
import { JobCardsPage } from '@/pages/JobCardsPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { MobilePage } from '@/pages/MobilePage';
import { BillingPage } from '@/pages/BillingPage';

function AppContent() {
  const { role, lang, organization } = useAuth();
  const [active, setActive] = useState<ModuleKey>('dashboard');

  const effectiveKey = canAccess(role, active, organization?.id) ? active : 'dashboard';

  const renderPage = () => {
    switch (effectiveKey) {
      case 'dashboard': return <DashboardPage />;
      case 'sales': return <SalesPage />;
      case 'invoices': return <InvoicesPage />;
      case 'customers': return <CustomersPage />;
      case 'purchases': return <PurchasesPage />;
      case 'jobcards': return <JobCardsPage />;
      case 'reports': return <ReportsPage />;
      case 'settings': return <SettingsPage />;
      case 'mobile': return <MobilePage />;
      case 'billing': return <BillingPage />;
      default: return <DashboardPage />;
    }
  };

  return (
    <>
      <PWAInstallPrompt />
      <Layout active={effectiveKey} onNavigate={setActive}>
        {canAccess(role, effectiveKey, organization?.id) ? renderPage() : (
          <Card><CardBody>
            <div className="flex flex-col items-center justify-center py-16 text-surface-400">
              <ShieldAlert className="w-10 h-10 mb-3" />
              <p className="text-sm">{tr('noPermission', lang)}</p>
            </div>
          </CardBody></Card>
        )}
      </Layout>
    </>
  );
}

function Gate() {
  const { session, booting, setRole, setStaffName, signOut, organization } = useAuth();
  const [showSignUp, setShowSignUp] = useState(false);
  const [currentStaff, setCurrentStaff] = useState<Staff | null>(null);

  const [mockReady, setMockReady] = useState(false);

  useEffect(() => {
    if (session && organization?.id) {
      generateMockData(organization.id);
      setMockReady(true);
    }
  }, [session, organization?.id]);

  useEffect(() => {
    const handleSwitch = () => {
      setCurrentStaff(null);
    };
    window.addEventListener('switchUser', handleSwitch);
    return () => window.removeEventListener('switchUser', handleSwitch);
  }, []);

  if (booting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <Spinner label="جاري التحميل..." />
      </div>
    );
  }

  if (!session) {
    if (showSignUp) {
      return <SignUpPage onLoginClick={() => setShowSignUp(false)} />;
    }
    return <LoginPage onSignUpClick={() => setShowSignUp(true)} />;
  }

  if (!mockReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <Spinner label="جاري التحميل..." />
      </div>
    );
  }

  if (!currentStaff) {
    return <PinEntryScreen onSuccess={(staff) => {
      setCurrentStaff(staff);
      setRole(staff.role as any);
      setStaffName(staff.name);
    }} onLogout={() => signOut()} />;
  }

  return <AppContent />;
}

function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}

export default App;
