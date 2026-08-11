const fs = require('fs');
const file = 'src/pages/SignUpPage.tsx';

const code = `
import { useState } from 'react';
import { Mail, Key, Shield, Building, ArrowLeft, AlertCircle, Phone, CheckCircle2, User, MapPin, FileText } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';

interface SignUpPageProps {
  onLoginClick: () => void;
}

export function SignUpPage({ onLoginClick }: SignUpPageProps) {
  const { signUp } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    userPhone: '',
    password: '',
    passwordConfirm: '',
    orgName: '',
    crNumber: '',
    city: '',
    address: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (formData.password !== formData.passwordConfirm) {
      setError('كلمة المرور وتأكيد كلمة المرور غير متطابقين');
      return;
    }
    
    if (formData.password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    setLoading(true);
    
    const { error: signUpError } = await signUp(formData);
    
    setLoading(false);
    
    if (signUpError) {
      setError(signUpError);
    }
    // on success, auth context sets session and we will be redirected automatically
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      <div className="flex-1 flex items-center justify-center p-4 lg:p-8 relative overflow-y-auto">
        <button
          onClick={onLoginClick}
          className="absolute top-6 left-6 flex items-center gap-2 text-slate-500 hover:text-slate-900 font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          رجوع
        </button>

        <div className="w-full max-w-xl space-y-8 my-10">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-xl shadow-cyan-900/20 mb-6">
              <Building className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-black text-slate-900">حساب جديد</h1>
            <p className="text-slate-500">سجل لبدء إدارة مغسلتك باحترافية (نسخة تجريبية)</p>
          </div>

          <Card className="border-0 shadow-xl bg-white rounded-3xl">
            <CardBody className="p-6 md:p-8">
              {error && (
                <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-rose-800">{error}</p>
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-6 text-right">
                
                {/* User Info Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">بيانات المستخدم</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-slate-700 ml-1">الاسم الكامل</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                          <User className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                          type="text"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleChange}
                          className="w-full pl-4 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all text-left"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-slate-700 ml-1">البريد الإلكتروني</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                          type="email"
                          name="email"
                          dir="ltr"
                          value={formData.email}
                          onChange={handleChange}
                          className="w-full pl-4 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all text-left font-mono"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-1.5">
                      <label className="text-sm font-bold text-slate-700 ml-1">رقم الجوال</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                          <Phone className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                          type="tel"
                          name="userPhone"
                          dir="ltr"
                          value={formData.userPhone}
                          onChange={handleChange}
                          className="w-full pl-4 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all text-left font-mono"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-slate-700 ml-1">كلمة المرور</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                          <Key className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                          type="password"
                          name="password"
                          dir="ltr"
                          value={formData.password}
                          onChange={handleChange}
                          className="w-full pl-4 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all text-left"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-slate-700 ml-1">تأكيد كلمة المرور</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                          <Key className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                          type="password"
                          name="passwordConfirm"
                          dir="ltr"
                          value={formData.passwordConfirm}
                          onChange={handleChange}
                          className="w-full pl-4 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all text-left"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Organization Info Section */}
                <div className="space-y-4 pt-4">
                  <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">بيانات المنشأة</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-slate-700 ml-1">اسم المنشأة / المغسلة</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                          <Building className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                          type="text"
                          name="orgName"
                          value={formData.orgName}
                          onChange={handleChange}
                          className="w-full pl-4 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all text-left"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-slate-700 ml-1">رقم السجل التجاري (اختياري)</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                          <FileText className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                          type="text"
                          name="crNumber"
                          dir="ltr"
                          value={formData.crNumber}
                          onChange={handleChange}
                          className="w-full pl-4 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all text-left font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-slate-700 ml-1">المدينة</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                          <MapPin className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          className="w-full pl-4 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all text-left"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-slate-700 ml-1">العنوان (اختياري)</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                          <MapPin className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                          type="text"
                          name="address"
                          value={formData.address}
                          onChange={handleChange}
                          className="w-full pl-4 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all text-left"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full h-12 text-base font-bold rounded-xl mt-6 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 shadow-lg shadow-cyan-900/20">
                  {loading ? 'جاري التسجيل...' : 'إنشاء حساب جديد'}
                </Button>
              </form>
              
              <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                <p className="text-sm text-slate-600">
                  لديك حساب بالفعل؟{' '}
                  <button onClick={onLoginClick} className="font-bold text-cyan-600 hover:text-cyan-700">
                    تسجيل الدخول
                  </button>
                </p>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
      
      {/* Left Side - Brand / Info (Hidden on mobile) */}
      <div className="hidden lg:flex flex-1 bg-slate-900 relative items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-luminosity"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent"></div>
        <div className="relative z-10 max-w-lg text-right">
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-white text-sm font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>نظام SaaS متكامل</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white leading-tight mb-6">
            أدر مغسلتك بذكاء وحقق أرباحاً أعلى
          </h2>
          <p className="text-lg text-slate-300 leading-relaxed mb-8">
            انضم الآن واحصل على نظام متكامل لإدارة المبيعات، العملاء، والتقارير في مكان واحد ومعزول تماماً عن أي منشأة أخرى.
          </p>
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm">
                <div className="text-2xl font-black text-cyan-400 mb-1">عزل تام</div>
                <div className="text-sm text-slate-400">بياناتك ومبيعاتك في بيئة منفصلة وآمنة</div>
             </div>
             <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm">
                <div className="text-2xl font-black text-emerald-400 mb-1">متعدد الفروع</div>
                <div className="text-sm text-slate-400">قابل للتوسع لإدارة أكثر من فرع لاحقاً</div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
`;

fs.writeFileSync(file, code);
