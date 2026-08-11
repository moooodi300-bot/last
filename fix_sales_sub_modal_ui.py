import re

with open('src/pages/SalesPage.tsx', 'r') as f:
    content = f.read()

start_modal = content.find("<Modal open={showSubForm} onClose={() => setShowSubForm(false)} title={tr('subscriptionInvoice', lang)} size=\"lg\">")
end_modal = content.find("</Modal>", start_modal)

new_modal_content = """<Modal open={showSubForm} onClose={() => setShowSubForm(false)} title="تأكيد شراء اشتراك جديد" size="lg">
        <div className="space-y-4">
          <div>
            <Label>اختر الباقة</Label>
            <Select value={subForm.subscription_id} onChange={(e) => {
               const sub = subs.find(s => s.id === e.target.value);
               if (sub) {
                  setSubForm({ ...subForm, subscription_id: sub.id, manual_price: sub.monthly_price || sub.price_monthly || 0, wash_limit: sub.washes_included || 0 });
               } else {
                  setSubForm({ ...subForm, subscription_id: e.target.value });
               }
            }}>
               <option value="">-- اختر الباقة --</option>
               {subs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </div>
          
          {subForm.subscription_id && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                <p className="font-bold text-slate-800">تفاصيل الباقة:</p>
                <div className="grid grid-cols-3 gap-2 text-sm text-slate-600">
                    <div>السعر: <span className="font-bold text-slate-900">{subForm.manual_price} ريال</span></div>
                    <div>عدد الغسلات: <span className="font-bold text-slate-900">{subForm.wash_limit}</span></div>
                    <div>المدة: <span className="font-bold text-slate-900">30 يوم</span></div>
                </div>
            </div>
          )}

          {!selectedCustomer?.vehicle_type && (
              <div className="grid grid-cols-3 gap-3">
                <div><Label>{tr('carType', lang)} *</Label><Input value={subForm.car_type} onChange={(e) => setSubForm({ ...subForm, car_type: e.target.value })} placeholder={lang === 'ar' ? 'سيدان' : 'Sedan'} /></div>
                <div><Label>{tr('carColor', lang)} *</Label><Input value={subForm.car_color} onChange={(e) => setSubForm({ ...subForm, car_color: e.target.value })} placeholder={lang === 'ar' ? 'أبيض' : 'White'} /></div>
                <div><Label>{tr('plateNumber', lang)} *</Label><Input value={subForm.plate_number} onChange={(e) => setSubForm({ ...subForm, plate_number: e.target.value })} /></div>
              </div>
          )}
          
          <div className="pt-2">
            <Label className="block mb-2 text-sm font-bold">طريقة الدفع</Label>
            <div className="flex gap-2">
                <Button onClick={() => setPaymentMethod('cash')} variant={paymentMethod === 'cash' ? 'default' : 'outline'} className={paymentMethod === 'cash' ? 'bg-cyan-600' : ''}>كاش</Button>
                <Button onClick={() => setPaymentMethod('card')} variant={paymentMethod === 'card' ? 'default' : 'outline'} className={paymentMethod === 'card' ? 'bg-cyan-600' : ''}>شبكة</Button>
                <Button onClick={() => setPaymentMethod('transfer')} variant={paymentMethod === 'transfer' ? 'default' : 'outline'} className={paymentMethod === 'transfer' ? 'bg-cyan-600' : ''}>تحويل</Button>
            </div>
          </div>

          <Button onClick={addCarSubscription} className="w-full h-12 text-lg bg-emerald-600 hover:bg-emerald-700">تأكيد شراء الاشتراك</Button>
        </div>
      </Modal>"""

content = content[:start_modal] + new_modal_content + content[end_modal+8:]

with open('src/pages/SalesPage.tsx', 'w') as f:
    f.write(content)
