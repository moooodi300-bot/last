import type { Service, Customer, Staff, Branch, InventoryItem, Subscription, CustomerSubscription, Sale, Expense, Purchase, Settings } from './types';

export const SAMPLE_SETTINGS: Settings = {
  id: 'demo-settings-id',
  company_name: 'مغسلة رقم النموذجية',
  logo_url: null,
  currency: 'SAR',
  daily_volume_target: 35,
  working_days: 30,
  phone: '0501234567',
  address: 'الرياض - حي الملقا - طريق الملك فهد',
  vat_number: '310022334400003',
  brand_color: '#0e7490',
  brand_accent: '#2563eb',
  language: 'ar',
  city: null,
  cr_number: null,
  district: null,
  street: null,
  postal_code: null,
  building_number: null,
  vat_rate: 15,
  updated_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  organization_id: undefined,
};

export const SAMPLE_BRANCHES: Branch[] = [
  { id: 'br-1', name: 'الفرع الرئيسي - الملقا', location: 'الرياض - طريق الملك فهد', phone: '0112345678', manager: 'عبد الله العتيبي', active: true },
  { id: 'br-2', name: 'فرع الياسمين', location: 'الرياض - طريق أنس بن مالك', phone: '0118765432', manager: 'سعود الشمري', active: true },
  { id: 'br-3', name: 'فرع الشاطئ', location: 'الدمام - شارع الخليج', phone: '0134455667', manager: 'فيصل الغامدي', active: true },
];

export const SAMPLE_SERVICES: Service[] = [
  { id: 'srv-1', name: 'غسيل خارجي بخار ودش ساطع', category: 'غسيل ساطع', price: 35, cost_estimate: 8, duration_min: 20, active: true },
  { id: 'srv-2', name: 'غسيل شامل وساطع VIP مع تعاطير', category: 'غسيل ساطع', price: 75, cost_estimate: 18, duration_min: 35, active: true },
  { id: 'srv-3', name: 'تلميع ساطع نانو سيراميك H9 كامل', category: 'تلميع ساطع', price: 350, cost_estimate: 85, duration_min: 120, active: true },
  { id: 'srv-4', name: 'تنظيف وتعقيم المراتب بالبخار الفوري', category: 'تلميع ساطع', price: 180, cost_estimate: 40, duration_min: 60, active: true },
  { id: 'srv-5', name: 'حماية شمعية سريعة Wax نانو', category: 'خدمات إضافية', price: 90, cost_estimate: 22, duration_min: 25, active: true },
  { id: 'srv-6', name: 'غسيل محرك وتزييت وتشحيم الأسفل', category: 'خدمات إضافية', price: 70, cost_estimate: 15, duration_min: 30, active: true },
];

export const DEMO_CUSTOMERS: Customer[] = [
  { id: 'c-1', name: 'أحمد صالح', phone: '0501111111', plate_number: 'أ ب ت 1111', loyalty_stamps: 0, free_washes_earned: 0, notes: '', created_at: new Date().toISOString() },
  { id: 'c-2', name: 'خالد عبدالله', phone: '0502222222', plate_number: 'ب ت ث 2222', loyalty_stamps: 2, free_washes_earned: 0, notes: '', created_at: new Date().toISOString() },
  { id: 'c-3', name: 'سارة محمد', phone: '0503333333', plate_number: 'ت ث ج 3333', loyalty_stamps: 4, free_washes_earned: 0, notes: '', created_at: new Date().toISOString() },
  { id: 'c-4', name: 'فهد عبدالعزيز', phone: '0504444444', plate_number: 'ث ج ح 4444', loyalty_stamps: 1, free_washes_earned: 0, notes: '', created_at: new Date().toISOString() },
  { id: 'c-5', name: 'نورة السالم', phone: '0505555555', plate_number: 'ج ح خ 5555', loyalty_stamps: 5, free_washes_earned: 0, notes: '', created_at: new Date().toISOString() },
  { id: 'c-6', name: 'ماجد الشمري', phone: '0506666666', plate_number: 'ح خ د 6666', loyalty_stamps: 0, free_washes_earned: 0, notes: '', created_at: new Date().toISOString() },
  { id: 'c-7', name: 'فيصل المطيري', phone: '0507777777', plate_number: 'خ د ذ 7777', loyalty_stamps: 3, free_washes_earned: 0, notes: '', created_at: new Date().toISOString() },
  { id: 'c-8', name: 'منى القحطاني', phone: '0508888888', plate_number: 'د ذ ر 8888', loyalty_stamps: 0, free_washes_earned: 0, notes: '', created_at: new Date().toISOString() },
  { id: 'c-9', name: 'سعود الدوسري', phone: '0509999999', plate_number: 'ذ ر ز 9999', loyalty_stamps: 6, free_washes_earned: 1, notes: '', created_at: new Date().toISOString() },
  { id: 'c-10', name: 'تركي العتيبي', phone: '0500000000', plate_number: 'ر ز س 1000', loyalty_stamps: 0, free_washes_earned: 0, notes: '', created_at: new Date().toISOString() },
];

export function getSampleCustomersForTenant(tenantId?: string): Customer[] {
  const cleanId = tenantId ? tenantId.replace(/[^a-zA-Z0-9_-]/g, '_') : 'org_client_01';
  
  if (cleanId === 'org_client_02') {
    return [
      { id: 'c-201', name: 'وفاء السالم', phone: '0521111111', plate_number: 'أ س ل 2001', loyalty_stamps: 1, free_washes_earned: 0, notes: '', created_at: new Date().toISOString() },
      { id: 'c-202', name: 'ريم القحطاني', phone: '0522222222', plate_number: 'ب ق ح 2002', loyalty_stamps: 3, free_washes_earned: 0, notes: '', created_at: new Date().toISOString() },
      { id: 'c-203', name: 'سارة الشمري', phone: '0523333333', plate_number: 'ت ش م 2003', loyalty_stamps: 0, free_washes_earned: 0, notes: '', created_at: new Date().toISOString() },
      { id: 'c-204', name: 'هند الدوسري', phone: '0524444444', plate_number: 'ث د و 2004', loyalty_stamps: 4, free_washes_earned: 1, notes: '', created_at: new Date().toISOString() },
      { id: 'c-205', name: 'نورا السبيعي', phone: '0525555555', plate_number: 'ج س ب 2005', loyalty_stamps: 2, free_washes_earned: 0, notes: '', created_at: new Date().toISOString() },
      { id: 'c-206', name: 'أسماء الغامدي', phone: '0526666666', plate_number: 'ح غ م 2006', loyalty_stamps: 0, free_washes_earned: 0, notes: '', created_at: new Date().toISOString() },
      { id: 'c-207', name: 'شهد المالكي', phone: '0527777777', plate_number: 'خ م ل 2007', loyalty_stamps: 1, free_washes_earned: 0, notes: '', created_at: new Date().toISOString() },
      { id: 'c-208', name: 'منى الزهراني', phone: '0528888888', plate_number: 'د ز هـ 2008', loyalty_stamps: 3, free_washes_earned: 0, notes: '', created_at: new Date().toISOString() },
      { id: 'c-209', name: 'أمل العتيبي', phone: '0529999999', plate_number: 'ذ ع ت 2009', loyalty_stamps: 0, free_washes_earned: 0, notes: '', created_at: new Date().toISOString() },
      { id: 'c-210', name: 'لطيفة المطيري', phone: '0520000000', plate_number: 'ر م ط 2010', loyalty_stamps: 2, free_washes_earned: 0, notes: '', created_at: new Date().toISOString() },
    ];
  }
  
  if (cleanId === 'org_client_03') {
    return [
      { id: 'c-301', name: 'هاني المطيري', phone: '0531111111', plate_number: 'أ م ط 3001', loyalty_stamps: 2, free_washes_earned: 0, notes: '', created_at: new Date().toISOString() },
      { id: 'c-302', name: 'بدر الدوسري', phone: '0532222222', plate_number: 'ب د و 3002', loyalty_stamps: 0, free_washes_earned: 0, notes: '', created_at: new Date().toISOString() },
      { id: 'c-303', name: 'ناصر الحارثي', phone: '0533333333', plate_number: 'ت ح ر 3003', loyalty_stamps: 4, free_washes_earned: 1, notes: '', created_at: new Date().toISOString() },
      { id: 'c-304', name: 'مشعل السبيعي', phone: '0534444444', plate_number: 'ث س ب 3004', loyalty_stamps: 1, free_washes_earned: 0, notes: '', created_at: new Date().toISOString() },
      { id: 'c-305', name: 'سامي الخالدي', phone: '0535555555', plate_number: 'ج خ ل 3005', loyalty_stamps: 3, free_washes_earned: 0, notes: '', created_at: new Date().toISOString() },
      { id: 'c-306', name: 'زياد الحربي', phone: '0536666666', plate_number: 'ح ح ر 3006', loyalty_stamps: 0, free_washes_earned: 0, notes: '', created_at: new Date().toISOString() },
      { id: 'c-307', name: 'سلطان القحطاني', phone: '0537777777', plate_number: 'خ ق ح 3007', loyalty_stamps: 2, free_washes_earned: 0, notes: '', created_at: new Date().toISOString() },
      { id: 'c-308', name: 'خالد الزهراني', phone: '0538888888', plate_number: 'د ز هـ 3008', loyalty_stamps: 1, free_washes_earned: 0, notes: '', created_at: new Date().toISOString() },
      { id: 'c-309', name: 'عادل العنزي', phone: '0539999999', plate_number: 'ذ ع ن 3009', loyalty_stamps: 0, free_washes_earned: 0, notes: '', created_at: new Date().toISOString() },
      { id: 'c-310', name: 'راشد العتيبي', phone: '0530000000', plate_number: 'ر ع ت 3010', loyalty_stamps: 3, free_washes_earned: 0, notes: '', created_at: new Date().toISOString() },
    ];
  }
  
  if (cleanId === 'org_client_04') {
    return [
      { id: 'c-401', name: 'عبدالرحمن العنزي', phone: '0541111111', plate_number: 'أ ع ن 4001', loyalty_stamps: 0, free_washes_earned: 0, notes: '', created_at: new Date().toISOString() },
      { id: 'c-402', name: 'ياسر الزهراني', phone: '0542222222', plate_number: 'ب ز هـ 4002', loyalty_stamps: 4, free_washes_earned: 1, notes: '', created_at: new Date().toISOString() },
      { id: 'c-403', name: 'حسام الشمري', phone: '0543333333', plate_number: 'ت ش م 4003', loyalty_stamps: 1, free_washes_earned: 0, notes: '', created_at: new Date().toISOString() },
      { id: 'c-404', name: 'وليد الغامدي', phone: '0544444444', plate_number: 'ث غ م 4004', loyalty_stamps: 2, free_washes_earned: 0, notes: '', created_at: new Date().toISOString() },
      { id: 'c-405', name: 'صالح العتيبي', phone: '0545555555', plate_number: 'ج ع ت 4005', loyalty_stamps: 0, free_washes_earned: 0, notes: '', created_at: new Date().toISOString() },
      { id: 'c-406', name: 'طارق القحطاني', phone: '0546666666', plate_number: 'ح ق ح 4006', loyalty_stamps: 3, free_washes_earned: 0, notes: '', created_at: new Date().toISOString() },
      { id: 'c-407', name: 'ثامر المطيري', phone: '0547777777', plate_number: 'خ م ط 4007', loyalty_stamps: 1, free_washes_earned: 0, notes: '', created_at: new Date().toISOString() },
      { id: 'c-408', name: 'مازن الحربي', phone: '0548888888', plate_number: 'د ح ر 4008', loyalty_stamps: 0, free_washes_earned: 0, notes: '', created_at: new Date().toISOString() },
      { id: 'c-409', name: 'منصور الشهري', phone: '0549999999', plate_number: 'ذ ش هـ 4009', loyalty_stamps: 2, free_washes_earned: 0, notes: '', created_at: new Date().toISOString() },
      { id: 'c-410', name: 'نواف الدوسري', phone: '0540000000', plate_number: 'ر د و 4010', loyalty_stamps: 4, free_washes_earned: 1, notes: '', created_at: new Date().toISOString() },
    ];
  }

  if (cleanId === 'org_client_05') {
    return [
      { id: 'c-501', name: 'إياد الغامدي', phone: '0551111111', plate_number: 'أ غ م 5001', loyalty_stamps: 1, free_washes_earned: 0, notes: '', created_at: new Date().toISOString() },
      { id: 'c-502', name: 'سلطان العتيبي', phone: '0552222222', plate_number: 'ب ع ت 5002', loyalty_stamps: 3, free_washes_earned: 0, notes: '', created_at: new Date().toISOString() },
      { id: 'c-503', name: 'باسم القحطاني', phone: '0553333333', plate_number: 'ت ق ح 5003', loyalty_stamps: 0, free_washes_earned: 0, notes: '', created_at: new Date().toISOString() },
      { id: 'c-504', name: 'عمر الشمري', phone: '0554444444', plate_number: 'ث ش م 5004', loyalty_stamps: 4, free_washes_earned: 1, notes: '', created_at: new Date().toISOString() },
      { id: 'c-505', name: 'تركي الدوسري', phone: '0555555555', plate_number: 'ج د و 5005', loyalty_stamps: 2, free_washes_earned: 0, notes: '', created_at: new Date().toISOString() },
      { id: 'c-506', name: 'فراس المالكي', phone: '0556666666', plate_number: 'ح م ل 5006', loyalty_stamps: 0, free_washes_earned: 0, notes: '', created_at: new Date().toISOString() },
      { id: 'c-507', name: 'رامي الزهراني', phone: '0557777777', plate_number: 'خ ز هـ 5007', loyalty_stamps: 1, free_washes_earned: 0, notes: '', created_at: new Date().toISOString() },
      { id: 'c-508', name: 'أيمن الحربي', phone: '0558888888', plate_number: 'د ح ر 5008', loyalty_stamps: 3, free_washes_earned: 0, notes: '', created_at: new Date().toISOString() },
      { id: 'c-509', name: 'حامد المطيري', phone: '0559999999', plate_number: 'ذ م ط 5009', loyalty_stamps: 0, free_washes_earned: 0, notes: '', created_at: new Date().toISOString() },
      { id: 'c-510', name: 'صلاح السبيعي', phone: '0550000000', plate_number: 'ر س ب 5100', loyalty_stamps: 2, free_washes_earned: 0, notes: '', created_at: new Date().toISOString() },
    ];
  }

  return DEMO_CUSTOMERS;
}

export const SAMPLE_CUSTOMERS: Customer[] = DEMO_CUSTOMERS;


export const SAMPLE_STAFF: Staff[] = [
  { id: 'stf-1', name: 'أحمد المالكي', role: 'owner', position: 'المالك ومدير النظام', phone: '0501234567', monthly_salary: 15000, hire_date: '2025-01-01', active: true, branch_id: 'br-1', pin_code: '1111' },
  { id: 'stf-2', name: 'عبد الله العتيبي', role: 'manager', position: 'مدير الفرع الرئيسي', phone: '0551112233', monthly_salary: 7500, hire_date: '2025-03-15', active: true, branch_id: 'br-1', pin_code: '2222' },
  { id: 'stf-3', name: 'محمد العلي', role: 'cashier', position: 'كاشير ومسؤول الاستقبال', phone: '0543334455', monthly_salary: 4500, hire_date: '2025-06-01', active: true, branch_id: 'br-1', pin_code: '3333' },
  { id: 'stf-4', name: 'عثمان إبراهيم', role: 'inventory', position: 'مشرف الجودة والمخزون', phone: '0567778899', monthly_salary: 5000, hire_date: '2025-05-10', active: true, branch_id: 'br-1', pin_code: '4444' },
  { id: 'stf-5', name: 'طارق محمود', role: 'accountant', position: 'المحاسب المالي', phone: '0512223344', monthly_salary: 6000, hire_date: '2025-04-01', active: true, branch_id: 'br-1', pin_code: '5555' },
  { id: 'stf-6', name: 'راجو كمار', role: 'worker', position: 'فني غسيل وتلميع', phone: '0589990011', monthly_salary: 2800, hire_date: '2025-07-20', active: true, branch_id: 'br-1', pin_code: '6666' },
];

export const SAMPLE_INVENTORY: InventoryItem[] = [
  { id: 'inv-1', name: 'شامبو غسيل سيارات مركز مع شمع', category: 'مواد الغسيل', unit: 'لتر', current_stock: 45, min_stock: 15, unit_cost: 25, supplier: 'شركة الموارد المتكاملة', yield_per_car: 0.15 },
  { id: 'inv-2', name: 'مناشف ميكروفايبر فائقة الامتصاص 40x40', category: 'أدوات ومعدات', unit: 'قطعة', current_stock: 120, min_stock: 30, unit_cost: 6, supplier: 'مؤسسة التجهيزات الحديثة', yield_per_car: null },
  { id: 'inv-3', name: 'واكس نانو سيراميك سائل لماد H9', category: 'مواد التلميع', unit: 'عبوة', current_stock: 3, min_stock: 5, unit_cost: 110, supplier: 'التلميع الساطع العالمية', yield_per_car: 0.05 },
  { id: 'inv-4', name: 'معطر جو برائحة العود والمطبخ الفاخر', category: 'مواد التشطيب', unit: 'عبوة', current_stock: 80, min_stock: 20, unit_cost: 8, supplier: 'العطور الفاخرة للسيارات', yield_per_car: 1 },
  { id: 'inv-5', name: 'ملمع إطارات وجلود أسود براق', category: 'مواد التشطيب', unit: 'لتر', current_stock: 28, min_stock: 10, unit_cost: 18, supplier: 'شركة الموارد المتكاملة', yield_per_car: 0.1 },
];

export const SAMPLE_SUBSCRIPTIONS: Subscription[] = [
  { id: 'sub-1', name: 'باقة غسيل شهرية كلاسيك', monthly_price: 299, price_monthly: 299, washes_included: 8, duration_days: 30, subscription_type: 'عدد غسلات + مدة', included_services: 'غسيل شامل وساطع VIP', description: 'تشمل 8 غسلات ساطعة خلال الشهر مع غسيل خارجي وداخلي', active: true },
  { id: 'sub-2', name: 'باقة VIP الذهبية الشاملة', monthly_price: 599, price_monthly: 599, washes_included: 15, duration_days: 30, subscription_type: 'عدد غسلات + مدة', included_services: 'غسيل شامل + واكس نانو سيراميك', description: 'غسيل غير محدود حتى 15 مرة + 2 واكس نانو سيراميك مجاناً', active: true },
  { id: 'sub-3', name: 'باقة الأساطيل والشركات', monthly_price: 1200, price_monthly: 1200, washes_included: 35, duration_days: 30, subscription_type: 'عدد غسلات + مدة', included_services: 'غسيل أسطول تجاري شامل', description: 'مخصصة لسيارات الشركات والأسطول التجاري', active: true },
];

export const SAMPLE_CUSTOMER_SUBSCRIPTIONS: CustomerSubscription[] = [
  { id: 'csub-1', customer_id: 'c-3', subscription_id: 'sub-1', package_name_snapshot: 'باقة غسيل شهرية كلاسيك', subscription_type: 'عدد غسلات + مدة', total_washes: 8, start_date: '2026-08-01', end_date: '2026-09-01', washes_used: 3, washes_remaining: 5, status: 'active', car_type: 'هوانداي سوناتا', car_color: 'أبيض', plate_number: 'ر ك م 9900', manual_price: 299, payment_method: 'card', included_services: 'غسيل شامل وساطع VIP' },
  { id: 'csub-2', customer_id: 'c-6', subscription_id: 'sub-3', package_name_snapshot: 'باقة الأساطيل والشركات', subscription_type: 'عدد غسلات + مدة', total_washes: 35, start_date: '2026-08-01', end_date: '2026-09-01', washes_used: 12, washes_remaining: 23, status: 'active', car_type: 'جمس يوكين', car_color: 'أسود', plate_number: 'ك و ب 1122', manual_price: 1200, payment_method: 'transfer', included_services: 'غسيل أسطول تجاري شامل' },
  { id: 'csub-3', customer_id: 'c-2', subscription_id: 'sub-2', package_name_snapshot: 'باقة VIP الذهبية الشاملة', subscription_type: 'عدد غسلات + مدة', total_washes: 15, start_date: '2026-08-01', end_date: '2026-09-01', washes_used: 3, washes_remaining: 12, status: 'active', car_type: 'تويوتا كامري', car_color: 'فضي', plate_number: 'ب ت ث 2222', manual_price: 599, payment_method: 'card', included_services: 'غسيل شامل + واكس نانو سيراميك' },
  { id: 'csub-4', customer_id: 'c-8', subscription_id: 'sub-1', package_name_snapshot: 'باقة غسيل شهرية كلاسيك', subscription_type: 'عدد غسلات + مدة', total_washes: 8, start_date: '2026-08-05', end_date: '2026-09-05', washes_used: 1, washes_remaining: 7, status: 'active', car_type: 'لكزس RX', car_color: 'كحلي', plate_number: 'د ذ ر 8888', manual_price: 299, payment_method: 'cash', included_services: 'غسيل شامل وساطع VIP' },
  { id: 'csub-5', customer_id: 'c-4', subscription_id: 'sub-2', package_name_snapshot: 'باقة VIP الذهبية الشاملة', subscription_type: 'عدد غسلات + مدة', total_washes: 15, start_date: '2026-08-02', end_date: '2026-09-02', washes_used: 1, washes_remaining: 14, status: 'active', car_type: 'نيسان باترول', car_color: 'رمادي', plate_number: 'ث ج ح 4444', manual_price: 599, payment_method: 'card', included_services: 'غسيل شامل + واكس نانو سيراميك' },
];

export const SAMPLE_SALES: Sale[] = [
  { id: 'INV-1001', customer_id: 'c-1', staff_id: 'stf-3', branch_id: 'br-1', subscription_id: null, customer_subscription_id: null, total: 75, cash_amount: 75, card_amount: 0, payment_method: 'cash', wash_count: 1, is_free: false, notes: 'غسيل شامل وساطع VIP + معطر جو فاخر', created_at: new Date(Date.now() - 3600000 * 2).toISOString(), refund_amount: 0, is_refund: false, refund_method: null, original_sale_id: null },
  { id: 'INV-1002', customer_id: 'c-2', staff_id: 'stf-3', branch_id: 'br-1', subscription_id: 'sub-2', customer_subscription_id: 'csub-3', total: 0, cash_amount: 0, card_amount: 0, payment_method: 'subscription', wash_count: 1, is_free: true, notes: 'غسيل VIP شامل مخصوم من رصيد باقة VIP الذهبية', created_at: new Date(Date.now() - 3600000 * 5).toISOString(), refund_amount: 0, is_refund: false, refund_method: null, original_sale_id: null },
  { id: 'INV-1003', customer_id: 'c-3', staff_id: 'stf-3', branch_id: 'br-1', subscription_id: 'sub-1', customer_subscription_id: 'csub-1', total: 0, cash_amount: 0, card_amount: 0, payment_method: 'subscription', wash_count: 1, is_free: true, notes: 'غسيل دوري مخصوم من الباقة الكلاسيكية', created_at: new Date(Date.now() - 3600000 * 24).toISOString(), refund_amount: 0, is_refund: false, refund_method: null, original_sale_id: null },
  { id: 'INV-1004', customer_id: 'c-4', staff_id: 'stf-3', branch_id: 'br-2', subscription_id: null, customer_subscription_id: null, total: 350, cash_amount: 0, card_amount: 350, payment_method: 'card', wash_count: 1, is_free: false, notes: 'تلميع ساطع نانو سيراميك + غسيل محرك بالبخار', created_at: new Date(Date.now() - 3600000 * 48).toISOString(), refund_amount: 0, is_refund: false, refund_method: null, original_sale_id: null },
  { id: 'INV-1005', customer_id: 'c-5', staff_id: 'stf-3', branch_id: 'br-1', subscription_id: null, customer_subscription_id: null, total: 180, cash_amount: 80, card_amount: 100, payment_method: 'split', wash_count: 1, is_free: false, notes: 'تنظيف وتلميع المراتب والجلد بالبخار', created_at: new Date(Date.now() - 3600000 * 72).toISOString(), refund_amount: 0, is_refund: false, refund_method: null, original_sale_id: null },
  { id: 'INV-1006', customer_id: 'c-6', staff_id: 'stf-3', branch_id: 'br-1', subscription_id: 'sub-3', customer_subscription_id: 'csub-2', total: 0, cash_amount: 0, card_amount: 0, payment_method: 'subscription', wash_count: 1, is_free: true, notes: 'غسيل شاحنة/جمس ضمن باقة الأساطيل والشركات', created_at: new Date(Date.now() - 3600000 * 96).toISOString(), refund_amount: 0, is_refund: false, refund_method: null, original_sale_id: null },
  { id: 'INV-1007', customer_id: 'c-8', staff_id: 'stf-3', branch_id: 'br-1', subscription_id: null, customer_subscription_id: null, total: 50, cash_amount: 50, card_amount: 0, payment_method: 'cash', wash_count: 1, is_free: false, notes: 'غسيل خارجي + تلميع إطارات وحماية مطاطية', created_at: new Date(Date.now() - 3600000 * 120).toISOString(), refund_amount: 0, is_refund: false, refund_method: null, original_sale_id: null },
];

export const SAMPLE_EXPENSES: Expense[] = [
  { id: 'exp-1', category: 'الإيجارات', expense_type: 'إيجار المقر', amount: 12500, expense_date: new Date(Date.now() - 3600000 * 24 * 10).toISOString().slice(0, 10), description: 'إيجار الفرع الرئيسي - الملقا', recurring: true, recurring_period: 'monthly' },
  { id: 'exp-2', category: 'المرافق', expense_type: 'كهرباء وماء', amount: 3400, expense_date: new Date(Date.now() - 3600000 * 24 * 5).toISOString().slice(0, 10), description: 'فاتورة شركة المياه والكهرباء', recurring: true, recurring_period: 'monthly' },
  { id: 'exp-3', category: 'الرواتب والأجور', expense_type: 'رواتب العمالة', amount: 18500, expense_date: new Date(Date.now() - 3600000 * 24 * 15).toISOString().slice(0, 10), description: 'رواتب طاقم المغسلة والعمالة', recurring: true, recurring_period: 'monthly' },
  { id: 'exp-4', category: 'الصيانة والتجهيز', expense_type: 'صيانة معدات', amount: 1200, expense_date: new Date(Date.now() - 3600000 * 24 * 3).toISOString().slice(0, 10), description: 'صيانة مضخة الضغط العالي وسخان البخار', recurring: false, recurring_period: null },
  { id: 'exp-5', category: 'التسويق والدعاية', expense_type: 'إعلانات رقمية', amount: 1500, expense_date: new Date(Date.now() - 3600000 * 24 * 8).toISOString().slice(0, 10), description: 'حملة إعلانات جوجل وتيك توك', recurring: false, recurring_period: null },
];

export const SAMPLE_PURCHASES: Purchase[] = [
  { id: 'pur-1', supplier: 'شركة الموارد المتكاملة', inventory_item_id: 'inv-1', item_name: 'شامبو غسيل سيارات مركز مع شمع', qty: 2, unit_cost: 500, total: 1000, category: 'مواد التشغيل', expense_type: 'مشتريات مخزون', purchase_date: new Date(Date.now() - 3600000 * 24 * 12).toISOString().slice(0, 10), notes: 'شحنة شهرية' },
  { id: 'pur-2', supplier: 'مؤسسة التجهيزات الحديثة', inventory_item_id: 'inv-2', item_name: 'مناشف ميكروفايبر فائقة الامتصاص', qty: 100, unit_cost: 6, total: 600, category: 'أدوات ومعدات', expense_type: 'مشتريات مخزون', purchase_date: new Date(Date.now() - 3600000 * 24 * 6).toISOString().slice(0, 10), notes: 'مناشف جديدة للتلميع' },
];

export const DEMO_USERS_LIST = [
  {
    role: 'owner' as const,
    clientCode: 'wwww1111',
    email: 'owner@wash.sa',
    name: 'أحمد المالكي',
    title: 'المالك ومدير النظام',
    badge: 'صلاحيات كاملة',
    color: 'bg-primary-600',
  },
  {
    role: 'accountant' as const,
    clientCode: 'wwww1111',
    email: 'accountant@wash.sa',
    name: 'طارق محمود',
    title: 'المحاسب المالي',
    badge: 'المالية والتقارير',
    color: 'bg-emerald-600',
  },
  {
    role: 'cashier' as const,
    clientCode: 'wwww1111',
    email: 'cashier@wash.sa',
    name: 'محمد العلي',
    title: 'كاشير ومسؤول نقاط البيع',
    badge: 'المبيعات والعملاء',
    color: 'bg-amber-600',
  },
  {
    role: 'inventory' as const,
    clientCode: 'wwww1111',
    email: 'inventory@wash.sa',
    name: 'عثمان إبراهيم',
    title: 'مسؤول المخزون والمشتريات',
    badge: 'المستودع والتوريد',
    color: 'bg-purple-600',
  },
];
