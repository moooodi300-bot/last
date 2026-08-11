import { useEffect, useState } from 'react';
import {
  Plus, Search, Gift, Phone, Car, Download, Calendar, CreditCard, MessageCircle,
  Clock, ChevronLeft, ChevronRight, FileText, ClipboardList, CheckCircle2,
  Printer, Eye, DollarSign, Wallet, Building2, Sparkles, Activity
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getLoyaltyTarget } from '@/lib/costEngine';
import { formatSAR, formatDate, formatDateTime } from '@/lib/format';
import type { Customer, CustomerSubscription, Subscription, Sale } from '@/lib/types';
import {
  Button, Card, CardBody, CardHeader, EmptyState, Input, Modal,
  PageHeader, Spinner, Badge, Label, Select,
} from '@/components/ui';
import { useAuth, usePermissions } from '@/lib/auth';
import { tr } from '@/lib/i18n';
import { mergeCustomerLists, saveLocalCustomer } from '@/lib/customerStore';
import { getTenantCustomerSubscriptions, consumeSubscriptionWash } from '@/lib/subscriptionStore';
import { SAMPLE_SUBSCRIPTIONS, SAMPLE_CUSTOMER_SUBSCRIPTIONS, SAMPLE_SALES } from '@/lib/mockData';

export function CustomersPage() {
  const { lang, settings, organization } = useAuth();
  const { can } = usePermissions();
  const currentTenantId = organization?.id || 'org_client_01';
  const loyaltyTarget = getLoyaltyTarget(settings);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [custSubs, setCustSubs] = useState<CustomerSubscription[]>([]);
  const [customerSales, setCustomerSales] = useState<Sale[]>([]);
  const [customerJobCards, setCustomerJobCards] = useState<any[]>([]);
  const [customerSubsList, setCustomerSubsList] = useState<CustomerSubscription[]>([]);
  const [profileTab, setProfileTab] = useState<'invoices' | 'subscriptions' | 'job_cards' | 'loyalty'>('invoices');
  const [selectedInvoiceModal, setSelectedInvoiceModal] = useState<Sale | null>(null);

  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showProfile, setShowProfile] = useState<string | null>(null);
  const [showSub, setShowSub] = useState<string | null>(null);
  const [newCust, setNewCust] = useState({ name: '', phone: '', plate_number: '', notes: '' });
  const [subForm, setSubForm] = useState({ subscription_id: '', start_date: new Date().toISOString().slice(0, 10), car_type: '', car_color: '', plate_number: '', manual_price: 0, wash_limit: 0 });
  const isRTL = lang === 'ar';

  const loadData = async () => {
    const loadedC = mergeCustomerLists([], currentTenantId);

    const [s, cs] = await Promise.all([
      supabase.from('subscriptions').select('*').eq('active', true),
      supabase.from('customer_subscriptions').select('*'),
    ]);
    const loadedS = (s.data as Subscription[]) ?? [];
    const loadedCS = (cs.data as CustomerSubscription[]) ?? [];

    setCustomers(loadedC);
    setSubs(loadedS.length > 0 ? loadedS : SAMPLE_SUBSCRIPTIONS);
    
    // Merge local/mock tenant customer subscriptions
    const tenantCustSubs = getTenantCustomerSubscriptions(currentTenantId);
    const subMap = new Map<string, CustomerSubscription>();
    loadedCS.forEach(c => subMap.set(c.id, c));
    tenantCustSubs.forEach(c => subMap.set(c.id, c));
    const mergedList = Array.from(subMap.values());

    setCustSubs(mergedList.length > 0 ? mergedList : SAMPLE_CUSTOMER_SUBSCRIPTIONS);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const handleUpdated = () => { loadData(); };
    window.addEventListener('raqam_data_updated', handleUpdated);
    return () => window.removeEventListener('raqam_data_updated', handleUpdated);
  }, [currentTenantId]);

  useEffect(() => {
    if (showProfile) {
      const pCust = customers.find((c) => c.id === showProfile);
      if (!pCust) return;

      // 1. Sales & Invoices
      const storedSales = localStorage.getItem(`tenant_sales_${currentTenantId}`);
      const loadedSales: Sale[] = storedSales ? JSON.parse(storedSales) : [];
      
      const allSales = [...loadedSales, ...SAMPLE_SALES];
      const salesMap = new Map<string, Sale>();
      allSales.forEach((s) => salesMap.set(s.id, s));
      const uniqueSales = Array.from(salesMap.values());

      const filteredSales = uniqueSales.filter((s: any) => {
        if (s.customer_id === pCust.id || s.customer?.id === pCust.id) return true;
        if (pCust.phone && (s.customer_phone === pCust.phone || s.phone === pCust.phone)) return true;
        if (pCust.plate_number && (s.plate_number === pCust.plate_number || s.customer?.plate_number === pCust.plate_number)) return true;
        if (pCust.name && (s.customer_name === pCust.name || s.notes?.includes(pCust.name))) return true;
        return false;
      });

      filteredSales.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setCustomerSales(filteredSales);

      // 2. Job Cards
      const storedJc = localStorage.getItem(`job_cards_${currentTenantId}`);
      const loadedJc: any[] = storedJc ? JSON.parse(storedJc) : [
        { id: 'JC-1001', customerId: 'c-1', customerName: 'عبدالله محمد الشمري', phone: '0501112233', carType: 'تويوتا كامري 2023', plate: 'أ ح د 1234', mileage: '45000', notes: 'يوجد خدش بسيط في الصدام الأمامي الأيمن قبل البدء', status: 'in_progress', photosCount: 4, totalAmount: 125, createdAt: new Date(Date.now() - 3600000 * 3).toISOString(), services: [{ name: 'غسيل شامل وساطع VIP', price: 75 }, { name: 'معطر جو فاخر واكس', price: 50 }] },
        { id: 'JC-1002', customerId: 'c-4', customerName: 'سعد القحطاني', phone: '0554445566', carType: 'نيسان باترول 2024', plate: 'ث ج ح 4444', mileage: '12000', notes: 'طلب التركيز على تلميع الجنوط والمراتب الجلدية', status: 'completed', photosCount: 6, totalAmount: 350, createdAt: new Date(Date.now() - 3600000 * 24).toISOString(), services: [{ name: 'تلميع ساطع نانو سيراميك', price: 350 }] },
        { id: 'JC-1003', customerId: 'c-2', customerName: 'فيصل عبدالرحمن الدوسري', phone: '0562223344', carType: 'مرسيدس E-Class 2022', plate: 'ب ت ث 2222', mileage: '38000', notes: 'خصم غسلة كرت العمل من رصيد الاشتراك الفعال', status: 'paid', photosCount: 3, totalAmount: 0, createdAt: new Date(Date.now() - 3600000 * 48).toISOString(), services: [{ name: 'غسيل VIP مخصوم من الاشتراك', price: 0 }] },
      ];

      const filteredJc = loadedJc.filter((jc: any) => {
        if (jc.customerId === pCust.id) return true;
        if (pCust.phone && jc.phone && jc.phone.replace(/[^0-9]/g, '') === pCust.phone.replace(/[^0-9]/g, '')) return true;
        if (pCust.plate_number && jc.plate && jc.plate.trim() === pCust.plate_number.trim()) return true;
        if (pCust.name && jc.customerName && jc.customerName.includes(pCust.name)) return true;
        return false;
      });
      setCustomerJobCards(filteredJc);

      // 3. Customer Subscriptions
      const allTenantCustSubs = getTenantCustomerSubscriptions(currentTenantId);
      const combinedSubs = [...allTenantCustSubs, ...custSubs];
      const subMap = new Map<string, CustomerSubscription>();
      combinedSubs.forEach(cs => subMap.set(cs.id, cs));
      const uniqueSubsList = Array.from(subMap.values());

      const filteredSubs = uniqueSubsList.filter((cs: any) => {
        if (cs.customer_id === pCust.id) return true;
        if (pCust.phone && cs.customer_phone === pCust.phone) return true;
        if (pCust.plate_number && cs.plate_number === pCust.plate_number) return true;
        if (pCust.name && cs.customer_name === pCust.name) return true;
        return false;
      });
      setCustomerSubsList(filteredSubs);
    }
  }, [showProfile, customers, custSubs, currentTenantId]);

  if (loading) return <Spinner label={tr('loading', lang)} />;

  const filtered = customers.filter(
    (c) => c.name.includes(search) || (c.phone ?? '').includes(search) || (c.plate_number ?? '').includes(search)
  );

  const addCustomer = async () => {
    const trimmedName = newCust.name.trim();
    if (!trimmedName) {
      alert('الرجاء أدخل اسم العميل أولاً');
      return;
    }

    const fallback: Customer = {
      id: 'cust-' + Date.now(),
      name: trimmedName,
      phone: newCust.phone?.trim() || null,
      plate_number: newCust.plate_number?.trim() || null,
      notes: newCust.notes?.trim() || null,
      loyalty_stamps: 0,
      free_washes_earned: 0,
      total_visits: 0,
      created_at: new Date().toISOString(),
    };

    saveLocalCustomer(fallback, currentTenantId);

    try {
      const { data } = await supabase.from('customers').insert({
        name: trimmedName,
        phone: newCust.phone?.trim() || null,
        plate_number: newCust.plate_number?.trim() || null,
        notes: newCust.notes?.trim() || null,
        loyalty_stamps: 0,
        free_washes_earned: 0,
        total_visits: 0,
      }).select().single();

      if (data) {
        const added = data as Customer;
        saveLocalCustomer(added, currentTenantId);
        setCustomers((prev) => [added, ...prev.filter((c) => c.id !== added.id)]);
      } else {
        setCustomers((prev) => [fallback, ...prev]);
      }
    } catch {
      setCustomers((prev) => [fallback, ...prev]);
    }

    setNewCust({ name: '', phone: '', plate_number: '', notes: '' });
    setShowAdd(false);
  };

  const addWashStampToCustomer = async (c: Customer, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newStampsTotal = (c.loyalty_stamps || 0) + 1;
    const earned = Math.floor(newStampsTotal / loyaltyTarget);
    const remStamps = newStampsTotal % loyaltyTarget;
    const newFreeWashes = (c.free_washes_earned || 0) + earned;
    const newVisits = (c.total_visits || 0) + 1;

    const updated: Customer = {
      ...c,
      loyalty_stamps: remStamps,
      free_washes_earned: newFreeWashes,
      total_visits: newVisits,
    };

    saveLocalCustomer(updated, currentTenantId);
    setCustomers((prev) => prev.map((item) => (item.id === c.id ? updated : item)));

    try {
      await supabase.from('customers').update({
        loyalty_stamps: remStamps,
        free_washes_earned: newFreeWashes,
        total_visits: newVisits,
      }).eq('id', c.id);
    } catch {
      /* saved locally */
    }
  };

  const getCustomerSub = (cid: string) => custSubs.find((cs) => cs.customer_id === cid && cs.status === 'active');
  const getSubName = (sid: string) => subs.find((s) => s.id === sid)?.name ?? '';

  const exportCsv = () => {
    const headers = ['Name', 'Phone', 'Plate', 'Loyalty Stamps', 'Free Washes Earned', 'Subscribed', 'Notes', 'Created At'];
    const rows = filtered.map((c) => {
      const sub = getCustomerSub(c.id);
      return [c.name, c.phone ?? '', c.plate_number ?? '', c.loyalty_stamps, c.free_washes_earned, sub ? 'Yes' : 'No', c.notes ?? '', c.created_at].join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'customers.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const addSubscription = async () => {
    if (!showSub || !subForm.subscription_id) return;
    const subDef = subs.find((s) => s.id === subForm.subscription_id);
    if (!subDef) return;
    const targetCust = customers.find((c) => c.id === showSub);
    const endDate = new Date(subForm.start_date);
    endDate.setMonth(endDate.getMonth() + 1);

    const washesIncluded = subForm.wash_limit || subDef.washes_included || 8;
    const price = subForm.manual_price || subDef.monthly_price || 299;
    const saleId = 'inv-sub-' + Date.now();

    const newCs = {
      id: 'csub-' + Date.now(),
      customer_id: showSub,
      subscription_id: subForm.subscription_id,
      package_name_snapshot: subDef.name,
      subscription_type: subDef.subscription_type || 'عدد غسلات + مدة',
      vehicle_scope: subDef.vehicle_scope || 'specific_vehicle',
      start_date: subForm.start_date,
      end_date: endDate.toISOString().slice(0, 10),
      washes_used: 0,
      washes_remaining: washesIncluded,
      total_washes: washesIncluded,
      status: 'active' as const,
      car_type: subForm.car_type || targetCust?.vehicle_type || '',
      car_color: subForm.car_color || targetCust?.vehicle_color || '',
      plate_number: subForm.plate_number || targetCust?.plate_number || '',
      manual_price: price,
      payment_method: 'cash',
      invoice_id: saleId,
      included_services: subDef.included_services || 'غسيل شامل وساطع',
      customer_name: targetCust?.name || 'عميل مشترك',
      customer_phone: targetCust?.phone || '',
    };

    saveTenantCustomerSubscription(newCs as any, currentTenantId);

    // Save sale invoice for revenue and daily sales tracking
    const finalSale: Sale = {
      id: saleId,
      customer_id: showSub,
      staff_id: null,
      branch_id: null,
      customer_subscription_id: newCs.id,
      total: price,
      cash_amount: price,
      card_amount: 0,
      payment_method: 'cash',
      wash_count: 0,
      is_free: false,
      notes: `شراء اشتراك - ${subDef.name} (العميل: ${targetCust?.name || 'عميل'} - ${targetCust?.phone || ''})`,
      is_refund: false,
      refund_amount: 0,
      refund_method: null,
      created_at: new Date().toISOString(),
      subscription_id: subDef.id,
      original_sale_id: null,
    };

    const storedSalesRaw = localStorage.getItem(`tenant_sales_${currentTenantId}`);
    const existingSalesArr: Sale[] = storedSalesRaw ? JSON.parse(storedSalesRaw) : [];
    const updatedSalesList = [finalSale, ...existingSalesArr.filter((s) => s.id !== finalSale.id)];
    localStorage.setItem(`tenant_sales_${currentTenantId}`, JSON.stringify(updatedSalesList));

    try {
      await supabase.from('sales').insert({
        id: finalSale.id,
        customer_id: finalSale.customer_id,
        total: price,
        cash_amount: price,
        card_amount: 0,
        payment_method: 'cash',
        wash_count: 0,
        is_free: false,
        notes: finalSale.notes,
        created_at: finalSale.created_at,
        subscription_id: subDef.id,
      });
      await supabase.from('sale_items').insert([{
        sale_id: finalSale.id,
        service_id: subDef.id,
        service_name: `اشتراك: ${subDef.name}`,
        qty: 1,
        price: price,
        line_total: price,
      }]);
    } catch {}

    window.dispatchEvent(new Event('raqam_data_updated'));
    setShowSub(null);
    setSubForm({ subscription_id: '', start_date: new Date().toISOString().slice(0, 10), car_type: '', car_color: '', plate_number: '', manual_price: 0, wash_limit: 0 });
    await loadData();
  };

  const renewSubscription = async (cs: CustomerSubscription) => {
    const subDef = subs.find((s) => s.id === cs.subscription_id);
    if (!subDef) return;
    const newEnd = new Date(cs.end_date);
    newEnd.setMonth(newEnd.getMonth() + 1);
    const washesIncluded = subDef.washes_included || 8;

    const price = cs.manual_price || subDef.monthly_price || 299;
    const saleId = 'inv-renew-' + Date.now();

    const updatedCs = {
      ...cs,
      end_date: newEnd.toISOString().slice(0, 10),
      washes_used: 0,
      washes_remaining: washesIncluded,
      total_washes: washesIncluded,
      status: 'active' as const,
      invoice_id: saleId,
    };

    saveTenantCustomerSubscription(updatedCs as any, currentTenantId);

    // Save sale invoice for renewal income tracking
    const renewSale: Sale = {
      id: saleId,
      customer_id: cs.customer_id,
      staff_id: null,
      branch_id: null,
      customer_subscription_id: cs.id,
      total: price,
      cash_amount: price,
      card_amount: 0,
      payment_method: 'cash',
      wash_count: 0,
      is_free: false,
      notes: `تجديد اشتراك - ${subDef.name} (العميل: ${cs.customer_name || 'عميل'})`,
      is_refund: false,
      refund_amount: 0,
      refund_method: null,
      created_at: new Date().toISOString(),
      subscription_id: subDef.id,
      original_sale_id: null,
    };

    const storedSalesRaw = localStorage.getItem(`tenant_sales_${currentTenantId}`);
    const existingSalesArr: Sale[] = storedSalesRaw ? JSON.parse(storedSalesRaw) : [];
    const updatedSalesList = [renewSale, ...existingSalesArr.filter((s) => s.id !== renewSale.id)];
    localStorage.setItem(`tenant_sales_${currentTenantId}`, JSON.stringify(updatedSalesList));

    try {
      await supabase.from('sales').insert({
        id: renewSale.id,
        customer_id: renewSale.customer_id,
        total: price,
        cash_amount: price,
        card_amount: 0,
        payment_method: 'cash',
        wash_count: 0,
        is_free: false,
        notes: renewSale.notes,
        created_at: renewSale.created_at,
        subscription_id: subDef.id,
      });
      await supabase.from('sale_items').insert([{
        sale_id: renewSale.id,
        service_id: subDef.id,
        service_name: `تجديد اشتراك: ${subDef.name}`,
        qty: 1,
        price: price,
        line_total: price,
      }]);
    } catch {}

    window.dispatchEvent(new Event('raqam_data_updated'));
    await loadData();
  };

  const shareCustomerWhatsApp = (c: Customer) => {
    if (!c.phone) return;
    const sub = getCustomerSub(c.id);
    const subInfo = sub ? `\n${tr('subscription', lang)}: ${getSubName(sub.subscription_id)} (${sub.washes_remaining} ${tr('remainingWashes', lang)})` : '';
    const msg = `${tr('appName', lang)} — ${tr('customer', lang)}\n${tr('name', lang)}: ${c.name}\n${tr('phone', lang)}: ${c.phone}${c.plate_number ? `\n${tr('plateNumber', lang)}: ${c.plate_number}` : ''}${subInfo}`;
    const phone = c.phone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const profileCustomer = showProfile ? customers.find((c) => c.id === showProfile) : null;
  const profileSub = profileCustomer ? getCustomerSub(profileCustomer.id) : null;
  const profileSubDef = profileSub ? subs.find((s) => s.id === profileSub.subscription_id) : null;

  // Profile view
  if (profileCustomer) {
    const totalCustomerSpent = customerSales.reduce((sum, s) => sum + (s.is_refund ? 0 : Number(s.total || 0)), 0);
    const activeSub = customerSubsList.find((s) => s.status === 'active');
    const activeSubDef = activeSub ? subs.find((s) => s.id === activeSub.subscription_id) : null;

    return (
      <div className="space-y-6">
        {/* Top bar & navigation */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setShowProfile(null)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-surface-200 text-surface-700 hover:bg-surface-50 font-bold text-xs transition-all shadow-2xs"
          >
            {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            <span>العودة لقائمة العملاء</span>
          </button>

          <div className="flex items-center gap-2">
            {profileCustomer.phone && (
              <Button size="sm" variant="secondary" onClick={() => shareCustomerWhatsApp(profileCustomer)} className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
                <MessageCircle className="w-4 h-4" /> <span>واتساب العميل</span>
              </Button>
            )}
            <Button size="sm" onClick={() => setShowSub(profileCustomer.id)} className="bg-primary-700 hover:bg-primary-800 text-white">
              <CreditCard className="w-4 h-4" /> <span>إضافة اشتراك جديد</span>
            </Button>
          </div>
        </div>

        {/* Customer Main Info Header Card */}
        <Card className="border-primary-100 bg-gradient-to-br from-white via-primary-50/20 to-surface-50 shadow-xs">
          <CardBody className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-md"
                  style={{ background: `linear-gradient(135deg, ${settings?.brand_color ?? '#0e7490'}, ${settings?.brand_accent ?? '#2563eb'})` }}
                >
                  {profileCustomer.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-surface-900">{profileCustomer.name}</h2>
                    {activeSub && <Badge tone="cyan" className="font-bold">مشترك فعال 💎</Badge>}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-surface-600 mt-2">
                    {profileCustomer.phone && (
                      <span className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-surface-200">
                        <Phone className="w-3.5 h-3.5 text-primary-600" />
                        <span dir="ltr">{profileCustomer.phone}</span>
                      </span>
                    )}
                    {profileCustomer.plate_number && (
                      <span className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-surface-200">
                        <Car className="w-3.5 h-3.5 text-primary-600" />
                        <span>رقم اللوحة: {profileCustomer.plate_number}</span>
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-surface-400">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>عميل منذ: {formatDate(profileCustomer.created_at, lang)}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Loyalty Widget in Header */}
              <div className="bg-white p-3 rounded-xl border border-surface-200 text-right min-w-[200px] shadow-2xs">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-bold text-surface-500">ختم غسلات الولاء</span>
                  <button
                    type="button"
                    onClick={(e) => addWashStampToCustomer(profileCustomer, e)}
                    className="text-[11px] font-bold text-primary-700 bg-primary-50 hover:bg-primary-100 px-2 py-0.5 rounded-md flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> إضافة ختم
                  </button>
                </div>
                <div className="flex items-center gap-1 my-1.5">
                  {Array.from({ length: loyaltyTarget }).map((_, i) => (
                    <div
                      key={i}
                      className={`flex-1 h-6 rounded flex items-center justify-center text-xs ${
                        i < profileCustomer.loyalty_stamps ? 'bg-primary-600 text-white font-bold' : 'bg-surface-100 text-surface-300'
                      }`}
                    >
                      ★
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-surface-500 font-medium">
                  {profileCustomer.loyalty_stamps}/{loyaltyTarget} ختم — {profileCustomer.free_washes_earned > 0 ? <span className="text-emerald-700 font-bold">{profileCustomer.free_washes_earned} غسلة مجانية مستحقة 🎉</span> : 'غسلة مجانية قادمة عند الاكتمال'}
                </p>
              </div>
            </div>

            {/* KPI Summary Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5 pt-4 border-t border-surface-200/80">
              <div className="bg-white/80 p-3 rounded-xl border border-surface-200/60">
                <p className="text-xs font-bold text-surface-500">إجمالي الإنفاق</p>
                <p className="text-lg font-black text-emerald-700 mt-0.5">{formatSAR(totalCustomerSpent, lang)}</p>
              </div>

              <div className="bg-white/80 p-3 rounded-xl border border-surface-200/60">
                <p className="text-xs font-bold text-surface-500">عدد الفواتير والخدمات</p>
                <p className="text-lg font-black text-primary-800 mt-0.5">{customerSales.length} <span className="text-xs text-surface-400 font-normal">فاتورة</span></p>
              </div>

              <div className="bg-white/80 p-3 rounded-xl border border-surface-200/60">
                <p className="text-xs font-bold text-surface-500">الاشتراكات المسجلة</p>
                <p className="text-lg font-black text-blue-800 mt-0.5">{customerSubsList.length} <span className="text-xs text-surface-400 font-normal">اشتراك</span></p>
              </div>

              <div className="bg-white/80 p-3 rounded-xl border border-surface-200/60">
                <p className="text-xs font-bold text-surface-500">كروت العمل والصيانة</p>
                <p className="text-lg font-black text-indigo-800 mt-0.5">{customerJobCards.length} <span className="text-xs text-surface-400 font-normal">كرت عمل</span></p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Profile Details Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-surface-200 pb-2">
          <button
            type="button"
            onClick={() => setProfileTab('invoices')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              profileTab === 'invoices'
                ? 'bg-primary-700 text-white shadow-xs'
                : 'bg-white text-surface-600 hover:bg-surface-100 border border-surface-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>سجل الفواتير والخدمات ({customerSales.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setProfileTab('subscriptions')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              profileTab === 'subscriptions'
                ? 'bg-primary-700 text-white shadow-xs'
                : 'bg-white text-surface-600 hover:bg-surface-100 border border-surface-200'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>اشتراكات العميل ({customerSubsList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setProfileTab('job_cards')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              profileTab === 'job_cards'
                ? 'bg-primary-700 text-white shadow-xs'
                : 'bg-white text-surface-600 hover:bg-surface-100 border border-surface-200'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>كروت العمل والبطاقات ({customerJobCards.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setProfileTab('loyalty')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              profileTab === 'loyalty'
                ? 'bg-primary-700 text-white shadow-xs'
                : 'bg-white text-surface-600 hover:bg-surface-100 border border-surface-200'
            }`}
          >
            <Gift className="w-4 h-4" />
            <span>نقاط الولاء والخصومات</span>
          </button>
        </div>

        {/* Tab 1: Invoices & Services Provided */}
        {profileTab === 'invoices' && (
          <Card>
            <CardHeader
              title="سجل الفواتير"
              description="يعرض تفاصيل الفواتير الصادرة، أرقامها، نوع الدفع، والخدمات المقدمة"
            />
            <CardBody className="p-0">
              {customerSales.length === 0 ? (
                <div className="p-8">
                  <EmptyState message="لا توجد فواتير أو خدمات مسجلة لهذا العميل حتى الآن" />
                </div>
              ) : (
                <div className="divide-y divide-surface-100">
                  {customerSales.map((s) => (
                    <div key={s.id} className="p-4 hover:bg-surface-50/80 transition-colors flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-[260px]">
                        <div className="w-10 h-10 rounded-xl bg-primary-600/10 text-primary-700 flex items-center justify-center font-bold shrink-0 mt-1">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-surface-900 text-sm">#{s.id}</span>
                            {s.is_refund ? (
                              <Badge tone="rose">فاتورة مرتجعة</Badge>
                            ) : s.payment_method === 'subscription' || s.customer_subscription_id ? (
                              <Badge tone="cyan">خصم من الاشتراك 💎</Badge>
                            ) : s.is_free ? (
                              <Badge tone="emerald">غسلة مجانية 🎁</Badge>
                            ) : (
                              <Badge tone="blue">
                                {s.payment_method === 'cash' ? 'نقداً 💵' : s.payment_method === 'card' ? 'شبكة 💳' : 'دفع متعدد 🔀'}
                              </Badge>
                            )}
                          </div>

                          <p className="text-xs font-semibold text-surface-700 mt-1">
                            {s.notes || (s as any).included_services || 'غسيل وتنظيف سيارة شامل'}
                          </p>

                          <p className="text-[11px] text-surface-400 mt-1 flex items-center gap-2">
                            <span><Clock className="w-3 h-3 inline ml-1" />{formatDateTime(s.created_at, lang)}</span>
                            <span>• {s.wash_count || 1} غسلة</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-left">
                        <div>
                          <p className="text-base font-black text-surface-900">{formatSAR(s.total, lang)}</p>
                          <p className="text-[11px] text-surface-400">شامل الضريبة المضافة 15%</p>
                        </div>

                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setSelectedInvoiceModal(s)}
                          className="bg-white border-surface-200 text-primary-800 hover:bg-primary-50 font-bold"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>عرض / طباعة</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        )}

        {/* Tab 2: Customer Subscriptions */}
        {profileTab === 'subscriptions' && (
          <Card>
            <CardHeader
              title="الاشتراكات"
              description="إدارة اشتراكات العميل المخصصة، رصيد الغسلات المتبقية، وتاريخ انتهاء الصلاحية"
            />
            <CardBody className="p-4">
              {customerSubsList.length === 0 ? (
                <EmptyState message="لا يوجد اشتراكات مسجلة لهذا العميل. يمكنك إضافة اشتراك جديد بسهولة." />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {customerSubsList.map((cs) => {
                    const subDef = subs.find((s) => s.id === cs.subscription_id);
                    const isExpired = new Date(cs.end_date) < new Date();
                    const isActive = cs.status === 'active' && !isExpired;

                    return (
                      <div
                        key={cs.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          isActive
                            ? 'bg-gradient-to-br from-primary-50/50 to-white border-primary-200 shadow-2xs'
                            : 'bg-surface-50 border-surface-200 opacity-80'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-primary-600" />
                            <h3 className="font-bold text-surface-800 text-sm">
                              {cs.package_name_snapshot || subDef?.name || 'باقة غسيل مخصصة'}
                            </h3>
                          </div>
                          <Badge tone={isActive ? 'cyan' : 'gray'}>
                            {isActive ? 'اشتراك نشط 🟢' : isExpired ? 'منتهي الصلاحية 🔴' : 'موقوف ⚪'}
                          </Badge>
                        </div>

                        {/* Progress Bar */}
                        <div className="bg-white p-3 rounded-xl border border-surface-200/80 mb-3 space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-surface-600">الغسلات المتبقية:</span>
                            <span className="text-primary-800 font-black">{cs.washes_remaining} من أصل {cs.total_washes} غسلة</span>
                          </div>
                          <div className="w-full h-2.5 bg-surface-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary-600 rounded-full transition-all"
                              style={{ width: `${Math.min(100, Math.max(0, (cs.washes_remaining / (cs.total_washes || 1)) * 100))}%` }}
                            />
                          </div>
                          <p className="text-[11px] text-surface-400">
                            تم استخدام {cs.washes_used || (cs.total_washes - cs.washes_remaining)} غسلة حتى الآن
                          </p>
                        </div>

                        <div className="space-y-1 text-xs text-surface-600 mb-4">
                          <p><strong>نوع المركبة:</strong> {cs.car_type || profileCustomer.vehicle_type || 'غير محدد'} ({cs.car_color || 'لون غير محدد'})</p>
                          <p><strong>رقم اللوحة:</strong> {cs.plate_number || profileCustomer.plate_number || 'غير مدخل'}</p>
                          <p><strong>تاريخ الاشتراك:</strong> {formatDate(cs.start_date, lang)} إلى {formatDate(cs.end_date, lang)}</p>
                          <p><strong>قيمة الاشتراك:</strong> {formatSAR(cs.manual_price || subDef?.monthly_price || 0, lang)}</p>
                        </div>

                        {isActive && (
                          <div className="flex items-center gap-2 pt-2 border-t border-surface-200">
                            <Button
                              size="sm"
                              onClick={async () => {
                                if (cs.washes_remaining <= 0) {
                                  alert('لا يوجد رصيد غسلات متبقٍ في هذا الاشتراك!');
                                  return;
                                }
                                if (confirm(`تأكيد خصم غسلة واحدة من اشتراك ${cs.package_name_snapshot}؟`)) {
                                  const res = consumeSubscriptionWash(cs.id, 'خصم يدوي من ملف العميل', currentTenantId);
                                  if (res.success) {
                                    alert('تم خصم الغسلة وتسجيل العملية بنجاح! 🚗');
                                    loadData();
                                  } else {
                                    alert(res.message || 'عذراً، تعذر الخصم!');
                                  }
                                }
                              }}
                              className="w-full bg-primary-700 hover:bg-primary-800 text-white font-bold"
                            >
                              خصم غسلة الآن 🚗
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => renewSubscription(cs)}
                              className="shrink-0 border-surface-300"
                            >
                              <Calendar className="w-3.5 h-3.5" /> تجديد
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardBody>
          </Card>
        )}

        {/* Tab 3: Job Cards */}
        {profileTab === 'job_cards' && (
          <Card>
            <CardHeader
              title="كروت العمل"
              description="سجل كروت العمل والتجهيز الصادرة للسيارات الخاصة بهذا العميل"
            />
            <CardBody className="p-0">
              {customerJobCards.length === 0 ? (
                <div className="p-8">
                  <EmptyState message="لا توجد كروت عمل مسجلة لهذا العميل حتى الآن" />
                </div>
              ) : (
                <div className="divide-y divide-surface-100">
                  {customerJobCards.map((jc) => (
                    <div key={jc.id} className="p-4 hover:bg-surface-50 transition-colors flex flex-wrap items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-surface-900 text-sm">{jc.id}</span>
                          <Badge
                            tone={
                              jc.status === 'completed'
                                ? 'emerald'
                                : jc.status === 'in_progress'
                                ? 'cyan'
                                : jc.status === 'paid'
                                ? 'blue'
                                : 'amber'
                            }
                          >
                            {jc.status === 'completed'
                              ? 'مكتمل ✅'
                              : jc.status === 'in_progress'
                              ? 'قيد التنفيذ ⚙️'
                              : jc.status === 'paid'
                              ? 'تم الدفع 💳'
                              : 'بانتظار البدء ⏳'}
                          </Badge>
                        </div>

                        <p className="text-xs font-bold text-surface-700">
                          {jc.carType || 'سيارة'} — اللوحة: {jc.plate || 'غير مسجلة'}
                        </p>

                        {jc.mileage && (
                          <p className="text-[11px] text-surface-500">
                            قراءة العداد: {jc.mileage} كم
                          </p>
                        )}

                        {jc.notes && (
                          <p className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 max-w-md">
                            ملاحظات: {jc.notes}
                          </p>
                        )}

                        {jc.services && jc.services.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {jc.services.map((srv: any, idx: number) => (
                              <span key={idx} className="bg-surface-100 text-surface-700 text-[10px] px-2 py-0.5 rounded-md font-semibold">
                                {srv.name} ({formatSAR(srv.price, lang)})
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="text-left">
                        <p className="text-base font-black text-surface-900">{formatSAR(jc.totalAmount || 0, lang)}</p>
                        <p className="text-[11px] text-surface-400">{formatDateTime(jc.createdAt, lang)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        )}

        {/* Tab 4: Loyalty Details */}
        {profileTab === 'loyalty' && (
          <Card>
            <CardHeader
              title="الولاء"
              description="تتبع كروت الأختام والتكريم للعميل مع أزرار التحكم السريع"
            />
            <CardBody className="p-5 space-y-4">
              <div className="bg-gradient-to-r from-primary-900 to-blue-900 text-white p-6 rounded-2xl shadow-md space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gift className="w-6 h-6 text-amber-300" />
                    <h3 className="font-bold text-lg">بطاقة الولاء الرقمية VIP</h3>
                  </div>
                  <span className="text-xs bg-white/20 px-3 py-1 rounded-full font-mono">
                    ID: {profileCustomer.id}
                  </span>
                </div>

                <p className="text-xs text-primary-100">
                  احصل على غسلة كاملة مجاناً فور تجميع {loyaltyTarget} أختام غسيل!
                </p>

                {/* Stamp visual matrix */}
                <div className="grid grid-cols-5 md:grid-cols-10 gap-2 pt-2">
                  {Array.from({ length: loyaltyTarget }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-12 rounded-xl flex items-center justify-center font-bold text-lg transition-all ${
                        i < profileCustomer.loyalty_stamps
                          ? 'bg-amber-400 text-surface-950 shadow-md scale-105'
                          : 'bg-white/10 text-white/30 border border-white/20'
                      }`}
                    >
                      {i < profileCustomer.loyalty_stamps ? '★' : i + 1}
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10">
                  <p className="text-xs font-semibold text-primary-100">
                    عدد الأختام الحالية: <strong className="text-white text-sm">{profileCustomer.loyalty_stamps}</strong> من أصل {loyaltyTarget}
                  </p>

                  <Button
                    size="sm"
                    onClick={(e) => addWashStampToCustomer(profileCustomer, e)}
                    className="bg-amber-400 hover:bg-amber-500 text-surface-950 font-black border-none"
                  >
                    <Plus className="w-4 h-4" /> إضافة ختم غسلة جديدة
                  </Button>
                </div>
              </div>

              {profileCustomer.free_washes_earned > 0 ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-sm">لديك غسلات مجانية مستحقة للاستخدام! 🎉</h4>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      يملك العميل حالياً <strong>{profileCustomer.free_washes_earned}</strong> غسلة مجانية جاهزة للاسترداد بالكاشير.
                    </p>
                  </div>
                  <Badge tone="emerald" className="px-3 py-1 text-sm font-bold">
                    {profileCustomer.free_washes_earned} غسلة مستحقة
                  </Badge>
                </div>
              ) : (
                <p className="text-xs text-surface-500 text-center py-2">
                  اجمع باقي الأختام للحصول على أول غسلة مجانية معتمدة تلقائياً!
                </p>
              )}
            </CardBody>
          </Card>
        )}

        {/* Invoice Printable Modal */}
        <Modal open={!!selectedInvoiceModal} onClose={() => setSelectedInvoiceModal(null)} title={`تفاصيل الفاتورة #${selectedInvoiceModal?.id || ''}`} size="lg">
          {selectedInvoiceModal && (
            <div className="space-y-4 text-surface-800" id="printable-invoice">
              {/* Receipt Header */}
              <div className="text-center pb-4 border-b border-surface-200">
                <div className="w-12 h-12 rounded-xl bg-primary-700 text-white flex items-center justify-center font-black text-xl mx-auto mb-2">
                  {(settings?.brand_name || 'مغسلة الرقمية').charAt(0)}
                </div>
                <h3 className="font-black text-lg text-surface-900">{settings?.brand_name || 'مغسلة السيارات الرقمية'}</h3>
                <p className="text-xs text-surface-500">الفرع الرئيسي • الرقم الضريبي: 300987654321003</p>
                <div className="mt-2 inline-block px-3 py-1 bg-surface-100 text-surface-700 font-mono font-bold text-xs rounded-lg">
                  رقم الفاتورة: #{selectedInvoiceModal.id}
                </div>
              </div>

              {/* Customer & Invoice Metadata */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-surface-50 p-3 rounded-xl border border-surface-200">
                <div>
                  <p className="text-surface-500">اسم العميل:</p>
                  <p className="font-bold text-surface-900 mt-0.5">{profileCustomer.name}</p>
                </div>
                <div>
                  <p className="text-surface-500">تاريخ وتوقيت الفاتورة:</p>
                  <p className="font-bold text-surface-900 mt-0.5">{formatDateTime(selectedInvoiceModal.created_at, lang)}</p>
                </div>
                <div>
                  <p className="text-surface-500">رقم جوال العميل:</p>
                  <p className="font-bold text-surface-900 mt-0.5" dir="ltr">{profileCustomer.phone || 'غير مسجل'}</p>
                </div>
                <div>
                  <p className="text-surface-500">رقم اللوحة والمركبة:</p>
                  <p className="font-bold text-surface-900 mt-0.5">{profileCustomer.plate_number || 'غير مسجلة'}</p>
                </div>
              </div>

              {/* Items & Services Table */}
              <div className="border border-surface-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-right">
                  <thead className="bg-surface-100 text-surface-700 font-bold">
                    <tr>
                      <th className="p-2.5">الخدمة / البيان</th>
                      <th className="p-2.5 text-center">الكمية</th>
                      <th className="p-2.5 text-left">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-100">
                    <tr>
                      <td className="p-2.5 font-bold text-surface-900">
                        {selectedInvoiceModal.notes || (selectedInvoiceModal as any).included_services || 'غسيل وتنظيف شامل للمركبة'}
                      </td>
                      <td className="p-2.5 text-center font-bold">{selectedInvoiceModal.wash_count || 1}</td>
                      <td className="p-2.5 text-left font-black">{formatSAR(selectedInvoiceModal.total, lang)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Totals & Tax */}
              <div className="bg-surface-50 p-3 rounded-xl space-y-1.5 text-xs">
                <div className="flex justify-between text-surface-600">
                  <span>طريقة الدفع:</span>
                  <span className="font-bold text-surface-900">
                    {selectedInvoiceModal.payment_method === 'subscription'
                      ? 'خصم من باقة الاشتراك 💎'
                      : selectedInvoiceModal.is_free
                      ? 'غسلة مجانية 🎁'
                      : selectedInvoiceModal.payment_method === 'cash'
                      ? 'نقداً 💵'
                      : selectedInvoiceModal.payment_method === 'card'
                      ? 'شبكة 💳'
                      : 'دفع متعدد 🔀'}
                  </span>
                </div>
                <div className="flex justify-between text-surface-600">
                  <span>المبلغ غير شامل الضريبة (15%):</span>
                  <span className="font-bold">{formatSAR(Number(selectedInvoiceModal.total) / 1.15, lang)}</span>
                </div>
                <div className="flex justify-between text-surface-600">
                  <span>مبلغ ضريبة القيمة المضافة (15%):</span>
                  <span className="font-bold">{formatSAR(Number(selectedInvoiceModal.total) - Number(selectedInvoiceModal.total) / 1.15, lang)}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-primary-900 pt-2 border-t border-surface-200">
                  <span>إجمالي الفاتورة النهائي:</span>
                  <span>{formatSAR(selectedInvoiceModal.total, lang)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="secondary" onClick={() => setSelectedInvoiceModal(null)}>إغلاق</Button>
                <Button onClick={() => window.print()} className="bg-primary-700 hover:bg-primary-800 text-white font-bold">
                  <Printer className="w-4 h-4" /> طباعة الفاتورة 🖨️
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Add subscription modal */}
        <Modal open={!!showSub} onClose={() => setShowSub(null)} title={tr('addSubscription', lang)} size="lg">
          <div className="space-y-3">
            <div><Label>{tr('selectPlan', lang)}</Label>
              <Select value={subForm.subscription_id} onChange={(e) => setSubForm({ ...subForm, subscription_id: e.target.value })}>
                <option value="">—</option>
                {subs.map((s) => <option key={s.id} value={s.id}>{s.name} — {formatSAR(s.monthly_price, lang)} ({s.washes_included} {tr('washesUsed', lang)})</option>)}
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>{tr('carType', lang)}</Label><Input value={subForm.car_type} onChange={(e) => setSubForm({ ...subForm, car_type: e.target.value })} placeholder={lang === 'ar' ? 'سيدان' : 'Sedan'} /></div>
              <div><Label>{tr('carColor', lang)}</Label><Input value={subForm.car_color} onChange={(e) => setSubForm({ ...subForm, car_color: e.target.value })} placeholder={lang === 'ar' ? 'أبيض' : 'White'} /></div>
              <div><Label>{tr('plateNumber', lang)}</Label><Input value={subForm.plate_number} onChange={(e) => setSubForm({ ...subForm, plate_number: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>{tr('manualPrice', lang)}</Label><Input type="number" value={subForm.manual_price} onChange={(e) => setSubForm({ ...subForm, manual_price: Number(e.target.value) })} /></div>
              <div><Label>{tr('washLimit', lang)}</Label><Input type="number" value={subForm.wash_limit} onChange={(e) => setSubForm({ ...subForm, wash_limit: Number(e.target.value) })} /></div>
            </div>
            <div><Label>{tr('startDate', lang)}</Label><Input type="date" value={subForm.start_date} onChange={(e) => setSubForm({ ...subForm, start_date: e.target.value })} /></div>
            <Button onClick={addSubscription} className="w-full">{tr('save', lang)}</Button>
          </div>
        </Modal>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={tr('customersTitle', lang)}
        subtitle={tr('customersSubtitle', lang)}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={exportCsv}><Download className="w-4 h-4" /> {tr('exportCsv', lang)}</Button>
            {can('customers.add') && <Button onClick={() => setShowAdd(true)}><Plus className="w-4 h-4" /> {tr('newCustomer', lang)}</Button>}
          </div>
        }
      />

      <div className="mb-4 relative">
        <Search className={`w-4 h-4 absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-surface-400`} />
        <Input placeholder={tr('searchCustomers', lang)} value={search} onChange={(e) => setSearch(e.target.value)} className={isRTL ? 'pr-10' : 'pl-10'} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((c) => {
          const sub = getCustomerSub(c.id);
          return (
            <Card key={c.id} className="hover:shadow-md transition-shadow cursor-pointer" >
              <CardBody>
                <div onClick={() => setShowProfile(c.id)} className="w-full text-right cursor-pointer">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold" style={{ background: `linear-gradient(135deg, ${settings?.brand_color ?? '#0e7490'}, ${settings?.brand_accent ?? '#2563eb'})` }}>{c.name.charAt(0)}</div>
                      <div>
                        <h3 className="font-bold text-surface-800">{c.name}</h3>
                        <p className="text-xs text-surface-400">{tr('customerSince', lang)} {formatDate(c.created_at, lang)}</p>
                      </div>
                    </div>
                    {sub && <Badge tone="cyan">{tr('subscribed', lang)}</Badge>}
                  </div>

                  <div className="space-y-1.5 text-sm text-surface-600">
                    {c.phone && <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-surface-400" /> {c.phone}</p>}
                    {c.plate_number && <p className="flex items-center gap-2"><Car className="w-3.5 h-3.5 text-surface-400" /> {c.plate_number}</p>}
                  </div>

                  {sub && (
                    <div className="mt-3 p-2.5 rounded-xl bg-primary-50 border border-primary-100">
                      <p className="text-xs font-medium text-primary-700">{getSubName(sub.subscription_id)}</p>
                      <p className="text-xs text-surface-500 mt-0.5">{tr('remainingWashes', lang)}: {sub.washes_remaining}</p>
                    </div>
                  )}

                  {!sub && (
                    <div className="mt-3 pt-3 border-t border-surface-100">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium text-surface-500">{tr('loyaltyStamps', lang)}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-surface-600">{c.loyalty_stamps}/{loyaltyTarget}</span>
                          <button
                            type="button"
                            onClick={(e) => addWashStampToCustomer(c, e)}
                            className="px-2 py-0.5 text-[11px] font-bold bg-primary-100 text-primary-800 hover:bg-primary-200 rounded-md flex items-center gap-1 transition-colors"
                            title="إضافة ختم"
                          >
                            <Plus className="w-3 h-3" /> غسلة
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: loyaltyTarget }).map((_, i) => (
                          <div key={i} className={`flex-1 h-6 rounded-md flex items-center justify-center text-xs ${i < c.loyalty_stamps ? 'text-white' : 'bg-surface-100 text-surface-300'}`} style={i < c.loyalty_stamps ? { background: `linear-gradient(to ${isRTL ? 'left' : 'right'}, ${settings?.brand_color ?? '#0e7490'}, ${settings?.brand_accent ?? '#2563eb'})` } : undefined}>★</div>
                        ))}
                      </div>
                      {c.free_washes_earned > 0 && (
                        <p className="text-xs text-emerald-600 font-medium mt-1.5 flex items-center gap-1"><Gift className="w-3 h-3" /> {tr('freeWashesEarned', lang)} {c.free_washes_earned} {tr('freeWash', lang)}</p>
                      )}
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && <EmptyState message={tr('noData', lang)} />}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title={tr('newCustomer', lang)}>
        <div className="space-y-3">
          <div><Label>{tr('name', lang)} *</Label><Input value={newCust.name} onChange={(e) => setNewCust({ ...newCust, name: e.target.value })} /></div>
          <div><Label>{tr('phone', lang)}</Label><Input value={newCust.phone} onChange={(e) => setNewCust({ ...newCust, phone: e.target.value })} /></div>
          <div><Label>{tr('plateNumber', lang)}</Label><Input value={newCust.plate_number} onChange={(e) => setNewCust({ ...newCust, plate_number: e.target.value })} /></div>
          <div><Label>{tr('notes', lang)}</Label><Input value={newCust.notes} onChange={(e) => setNewCust({ ...newCust, notes: e.target.value })} /></div>
          <Button onClick={addCustomer} className="w-full">{tr('save', lang)}</Button>
        </div>
      </Modal>
    </div>
  );
}
