const fs = require('fs');
let content = fs.readFileSync('src/pages/SettingsPage.tsx', 'utf8');

const facilityUI = `          {activeTab === 'facility' && (
             <Card className="border-0 shadow-sm">
                <CardBody className="p-6 space-y-6">
                   <h3 className="font-bold text-lg flex items-center gap-2 border-b pb-3 text-slate-800">
                     <Building2 className="w-5 h-5 text-cyan-600" /> الأساسيات
                   </h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><Label>اسم المنشأة</Label><Input value={facility.name} onChange={e => setFacility({...facility, name: e.target.value})} /></div>
                      <div><Label>رقم جوال المدير (واتساب)</Label><Input dir="ltr" value={facility.phone} onChange={e => setFacility({...facility, phone: e.target.value})} /></div>
                      <div><Label>الرقم الضريبي</Label><Input value={facility.vat} onChange={e => setFacility({...facility, vat: e.target.value})} /></div>
                      <div><Label>السجل التجاري</Label><Input value={facility.cr} onChange={e => setFacility({...facility, cr: e.target.value})} /></div>
                   </div>

                   <h3 className="font-bold text-lg flex items-center gap-2 border-b pb-3 pt-4 text-slate-800">
                     <Calculator className="w-5 h-5 text-cyan-600" /> تعديل التكاليف ونقطة التعادل
                   </h3>
                   <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-4 shadow-sm">
                      <div className="grid grid-cols-2 gap-4">
                         <div>
                           <Label className="text-black font-bold">سعر أقل خدمة غسيل</Label>
                           <Input type="number" value={lowWash} onChange={e => setLowWash(Number(e.target.value))} className="mt-1 text-black font-bold" />
                         </div>
                         <div>
                           <Label className="text-black font-bold">سعر أعلى خدمة غسيل</Label>
                           <Input type="number" value={highWash} onChange={e => setHighWash(Number(e.target.value))} className="mt-1 text-black font-bold" />
                         </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-2">
                         <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                           <div className="text-xs font-bold text-slate-500 mb-1">متوسط سعر الغسيل</div>
                           <div className="font-black text-xl">{avgWashPrice} ريال</div>
                         </div>
                         <div className="bg-rose-50 p-3 rounded-lg border border-rose-200">
                           <div className="text-xs font-bold text-rose-600 mb-1">تحتاج يومياً (للتغطية)</div>
                           <div className="font-black text-xl text-rose-700">{dailyBreakEven} سيارة</div>
                         </div>
                      </div>
                      <div>
                         <Label className="text-black font-bold mb-1">الهدف اليومي الطموح (عدد السيارات المتوقع)</Label>
                         <Input type="number" value={expectedDaily} onChange={e => setExpectedDaily(Number(e.target.value))} className="text-black font-bold" />
                      </div>
                   </div>

                   <h3 className="font-bold text-lg flex items-center gap-2 border-b pb-3 pt-4 text-slate-800">
                     <ListPlus className="w-5 h-5 text-cyan-600" /> الخدمات والمنتجات
                   </h3>
                   <div className="space-y-4">
                     <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                        <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5 mb-3">خدمات الغسيل الأساسية</h4>
                        <div className="space-y-2">
                           {services.map((s, i) => (
                             <div key={i} className="flex gap-2 items-center">
                               <Input className="flex-1 text-sm bg-white text-black font-semibold" placeholder="اسم الخدمة" value={s.name} onChange={e => { const a=[...services]; a[i].name = e.target.value; setServices(a); }} />
                               <Input type="number" className="w-24 text-sm bg-white text-black font-semibold" placeholder="السعر" value={s.price||''} onChange={e => { const a=[...services]; a[i].price = Number(e.target.value); setServices(a); }} />
                               <button onClick={async () => {
                                 if (s.id) { await supabase.from('services').delete().eq('id', s.id); }
                                 setServices(services.filter((_, idx) => idx !== i));
                               }} className="text-rose-400 font-bold px-2">حذف</button>
                             </div>
                           ))}
                           <button onClick={addService} className="text-xs font-bold text-cyan-600 hover:underline">إضافة خدمة +</button>
                        </div>
                     </div>
                     <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                        <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5 mb-3">منتجات إضافية للبيع</h4>
                        <div className="space-y-2">
                           {products.map((p, i) => (
                             <div key={i} className="flex gap-2 items-center">
                               <Input className="flex-1 text-sm bg-white text-black font-semibold" placeholder="اسم المنتج" value={p.name} onChange={e => { const a=[...products]; a[i].name = e.target.value; setProducts(a); }} />
                               <Input type="number" className="w-24 text-sm bg-white text-black font-semibold" placeholder="السعر" value={p.price||''} onChange={e => { const a=[...products]; a[i].price = Number(e.target.value); setProducts(a); }} />
                               <button onClick={async () => {
                                 if (p.id) { await supabase.from('services').delete().eq('id', p.id); }
                                 setProducts(products.filter((_, idx) => idx !== i));
                               }} className="text-rose-400 font-bold px-2">حذف</button>
                             </div>
                           ))}
                           <button onClick={addProduct} className="text-xs font-bold text-cyan-600 hover:underline">إضافة منتج +</button>
                        </div>
                     </div>
                   </div>

                   <h3 className="font-bold text-lg flex items-center gap-2 border-b pb-3 pt-4 text-slate-800">
                     <Star className="w-5 h-5 text-cyan-600" /> خدمات الولاء
                   </h3>
                   <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                     <div className="flex items-center justify-between mb-4">
                        <div>
                           <div className="font-bold text-slate-800">تفعيل برنامج الولاء</div>
                           <div className="text-xs text-slate-500">يحصل العميل على غسلة مجانية بعد الوصول للهدف</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                           <input type="checkbox" className="sr-only peer" checked={loyaltyEnabled} onChange={e => setLoyaltyEnabled(e.target.checked)} />
                           <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                        </label>
                     </div>
                     {loyaltyEnabled && (
                        <div className="pt-3 border-t border-slate-200">
                           <Label>عدد الغسلات للوصول للمجاني (الهدف)</Label>
                           <Input type="number" value={freeWashThreshold} onChange={e => setFreeWashThreshold(Number(e.target.value))} className="w-24 mt-1" />
                        </div>
                     )}
                   </div>

                   <h3 className="font-bold text-lg flex items-center gap-2 border-b pb-3 pt-4 text-slate-800">
                     <Star className="w-5 h-5 text-cyan-600" /> باقات اشتراكات العملاء
                   </h3>
                   <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                     <div className="space-y-4 mb-4">
                       {subs.map(sub => (
                         <div key={sub.id} className="p-4 border rounded-xl flex justify-between items-center bg-white shadow-sm">
                           <div>
                             <h4 className="font-bold text-slate-800">{sub.name}</h4>
                             <p className="text-xs text-slate-500">{sub.monthly_price} ريال / شهر • {sub.washes_included} غسلة</p>
                           </div>
                           <button onClick={async () => {
                              if(confirm('هل أنت متأكد من حذف الباقة؟')) {
                                await supabase.from('subscriptions').delete().eq('id', sub.id);
                                loadSubs();
                              }
                           }} className="text-rose-500 text-sm font-bold bg-rose-50 px-2 py-1 rounded">حذف</button>
                         </div>
                       ))}
                       {subs.length === 0 && <p className="text-sm text-slate-400 text-center py-2">لا توجد باقات حالياً</p>}
                     </div>
                     
                     <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mt-4">
                        <h4 className="font-bold text-sm mb-3">إضافة باقة جديدة</h4>
                        <form onSubmit={async (e) => {
                           e.preventDefault();
                           const fd = new FormData(e.currentTarget);
                           const name = fd.get('name');
                           const price = Number(fd.get('price'));
                           const washes = Number(fd.get('washes'));
                           if(!name || price <= 0 || washes <= 0) return;
                           
                           await supabase.from('subscriptions').insert({
                             name, monthly_price: price, washes_included: washes, active: true
                           });
                           e.target.reset();
                           loadSubs();
                        }} className="space-y-3">
                           <div><Label>اسم الباقة (مثال: اشتراك بلاتيني)</Label><Input name="name" required /></div>
                           <div className="grid grid-cols-2 gap-3">
                              <div><Label>السعر الشهري (ريال)</Label><Input name="price" type="number" required /></div>
                              <div><Label>عدد الغسلات</Label><Input name="washes" type="number" required /></div>
                           </div>
                           <Button type="submit" variant="outline" className="w-full">إضافة الباقة +</Button>
                        </form>
                     </div>
                   </div>

                   <div className="pt-6 mt-6 border-t flex justify-end">
                      <Button onClick={handleSave} disabled={loading} className="bg-cyan-600 font-bold px-8 py-3"><Save className="w-5 h-5 ml-2" /> حفظ التغييرات</Button>
                   </div>
                </CardBody>
             </Card>
          )}`;

const facilityStart = content.indexOf("{activeTab === 'facility' && (");
const facilityEnd = content.indexOf("{activeTab === 'fleet' && (");

if (facilityStart > -1 && facilityEnd > -1) {
  content = content.slice(0, facilityStart) + facilityUI + '\n          ' + content.slice(facilityEnd);
}

fs.writeFileSync('src/pages/SettingsPage.tsx', content);
