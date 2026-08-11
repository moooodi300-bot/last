import { useState, useEffect } from 'react';
import { Card, CardBody, Button, Input, Select, Badge, Label, Modal } from './ui';
import { useAuth } from '@/lib/auth';
import { Plus, Tag, Trash2, Edit2 } from 'lucide-react';
import type { DiscountCode } from '@/lib/types';
import { getLocalDiscounts, saveLocalDiscount, deleteLocalDiscount } from '@/lib/discountStore';

export function DiscountsSettings() {
  const { organization } = useAuth();
  const currentTenantId = organization?.id || 'org_client_01';
  
  const [discounts, setDiscounts] = useState<DiscountCode[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [form, setForm] = useState<Partial<DiscountCode>>({
    code: '',
    description: '',
    type: 'percentage',
    value: 0,
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    max_uses: 0,
    is_active: true,
    min_invoice_amount: 0,
    max_discount_amount: 0
  });

  const loadDiscounts = () => {
    setDiscounts(getLocalDiscounts(currentTenantId));
  };

  useEffect(() => {
    loadDiscounts();
  }, [currentTenantId]);

  const handleSave = () => {
    if (!form.code || !form.value) {
      alert('الرجاء إدخال كود الخصم والقيمة');
      return;
    }
    
    const newDiscount: DiscountCode = {
      id: editingId || `disc-${Date.now()}`,
      code: form.code.toUpperCase(),
      description: form.description || '',
      type: form.type as 'percentage' | 'fixed',
      value: Number(form.value),
      start_date: form.start_date || '',
      end_date: form.end_date || '',
      max_uses: Number(form.max_uses) || 0,
      uses_count: editingId ? (discounts.find(d => d.id === editingId)?.uses_count || 0) : 0,
      is_active: form.is_active ?? true,
      min_invoice_amount: Number(form.min_invoice_amount) || undefined,
      max_discount_amount: Number(form.max_discount_amount) || undefined,
    };
    
    saveLocalDiscount(newDiscount, currentTenantId);
    loadDiscounts();
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('هل أنت متأكد من حذف كود الخصم؟')) {
      deleteLocalDiscount(id, currentTenantId);
      loadDiscounts();
    }
  };

  const openAdd = () => {
    setEditingId(null);
    setForm({
      code: '',
      description: '',
      type: 'percentage',
      value: 0,
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      max_uses: 0,
      is_active: true,
      min_invoice_amount: 0,
      max_discount_amount: 0
    });
    setShowModal(true);
  };

  const openEdit = (d: DiscountCode) => {
    setEditingId(d.id);
    setForm(d);
    setShowModal(true);
  };

  return (
    <Card>
      <CardBody className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-black text-surface-800">أكواد الخصم</h3>
            <p className="text-surface-500 text-sm mt-1">إدارة كوبونات التخفيض والعروض الترويجية</p>
          </div>
          <Button onClick={openAdd} className="bg-primary-600 hover:bg-primary-700">
            <Plus className="w-4 h-4 ml-2" /> إضافة كود خصم
          </Button>
        </div>

        {discounts.length === 0 ? (
          <div className="text-center py-10 bg-surface-50 rounded-xl border border-dashed border-surface-200">
            <Tag className="w-12 h-12 text-surface-300 mx-auto mb-3" />
            <p className="text-surface-500">لا توجد أكواد خصم حالياً</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-surface-50 text-surface-600 font-bold border-b border-surface-200">
                <tr>
                  <th className="p-3 rounded-tr-xl">الكود</th>
                  <th className="p-3">النوع</th>
                  <th className="p-3">القيمة</th>
                  <th className="p-3">الاستخدام</th>
                  <th className="p-3">الصلاحية</th>
                  <th className="p-3">الحالة</th>
                  <th className="p-3 rounded-tl-xl text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {discounts.map(d => (
                  <tr key={d.id} className="hover:bg-surface-50/50 transition-colors">
                    <td className="p-3 font-bold font-mono text-primary-700 bg-primary-50/30 rounded-r-lg">{d.code}</td>
                    <td className="p-3">{d.type === 'percentage' ? 'نسبة مئوية (%)' : 'مبلغ ثابت'}</td>
                    <td className="p-3">{d.value} {d.type === 'percentage' ? '%' : 'ريال'}</td>
                    <td className="p-3 text-surface-500">
                      {d.uses_count} {d.max_uses > 0 ? ` / ${d.max_uses}` : ' (مفتوح)'}
                    </td>
                    <td className="p-3 text-surface-500">
                      {d.end_date || 'بدون تاريخ انتهاء'}
                    </td>
                    <td className="p-3">
                      <Badge tone={d.is_active ? 'emerald' : 'slate'}>{d.is_active ? 'مفعل' : 'معطل'}</Badge>
                    </td>
                    <td className="p-3 flex justify-center gap-2">
                      <button onClick={() => openEdit(d)} className="text-surface-400 hover:text-primary-600 p-1 bg-white rounded-lg border border-surface-200 shadow-sm"><Edit2 className="w-4 h-4"/></button>
                      <button onClick={() => handleDelete(d.id)} className="text-surface-400 hover:text-rose-600 p-1 bg-white rounded-lg border border-surface-200 shadow-sm"><Trash2 className="w-4 h-4"/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Modal open={showModal} onClose={() => setShowModal(false)} title={editingId ? 'تعديل كود خصم' : 'إضافة كود خصم'} size="lg">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>كود الخصم (انجليزي/أرقام) *</Label>
                <Input dir="ltr" className="text-left font-mono font-bold" value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} placeholder="SUMMER24" />
              </div>
              <div>
                <Label>الوصف</Label>
                <Input value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="خصم الصيف" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>نوع الخصم *</Label>
                <Select value={form.type} onChange={e => setForm({...form, type: e.target.value as 'percentage'|'fixed'})}>
                  <option value="percentage">نسبة مئوية (%)</option>
                  <option value="fixed">مبلغ ثابت (ريال)</option>
                </Select>
              </div>
              <div>
                <Label>قيمة الخصم *</Label>
                <Input type="number" value={form.value} onChange={e => setForm({...form, value: parseFloat(e.target.value)})} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>تاريخ البداية</Label>
                <Input type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} />
              </div>
              <div>
                <Label>تاريخ الانتهاء</Label>
                <Input type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>الحد الأقصى للاستخدام (0 = مفتوح)</Label>
                <Input type="number" value={form.max_uses} onChange={e => setForm({...form, max_uses: parseInt(e.target.value)})} />
              </div>
              <div>
                <Label>الحد الأدنى للفاتورة (اختياري)</Label>
                <Input type="number" value={form.min_invoice_amount} onChange={e => setForm({...form, min_invoice_amount: parseFloat(e.target.value)})} />
              </div>
              {form.type === 'percentage' && (
                <div>
                  <Label>أقصى مبلغ للخصم (اختياري)</Label>
                  <Input type="number" value={form.max_discount_amount} onChange={e => setForm({...form, max_discount_amount: parseFloat(e.target.value)})} />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-surface-100">
              <input type="checkbox" id="is_active" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})} className="w-4 h-4 text-primary-600 rounded" />
              <label htmlFor="is_active" className="font-bold text-surface-700">تفعيل كود الخصم</label>
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowModal(false)}>إلغاء</Button>
              <Button onClick={handleSave} className="bg-primary-600">حفظ الكود</Button>
            </div>
          </div>
        </Modal>
      </CardBody>
    </Card>
  );
}
