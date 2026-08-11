import { useState, useEffect } from 'react';
import { Download, X, Smartphone, CheckCircle, Bell } from 'lucide-react';
import { requestNotificationPermission } from '../registerSW';

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [notificationsGranted, setNotificationsGranted] = useState(false);

  useEffect(() => {
    // Check if already installed in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    // Check notification status
    if ('Notification' in window && Notification.permission === 'granted') {
      setNotificationsGranted(true);
    }

    // Detect iOS
    const ua = window.navigator.userAgent;
    const isApple = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    setIsIOS(isApple);

    // Listen for install prompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show prompt if user hasn't dismissed it in this session
      if (!sessionStorage.getItem('pwa_prompt_dismissed')) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the PWA install prompt');
    }
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  const handleEnableNotifications = async () => {
    const res = await requestNotificationPermission();
    if (res === 'granted') {
      setNotificationsGranted(true);
    }
  };

  if (isInstalled) return null;

  return (
    <>
      {/* Floating PWA Install Banner */}
      {showPrompt && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md bg-surface-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-surface-700/80 z-50 animate-in fade-in slide-in-from-bottom-5">
          <div className="flex items-start justify-between gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center shrink-0 shadow-lg shadow-primary-600/30">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 space-y-1">
              <h4 className="font-bold text-sm text-white">تثبيت تطبيق "رقم" على جهازك</h4>
              <p className="text-xs text-surface-300">
                احصل على تجربة سريعة تعمل بدون إنترنت مع فتح سريع من الشاشة الرئيسية
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="text-surface-400 hover:text-white p-1 rounded-lg transition-colors"
              aria-label="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3 pt-3 border-t border-surface-800 flex items-center justify-between gap-2">
            {!notificationsGranted && (
              <button
                onClick={handleEnableNotifications}
                className="text-xs text-primary-400 hover:underline flex items-center gap-1"
              >
                <Bell className="w-3.5 h-3.5" /> تفعيل التنبيهات
              </button>
            )}
            <div className="flex gap-2 mr-auto">
              <button
                onClick={handleDismiss}
                className="px-3 py-1.5 text-xs font-bold text-surface-400 hover:text-white rounded-lg transition-colors"
              >
                لاحقاً
              </button>
              {isIOS ? (
                <div className="text-[11px] text-primary-300 font-medium bg-primary-950/60 px-3 py-1.5 rounded-lg border border-primary-800">
                  اضغط "مشاركة" ثم "إضافة إلى الشاشة الرئيسية" 📲
                </div>
              ) : (
                <button
                  onClick={handleInstallClick}
                  className="px-4 py-1.5 bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> تثبيت التطبيق
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
