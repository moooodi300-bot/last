import { useState, useEffect, useMemo } from 'react';
import { PageHeader, Card, CardBody, Button, Input, Modal, Select, Badge, Label, EmptyState } from '@/components/ui';
import { 
  Search, FileText, CheckCircle2, RotateCcw, Printer, 
  Wallet, CreditCard, DollarSign, Activity, Download
} from 'lucide-react';
import { formatSAR, formatDateTime } from '@/lib/format';
import { useAuth } from '@/lib/auth';
import type { Sale, Customer } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { getTenantCustomerSubscriptions } from '@/lib/subscriptionStore';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export function InvoicesPage() {
  const { organization, settings, lang } = useAuth();
  const currentTenantId = organization?.id || 'org_client_01';
  
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState<'today' | 'yesterday' | 'week' | 'month' | 'all'>('today');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Refund state
  const [showRefundModal, setShowRefundModal] = useState<Sale | null>(null);
  const [refundForm, setRefundForm] = useState({ method: 'cash', amount: 0, reason: '' });

  const loadData = async () => {
    setLoading(true);
    try {
      // Load sales from local storage first for tenant
      const stored = localStorage.getItem(`tenant_sales_${currentTenantId}`);
      let localSales: Sale[] = stored ? JSON.parse(stored) : [];

      // Try fetching from Supabase if available
      try {
        const { data: remoteSales } = await supabase
          .from('sales')
          .select('*, customer:customers(*)')
          .order('created_at', { ascending: false });
        
        if (remoteSales && remoteSales.length > 0) {
          // Merge remote and local
          const combined = [...remoteSales];
          localSales.forEach((ls) => {
            if (!combined.some((rs) => rs.id === ls.id)) {
              combined.push(ls);
            }
          });
          localSales = combined as Sale[];
        }
      } catch {
        // Fallback to local
      }

      // Check customer subscriptions to make sure every subscription has an invoice entry
      try {
        const subsList = getTenantCustomerSubscriptions(currentTenantId);
        let updatedSalesFlag = false;

        subsList.forEach((sub) => {
          const subPrice = Number(sub.manual_price ?? 299);
          const saleId = sub.invoice_id || `inv-sub-${sub.id}`;

          const exists = localSales.some(
            (s) => s.id === saleId ||
                   s.id === sub.id ||
                   s.customer_subscription_id === sub.id ||
                   (s.notes && s.notes.includes(sub.id))
          );

          if (!exists && subPrice >= 0) {
            const pm = sub.payment_method || 'cash';
            const autoSubSale: Sale = {
              id: saleId,
              customer_id: sub.customer_id,
              staff_id: null,
              branch_id: null,
              customer_subscription_id: sub.id,
              total: subPrice,
              cash_amount: (pm === 'cash' || pm === 'split') ? subPrice : 0,
              card_amount: (pm === 'card' || pm === 'transfer' || pm === 'split') ? subPrice : 0,
              payment_method: pm as any,
              wash_count: 0,
              is_free: false,
              notes: `شراء/تجديد اشتراك - ${sub.package_name_snapshot || sub.package_name || 'باقة غسيل'} (العميل: ${sub.customer_name || 'عميل مشترك'})`,
              is_refund: false,
              refund_amount: 0,
              refund_method: null,
              created_at: sub.start_date ? new Date(sub.start_date).toISOString() : new Date().toISOString(),
              subscription_id: sub.subscription_id,
              original_sale_id: null,
            };
            localSales.push(autoSubSale);
            updatedSalesFlag = true;
          }
        });

        if (updatedSalesFlag) {
          localStorage.setItem(`tenant_sales_${currentTenantId}`, JSON.stringify(localSales));
        }
      } catch (err) {
        console.warn('Subscription invoice sync warning:', err);
      }

      // Sort by created_at desc
      localSales.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setSales(localSales);

      // Load customers for name mapping
      const storedCusts = localStorage.getItem(`tenant_customers_${currentTenantId}`);
      if (storedCusts) {
        setCustomers(JSON.parse(storedCusts));
      }
    } catch (e) {
      console.error('Error loading invoices:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('raqam_data_updated', loadData);
    return () => window.removeEventListener('raqam_data_updated', loadData);
  }, [currentTenantId]);

  // Format YYYY-MM-DD in local timezone safely
  const getLocalDateString = (dStr: string | Date | undefined): string => {
    if (!dStr) return '';
    try {
      const d = typeof dStr === 'string' ? new Date(dStr) : dStr;
      if (isNaN(d.getTime())) return String(dStr).slice(0, 10);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    } catch {
      return String(dStr).slice(0, 10);
    }
  };

  // Period filtering
  const filteredSales = useMemo(() => {
    const now = new Date();
    const todayStr = getLocalDateString(now);
    
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getLocalDateString(yesterday);

    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);

    const monthAgo = new Date(now);
    monthAgo.setDate(monthAgo.getDate() - 30);
    monthAgo.setHours(0, 0, 0, 0);

    return sales.filter((s) => {
      const saleDateStr = getLocalDateString(s.created_at);
      const saleDateObj = new Date(s.created_at);
      
      // Period check
      if (periodFilter === 'today' && saleDateStr !== todayStr) return false;
      if (periodFilter === 'yesterday' && saleDateStr !== yesterdayStr) return false;
      if (periodFilter === 'week' && saleDateObj < weekAgo) return false;
      if (periodFilter === 'month' && saleDateObj < monthAgo) return false;

      // Search query check (invoice id, customer name, customer phone, notes)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const invId = (s.id || '').toLowerCase();
        const cust = customers.find((c) => c.id === s.customer_id) || (s as any).customer;
        const custName = (cust?.name || '').toLowerCase();
        const custPhone = (cust?.phone || '').toLowerCase();
        const plate = (cust?.plate_number || '').toLowerCase();
        const notes = (s.notes || '').toLowerCase();

        return (
          invId.includes(q) ||
          custName.includes(q) ||
          custPhone.includes(q) ||
          plate.includes(q) ||
          notes.includes(q)
        );
      }

      return true;
    });
  }, [sales, customers, periodFilter, searchQuery]);

  // Statistics calculation
  const totalInvoicesCount = filteredSales.length;
  const totalRevenue = filteredSales.reduce((sum, s) => sum + (s.is_refund ? 0 : Number(s.total || 0)), 0);
  const totalRefundsCount = filteredSales.filter((s) => s.is_refund).length;
  const totalRefundsAmount = filteredSales.reduce((sum, s) => sum + (s.is_refund ? Math.abs(Number(s.refund_amount || s.total || 0)) : 0), 0);

  const handleExportExcel = () => {
    const exportData = filteredSales.map((sale) => {
      const cust = customers.find((c) => c.id === sale.customer_id) || (sale as any).customer;
      return {
        'رقم الفاتورة': sale.id.slice(0, 8),
        'التاريخ': new Date(sale.created_at).toLocaleDateString('ar-EG'),
        'الوقت': new Date(sale.created_at).toLocaleTimeString('ar-EG'),
        'العميل': cust?.name || 'عميل نقدي',
        'الجوال': cust?.phone || '',
        'اللوحة': cust?.plate_number || '',
        'المبلغ': sale.is_refund ? -Math.abs(sale.refund_amount || sale.total || 0) : (sale.total || 0),
        'الدفع': sale.payment_method === 'cash' ? 'نقدي' : 'شبكة',
        'الحالة': sale.is_refund ? 'مرتجعة' : 'مكتملة',
        'النوع': sale.customer_subscription_id ? 'اشتراك' : 'عادي',
        'ملاحظات': sale.notes || '',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'الفواتير');
    XLSX.writeFile(workbook, `invoices_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.addFont('https://fonts.gstatic.com/s/cairo/v20/SLXWc1nY6HkvalvtsQ.woff2', 'Cairo', 'normal');
    doc.setFont('Cairo');
    
    const tableColumn = [
      'رقم الفاتورة', 'التاريخ', 'الوقت', 'العميل', 'المبلغ', 'الدفع', 'الحالة'
    ];
    
    const tableRows = filteredSales.map((sale) => {
      const cust = customers.find((c) => c.id === sale.customer_id) || (sale as any).customer;
      return [
        sale.id.slice(0, 8),
        new Date(sale.created_at).toLocaleDateString('en-US'),
        new Date(sale.created_at).toLocaleTimeString('en-US'),
        cust?.name || 'Cash Customer', // Using english fallback for PDF as arabic is hard without font file loaded properly
        sale.is_refund ? `-${Math.abs(sale.refund_amount || sale.total || 0)}` : (sale.total || 0),
        sale.payment_method === 'cash' ? 'Cash' : 'Card',
        sale.is_refund ? 'Refunded' : 'Completed'
      ];
    });

    (doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
      styles: { font: 'helvetica', halign: 'right' },
      headStyles: { fillColor: [14, 116, 144] },
      margin: { top: 20 },
    });
    
    doc.save(`invoices_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  // Process Invoice Refund
  const handleProcessRefund = async () => {
    if (!showRefundModal || !refundForm.amount) return;

    const originalSale = showRefundModal;
    const refundAmount = Number(refundForm.amount);

    const refundRecord: Sale = {
      id: 'ref-' + Date.now(),
      customer_id: originalSale.customer_id,
      staff_id: originalSale.staff_id,
      branch_id: originalSale.branch_id,
      total: -Math.abs(refundAmount),
      cash_amount: refundForm.method === 'cash' ? -Math.abs(refundAmount) : 0,
      card_amount: refundForm.method === 'bank' ? -Math.abs(refundAmount) : 0,
      payment_method: refundForm.method === 'cash' ? 'cash' : 'card',
      wash_count: 0,
      is_free: false,
      is_refund: true,
      refund_amount: refundAmount,
      refund_method: refundForm.method,
      original_sale_id: originalSale.id,
      notes: refundForm.reason ? `إرجاع فاتورة #${originalSale.id.slice(0, 8)} - السبب: ${refundForm.reason}` : `إرجاع فاتورة #${originalSale.id.slice(0, 8)}`,
      created_at: new Date().toISOString(),
      subscription_id: null,
      customer_subscription_id: originalSale.customer_subscription_id || null,
    };

    // Update sales list
    const updatedSales = [refundRecord, ...sales.map((s) => s.id === originalSale.id ? { ...s, is_refund: true, refund_amount: refundAmount, refund_method: refundForm.method } : s)];
    
    // Save locally
    localStorage.setItem(`tenant_sales_${currentTenantId}`, JSON.stringify(updatedSales));
    setSales(updatedSales);

    // Try DB insert
    try {
      await supabase.from('sales').insert(refundRecord);
      await supabase.from('sales').update({ is_refund: true, refund_amount: refundAmount, refund_method: refundForm.method }).eq('id', originalSale.id);
    } catch {
      // Fallback local saved
    }

    // Restore subscription wash if applicable
    if (originalSale.customer_subscription_id) {
      try {
        const storedSubs = localStorage.getItem(`tenant_customer_subscriptions_${currentTenantId}`);
        if (storedSubs) {
          const subsArr = JSON.parse(storedSubs);
          const updatedSubs = subsArr.map((sub: any) => {
            if (sub.id === originalSale.customer_subscription_id) {
              const restoredWashes = Number(originalSale.wash_count || 1);
              return {
                ...sub,
                washes_used: Math.max(0, Number(sub.washes_used || 0) - restoredWashes),
                washes_remaining: Number(sub.washes_remaining || 0) + restoredWashes,
                status: 'active'
              };
            }
            return sub;
          });
          localStorage.setItem(`tenant_customer_subscriptions_${currentTenantId}`, JSON.stringify(updatedSubs));
        }
      } catch {}
    }

    window.dispatchEvent(new Event('raqam_data_updated'));
    alert('تم إرجاع الفاتورة وتسجيل العملية بنجاح! 🔄');
    setShowRefundModal(null);
    setRefundForm({ method: 'cash', amount: 0, reason: '' });
  };

  // Print Invoice Thermal / PDF
  const printInvoiceThermal = (sale: Sale) => {
    const cust = customers.find((c) => c.id === sale.customer_id) || (sale as any).customer;
    const w = window.open('', '_blank');
    if (!w) return;

    const companyName = settings?.company_name || 'مغسلة السيارات النموذجية';
    const vatNum = settings?.vat_number ? `الرقم الضريبي: ${settings.vat_number}` : '';
    const isRTL = true;

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
        ${sale.is_refund ? `<div class="refund-stamp">⚠️ فاتورة مرتجعة (${formatSAR(sale.refund_amount || sale.total)})</div>` : ''}
        <div class="row"><span>رقم الفاتورة:</span><span class="bold">#${sale.id.slice(0, 8)}</span></div>
        <div class="row"><span>التاريخ والوقت:</span><span>${formatDateTime(sale.created_at, 'ar')}</span></div>
        <div class="row"><span>العميل:</span><span class="bold">${cust?.name || 'عميل نقدي'}</span></div>
        ${cust?.phone ? `<div class="row"><span>الجوال:</span><span>${cust.phone}</span></div>` : ''}
        ${cust?.plate_number ? `<div class="row"><span>المركبة / اللوحة:</span><span>${cust.vehicle_type || ''} (${cust.plate_number})</span></div>` : ''}
        <div class="row"><span>طريقة الدفع:</span><span>${sale.payment_method === 'cash' ? 'نقدي (الكاش)' : 'شبكة / مدى'}</span></div>
        <div class="dash"></div>
        <div class="total-card">
          <div class="row bold" style="font-size:15px;color:#0f172a;margin:0;">
            <span>${sale.is_refund ? 'المبلغ المرتجع:' : 'الإجمالي المدفوع:'}</span>
            <span>${formatSAR(sale.is_refund ? Math.abs(sale.refund_amount || sale.total) : sale.total, 'ar')}</span>
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

  return (
    <div className="space-y-6 text-right" dir="rtl">
      <PageHeader
        title="سجل الفواتير والمبيعات"
        subtitle="متابعة جميع الفواتير الصادرة، طباعتها، وإجراء عمليات المرتجع وإرجاع المبالغ"
      />

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-primary-100 bg-primary-50/40">
          <CardBody className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-surface-500">إجمالي عدد الفواتير</p>
              <p className="text-2xl font-black text-primary-900 mt-1">{totalInvoicesCount} <span className="text-sm font-semibold text-surface-500">فاتورة</span></p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary-600/10 text-primary-700 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
          </CardBody>
        </Card>

        <Card className="border-emerald-100 bg-emerald-50/40">
          <CardBody className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-surface-500">مبيعات الفواتير للفترة</p>
              <p className="text-2xl font-black text-emerald-800 mt-1">{formatSAR(totalRevenue, lang)}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-600/10 text-emerald-700 flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
          </CardBody>
        </Card>

        <Card className="border-rose-100 bg-rose-50/40">
          <CardBody className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-surface-500">المبالغ المرتجعة</p>
              <p className="text-2xl font-black text-rose-700 mt-1">{formatSAR(totalRefundsAmount, lang)}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-600/10 text-rose-600 flex items-center justify-center font-bold">
              <RotateCcw className="w-5 h-5" />
            </div>
          </CardBody>
        </Card>

        <Card className="border-amber-100 bg-amber-50/40">
          <CardBody className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-surface-500">عدد الفواتير المرتجعة</p>
              <p className="text-2xl font-black text-amber-800 mt-1">{totalRefundsCount} <span className="text-sm font-semibold text-surface-500">عملية</span></p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-600/10 text-amber-700 flex items-center justify-center font-bold">
              <Activity className="w-5 h-5" />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardBody className="p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Period selector */}
            <div className="flex flex-wrap items-center gap-1.5 bg-surface-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setPeriodFilter('today')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${periodFilter === 'today' ? 'bg-white text-primary-800 shadow-xs' : 'text-surface-600 hover:text-surface-900'}`}
              >
                اليوم
              </button>
              <button
                type="button"
                onClick={() => setPeriodFilter('yesterday')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${periodFilter === 'yesterday' ? 'bg-white text-primary-800 shadow-xs' : 'text-surface-600 hover:text-surface-900'}`}
              >
                الأمس
              </button>
              <button
                type="button"
                onClick={() => setPeriodFilter('week')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${periodFilter === 'week' ? 'bg-white text-primary-800 shadow-xs' : 'text-surface-600 hover:text-surface-900'}`}
              >
                آخر 7 أيام
              </button>
              <button
                type="button"
                onClick={() => setPeriodFilter('month')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${periodFilter === 'month' ? 'bg-white text-primary-800 shadow-xs' : 'text-surface-600 hover:text-surface-900'}`}
              >
                هذا الشهر
              </button>
              <button
                type="button"
                onClick={() => setPeriodFilter('all')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${periodFilter === 'all' ? 'bg-white text-primary-800 shadow-xs' : 'text-surface-600 hover:text-surface-900'}`}
              >
                كل الفواتير
              </button>
            </div>

            {/* Actions & Search */}
            <div className="flex flex-1 items-center gap-2 justify-end min-w-[240px]">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-surface-400" />
                <Input
                  type="text"
                  placeholder="ابحث برقم الفاتورة، اسم العميل، رقم الجوال، أو رقم اللوحة..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-9 font-medium text-xs bg-surface-50 border-surface-200"
                />
              </div>
              <button
                type="button"
                onClick={handleExportExcel}
                className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold border border-emerald-200 transition-colors whitespace-nowrap"
              >
                <Download className="w-4 h-4" />
                تصدير Excel
              </button>
              <button
                type="button"
                onClick={handleExportPDF}
                className="flex items-center gap-2 px-3 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-bold border border-rose-200 transition-colors whitespace-nowrap"
              >
                <Download className="w-4 h-4" />
                تصدير PDF
              </button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardBody className="p-0 overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-surface-400 font-bold">جاري تحميل الفواتير...</div>
          ) : filteredSales.length === 0 ? (
            <EmptyState message="لا توجد فواتير مطابقة للبحث أو للفترة المحددة" />
          ) : (
            <table className="w-full text-xs text-right">
              <thead className="bg-surface-50 text-surface-600 font-extrabold border-b border-surface-200">
                <tr>
                  <th className="p-3.5">رقم الفاتورة</th>
                  <th className="p-3.5">التاريخ والوقت</th>
                  <th className="p-3.5">العميل والبيانات</th>
                  <th className="p-3.5">المركبة واللوحة</th>
                  <th className="p-3.5">العدد والنوع</th>
                  <th className="p-3.5">المبلغ الإجمالي</th>
                  <th className="p-3.5">طريقة الدفع</th>
                  <th className="p-3.5">حالة الفاتورة</th>
                  <th className="p-3.5 text-center">الإجراءات والعمليات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {filteredSales.map((sale) => {
                  const cust = customers.find((c) => c.id === sale.customer_id) || (sale as any).customer;
                  const isRefunded = sale.is_refund;

                  return (
                    <tr key={sale.id} className={`hover:bg-surface-50 transition-colors ${isRefunded ? 'bg-rose-50/20' : ''}`}>
                      {/* ID */}
                      <td className="p-3.5 font-mono font-bold text-surface-800">
                        #{sale.id.slice(0, 8)}
                      </td>

                      {/* Date */}
                      <td className="p-3.5 text-surface-600 font-medium whitespace-nowrap">
                        {formatDateTime(sale.created_at, lang)}
                      </td>

                      {/* Customer */}
                      <td className="p-3.5">
                        <p className="font-bold text-surface-900">{cust?.name || 'عميل نقدي'}</p>
                        {cust?.phone && <p className="text-[11px] text-surface-400 font-mono mt-0.5" dir="ltr">{cust.phone}</p>}
                      </td>

                      {/* Vehicle */}
                      <td className="p-3.5">
                        {cust?.vehicle_type || cust?.vehicle_brand || cust?.plate_number ? (
                          <div>
                            <span className="font-semibold text-surface-700 block">{cust?.vehicle_type || cust?.vehicle_brand || 'سيارة'}</span>
                            {cust?.plate_number && <span className="text-[10px] font-bold bg-surface-100 border border-surface-200 px-1.5 py-0.5 rounded text-surface-600 inline-block mt-0.5">{cust.plate_number}</span>}
                          </div>
                        ) : (
                          <span className="text-surface-400">-</span>
                        )}
                      </td>

                      {/* Wash / items */}
                      <td className="p-3.5">
                        <span className="font-bold text-surface-700">{sale.wash_count || 1} غسلة</span>
                        {sale.notes && <p className="text-[10px] text-surface-400 truncate max-w-[120px]" title={sale.notes}>{sale.notes}</p>}
                      </td>

                      {/* Total */}
                      <td className="p-3.5 font-black text-sm">
                        {isRefunded ? (
                          <span className="text-rose-600 line-through">-{formatSAR(Math.abs(sale.refund_amount || sale.total), lang)}</span>
                        ) : (
                          <span className="text-surface-900">{formatSAR(sale.total, lang)}</span>
                        )}
                      </td>

                      {/* Payment Method */}
                      <td className="p-3.5">
                        <span className="inline-flex items-center gap-1 font-semibold text-surface-700 bg-surface-100 px-2 py-1 rounded-md">
                          {sale.payment_method === 'cash' ? <Wallet className="w-3.5 h-3.5 text-emerald-600" /> : <CreditCard className="w-3.5 h-3.5 text-primary-600" />}
                          {sale.payment_method === 'cash' ? 'نقدي' : sale.payment_method === 'card' ? 'شبكة / مدى' : 'تحويل'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="p-3.5">
                        {isRefunded ? (
                          <Badge tone="rose">
                            <RotateCcw className="w-3 h-3 ml-1" /> مرتجعة
                          </Badge>
                        ) : sale.is_free ? (
                          <Badge tone="emerald">مجانية (ولاء)</Badge>
                        ) : (sale.subscription_id || (sale.notes && sale.notes.includes('اشتراك'))) ? (
                          <Badge tone="cyan">فاتورة اشتراك</Badge>
                        ) : sale.customer_subscription_id ? (
                          <Badge tone="cyan">غسيل اشتراك</Badge>
                        ) : (
                          <Badge tone="emerald">
                            <CheckCircle2 className="w-3 h-3 ml-1" /> مدفوعة
                          </Badge>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {/* Print/View button */}
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => printInvoiceThermal(sale)}
                            className="text-xs py-1 px-2.5 h-8 flex items-center gap-1 border-surface-300 hover:border-primary-600 hover:text-primary-700"
                            title="طباعة الفاتورة"
                          >
                            <Printer className="w-3.5 h-3.5 text-primary-600" />
                            <span>طباعة</span>
                          </Button>

                          {/* Refund Invoice Button */}
                          {!isRefunded && sale.total > 0 && (
                            <Button
                              type="button"
                              size="sm"
                              variant="danger"
                              onClick={() => {
                                setRefundForm({ method: sale.payment_method === 'card' ? 'bank' : 'cash', amount: sale.total, reason: '' });
                                setShowRefundModal(sale);
                              }}
                              className="text-xs py-1 px-2.5 h-8 flex items-center gap-1 bg-rose-600 hover:bg-rose-700 text-white font-bold"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>إرجاع الفاتورة</span>
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>

      {/* Modal: Refund Invoice */}
      <Modal
        open={!!showRefundModal}
        onClose={() => setShowRefundModal(null)}
        title="إرجاع الفاتورة (عملية مرتجع)"
      >
        {showRefundModal && (
          <div className="space-y-4 text-right" dir="rtl">
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-rose-900">
                <span>رقم الفاتورة: #{showRefundModal.id.slice(0, 8)}</span>
                <span>تاريخ الفاتورة: {formatDateTime(showRefundModal.created_at, lang)}</span>
              </div>
              <p className="text-sm font-black text-rose-700 pt-1">
                المبلغ الأصلي للفاتورة: {formatSAR(showRefundModal.total, lang)}
              </p>
              {showRefundModal.customer_subscription_id && (
                <p className="text-xs font-semibold text-primary-800 bg-primary-100 p-1.5 rounded-lg mt-1">
                  💡 ملاحظة: هذه الفاتورة مرتبطة باشتراك. عند الإرجاع سيتم إعادة رصيد الغسلات للعميل تلقائياً.
                </p>
              )}
            </div>

            <div>
              <Label className="font-bold text-xs mb-1 block">طريقة إعادة المبلغ للعميل:</Label>
              <Select
                value={refundForm.method}
                onChange={(e) => setRefundForm({ ...refundForm, method: e.target.value })}
                className="bg-surface-50 font-medium text-xs"
              >
                <option value="cash">نقداً (من كاش الصندوق)</option>
                <option value="bank">تحويل بنكي / استرداد بطاقة</option>
              </Select>
            </div>

            <div>
              <Label className="font-bold text-xs mb-1 block">مبلغ المرتجع (SAR):</Label>
              <Input
                type="number"
                value={refundForm.amount}
                onChange={(e) => setRefundForm({ ...refundForm, amount: Number(e.target.value) })}
                className="font-extrabold text-sm text-rose-700"
                min={0}
                max={showRefundModal.total}
              />
            </div>

            <div>
              <Label className="font-bold text-xs mb-1 block">سبب المرتجع (اختياري):</Label>
              <Input
                type="text"
                placeholder="مثلاً: إلغاء خدمة بطلب العميل، عدم رضا عن الخدمة..."
                value={refundForm.reason}
                onChange={(e) => setRefundForm({ ...refundForm, reason: e.target.value })}
                className="text-xs"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowRefundModal(null)}
                className="text-xs text-surface-500"
              >
                إلغاء
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={handleProcessRefund}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>تأكيد إرجاع الفاتورة</span>
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
