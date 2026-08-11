import { useState, useEffect } from 'react';
import { Plus, ShoppingBag, X, Calendar, Upload, Building, CreditCard } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatSAR, formatDate } from '@/lib/format';
import { Button, Input, Label, Select, Card, CardBody, CardHeader, PageHeader, Modal, Spinner } from '@/components/ui';
import { useAuth, usePermissions } from '@/lib/auth';

interface PurchaseLine {
  item_name: string;
  allocation: 'per_car' | 'per_month';
  amount: number;
}

export function PurchasesPage() {
  const { organization } = useAuth();
  const { can } = usePermissions();
  const currentTenantId = organization?.id || 'org_client_01';
  
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    supplier_name: '',
    vat_number: '',
    national_address: '',
    purchase_date: new Date().toISOString().slice(0, 10),
    payment_source: 'cash',
    image_url: ''
  });
  const [lines, setLines] = useState<PurchaseLine[]>([{ item_name: '', allocation: 'per_car', amount: 0 }]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const stored = localStorage.getItem(`tenant_purchases_${currentTenantId}`);
      if (stored) {
        setInvoices(JSON.parse(stored));
      } else {
        const { data, error } = await supabase.from('purchase_invoices').select('*').order('created_at', { ascending: false });
        if (!error && data) {
          setInvoices(data);
        } else {
          setInvoices([]);
        }
      }
    } catch {
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [currentTenantId]);

  const addLine = () => {
    if (lines.length < 10) setLines([...lines, { item_name: '', allocation: 'per_car', amount: 0 }]);
  };
  const removeLine = (idx: number) => setLines(lines.filter((_, i) => i !== idx));
  const updateLine = (idx: number, field: keyof PurchaseLine, val: any) => {
    const arr = [...lines];
    arr[idx] = { ...arr[idx], [field]: val };
    setLines(arr);
  };

  const grandTotal = lines.reduce((s, l) => s + (Number(l.amount) || 0), 0);

  const handleSubmit = async () => {
    if (!form.supplier_name || !form.purchase_date || lines.length === 0) return;
    
    setIsSubmitting(true);

    const newInvoice = {
      id: `inv-${Date.now()}`,
      supplier_name: form.supplier_name,
      vat_number: form.vat_number,
      national_address: form.national_address,
      purchase_date: form.purchase_date,
      payment_source: form.payment_source,
      total: grandTotal,
      created_at: new Date().toISOString()
    };
    
    const updated = [newInvoice, ...invoices];
    setInvoices(updated);
    localStorage.setItem(`tenant_purchases_${currentTenantId}`, JSON.stringify(updated));

    setShowAdd(false);
    setForm({ supplier_name: '', vat_number: '', national_address: '', purchase_date: new Date().toISOString().slice(0, 10), payment_source: 'cash', image_url: '' });
    setLines([{ item_name: '', allocation: 'per_car', amount: 0 }]);
    setIsSubmitting(false);
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="المشتريات"
        subtitle="تسجيل فواتير المشتريات ومتابعة المصروفات المباشرة"
        action={
          can('purchases.create') ? (
            <Button onClick={() => setShowAdd(true)} className="bg-primary-600 hover:bg-primary-700 font-bold">
              <Plus className="w-4 h-4 ml-2" /> إضافة فاتورة مشتريات
            </Button>
          ) : undefined
        }
      />

      <Card className="border-0 shadow-sm">
        <CardBody className="p-0">
          {invoices.length === 0 ? (
            <div className="p-12 text-center text-surface-500">
              <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-surface-300" />
              <p>لا توجد فواتير مشتريات مسجلة.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="bg-surface-50 text-surface-600 border-b border-surface-100">
                    <th className="py-3 px-5 font-bold">المورد</th>
                    <th className="py-3 px-5 font-bold">التاريخ</th>
                    <th className="py-3 px-5 font-bold">طريقة السداد</th>
                    <th className="py-3 px-5 font-bold">الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-surface-50/50 transition-colors">
                      <td className="py-3 px-5 font-bold text-surface-800">
                        {inv.supplier_name}
                        {inv.vat_number && <span className="block text-xs font-normal text-surface-400">الرقم الضريبي: {inv.vat_number}</span>}
                      </td>
                      <td className="py-3 px-5 font-medium text-surface-600">{formatDate(inv.purchase_date)}</td>
                      <td className="py-3 px-5 text-surface-600">
                        {inv.payment_source === 'cash' ? 'كاش' : inv.payment_source === 'bank' ? 'حوالة بنكية' : 'شبكة / مدى'}
                      </td>
                      <td className="py-3 px-5 font-black text-surface-900">{formatSAR(inv.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="فاتورة جديدة" size="lg">
        <div className="space-y-6">
          
          <div className="bg-primary-50/50 border border-primary-100 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-primary-900 mb-2 flex items-center gap-2">
              <Building className="w-4 h-4 text-primary-600" /> بيانات المورد والفاتورة
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>اسم المورد *</Label>
                <Input value={form.supplier_name} onChange={(e) => setForm({...form, supplier_name: e.target.value})} placeholder="شركة التوريد..." />
              </div>
              <div>
                <Label>الرقم الضريبي للمورد</Label>
                <Input value={form.vat_number} onChange={(e) => setForm({...form, vat_number: e.target.value})} placeholder="3xxxxxxxxxxxxxx3" />
              </div>
              <div>
                <Label>العنوان الوطني</Label>
                <Input value={form.national_address} onChange={(e) => setForm({...form, national_address: e.target.value})} placeholder="الرياض، حي الملقا..." />
              </div>
              <div>
                <Label>تاريخ الفاتورة *</Label>
                <Input type="date" value={form.purchase_date} onChange={(e) => setForm({...form, purchase_date: e.target.value})} />
              </div>
            </div>
          </div>

          <div className="border border-surface-200 rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-surface-800">الأصناف (حد أقصى 10)</h3>
              <span className="text-xs font-bold text-surface-400 bg-surface-100 px-2 py-1 rounded-lg">{lines.length} / 10</span>
            </div>
            
            <div className="space-y-3">
              {lines.map((line, idx) => (
                <div key={idx} className="flex gap-3 items-start bg-surface-50 p-3 rounded-xl border border-surface-100">
                  <div className="flex-1">
                    <Input placeholder="اسم الصنف" value={line.item_name} onChange={(e) => updateLine(idx, 'item_name', e.target.value)} />
                  </div>
                  <div className="w-40">
                    <Select value={line.allocation} onChange={(e) => updateLine(idx, 'allocation', e.target.value as any)}>
                      <option value="per_car">تكلفة متغيرة (على السيارات)</option>
                      <option value="per_month">تكلفة ثابتة (على الشهور)</option>
                    </Select>
                  </div>
                  <div className="w-32">
                    <Input type="number" placeholder="المبلغ (ريال)" value={line.amount || ''} onChange={(e) => updateLine(idx, 'amount', Number(e.target.value))} />
                  </div>
                  {lines.length > 1 && (
                    <button onClick={() => removeLine(idx)} className="p-3 text-surface-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors mt-0.5">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            {lines.length < 10 && (
              <button onClick={addLine} className="w-full py-3 border-2 border-dashed border-surface-200 rounded-xl text-surface-500 font-bold hover:bg-surface-50 hover:border-primary-300 hover:text-primary-700 transition-all text-sm flex justify-center items-center gap-2">
                <Plus className="w-4 h-4" /> إضافة صنف آخر
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>مصدر السداد (طريقة الدفع)</Label>
              <div className="flex gap-2">
                {['cash', 'bank', 'pos'].map(t => (
                  <button
                    key={t}
                    onClick={() => setForm({...form, payment_source: t})}
                    className={`flex-1 py-2 px-3 rounded-xl text-sm font-bold border ${form.payment_source === t ? 'bg-primary-50 border-primary-500 text-primary-800' : 'border-surface-200 text-surface-500 hover:bg-surface-50'}`}
                  >
                    {t === 'cash' ? 'كاش' : t === 'bank' ? 'حوالة' : 'مدى'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>صورة الفاتورة المرفقة</Label>
              <button className="w-full h-[42px] border border-surface-200 bg-surface-50 rounded-xl flex items-center justify-center gap-2 text-sm text-surface-500 hover:text-primary-700 hover:bg-primary-50 transition-colors">
                <Upload className="w-4 h-4" /> إرفاق صورة (اختياري)
              </button>
            </div>
          </div>

          <div className="p-4 bg-surface-900 rounded-2xl flex justify-between items-center text-white">
            <span className="font-medium text-surface-300">الإجمالي الشامل:</span>
            <span className="text-2xl font-black text-primary-400">{formatSAR(grandTotal)}</span>
          </div>

          <Button onClick={handleSubmit} disabled={isSubmitting || lines.length === 0} className="w-full h-12 text-base font-bold rounded-xl shadow-lg shadow-primary-900/10">
            {isSubmitting ? 'جاري الحفظ...' : 'حفظ الفاتورة وإدراج التكاليف'}
          </Button>

        </div>
      </Modal>
    </div>
  );
}
