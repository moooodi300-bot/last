import { useState, useEffect } from 'react';
import { Building2, Save, LogOut, Calculator, ListPlus, PhoneCall, CreditCard, ShieldCheck, Star, Cloud, UploadCloud, DownloadCloud, Database, CheckCircle2, MessageCircle, Gift, Trash2, Tag, Layers, Package, Plus } from 'lucide-react';
import { exportTenantBackup, importTenantBackup } from '@/lib/backupManager';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { PageHeader, Card, CardBody, Button, Input, Label } from '@/components/ui';
import { getTenantProducts, saveAllLocalProducts, ProductItem } from '@/lib/productStore';
import { getTenantPackages, saveTenantPackage, deleteTenantPackage } from '@/lib/subscriptionStore';

import { RolesSettings } from '@/components/RolesSettings';
import { DiscountsSettings } from '@/components/DiscountsSettings';

export function SettingsPage() {
  const { signOut, user, organization, settings, refreshSettings, setSettings } = useAuth();
  const currentTenantId = organization?.id || 'org_client_01';
  const [activeTab, setActiveTab] = useState<'facility' | 'services' | 'packages' | 'costs' | 'roles' | 'fleet' | 'loyalty' | 'whatsapp' | 'backup' | 'discounts'>('facility');
  
  const [facility, setFacility] = useState({ name: settings?.company_name || organization?.name || 'مغسلتي', phone: settings?.phone || '', vat: settings?.vat_number || '', cr: (settings as any)?.cr_number || '' });
  
  // Costs & Breakeven
  const defaultCustomCosts = (settings as any)?.custom_costs || {};
  const [costs2Y, setCosts2Y] = useState<{name: string; amount: number}[]>(defaultCustomCosts.costs2Y || [{name: 'ديكور وتأسيس', amount: 20000}]);
  const [costs1Y, setCosts1Y] = useState<{name: string; amount: number}[]>(defaultCustomCosts.costs1Y || [{name: 'إيجار سنوي', amount: 50000}]);
  const [costs1M, setCosts1M] = useState<{name: string; amount: number}[]>(defaultCustomCosts.costs1M || [{name: 'رواتب تقريبية', amount: 15000}]);
  const [lowWash, setLowWash] = useState(defaultCustomCosts.lowWash || 30);
  const [highWash, setHighWash] = useState(defaultCustomCosts.highWash || 80);
  const [expectedDaily, setExpectedDaily] = useState(settings?.daily_volume_target || 40);

  // Services & Products
  const [services, setServices] = useState<{name: string; price: number; id?: string}[]>([]);
  const [products, setProducts] = useState<{name: string; price: number; id?: string}[]>([]);

  // WhatsApp
  const [whatsappInProgress, setWhatsappInProgress] = useState(settings?.whatsapp_in_progress || '');
  const [whatsappCompleted, setWhatsappCompleted] = useState(settings?.whatsapp_completed || '');
  const [whatsappDelivered, setWhatsappDelivered] = useState(settings?.whatsapp_delivered || '');

  // Loyalty & Memberships
  const [loyaltyTarget, setLoyaltyTarget] = useState(settings?.loyalty_target || 10);
  const [loyaltyEnabled, setLoyaltyEnabled] = useState(settings?.loyalty_enabled !== false);
  const [subs, setSubs] = useState<any[]>([]);

  const addCost = (arr: any[], setter: any, defName: string) => { if(arr.length < 10) setter([...arr, {name: defName, amount: 0}]) };
  const addService = () => { if(services.length < 20) setServices([...services, {id: Date.now().toString(), name: 'خدمة جديدة', price: 0}]) };
  const addProduct = () => { if(products.length < 20) setProducts([...products, {id: Date.now().toString(), name: 'منتج جديد', price: 0}]) };

  const total2Y = costs2Y.reduce((s, c) => s + Number(c.amount||0), 0) / 24;
  const total1Y = costs1Y.reduce((s, c) => s + Number(c.amount||0), 0) / 12;
  const total1M = costs1M.reduce((s, c) => s + Number(c.amount||0), 0);
  const totalMonthlyCost = total2Y + total1Y + total1M;
  const avgWashPrice = (Number(lowWash) + Number(highWash)) / 2;
  const dailyBreakEven = avgWashPrice > 0 ? Math.ceil((totalMonthlyCost / 30) / avgWashPrice) : 0;

  const [vehicles, setVehicles] = useState<any[]>([]);
  
  const loadVehicles = () => {
    try {
      const saved = localStorage.getItem(`mobile_vehicles_${currentTenantId}`);
      if (saved) setVehicles(JSON.parse(saved));
    } catch(e) {}
  };
  
  const loadSubs = () => {
    try {
      const packages = getTenantPackages(currentTenantId);
      setSubs(packages.map(p => ({
         id: p.id,
         name: p.name,
         price: p.monthly_price || p.price_monthly || 0,
         washes: p.washes_included || 0,
         durationDays: p.duration_days || 30,
         subscriptionType: p.subscription_type || 'عدد غسلات + مدة',
         vehicleScope: p.vehicle_scope || 'specific_vehicle',
         includedServices: p.included_services || 'غسيل شامل وساطع VIP',
         description: p.description || '',
         active: p.active !== false,
      })));
    } catch(e) {}
  };
  
  useEffect(() => { 
    loadVehicles(); 
    loadSubs(); 
  }, [organization?.id]);
  
  const handleSaveVehicles = () => {
    localStorage.setItem(`mobile_vehicles_${currentTenantId}`, JSON.stringify(vehicles));
    alert('تم حفظ الأسطول بنجاح');
  };

  const handleSaveSubs = () => {
    subs.forEach(sub => {
       saveTenantPackage({
           id: sub.id,
           name: sub.name,
           price_monthly: Number(sub.price),
           monthly_price: Number(sub.price),
           washes_included: Number(sub.washes),
           duration_days: Number(sub.durationDays || 30),
           subscription_type: sub.subscriptionType || 'عدد غسلات + مدة',
           vehicle_scope: sub.vehicleScope || 'specific_vehicle',
           included_services: sub.includedServices || 'غسيل شامل وساطع VIP',
           description: sub.description || null,
           active: sub.active !== false,
       } as any, currentTenantId);
    });
    alert('تم حفظ الباقات والاشتراكات بنجاح. ستظهر الباقات النشطة مباشرة في الكاشير.');
  };

  const [loading, setLoading] = useState(false);

  const loadServicesAndProducts = async () => {
    try {
        const items = await getTenantProducts(organization?.id || 'org_client_01');
        if(items) {
            setServices(items.filter((i:any) => i.category !== 'products' && !i.is_product && i.category !== 'اشتراكات' && i.category !== 'subscriptions'));
            setProducts(items.filter((i:any) => (i.category === 'products' || i.is_product) && i.category !== 'اشتراكات' && i.category !== 'subscriptions'));
        }
    } catch(e) {}
  };
  
  useEffect(() => { loadServicesAndProducts(); }, [organization]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const newSettings = {
        ...settings,
        company_name: facility.name,
        phone: facility.phone,
        vat_number: facility.vat,
        cr_number: facility.cr,
        daily_volume_target: expectedDaily,
        whatsapp_in_progress: whatsappInProgress,
        whatsapp_completed: whatsappCompleted,
        whatsapp_delivered: whatsappDelivered,
        loyalty_target: loyaltyTarget,
        loyalty_enabled: loyaltyEnabled,
        custom_costs: {
          costs2Y,
          costs1Y,
          costs1M,
          lowWash,
          highWash
        }
      };

      setSettings(newSettings as any);
      
      const allItems: ProductItem[] = [
          ...services.map(s => ({...s, category: 'services', active: true, is_product: false, cost_estimate: 0, duration_min: 20})),
          ...products.map(p => ({...p, category: 'products', active: true, is_product: true, cost_estimate: 0, duration_min: 0}))
      ];
      saveAllLocalProducts(allItems, organization?.id || 'org_client_01');
      
      subs.forEach(sub => {
          saveTenantPackage({
              id: sub.id,
              name: sub.name,
              price_monthly: Number(sub.price),
              monthly_price: Number(sub.price),
              washes_included: Number(sub.washes),
              duration_days: Number(sub.durationDays || 30),
              subscription_type: sub.subscriptionType || 'عدد غسلات + مدة',
              vehicle_scope: sub.vehicleScope || 'specific_vehicle',
              included_services: sub.includedServices || 'غسيل شامل وساطع VIP',
              description: sub.description || null,
              active: sub.active !== false,
          } as any, organization?.id || 'org_client_01');
      });

      
      alert('تم الحفظ بنجاح');
    } catch (error) {
      console.error(error);
      alert('حدث خطأ أثناء الحفظ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="الإعدادات"
        subtitle="إدارة بيانات المنشأة، الخدمات، الأسعار والاشتراكات"
        action={
          <Button onClick={signOut} variant="outline" className="text-surface-600 hover:bg-surface-100">
            <LogOut className="w-4 h-4 ml-2" /> تسجيل الخروج
          </Button>
        }
      />

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full md:w-64 shrink-0 space-y-1">
          <button onClick={() => setActiveTab('facility')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'facility' ? 'bg-primary-600 text-white shadow-md' : 'text-surface-600 hover:bg-surface-100'}`}>
            <Building2 className="w-5 h-5" /> بيانات المنشأة
          </button>
          <button onClick={() => setActiveTab('services')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'services' ? 'bg-primary-600 text-white shadow-md' : 'text-surface-600 hover:bg-surface-100'}`}>
            <ListPlus className="w-5 h-5" /> الخدمات والمنتجات
          </button>
          <button onClick={() => setActiveTab('packages')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'packages' ? 'bg-primary-600 text-white shadow-md' : 'text-surface-600 hover:bg-surface-100'}`}>
            <Layers className="w-5 h-5" /> الباقات والاشتراكات
          </button>
          <button onClick={() => setActiveTab('loyalty')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'loyalty' ? 'bg-primary-600 text-white shadow-md' : 'text-surface-600 hover:bg-surface-100'}`}>
            <Gift className="w-5 h-5" /> نظام الولاء والمكافآت
          </button>
          <button onClick={() => setActiveTab('costs')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'costs' ? 'bg-primary-600 text-white shadow-md' : 'text-surface-600 hover:bg-surface-100'}`}>
            <Calculator className="w-5 h-5" /> التكاليف والمصروفات
          </button>
          <button onClick={() => setActiveTab('roles')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'roles' ? 'bg-primary-600 text-white shadow-md' : 'text-surface-600 hover:bg-surface-100'}`}>
            <ShieldCheck className="w-5 h-5" /> الصلاحيات والأدوار
          </button>
          <button onClick={() => setActiveTab('whatsapp')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'whatsapp' ? 'bg-primary-600 text-white shadow-md' : 'text-surface-600 hover:bg-surface-100'}`}>
            <MessageCircle className="w-5 h-5" /> إشعارات واتساب
          </button>
          <button onClick={() => setActiveTab('fleet')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'fleet' ? 'bg-primary-600 text-white shadow-md' : 'text-surface-600 hover:bg-surface-100'}`}>
            <Star className="w-5 h-5" /> أسطول المتنقل
          </button>
          <button onClick={() => setActiveTab('discounts')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'discounts' ? 'bg-primary-600 text-white shadow-md' : 'text-surface-600 hover:bg-surface-100'}`}>
            <Tag className="w-5 h-5" /> أكواد الخصم
          </button>
          <button onClick={() => setActiveTab('backup')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'backup' ? 'bg-primary-600 text-white shadow-md' : 'text-surface-600 hover:bg-surface-100'}`}>
            <Database className="w-5 h-5" /> النسخ الاحتياطي
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-6">
          {activeTab === 'facility' && (
            <Card>
              <CardBody className="p-6 space-y-6">
                <h3 className="text-xl font-black text-surface-800">بيانات المنشأة الأساسية</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>اسم المغسلة</Label>
                    <Input value={facility.name ?? ''} onChange={e => setFacility({...facility, name: e.target.value})} />
                  </div>
                  <div>
                    <Label>رقم الجوال للتواصل</Label>
                    <Input value={facility.phone ?? ''} onChange={e => setFacility({...facility, phone: e.target.value})} dir="ltr" />
                  </div>
                  <div>
                    <Label>الرقم الضريبي (إن وجد)</Label>
                    <Input value={facility.vat ?? ''} onChange={e => setFacility({...facility, vat: e.target.value})} />
                  </div>
                  <div>
                    <Label>رقم السجل التجاري</Label>
                    <Input value={facility.cr ?? ''} onChange={e => setFacility({...facility, cr: e.target.value})} />
                  </div>
                </div>
                <div className="pt-4 border-t border-surface-100">
                  <Button onClick={handleSave} disabled={loading} className="bg-primary-600 hover:bg-primary-700 font-bold px-8">
                    {loading ? 'جاري الحفظ...' : <><Save className="w-4 h-4 ml-2" /> حفظ التغييرات</>}
                  </Button>
                </div>
              </CardBody>
            </Card>
          )}

          {activeTab === 'services' && (
            <div className="space-y-6">
              <Card>
                <CardBody className="p-6 space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-black text-surface-800">قائمة الخدمات</h3>
                    <Button onClick={addService} size="sm" variant="outline"><ListPlus className="w-4 h-4 ml-2"/> إضافة خدمة</Button>
                  </div>
                  <div className="space-y-3">
                    {services.map((srv, i) => (
                      <div key={i} className="flex gap-2 items-center bg-surface-50 p-2 rounded-lg border border-surface-100">
                        <div className="flex-1">
                          <Input value={srv.name ?? ''} onChange={e => { const n = [...services]; n[i].name = e.target.value; setServices(n); }} placeholder="اسم الخدمة" className="bg-white" />
                        </div>
                        <div className="w-24">
                          <Input type="number" value={srv.price ?? ''} onChange={e => { const n = [...services]; n[i].price = Number(e.target.value); setServices(n); }} placeholder="السعر" className="bg-white" />
                        </div>
                        <button onClick={() => setServices(services.filter((_, idx) => idx !== i))} className="p-2 text-surface-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {services.length === 0 && <p className="text-surface-400 text-sm">لا توجد خدمات مضافة</p>}
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardBody className="p-6 space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-black text-surface-800">قائمة المنتجات</h3>
                    <Button onClick={addProduct} size="sm" variant="outline"><ListPlus className="w-4 h-4 ml-2"/> إضافة منتج</Button>
                  </div>
                  <div className="space-y-3">
                    {products.map((prod, i) => (
                      <div key={i} className="flex gap-2 items-center bg-surface-50 p-2 rounded-lg border border-surface-100">
                        <div className="flex-1">
                          <Input value={prod.name ?? ''} onChange={e => { const n = [...products]; n[i].name = e.target.value; setProducts(n); }} placeholder="اسم المنتج" className="bg-white" />
                        </div>
                        <div className="w-24">
                          <Input type="number" value={prod.price ?? ''} onChange={e => { const n = [...products]; n[i].price = Number(e.target.value); setProducts(n); }} placeholder="السعر" className="bg-white" />
                        </div>
                        <button onClick={() => setProducts(products.filter((_, idx) => idx !== i))} className="p-2 text-surface-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {products.length === 0 && <p className="text-surface-400 text-sm">لا توجد منتجات مضافة</p>}
                  </div>
                </CardBody>
              </Card>
              
              <div className="flex justify-end">
                  <Button onClick={handleSave} disabled={loading} className="bg-primary-600 hover:bg-primary-700 font-bold px-8">
                    {loading ? 'جاري الحفظ...' : <><Save className="w-4 h-4 ml-2" /> حفظ الخدمات والمنتجات</>}
                  </Button>
              </div>
            </div>
          )}

          {activeTab === 'packages' && (
            <div className="space-y-6">
              <Card>
                <CardBody className="p-6 space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-surface-100 pb-4">
                    <div>
                      <h3 className="text-xl font-black text-surface-800 flex items-center gap-2">
                        <Layers className="w-6 h-6 text-primary-600" />
                        إدارة الباقات والاشتراكات
                      </h3>
                      <p className="text-xs text-surface-500 mt-1">
                        تعد هذه القائمة هي المصدر الرئيسي لتعريف الباقات والاشتراكات. الباقات المعرفة هنا هي التي تظهر في الكاشير عند بيع اشتراك جديد.
                      </p>
                    </div>
                    <Button
                      onClick={() =>
                        setSubs([
                          ...subs,
                          {
                            id: `sub_${Date.now()}`,
                            name: 'باقة جديدة',
                            price: 200,
                            washes: 6,
                            durationDays: 30,
                            subscriptionType: 'عدد غسلات + مدة',
                            includedServices: 'غسيل شامل وساطع VIP',
                            description: 'تتضمن غسيل دوري وشامل مع عروض معطر مجاني',
                            active: true,
                          },
                        ])
                      }
                      className="bg-primary-600 hover:bg-primary-700 text-white font-bold"
                    >
                      <Plus className="w-4 h-4 ml-2" /> إضافة باقة جديدة
                    </Button>
                  </div>

                  <div className="space-y-6">
                    {subs.map((sub, i) => (
                      <div key={sub.id || i} className={`p-5 border rounded-2xl space-y-4 transition-all ${sub.active ? 'border-primary-200 bg-primary-50/20' : 'border-surface-200 bg-surface-50 opacity-75'}`}>
                        <div className="flex justify-between items-center pb-2 border-b border-surface-200/60">
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-sm">
                              #{i + 1}
                            </span>
                            <span className={`text-xs font-bold px-3 py-1 rounded-full ${sub.active ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-surface-200 text-surface-600'}`}>
                              {sub.active ? 'مفعلة (تظهر في الكاشير)' : 'غير مفعلة (معطلة)'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...subs];
                                updated[i].active = !updated[i].active;
                                setSubs(updated);
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${sub.active ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'}`}
                            >
                              {sub.active ? 'تعطيل الباقة' : 'تفعيل الباقة'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm('هل تؤكد حذف هذه الباقة؟ الاشتراكات التي بيعت سابقاً لن تتأثر بالحذف.')) {
                                  setSubs(subs.filter((_, idx) => idx !== i));
                                }
                              }}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                              title="حذف الباقة"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label>اسم الباقة</Label>
                            <Input
                              value={sub.name ?? ''}
                              onChange={(e) => {
                                const n = [...subs];
                                n[i].name = e.target.value;
                                setSubs(n);
                              }}
                              placeholder="مثال: باقة VIP الذهبية"
                            />
                          </div>
                          <div>
                            <Label>سعر الباقة (ريال)</Label>
                            <Input
                              type="number"
                              value={sub.price ?? ''}
                              onChange={(e) => {
                                const n = [...subs];
                                n[i].price = Number(e.target.value);
                                setSubs(n);
                              }}
                            />
                          </div>
                          <div>
                            <Label>نوع الاشتراك</Label>
                            <select
                              value={sub.subscriptionType || 'عدد غسلات + مدة'}
                              onChange={(e) => {
                                const n = [...subs];
                                n[i].subscriptionType = e.target.value;
                                setSubs(n);
                              }}
                              className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm font-medium bg-white"
                            >
                              <option value="عدد غسلات + مدة">عدد غسلات + مدة زمنية</option>
                              <option value="عدد غسلات">عدد غسلات فقط</option>
                              <option value="مدة زمنية">مدة زمنية فقط (غسيل غير محدود)</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <Label>عدد الغسلات / الاستخدامات</Label>
                            <Input
                              type="number"
                              value={sub.washes ?? ''}
                              onChange={(e) => {
                                const n = [...subs];
                                n[i].washes = Number(e.target.value);
                                setSubs(n);
                              }}
                            />
                          </div>
                          <div>
                            <Label>مدة الصلاحية (بالأيام)</Label>
                            <Input
                              type="number"
                              value={sub.durationDays ?? ''}
                              onChange={(e) => {
                                const n = [...subs];
                                n[i].durationDays = Number(e.target.value);
                                setSubs(n);
                              }}
                              placeholder="30"
                            />
                          </div>
                          <div>
                            <Label>نطاق التفعيل للسيارات</Label>
                            <select
                              value={sub.vehicleScope || 'specific_vehicle'}
                              onChange={(e) => {
                                const n = [...subs];
                                n[i].vehicleScope = e.target.value;
                                setSubs(n);
                              }}
                              className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm font-medium bg-white"
                            >
                              <option value="specific_vehicle">سيارة محددة فقط (مرتبطة باللوحة واللون)</option>
                              <option value="all_vehicles">جميع سيارات العميل (أسطول العميل)</option>
                            </select>
                          </div>
                          <div>
                            <Label>الخدمات المشمولة في الباقة</Label>
                            <Input
                              value={sub.includedServices ?? ''}
                              onChange={(e) => {
                                const n = [...subs];
                                n[i].includedServices = e.target.value;
                                setSubs(n);
                              }}
                              placeholder="غسيل شامل + واكس نانو"
                            />
                          </div>
                        </div>

                        {services.length > 0 && (
                          <div className="pt-1">
                            <Label className="text-xs text-surface-500 block mb-1.5">اختر من خدمات المغسلة لإضافتها للخدمات المشمولة:</Label>
                            <div className="flex flex-wrap gap-1.5">
                              {services.map((sv) => {
                                const isIncluded = (sub.includedServices || '').includes(sv.name);
                                return (
                                  <button
                                    key={sv.id}
                                    type="button"
                                    onClick={() => {
                                      const n = [...subs];
                                      const currentStr = n[i].includedServices || '';
                                      if (isIncluded) {
                                        n[i].includedServices = currentStr.split(' + ').filter((s: string) => s !== sv.name).join(' + ');
                                      } else {
                                        n[i].includedServices = currentStr ? `${currentStr} + ${sv.name}` : sv.name;
                                      }
                                      setSubs(n);
                                    }}
                                    className={`text-xs px-2.5 py-1 rounded-full border transition-all ${isIncluded ? 'bg-primary-600 text-white border-primary-600 font-bold' : 'bg-surface-100 text-surface-700 border-surface-300 hover:bg-surface-200'}`}
                                  >
                                    {isIncluded ? '✓ ' : '+ '} {sv.name}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        <div>
                          <Label>وصف أو ملاحظات الباقة</Label>
                          <Input
                            value={sub.description ?? ''}
                            onChange={(e) => {
                              const n = [...subs];
                              n[i].description = e.target.value;
                              setSubs(n);
                            }}
                            placeholder="وصف تفصيلي للباقة يظهر للعميل في الإيصال أو الكاشير"
                          />
                        </div>
                      </div>
                    ))}

                    {subs.length === 0 && (
                      <div className="text-center py-12 bg-surface-50 rounded-2xl border border-dashed border-surface-200">
                        <Package className="w-12 h-12 text-surface-300 mx-auto mb-2" />
                        <p className="text-surface-500 font-bold">لا توجد باقات مضافة حالياً</p>
                        <p className="text-surface-400 text-xs mt-1">انقر على "إضافة باقة جديدة" للبدء في إنشاء الباقات.</p>
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>

              <div className="flex justify-end gap-3">
                <Button onClick={handleSaveSubs} className="bg-primary-600 hover:bg-primary-700 font-bold px-8 py-3 text-base shadow-md">
                  <Save className="w-5 h-5 ml-2" /> حفظ الباقات والاشتراكات
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'loyalty' && (
            <div className="space-y-6">
               <Card>
                <CardBody className="p-6 space-y-6">
                  <h3 className="text-xl font-black text-surface-800">نظام الولاء والمكافآت</h3>
                  <div className="flex items-center gap-4 bg-surface-50 p-4 rounded-xl border border-surface-200">
                     <input type="checkbox" id="loyalty_enabled" checked={loyaltyEnabled} onChange={e => setLoyaltyEnabled(e.target.checked)} className="w-5 h-5 rounded text-primary-600 focus:ring-primary-500" />
                     <label htmlFor="loyalty_enabled" className="font-bold text-surface-700 cursor-pointer">تفعيل نظام الولاء (غسلة مجانية بعد عدد من الغسلات)</label>
                  </div>
                  {loyaltyEnabled && (
                      <div>
                        <Label>عدد الغسلات المطلوبة للحصول على غسلة مجانية</Label>
                        <Input type="number" value={loyaltyTarget ?? ''} onChange={e => setLoyaltyTarget(Number(e.target.value))} className="max-w-xs" />
                      </div>
                  )}
                </CardBody>
              </Card>

              <div className="flex justify-end gap-3">
                  <Button onClick={handleSave} disabled={loading} className="bg-primary-600 hover:bg-primary-700 font-bold px-8">
                    {loading ? 'جاري الحفظ...' : <><Save className="w-4 h-4 ml-2" /> حفظ الإعدادات</>}
                  </Button>
              </div>
            </div>
          )}

          {activeTab === 'roles' && <RolesSettings />}

          {activeTab === 'whatsapp' && (
            <Card>
              <CardBody className="p-6 space-y-6">
                <h3 className="text-xl font-black text-surface-800">قوالب رسائل واتساب</h3>
                <p className="text-surface-500 text-sm">قم بتخصيص الرسائل التي سيتم إرسالها للعميل عند تغير حالة كرت العمل الخاص به.</p>
                
                <div className="space-y-4">
                  <div>
                    <Label className="text-primary-700 font-bold">عند تغيير الحالة إلى "جاري العمل"</Label>
                    <textarea 
                        className="w-full border-surface-300 rounded-lg p-3 text-sm focus:ring-primary-500 focus:border-primary-500" 
                        rows={3}
                        value={whatsappInProgress}
                        onChange={(e) => setWhatsappInProgress(e.target.value)}
                        placeholder="مثال: عميلنا العزيز، جاري العمل على مركبتك الآن."
                    />
                  </div>
                  <div>
                    <Label className="text-indigo-700 font-bold">عند تغيير الحالة إلى "مكتمل"</Label>
                    <textarea 
                        className="w-full border-surface-300 rounded-lg p-3 text-sm focus:ring-indigo-500 focus:border-indigo-500" 
                        rows={3}
                        value={whatsappCompleted}
                        onChange={(e) => setWhatsappCompleted(e.target.value)}
                        placeholder="مثال: عميلنا العزيز، انتهينا من خدمة مركبتك وهي جاهزة."
                    />
                  </div>
                  <div>
                    <Label className="text-emerald-700 font-bold">عند تغيير الحالة إلى "تم التسليم"</Label>
                    <textarea 
                        className="w-full border-surface-300 rounded-lg p-3 text-sm focus:ring-emerald-500 focus:border-emerald-500" 
                        rows={3}
                        value={whatsappDelivered}
                        onChange={(e) => setWhatsappDelivered(e.target.value)}
                        placeholder="مثال: عميلنا العزيز، شكراً لزيارتك، تم تسليم مركبتك."
                    />
                  </div>
                </div>
                
                <div className="pt-4 border-t border-surface-100">
                  <Button onClick={handleSave} disabled={loading} className="bg-primary-600 hover:bg-primary-700 font-bold px-8">
                    {loading ? 'جاري الحفظ...' : <><Save className="w-4 h-4 ml-2" /> حفظ القوالب</>}
                  </Button>
                </div>
              </CardBody>
            </Card>
          )}

          {activeTab === 'costs' && (
            <Card>
              <CardBody className="p-6 space-y-6">
                <h3 className="text-xl font-black text-surface-800">حاسبة التكاليف ونقطة التعادل</h3>
                <p className="text-sm text-surface-500 leading-relaxed mb-6">قم بإدخال التكاليف التقريبية لمغسلتك لحساب المصروف الشهري وتحديد نقطة التعادل (كم سيارة تحتاج لغسيلها يومياً لتغطية المصاريف).</p>
                
                {/* Cost tables */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-surface-50 p-5 rounded-xl border border-surface-200">
                    <h4 className="font-bold mb-4 flex items-center justify-between text-surface-800">تكاليف تأسيس (2 سنتين) <Button variant="outline" size="sm" onClick={() => addCost(costs2Y, setCosts2Y, 'تأسيس جديد')} className="h-8 px-3 text-sm">+</Button></h4>
                    {costs2Y.map((c,i) => <div key={i} className="flex gap-3 mb-3"><Input className="h-10 text-sm" placeholder="اسم التكلفة" value={c.name ?? ''} onChange={(e)=>{const n=[...costs2Y]; n[i].name=e.target.value; setCosts2Y(n)}}/><Input type="number" placeholder="المبلغ" className="h-10 text-sm w-28" value={c.amount || ''} onChange={(e)=>{const n=[...costs2Y]; n[i].amount=Number(e.target.value); setCosts2Y(n)}}/></div>)}
                  </div>
                  <div className="bg-surface-50 p-5 rounded-xl border border-surface-200">
                    <h4 className="font-bold mb-4 flex items-center justify-between text-surface-800">مصاريف سنوية <Button variant="outline" size="sm" onClick={() => addCost(costs1Y, setCosts1Y, 'مصروف سنوي')} className="h-8 px-3 text-sm">+</Button></h4>
                    {costs1Y.map((c,i) => <div key={i} className="flex gap-3 mb-3"><Input className="h-10 text-sm" placeholder="اسم التكلفة" value={c.name ?? ''} onChange={(e)=>{const n=[...costs1Y]; n[i].name=e.target.value; setCosts1Y(n)}}/><Input type="number" placeholder="المبلغ" className="h-10 text-sm w-28" value={c.amount || ''} onChange={(e)=>{const n=[...costs1Y]; n[i].amount=Number(e.target.value); setCosts1Y(n)}}/></div>)}
                  </div>
                  <div className="bg-surface-50 p-5 rounded-xl border border-surface-200">
                    <h4 className="font-bold mb-4 flex items-center justify-between text-surface-800">مصاريف شهرية ثابتة <Button variant="outline" size="sm" onClick={() => addCost(costs1M, setCosts1M, 'مصروف شهري')} className="h-8 px-3 text-sm">+</Button></h4>
                    {costs1M.map((c,i) => <div key={i} className="flex gap-3 mb-3"><Input className="h-10 text-sm" placeholder="اسم التكلفة" value={c.name ?? ''} onChange={(e)=>{const n=[...costs1M]; n[i].name=e.target.value; setCosts1M(n)}}/><Input type="number" placeholder="المبلغ" className="h-10 text-sm w-28" value={c.amount || ''} onChange={(e)=>{const n=[...costs1M]; n[i].amount=Number(e.target.value); setCosts1M(n)}}/></div>)}
                  </div>
                </div>
                
                <div className="bg-primary-50 p-6 rounded-xl border border-primary-100 flex flex-col lg:flex-row items-center justify-between gap-6">
                  <div>
                    <p className="text-primary-800 font-bold mb-1">إجمالي التكلفة الشهرية المحسوبة:</p>
                    <p className="text-3xl font-black text-primary-700">{Math.round(totalMonthlyCost).toLocaleString()} <span className="text-base font-normal">ريال/شهر</span></p>
                  </div>
                  
                  <div className="w-full lg:w-auto grid grid-cols-1 md:grid-cols-3 gap-4 bg-white/60 p-4 rounded-xl border border-primary-100">
                    <div>
                      <Label className="text-sm font-bold text-surface-700 mb-1 block">متوسط سعر غسلة أقل</Label>
                      <Input type="number" className="h-10 text-sm font-bold text-primary-900" value={lowWash ?? ''} onChange={e=>setLowWash(Number(e.target.value))} />
                    </div>
                    <div>
                      <Label className="text-sm font-bold text-surface-700 mb-1 block">متوسط سعر غسلة أعلى</Label>
                      <Input type="number" className="h-10 text-sm font-bold text-primary-900" value={highWash ?? ''} onChange={e=>setHighWash(Number(e.target.value))} />
                    </div>
                    <div>
                      <Label className="text-sm font-bold text-surface-700 mb-1 block">الهدف اليومي للمبيعات (سيارة)</Label>
                      <Input type="number" className="h-10 text-sm font-bold text-amber-700 border-amber-200 focus:border-amber-400 bg-amber-50" value={expectedDaily ?? ''} onChange={e=>setExpectedDaily(Number(e.target.value))} />
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-primary-200 text-center min-w-[180px]">
                    <p className="text-sm font-bold text-surface-500 mb-1">نقطة التعادل (لعدم الخسارة)</p>
                    <p className="text-2xl font-black text-rose-600">{dailyBreakEven} <span className="text-base font-normal">سيارة/يومياً</span></p>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {activeTab === 'fleet' && (
            <Card>
              <CardBody className="p-6 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-black text-surface-800">إدارة الأسطول المتنقل</h3>
                  <Button onClick={() => setVehicles([...vehicles, {id: Date.now().toString(), plate: '', worker_name: '', worker_phone: '', type: 'van'}])} size="sm" variant="outline"><ListPlus className="w-4 h-4 ml-2"/> إضافة مركبة</Button>
                </div>
                <div className="space-y-4">
                  {vehicles.map((v, i) => (
                    <div key={i} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 border border-surface-200 rounded-xl bg-surface-50">
                      <div><Label>رقم اللوحة</Label><Input value={v.plate ?? ''} onChange={e => { const n=[...vehicles]; n[i].plate=e.target.value; setVehicles(n); }} /></div>
                      <div><Label>اسم العامل</Label><Input value={v.worker_name ?? ''} onChange={e => { const n=[...vehicles]; n[i].worker_name=e.target.value; setVehicles(n); }} /></div>
                      <div><Label>جوال العامل</Label><Input value={v.worker_phone ?? ''} dir="ltr" onChange={e => { const n=[...vehicles]; n[i].worker_phone=e.target.value; setVehicles(n); }} /></div>
                      <div>
                        <Label>نوع المركبة</Label>
                        <select className="w-full border-surface-300 rounded-lg text-sm" value={v.type} onChange={e => { const n=[...vehicles]; n[i].type=e.target.value; setVehicles(n); }}>
                           <option value="van">فان غسيل</option>
                           <option value="bike">دباب</option>
                        </select>
                      </div>
                    </div>
                  ))}
                  {vehicles.length === 0 && <p className="text-surface-400 text-sm">لا توجد مركبات مضافة للأسطول</p>}
                </div>
                <div className="pt-4 border-t border-surface-100 flex justify-end">
                  <Button onClick={handleSaveVehicles} className="bg-primary-600 hover:bg-primary-700 font-bold px-8">
                    <Save className="w-4 h-4 ml-2" /> حفظ بيانات الأسطول
                  </Button>
                </div>
              </CardBody>
            </Card>
          )}

          {activeTab === 'discounts' && (
        <div className="space-y-6">
          <DiscountsSettings />
        </div>
      )}
      
{activeTab === 'backup' && (
  <Card>
    <CardBody className="p-6 text-center space-y-4">
      <Database className="w-16 h-16 mx-auto text-surface-300" />
      <h3 className="text-xl font-black text-surface-800">النسخ الاحتياطي والمزامنة</h3>
      <p className="text-surface-500 max-w-md mx-auto">
        يمكنك أخذ نسخة احتياطية لبيانات منشأتك الحالية بصيغة ملف، أو استعادة بيانات من ملف نسخة احتياطية سابقة.
      </p>
      
      <div className="flex justify-center gap-4 pt-4 border-t border-surface-100 mt-6">
        <Button onClick={() => {
          if (!currentTenantId) return;
          const json = exportTenantBackup(currentTenantId);
          const blob = new Blob([json], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `RAQM_Backup_${new Date().toISOString().split('T')[0]}.json`;
          a.click();
          URL.revokeObjectURL(url);
        }} className="font-bold text-white bg-emerald-600 hover:bg-emerald-700">
          <DownloadCloud className="w-4 h-4 ml-2" /> تصدير نسخة احتياطية
        </Button>

        <div className="relative">
          <input
            type="file"
            accept=".json"
            id="import-backup-file"
            className="hidden"
            onChange={async (e) => {
               const file = e.target.files?.[0];
               if (!file || !currentTenantId) return;
               if (!confirm("تحذير: سيتم دمج أو استبدال البيانات الحالية ببيانات النسخة الاحتياطية. هل تريد المتابعة؟")) {
                 e.target.value = '';
                 return;
               }
               const reader = new FileReader();
               reader.onload = (ev) => {
                 try {
                    const content = ev.target?.result as string;
                    if (importTenantBackup(currentTenantId, content)) {
                       alert('تمت الاستعادة بنجاح. يرجى تحديث الصفحة.');
                       window.location.reload();
                    }
                 } catch (err: any) {
                    alert('فشل الاستيراد: ' + err.message);
                 }
               };
               reader.readAsText(file);
            }}
          />
          <Button 
            variant="outline"
            onClick={() => document.getElementById('import-backup-file')?.click()}
            className="font-bold text-surface-600">
            <UploadCloud className="w-4 h-4 ml-2" /> استعادة نسخة احتياطية
          </Button>
        </div>
      </div>
    </CardBody>
  </Card>
)}


        </div>
      </div>
    </div>
  );
}
