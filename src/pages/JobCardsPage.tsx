import { useState, useEffect } from 'react';
import { PageHeader, Card, CardBody, Button, Input, Label, Modal, Textarea } from '@/components/ui';
import { ComprehensiveDashboard } from '@/components/ComprehensiveDashboard';
import { Plus, Car, UserCircle, Camera, CheckCircle2, Printer, Send, Clock, Check, ListChecks } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { mergeCustomerLists, saveLocalCustomer } from '@/lib/customerStore';
import { getTenantProducts } from '@/lib/productStore';
import { consumeSubscriptionWash, getTenantCustomerSubscriptions } from '@/lib/subscriptionStore';
import { useAuth, usePermissions } from '@/lib/auth';
import type { Customer } from '@/lib/types';
import { Search, X, MessageCircle } from 'lucide-react';

type JobStatus = 'waiting' | 'in_progress' | 'completed' | 'paid' | 'delivered';

interface JobCard {
  id: string;
  customerId?: string;
  customerName: string;
  phone: string;
  carType: string;
  plate: string;
  mileage: string;
  notes: string;
  status: JobStatus;
  photosCount: number;
  totalAmount: number;
  createdAt: string;
  services: any[];
}

export function JobCardsPage() {
  const { organization, settings } = useAuth();
  const { can } = usePermissions();
  const currentTenantId = organization?.id || 'org_client_01';
  const [cards, setCards] = useState<JobCard[]>([]);
  const [activeTab, setActiveTab] = useState<'list' | 'dashboard'>('list');
  const [activeFilter, setActiveFilter] = useState<JobStatus>('in_progress');
  const [showAdd, setShowAdd] = useState(false);
  const [viewCard, setViewCard] = useState<JobCard | null>(null);
  
  const [availableServices, setAvailableServices] = useState<any[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customItem, setCustomItem] = useState({ name: '', price: '' });

  useEffect(() => {
    const saved = localStorage.getItem(`job_cards_${currentTenantId}`);
    if (saved) {
      setCards(JSON.parse(saved));
    } else {
      setCards([
        { id: 'JC-1001', customerId: 'c-1', customerName: 'عبدالله محمد الشمري', phone: '0501112233', carType: 'تويوتا كامري 2023', plate: 'أ ح د 1234', mileage: '45000', notes: 'يوجد خدش بسيط في الصدام الأمامي الأيمن قبل البدء', status: 'in_progress', photosCount: 4, totalAmount: 125, createdAt: new Date(Date.now() - 3600000 * 3).toISOString(), services: [{ name: 'غسيل شامل وساطع VIP', price: 75 }, { name: 'معطر جو فاخر واكس', price: 50 }] },
        { id: 'JC-1002', customerId: 'c-4', customerName: 'سعد القحطاني', phone: '0554445566', carType: 'نيسان باترول 2024', plate: 'ث ج ح 4444', mileage: '12000', notes: 'طلب التركيز على تلميع الجنوط والمراتب الجلدية', status: 'completed', photosCount: 6, totalAmount: 350, createdAt: new Date(Date.now() - 3600000 * 24).toISOString(), services: [{ name: 'تلميع ساطع نانو سيراميك', price: 350 }] },
        { id: 'JC-1003', customerId: 'c-2', customerName: 'فيصل عبدالرحمن الدوسري', phone: '0562223344', carType: 'مرسيدس E-Class 2022', plate: 'ب ت ث 2222', mileage: '38000', notes: 'خصم غسلة كرت العمل من رصيد الاشتراك الفعال', status: 'paid', photosCount: 3, totalAmount: 0, createdAt: new Date(Date.now() - 3600000 * 48).toISOString(), services: [{ name: 'غسيل VIP مخصوم من الاشتراك', price: 0 }] },
      ]);
    }
    
    // load services & customers
    const fetchServices = async () => {
      try {
        const prods = await getTenantProducts(currentTenantId);
        setAvailableServices(prods.filter(p => p.active !== false));
        
        setCustomers(mergeCustomerLists([], currentTenantId));
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
  }, [currentTenantId]);

  const saveCards = (newCards: JobCard[]) => {
    setCards(newCards);
    localStorage.setItem(`job_cards_${currentTenantId}`, JSON.stringify(newCards));
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
    // Sync customer
    const custId = selectedCustomerId || `cust-${Date.now()}`;
    const newCust = {
      id: custId,
      name: form.customerName,
      phone: form.phone,
      plate_number: form.plate,
      vehicle_type: form.carType,
      created_at: new Date().toISOString()
    };
    saveLocalCustomer(newCust as any, currentTenantId);
    setCustomers(mergeCustomerLists([], currentTenantId));

    const totalAmount = form.selectedServices.reduce((sum, s) => sum + s.price, 0);
    const newCard: JobCard = {
      id: `JC-${Math.floor(1000 + Math.random() * 9000)}`,
      customerId: custId,
      ...form,
      status: 'waiting',
      totalAmount,
      services: form.selectedServices,
      createdAt: new Date().toISOString()
    };
    saveCards([newCard, ...cards]);
    setShowAdd(false);
    setForm({ customerName: '', phone: '', carType: '', plate: '', mileage: '', notes: '', selectedServices: [], photosCount: 0 });
  };

  const sendWhatsApp = (phone: string, template?: string) => {
    if (!template || !phone) return;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(template)}`;
    window.open(url, '_blank');
  };

  const handleChangeStatus = (id: string, newStatus: JobStatus, cardTotal: number, paymentMethod: string = 'pos') => {
    saveCards(cards.map(c => c.id === id ? { ...c, status: newStatus } : c));
    
    if (newStatus === 'paid') {
      if (paymentMethod === 'subscription') {
         const cSubs = getTenantCustomerSubscriptions(currentTenantId);
         const cSub = cSubs.find(s => s.customer_name === viewCard?.customerName || s.plate_number === viewCard?.plate);
         if (cSub) {
            consumeSubscriptionWash(cSub.id, `غسيل كرت عمل ${id}`, currentTenantId);
         } else {
            alert('لا يوجد اشتراك فعال لهذا العميل. تم التسجيل كاشتراك ولكن يرجى مراجعة الرصيد.');
         }
      }
      try {
        const savedTrans = localStorage.getItem(`accounts_transactions_${currentTenantId}`);
        const transactions = savedTrans ? JSON.parse(savedTrans) : [];
        transactions.push({
          id: Date.now().toString(),
          date: new Date().toISOString(),
          description: `إيراد غسيل - كرت ${id}`,
          type: 'in',
          paymentMethod: paymentMethod,
          amount: cardTotal
        });
        localStorage.setItem(`accounts_transactions_${currentTenantId}`, JSON.stringify(transactions));

        // Save as a unified sale
        const savedSales = localStorage.getItem(`tenant_sales_${currentTenantId}`);
        const sales = savedSales ? JSON.parse(savedSales) : [];
        
        const saleItems = (viewCard.services || []).map((s: any) => ({
          item_id: s.id,
          name: s.name,
          qty: 1,
          price: s.price,
          total: s.price,
          type: 'service'
        }));
        
        sales.push({
          id: `sale-${Date.now()}`,
          created_at: new Date().toISOString(),
          total: cardTotal,
          subtotal: cardTotal,
          tax: 0,
          payment_method: paymentMethod,
          items: saleItems,
          customer_id: '',
          customer_name: viewCard.customerName,
          source: 'job_card'
        });
        localStorage.setItem(`tenant_sales_${currentTenantId}`, JSON.stringify(sales));

      } catch(e) {}
    }
    setViewCard(null);
  };

  const filteredCards = cards.filter(c => c.status === activeFilter);

  
  const generateReceiptPDF = async (card: JobCard, type: 'receipt' | 'invoice') => {
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      
      // Basic text-based PDF for speed and zero dependencies on html2canvas
      doc.addFont('Amiri', 'Amiri', 'normal'); // We would need Arabic font, but let's use default or simple
      doc.setFontSize(20);
      doc.text(settings?.company_name || 'Raqam POS', 105, 20, { align: 'center' });
      doc.setFontSize(16);
      doc.text(type === 'receipt' ? 'تقرير استلام سيارة' : 'فاتورة نهائية', 105, 30, { align: 'center' });
      
      doc.setFontSize(12);
      doc.text(`Customer: ${card.customerName}`, 20, 50);
      doc.text(`Phone: ${card.phone}`, 20, 60);
      doc.text(`Car: ${card.carType} - ${card.plate}`, 20, 70);
      doc.text(`Job Card #: ${card.id}`, 20, 80);
      doc.text(`Date: ${new Date(card.createdAt).toLocaleString('ar-SA')}`, 20, 90);
      
      doc.text(`Services:`, 20, 110);
      let y = 120;
      card.services.forEach((s: any) => {
         doc.text(`- ${s.name} (${s.price} SAR)`, 30, y);
         y += 10;
      });
      
      doc.text(`Total: ${card.totalAmount} SAR`, 20, y + 10);
      
      doc.save(`JobCard_${card.id}_${type}.pdf`);
      
      alert('تم إنشاء وتنزيل ملف PDF بنجاح. يمكنك الآن إرفاقه في الواتساب إذا رغبت.');
    } catch(e) {
      console.error('PDF generation failed', e);
      alert('حدث خطأ أثناء إنشاء PDF');
    }
  };

  const handleWhatsAppWithPDF = async (card: JobCard, type: 'receipt' | 'invoice') => {
    await generateReceiptPDF(card, type);
    const msg = type === 'receipt' ? `مرحباً ${card.customerName}،
تم استلام سيارتك (${card.carType} - ${card.plate}) بنجاح.
رقم الكرت: ${card.id}
(تجدون تقرير الاستلام مرفقاً)` : `مرحباً ${card.customerName}،
تم الانتهاء من العمل على سيارتك (${card.carType} - ${card.plate}).
إجمالي الفاتورة: ${card.totalAmount} ريال.
(تجدون الفاتورة النهائية مرفقة)`;
    const url = `https://wa.me/${card.phone.replace(/^0/, '966')}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };
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
          can('workcards.create') ? (
            <Button onClick={() => setShowAdd(true)} className="bg-primary-600 hover:bg-primary-700 font-bold">
              <Plus className="w-4 h-4 ml-2" /> كرت عمل جديد
            </Button>
          ) : undefined
        }
      />
      
      <div className="flex bg-surface-100 p-1 rounded-xl w-full max-w-sm mb-6">
        <button onClick={() => setActiveTab('list')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'list' ? 'bg-white shadow-sm text-primary-800' : 'text-surface-500 hover:bg-surface-200/50'}`}>الكروت</button>
        <button onClick={() => setActiveTab('dashboard')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'dashboard' ? 'bg-white shadow-sm text-primary-800' : 'text-surface-500 hover:bg-surface-200/50'}`}>لوحة المؤشرات</button>
      </div>

      {activeTab === 'list' && (
      <>
      {/* Tabs Outside the Card */}
      <div className="flex flex-wrap gap-2 bg-surface-100 p-1 rounded-xl w-full">
        <button onClick={() => setActiveFilter('waiting')} className={`flex-1 py-2 text-xs md:text-sm font-bold rounded-lg transition-colors ${activeFilter === 'waiting' ? 'bg-white shadow-sm text-primary-800' : 'text-surface-500 hover:bg-surface-200/50'}`}>الانتظار</button>
        <button onClick={() => setActiveFilter('in_progress')} className={`flex-1 py-2 text-xs md:text-sm font-bold rounded-lg transition-colors ${activeFilter === 'in_progress' ? 'bg-white shadow-sm text-primary-800' : 'text-surface-500 hover:bg-surface-200/50'}`}>جاري العمل</button>
        <button onClick={() => setActiveFilter('completed')} className={`flex-1 py-2 text-xs md:text-sm font-bold rounded-lg transition-colors ${activeFilter === 'completed' ? 'bg-white shadow-sm text-primary-800' : 'text-surface-500 hover:bg-surface-200/50'}`}>مكتمل</button>
        <button onClick={() => setActiveFilter('paid')} className={`flex-1 py-2 text-xs md:text-sm font-bold rounded-lg transition-colors ${activeFilter === 'paid' ? 'bg-white shadow-sm text-primary-800' : 'text-surface-500 hover:bg-surface-200/50'}`}>تم الدفع</button>
        <button onClick={() => setActiveFilter('delivered')} className={`flex-1 py-2 text-xs md:text-sm font-bold rounded-lg transition-colors ${activeFilter === 'delivered' ? 'bg-white shadow-sm text-primary-800' : 'text-surface-500 hover:bg-surface-200/50'}`}>تم التسليم</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCards.map(card => (
          <Card key={card.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer border-t-4 border-t-primary-500" onClick={() => setViewCard(card)}>
            <CardBody className="p-5 relative">
              <div className={`absolute top-4 left-4 text-xs font-bold px-2 py-1 rounded-md ${card.status === 'waiting' ? 'bg-amber-100 text-amber-800' : card.status === 'in_progress' ? 'bg-primary-100 text-primary-800' : card.status === 'completed' ? 'bg-indigo-100 text-indigo-800' : card.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-surface-200 text-surface-800'}`}>
                {card.status === 'waiting' ? 'الانتظار' : card.status === 'in_progress' ? 'جاري العمل' : card.status === 'completed' ? 'مكتمل' : card.status === 'paid' ? 'تم الدفع' : 'تم التسليم'}
              </div>
              <div className="flex justify-between items-start mb-4">
                <div className="font-mono font-bold text-surface-500">{card.id}</div>
              </div>
              <h3 className="text-lg font-black text-surface-900 mb-1">{card.carType}</h3>
              <div className="flex gap-2 mb-4">
                <span className="text-xs font-mono bg-surface-100 text-surface-600 px-2 py-1 rounded border border-surface-200">{card.plate}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-surface-600 mb-4 border-t border-surface-100 pt-4">
                <UserCircle className="w-4 h-4" /> {card.customerName} - {card.phone}
              </div>
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                  <Camera className="w-3.5 h-3.5" /> {card.photosCount} صور مرفقة
                </div>
                <div className="font-black text-primary-700">{card.totalAmount} ريال</div>
              </div>
            </CardBody>
          </Card>
        ))}
        {filteredCards.length === 0 && (
          <div className="col-span-full py-12 text-center text-surface-400 bg-surface-50 rounded-2xl border-2 border-dashed border-surface-200">
            <ListChecks className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">لا توجد كروت عمل بهذه الحالة</p>
          </div>
        )}
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="إنشاء كرت عمل" size="lg">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <h4 className="font-bold text-surface-800 border-b pb-2">بيانات العميل</h4>
                              {!selectedCustomerId ? (
                 <div className="relative">
                   <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-surface-400" />
                   <Input placeholder="ابحث باسم العميل أو الجوال" value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} className="pr-10" />
                   {customerSearch && (
                     <div className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-surface-200 bg-white absolute z-10 w-full shadow-lg">
                       {customers.filter(c => c.name.includes(customerSearch) || (c.phone ?? '').includes(customerSearch)).slice(0, 5).map(c => (
                         <button key={c.id} onClick={() => { 
                             setSelectedCustomerId(c.id); 
                             setForm({...form, customerName: c.name, phone: c.phone || '', plate: c.plate_number || '', carType: c.vehicle_type ? c.vehicle_type + ' ' + (c.vehicle_brand || '') + ' ' + (c.vehicle_model || '') : ''}); 
                             setCustomerSearch(''); 
                         }} className="w-full text-right px-3 py-2 hover:bg-surface-50 border-b border-surface-50 last:border-0">
                           <p className="text-sm font-medium text-surface-700">{c.name}</p>
                           <p className="text-xs text-surface-400">{c.phone}</p>
                         </button>
                       ))}
                       {customers.filter(c => c.name.includes(customerSearch) || (c.phone ?? '').includes(customerSearch)).length === 0 && (
                         <div className="p-3 text-sm text-center text-surface-500">لا يوجد عميل بهذا الاسم. يرجى إضافته من إدارة العملاء.</div>
                       )}
                     </div>
                   )}
                 </div>
               ) : (
                 <div className="flex items-center justify-between p-3 rounded-xl bg-primary-50 border border-primary-200">
                   <div>
                     <p className="text-sm font-medium text-surface-700">{form.customerName}</p>
                     <p className="text-xs text-surface-500">{form.phone}</p>
                   </div>
                   <button onClick={() => { setSelectedCustomerId(''); setForm({...form, customerName: '', phone: ''}); }} className="text-xs text-surface-400 hover:text-rose-500"><X className="w-4 h-4" /></button>
                 </div>
               )}
            </div>
            <div className="space-y-4">
              <h4 className="font-bold text-surface-800 border-b pb-2">بيانات المركبة</h4>
              <div><Label>نوع السيارة وموديلها *</Label><Input value={form.carType} onChange={e => setForm({...form, carType: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>رقم اللوحة</Label><Input value={form.plate} onChange={e => setForm({...form, plate: e.target.value})} /></div>
                <div><Label>الممشى (كم)</Label><Input type="number" value={form.mileage} onChange={e => setForm({...form, mileage: e.target.value})} /></div>
              </div>
                         </div>
             
             <div className="mt-4 pt-4 border-t border-surface-100">
                <Label className="mb-2">إضافة صنف/خدمة يدوية</Label>
                <div className="flex gap-2">
                   <div className="flex-1">
                     <Input placeholder="اسم الخدمة" value={customItem.name} onChange={e => setCustomItem({...customItem, name: e.target.value})} />
                   </div>
                   <div className="w-24">
                     <Input type="number" placeholder="السعر" value={customItem.price} onChange={e => setCustomItem({...customItem, price: e.target.value})} />
                   </div>
                   <Button variant="outline" onClick={() => {
                      if (customItem.name && customItem.price) {
                         const srv = { id: 'custom-' + Date.now(), name: customItem.name, price: Number(customItem.price) };
                         setAvailableServices([...availableServices, srv]);
                         setForm({...form, selectedServices: [...form.selectedServices, srv]});
                         setCustomItem({ name: '', price: '' });
                      }
                   }} className="bg-surface-100">إضافة</Button>
                </div>
             </div>
          </div>
          
          <div className="bg-white p-4 rounded-xl border border-surface-200">
             <Label className="flex items-center gap-2 text-surface-800 mb-3 font-bold">
               <ListChecks className="w-5 h-5 text-primary-600" /> الخدمات المطلوبة (الحد الأقصى 10)
             </Label>
             <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
               {availableServices.map(srv => {
                 const isSelected = form.selectedServices.find(s => s.id === srv.id);
                 return (
                   <div key={srv.id} onClick={() => toggleService(srv)} className={`p-3 border rounded-xl cursor-pointer flex justify-between transition-colors h-full ${isSelected ? 'bg-primary-50 border-primary-400' : 'bg-surface-50 border-surface-200 hover:border-primary-300'}`}>
                     <div className="flex flex-col justify-between">
                       <span className={`text-sm font-bold leading-snug break-words ${isSelected ? 'text-primary-900' : 'text-surface-800'}`}>{srv.name}</span>
                       <span className="text-sm font-black text-primary-700 mt-2">{srv.price} ريال</span>
                     </div>
                     {isSelected && <CheckCircle2 className="w-5 h-5 text-primary-600 shrink-0 ml-2" />}
                   </div>
                 );
               })}
             </div>
          </div>

          <div className="bg-surface-50 p-4 rounded-xl border border-surface-200">
             <Label className="flex items-center gap-2 text-surface-800 mb-3 font-bold">
               <Camera className="w-5 h-5 text-primary-600" /> تصوير وفحص السيارة المباشر
             </Label>
             <div className="grid grid-cols-5 gap-2">
                {[1,2,3,4,5,6,7,8,9,10].map(i => (
                  <label key={i} className="aspect-square bg-white border-2 border-dashed border-surface-300 rounded-lg flex flex-col items-center justify-center text-surface-400 hover:border-primary-400 hover:text-primary-600 cursor-pointer transition-colors relative overflow-hidden">
                     <Camera className="w-5 h-5 mb-1" />
                     <span className="text-[10px]">التقط {i}</span>
                     <input type="file" accept="image/*" capture="environment" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                           setForm({...form, photosCount: form.photosCount + 1});
                           e.target.parentElement!.classList.add('bg-primary-100');
                        }
                     }} />
                  </label>
                ))}
             </div>
          </div>
          <div>
             <Label>ملاحظات الاستلام (خدوش، طلبات خاصة...)</Label>
             <Textarea rows={3} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="سجل حالة السيارة من الخارج والداخل..." />
          </div>
          <div className="flex items-center justify-between p-4 bg-primary-50 rounded-xl border border-primary-100">
             <span className="font-bold text-primary-900">إجمالي الفاتورة المتوقع (شامل الضريبة):</span>
             <span className="text-2xl font-black text-primary-700">{formTotal} ريال</span>
          </div>
          <Button onClick={handleCreate} disabled={!selectedCustomerId || !form.carType || formTotal === 0} className="w-full h-12 text-lg font-bold">
            حفظ وإنشاء الكرت
          </Button>
        </div>
      </Modal>

      <Modal open={!!viewCard} onClose={() => setViewCard(null)} title={`تفاصيل كرت العمل - ${viewCard?.id}`} size="md">
        {viewCard && (
          <div className="space-y-6">
             <div className="bg-surface-50 p-4 rounded-2xl border border-surface-100 space-y-3">
               <div className="flex justify-between">
                 <span className="text-surface-500">العميل:</span>
                 <span className="font-bold text-surface-900">{viewCard.customerName}</span>
               </div>
               <div className="flex justify-between">
                 <span className="text-surface-500">الجوال:</span>
                 <span className="font-bold font-mono text-surface-900">{viewCard.phone}</span>
               </div>
               <div className="flex justify-between">
                 <span className="text-surface-500">السيارة:</span>
                 <span className="font-bold text-surface-900">{viewCard.carType} ({viewCard.plate})</span>
               </div>
               {viewCard.services && viewCard.services.length > 0 && (
                 <div className="mt-3 pt-3 border-t border-surface-200">
                   <p className="text-xs font-bold text-surface-700 mb-2">الخدمات المطلوبة:</p>
                   <ul className="space-y-1">
                     {viewCard.services.map((s, idx) => (
                       <li key={idx} className="flex justify-between text-sm">
                         <span>{s.name}</span>
                         <span className="font-bold">{s.price} ريال</span>
                       </li>
                     ))}
                   </ul>
                   <div className="flex justify-between items-center mt-3 pt-2 border-t border-surface-200 font-black">
                     <span>الإجمالي</span>
                     <span className="text-primary-700">{viewCard.totalAmount} ريال</span>
                   </div>
                 </div>
               )}
               {viewCard.notes && (
                 <div className="mt-3 pt-3 border-t border-surface-200">
                   <p className="text-xs font-bold text-rose-600 mb-1">ملاحظات الفحص:</p>
                   <p className="text-sm text-surface-700">{viewCard.notes}</p>
                 </div>
               )}
             </div>
             
             {viewCard.status === 'waiting' && (
               <div className="pt-4 border-t border-surface-100 space-y-3">
                 <div className="grid grid-cols-2 gap-2">
                   <Button onClick={() => generateReceiptPDF(viewCard, 'receipt')} variant="outline" className="border-surface-200 text-surface-700 hover:bg-surface-50 text-xs">
                     <Printer className="w-4 h-4 ml-2" /> تقرير PDF
                   </Button>
                   {can('workcards.whatsapp') && <Button onClick={() => handleWhatsAppWithPDF(viewCard, 'receipt')} variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 text-xs">
                     <MessageCircle className="w-4 h-4 ml-2" /> واتساب
                   </Button>}
                 </div>
                 {can('workcards.status') && <Button onClick={() => handleChangeStatus(viewCard.id, 'in_progress', viewCard.totalAmount)} className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-white font-bold text-base shadow-lg shadow-amber-900/20">
                   <Clock className="w-5 h-5 ml-2" /> بدء العمل (تغيير الحالة)
                 </Button>}
               </div>
             )}

             {viewCard.status === 'in_progress' && (
               <div className="pt-4 border-t border-surface-100 space-y-3">
                 {can('workcards.whatsapp') && <Button onClick={() => sendWhatsApp(viewCard.phone, settings?.whatsapp_in_progress)} variant="outline" className="w-full text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100">
                   <MessageCircle className="w-4 h-4 ml-2" /> إشعار واتساب (جاري العمل)
                 </Button>}
                 {can('workcards.status') && <Button onClick={() => handleChangeStatus(viewCard.id, 'completed', viewCard.totalAmount)} className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base shadow-lg shadow-indigo-900/20">
                   <CheckCircle2 className="w-5 h-5 ml-2" /> تم الانتهاء من العمل
                 </Button>}
               </div>
             )}

             {viewCard.status === 'completed' && (
               <div className="pt-4 border-t border-surface-100 space-y-3">
                 {can('workcards.whatsapp') && <Button onClick={() => sendWhatsApp(viewCard.phone, settings?.whatsapp_completed)} variant="outline" className="w-full text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100">
                   <MessageCircle className="w-4 h-4 ml-2" /> إشعار واتساب (العمل مكتمل)
                 </Button>}
                 {can('workcards.status') && (
                    <div className="bg-surface-50 p-3 rounded-xl border border-surface-100 space-y-2">
                       <Label className="text-sm font-bold text-surface-800 text-center block mb-2">اختر طريقة السداد لإتمام الدفع</Label>
                       <div className="grid grid-cols-5 gap-2">
                          <Button onClick={() => handleChangeStatus(viewCard.id, 'paid', viewCard.totalAmount, 'cash')} className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] px-1">كاش</Button>
                          <Button onClick={() => handleChangeStatus(viewCard.id, 'paid', viewCard.totalAmount, 'card')} className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] px-1">شبكة</Button>
                          <Button onClick={() => handleChangeStatus(viewCard.id, 'paid', viewCard.totalAmount, 'transfer')} className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] px-1">تحويل</Button>
                          <Button onClick={() => handleChangeStatus(viewCard.id, 'paid', viewCard.totalAmount, 'split')} className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] px-1">مقسم</Button>
                          <Button onClick={() => handleChangeStatus(viewCard.id, 'paid', viewCard.totalAmount, 'subscription')} className="bg-purple-600 hover:bg-purple-700 text-white text-[10px] px-1">اشتراك</Button>
</div>
                    </div>
                 )}
               </div>
             )}

             {viewCard.status === 'paid' && (
               <div className="pt-4 border-t border-surface-100 space-y-3">
                 {can('workcards.status') && <Button onClick={() => handleChangeStatus(viewCard.id, 'delivered', viewCard.totalAmount)} className="w-full h-12 bg-surface-800 hover:bg-surface-900 text-white font-bold text-base shadow-lg shadow-surface-900/20">
                   <Car className="w-5 h-5 ml-2" /> تسليم السيارة
                 </Button>}
                 <div className="grid grid-cols-2 gap-3 pt-2">
                   <Button onClick={() => handleWhatsAppWithPDF(viewCard, 'invoice')} variant="outline" className="h-10 border-emerald-200 text-emerald-700 hover:bg-emerald-50 bg-emerald-50/50">
                     <MessageCircle className="w-4 h-4 ml-2" /> واتساب + فاتورة
                   </Button>
                   <Button onClick={() => generateReceiptPDF(viewCard, 'invoice')} variant="outline" className="h-10">
                     <Printer className="w-4 h-4 ml-2" /> طباعة فاتورة PDF
                   </Button>
                 </div>
               </div>
             )}

             {viewCard.status === 'delivered' && (
               <div className="pt-4 border-t border-surface-100 space-y-3">
                 {can('workcards.whatsapp') && <Button onClick={() => sendWhatsApp(viewCard.phone, settings?.whatsapp_delivered)} variant="outline" className="w-full text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100">
                   <MessageCircle className="w-4 h-4 ml-2" /> إشعار واتساب (تم التسليم)
                 </Button>}
                 <div className="p-3 bg-surface-100 text-surface-500 text-center rounded-xl text-sm font-medium">
                    السيارة مسلمة
                 </div>
               </div>
             )}
          </div>
        )}
      </Modal>
      </>
      )}
      
      {activeTab === 'dashboard' && (
        <ComprehensiveDashboard sourceFilter="job_card" title="مؤشرات كروت العمل" />
      )}
    </div>
  );
}
