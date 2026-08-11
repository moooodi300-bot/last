import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Truck, Phone, Users, FileText, CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react';
import { Search, UserPlus, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { mergeCustomerLists, saveLocalCustomer } from '@/lib/customerStore';
import { validateAndCalculateDiscount, incrementDiscountUsage, DiscountCode } from '@/lib/discountStore';
import { getTenantProducts } from '@/lib/productStore';
import { useAuth } from '@/lib/auth';
import type { Customer } from '@/lib/types';
import { PageHeader, Card, CardBody, Button, Input, Select, Badge, Label, Modal } from '@/components/ui';
import { ComprehensiveDashboard } from '@/components/ComprehensiveDashboard';

interface Appointment {
  id: string;
  customerName: string;
  phone: string;
  location: string;
  date: string;
  time: string;
  service: string;
  vehicleId?: string;
  status: 'pending' | 'assigned' | 'completed';
  verificationCode?: string;
}

export function MobilePage() {
  const { organization, settings } = useAuth();
  const currentTenantId = organization?.id || 'org_client_01';
  const [activeTab, setActiveTab] = useState<'cashier' | 'schedule' | 'upcoming' | 'dashboard'>('dashboard');
  
  // Sample Data
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({ customerName: '', phone: '', location: '', date: '', time: '', service: '' });
  const [assignAppId, setAssignAppId] = useState<string | null>(null);
  const [payAppId, setPayAppId] = useState<string | null>(null);
  const [assignVehicleId, setAssignVehicleId] = useState('');

  const handleFinishAppointment = (id: string, paymentMethod: string = 'cash') => {
    setAppointments(appointments.map(a => a.id === id ? {...a, status: 'completed'} : a));
    
    // Create accounting entry
    try {
      const savedTrans = localStorage.getItem(`accounts_transactions_${currentTenantId}`);
      const transactions = savedTrans ? JSON.parse(savedTrans) : [];
      transactions.push({
        id: Date.now().toString(),
        date: new Date().toISOString(),
        description: `إيراد غسيل متنقل - موعد ${id}`,
        type: 'in',
        paymentMethod: paymentMethod,
        amount: 150 // assuming 150 for mobile wash if no total
      });
      localStorage.setItem(`accounts_transactions_${currentTenantId}`, JSON.stringify(transactions));

      // Save as a unified sale
      const savedSales = localStorage.getItem(`tenant_sales_${currentTenantId}`);
      const sales = savedSales ? JSON.parse(savedSales) : [];
      
      const app = appointments.find(a => a.id === id);
      const amount = 150;
      sales.push({
        id: `sale-${Date.now()}`,
        created_at: new Date().toISOString(),
        total: amount,
        subtotal: amount,
        tax: 0,
        payment_method: paymentMethod,
        items: [{
          item_id: 'mobile-wash',
          name: app?.service || 'غسيل متنقل',
          qty: 1,
          price: amount,
          total: amount,
          type: 'service'
        }],
        customer_id: '',
        customer_name: app?.customerName || '',
        source: 'mobile_pos'
      });
      localStorage.setItem(`tenant_sales_${currentTenantId}`, JSON.stringify(sales));

    } catch(e) {}
    
    setPayAppId(null);
  };
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [services, setServices] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [cashierCustId, setCashierCustId] = useState('');
  const [cashierSearch, setCashierSearch] = useState('');
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [discountCode, setDiscountCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountError, setDiscountError] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountCode | null>(null);

  useEffect(() => {
    try {
      const savedApps = localStorage.getItem(`mobile_appointments_${currentTenantId}`);
      if (savedApps) {
        setAppointments(JSON.parse(savedApps));
      } else {
        setAppointments([
          { id: '1', customerName: 'أحمد صالح', phone: '0551112233', location: 'الرياض - حي النرجس', date: '2026-08-01', time: '10:00', service: 'غسيل VIP متنقل', status: 'pending' },
          { id: '2', customerName: 'سارة خالد', phone: '0502223344', location: 'الرياض - حي الملقا', date: '2026-08-01', time: '14:00', service: 'باقة الاشتراك الشهري', status: 'pending' },
        ]);
      }
    } catch(e) {}
    
    try {
      const saved = localStorage.getItem(`mobile_vehicles_${currentTenantId}`);
      if (saved) setVehicles(JSON.parse(saved));
    } catch(e) {}
    setCustomers(mergeCustomerLists([], currentTenantId));
    const loadSrvs = async () => {
       const prods = await getTenantProducts(currentTenantId);
       setServices(prods.filter(p => p.active !== false));
    };
    loadSrvs();
  }, [currentTenantId]);

    const applyDiscount = () => {
    const total = cart.reduce((s, c) => s + (c.price * c.qty), 0);
    if (!discountCode) {
      setDiscountAmount(0);
      setDiscountError('');
      setAppliedDiscount(null);
      return;
    }
    const res = validateAndCalculateDiscount(discountCode, total, currentTenantId);
    if (res.valid && res.discount) {
      setDiscountAmount(res.discountAmount);
      setDiscountError('');
      setAppliedDiscount(res.discount);
    } else {
      setDiscountAmount(0);
      setDiscountError(res.error || '');
      setAppliedDiscount(null);
    }
  };

  const handleBook = () => {
    if (!form.customerName || !form.phone || !form.date || !form.time || !form.location) return;

    // Sync customer
    const custId = selectedCustomerId || `cust-${Date.now()}`;
    const newCust = {
      id: custId,
      name: form.customerName,
      phone: form.phone,
      created_at: new Date().toISOString()
    };
    saveLocalCustomer(newCust as any, currentTenantId);
    setCustomers(mergeCustomerLists([], currentTenantId));

    const vCode = Math.floor(1000 + Math.random() * 9000).toString();
    const newApp: Appointment = {
      id: Math.random().toString(),
      ...form,
      verificationCode: vCode,
      status: 'pending'
    };
    
    const updated = [newApp, ...appointments];
    setAppointments(updated);
    localStorage.setItem(`mobile_appointments_${currentTenantId}`, JSON.stringify(updated));

    setShowAddModal(false);
    setForm({ customerName: '', phone: '', location: '', date: '', time: '', service: '' });
    setSelectedCustomerId('');
    
    // Option to message customer with code
    if (confirm(`تم الحجز برمز التحقق: ${vCode}. هل تريد إرسال الرمز للعميل عبر الواتساب؟`)) {
      window.open(`https://wa.me/${form.phone}?text=مرحباً ${form.customerName}، تم تأكيد حجزك للغسيل المتنقل. رمز التحقق الخاص بك هو: ${vCode}. يرجى إعطاؤه للعامل بعد الانتهاء من الخدمة.`, '_blank');
    }
  };

  const getDayAppointments = (day: number) => appointments.filter(a => new Date(a.date).getDate() === day);

  return (
    <div className="space-y-6">
      <PageHeader 
        title="الغسيل المتنقل والأسطول" 
        subtitle="إدارة الحجوزات والاشتراكات لسيارات الأسطول" 
        action={
          <Button onClick={() => setShowAddModal(true)} className="bg-primary-600 hover:bg-primary-700 font-bold">
            <Calendar className="w-4 h-4 ml-2" /> حجز موعد جديد
          </Button>
        }
      />

      <div className="flex bg-surface-100 p-1 rounded-xl w-full max-w-lg mb-6">
        <button onClick={() => setActiveTab('cashier')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'cashier' ? 'bg-white shadow-sm text-primary-800' : 'text-surface-500 hover:bg-surface-200/50'}`}>كاشير المتنقل</button>
        <button onClick={() => setActiveTab('schedule')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'schedule' ? 'bg-white shadow-sm text-primary-800' : 'text-surface-500 hover:bg-surface-200/50'}`}>جدول الشهر</button>
        <button onClick={() => setActiveTab('upcoming')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'upcoming' ? 'bg-white shadow-sm text-primary-800' : 'text-surface-500 hover:bg-surface-200/50'}`}>أقرب المواعيد</button>
        <button onClick={() => setActiveTab('dashboard')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'dashboard' ? 'bg-white shadow-sm text-primary-800' : 'text-surface-500 hover:bg-surface-200/50'}`}>لوحة المؤشرات</button>
      </div>

      
      {activeTab === 'dashboard' && (
        <ComprehensiveDashboard sourceFilter="mobile_pos" title="مؤشرات الغسيل المتنقل" />
      )}

      {activeTab === 'cashier' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
             <Card>
                <CardBody className="p-4">
                   <h4 className="font-bold text-surface-800 mb-3">تحديد العميل</h4>
                                     {!cashierCustId ? (
                     <div className="relative">
                       <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-surface-400" />
                       <Input placeholder="ابحث باسم العميل أو الجوال" value={cashierSearch} onChange={(e) => setCashierSearch(e.target.value)} className="pr-10" />
                       {cashierSearch && (
                         <div className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-surface-200 bg-white">
                           {customers.filter(c => c.name.includes(cashierSearch) || (c.phone ?? '').includes(cashierSearch)).slice(0, 5).map(c => (
                             <button key={c.id} onClick={() => { setCashierCustId(c.id); setCashierSearch(''); }} className="w-full text-right px-3 py-2 hover:bg-surface-50 border-b border-surface-50 last:border-0">
                               <p className="text-sm font-medium text-surface-700">{c.name}</p>
                               <p className="text-xs text-surface-400">{c.phone}</p>
                             </button>
                           ))}
                           {customers.filter(c => c.name.includes(cashierSearch) || (c.phone ?? '').includes(cashierSearch)).length === 0 && (
                             <div className="p-3 text-sm text-center text-surface-500">لا يوجد عميل بهذا الاسم. يرجى إضافته من إدارة العملاء.</div>
                           )}
                         </div>
                       )}
                     </div>
                   ) : (
                     <div className="flex items-center justify-between p-3 rounded-xl bg-primary-50 border border-primary-200">
                       <div>
                         <p className="text-sm font-medium text-surface-700">{customers.find(c => c.id === cashierCustId)?.name}</p>
                         <p className="text-xs text-surface-500">{customers.find(c => c.id === cashierCustId)?.phone}</p>
                       </div>
                       <button onClick={() => setCashierCustId('')} className="text-xs text-surface-400 hover:text-rose-500"><X className="w-4 h-4" /></button>
                     </div>
                   )}
                </CardBody>
             </Card>
             
             <Card>
                <CardBody className="p-4">
                   <h4 className="font-bold text-surface-800 mb-3">الخدمات المتوفرة</h4>
                   <div className="grid grid-cols-2 gap-3">
                     {services.map(s => {
                        const inCart = cart.find(c => c.id === s.id);
                        return (
                          <div key={s.id} onClick={() => {
                             if (inCart) {
                               setCart(cart.filter(c => c.id !== s.id));
                             } else {
                               setCart([...cart, {...s, qty: 1}]);
                             }
                          }} className={`p-3 border rounded-xl cursor-pointer transition-colors ${inCart ? 'bg-primary-50 border-primary-400' : 'bg-surface-50 border-surface-200 hover:border-primary-300'}`}>
                            <p className={`text-sm font-bold ${inCart ? 'text-primary-900' : 'text-surface-700'}`}>{s.name}</p>
                            <p className="text-xs text-surface-500">{s.price} ريال</p>
                          </div>
                        )
                     })}
                   </div>
                </CardBody>
             </Card>
          </div>
          <div className="lg:col-span-1">
             <Card className="bg-surface-900 border-0 text-white">
                <CardBody className="p-6">
                  <h3 className="font-bold text-lg mb-4">ملخص الفاتورة المتنقلة</h3>
                  <div className="space-y-3 pb-4 border-b border-surface-700">
                    {cart.map(c => (
                      <div key={c.id} className="flex justify-between text-surface-300 text-sm">
                         <span>{c.name}</span>
                         <span>{c.price * c.qty} ريال</span>
                      </div>
                    ))}
                    {cart.length === 0 && <p className="text-surface-500 text-sm">لا توجد خدمات مضافة</p>}
                  </div>
                  <div className="pt-4 mt-4 border-t border-surface-700 space-y-3">
                    <div className="space-y-1">
                      <Label className="text-surface-400 text-xs">كود الخصم</Label>
                      <div className="flex gap-2">
                        <Input value={discountCode} onChange={e => setDiscountCode(e.target.value)} placeholder="أدخل الكود" className="bg-surface-800 text-white border-surface-700 flex-1" />
                        <Button variant="secondary" onClick={applyDiscount} className="px-3 bg-surface-700 hover:bg-surface-600 text-white border-none">تطبيق</Button>
                      </div>
                      {discountError && <p className="text-xs text-rose-500">{discountError}</p>}
                      {appliedDiscount && <p className="text-xs text-emerald-400">تم تطبيق خصم: {discountAmount} ريال</p>}
                    </div>

                    <div className="flex justify-between font-black text-xl text-primary-400 pt-2">
                      <span>الإجمالي</span>
                      <div className="text-left">
                        {appliedDiscount && <div className="text-sm line-through text-surface-500">{cart.reduce((s, c) => s + (c.price * c.qty), 0)} ريال</div>}
                        <span>{cart.reduce((s, c) => s + (c.price * c.qty), 0) - discountAmount} ريال</span>
                      </div>
                    </div>
                  </div>
                  <Button disabled={!cashierCustId || cart.length === 0} onClick={() => {
                     const cartTotal = cart.reduce((s, c) => s + (c.price * c.qty), 0);
                     const finalTotal = cartTotal - discountAmount;
                     const cData = customers.find(c => c.id === cashierCustId);
                     const cName = settings?.company_name || 'المغسلة';
                     let msg = `تم استلام الدفعة بنجاح (بدون سداد مسبق)\nفاتورة غسيل متنقل - ${cName}:\nالعميل: ${cData?.name}\nالإجمالي: ${cartTotal} ريال`;
                     if (appliedDiscount) {
                       msg += `\nخصم (${appliedDiscount.code}): -${discountAmount} ريال\nالصافي: ${finalTotal} ريال`;
                       incrementDiscountUsage(appliedDiscount.code, currentTenantId);
                     }
                     msg += '\nشكراً لكم!';
                     window.open(`https://wa.me/${cData?.phone}?text=${encodeURIComponent(msg)}`, '_blank');
                     setCart([]);
                     setCashierCustId('');
                     setDiscountCode('');
                     setDiscountAmount(0);
                     setAppliedDiscount(null);
                  }} className="w-full mt-6 bg-primary-600 hover:bg-primary-500 font-bold">إصدار الفاتورة وإرسال واتساب</Button>
                </CardBody>
             </Card>
          </div>
        </div>
      )}

      {activeTab === 'schedule' && (
        <Card className="border-0 shadow-sm">
           <CardBody className="p-6">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="font-bold text-lg">أغسطس 2026</h3>
                 <div className="flex gap-2">
                    <button className="p-2 border rounded-lg hover:bg-surface-50"><ChevronRight className="w-4 h-4" /></button>
                    <button className="p-2 border rounded-lg hover:bg-surface-50"><ChevronLeft className="w-4 h-4" /></button>
                 </div>
              </div>
              <div className="grid grid-cols-7 gap-2">
                 {['أحد','إثنين','ثلاثاء','أربعاء','خميس','جمعة','سبت'].map(d => (
                    <div key={d} className="text-center font-bold text-surface-400 text-sm py-2">{d}</div>
                 ))}
                 {Array.from({length: 31}).map((_, i) => {
                    const dayApps = getDayAppointments(i + 1);
                    return (
                      <div key={i} className={`aspect-square p-2 border rounded-xl flex flex-col ${dayApps.length > 0 ? 'bg-primary-50/30 border-primary-100' : 'border-surface-100 bg-white'}`}>
                         <span className={`text-sm font-bold mb-1 ${dayApps.length > 0 ? 'text-primary-700' : 'text-surface-400'}`}>{i + 1}</span>
                         {dayApps.length > 0 && (
                            <div className="mt-auto">
                               <div className="text-[10px] bg-primary-600 text-white font-bold rounded px-1 py-0.5 text-center">
                                 {dayApps.length} موعد
                               </div>
                            </div>
                         )}
                      </div>
                    )
                 })}
              </div>
           </CardBody>
        </Card>
      )}

      {activeTab === 'upcoming' && (
        <Card className="border-0 shadow-sm">
           <CardBody className="p-0">
             <div className="overflow-x-auto">
               <table className="w-full text-right text-sm">
                 <thead className="bg-surface-50">
                   <tr>
                     <th className="py-3 px-4 font-bold text-surface-600">العميل والجوال</th>
                     <th className="py-3 px-4 font-bold text-surface-600">التاريخ والوقت</th>
                     <th className="py-3 px-4 font-bold text-surface-600">الموقع</th>
                     <th className="py-3 px-4 font-bold text-surface-600">الخدمة المطلوبة</th>
                     <th className="py-3 px-4 font-bold text-surface-600">الإجراء</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-surface-100">
                   {appointments.map(app => (
                     <tr key={app.id} className="hover:bg-surface-50 transition-colors">
                       <td className="py-3 px-4">
                         <div className="font-bold text-surface-800">{app.customerName}</div>
                         <div className="text-xs text-surface-500 font-mono mt-0.5">{app.phone}</div>
                       </td>
                       <td className="py-3 px-4">
                         <div className="font-medium text-surface-800">{app.date}</div>
                         <div className="text-xs text-primary-600 font-bold mt-0.5 bg-primary-50 inline-block px-2 py-0.5 rounded">{app.time}</div>
                       </td>
                       <td className="py-3 px-4 text-surface-600">{app.location}</td>
                       <td className="py-3 px-4">
                         <Badge tone="blue">{app.service}</Badge>
                       </td>
                       <td className="py-3 px-4 flex flex-col gap-2">
                         {app.status === 'pending' && (
                           <Button variant="outline" size="sm" onClick={() => setAssignAppId(app.id)} className="text-xs border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100">
                             توجيه للأسطول
                           </Button>
                         )}
                         {app.status === 'assigned' && (
                           <Button variant="outline" size="sm" onClick={() => setPayAppId(app.id)} className="text-xs border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100">
                             <CheckCircle2 className="w-3.5 h-3.5 ml-1" /> إنهاء الموعد
                           </Button>
                         )}
                         {app.status === 'completed' && <span className="text-xs font-bold text-emerald-600">مكتمل</span>}
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           </CardBody>
        </Card>
      )}

      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="حجز موعد غسيل متنقل" size="md">
         <div className="space-y-4">
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-blue-800 text-xs flex items-start gap-2 mb-4">
               <Truck className="w-4 h-4 mt-0.5 shrink-0" />
               <p>قم بتسجيل بيانات الحجز أولاً، ثم يمكنك توجيه الطلب للعامل لاحقاً من قائمة المواعيد.</p>
            </div>
            
            <div className="space-y-3">
               <Label>العميل *</Label>
                              {!selectedCustomerId ? (
                 <div className="relative">
                   <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-surface-400" />
                   <Input placeholder="ابحث باسم العميل أو الجوال" value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} className="pr-10" />
                   {customerSearch && (
                     <div className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-surface-200 bg-white">
                       {customers.filter(c => c.name.includes(customerSearch) || (c.phone ?? '').includes(customerSearch)).slice(0, 5).map(c => (
                         <button key={c.id} onClick={() => { 
                             setSelectedCustomerId(c.id); 
                             setForm({...form, customerName: c.name, phone: c.phone || ''}); 
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
            <div>
               <Label>العنوان الوطني (4 حروف و 4 أرقام) *</Label>
               <Input value={form.location} onChange={e => setForm({...form, location: e.target.value})} placeholder="مثال: ABCD1234" />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div><Label>تاريخ الموعد *</Label><Input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} /></div>
               <div><Label>وقت الموعد *</Label><Input type="time" value={form.time} onChange={e => setForm({...form, time: e.target.value})} /></div>
            </div>
            <div>
               <Label>الخدمة المطلوبة</Label>
               <Select value={form.service} onChange={e => setForm({...form, service: e.target.value})}>
                  <option value="">-- اختر الخدمة --</option>
                  {services.map(s => <option key={s.id} value={s.name}>{s.name} - {s.price} ريال</option>)}
               </Select>
            </div>
            
            <Button onClick={handleBook} disabled={!selectedCustomerId || !form.date || !form.time || !form.location} className="w-full mt-4 bg-primary-600">
               تأكيد الحجز
            </Button>
         </div>
      </Modal>

      <Modal open={!!assignAppId} onClose={() => setAssignAppId(null)} title="توجيه الموعد للأسطول" size="sm">
         <div className="space-y-4">
            <div>
               <Label>اختر المركبة / العامل</Label>
               <Select value={assignVehicleId} onChange={e => setAssignVehicleId(e.target.value)}>
                  <option value="">-- اختر المركبة --</option>
                  {vehicles.map(v => (
                     <option key={v.id} value={v.id}>{v.name} - {v.worker_name}</option>
                  ))}
               </Select>
            </div>
            <Button onClick={() => {
               if (!assignVehicleId) return;
               const app = appointments.find(a => a.id === assignAppId);
               const vehicle = vehicles.find(v => v.id === assignVehicleId);
               if (app && vehicle) {
                  setAppointments(appointments.map(a => a.id === assignAppId ? {...a, status: 'assigned', vehicleId: assignVehicleId} : a));
                  setAssignAppId(null);
                  setAssignVehicleId('');
                  
                  // Send to worker
                  const workerMsg = `موعد غسيل متنقل جديد 🚗\nالعميل: ${app.customerName}\nالجوال: ${app.phone}\nالعنوان الوطني: ${app.location}\nالموعد: ${app.date} الساعة ${app.time}\nالخدمة: ${app.service}\n\nالرجاء طلب رمز التحقق من العميل عند الانتهاء.`;
                  window.open(`https://wa.me/${vehicle.worker_phone}?text=${encodeURIComponent(workerMsg)}`, '_blank');
               }
            }} disabled={!assignVehicleId} className="w-full bg-blue-600 hover:bg-blue-700">
               تأكيد وإرسال للعامل (واتساب)
            </Button>
         </div>
      </Modal>

      <Modal open={!!payAppId} onClose={() => setPayAppId(null)} title="طريقة الدفع وإنهاء الموعد" size="sm">
         <div className="space-y-4">
            <Label className="text-center block mb-2">اختر طريقة السداد</Label>
            <div className="grid grid-cols-2 gap-3">
               <Button onClick={() => handleFinishAppointment(payAppId!, 'cash')} className="bg-emerald-600 hover:bg-emerald-700 text-white">كاش</Button>
               <Button onClick={() => handleFinishAppointment(payAppId!, 'card')} className="bg-emerald-600 hover:bg-emerald-700 text-white">شبكة</Button>
               <Button onClick={() => handleFinishAppointment(payAppId!, 'transfer')} className="bg-emerald-600 hover:bg-emerald-700 text-white">تحويل بنكي</Button>
               <Button onClick={() => handleFinishAppointment(payAppId!, 'split')} className="bg-emerald-600 hover:bg-emerald-700 text-white">مقسم</Button>
            </div>
         </div>
      </Modal>
    </div>
  );
}
