import { useState, type FormEvent } from 'react';
import { Loader2, Shield, Key, Mail, Building2, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Button, Card, CardBody } from '@/components/ui';

interface LoginPageProps {
  onSignUpClick: () => void;
}

export function LoginPage({ onSignUpClick }: LoginPageProps) {
  const { signIn, resetPassword } = useAuth();
  const [mode, setMode] = useState<'signin' | 'forgot_password'>('signin');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSentStatus, setResetSentStatus] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: signInErr } = await signIn(email, password);
    if (signInErr) {
      if (signInErr.toLowerCase().includes('email not confirmed') || signInErr.includes('not confirmed')) {
        setError('لم يتم تفعيل الحساب عبر رقم الجوال بعد.');
      } else if (signInErr.toLowerCase().includes('invalid login credentials')) {
        setError('رقم الجوال أو كلمة المرور غير صحيحة.');
      } else {
        setError(signInErr);
      }
    }

    setLoading(false);
  };

  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setResetSentStatus(null);

    if (!email.trim()) {
      setError('الرجاء إدخال رقم الجوال الخاص بحسابك');
      return;
    }

    setLoading(true);
    const { error: resetErr } = await resetPassword(email.trim());
    setLoading(false);

    if (resetErr) {
      setResetSentStatus(`تم إرسال رابط وإرشادات استعادة كلمة المرور لـ (${email}) بنجاح!`);
    } else {
      setResetSentStatus(`تم إرسال رابط تعيين كلمة المرور الجديدة لـ (${email}) بنجاح!`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-surface-50">
      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-8 relative">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary-600 to-blue-600 text-white shadow-xl shadow-primary-900/20 mb-6">
              <Building2 className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-black text-surface-900">
              {mode === 'signin' ? 'تسجيل الدخول' : 'استعادة كلمة المرور'}
            </h1>
            <p className="text-surface-500">
              {mode === 'signin'
                ? 'أدخل بيانات الدخول الخاصة بمنشأتك'
                : 'أدخل بريدك الإلكتروني لإرسال رابط الاستعادة'}
            </p>
          </div>

          <Card className="border-0 shadow-xl bg-white rounded-3xl">
            <CardBody className="p-6 md:p-8">
              {error && (
                <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-rose-800">{error}</p>
                </div>
              )}
              {resetSentStatus && (
                <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
                  <Shield className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-emerald-800">{resetSentStatus}</p>
                </div>
              )}

              {mode === 'signin' ? (
                <form onSubmit={handleSubmit} className="space-y-5 text-right">

                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-surface-700 ml-1">البريد الإلكتروني</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-surface-400" />
                      </div>
                      <input
                        type="text"
                        dir="ltr"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-4 pr-11 py-3 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-left"
                        placeholder="البريد الإلكتروني"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center ml-1">
                      <label className="text-sm font-bold text-surface-700">كلمة المرور</label>
                      <button
                        type="button"
                        onClick={() => setMode('forgot_password')}
                        className="text-xs font-bold text-primary-600 hover:text-primary-700 transition-colors"
                      >
                        نسيت كلمة المرور؟
                      </button>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                        <Key className="h-5 w-5 text-surface-400" />
                      </div>
                      <input
                        type="password"
                        dir="ltr"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-4 pr-11 py-3 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-left"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                  </div>

                  <Button id="submit-login-btn" type="submit" disabled={loading} className="w-full h-12 text-base font-bold rounded-xl mt-4 bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-700 hover:to-blue-700 shadow-lg shadow-primary-900/20">
                    {loading ? 'جاري الدخول...' : 'تسجيل الدخول'}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-5 text-right">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-surface-700 ml-1">البريد الإلكتروني</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-surface-400" />
                      </div>
                      <input
                        type="text"
                        dir="ltr"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-4 pr-11 py-3 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-left"
                        placeholder="البريد الإلكتروني"
                        required
                      />
                    </div>
                  </div>

                  <Button id="submit-login-btn" type="submit" disabled={loading} className="w-full h-12 text-base font-bold rounded-xl mt-4">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'إرسال رابط الاستعادة'}
                  </Button>

                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      setError(null);
                      setResetSentStatus(null);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 text-sm font-bold text-surface-600 hover:text-surface-900 transition-colors"
                  >
                    <ArrowRight className="w-4 h-4" />
                    العودة لتسجيل الدخول
                  </button>
                </form>
              )}
              
              {mode === 'signin' && (
                <div className="mt-8 pt-6 border-t border-surface-100 text-center">
                  <p className="text-sm font-bold text-surface-500 mb-4">حسابات تجريبية (دخول سريع)</p>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {[{name: 'مغسلة الرياض', email: 'riyadh@test.com', pass: '123456'}, {name: 'مغسلة جدة', email: 'jeddah@test.com', pass: '123456'}].map((demo, i) => (
                      <Button
                        key={demo.name}
                        type="button"
                        variant="outline"
                        className="text-sm p-0 h-10 font-bold border-primary-200 hover:bg-primary-50 text-primary-800"
                        onClick={() => {
                          setEmail(demo.email);
                          setPassword(demo.pass);
                          setTimeout(() => { const btn = document.getElementById('submit-login-btn'); if (btn) btn.click(); }, 100);
                        }}
                      >
                        {demo.name}
                      </Button>
                    ))}
                  </div>
                  <p className="text-sm text-surface-600">
                    ليس لديك حساب؟{' '}
                    <button onClick={onSignUpClick} className="font-bold text-primary-600 hover:text-primary-700">
                      إنشاء حساب جديد
                    </button>
                  </p>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Left Side - Brand / Info (Hidden on mobile) */}
      <div className="hidden md:flex flex-1 bg-surface-900 relative items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-luminosity"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-surface-900 via-surface-900/80 to-transparent"></div>
        <div className="relative z-10 max-w-lg text-right">
          <h2 className="text-4xl md:text-5xl font-black text-white leading-tight mb-6">
            مرحباً بك في نظام إدارة المغاسل المتكامل
          </h2>
          <p className="text-lg text-surface-300 leading-relaxed">
            المنصة الأذكى والأسهل لإدارة مبيعات وعملاء وحسابات مغسلتك باحترافية عالية وعزل بيانات تام.
          </p>
        </div>
      </div>
    </div>
  );
}
