import { useState } from 'react';
import { Card, CardBody, Input, Button } from '@/components/ui';
import { Shield, User, Lock, ArrowRight, X } from 'lucide-react';
import type { Staff } from '@/lib/types';
import { tr } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import { SAMPLE_STAFF } from '@/lib/mockData';

interface PinEntryScreenProps {
  onSuccess: (staff: Staff) => void;
  onLogout: () => void;
}

export function PinEntryScreen({ onSuccess, onLogout }: PinEntryScreenProps) {
  const { organization, lang } = useAuth();
  const [selectedUser, setSelectedUser] = useState<Staff | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  
  // Try loading staff for the current tenant or fallback to SAMPLE_STAFF
  const loadStaff = (): Staff[] => {
    if (organization?.id) {
       const stored = localStorage.getItem(`tenant_staff_${organization.id}`);
       if (stored) return JSON.parse(stored);
    }
    return SAMPLE_STAFF;
  };
  
  const staffList = loadStaff();

  const handleSelectUser = (user: Staff) => {
    setSelectedUser(user);
    setPin('');
    setError('');
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    // Fallback PIN logic: if no PIN is set, assume '0000', or if user is owner/manager we might accept any for demo,
    // but SAMPLE_STAFF have pin_code set.
    const expectedPin = selectedUser.pin_code || '0000';
    if (pin === expectedPin) {
      onSuccess(selectedUser);
    } else {
      setError('الرمز السري غير صحيح');
    }
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPin(e.target.value.replace(/\D/g, '').slice(0, 4));
    setError('');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface-50 p-4" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <Card className="w-full max-w-lg shadow-xl border-0 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary-500 to-blue-600"></div>
        <CardBody className="p-8">
          
          {!selectedUser ? (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-surface-900">مرحباً بك في نظام رقم</h2>
                <p className="text-surface-500">الرجاء اختيار المستخدم للمتابعة</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-8">
                {staffList.filter(s => s.active).map(staff => (
                  <button
                    key={staff.id}
                    onClick={() => handleSelectUser(staff)}
                    className="flex flex-col items-center p-4 rounded-xl border border-surface-200 hover:border-primary-500 hover:bg-primary-50 transition-all text-center gap-2 group"
                  >
                    <div className="w-12 h-12 bg-surface-100 rounded-full flex items-center justify-center group-hover:bg-primary-100 transition-colors">
                      <User className="w-6 h-6 text-surface-500 group-hover:text-primary-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-surface-800">{staff.name}</div>
                      <div className="text-xs text-surface-500">{staff.position || staff.role}</div>
                      <div className="text-[10px] text-surface-400 mt-1 font-mono bg-surface-100 px-2 py-0.5 rounded">PIN: {staff.pin_code || '0000'}</div>
                    </div>
                  </button>
                ))}
              </div>
              
              <div className="pt-6 mt-6 border-t border-surface-100 text-center">
                <button onClick={onLogout} className="text-sm text-surface-500 hover:text-surface-800">
                  تسجيل الخروج من الحساب
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handlePinSubmit} className="space-y-6">
              <button 
                type="button" 
                onClick={() => setSelectedUser(null)}
                className="absolute top-4 left-4 p-2 text-surface-400 hover:text-surface-800 bg-surface-50 hover:bg-surface-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center space-y-2 pt-4">
                <div className="w-16 h-16 bg-surface-100 text-surface-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-surface-900">أدخل الرمز السري</h2>
                <p className="text-surface-500">
                  للدخول كمستخدم: <span className="font-semibold text-surface-800">{selectedUser.name}</span>
                </p>
              </div>

              <div className="space-y-4 max-w-xs mx-auto mt-8">
                <div className="relative">
                  <Input
                    type="password"
                    pattern="[0-9]*"
                    inputMode="numeric"
                    value={pin}
                    onChange={handlePinChange}
                    className="text-center text-3xl tracking-[1em] font-mono py-4"
                    autoFocus
                    maxLength={4}
                    placeholder="••••"
                  />
                </div>
                
                {error && (
                  <p className="text-sm text-rose-500 text-center bg-rose-50 p-2 rounded-lg">{error}</p>
                )}

                
                {selectedUser?.role === 'owner' && selectedUser?.pin_code === '0000' && (
                  <p className="text-sm text-surface-500 text-center bg-surface-50 p-2 rounded-lg mt-2">
                    الرمز الافتراضي: 0000
                  </p>
                )}

                <Button 
                  type="submit" 
                  className="w-full py-4 text-lg"
                  disabled={pin.length < 4}
                >
                  دخول
                  <ArrowRight className="w-5 h-5 mr-2" />
                </Button>
              </div>
            </form>
          )}

        </CardBody>
      </Card>
    </div>
  );
}
