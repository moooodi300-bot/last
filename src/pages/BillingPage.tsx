import { useState } from 'react';
import { CreditCard, ShieldCheck, Check } from 'lucide-react';
import { PageHeader, Card, CardBody, Button } from '@/components/ui';

export function BillingPage() {
  const [selectedPlan, setSelectedPlan] = useState<'monthly'|'yearly'>('monthly');

  return (
    <div className="space-y-6">
      <PageHeader 
        title="الاشتراك والباقات" 
        subtitle="إدارة اشتراكك في نظام إدارة المغاسل"
      />

      <div className="bg-surface-900 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden shadow-2xl">
         <div className="absolute top-6 left-6 bg-emerald-500 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
           <ShieldCheck className="w-4 h-4" /> الفترة التجريبية المجانية
         </div>
         <h2 className="text-3xl font-black mb-4">باقة المؤسس</h2>
         <p className="text-surface-400 max-w-lg leading-relaxed">
           استمتع بكافة مميزات النظام مجاناً لمدة شهر كامل. بعد انتهاء الفترة التجريبية يمكنك اختيار الباقة الأنسب لمغسلتك، بدون أي قيود أو شروط معقدة.
         </p>
         <div className="mt-6 flex flex-wrap gap-4 text-sm font-medium text-primary-200">
           <span className="flex items-center gap-1"><Check className="w-4 h-4" /> مستخدمين غير محدود</span>
           <span className="flex items-center gap-1"><Check className="w-4 h-4" /> تطبيق الغسيل المتنقل</span>
           <span className="flex items-center gap-1"><Check className="w-4 h-4" /> دعم فني 24/7</span>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mt-8">
         {/* Monthly */}
         <Card className={`border-2 cursor-pointer transition-all ${selectedPlan === 'monthly' ? 'border-primary-500 shadow-xl shadow-primary-900/10 scale-105' : 'border-surface-200 hover:border-primary-300'}`} onClick={() => setSelectedPlan('monthly')}>
            <CardBody className="p-8 text-center">
               <h3 className="text-xl font-bold text-surface-800 mb-2">الاشتراك الشهري</h3>
               <p className="text-surface-500 text-sm mb-6">مرونة عالية ودفع شهري ميسر</p>
               <div className="text-5xl font-black text-primary-600 mb-6">
                 128 <span className="text-base text-surface-500 font-medium">ريال/شهر</span>
               </div>
               <Button className={`w-full h-12 font-bold ${selectedPlan === 'monthly' ? 'bg-primary-600' : 'bg-surface-100 text-surface-700 hover:bg-surface-200'}`}>
                 اختيار الباقة الشهرية
               </Button>
            </CardBody>
         </Card>

         {/* Yearly */}
         <Card className={`border-2 cursor-pointer transition-all relative overflow-hidden ${selectedPlan === 'yearly' ? 'border-primary-500 shadow-xl shadow-primary-900/10 scale-105' : 'border-surface-200 hover:border-primary-300'}`} onClick={() => setSelectedPlan('yearly')}>
            <div className="absolute top-4 left-[-35px] bg-amber-400 text-amber-900 text-[11px] font-black py-1.5 px-10 rotate-[-45deg] shadow-lg">
              توفير 35%
            </div>
            <CardBody className="p-8 text-center bg-gradient-to-b from-primary-50/50 to-white">
               <h3 className="text-xl font-bold text-surface-800 mb-2">الاشتراك السنوي</h3>
               <p className="text-surface-500 text-sm mb-6">أفضل قيمة واشتراك طويل الأمد</p>
               <div className="text-5xl font-black text-primary-600 mb-6">
                 999 <span className="text-base text-surface-500 font-medium">ريال/سنة</span>
               </div>
               <Button className={`w-full h-12 font-bold ${selectedPlan === 'yearly' ? 'bg-primary-600' : 'bg-surface-100 text-surface-700 hover:bg-surface-200'}`}>
                 اختيار الباقة السنوية
               </Button>
            </CardBody>
         </Card>
      </div>
      
      <p className="text-center text-surface-400 text-sm mt-8">الأسعار المعروضة لا تشمل ضريبة القيمة المضافة 15%</p>
    </div>
  );
}
