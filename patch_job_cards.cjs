const fs = require('fs');

const code = `import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/PageHeader';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Modal } from '../components/ui/Modal';
import { Plus, Car, UserCircle, Camera, CheckCircle2, Printer, Send, Clock, Check, ListChecks } from 'lucide-react';

interface JobCard {
  id: string;
  customerName: string;
  phone: string;
  carType: string;
  plate: string;
  mileage: string;
  notes: string;
  status: 'received' | 'in_progress' | 'paid';
  photosCount: number;
  totalAmount: number;
  createdAt: string;
  services: any[];
}

export function JobCardsPage() {
  const [cards, setCards] = useState<JobCard[]>([]);
  const [activeFilter, setActiveFilter] = useState<'received' | 'in_progress' | 'paid'>('in_progress');
  const [showAdd, setShowAdd] = useState(false);
  const [viewCard, setViewCard] = useState<JobCard | null>(null);
  
  const [availableServices, setAvailableServices] = useState<any[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('job_cards');
    if (saved) {
      setCards(JSON.parse(saved));
    } else {
      setCards([
        { id: 'JC-1001', customerName: 'عبدالله محمد', phone: '0501112233', carType: 'تويوتا كامري', plate: 'أ ح د 1234', mileage: '45000', notes: 'يوجد خدش بالصدام الأمامي قبل الغسيل', status: 'in_progress', photosCount: 4, totalAmount: 150, createdAt: new Date().toISOString(), services: [] }
      ]);
    }
    
    // load services
    const fetchServices = async () => {
      // simulate fetching from supabase or local
      const { createClient } = require('@supabase/supabase-js');
      try {
        const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);
        const { data } = await supabase.from('services').select('*');
        if (data && data.length > 0) {
          setAvailableServices(data);
        } else {
          setAvailableServices([
            { id: '1', name: 'غسيل خارجي', price: 35 },
            { id: '2', name: 'غسيل داخلي وخارجي', price: 50 },
            { id: '3', name: 'غسيل بخار', price: 80 },
            { id: '4', name: 'تلميع ساطع', price: 250 },
          ]);
        }
      } catch(e) {
        setAvailableServices([
            { id: '1', name: 'غسيل خارجي', price: 35 },
            { id: '2', name: 'غسيل داخلي وخارجي', price: 50 },
            { id: '3', name: 'غسيل بخار', price: 80 },
            { id: '4', name: 'تلميع ساطع', price: 250 },
        ]);
      }
    };
    fetchServices();
  }, []);

  const saveCards = (newCards: JobCard[]) => {
    setCards(newCards);
    localStorage.setItem('job_cards', JSON.stringify(newCards));
  };

  const [form, setForm] = useState({
    customerName: '',
    phone: '',
    carType: '',
    plate: '',
    mileage: '',
    notes: '',
    selectedServices: [] as any[],
    photosCount: 0
  });

  const handleCreate = () => {
    const totalAmount = form.selectedServices.reduce((sum, s) => sum + s.price, 0);
    const newCard: JobCard = {
      id: \`JC-\${Math.floor(1000 + Math.random() * 9000)}\`,
      ...form,
      status: 'received',
      totalAmount,
      services: form.selectedServices,
      createdAt: new Date().toISOString()
    };
    saveCards([newCard, ...cards]);
    setShowAdd(false);
    setForm({ customerName: '', phone: '', carType: '', plate: '', mileage: '', notes: '', selectedServices: [], photosCount: 0 });
  };

  const handleChangeStatus = (id: string, newStatus: 'received' | 'in_progress' | 'paid', cardTotal: number) => {
    saveCards(cards.map(c => c.id === id ? { ...c, status: newStatus } : c));
    
    if (newStatus === 'paid') {
      // Add to income
      try {
        const savedTrans = localStorage.getItem('accounts_transactions');
        const transactions = savedTrans ? JSON.parse(savedTrans) : [];
        transactions.push({
          id: Date.now().toString(),
          date: new Date().toISOString(),
          description: \`إيراد غسيل - كرت \${id}\`,
          type: 'in',
          paymentMethod: 'pos',
          amount: cardTotal
        });
        localStorage.setItem('accounts_transactions', JSON.stringify(transactions));
      } catch(e) {}
    }
    setViewCard(null);
  };

  const filteredCards = cards.filter(c => c.status === activeFilter);

  const toggleService = (srv: any) => {
    if (form.selectedServices.find(s => s.id === srv.id)) {
      setForm({ ...form, selectedServices: form.selectedServices.filter(s => s.id !== srv.id) });
    } else {
      if (form.selectedServices.length >= 10) return; // Max 10
      setForm({ ...form, selectedServices: [...form.selectedServices, srv] });
    }
  };

  const formTotal = form.selectedServices.reduce((sum, s) => sum + s.price, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="كروت العمل"
        subtitle="إنشاء ومتابعة كروت الفحص والخدمات للسيارات"
        action={
          <Button onClick={() => setShowAdd(true)} className="bg-cyan-600 hover:bg-cyan-700 font-bold">
            <Plus className="w-4 h-4 ml-2" /> كرت عمل جديد
          </Button>
        }
      />
      
      {/* Tabs Outside the Card */}
      <div className="flex bg-slate-100 p-1 rounded-xl w-full max-w-lg">
        <button onClick={() => setActiveFilter('received')} className={\`flex-1 py-2.5 text-sm font-bold rounded-lg transition-colors \${activeFilter === 'received' ? 'bg-white shadow-sm text-cyan-800' : 'text-slate-500 hover:bg-slate-200/50'}\`}>تم الاستلام</button>
        <button onClick={() => setActiveFilter('in_progress')} className={\`flex-1 py-2.5 text-sm font-bold rounded-lg transition-colors \${activeFilter === 'in_progress' ? 'bg-white shadow-sm text-cyan-800' : 'text-slate-500 hover:bg-slate-200/50'}\`}>جاري العمل</button>
        <button onClick={() => setActiveFilter('paid')} className={\`flex-1 py-2.5 text-sm font-bold rounded-lg transition-colors \${activeFilter === 'paid' ? 'bg-white shadow-sm text-cyan-800' : 'text-slate-500 hover:bg-slate-200/50'}\`}>تم الدفع</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCards.map(card => (
          <Card key={card.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer border-t-4 border-t-cyan-500" onClick={() => setViewCard(card)}>
            <CardBody className="p-5 relative">
              <div className={\`absolute top-4 left-4 text-xs font-bold px-2 py-1 rounded-md \${card.status === 'received' ? 'bg-amber-100 text-amber-800' : card.status === 'in_progress' ? 'bg-cyan-100 text-cyan-800' : 'bg-emerald-100 text-emerald-800'}\`}>
                {card.status === 'received' ? 'تم الاستلام' : card.status === 'in_progress' ? 'جاري العمل' : 'تم الدفع'}
              </div>
              <div className="flex justify-between items-start mb-4">
                <div className="font-mono font-bold text-slate-500">{card.id}</div>
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-1">{card.carType}</h3>
              <div className="flex gap-2 mb-4">
                <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200">{card.plate}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600 mb-4 border-t border-slate-100 pt-4">
                <UserCircle className="w-4 h-4" /> {card.customerName} - {card.phone}
              </div>
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                  <Camera className="w-3.5 h-3.5" /> {card.photosCount} صور مرفقة
                </div>
                <div className="font-black text-cyan-700">{card.totalAmount} ريال</div>
              </div>
            </CardBody>
          </Card>
        ))}
        {filteredCards.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <ListChecks className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">لا توجد كروت عمل بهذه الحالة</p>
          </div>
        )}
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="إنشاء كرت عمل" size="lg">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <h4 className="font-bold text-slate-800 border-b pb-2">بيانات العميل</h4>
              <div><Label>اسم العميل *</Label><Input value={form.customerName} onChange={e => setForm({...form, customerName: e.target.value})} /></div>
              <div><Label>رقم الجوال *</Label><Input dir="ltr" className="text-left" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="05XXXXXXXX" /></div>
            </div>
            <div className="space-y-4">
              <h4 className="font-bold text-slate-800 border-b pb-2">بيانات المركبة</h4>
              <div><Label>نوع السيارة وموديلها *</Label><Input value={form.carType} onChange={e => setForm({...form, carType: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>رقم اللوحة</Label><Input value={form.plate} onChange={e => setForm({...form, plate: e.target.value})} /></div>
                <div><Label>الممشى (كم)</Label><Input type="number" value={form.mileage} onChange={e => setForm({...form, mileage: e.target.value})} /></div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-xl border border-slate-200">
             <Label className="flex items-center gap-2 text-slate-800 mb-3 font-bold">
               <ListChecks className="w-5 h-5 text-cyan-600" /> الخدمات المطلوبة (الحد الأقصى 10)
             </Label>
             <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
               {availableServices.map(srv => {
                 const isSelected = form.selectedServices.find(s => s.id === srv.id);
                 return (
                   <div key={srv.id} onClick={() => toggleService(srv)} className={\`p-3 border rounded-xl cursor-pointer flex justify-between items-center transition-colors \${isSelected ? 'bg-cyan-50 border-cyan-400' : 'bg-slate-50 border-slate-200 hover:border-cyan-300'}\`}>
                     <div className="flex flex-col">
                       <span className={\`text-sm font-bold \${isSelected ? 'text-cyan-900' : 'text-slate-700'}\`}>{srv.name}</span>
                       <span className="text-xs text-slate-500">{srv.price} ريال شامل الضريبة</span>
                     </div>
                     {isSelected && <CheckCircle2 className="w-5 h-5 text-cyan-600" />}
                   </div>
                 );
               })}
             </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
             <Label className="flex items-center gap-2 text-slate-800 mb-3 font-bold">
               <Camera className="w-5 h-5 text-cyan-600" /> تصوير وفحص السيارة المباشر
             </Label>
             <div className="grid grid-cols-5 gap-2">
                {[1,2,3,4,5,6,7,8,9,10].map(i => (
                  <label key={i} className="aspect-square bg-white border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 hover:border-cyan-400 hover:text-cyan-600 cursor-pointer transition-colors relative overflow-hidden">
                     <Camera className="w-5 h-5 mb-1" />
                     <span className="text-[10px]">التقط {i}</span>
                     <input type="file" accept="image/*" capture="environment" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                           setForm({...form, photosCount: form.photosCount + 1});
                           // in a real app, upload it and set background image
                           e.target.parentElement!.classList.add('bg-cyan-100');
                        }
                     }} />
                  </label>
                ))}
             </div>
          </div>
          <div>
             <Label>ملاحظات الاستلام (خدوش، طلبات خاصة...)</Label>
             <Input value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="سجل حالة السيارة من الخارج والداخل..." />
          </div>
          <div className="flex items-center justify-between p-4 bg-cyan-50 rounded-xl border border-cyan-100">
             <span className="font-bold text-cyan-900">إجمالي الفاتورة المتوقع (شامل الضريبة):</span>
             <span className="text-2xl font-black text-cyan-700">{formTotal} ريال</span>
          </div>
          <Button onClick={handleCreate} disabled={!form.customerName || !form.phone || !form.carType || formTotal === 0} className="w-full h-12 text-lg font-bold">
            حفظ وإنشاء الكرت
          </Button>
        </div>
      </Modal>

      <Modal open={!!viewCard} onClose={() => setViewCard(null)} title={\`تفاصيل كرت العمل - \${viewCard?.id}\`} size="md">
        {viewCard && (
          <div className="space-y-6">
             <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
               <div className="flex justify-between">
                 <span className="text-slate-500">العميل:</span>
                 <span className="font-bold text-slate-900">{viewCard.customerName}</span>
               </div>
               <div className="flex justify-between">
                 <span className="text-slate-500">الجوال:</span>
                 <span className="font-bold font-mono text-slate-900">{viewCard.phone}</span>
               </div>
               <div className="flex justify-between">
                 <span className="text-slate-500">السيارة:</span>
                 <span className="font-bold text-slate-900">{viewCard.carType} ({viewCard.plate})</span>
               </div>
               {viewCard.services && viewCard.services.length > 0 && (
                 <div className="mt-3 pt-3 border-t border-slate-200">
                   <p className="text-xs font-bold text-slate-700 mb-2">الخدمات المطلوبة:</p>
                   <ul className="space-y-1">
                     {viewCard.services.map((s, idx) => (
                       <li key={idx} className="flex justify-between text-sm">
                         <span>{s.name}</span>
                         <span className="font-bold">{s.price} ريال</span>
                       </li>
                     ))}
                   </ul>
                   <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-200 font-black">
                     <span>الإجمالي</span>
                     <span className="text-cyan-700">{viewCard.totalAmount} ريال</span>
                   </div>
                 </div>
               )}
               {viewCard.notes && (
                 <div className="mt-3 pt-3 border-t border-slate-200">
                   <p className="text-xs font-bold text-rose-600 mb-1">ملاحظات الفحص:</p>
                   <p className="text-sm text-slate-700">{viewCard.notes}</p>
                 </div>
               )}
             </div>
             
             {viewCard.status === 'received' && (
               <div className="pt-4 border-t border-slate-100">
                 <Button onClick={() => handleChangeStatus(viewCard.id, 'in_progress', viewCard.totalAmount)} className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-white font-bold text-base shadow-lg shadow-amber-900/20">
                   <Clock className="w-5 h-5 ml-2" /> بدء العمل (تغيير الحالة)
                 </Button>
               </div>
             )}

             {viewCard.status === 'in_progress' && (
               <div className="pt-4 border-t border-slate-100">
                 <Button onClick={() => handleChangeStatus(viewCard.id, 'paid', viewCard.totalAmount)} className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-lg shadow-emerald-900/20">
                   <CheckCircle2 className="w-5 h-5 ml-2" /> تم الدفع / إنهاء وتسليم
                 </Button>
                 <p className="text-xs text-center text-slate-400 mt-3">سيتم إصدار فاتورة وإدخالها في إيرادات اليوم وإشعار العميل.</p>
               </div>
             )}

             {viewCard.status === 'paid' && (
               <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
                 <Button variant="outline" className="h-12 border-emerald-200 text-emerald-700 hover:bg-emerald-50 bg-emerald-50/50">
                   <Send className="w-4 h-4 ml-2" /> إرسال الفاتورة
                 </Button>
                 <Button variant="outline" className="h-12">
                   <Printer className="w-4 h-4 ml-2" /> طباعة الفاتورة
                 </Button>
               </div>
             )}
          </div>
        )}
      </Modal>
    </div>
  );
}
`;
fs.writeFileSync('src/pages/JobCardsPage.tsx', code);
