import { useEffect, useState } from 'react';
import {
  ShoppingCart, Trash2, Gift, Search, CreditCard, Banknote,
  SplitSquareHorizontal, Check, MessageCircle, X, UserPlus, Car,
  Printer, Wallet, RotateCcw, Plus, CheckCircle2, Copy, Smartphone, Globe, Building, FileText
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getLoyaltyTarget } from '@/lib/costEngine';
import { formatSAR, formatDateTime } from '@/lib/format';
import type { Customer, Service, Sale, Staff, Branch, CustomerSubscription, Subscription, Shift } from '@/lib/types';
import {
  Button, Card, CardBody, CardHeader, EmptyState, Input, Modal, PageHeader,
  Select, Spinner, Badge, Label,
} from '@/components/ui';
import { useAuth, usePermissions } from '@/lib/auth';
import { tr } from '@/lib/i18n';
import { mergeCustomerLists, saveLocalCustomer } from '@/lib/customerStore';
import { validateAndCalculateDiscount, incrementDiscountUsage, DiscountCode } from '@/lib/discountStore';
import { getTenantProducts } from '@/lib/productStore';
import { getTenantPackages, getTenantCustomerSubscriptions, saveTenantCustomerSubscription, consumeSubscriptionWash } from '@/lib/subscriptionStore';
import {
  SAMPLE_SERVICES,
  SAMPLE_STAFF,
  SAMPLE_BRANCHES,
  SAMPLE_SALES,
  SAMPLE_SUBSCRIPTIONS,
  SAMPLE_CUSTOMER_SUBSCRIPTIONS,
} from '@/lib/mockData';

interface CartItem { service: Service; qty: number; }

export function SalesPage() {
  const { staffName, lang, settings, organization } = useAuth();
  const { can } = usePermissions();
  const currentTenantId = organization?.id || 'org_client_01';
  const loyaltyTarget = getLoyaltyTarget(settings);
  const loyaltyEnabled = settings?.loyalty_enabled !== false;
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<Service[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [custSubs, setCustSubs] = useState<CustomerSubscription[]>([]);
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerId, setCustomerId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [cashAmount, setCashAmount] = useState(0);
  const [discountCode, setDiscountCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountError, setDiscountError] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountCode | null>(null);
  const [cardAmount, setCardAmount] = useState(0);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);
  const [showAddCust, setShowAddCust] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [showSubForm, setShowSubForm] = useState(false);
  const [showSubInvoice, setShowSubInvoice] = useState(false);
  const [lastSubInvoice, setLastSubInvoice] = useState<{ customer: Customer; sub: { manual_price: number; car_type: string; car_color: string; plate_number: string; wash_limit: number; start_date: string; end_date: string } } | null>(null);
  const [showRefund, setShowRefund] = useState<Sale | null>(null);
  const [showShiftOpen, setShowShiftOpen] = useState(false);
  const [shiftForm, setShiftForm] = useState({ opening_cash: 0 });
  const [showShiftSummaryModal, setShowShiftSummaryModal] = useState(false);
  const [summaryDetails, setSummaryDetails] = useState<{
    cashier: string;
    dateStr: string;
    startTime: string;
    endTime: string;
    cashTotal: number;
    cardTotal: number;
    totalSales: number;
    washCount: number;
  } | null>(null);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [newServiceForm, setNewServiceForm] = useState({ name: '', category: 'غسيل ساطع', price: 40, cost_estimate: 12, duration_min: 25 });
  const [lastInvoice, setLastInvoice] = useState<Sale | null>(null);
  const [lastInvoiceItems, setLastInvoiceItems] = useState<{ service_name: string; qty: number; line_total: number }[]>([]);
  const [lastCustomer, setLastCustomer] = useState<Customer | null>(null);
  const [waPhone, setWaPhone] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [loyaltyMsg, setLoyaltyMsg] = useState<string | null>(null);
  const [newCust, setNewCust] = useState({ name: '', phone: '', plate_number: '', vehicle_color: '', vehicle_type: '', vehicle_brand: '', vehicle_model: '' });
  const [subForm, setSubForm] = useState({ subscription_id: '', manual_price: 0, car_type: '', car_color: '', plate_number: '', wash_limit: 0, start_date: new Date().toISOString().slice(0, 10), end_date: '' });
  const [subCustMode, setSubCustMode] = useState<'quick_add' | 'existing'>('quick_add');
  const [subQuickCust, setSubQuickCust] = useState({ name: '', phone: '', plate_number: '', car_type: '', car_color: '' });
  const [catalogTab, setCatalogTab] = useState<'all' | 'washes' | 'subscriptions' | 'products'>('all');
  const [cashierMainMode, setCashierMainMode] = useState<'cash_sales' | 'sub_wash'>('cash_sales');
  const [subWashSearch, setSubWashSearch] = useState('');
  const [refundForm, setRefundForm] = useState({ method: 'cash', amount: 0 });
  const isRTL = lang === 'ar';

  const loadData = async () => {
    try {
      const svItems = await getTenantProducts(currentTenantId);
      const loadedCu = mergeCustomerLists([], currentTenantId);
      const storedSales = localStorage.getItem(`tenant_sales_${currentTenantId}`);
      const loadedSa = storedSales ? JSON.parse(storedSales) : [];
      
      const loadedSv = svItems;
      const loadedSt = SAMPLE_STAFF;
      const loadedBr = SAMPLE_BRANCHES;
      
      const finalSubs = getTenantPackages(currentTenantId);
      const loadedCS = getTenantCustomerSubscriptions(currentTenantId);
      
      let openShift = null;
      const storedShifts = localStorage.getItem(`shifts_${currentTenantId}`);
      if (storedShifts) {
         const shifts = JSON.parse(storedShifts);
         openShift = shifts.find((s: any) => s.status === 'open');
      }
      
      if (!openShift) {
        const staffId = loadedSt.find((s) => s.name === staffName)?.id ?? loadedSt[0]?.id ?? null;
        const branchId = loadedBr[0]?.id ?? null;
        openShift = { 
          id: 'shift-' + Date.now(), 
          end_time: null, closing_cash: 0, notes: null,
          staff_id: staffId,
          branch_id: branchId,
          opening_cash: 0,
          shift_date: new Date().toISOString(),
          start_time: new Date().toISOString(),
          status: 'open',
        };
      }

      const allServices = loadedSv.length > 0 ? loadedSv : SAMPLE_SERVICES;

      setServices(allServices as any);
      setCustomers(loadedCu);
      setStaff(loadedSt);
      setBranches(loadedBr);
      setSales(loadedSa);
      setSubs(finalSubs);
      setCustSubs(loadedCS as any);
      setActiveShift(openShift);
      setLoading(false);
    } catch (err) {
      console.error('Error loading data in SalesPage:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleDataUpdated = () => { loadData(); };
    window.addEventListener('raqam_data_updated', handleDataUpdated);
    return () => window.removeEventListener('raqam_data_updated', handleDataUpdated);
  }, [currentTenantId]);

  if (loading) return <Spinner label={tr('loading', lang)} />;

  const isWashItem = (cat: string, isProd?: boolean) => cat !== 'اشتراكات' && cat !== 'products' && !isProd;
  const cartTotal = cart.reduce((s, i) => s + i.service.price * i.qty, 0);
  const cartWashes = cart.reduce((s, i) => s + (isWashItem(i.service.category, (i.service as any).is_product) ? i.qty : 0), 0);
  const washesCost = cart.reduce((s, i) => s + (isWashItem(i.service.category, (i.service as any).is_product) ? i.service.price * i.qty : 0), 0);

  const addToCart = (service: Service) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.service.id === service.id);
      if (existing) return prev.map((i) => (i.service.id === service.id ? { ...i, qty: i.qty + 1 } : i));
      return [...prev, { service, qty: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) => prev.map((i) => (i.service.id === id ? { ...i, qty: i.qty + delta } : i)).filter((i) => i.qty > 0));
  };

  const filteredCustomers = customers.filter(
    (c) => c.name.includes(customerSearch) || (c.phone ?? '').includes(customerSearch) || (c.plate_number ?? '').includes(customerSearch)
  );

  const selectedCustomer = customers.find((c) => c.id === customerId) ?? null;
  const customerSub = custSubs.find((cs) => cs.customer_id === customerId && cs.status === 'active');
  const subDef = customerSub ? subs.find((s) => s.id === customerSub.subscription_id) : null;
  const hasActiveSub = !!customerSub && (customerSub.washes_remaining ?? 0) > 0 && (!customerSub.end_date || new Date(customerSub.end_date) >= new Date()) && cartWashes > 0;
  const isFreeWash = loyaltyEnabled && !hasActiveSub && selectedCustomer ? selectedCustomer.loyalty_stamps >= loyaltyTarget : false;
  const adjustedCartTotal = (hasActiveSub || isFreeWash) ? cartTotal - washesCost : cartTotal;

  // Shift helpers & calculations
  const shiftSales = sales.filter((s) => {
    if (!activeShift) return true;
    return new Date(s.created_at) >= new Date(activeShift.shift_date || activeShift.start_time || "");
  });

  const shiftCashTotal = (activeShift ? Number(activeShift.opening_cash || 0) : 0)
    + shiftSales
      .filter((s) => !s.is_refund && (s.payment_method === 'cash' || s.payment_method === 'split'))
      .reduce((sum, s) => sum + Number(s.cash_amount || 0), 0)
    - shiftSales
      .filter((s) => s.is_refund && s.refund_method === 'cash')
      .reduce((sum, s) => sum + Number(s.refund_amount || 0), 0);

  const shiftCardTotal = shiftSales
    .filter((s) => !s.is_refund && (s.payment_method === 'card' || s.payment_method === 'split'))
    .reduce((sum, s) => sum + Number(s.card_amount || 0), 0);

  const shiftTotalSales = shiftSales
    .filter((s) => !s.is_refund)
    .reduce((sum, s) => sum + Number(s.total || 0), 0);

  const shiftWashCount = shiftSales
    .filter((s) => !s.is_refund)
    .reduce((sum, s) => sum + (s.wash_count || 1), 0);

  const handleCloseShift = async () => {
    const nowISO = new Date().toISOString();
    const dateFormatted = new Date().toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const summary = {
      cashier: staffName,
      dateStr: dateFormatted,
      startTime: activeShift ? formatDateTime(activeShift.shift_date, lang) : formatDateTime(nowISO, lang),
      endTime: formatDateTime(nowISO, lang),
      cashTotal: shiftCashTotal,
      cardTotal: shiftCardTotal,
      totalSales: shiftTotalSales,
      washCount: shiftWashCount,
    };

    if (activeShift && !activeShift.id.startsWith('shift-')) {
      try {
        await supabase.from('shifts').update({
          status: 'closed',
          end_time: nowISO,
          closing_cash: shiftCashTotal,
        }).eq('id', activeShift.id);
      } catch { /* ignore */ }
    }

    setSummaryDetails(summary);
    setShowShiftSummaryModal(true);
  };

  const openShift = async () => {
    const staffId = staff.find((s) => s.name === staffName)?.id ?? staff[0]?.id ?? null;
    const branchId = branches[0]?.id ?? null;
    const openingCash = Number(shiftForm.opening_cash) || 0;
    const newShiftObj = { end_time: null, closing_cash: 0, notes: null,
      staff_id: staffId,
      branch_id: branchId,
      opening_cash: openingCash,
      shift_date: new Date().toISOString(),
      start_time: new Date().toISOString(),
      status: 'open',
    };
    try {
      const { data: created } = await supabase.from('shifts').insert(newShiftObj).select().single();
      if (created) setActiveShift(created as Shift);
      else setActiveShift({ id: 'shift-' + Date.now(), ...newShiftObj });
    } catch {
      setActiveShift({ id: 'shift-' + Date.now(), ...newShiftObj });
    }
    setShiftForm({ opening_cash: 0 });
    setShowShiftOpen(false);
    await loadData();
  };

  const handleStartNewShift = async () => {
    setShowShiftSummaryModal(false);
    const staffId = staff.find((s) => s.name === staffName)?.id ?? staff[0]?.id ?? null;
    const branchId = branches[0]?.id ?? null;
    const newShiftObj = { end_time: null, closing_cash: 0, notes: null,
      staff_id: staffId,
      branch_id: branchId,
      opening_cash: 0,
      shift_date: new Date().toISOString(),
      start_time: new Date().toISOString(),
      status: 'open',
    };
    try {
      const { data: created } = await supabase.from('shifts').insert(newShiftObj).select().single();
      if (created) setActiveShift(created as Shift);
      else setActiveShift({ id: 'shift-' + Date.now(), ...newShiftObj });
    } catch {
      setActiveShift({ id: 'shift-' + Date.now(), ...newShiftObj });
    }
    await loadData();
  };

  const getWhatsAppShiftSummaryText = () => {
    if (!summaryDetails) return '';
    const company = settings?.company_name ?? 'مغسلة رقم النموذجية';
    return `📊 *ملخص تقرير إغلاق الشفت - ${company}*\n\n` +
      `📅 *اليوم والتاريخ:* ${summaryDetails.dateStr}\n` +
      `👤 *الكاشير المسؤول:* ${summaryDetails.cashier}\n` +
      `⏰ *وقت البداية:* ${summaryDetails.startTime}\n` +
      `🏁 *وقت الإغلاق:* ${summaryDetails.endTime}\n` +
      `-----------------------------------\n` +
      `💵 *إجمالي الكاش في الصندوق:* ${formatSAR(summaryDetails.cashTotal, lang)}\n` +
      `💳 *إجمالي مبيعات شبكة / مدى:* ${formatSAR(summaryDetails.cardTotal, lang)}\n` +
      `💰 *إجمالي المبيعات الكلي:* ${formatSAR(summaryDetails.totalSales, lang)}\n` +
      `🚗 *عدد السيارات المغسولة:* ${summaryDetails.washCount} سيارة\n` +
      `-----------------------------------\n` +
      `تم الاستخراج عبر منصة رقم RQM ✨`;
  };

  const sendShiftWhatsApp = () => {
    const msg = getWhatsAppShiftSummaryText();
    if (!msg) return;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const printShiftReport = () => {
    if (!summaryDetails) return;
    const w = window.open('', '_blank');
    if (!w) return;
    const companyName = settings?.company_name ?? 'مغسلة رقم النموذجية';
    
    w.document.write(`
      <!DOCTYPE html>
      <html dir="${isRTL ? 'rtl' : 'ltr'}">
      <head>
        <title>ملخص الشفت - ${summaryDetails.dateStr}</title>
        <meta charset="utf-8">
        <style>
          @page { size: auto; margin: 0; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 20px; max-width: 320px; margin: 0 auto; color: #0f172a; font-size: 13px; line-height: 1.5; }
          .center { text-align: center; }
          .brand { font-size: 18px; font-weight: 800; color: #0e7490; margin-bottom: 2px; }
          .sub { font-size: 12px; color: #64748b; font-weight: 600; }
          .dash { border-top: 1px dashed #cbd5e1; margin: 10px 0; }
          .row { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 12px; }
          .bold { font-weight: bold; }
          .box { background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 10px 0; }
          .footer { font-size: 11px; color: #64748b; text-align: center; margin-top: 16px; }
        </style>
      </head>
      <body>
        <div class="center">
          <div class="brand">${companyName}</div>
          <div class="sub">تقرير ملخص إغلاق الوردية (الشفت)</div>
        </div>
        <div class="dash"></div>
        <div class="row"><span>اليوم والتاريخ:</span><span class="bold">${summaryDetails.dateStr}</span></div>
        <div class="row"><span>الكاشير:</span><span class="bold">${summaryDetails.cashier}</span></div>
        <div class="row"><span>وقت البداية:</span><span>${summaryDetails.startTime}</span></div>
        <div class="row"><span>وقت الإغلاق:</span><span>${summaryDetails.endTime}</span></div>
        <div class="dash"></div>
        <div class="box">
          <div class="row bold" style="color:#059669;font-size:14px;margin-bottom:8px;">
            <span>💵 الكاش في الصندوق:</span>
            <span>${formatSAR(summaryDetails.cashTotal, lang)}</span>
          </div>
          <div class="row bold" style="color:#2563eb;font-size:13px;margin-bottom:8px;">
            <span>💳 المبيعات شبكة / مدى:</span>
            <span>${formatSAR(summaryDetails.cardTotal, lang)}</span>
          </div>
          <div class="row bold" style="color:#0f172a;font-size:14px;border-top:1px border #cbd5e1;padding-top:6px;margin:0;">
            <span>💰 إجمالي المبيعات:</span>
            <span>${formatSAR(summaryDetails.totalSales, lang)}</span>
          </div>
        </div>
        <div class="row"><span>عدد السيارات المغسولة:</span><span class="bold">${summaryDetails.washCount} سيارة</span></div>
        <div class="footer">
          تم إغلاق الوردية بنجاح 🌸<br>
          منصة رقم RQM لإدارة المغاسل
        </div>
        <script>
          window.onload = function() { window.print(); window.close(); }
        </script>
      </body>
      </html>
    `);
    w.document.close();
  };

  const addQuickCustomer = async () => {
    if (!newCust.name) return;
    const cust: Customer = {
      id: 'c-' + Date.now(),
      name: newCust.name,
      phone: newCust.phone || null,
      plate_number: newCust.plate_number || null,
      vehicle_color: newCust.vehicle_color || null,
      vehicle_type: newCust.vehicle_type || null,
      vehicle_brand: newCust.vehicle_brand || null,
      vehicle_model: newCust.vehicle_model || null,
      loyalty_stamps: 0,
      free_washes_earned: 0,
      total_visits: 0,
      notes: null,
      created_at: new Date().toISOString(),
    };
    try {
        saveLocalCustomer(cust);
    } catch(e) {}
    setCustomers((prev) => [cust, ...prev]);
    setCustomerId(cust.id);
    setNewCust({ name: '', phone: '', plate_number: '', vehicle_color: '', vehicle_type: '', vehicle_brand: '', vehicle_model: '' });
setShowAddCust(false);
  };

  const addNewServiceToCashier = async () => {
    if (!newServiceForm.name.trim()) return;
    const { data } = await supabase.from('services').insert({
      name: newServiceForm.name,
      category: newServiceForm.category,
      price: Number(newServiceForm.price),
      cost_estimate: Number(newServiceForm.cost_estimate),
      duration_min: Number(newServiceForm.duration_min),
      active: true,
    }).select().single();

    if (data) {
      setServices((prev) => [...prev, data as Service]);
    } else {
      const fallbackSvc: Service = {
        id: 'svc-' + Date.now(),
        name: newServiceForm.name,
        category: newServiceForm.category,
        price: Number(newServiceForm.price),
        cost_estimate: Number(newServiceForm.cost_estimate),
        duration_min: Number(newServiceForm.duration_min),
        active: true,
      };
      setServices((prev) => [...prev, fallbackSvc]);
    }
    setNewServiceForm({ name: '', category: 'غسيل ساطع', price: 40, cost_estimate: 12, duration_min: 25 });
    setShowAddServiceModal(false);
  };

  const addCarSubscription = async () => {
    let activeCust = selectedCustomer;

    if (subCustMode === 'quick_add' || (!activeCust && subQuickCust.name.trim())) {
      if (!subQuickCust.name.trim()) {
        alert('الرجاء كتابة اسم العميل على الأقل لربط الاشتراك بحسابه ⚠️');
        return;
      }
      const newC: Customer = {
        id: 'cust-' + Date.now(),
        name: subQuickCust.name.trim(),
        phone: subQuickCust.phone.trim() || null,
        plate_number: subQuickCust.plate_number.trim() || subForm.plate_number || null,
        vehicle_type: subQuickCust.car_type.trim() || subForm.car_type || null,
        vehicle_color: subQuickCust.car_color.trim() || subForm.car_color || null,
        vehicle_brand: subQuickCust.car_type.trim() || null,
        loyalty_stamps: 0,
        free_washes_earned: 0,
        total_visits: 0,
        notes: 'عميل اشتراك جديد',
        created_at: new Date().toISOString(),
      };
      saveLocalCustomer(newC, currentTenantId);
      setCustomers((prev) => [newC, ...prev]);
      setCustomerId(newC.id);
      activeCust = newC;
    }

    if (!activeCust) {
      alert('الرجاء اختيار عميل مسجل أو إدخال بيانات العميل الجديد (الاسم والجوال) ⚠️');
      return;
    }

    const activePackages = subs.filter(s => s.active !== false);
    const selectedPkg = activePackages.find(s => s.id === subForm.subscription_id) || subs.find(s => s.id === subForm.subscription_id);
    if (!selectedPkg) {
      alert('الرجاء اختيار باقة الاشتراك المراد تفعيلها ⚠️');
      return;
    }
    const sPrice = subForm.manual_price !== undefined && subForm.manual_price > 0 ? subForm.manual_price : (selectedPkg.monthly_price || selectedPkg.price_monthly || 0);
    const sWashes = selectedPkg.washes_included || 0;
    const durationDays = selectedPkg.duration_days || 30;
    
    const carType = subForm.car_type || subQuickCust.car_type || activeCust.vehicle_type || activeCust.vehicle_brand || 'سيارة سيدان';
    const carColor = subForm.car_color || subQuickCust.car_color || activeCust.vehicle_color || 'أبيض';
    const plateNumber = subForm.plate_number || subQuickCust.plate_number || activeCust.plate_number || 'غير مسجلة';

    // Update customer record with vehicle color and plate number if provided
    const updatedCust: Customer = {
      ...activeCust,
      vehicle_type: carType,
      vehicle_color: carColor,
      plate_number: plateNumber,
    };
    saveLocalCustomer(updatedCust, currentTenantId);
    setCustomers(prev => prev.map(c => c.id === activeCust!.id ? updatedCust : c));

    // Create Sale for revenue and invoice tracking
    const staffId = staff.find((s) => s.name === staffName)?.id ?? staff[0]?.id ?? null;
    const saleId = 'inv-' + Date.now();
    const finalSale = {
      id: saleId,
      customer_id: activeCust.id,
      staff_id: staffId,
      branch_id: branches[0]?.id ?? null,
      customer_subscription_id: null,
      total: sPrice,
      cash_amount: paymentMethod === 'cash' ? sPrice : 0,
      card_amount: paymentMethod === 'card' ? sPrice : (paymentMethod === 'transfer' ? sPrice : 0),
      payment_method: paymentMethod,
      wash_count: 0,
      is_free: false,
      notes: `شراء اشتراك - ${selectedPkg.name} (العميل: ${activeCust.name} - ${activeCust.phone || 'بدون جوال'} - سيارة: ${carType} - ${carColor} - ${plateNumber})`,
      is_refund: false,
      refund_amount: 0,
      refund_method: null,
      created_at: new Date().toISOString(),
      subscription_id: selectedPkg.id,
      original_sale_id: null,
    };

    // Calculate dates
    const startDate = subForm.start_date || new Date().toISOString().slice(0,10);
    const endDateObj = new Date(startDate);
    endDateObj.setDate(endDateObj.getDate() + durationDays);
    const endDate = endDateObj.toISOString().slice(0,10);
    
    const newCs = {
      id: 'cs_' + Date.now(),
      customer_id: activeCust.id,
      subscription_id: selectedPkg.id,
      tenant_id: currentTenantId,
      package_name_snapshot: selectedPkg.name,
      subscription_type: selectedPkg.subscription_type || 'عدد غسلات + مدة',
      vehicle_scope: selectedPkg.vehicle_scope || 'specific_vehicle',
      start_date: startDate,
      end_date: endDate,
      washes_used: 0,
      washes_remaining: sWashes,
      total_washes: sWashes,
      status: 'active',
      car_type: carType,
      car_color: carColor,
      plate_number: plateNumber,
      manual_price: sPrice,
      payment_method: paymentMethod,
      invoice_id: saleId,
      included_services: selectedPkg.included_services || 'غسيل شامل وساطع VIP',
      customer_name: activeCust.name,
      customer_phone: activeCust.phone || '',
    };
    
    // Save Sale for revenue and invoice tracking FIRST in localStorage and state
    const invoiceItem = {
      sale_id: finalSale.id,
      service_id: selectedPkg.id,
      service_name: `اشتراك: ${selectedPkg.name}`,
      qty: 1,
      price: sPrice,
      line_total: sPrice,
    };

    const storedSalesRaw = localStorage.getItem(`tenant_sales_${currentTenantId}`);
    const existingSalesArr: Sale[] = storedSalesRaw ? JSON.parse(storedSalesRaw) : sales;
    const updatedSalesList = [finalSale, ...existingSalesArr.filter((s) => s.id !== finalSale.id)];
    localStorage.setItem(`tenant_sales_${currentTenantId}`, JSON.stringify(updatedSalesList));
    setSales(updatedSalesList as any);

    // Save to Supabase DB if connected
    try {
      await supabase.from('sales').insert({
        id: finalSale.id,
        customer_id: activeCust.id,
        staff_id: staffId,
        branch_id: branches[0]?.id ?? null,
        total: sPrice,
        cash_amount: finalSale.cash_amount,
        card_amount: finalSale.card_amount,
        payment_method: paymentMethod,
        wash_count: 0,
        is_free: false,
        notes: finalSale.notes,
        created_at: finalSale.created_at,
        subscription_id: selectedPkg.id,
      });

      await supabase.from('sale_items').insert([invoiceItem]);
    } catch (e) {
      console.warn('Supabase insert fallback:', e);
    }

    // Save Customer Subscription record
    try {
      const savedSub = saveTenantCustomerSubscription(newCs as any, currentTenantId);
      setCustSubs(prev => [savedSub, ...prev.filter(s => s.id !== savedSub.id)]);
      try {
        await supabase.from('customer_subscriptions').insert({
          id: savedSub.id,
          customer_id: savedSub.customer_id,
          subscription_id: savedSub.subscription_id,
          start_date: savedSub.start_date,
          end_date: savedSub.end_date,
          washes_used: 0,
          washes_remaining: savedSub.washes_remaining,
          status: 'active',
          car_type: savedSub.car_type,
          car_color: savedSub.car_color,
          plate_number: savedSub.plate_number,
          manual_price: savedSub.manual_price,
        });
      } catch {}
    } catch {}

    // Dispatch update event so InvoicesPage, Dashboard, Reports, and SalesPage reflect the new sale and revenue
    window.dispatchEvent(new Event('raqam_data_updated'));

    setSubForm({ subscription_id: '', manual_price: 0, car_type: '', car_color: '', plate_number: '', wash_limit: 0, start_date: new Date().toISOString().slice(0, 10), end_date: '' });
    setSubQuickCust({ name: '', phone: '', plate_number: '', car_type: '', car_color: '' });
    setShowSubForm(false);

    try {
      setLastInvoice(finalSale as any);
      setLastInvoiceItems([invoiceItem]);
      setLastCustomer(activeCust);
      setLastSubInvoice({
        customer: activeCust,
        sub: {
          manual_price: sPrice,
          car_type: carType,
          car_color: carColor,
          plate_number: plateNumber,
          wash_limit: sWashes,
          start_date: startDate,
          end_date: endDate,
          package_name: selectedPkg.name,
          subscription_type: selectedPkg.subscription_type || 'عدد غسلات + مدة',
        } as any
      });
      setShowSubInvoice(true);
    } catch(e) {}
  };

    const handleQuickSubscriptionWash = () => {
    if (!customerSub || (customerSub.washes_remaining ?? 0) <= 0) {
      alert('لا يوجد رصيد غسلات متبقٍ في اشتراك هذا العميل ⚠️');
      return;
    }
    const washService = services.find((s) => s.category !== 'products' && !(s as any).is_product) || services[0] || {
      id: 'wash_sub_quick',
      name: 'غسيل شامل (خصم من الاشتراك)',
      price: 0,
      category: 'غسيل',
      duration_min: 20,
      is_product: false
    };
    setCart((prev) => {
      const existing = prev.find((i) => i.service.id === washService.id);
      if (existing) {
        return prev.map((i) => (i.service.id === washService.id ? { ...i, qty: 1 } : i));
      }
      return [{ service: washService, qty: 1 }, ...prev];
    });
    setShowCheckout(true);
  };

  const handleDirectSubWashDeduction = async (csub: CustomerSubscription) => {
    if ((csub.washes_remaining ?? 0) <= 0) {
      alert('رصيد الغسلات انتهى في هذا الاشتراك! ⚠️');
      return;
    }

    const cust = customers.find((c) => c.id === csub.customer_id) || {
      id: csub.customer_id,
      name: csub.customer_name || 'عميل مشترك',
      phone: csub.customer_phone || '',
      plate_number: csub.plate_number || '',
      loyalty_stamps: 0,
      free_washes_earned: 0,
      notes: '',
      created_at: new Date().toISOString(),
    };

    const staffId = staff.find((s) => s.name === staffName)?.id ?? staff[0]?.id ?? null;
    const branchId = branches[0]?.id ?? null;

    const res = consumeSubscriptionWash(csub.id, 'خصم فوري من تبويب غسيل الاشتراك بالكاشير', currentTenantId);
    if (!res.success) {
      alert(res.message);
      return;
    }

    const pkgName = csub.package_name_snapshot || (csub as any).package_name || 'باقة غسيل';

    const newSale: Sale = {
      id: 'inv-sub-' + Date.now(),
      customer_id: cust.id,
      staff_id: staffId,
      branch_id: branchId,
      customer_subscription_id: csub.id,
      total: 0,
      cash_amount: 0,
      card_amount: 0,
      payment_method: 'subscription',
      wash_count: 1,
      is_free: true,
      notes: `خصم غسلة من اشتراك: ${pkgName} | المتبقي: ${res.remaining} غسلة`,
      is_refund: false,
      refund_amount: 0,
      refund_method: null,
      created_at: new Date().toISOString(),
      subscription_id: csub.subscription_id,
      original_sale_id: null,
    };

    const invoiceItems = [
      {
        sale_id: newSale.id,
        service_id: 'sub_wash_srv',
        service_name: `غسيل مخصوم من الاشتراك (${pkgName})`,
        qty: 1,
        price: 0,
        line_total: 0,
      },
    ];

    try {
      await supabase.from('sales').insert(newSale);
      await supabase.from('sale_items').insert(invoiceItems);
    } catch {}

    setSales((prev) => {
      const updated = [newSale, ...prev.filter((s) => s.id !== newSale.id)];
      localStorage.setItem(`tenant_sales_${currentTenantId}`, JSON.stringify(updated));
      return updated;
    });

    const updatedCustSubs = getTenantCustomerSubscriptions(currentTenantId);
    setCustSubs(updatedCustSubs as any);

    setLastInvoice(newSale);
    setLastInvoiceItems(invoiceItems);
    setLastCustomer(cust);
    setWaPhone(cust.phone || '');
    setShowInvoice(true);
    setLoyaltyMsg(`🎉 تم تسجيل الغسلة بنجاح! الرصيد المتبقي للعميل (${cust.name}): ${res.remaining} غسلة.`);
  };

  const applyDiscount = () => {
    if (!discountCode) {
      setDiscountAmount(0);
      setDiscountError('');
      setAppliedDiscount(null);
      return;
    }
    const res = validateAndCalculateDiscount(discountCode, cartTotal, currentTenantId);
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

  const checkout = async () => {
    if (cart.length === 0) return;

    // Validate that if cart contains subscription packages, a customer MUST be selected or specified
    const hasSubscriptionInCart = cart.some(i => i.service.id.startsWith('sub_') || i.service.category === 'اشتراكات');
    let effectiveCustomer = selectedCustomer;

    if (hasSubscriptionInCart && !effectiveCustomer) {
      if (customerSearch.trim()) {
        const autoCust: Customer = {
          id: 'cust-' + Date.now(),
          name: customerSearch.trim(),
          phone: customerSearch.trim().match(/05\d{8}/)?.[0] || null,
          plate_number: null,
          notes: 'عميل اشتراك جديد',
          loyalty_stamps: 0,
          free_washes_earned: 0,
          total_visits: 0,
          created_at: new Date().toISOString(),
        };
        saveLocalCustomer(autoCust, currentTenantId);
        setCustomers((prev) => [autoCust, ...prev]);
        setCustomerId(autoCust.id);
        effectiveCustomer = autoCust;
      } else {
        setShowAddCust(true);
        alert('الرجاء إدخال اسم ورقم جوال العميل لربط الاشتراك بحسابه ⚠️');
        return;
      }
    }

    setProcessing(true);
    setLoyaltyMsg(null);
    setDiscountCode('');
    setDiscountAmount(0);
    setDiscountError('');
    setAppliedDiscount(null);

    const staffId = staff.find((s) => s.name === staffName)?.id ?? staff[0]?.id ?? null;
    const branchId = branches[0]?.id ?? null;
    const activeCustomerId = effectiveCustomer?.id || customerId || null;

    let total = cartTotal;
    let isFree = false;
    let usedSubId: string | null = null;
    let notes: string | null = null;

    const isWash = (cat: string, isProd: boolean) => cat !== 'اشتراكات' && cat !== 'products' && !isProd;
    const washesCost = cart.reduce((s, i) => s + (isWash(i.service.category, !!(i.service as any).is_product) ? i.service.price * i.qty : 0), 0);
    
    total = cartTotal;
    
    if (hasActiveSub && customerSub) {
      total -= washesCost;
      usedSubId = customerSub.id;
      notes = tr('subscriptionDeducted', lang);
    } else if (isFreeWash) {
      total -= washesCost;
      isFree = true;
      notes = tr('free', lang);
    }
    
    if (appliedDiscount) {
      total -= discountAmount;
      notes = notes ? `${notes} | خصم: ${appliedDiscount.code}` : `تم تطبيق كود الخصم: ${appliedDiscount.code}`;
      incrementDiscountUsage(appliedDiscount.code, currentTenantId);
    }

    let cashAmt = 0;
    let cardAmt = 0;
    if (paymentMethod === 'cash') cashAmt = total;
    else if (paymentMethod === 'card') cardAmt = total;
    else { cashAmt = cashAmount; cardAmt = cardAmount; }

    let finalSale: Sale;

    try {
      const { data: saleData } = await supabase.from('sales').insert({
        customer_id: activeCustomerId,
        staff_id: staffId,
        branch_id: branchId,
        customer_subscription_id: usedSubId,
        total,
        cash_amount: cashAmt,
        card_amount: cardAmt,
        payment_method: paymentMethod,
        wash_count: cartWashes,
        is_free: isFree,
        notes,
      }).select().single();

      if (saleData) {
        finalSale = saleData as Sale;
      } else {
        finalSale = {
          id: 'inv-' + Date.now(),
          customer_id: activeCustomerId,
          staff_id: staffId,
          branch_id: branchId,
          customer_subscription_id: usedSubId,
          total,
          cash_amount: cashAmt,
          card_amount: cardAmt,
          payment_method: paymentMethod,
          wash_count: cartWashes,
          is_free: isFree,
          notes,
          is_refund: false,
          refund_amount: 0,
          refund_method: null,
          created_at: new Date().toISOString(),
          subscription_id: null,
          original_sale_id: null,
        };
      }
    } catch {
      finalSale = {
        id: 'inv-' + Date.now(),
        customer_id: activeCustomerId,
        staff_id: staffId,
        branch_id: branchId,
        customer_subscription_id: usedSubId,
        total,
        cash_amount: cashAmt,
        card_amount: cardAmt,
        payment_method: paymentMethod,
        wash_count: cartWashes,
        is_free: isFree,
        notes,
        is_refund: false,
        refund_amount: 0,
        refund_method: null,
        created_at: new Date().toISOString(),
        subscription_id: null,
        original_sale_id: null,
      };
    }

    const invoiceItems = cart.map((i) => {
      const isW = isWash(i.service.category, !!(i.service as any).is_product);
      const shouldZero = (hasActiveSub || isFree) && isW;
      return {
        sale_id: finalSale.id,
        service_id: i.service.id,
        service_name: (shouldZero && hasActiveSub) ? `${i.service.name} (غسيل اشتراك)` : i.service.name,
        qty: i.qty,
        price: shouldZero ? 0 : i.service.price,
        line_total: shouldZero ? 0 : i.service.price * i.qty,
      };
    });

    try {
      await supabase.from('sale_items').insert(invoiceItems);
    } catch {
      // safe fallback
    }

    setLastInvoiceItems(invoiceItems);
    setLastInvoice(finalSale);
    setLastCustomer(effectiveCustomer || selectedCustomer || null);
    setWaPhone(effectiveCustomer?.phone || selectedCustomer?.phone || '');
    setSales((prev) => {
      const updated = [finalSale, ...prev.filter((s) => s.id !== finalSale.id)];
      localStorage.setItem(`tenant_sales_${currentTenantId}`, JSON.stringify(updated));
      return updated;
    });

    if (effectiveCustomer) {
      let subActivatedMsg = '';
      for (const item of cart) {
        if (item.service.id.startsWith('sub_') || item.service.category === 'اشتراكات') {
          const s = (item.service as any).original_sub || subs.find(x => x.id === item.service.id || x.id === item.service.id.replace('sub_', ''));
          const durationDays = Number(s?.duration_days || s?.durationDays || 30);
          const washesPerUnit = Number(s?.washes_included ?? s?.washes ?? 10);
          const totalWashesAdded = washesPerUnit * item.qty;
          const endDate = new Date();
          endDate.setDate(endDate.getDate() + durationDays);

          const carType = effectiveCustomer.vehicle_type || effectiveCustomer.vehicle_brand || 'سيارة سيدان';
          const carColor = effectiveCustomer.vehicle_color || 'أبيض';
          const plateNumber = effectiveCustomer.plate_number || 'غير مسجلة';
          const custName = effectiveCustomer.name || 'عميل مشترك';
          const custPhone = effectiveCustomer.phone || '';

          const newCs = {
            id: 'cs_' + Date.now() + Math.floor(Math.random() * 1000),
            customer_id: effectiveCustomer.id,
            subscription_id: s?.id || item.service.id.replace('sub_', '') || 'pkg_' + Date.now(),
            tenant_id: currentTenantId,
            package_name_snapshot: s?.name || item.service.name.replace(/^اشتراك:\s*/, ''),
            subscription_type: s?.subscription_type || 'عدد غسلات + مدة',
            vehicle_scope: s?.vehicle_scope || 'specific_vehicle',
            start_date: new Date().toISOString().slice(0, 10),
            end_date: endDate.toISOString().slice(0, 10),
            washes_used: 0,
            washes_remaining: totalWashesAdded,
            total_washes: totalWashesAdded,
            status: 'active',
            car_type: carType,
            car_color: carColor,
            plate_number: plateNumber,
            manual_price: item.service.price * item.qty,
            payment_method: paymentMethod,
            invoice_id: finalSale.id,
            included_services: s?.included_services || 'غسيل شامل وساطع VIP',
            customer_name: custName,
            customer_phone: custPhone,
          };
          try {
             const savedSub = saveTenantCustomerSubscription(newCs as any, currentTenantId);
             setCustSubs(prev => [savedSub, ...prev.filter(x => x.id !== savedSub.id)]);
             try {
               await supabase.from('customer_subscriptions').insert({
                 id: savedSub.id,
                 customer_id: savedSub.customer_id,
                 subscription_id: savedSub.subscription_id,
                 start_date: savedSub.start_date,
                 end_date: savedSub.end_date,
                 washes_used: 0,
                 washes_remaining: savedSub.washes_remaining,
                 status: 'active',
                 car_type: savedSub.car_type,
                 car_color: savedSub.car_color,
                 plate_number: savedSub.plate_number,
                 manual_price: savedSub.manual_price,
               });
             } catch {}
             window.dispatchEvent(new Event('raqam_data_updated'));
          } catch (err) {
             console.error('Error activating sub:', err);
          }
          subActivatedMsg = `🎉 تم سداد الفاتورة بنجاح وتفعيل ${s?.name || 'الاشتراك'} للعميل (${custName}) بـ (${totalWashesAdded}) غسلة لمدة ${durationDays} يوم!`;
        }
      }
      if (subActivatedMsg) {
        setLoyaltyMsg(subActivatedMsg);
      } else if (hasActiveSub && customerSub) {
        for(let w=0; w < cartWashes; w++) {
           consumeSubscriptionWash(customerSub.id, 'تم استهلاك من الكاشير - فاتورة: ' + finalSale.id, currentTenantId);
        }
        setLoyaltyMsg(tr('subscriptionDeducted', lang));
      } else if (isFree && loyaltyEnabled) {
        const remainingFreeWashes = Math.max(0, (selectedCustomer.free_washes_earned || 0) - 1);
        const updatedCust: Customer = {
          ...selectedCustomer,
          free_washes_earned: remainingFreeWashes,
          total_visits: (selectedCustomer.total_visits || 0) + cartWashes,
        };
        saveLocalCustomer(updatedCust);
        setCustomers((prev) => prev.map((c) => (c.id === customerId ? updatedCust : c)));

        try {
          await supabase.from('customers').update({
            free_washes_earned: remainingFreeWashes,
            total_visits: updatedCust.total_visits,
          }).eq('id', customerId);
        } catch { /* ignore */ }
        setLoyaltyMsg(tr('loyaltyUsed', lang));
      } else if (loyaltyEnabled) {
        const newStamps = (selectedCustomer.loyalty_stamps || 0) + cartWashes;
        const earned = Math.floor(newStamps / loyaltyTarget);
        const remStamps = newStamps % loyaltyTarget;
        const newFreeWashes = (selectedCustomer.free_washes_earned || 0) + earned;
        const newVisits = (selectedCustomer.total_visits || 0) + cartWashes;

        const updatedCust: Customer = {
          ...selectedCustomer,
          loyalty_stamps: remStamps,
          free_washes_earned: newFreeWashes,
          total_visits: newVisits,
        };

        saveLocalCustomer(updatedCust);
        setCustomers((prev) => prev.map((c) => (c.id === customerId ? updatedCust : c)));

        try {
          await supabase.from('customers').update({
            loyalty_stamps: remStamps,
            free_washes_earned: newFreeWashes,
            total_visits: newVisits,
          }).eq('id', customerId);
        } catch { /* ignore */ }

        if (earned > 0) {
          setLoyaltyMsg(`مبروك! ${tr('loyaltyEarned', lang)} (${earned} غسلة مجانية جديدة) 🎉`);
        } else {
          setLoyaltyMsg(`تم تسجيل الغسلة بنجاح! رصيد الأختام الحالي: ${remStamps}/${loyaltyTarget} 🚗`);
        }
      } else {
        const newVisits = (selectedCustomer.total_visits || 0) + cartWashes;
        const updatedCust: Customer = {
          ...selectedCustomer,
          total_visits: newVisits,
        };
        saveLocalCustomer(updatedCust);
        setCustomers((prev) => prev.map((c) => (c.id === customerId ? updatedCust : c)));
        try {
          await supabase.from('customers').update({ total_visits: newVisits }).eq('id', customerId);
        } catch {}
        setLoyaltyMsg('تم تسجيل البيع بنجاح!');
      }
    }

    setShowInvoice(true);
    setCart([]);
    setCustomerId('');
    setCashAmount(0);
    setCardAmount(0);
    setProcessing(false);
    setShowCheckout(false);
  };

  const getCleanPhone = (phone: string) => {
    const digits = phone.replace(/[^0-9]/g, '');
    if (!digits) return '';
    if (digits.startsWith('966')) return digits;
    if (digits.startsWith('05')) return '966' + digits.slice(1);
    if (digits.startsWith('5')) return '966' + digits;
    return digits;
  };

  const getWhatsAppInvoiceText = () => {
    if (!lastInvoice) return '';
    const itemsList = lastInvoiceItems.map((i) => `• ${i.service_name} (×${i.qty}) = ${formatSAR(i.line_total, lang)}`).join('\n');
    const company = settings?.company_name ?? 'مغسلة رقم النموذجية';
    const custName = lastCustomer?.name ? lastCustomer.name : 'عميلنا العزيز';
    let text = `أهلاً بك ${custName} 👋\nنشكرك لزيارتك *${company}* 🚗✨\n\n📄 *فاتورة خدمة رقم:* #${lastInvoice.id.slice(0, 8)}\n📅 *التاريخ:* ${formatDateTime(lastInvoice.created_at, lang)}\n💳 *طريقة الدفع:* ${tr(lastInvoice.payment_method, lang)}\n\n*تفاصيل الخدمات:*\n${itemsList}\n\n`;
    if ((lastInvoice as any).discount > 0) {
      text += `🎁 *الخصم ${(lastInvoice as any).discount_code ? `(${(lastInvoice as any).discount_code})` : ''}:* -${(lastInvoice as any).discount} ريال\n`;
    }
    text += `💰 *الإجمالي النهائي:* ${formatSAR(lastInvoice.total, lang)}\n\nسعدنا بخدمتك وننتظر زيارتك القادمة! 🌟`;
    return text;
  };

  const copyInvoiceText = () => {
    const msg = getWhatsAppInvoiceText();
    if (!msg) return;
    navigator.clipboard.writeText(msg);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const printInvoice = () => {
    if (!lastInvoice) return;
    const w = window.open('', '_blank');
    if (!w) return;
    const itemsRows = lastInvoiceItems.map((i) => `
      <tr>
        <td style="padding:6px 0;border-bottom:1px dashed #e2e8f0;">${i.service_name} <span style="font-size:11px;color:#64748b;">(×${i.qty})</span></td>
        <td style="padding:6px 0;border-bottom:1px dashed #e2e8f0;text-align:left;font-weight:bold;">${formatSAR(i.line_total, lang)}</td>
      </tr>
    `).join('');
    const vatNum = settings?.vat_number ? `الرقم الضريبي: ${settings.vat_number}` : '';
    const companyName = settings?.company_name ?? 'مغسلة رقم النموذجية';
    const custName = lastCustomer?.name ?? 'عميل نقد';
    const custPhone = lastCustomer?.phone ?? waPhone ?? '';

    
    const originalTotal = lastInvoiceItems.reduce((sum, item) => sum + item.line_total, 0);
    const discountAmt = originalTotal - lastInvoice.total;
    const hasDiscount = discountAmt > 0 && lastInvoice.total > 0;
    const discountInfo = hasDiscount ? `
            <div class="row" style="font-size:12px;color:#64748b;margin-bottom:4px;">
              <span>الإجمالي قبل الخصم:</span>
              <span style="text-decoration:line-through;">${formatSAR(originalTotal, lang)}</span>
            </div>
            <div class="row" style="font-size:12px;color:#ef4444;margin-bottom:6px;border-bottom:1px dashed #cbd5e1;padding-bottom:6px;">
              <span>قيمة الخصم:</span>
              <span>-${formatSAR(discountAmt, lang)}</span>
            </div>
    ` : '';
    w.document.write(`
      <!DOCTYPE html>
      <html dir="${isRTL ? 'rtl' : 'ltr'}">
      <head>
        <title>فاتورة #${lastInvoice.id.slice(0, 8)}</title>

        <meta charset="utf-8">
        <style>
          @page { size: auto; margin: 0; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 20px; max-width: 320px; margin: 0 auto; color: #0f172a; font-size: 13px; line-height: 1.4; }
          .center { text-align: center; }
          .brand { font-size: 18px; font-weight: 800; color: #0e7490; margin-bottom: 2px; }
          .sub { font-size: 11px; color: #64748b; }
          .dash { border-top: 1px dashed #cbd5e1; margin: 12px 0; }
          .row { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 12px; }
          .bold { font-weight: bold; }
          .total-card { background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0; margin-top: 10px; }
          .footer { font-size: 11px; color: #64748b; text-align: center; margin-top: 16px; }
        </style>
      </head>
      <body>
        <div class="center">
          <div class="brand">${companyName}</div>
          <div class="sub">فاتورة ضريبية مبسطة</div>
          ${vatNum ? `<div class="sub" style="margin-top:2px;">${vatNum}</div>` : ''}
        </div>
        <div class="dash"></div>
        <div class="row"><span>رقم الفاتورة:</span><span class="bold">#${lastInvoice.id.slice(0, 8)}</span></div>
        <div class="row"><span>التاريخ والوقت:</span><span>${formatDateTime(lastInvoice.created_at, lang)}</span></div>
        <div class="row"><span>العميل:</span><span class="bold">${custName}</span></div>
        ${custPhone ? `<div class="row"><span>الجوال:</span><span>${custPhone}</span></div>` : ''}
        <div class="row"><span>طريقة الدفع:</span><span>${tr(lastInvoice.payment_method, lang)}</span></div>
        <div class="dash"></div>
        <table style="width:100%;border-collapse:collapse;">
          ${itemsRows}
        </table>
                <div class="total-card">
          ${discountInfo}
          <div class="row bold" style="font-size:15px;color:#0f172a;margin:0;">
            <span>${hasDiscount ? 'الإجمالي بعد الخصم:' : 'الإجمالي المدفوع:'}</span>
            <span>${formatSAR(lastInvoice.total, lang)}</span>
          </div>
        </div>
        <div class="footer">
          شكراً لزيارتكم! يسعدنا خدمتكم ورأيكم يهمنا 🌸<br>
          مطبوعة عبر منصة رقم RQM
        </div>
        <script>
          window.onload = function() { window.print(); window.close(); }
        </script>
      </body>
      </html>
    `);
    w.document.close();
  };

  const printAnySale = (sale: Sale) => {
    const cust = customers.find((c) => c.id === sale.customer_id) || (sale as any).customer;
    const w = window.open('', '_blank');
    if (!w) return;

    const companyName = settings?.company_name ?? 'مغسلة رقم النموذجية';
    const vatNum = settings?.vat_number ? `الرقم الضريبي: ${settings.vat_number}` : '';

    w.document.write(`
      <!DOCTYPE html>
      <html dir="${isRTL ? 'rtl' : 'ltr'}">
      <head>
        <title>فاتورة #${sale.id.slice(0, 8)}</title>
        <meta charset="utf-8">
        <style>
          @page { size: auto; margin: 0; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 20px; max-width: 320px; margin: 0 auto; color: #0f172a; font-size: 13px; line-height: 1.4; }
          .center { text-align: center; }
          .brand { font-size: 18px; font-weight: 800; color: #0e7490; margin-bottom: 2px; }
          .sub { font-size: 11px; color: #64748b; }
          .dash { border-top: 1px dashed #cbd5e1; margin: 12px 0; }
          .row { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 12px; }
          .bold { font-weight: bold; }
          .total-card { background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0; margin-top: 10px; }
          .footer { font-size: 11px; color: #64748b; text-align: center; margin-top: 16px; }
          .refund-stamp { color: #e11d48; border: 2px solid #e11d48; padding: 4px; border-radius: 6px; font-weight: bold; text-align: center; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="center">
          <div class="brand">${companyName}</div>
          <div class="sub">فاتورة ضريبية مبسطة</div>
          ${vatNum ? `<div class="sub" style="margin-top:2px;">${vatNum}</div>` : ''}
        </div>
        <div class="dash"></div>
        ${sale.is_refund ? `<div class="refund-stamp">⚠️ فاتورة مرتجعة (${formatSAR(sale.refund_amount || sale.total, lang)})</div>` : ''}
        <div class="row"><span>رقم الفاتورة:</span><span class="bold">#${sale.id.slice(0, 8)}</span></div>
        <div class="row"><span>التاريخ والوقت:</span><span>${formatDateTime(sale.created_at, lang)}</span></div>
        <div class="row"><span>العميل:</span><span class="bold">${cust?.name || 'عميل نقدي'}</span></div>
        ${cust?.phone ? `<div class="row"><span>الجوال:</span><span>${cust.phone}</span></div>` : ''}
        ${cust?.plate_number ? `<div class="row"><span>المركبة / اللوحة:</span><span>${cust.vehicle_type || ''} (${cust.plate_number})</span></div>` : ''}
        <div class="row"><span>طريقة الدفع:</span><span>${sale.payment_method === 'cash' ? 'نقدي' : 'شبكة / مدى'}</span></div>
        <div class="dash"></div>
        <div class="total-card">
          <div class="row bold" style="font-size:15px;color:#0f172a;margin:0;">
            <span>${sale.is_refund ? 'المبلغ المرتجع:' : 'الإجمالي المدفوع:'}</span>
            <span>${formatSAR(sale.is_refund ? Math.abs(sale.refund_amount || sale.total) : sale.total, lang)}</span>
          </div>
        </div>
        <div class="footer">
          شكراً لزيارتكم! يسعدنا خدمتكم ورأيكم يهمنا 🌸<br>
          مطبوعة عبر منصة رقم RQM
        </div>
        <script>
          window.onload = function() { window.print(); window.close(); }
        </script>
      </body>
      </html>
    `);
    w.document.close();
  };

  const processRefund = async () => {
    if (!showRefund || !refundForm.amount) return;
    const refundSale: any = {
      id: 'ref-' + Date.now(),
      customer_id: showRefund.customer_id, staff_id: showRefund.staff_id, branch_id: showRefund.branch_id,
      total: -Number(refundForm.amount), payment_method: 'cash',
      cash_amount: refundForm.method === 'cash' ? -Number(refundForm.amount) : 0,
      card_amount: refundForm.method === 'bank' ? -Number(refundForm.amount) : 0,
      wash_count: 0, is_free: false, is_refund: true, refund_amount: Number(refundForm.amount),
      refund_method: refundForm.method, original_sale_id: showRefund.id,
      notes: `Refund for ${showRefund.id.slice(0, 8)}`,
      created_at: new Date().toISOString(),
    };

    try { await supabase.from('sales').insert(refundSale); } catch {}
    try { await supabase.from('sales').update({ is_refund: true, refund_amount: Number(refundForm.amount) }).eq('id', showRefund.id); } catch {}
    
    setSales((prev) => {
      const updated = [refundSale, ...prev.map((s) => s.id === showRefund.id ? { ...s, is_refund: true, refund_amount: Number(refundForm.amount) } : s)];
      localStorage.setItem(`tenant_sales_${currentTenantId}`, JSON.stringify(updated));
      return updated;
    });

    // If original sale used a subscription, restore a wash
    if (showRefund.customer_subscription_id) {
      const cs = custSubs.find((c) => c.id === showRefund.customer_subscription_id);
      if (cs) {
        await supabase.from('customer_subscriptions').update({
          washes_used: Math.max(cs.washes_used - showRefund.wash_count, 0),
          washes_remaining: cs.washes_remaining + showRefund.wash_count,
          status: 'active',
        }).eq('id', cs.id);
      }
    }
    // If original sale earned stamps, remove them
    if (showRefund.customer_id && !showRefund.customer_subscription_id && !showRefund.is_free) {
      const cust = customers.find((c) => c.id === showRefund.customer_id);
      if (cust) {
        await supabase.from('customers').update({
          loyalty_stamps: Math.max(cust.loyalty_stamps - showRefund.wash_count, 0),
        }).eq('id', cust.id);
      }
    }
    setRefundForm({ method: 'cash', amount: 0 });
    setShowRefund(null);
    await loadData();
  };

  const printSubInvoice = () => {
    if (!lastSubInvoice) return;
    const { customer, sub } = lastSubInvoice;
    const w = window.open('', '_blank');
    if (!w) return;
    const company = settings?.company_name ?? tr('appName', lang);
    w.document.write(`
      <!DOCTYPE html>
      <html dir="${isRTL ? 'rtl' : 'ltr'}">
      <head>
        <title>فاتورة اشتراك - ${sub.package_name || 'اشتراك غسيل'}</title>
        <meta charset="utf-8">
        <style>
          @page { size: auto; margin: 0; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 20px; max-width: 380px; margin: 0 auto; color: #0f172a; font-size: 13px; line-height: 1.5; }
          .center { text-align: center; }
          .brand { font-size: 18px; font-weight: 800; color: #0e7490; margin-bottom: 2px; }
          .sub { font-size: 12px; color: #64748b; font-weight: 600; }
          .dash { border-top: 1px dashed #cbd5e1; margin: 12px 0; }
          .row { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 12px; }
          .bold { font-weight: bold; }
          .box { background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 10px 0; }
          .footer { font-size: 11px; color: #64748b; text-align: center; margin-top: 16px; }
        </style>
      </head>
      <body>
        <div class="center">
          <div class="brand">${company}</div>
          <div class="sub">إيصال شراء وتفعيل اشتراك مغسلة</div>
        </div>
        <div class="dash"></div>
        <div class="row"><span>العميل:</span><span class="bold">${customer.name}</span></div>
        <div class="row"><span>رقم الجوال:</span><span class="bold">${customer.phone || '-'}</span></div>
        <div class="row"><span>اسم الباقة:</span><span class="bold">${sub.package_name || 'باقة غسيل'}</span></div>
        <div class="row"><span>سيارة العميل:</span><span class="bold">${sub.car_type || 'سيارة'}</span></div>
        <div class="row"><span>لون السيارة:</span><span class="bold" style="color:#0e7490;">${sub.car_color || 'أبيض'}</span></div>
        <div class="row"><span>رقم اللوحة:</span><span class="bold">${sub.plate_number || 'غير مسجلة'}</span></div>
        <div class="dash"></div>
        <div class="row"><span>تاريخ التفعيل:</span><span>${sub.start_date}</span></div>
        <div class="row"><span>تاريخ انتهاء الاشتراك:</span><span>${sub.end_date}</span></div>
        <div class="row"><span>رصيد الغسلات:</span><span class="bold">${sub.wash_limit} غسلة</span></div>
        <div class="box">
          <div class="row bold" style="font-size:15px;color:#0e7490;margin:0;">
            <span>المبلغ المدفوع:</span>
            <span>${formatSAR(sub.manual_price, lang)}</span>
          </div>
        </div>
        <div class="footer">
          شكراً لثقتكم بـ ${company} 🌸<br>
          نتمنى لكم تجربة ممتازة
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `);
    w.document.close();
  };

  const shareSubWhatsApp = () => {
    if (!lastSubInvoice || !lastSubInvoice.customer.phone) return;
    const { customer, sub } = lastSubInvoice;
    const company = settings?.company_name ?? tr('appName', lang);
    const msg = `🌸 *${company} — إيصال تفعيل الاشتراك*\n\n` +
      `👤 *العميل:* ${customer.name}\n` +
      `📦 *الباقة:* ${sub.package_name || 'اشتراك غسيل'}\n` +
      `🚗 *السيارة:* ${sub.car_type || 'سيارة'} — *اللون:* ${sub.car_color || 'أبيض'}\n` +
      `🔢 *اللوحة:* ${sub.plate_number || 'غير مسجلة'}\n` +
      `📅 *الصلاحية:* من ${sub.start_date} إلى ${sub.end_date}\n` +
      `🧼 *عدد الغسلات:* ${sub.wash_limit} غسلة\n` +
      `💰 *المبلغ المدفوع:* ${formatSAR(sub.manual_price, lang)}\n\n` +
      `شكراً لتعاملكم معنا ✨`;
    const phone = (customer.phone ?? '').replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const payIcons: Record<string, typeof Banknote> = { cash: Banknote, card: CreditCard, split: SplitSquareHorizontal, transfer: Building };

  return (
    <div>
      <PageHeader title={tr('salesTitle', lang)} subtitle={tr('salesSubtitle', lang)} />

      {/* POS Top Header: Cashier, Cash in Drawer, and Close Shift */}
      <Card className="mb-4 bg-white border border-surface-200/80 shadow-xs">
        <CardBody className="py-3.5 px-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-extrabold text-base shadow-xs shrink-0" style={{ background: `linear-gradient(135deg, ${settings?.brand_color ?? '#0e7490'}, ${settings?.brand_accent ?? '#2563eb'})` }}>
                  {staffName.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-bold text-surface-800 leading-tight">{staffName}</p>
                  <p className="text-[11px] text-surface-400 mt-0.5">{tr('seller', lang)}</p>
                </div>
              </div>

              <div className="h-8 w-px bg-surface-200/80 hidden lg:block" />

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 bg-emerald-50/80 px-3 py-1.5 rounded-xl border border-emerald-200">
                  <Wallet className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-[10px] font-semibold text-emerald-800">صندوق الوردية</p>
                    <p className="text-xs font-extrabold text-emerald-700 leading-tight">{formatSAR(shiftCashTotal, lang)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-teal-50/80 px-3 py-1.5 rounded-xl border border-teal-200">
                  <Car className="w-4 h-4 text-teal-600 shrink-0" />
                  <div>
                    <p className="text-[10px] font-semibold text-teal-800">غسلات الاشتراك اليوم</p>
                    <p className="text-xs font-extrabold text-teal-700 leading-tight">
                      {sales.filter((s) => new Date(s.created_at).toDateString() === new Date().toDateString() && (s.customer_subscription_id || s.payment_method === 'subscription' || (s.notes && s.notes.includes('اشتراك')))).reduce((sum, s) => sum + Number(s.wash_count || 1), 0)} غسلة
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-amber-50/80 px-3 py-1.5 rounded-xl border border-amber-200">
                  <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                  <div>
                    <p className="text-[10px] font-semibold text-amber-900">الاشتراكات النشطة</p>
                    <p className="text-xs font-extrabold text-amber-800 leading-tight">
                      {custSubs.filter((s) => (s.washes_remaining ?? 0) > 0).length} اشتراك
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={handleCloseShift}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
              >
                <X className="w-4 h-4 shrink-0" />
                <span>إغلاق الورديّة</span>
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Main Cashier Mode Switcher Tabs */}
      <div className="mb-6 bg-white p-2.5 rounded-2xl border-2 border-surface-200/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setCashierMainMode('cash_sales')}
            className={`flex-1 sm:flex-initial px-5 py-3 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
              cashierMainMode === 'cash_sales'
                ? 'bg-surface-900 text-white shadow-md ring-2 ring-surface-900'
                : 'bg-surface-100 text-surface-700 hover:bg-surface-200'
            }`}
          >
            <ShoppingCart className="w-5 h-5 text-primary-400" />
            <span>🛒 المبيعات المباشرة (نقدي / شبكة / شراء جديد)</span>
          </button>

          <button
            type="button"
            onClick={() => setCashierMainMode('sub_wash')}
            className={`flex-1 sm:flex-initial px-5 py-3 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 relative cursor-pointer ${
              cashierMainMode === 'sub_wash'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md ring-2 ring-emerald-500'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <Car className="w-5 h-5 text-amber-300 animate-bounce" />
            <span>💎 غسيل الاشتراك (خصم من رصيد الاشتراك)</span>
            <span className="bg-amber-400 text-surface-950 text-[10px] font-black px-2 py-0.5 rounded-full shadow-2xs">
              {custSubs.filter((s) => (s.washes_remaining ?? 0) > 0).length} نشط
            </span>
          </button>
        </div>

        <div className="text-xs font-bold text-surface-600 flex items-center gap-1.5 px-3 py-2 bg-surface-50 rounded-xl border border-surface-200 w-full sm:w-auto justify-center sm:justify-start">
          <span className="text-emerald-700 font-extrabold">💡 وضع الكاشير الحالي:</span>
          <span>
            {cashierMainMode === 'cash_sales'
              ? 'مبيعات الكاش والشبكة والباقات الجديدة'
              : 'خصم الغسلات المباشرة لعملاء الاشتراكات (0 ر.س)'}
          </span>
        </div>
      </div>

      {/* Tab 1: Cash Sales & Direct Checkout */}
      {cashierMainMode === 'cash_sales' && (
        <>
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${customerId ? 'bg-emerald-100 text-emerald-700' : 'text-white'}`} style={!customerId ? { background: `linear-gradient(135deg, ${settings?.brand_color ?? '#0e7490'}, ${settings?.brand_accent ?? '#2563eb'})` } : undefined}>
              <span className="w-5 h-5 rounded-full bg-white/30 flex items-center justify-center text-xs">1</span>
              {tr('step1Customer', lang)}
              {customerId && <Check className="w-4 h-4" />}
            </div>
            <div className={`h-px flex-1 ${customerId ? 'bg-emerald-300' : 'bg-surface-200'}`} />
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${cart.length > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-surface-100 text-surface-400'}`}>
              <span className="w-5 h-5 rounded-full bg-surface-200 flex items-center justify-center text-xs">2</span>
              {tr('step2Services', lang)}
              {cart.length > 0 && <Check className="w-4 h-4" />}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Service catalog */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader
              title={tr('serviceCatalog', lang)}
              subtitle={tr('addToCart', lang)}
              action={
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={() => setShowAddCust(true)} className="flex items-center gap-1.5 text-xs bg-amber-600 hover:bg-amber-700 text-white font-bold">
                    <UserPlus className="w-4 h-4" />
                    <span>+ إضافة عميل سريع</span>
                  </Button>
                  <Button size="sm" onClick={() => setShowSubForm(true)} className="flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                    <Car className="w-4 h-4" />
                    <span>شراء اشتراك / باقة</span>
                  </Button>
                  {can('products.add') && (
                    <Button size="sm" onClick={() => setShowAddServiceModal(true)} className="flex items-center gap-1.5 text-xs bg-primary-700 hover:bg-primary-800 text-white">
                      <Plus className="w-4 h-4" />
                      <span>إضافة خدمة / منتج</span>
                    </Button>
                  )}
                </div>
              }
            />
            <CardBody>
              {/* Category tabs */}
              <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 border-b border-surface-100">
                <button
                  type="button"
                  onClick={() => setCatalogTab('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${catalogTab === 'all' ? 'bg-surface-900 text-white shadow-xs' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'}`}
                >
                  الكل ({services.filter(s => s.category !== 'اشتراكات' && s.category !== 'subscriptions').length + subs.filter(s => s.active !== false).length})
                </button>
                <button
                  type="button"
                  onClick={() => setCatalogTab('washes')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${catalogTab === 'washes' ? 'bg-primary-700 text-white shadow-xs' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'}`}
                >
                  💧 خدمات الغسيل ({services.filter(s => s.category !== 'products' && !(s as any).is_product && s.category !== 'اشتراكات' && s.category !== 'subscriptions').length})
                </button>
                <button
                  type="button"
                  onClick={() => setCatalogTab('subscriptions')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${catalogTab === 'subscriptions' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'}`}
                >
                  💎 باقات الاشتراكات ({subs.filter(s => s.active !== false).length})
                </button>
                <button
                  type="button"
                  onClick={() => setCatalogTab('products')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${catalogTab === 'products' ? 'bg-amber-600 text-white shadow-xs' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'}`}
                >
                  🧴 المنتجات والمستلزمات ({services.filter(s => (s.category === 'products' || (s as any).is_product) && s.category !== 'اشتراكات' && s.category !== 'subscriptions').length})
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {/* Render Services (Washes & Products, excluding Subscriptions) */}
                {(catalogTab === 'all' || catalogTab === 'washes' || catalogTab === 'products') &&
                  services
                    .filter((s) => {
                      if (s.category === 'اشتراكات' || s.category === 'subscriptions') return false;
                      if (catalogTab === 'washes') return s.category !== 'products' && !(s as any).is_product;
                      if (catalogTab === 'products') return s.category === 'products' || (s as any).is_product;
                      return true;
                    })
                    .map((s) => (
                      <button key={s.id} disabled={!can('sales.create')} onClick={() => addToCart(s)} className={`p-4 rounded-xl border border-surface-200 transition-all text-right group relative flex flex-col justify-between h-full min-h-[120px] ${can('sales.create') ? 'hover:border-primary-400 hover:bg-primary-50/50 cursor-pointer' : 'opacity-70 cursor-not-allowed'}`}>
                        <div>
                          <span className="text-xs font-semibold text-surface-500 bg-surface-100 px-2 py-0.5 rounded-md inline-block mb-2">
                            {s.category || 'خدمة'}
                          </span>
                          <p className="font-bold text-surface-800 text-sm leading-snug break-words">{s.name}</p>
                        </div>
                        <div className="mt-3">
                          <p className="text-lg font-black" style={{ color: settings?.brand_color ?? '#0e7490' }}>{formatSAR(s.price, lang)}</p>
                          <p className="text-xs text-surface-500 mt-1">{s.duration_min} {tr('min', lang)}</p>
                        </div>
                      </button>
                    ))}

                {/* Render Subscription Package Cards */}
                {(catalogTab === 'all' || catalogTab === 'subscriptions') &&
                  subs
                    .filter((pkg) => pkg.active !== false)
                    .map((pkg) => {
                      const price = pkg.monthly_price || pkg.price_monthly || pkg.price || 0;
                      const washes = pkg.washes_included ?? pkg.washes ?? 0;
                      const days = pkg.duration_days || pkg.durationDays || 30;
                      return (
                        <button
                          key={'pkg_' + pkg.id}
                          disabled={!can('sales.create')}
                          onClick={() => {
                            const pkgService: Service = {
                              id: 'sub_' + pkg.id,
                              name: `اشتراك: ${pkg.name}`,
                              price: Number(price),
                              category: 'اشتراكات',
                              duration_min: 0,
                              is_product: false,
                              original_sub: pkg,
                            } as any;
                            addToCart(pkgService);
                          }}
                          className={`p-3.5 rounded-xl border-2 border-emerald-300/80 bg-gradient-to-br from-emerald-50/60 to-primary-50/40 transition-all text-right group relative flex flex-col justify-between h-full min-h-[130px] shadow-2xs ${can('sales.create') ? 'hover:border-emerald-500 hover:shadow-md cursor-pointer' : 'opacity-70 cursor-not-allowed'}`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-1 mb-2">
                              <span className="text-[11px] font-extrabold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-md flex items-center gap-1">
                                💎 باقة اشتراك
                              </span>
                              <span className="text-[10px] font-bold text-primary-800 bg-primary-100 px-1.5 py-0.5 rounded">
                                {washes} غسلة
                              </span>
                            </div>
                            <p className="font-extrabold text-surface-900 text-sm leading-snug break-words">{pkg.name}</p>
                            <p className="text-[11px] text-surface-500 font-medium mt-1">صلاحية {days} يوم</p>
                          </div>
                          <div className="mt-3 flex items-center justify-between border-t border-emerald-100/80 pt-2">
                            <p className="text-base font-black text-emerald-700">{formatSAR(price, lang)}</p>
                            <span className="text-[11px] font-bold text-emerald-700 bg-white border border-emerald-300 px-2 py-0.5 rounded-lg group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 transition-colors">
                              + إضافة لسلة العميل
                            </span>
                          </div>
                        </button>
                      );
                    })}
              </div>
            </CardBody>
          </Card>

          <div className="mt-4 p-3.5 bg-surface-50 border border-surface-200 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-surface-800">سجل الفواتير والمرتجعات</p>
              <p className="text-[11px] text-surface-500 mt-0.5">يمكنك عرض جميع الفواتير السابقة، طباعتها، وإجراء عمليات المرتجع من تبويب الفواتير المستقل.</p>
            </div>
            <a
              href="#invoices"
              onClick={(e) => {
                e.preventDefault();
                window.location.hash = 'invoices';
              }}
              className="px-3 py-1.5 bg-primary-700 hover:bg-primary-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 shrink-0"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>الانتقال للفواتير</span>
            </a>
          </div>
        </div>

        {/* Cart */}
        <div>
          <Card className="sticky top-20">
            <CardHeader title={tr('invoice', lang)} action={cart.length > 0 ? <button onClick={() => setCart([])} className="text-surface-400 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button> : null} />
            <CardBody>
              {/* Customer select */}
              <div className="mb-3">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className={`w-4 h-4 absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-surface-400`} />
                    <Input placeholder={tr('searchCustomer', lang)} value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} className={isRTL ? 'pr-10' : 'pl-10'} />
                  </div>
                  <Button
                    type="button"
                    onClick={() => setShowAddCust(true)}
                    className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3 py-2 rounded-xl shrink-0 flex items-center gap-1 shadow-xs transition-all"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>+ عميل جديد</span>
                  </Button>
                </div>

                {/* Callout if cart has subscription and no customer is selected */}
                {cart.some(i => i.service.id.startsWith('sub_') || i.service.category === 'اشتراكات') && !selectedCustomer && (
                  <div className="mt-2.5 p-3 bg-amber-50 border-2 border-amber-300 rounded-2xl flex flex-col gap-1.5 animate-fadeIn">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-black text-amber-950 flex items-center gap-1">
                        <span>⚠️ يلزم إضافة/تحديد عميل للاشتراك</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowAddCust(true)}
                        className="bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-black px-2.5 py-1 rounded-lg shadow-xs transition-all flex items-center gap-1 shrink-0"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>+ إضافة عميل</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-amber-800 font-medium leading-tight">
                      أضف اسم العميل ورقم جواله لربط الغسلات والاشتراك بحسابه فور تسديد الفاتورة.
                    </p>
                  </div>
                )}

                {/* Quick select test customer chips if no customer selected & no search input */}
                {!selectedCustomer && !customerSearch && customers.length > 0 && (
                  <div className="mt-2">
                    <p className="text-[11px] font-semibold text-surface-400 mb-1.5 flex items-center justify-between">
                      <span>عملاء تجريبين لاختبار الربط السريع:</span>
                      <button onClick={() => setShowAddCust(true)} className="text-primary-600 hover:underline text-[10px]">
                        + جديد
                      </button>
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {customers.slice(0, 4).map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setCustomerId(c.id)}
                          className="text-[11px] bg-surface-100 hover:bg-primary-100 text-surface-700 hover:text-primary-800 px-2.5 py-1 rounded-lg transition-colors border border-surface-200/60 font-medium"
                        >
                          {c.name} {c.plate_number ? `(${c.plate_number})` : ''}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {customerSearch && (
                  <div className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-surface-200">
                    {filteredCustomers.slice(0, 5).map((c) => (
                      <button key={c.id} onClick={() => { setCustomerId(c.id); setCustomerSearch(''); }} className={`w-full text-${isRTL ? 'right' : 'left'} px-3 py-2 hover:bg-surface-50 border-b border-surface-50 last:border-0`}>
                        <p className="text-sm font-medium text-surface-700">{c.name}</p>
                        <p className="text-xs text-surface-400">{c.plate_number} {loyaltyEnabled && `• ${c.loyalty_stamps}/${loyaltyTarget}`}</p>
                      </button>
                    ))}
                    <button onClick={() => setShowAddCust(true)} className="w-full text-primary-600 text-sm font-medium px-3 py-2 hover:bg-primary-50 flex items-center gap-1.5">
                      <UserPlus className="w-3.5 h-3.5" /> {tr('addCustomerQuick', lang)}
                    </button>
                  </div>
                )}
                {selectedCustomer && (
                  <div className="mt-2 p-3 rounded-xl bg-primary-50 border border-primary-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: `linear-gradient(135deg, ${settings?.brand_color ?? '#0e7490'}, ${settings?.brand_accent ?? '#2563eb'})` }}>{selectedCustomer.name.charAt(0)}</div>
                        <span className="text-sm font-medium text-surface-700">{selectedCustomer.name}</span>
                      </div>
                      <button onClick={() => setCustomerId('')} className="text-xs text-surface-400 hover:text-rose-500"><X className="w-4 h-4" /></button>
                    </div>

                    {customerSub && (customerSub.washes_remaining ?? 0) > 0 && (
                      <div className="mt-2.5 p-3 rounded-2xl bg-gradient-to-br from-emerald-50 via-primary-50 to-emerald-100/60 border-2 border-emerald-400 shadow-xs space-y-2">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span>💎 {customerSub.package_name_snapshot || (customerSub as any).package_name || subDef?.name || 'اشتراك نشط'}</span>
                          </span>
                          <span className="text-xs font-black text-white bg-emerald-700 px-2.5 py-0.5 rounded-full shadow-2xs">
                            متبقي {customerSub.washes_remaining} غسلات
                          </span>
                        </div>

                        {(customerSub.car_type || customerSub.plate_number) && (
                          <div className="text-[11px] text-emerald-950 font-medium bg-white/90 p-2 rounded-xl border border-emerald-200/80 flex items-center justify-between">
                            <span>🚗 السيارة: <strong>{customerSub.car_type || 'سيارة'} {customerSub.car_color ? `(${customerSub.car_color})` : ''}</strong></span>
                            {customerSub.plate_number && <span className="font-bold bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded border border-emerald-300 font-mono text-[10px]">{customerSub.plate_number}</span>}
                          </div>
                        )}

                        <div className="flex items-center justify-between text-[11px] text-emerald-800 font-semibold px-0.5">
                          <span>الصلاحية: {customerSub.end_date || 'غير محدد'}</span>
                          <span>الرصيد الكلي: {customerSub.total_washes || '—'} غسلة</span>
                        </div>

                        <button
                          type="button"
                          onClick={handleQuickSubscriptionWash}
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all border border-emerald-500 cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>تسجيل غسلة من الاشتراك فوراً (0 ر.س) ⚡</span>
                        </button>
                      </div>
                    )}

                    {loyaltyEnabled && (
                      <div className="flex items-center gap-1 mt-2">
                        {Array.from({ length: loyaltyTarget }).map((_, i) => (
                          <span key={i} className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${i < selectedCustomer.loyalty_stamps ? 'text-white' : 'bg-surface-200 text-surface-400'}`} style={i < selectedCustomer.loyalty_stamps ? { background: settings?.brand_color ?? '#0e7490' } : undefined}>★</span>
                        ))}
                        <span className="text-xs text-surface-500 mx-1">{selectedCustomer.loyalty_stamps}/{loyaltyTarget}</span>
                      </div>
                    )}

                    {loyaltyEnabled && selectedCustomer.free_washes_earned > 0 && (
                      <div className="mt-2 p-2 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-between border border-emerald-200">
                        <span className="flex items-center gap-1"><Gift className="w-4 h-4 text-emerald-600" /> لديه {selectedCustomer.free_washes_earned} غسلة مجانية مستحقة!</span>
                        <Badge tone="emerald">مستحقة</Badge>
                      </div>
                    )}

                    {isFreeWash && <p className="text-xs text-emerald-600 mt-1.5 flex items-center gap-1"><Gift className="w-3 h-3" /> {tr('free', lang)}!</p>}

                    <button onClick={() => setShowSubForm(true)} className="mt-2.5 w-full text-xs font-bold text-primary-700 bg-primary-100/50 hover:bg-primary-100 py-2 rounded-xl border border-primary-300 flex items-center justify-center gap-1.5 transition-all">
                      <Car className="w-3.5 h-3.5" /> شراء / تجديد اشتراك للعميل
                    </button>
                  </div>
                )}
                {!selectedCustomer && !customerSearch && (
                  <button onClick={() => setShowAddCust(true)} className="w-full mt-2 text-sm text-primary-600 font-medium flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-primary-300 hover:bg-primary-50">
                    <UserPlus className="w-4 h-4" /> {tr('addCustomerQuick', lang)}
                  </button>
                )}
              </div>

              {/* Cart items */}
              {cart.length === 0 ? <EmptyState message={tr('emptyCart', lang)} /> : (
                <div className="space-y-2 mb-4">
                  {hasActiveSub && (
                    <div className="p-3 rounded-2xl bg-emerald-600 text-white shadow-xs space-y-1">
                      <div className="flex items-center justify-between text-xs font-black">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                          <span>تطبيق غسيل الاشتراك تلقائياً</span>
                        </span>
                        <span className="bg-white/20 px-2 py-0.5 rounded-full text-[11px] font-mono">0.00 SAR</span>
                      </div>
                      <p className="text-[11px] text-emerald-100 font-medium leading-snug">
                        مغطى باشتراك العميل ({customerSub?.package_name_snapshot || 'اشتراك نشط'}). سيتم خصم غسلة واحدة من الرصيد.
                      </p>
                    </div>
                  )}

                  {cart.map((i) => {
                    const isWash = isWashItem(i.service.category, (i.service as any).is_product);
                    const itemCoveredBySub = hasActiveSub && isWash;
                    return (
                      <div key={i.service.id} className={`flex items-center justify-between p-2.5 rounded-xl border ${itemCoveredBySub ? 'bg-emerald-50/70 border-emerald-300' : 'bg-surface-50 border-surface-100'}`}>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-surface-800 truncate">{i.service.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {itemCoveredBySub ? (
                              <>
                                <span className="text-xs text-surface-400 line-through font-mono">{formatSAR(i.service.price, lang)}</span>
                                <span className="text-[10px] font-black bg-emerald-600 text-white px-1.5 py-0.5 rounded">
                                  💎 مشمول بالاشتراك (0 SAR)
                                </span>
                              </>
                            ) : (
                              <p className="text-xs text-surface-500 font-medium">{formatSAR(i.service.price, lang)}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => updateQty(i.service.id, -1)} className="w-6 h-6 rounded-lg bg-white border border-surface-200 text-surface-600 hover:bg-surface-100 font-bold">-</button>
                          <span className="text-sm font-bold w-5 text-center">{i.qty}</span>
                          <button onClick={() => updateQty(i.service.id, 1)} className="w-6 h-6 rounded-lg bg-white border border-surface-200 text-surface-600 hover:bg-surface-100 font-bold">+</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Payment */}
              <div className="space-y-2 mb-3">
                <div className="grid grid-cols-4 gap-2">
                  {(['cash', 'card', 'transfer', 'split'] as const).map((m) => {
                    const Icon = payIcons[m];
                    return (
                      <button key={m} onClick={() => setPaymentMethod(m)} className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-medium transition-all ${paymentMethod === m ? 'text-white border-transparent' : 'border-surface-200 text-surface-500 hover:bg-surface-50'}`} style={paymentMethod === m ? { background: `linear-gradient(135deg, ${settings?.brand_color ?? '#0e7490'}, ${settings?.brand_accent ?? '#2563eb'})` } : undefined}>
                        <Icon className="w-4 h-4" />
                        {tr(m, lang)}
                      </button>
                    );
                  })}
                </div>
                {paymentMethod === 'split' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label>{tr('cashAmount', lang)}</Label><Input type="number" value={cashAmount} onChange={(e) => setCashAmount(Number(e.target.value))} /></div>
                    <div><Label>{tr('cardAmount', lang)}</Label><Input type="number" value={cardAmount} onChange={(e) => setCardAmount(Number(e.target.value))} /></div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mb-4 pt-3 border-t border-surface-100">
                <span className="text-sm text-surface-500">{tr('total', lang)}</span>
                <span className="text-xl font-bold text-surface-800">{formatSAR(adjustedCartTotal, lang)}</span>
              </div>

              <Button onClick={() => setShowCheckout(true)} disabled={cart.length === 0} className="w-full">
                <ShoppingCart className="w-4 h-4" /> {tr('checkout', lang)}
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>
      </>
      )}

      {/* Tab 2: Subscription Wash Station */}
      {cashierMainMode === 'sub_wash' && (
        <div className="space-y-4">
          {/* Subscription Wash Header Banner */}
          <Card className="border-2 border-emerald-400/80 bg-gradient-to-r from-emerald-900 via-surface-900 to-emerald-950 text-white overflow-hidden shadow-md">
            <CardBody className="p-5">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-emerald-500/20 text-emerald-300 text-xs font-black px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      محطة غسيل الاشتراكات الذكية
                    </span>
                    <span className="bg-amber-400/20 text-amber-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-400/30">
                      5 اشتراكات نشطة مجهزة للاختبار 🧪
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <span>⚡ تسجيل غسيل مشترك (خصم تلقائي 0 SAR)</span>
                  </h2>
                  <p className="text-xs text-surface-300 leading-relaxed">
                    اختر سيارة العميل واضغط على زر الخصم الفوري لتسجيل الغسلة تلقائياً، وتحديث رصيد العميل وطباعة الفاتورة بضغطة واحدة!
                  </p>
                </div>

                <Button
                  onClick={() => setShowSubForm(true)}
                  className="bg-emerald-500 hover:bg-emerald-600 text-surface-950 font-black text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 shrink-0 shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ بيع اشتراك جديد لعميل</span>
                </Button>
              </div>
            </CardBody>
          </Card>

          {/* Search & Filter Bar */}
          <Card className="border border-surface-200">
            <CardBody className="p-3.5">
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-surface-400 absolute right-3 top-3" />
                  <input
                    type="text"
                    value={subWashSearch}
                    onChange={(e) => setSubWashSearch(e.target.value)}
                    placeholder="ابحث باسم العميل، رقم الجوال، لوحة السيارة، أو اسم الباقة..."
                    className="w-full pr-9 pl-4 py-2 bg-surface-50 border border-surface-200 rounded-xl text-xs font-bold text-surface-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {subWashSearch && (
                    <button
                      type="button"
                      onClick={() => setSubWashSearch('')}
                      className="absolute left-3 top-2.5 text-surface-400 hover:text-surface-600 text-xs font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                  <span className="text-xs font-bold text-surface-600">
                    إجمالي الاشتراكات النشطة: <strong className="text-emerald-700 font-extrabold">{custSubs.filter(s => (s.washes_remaining ?? 0) > 0).length}</strong>
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Active Subscriptions Grid */}
          {(() => {
            const filtered = custSubs.filter((cs) => {
              if ((cs.washes_remaining ?? 0) <= 0) return false;
              if (!subWashSearch.trim()) return true;
              const q = subWashSearch.toLowerCase();
              const cName = (cs.customer_name || '').toLowerCase();
              const cPhone = (cs.customer_phone || '').toLowerCase();
              const pPlate = (cs.plate_number || '').toLowerCase();
              const pCar = (cs.car_type || '').toLowerCase();
              const pkgName = (cs.package_name_snapshot || (cs as any).package_name || '').toLowerCase();
              return cName.includes(q) || cPhone.includes(q) || pPlate.includes(q) || pCar.includes(q) || pkgName.includes(q);
            });

            if (filtered.length === 0) {
              return (
                <Card>
                  <CardBody className="p-8 text-center space-y-3">
                    <Car className="w-12 h-12 text-surface-300 mx-auto" />
                    <p className="text-sm font-bold text-surface-600">لا توجد اشتراكات نشطة تطابق البحث</p>
                    <p className="text-xs text-surface-400">تأكد من كتابة الاسم أو رقم اللوحة بشكل صحيح، أو قم ببيع اشتراك جديد للعميل.</p>
                  </CardBody>
                </Card>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((cs) => {
                  const totalW = cs.total_washes || (cs.washes_used + cs.washes_remaining) || 8;
                  const remaining = cs.washes_remaining ?? 0;
                  const percent = Math.min(100, Math.max(0, (remaining / totalW) * 100));

                  return (
                    <Card key={cs.id} className="border-2 border-emerald-300 hover:border-emerald-600 transition-all shadow-2xs hover:shadow-md bg-white flex flex-col justify-between">
                      <CardBody className="p-4 space-y-3">
                        {/* Customer Header */}
                        <div className="flex items-start justify-between gap-2 pb-2 border-b border-surface-100">
                          <div>
                            <h3 className="font-black text-sm text-surface-900 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              <span>{cs.customer_name || 'عميل مشترك'}</span>
                            </h3>
                            <p className="text-xs text-surface-500 font-mono mt-0.5">{cs.customer_phone || 'لا يوجد رقم'}</p>
                          </div>
                          <span className="text-[10px] font-black bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full border border-emerald-300 shrink-0">
                            💎 {cs.package_name_snapshot || (cs as any).package_name || 'اشتراك نشط'}
                          </span>
                        </div>

                        {/* Vehicle details */}
                        <div className="bg-surface-50 p-2.5 rounded-xl border border-surface-200/80 flex items-center justify-between text-xs">
                          <div>
                            <p className="text-surface-500 font-medium text-[11px]">السيارة المسجلة:</p>
                            <p className="font-bold text-surface-800">{cs.car_type || 'سيارة'} {cs.car_color ? `(${cs.car_color})` : ''}</p>
                          </div>
                          {cs.plate_number && (
                            <div className="bg-white px-2 py-1 rounded-lg border border-surface-300 font-mono font-black text-surface-900 text-xs shadow-2xs">
                              {cs.plate_number}
                            </div>
                          )}
                        </div>

                        {/* Wash Balance Progress */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-surface-600">رصيد الغسلات المتبقي:</span>
                            <span className="text-emerald-700 font-extrabold">
                              {remaining} من أصل {totalW} غسلات
                            </span>
                          </div>
                          <div className="w-full h-2.5 bg-surface-100 rounded-full overflow-hidden border border-surface-200">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 transition-all duration-500"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-surface-500 font-medium pt-1">
                          <span>الصلاحية: {cs.end_date || 'غير محدد'}</span>
                          <span>المستهلك: {cs.washes_used || 0} غسلة</span>
                        </div>

                        {/* Action Button */}
                        <Button
                          onClick={() => handleDirectSubWashDeduction(cs)}
                          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 border border-emerald-500"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                          <span>تسجيل غسلة من الاشتراك (0 ر.س) ⚡</span>
                        </Button>
                      </CardBody>
                    </Card>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {loyaltyMsg && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl bg-emerald-600 text-white shadow-lg text-sm font-medium animate-pulse">
          {loyaltyMsg}
        </div>
      )}

      {/* Quick add customer */}
      <Modal open={showAddCust} onClose={() => setShowAddCust(false)} title={tr('addCustomerQuick', lang)}>
        <form onSubmit={(e) => { e.preventDefault(); addQuickCustomer(); }} className="space-y-3.5 text-right" dir="rtl">
          <div>
            <Label>{tr('name', lang)} *</Label>
            <Input
              autoFocus
              required
              placeholder="اسم العميل (مثلاً: عبد الله الأحمد)"
              value={newCust.name}
              onChange={(e) => setNewCust({ ...newCust, name: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <Label>{tr('phone', lang)}</Label>
            <Input
              type="tel"
              placeholder="رقم الجوال (مثلاً: 0501234567)"
              value={newCust.phone}
              onChange={(e) => setNewCust({ ...newCust, phone: e.target.value })}
              className="mt-1 font-mono text-right"
            />
          </div>
          <div>
            <Label>{tr('plateNumber', lang)}</Label>
            <Input
              placeholder="رقم اللوحة (مثلاً: ح ص ل 1122)"
              value={newCust.plate_number}
              onChange={(e) => setNewCust({ ...newCust, plate_number: e.target.value })}
              className="mt-1 font-mono text-right"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label>نوع السيارة</Label>
              <Input
                value={newCust.vehicle_type}
                onChange={(e) => setNewCust({ ...newCust, vehicle_type: e.target.value })}
                placeholder="سيدان / SUV"
              />
            </div>
            <div>
              <Label>ماركة السيارة</Label>
              <Input
                value={newCust.vehicle_brand}
                onChange={(e) => setNewCust({ ...newCust, vehicle_brand: e.target.value })}
                placeholder="تويوتا / لكزس"
              />
            </div>
            <div>
              <Label>لون السيارة *</Label>
              <Input
                value={newCust.vehicle_color}
                onChange={(e) => setNewCust({ ...newCust, vehicle_color: e.target.value })}
                placeholder="أبيض / أسود"
              />
            </div>
          </div>
          <Button type="submit" className="w-full bg-primary-700 hover:bg-primary-800 text-white font-bold py-2.5 rounded-xl shadow mt-2">
            حفظ واختيار العميل فوراً ⚡
          </Button>
        </form>
      </Modal>

      {/* Car subscription form */}
      <Modal open={showSubForm} onClose={() => setShowSubForm(false)} title="شراء وتفعيل اشتراك جديد" size="lg">
        <div className="space-y-4 text-right" dir="rtl">
          {/* Customer Selection / Quick Add Header */}
          <div className="bg-surface-50 p-3.5 rounded-2xl border border-surface-200/90 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-surface-200/80 pb-2.5">
              <Label className="text-surface-800 font-extrabold text-sm flex items-center gap-1.5">
                <span>👤 بيانات العميل المشتري *</span>
              </Label>
              <div className="flex items-center gap-1 bg-surface-200/80 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setSubCustMode('quick_add');
                    setCustomerId('');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    subCustMode === 'quick_add' ? 'bg-primary-700 text-white shadow-xs' : 'text-surface-600 hover:text-surface-900'
                  }`}
                >
                  ⚡ إضافة عميل جديد (سريعة)
                </button>
                <button
                  type="button"
                  onClick={() => setSubCustMode('existing')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    subCustMode === 'existing' ? 'bg-primary-700 text-white shadow-xs' : 'text-surface-600 hover:text-surface-900'
                  }`}
                >
                  🔍 اختيار عميل مسجل ({customers.length})
                </button>
              </div>
            </div>

            {subCustMode === 'quick_add' ? (
              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-bold text-surface-700">اسم العميل *</Label>
                    <Input
                      required
                      placeholder="اسم العميل (مثلاً: عبد الله الزهراني)"
                      value={subQuickCust.name}
                      onChange={(e) => setSubQuickCust({ ...subQuickCust, name: e.target.value })}
                      className="mt-1 bg-white"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-surface-700">رقم الجوال *</Label>
                    <Input
                      type="tel"
                      placeholder="رقم الجوال (مثلاً: 0501234567)"
                      value={subQuickCust.phone}
                      onChange={(e) => setSubQuickCust({ ...subQuickCust, phone: e.target.value })}
                      className="mt-1 font-mono text-right bg-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs text-surface-600">نوع/ماركة السيارة</Label>
                    <Input
                      placeholder="تويوتا كامري / سيدان"
                      value={subQuickCust.car_type}
                      onChange={(e) => setSubQuickCust({ ...subQuickCust, car_type: e.target.value })}
                      className="mt-0.5 bg-white text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-surface-600">لون السيارة</Label>
                    <Input
                      placeholder="أبيض لؤلؤي / أسود"
                      value={subQuickCust.car_color}
                      onChange={(e) => setSubQuickCust({ ...subQuickCust, car_color: e.target.value })}
                      className="mt-0.5 bg-white text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-surface-600">رقم اللوحة</Label>
                    <Input
                      placeholder="ح ص ل 1122"
                      value={subQuickCust.plate_number}
                      onChange={(e) => setSubQuickCust({ ...subQuickCust, plate_number: e.target.value })}
                      className="mt-0.5 bg-white text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2 pt-1">
                {!selectedCustomer ? (
                  <div>
                    <Label className="text-xs font-bold text-surface-700 mb-1 block">اختر العميل من القائمة:</Label>
                    <Select value={customerId} onChange={(e) => {
                      const cId = e.target.value;
                      setCustomerId(cId);
                      const cust = customers.find(c => c.id === cId);
                      if (cust) {
                        setSubForm(prev => ({
                          ...prev,
                          car_type: cust.vehicle_type || cust.vehicle_brand || '',
                          car_color: cust.vehicle_color || '',
                          plate_number: cust.plate_number || '',
                        }));
                      }
                    }} className="bg-white">
                      <option value="">-- اختر عميل من القائمة المسجلة --</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''} {c.plate_number ? `— ${c.plate_number}` : ''}</option>
                      ))}
                    </Select>
                  </div>
                ) : (
                  <div className="p-3 bg-primary-50/80 border border-primary-200 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-primary-800 font-medium block">العميل المحدد:</span>
                      <span className="font-bold text-surface-900 text-sm">{selectedCustomer.name} ({selectedCustomer.phone || 'بدون جوال'})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone="cyan">{selectedCustomer.vehicle_type || 'سيارة'}</Badge>
                      <button onClick={() => setCustomerId('')} className="text-xs text-rose-600 hover:underline font-bold">تغيير</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-surface-50 p-3 rounded-xl border border-surface-200 space-y-2">
            <Label className="font-bold block text-surface-800 text-sm">بيانات السيارة واللون المربوطة بالاشتراك *</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-surface-600">نوع/ماركة السيارة</Label>
                <Input
                  value={subForm.car_type || selectedCustomer?.vehicle_type || selectedCustomer?.vehicle_brand || ''}
                  onChange={(e) => setSubForm({ ...subForm, car_type: e.target.value })}
                  placeholder="تويوتا كامري / سيدان"
                />
              </div>
              <div>
                <Label className="text-xs text-surface-600">لون السيارة *</Label>
                <Input
                  value={subForm.car_color || selectedCustomer?.vehicle_color || ''}
                  onChange={(e) => setSubForm({ ...subForm, car_color: e.target.value })}
                  placeholder="أبيض / أسود / كحلي"
                />
              </div>
              <div>
                <Label className="text-xs text-surface-600">رقم اللوحة</Label>
                <Input
                  value={subForm.plate_number || selectedCustomer?.plate_number || ''}
                  onChange={(e) => setSubForm({ ...subForm, plate_number: e.target.value })}
                  placeholder="ح ص ل 1122"
                />
              </div>
            </div>
          </div>

          <div>
            <Label className="font-bold block mb-1">اختر الباقة المصدرية (من إعدادات الاشتراكات)</Label>
            <Select value={subForm.subscription_id} onChange={(e) => {
               const activePkgs = subs.filter(s => s.active !== false);
               const sub = activePkgs.find(s => s.id === e.target.value) || subs.find(s => s.id === e.target.value);
               if (sub) {
                  setSubForm({
                    ...subForm,
                    subscription_id: sub.id,
                    manual_price: sub.monthly_price || sub.price_monthly || 0,
                    wash_limit: sub.washes_included || 0,
                  });
               } else {
                  setSubForm({ ...subForm, subscription_id: e.target.value });
               }
            }}>
               <option value="">-- اختر الباقة المعرفة بصفحة الإعدادات --</option>
               {subs.filter(s => s.active !== false).map(s => (
                 <option key={s.id} value={s.id}>
                   {s.name} — {s.monthly_price || s.price_monthly || 0} ريال ({s.washes_included} غسلة / {s.duration_days || 30} يوم)
                 </option>
               ))}
            </Select>
          </div>
          
          {(() => {
            const selectedPkg = subs.find(s => s.id === subForm.subscription_id);
            if (!selectedPkg) return null;
            return (
              <div className="bg-surface-50 border border-surface-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-surface-800 text-base">{selectedPkg.name}</p>
                    <span className="text-xs text-surface-500 font-medium">
                      {selectedPkg.vehicle_scope === 'all_vehicles' ? '🌐 لجميع سيارات العميل' : '🚗 مرتبطة بسيارة محددة برقم اللوحة واللون'}
                    </span>
                  </div>
                  <span className="text-lg font-black text-emerald-700">{selectedPkg.monthly_price || selectedPkg.price_monthly || 0} SAR</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-surface-600 bg-white p-3 rounded-lg border border-surface-100">
                  <div>نوع الاشتراك: <span className="font-bold text-surface-900 block">{selectedPkg.subscription_type || 'عدد غسلات + مدة'}</span></div>
                  <div>عدد الغسلات: <span className="font-bold text-surface-900 block">{selectedPkg.washes_included} غسلة</span></div>
                  <div>مدة الصلاحية: <span className="font-bold text-surface-900 block">{selectedPkg.duration_days || 30} يوم</span></div>
                </div>
                {selectedPkg.included_services && (
                  <p className="text-xs text-surface-500">
                    <span className="font-bold text-surface-700">الخدمات المشمولة:</span> {selectedPkg.included_services}
                  </p>
                )}
              </div>
            );
          })()}
          
          <div className="pt-2">
            <Label className="block mb-2 text-sm font-bold">طريقة الدفع</Label>
            <div className="flex gap-2">
                <Button onClick={() => setPaymentMethod('cash')} variant={paymentMethod === 'cash' ? 'default' : 'outline'} className={paymentMethod === 'cash' ? 'bg-primary-600 text-white' : ''}>كاش</Button>
                <Button onClick={() => setPaymentMethod('card')} variant={paymentMethod === 'card' ? 'default' : 'outline'} className={paymentMethod === 'card' ? 'bg-primary-600 text-white' : ''}>شبكة / مدى</Button>
                <Button onClick={() => setPaymentMethod('transfer')} variant={paymentMethod === 'transfer' ? 'default' : 'outline'} className={paymentMethod === 'transfer' ? 'bg-primary-600 text-white' : ''}>تحويل بنكي</Button>
            </div>
          </div>

          <Button onClick={addCarSubscription} className="w-full h-12 text-base font-bold bg-emerald-600 hover:bg-emerald-700 text-white">
            تأكيد شراء وتفعيل الاشتراك
          </Button>
        </div>
      </Modal>

      {/* Subscription invoice modal */}
      <Modal open={showSubInvoice} onClose={() => setShowSubInvoice(false)} title={tr('subscriptionInvoice', lang)}>
        {lastSubInvoice && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-surface-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ background: `linear-gradient(135deg, ${settings?.brand_color ?? '#0e7490'}, ${settings?.brand_accent ?? '#2563eb'})` }}>
                    <Car className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-surface-800">{settings?.company_name ?? tr('appName', lang)}</p>
                    <p className="text-xs text-surface-400">{tr('subscriptionInvoice', lang)}</p>
                  </div>
                </div>
                <Badge tone="cyan">{tr('subscription', lang)}</Badge>
              </div>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-surface-500">{tr('customer', lang)}</span><span className="font-medium">{lastSubInvoice.customer.name}</span></div>
                <div className="flex justify-between"><span className="text-surface-500">{tr('carType', lang)}</span><span className="font-medium">{lastSubInvoice.sub.car_type}</span></div>
                <div className="flex justify-between"><span className="text-surface-500">{tr('carColor', lang)}</span><span className="font-medium">{lastSubInvoice.sub.car_color}</span></div>
                <div className="flex justify-between"><span className="text-surface-500">{tr('plateNumber', lang)}</span><span className="font-medium">{lastSubInvoice.sub.plate_number}</span></div>
                <div className="flex justify-between"><span className="text-surface-500">{tr('startDate', lang)}</span><span className="font-medium">{lastSubInvoice.sub.start_date}</span></div>
                <div className="flex justify-between"><span className="text-surface-500">{tr('endDate', lang)}</span><span className="font-medium">{lastSubInvoice.sub.end_date}</span></div>
                <div className="flex justify-between"><span className="text-surface-500">{tr('washLimit', lang)}</span><span className="font-medium">{lastSubInvoice.sub.wash_limit}</span></div>
              </div>
              <div className="flex items-center justify-between pt-3 mt-3 border-t border-surface-100">
                <span className="font-bold text-surface-800">{tr('total', lang)}</span>
                <span className="text-xl font-bold text-surface-800">{formatSAR(lastSubInvoice.sub.manual_price, lang)}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={printSubInvoice} className="flex-1"><Printer className="w-4 h-4" /> {tr('printInvoice', lang)}</Button>
              {lastSubInvoice.customer.phone && <Button variant="secondary" onClick={shareSubWhatsApp} className="flex-1"><MessageCircle className="w-4 h-4 text-emerald-600" /> {tr('shareWhatsApp', lang)}</Button>}
            </div>
          </div>
        )}
      </Modal>

      {/* Checkout confirmation */}
      <Modal open={showCheckout} onClose={() => { setShowCheckout(false); setDiscountCode(''); setDiscountAmount(0); setDiscountError(''); setAppliedDiscount(null); }} title={tr('confirmSale', lang)}>
                <div className="space-y-4">
          <div className="p-4 rounded-xl bg-surface-50">
            <div className="flex justify-between mb-2"><span className="text-surface-500">{tr('customer', lang)}</span><span className="font-medium">{selectedCustomer?.name ?? tr('noCustomerSelected', lang)}</span></div>
            <div className="flex justify-between mb-2"><span className="text-surface-500">{tr('washCount', lang)}</span><span className="font-medium">{cartWashes}</span></div>
            <div className="flex justify-between mb-2"><span className="text-surface-500">{tr('paymentMethod', lang)}</span><span className="font-medium">{tr(paymentMethod, lang)}</span></div>
            {hasActiveSub && customerSub && (
              <div className="my-3 p-3.5 rounded-2xl bg-emerald-50 border-2 border-emerald-400 space-y-2">
                <div className="flex items-center justify-between text-xs font-black text-emerald-950">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>تغطيها باقة الاشتراك ({customerSub.package_name_snapshot || 'اشتراك نشط'})</span>
                  </span>
                  <span className="bg-emerald-600 text-white px-2 py-0.5 rounded text-[11px]">0.00 SAR</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-emerald-950 bg-white/90 p-2.5 rounded-xl border border-emerald-200">
                  <div>الرصيد الحالي: <strong className="text-surface-900">{customerSub.washes_remaining} غسلة</strong></div>
                  <div>المتبقي بعد الخصم: <strong className="text-emerald-700">{Math.max(0, customerSub.washes_remaining - cartWashes)} غسلة</strong></div>
                </div>
              </div>
            )}
            {isFreeWash && <div className="flex justify-between mb-2 text-emerald-600 font-bold"><span>{tr('free', lang)}</span><span>✓</span></div>}
            
            {adjustedCartTotal > 0 && (
              <div className="mt-3 pt-3 border-t border-surface-200">
                <Label className="text-xs mb-1">كود الخصم (اختياري)</Label>
                <div className="flex gap-2">
                  <Input value={discountCode} onChange={e => setDiscountCode(e.target.value)} placeholder="أدخل الكود" className="text-sm h-9 flex-1" />
                  <Button variant="secondary" onClick={applyDiscount} className="h-9 px-3 text-sm">تطبيق</Button>
                </div>
                {discountError && <p className="text-xs text-rose-500 mt-1">{discountError}</p>}
                {appliedDiscount && <p className="text-xs text-emerald-600 mt-1">تم تطبيق الخصم: {formatSAR(discountAmount, lang)}</p>}
              </div>
            )}

            <div className="flex justify-between pt-3 mt-3 border-t border-surface-200">
               <div className="space-y-1">
                 <span className="font-bold">{tr('total', lang)}</span>
                 {appliedDiscount && <div className="text-xs text-surface-500 line-through">{formatSAR(cartTotal, lang)}</div>}
               </div>
               <span className="font-bold text-lg text-emerald-700">{formatSAR(adjustedCartTotal - discountAmount, lang)}</span>
            </div>
          </div>
          <Button onClick={checkout} disabled={processing} className="w-full">{processing ? tr('processing', lang) : tr('confirmAndInvoice', lang)}</Button>
        </div>
      </Modal>

      {/* Invoice modal */}
      <Modal open={showInvoice} onClose={() => setShowInvoice(false)} title="تم استخراج الفاتورة بنجاح 🧾">
        <div className="space-y-4 text-right" dir="rtl">
          {/* Success Banner */}
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-emerald-950 text-sm">تم الدفع وتوثيق العملية بنجاح!</p>
              <p className="text-xs text-emerald-700 mt-0.5">اختر إرسال الفاتورة للعميل عبر الواتساب أو طباعتها فوراً.</p>
            </div>
          </div>

          {/* Invoice Summary Card */}
          <div className="p-4 rounded-2xl border border-surface-200 bg-white shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-surface-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white" style={{ background: `linear-gradient(135deg, ${settings?.brand_color ?? '#0e7490'}, ${settings?.brand_accent ?? '#2563eb'})` }}>
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-surface-900 text-sm">{settings?.company_name ?? tr('appName', lang)}</p>
                  <p className="text-[11px] text-surface-400">#{lastInvoice?.id.slice(0, 8) ?? ''} • {formatDateTime(lastInvoice?.created_at ?? new Date(), lang)}</p>
                </div>
              </div>
              {hasActiveSub ? <Badge tone="cyan">{tr('subscription', lang)}</Badge> : lastInvoice?.is_free ? <Badge tone="emerald">{tr('free', lang)}</Badge> : <Badge tone="blue">{tr('paid', lang)}</Badge>}
            </div>

            {/* Customer info if available */}
            {lastCustomer && (
              <div className="text-xs bg-surface-50 p-2.5 rounded-xl border border-surface-100 flex items-center justify-between text-surface-700">
                <span>العميل: <strong className="text-surface-900 font-bold">{lastCustomer.name}</strong></span>
                {lastCustomer.phone && <span className="font-mono dir-ltr text-surface-600">{lastCustomer.phone}</span>}
              </div>
            )}

            {/* Items list */}
            <div className="space-y-2 py-1">
              {lastInvoiceItems.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-surface-700 font-medium">{item.service_name} <span className="text-surface-400">×{item.qty}</span></span>
                  <span className="text-surface-900 font-bold">{formatSAR(item.line_total, lang)}</span>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="flex items-center justify-between pt-3 border-t border-surface-200">
              <div className="text-xs text-surface-500">
                طريقة الدفع: <strong className="text-surface-800">{tr(lastInvoice?.payment_method ?? 'cash', lang)}</strong>
              </div>
              <div className="text-right">
                <span className="text-xs text-surface-400 block">الإجمالي النهائي</span>
                <span className="text-xl font-extrabold text-primary-900">{formatSAR(lastInvoice?.total ?? 0, lang)}</span>
              </div>
            </div>
          </div>

          {/* WhatsApp Direct Share Box */}
          {(() => {
            const formattedPhone = getCleanPhone(waPhone || lastCustomer?.phone || '');
            const encodedText = encodeURIComponent(getWhatsAppInvoiceText());
            const waAppUrl = formattedPhone ? `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedText}` : '#';
            const waWebUrl = formattedPhone ? `https://web.whatsapp.com/send?phone=${formattedPhone}&text=${encodedText}` : '#';

            return (
              <div className="p-3.5 bg-emerald-50/90 border border-emerald-200 rounded-2xl space-y-3 shadow-xs">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-950">
                  <span className="flex items-center gap-1.5">
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                    <span>خيارات إرسال الفاتورة المباشرة (بدون ربط):</span>
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-medium">واتساب فورِي</span>
                </div>

                <div>
                  <Label className="text-[11px] text-emerald-900 font-bold mb-1 block">رقم جوال العميل:</Label>
                  <Input
                    type="tel"
                    value={waPhone}
                    onChange={(e) => setWaPhone(e.target.value)}
                    placeholder="أدخل رقم الجوال (مثلاً 0501234567)"
                    className="text-right font-mono text-xs bg-white border-emerald-300 focus:border-emerald-600"
                  />
                </div>

                {formattedPhone ? (
                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    <a
                      href={waAppUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all text-center"
                    >
                      <Smartphone className="w-4 h-4 shrink-0" />
                      <span>فتح بتطبيق الواتساب</span>
                    </a>

                    <a
                      href={waWebUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all text-center"
                    >
                      <Globe className="w-4 h-4 shrink-0" />
                      <span>فتح بواتساب ويب</span>
                    </a>
                  </div>
                ) : (
                  <div className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-center font-medium">
                    💡 أدخل رقم الجوال أعلاه لظهور أزرار التوجيه المباشر للواتساب
                  </div>
                )}
              </div>
            );
          })()}

          {/* Action Buttons: Print & Copy */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              onClick={printInvoice}
              className="bg-primary-700 hover:bg-primary-800 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة الفاتورة (حراري / PDF)</span>
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={copyInvoiceText}
              className="font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 border-surface-300"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-surface-600" />}
              <span>{copied ? 'تم النسخ!' : 'نسخ نص الفاتورة'}</span>
            </Button>
          </div>

          {/* Start New Order */}
          <Button
            type="button"
            variant="ghost"
            onClick={() => setShowInvoice(false)}
            className="w-full text-surface-500 hover:text-surface-800 font-bold py-2 text-xs"
          >
            بدء عملية بيع جديدة ➕
          </Button>
        </div>
      </Modal>

      {/* Refund modal */}
      <Modal open={!!showRefund} onClose={() => setShowRefund(null)} title={tr('refund', lang)}>
        <div className="space-y-3">
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
            <p className="text-sm text-rose-700">{tr('invoiceNo', lang)}: {showRefund?.id.slice(0, 8)}</p>
            <p className="text-sm text-rose-600 mt-1">{tr('total', lang)}: {formatSAR(showRefund?.total ?? 0, lang)}</p>
          </div>
          <div><Label>{tr('refundMethod', lang)}</Label>
            <Select value={refundForm.method} onChange={(e) => setRefundForm({ ...refundForm, method: e.target.value })}>
              <option value="cash">{tr('cash', lang)}</option>
              <option value="bank">{tr('bankTransfer', lang)}</option>
            </Select>
          </div>
          <div><Label>{tr('refundAmount', lang)}</Label><Input type="number" value={refundForm.amount} onChange={(e) => setRefundForm({ ...refundForm, amount: Number(e.target.value) })} /></div>
          <Button variant="danger" onClick={processRefund} className="w-full"><RotateCcw className="w-4 h-4" /> {tr('processRefund', lang)}</Button>
        </div>
      </Modal>

      {/* Open shift modal */}
      <Modal open={showShiftOpen} onClose={() => setShowShiftOpen(false)} title={tr('openShiftNow', lang)}>
        <div className="space-y-3">
          <div><Label>{tr('openingCash', lang)}</Label><Input type="number" value={shiftForm.opening_cash} onChange={(e) => setShiftForm({ opening_cash: Number(e.target.value) })} /></div>
          <Button onClick={openShift} className="w-full">{tr('openShift', lang)}</Button>
        </div>
      </Modal>

      {/* Quick Add Service/Product Modal */}
      <Modal open={showAddServiceModal} onClose={() => setShowAddServiceModal(false)} title="إضافة خدمة غسيل أو منتج كاشير جديد">
        <div className="space-y-4 text-right">
          <div>
            <Label>اسم الخدمة / المنتج</Label>
            <Input
              value={newServiceForm.name}
              onChange={(e) => setNewServiceForm({ ...newServiceForm, name: e.target.value })}
              placeholder="مثال: غسيل ساطع بخار VIP أو معطر فاخر"
              required
            />
          </div>

          <div>
            <Label>فئة العنصر في الكاشير</Label>
            <Select
              value={newServiceForm.category}
              onChange={(e) => setNewServiceForm({ ...newServiceForm, category: e.target.value })}
            >
              <option value="غسيل ساطع">غسيل ساطع عادي</option>
              <option value="غسيل بخار">غسيل بخار وتلميع</option>
              <option value="غسيل VIP">غسيل VIP شامل</option>
              <option value="نانو سيراميك">حماية نانو سيراميك</option>
              <option value="منتجات كاشير">منتجات كاشير معطرات ومناديل</option>
              <option value="زيوت ومحركات">زيوت ومحركات</option>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>السعر للعميل (ر.س)</Label>
              <Input
                type="number"
                value={newServiceForm.price}
                onChange={(e) => setNewServiceForm({ ...newServiceForm, price: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>التكلفة التقديرية (ر.س)</Label>
              <Input
                type="number"
                value={newServiceForm.cost_estimate}
                onChange={(e) => setNewServiceForm({ ...newServiceForm, cost_estimate: Number(e.target.value) })}
              />
            </div>
          </div>

          <div>
            <Label>المدة المتوقعة للخدمة (بالدقائق)</Label>
            <Input
              type="number"
              value={newServiceForm.duration_min}
              onChange={(e) => setNewServiceForm({ ...newServiceForm, duration_min: Number(e.target.value) })}
              placeholder="20"
            />
          </div>

          <Button onClick={addNewServiceToCashier} className="w-full font-bold py-2.5">
            حفظ وإضافة إلى الكاشير فوراً
          </Button>
        </div>
      </Modal>

      {/* Shift Summary Modal upon Close */}
      <Modal open={showShiftSummaryModal} onClose={() => setShowShiftSummaryModal(false)} title="ملخص تقرير إغلاق الشفت 📊">
        {summaryDetails && (
          <div className="space-y-4 text-right" dir="rtl">
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-emerald-950 text-sm">تم إغلاق الورديّة بنجاح وتوثيق الحسابات!</p>
                <p className="text-xs text-emerald-700 mt-0.5">إليك ملخص الإيرادات والمبالغ المسجلة لهذه الورديّة.</p>
              </div>
            </div>

            <div className="bg-surface-50 border border-surface-200 rounded-2xl p-4 space-y-2 text-xs text-surface-700">
              <div className="flex justify-between pb-1.5 border-b border-surface-200/80">
                <span className="text-surface-500">اليوم والتاريخ:</span>
                <span className="font-bold text-surface-900">{summaryDetails.dateStr}</span>
              </div>
              <div className="flex justify-between pb-1.5 border-b border-surface-200/80">
                <span className="text-surface-500">الكاشير المسؤول:</span>
                <span className="font-bold text-surface-900">{summaryDetails.cashier}</span>
              </div>
              <div className="flex justify-between pb-1.5 border-b border-surface-200/80">
                <span className="text-surface-500">بداية الورديّة:</span>
                <span className="font-medium text-surface-800">{summaryDetails.startTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-surface-500">توقيت الإغلاق:</span>
                <span className="font-medium text-surface-800">{summaryDetails.endTime}</span>
              </div>
            </div>

            {/* Financial Cards Breakdown */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
                <p className="text-[11px] font-bold text-emerald-800 mb-1 flex items-center gap-1">
                  <Banknote className="w-3.5 h-3.5" />
                  <span>الكاش في الصندوق</span>
                </p>
                <p className="text-lg font-extrabold text-emerald-900">{formatSAR(summaryDetails.cashTotal, lang)}</p>
              </div>

              <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200">
                <p className="text-[11px] font-bold text-blue-800 mb-1 flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>شبكة / مدى</span>
                </p>
                <p className="text-lg font-extrabold text-blue-900">{formatSAR(summaryDetails.cardTotal, lang)}</p>
              </div>

              <div className="p-3 rounded-2xl bg-primary-50 border border-primary-200">
                <p className="text-[11px] font-bold text-primary-800 mb-1 flex items-center gap-1">
                  <Wallet className="w-3.5 h-3.5" />
                  <span>إجمالي المبيعات</span>
                </p>
                <p className="text-lg font-extrabold text-primary-950">{formatSAR(summaryDetails.totalSales, lang)}</p>
              </div>

              <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200">
                <p className="text-[11px] font-bold text-purple-800 mb-1 flex items-center gap-1">
                  <Car className="w-3.5 h-3.5" />
                  <span>السيارات المغسولة</span>
                </p>
                <p className="text-lg font-extrabold text-purple-900">{summaryDetails.washCount} سيارة</p>
              </div>
            </div>

            {/* Print & WhatsApp Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button
                type="button"
                onClick={printShiftReport}
                className="bg-primary-700 hover:bg-primary-800 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة تقرير الشفت</span>
              </Button>

              <Button
                type="button"
                onClick={sendShiftWhatsApp}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>إرسال عبر الواتساب</span>
              </Button>
            </div>

            <Button
              type="button"
              variant="secondary"
              onClick={handleStartNewShift}
              className="w-full font-bold py-2.5 rounded-xl text-xs border-surface-300 text-surface-800 hover:bg-surface-100 mt-1"
            >
              بدء وردية جديدة الآن 🔄
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
