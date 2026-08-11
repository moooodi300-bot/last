import { Customer } from './types';
import { saveAllLocalProducts, ProductItem } from './productStore';

export function generateMockData(tenantId: string) {

  // Generate Staff
  
  const storedStaff = localStorage.getItem(`tenant_staff_${tenantId}`);
  if (!storedStaff) {
    const users = JSON.parse(localStorage.getItem('saas_users') || '[]');
    const owner = users.find(u => u.tenant_id === tenantId);
    
    // If it's a known demo tenant, populate full demo staff
    if (owner && owner.email && owner.email.includes('@test.com')) {
      const defaultStaff = [
        { id: `stf-1-${tenantId}`, name: owner.name + ' (المالك)', role: 'owner', position: 'المالك ومدير النظام', active: true, pin_code: '1111' },
        { id: `stf-2-${tenantId}`, name: 'محمد (مدير الفرع)', role: 'manager', position: 'مدير الفرع', active: true, pin_code: '2222' },
        { id: `stf-3-${tenantId}`, name: 'أحمد (كاشير)', role: 'cashier', position: 'كاشير ومسؤول الاستقبال', active: true, pin_code: '3333' },
        { id: `stf-4-${tenantId}`, name: 'خالد (محاسب)', role: 'accountant', position: 'محاسب مالي', active: true, pin_code: '4444' },
        { id: `stf-5-${tenantId}`, name: 'فيصل (مسؤول المخزون)', role: 'inventory', position: 'مشرف الجودة والمخزون', active: true, pin_code: '5555' }
      ];
      localStorage.setItem(`tenant_staff_${tenantId}`, JSON.stringify(defaultStaff));
    } else {
      // For real customers, only create their owner account with a default PIN (e.g. 0000)
      const ownerName = owner ? owner.name : 'المالك';
      const defaultStaff = [
        { id: `stf-1-${tenantId}`, name: ownerName, role: 'owner', position: 'المالك', active: true, pin_code: '0000' }
      ];
      localStorage.setItem(`tenant_staff_${tenantId}`, JSON.stringify(defaultStaff));
    }
  } else {

    // One-time update of existing mock data names
    let existingStaff = JSON.parse(storedStaff);
    let updated = false;
    existingStaff = existingStaff.map(s => {
      if (s.name === 'المالك / المدير') { updated = true; return { ...s, name: 'عبدالله (المالك)' }; }
      if (s.name === 'مدير الفرع') { updated = true; return { ...s, name: 'محمد (مدير الفرع)' }; }
      if (s.name === 'كاشير') { updated = true; return { ...s, name: 'أحمد (كاشير)' }; }
      if (s.name === 'محاسب') { updated = true; return { ...s, name: 'خالد (محاسب)' }; }
      if (s.name === 'مسؤول المخزون') { updated = true; return { ...s, name: 'فيصل (مسؤول المخزون)' }; }
      return s;
    });
    if (updated) {
      localStorage.setItem(`tenant_staff_${tenantId}`, JSON.stringify(existingStaff));
    }
  }

  
  // Generate Products & Services
  const keyProducts = `raqam_products_v2_${tenantId}`;
  const storedProducts = localStorage.getItem(keyProducts);
  let products: ProductItem[] = [];
  if (!storedProducts) {
    const users = JSON.parse(localStorage.getItem('saas_users') || '[]');
    const owner = users.find(u => u.tenant_id === tenantId);
    const isRealTenant = owner && owner.email && !owner.email.includes('@test.com');
    
    if (isRealTenant) {
      products = [
        { id: 'p1', name: 'غسيل خارجي صغير', category: 'services', price: 30, cost_estimate: 8, duration_min: 20, is_product: false, active: true },
        { id: 'p2', name: 'غسيل داخلي وخارجي صغير', category: 'services', price: 40, cost_estimate: 10, duration_min: 30, is_product: false, active: true },
        { id: 'p3', name: 'غسيل خارجي كبير', category: 'services', price: 40, cost_estimate: 10, duration_min: 25, is_product: false, active: true },
        { id: 'p4', name: 'غسيل داخلي وخارجي كبير', category: 'services', price: 50, cost_estimate: 12, duration_min: 35, is_product: false, active: true }
      ];
    } else {
      products = [
        { id: 'p1', name: 'غسيل خارجي صغير (تجريبي)', category: 'services', price: 30, cost_estimate: 8, duration_min: 20, is_product: false, active: true },
        { id: 'p2', name: 'غسيل داخلي وخارجي صغير (تجريبي)', category: 'services', price: 40, cost_estimate: 10, duration_min: 30, is_product: false, active: true },
        { id: 'p3', name: 'غسيل خارجي كبير (تجريبي)', category: 'services', price: 40, cost_estimate: 10, duration_min: 25, is_product: false, active: true },
        { id: 'p4', name: 'غسيل داخلي وخارجي كبير (تجريبي)', category: 'services', price: 50, cost_estimate: 12, duration_min: 35, is_product: false, active: true },
        { id: 'p5', name: 'تلميع ساطع (تجريبي)', category: 'services', price: 250, cost_estimate: 50, duration_min: 120, is_product: false, active: true },
        { id: 'p6', name: 'معطر سيارة (تجريبي)', category: 'products', price: 10, cost_estimate: 3, duration_min: 0, is_product: true, active: true },
        { id: 'p7', name: 'تلميع كفرات (تجريبي)', category: 'products', price: 15, cost_estimate: 5, duration_min: 0, is_product: true, active: true },
      ];
    }
    saveAllLocalProducts(products, tenantId);
  } else {
    products = JSON.parse(storedProducts);
  }


  // Generate Customers
  
  const isReal = () => {
    const users = JSON.parse(localStorage.getItem('saas_users') || '[]');
    const owner = users.find(u => u.tenant_id === tenantId);
    return owner && owner.email && !owner.email.includes('@test.com');
  };

  if (isReal()) return;

  const storedCustomers = localStorage.getItem(`tenant_customers_${tenantId}`);
  let customers: Customer[] = [];
  if (!storedCustomers) {
    customers = Array.from({ length: 50 }).map((_, i) => ({
      id: `c${i}`,
      organization_id: tenantId,
      name: `عميل تجريبي ${i + 1}`,
      phone: `05000000${i.toString().padStart(2, '0')}`,
      plate_number: `ا ب ج ${100 + i}`,
      vehicle_type: i % 2 === 0 ? 'سيدان' : 'SUV',
      vehicle_brand: i % 3 === 0 ? 'تويوتا' : 'هيونداي',
      vehicle_model: '2023',
      loyalty_stamps: Math.floor(Math.random() * 5),
      free_washes_earned: 0,
      total_visits: Math.floor(Math.random() * 10),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
    localStorage.setItem(`tenant_customers_${tenantId}`, JSON.stringify(customers));
  } else {
    customers = JSON.parse(storedCustomers);
  }

  // Generate Sales for the past 20 days
  const storedSales = localStorage.getItem(`tenant_sales_${tenantId}`);
  if (!storedSales) {
    const sales = [];
    const today = new Date();
    
    // Create between 10 to 30 sales per day for the last 20 days
    for (let dayOffset = 20; dayOffset >= 0; dayOffset--) {
      const date = new Date(today);
      date.setDate(date.getDate() - dayOffset);
      
      const salesCount = Math.floor(Math.random() * 20) + 10; // 10 to 30 sales per day
      
      for (let i = 0; i < salesCount; i++) {
        // Random time during the day (8 AM to 10 PM)
        const hour = Math.floor(Math.random() * 14) + 8;
        const minute = Math.floor(Math.random() * 60);
        date.setHours(hour, minute, 0, 0);

        const customer = customers[Math.floor(Math.random() * customers.length)];
        
        // Pick 1-3 random services/products
        const itemsCount = Math.floor(Math.random() * 3) + 1;
        const items = [];
        let total = 0;
        for (let j = 0; j < itemsCount; j++) {
            const product = products[Math.floor(Math.random() * products.length)];
            items.push({ ...product, qty: 1 });
            total += product.price;
        }

        sales.push({
          id: `INV-${date.getTime()}-${i}`,
          created_at: date.toISOString(),
          customer: customer,
          items: items,
          total: total,
          payment_method: Math.random() > 0.3 ? 'network' : 'cash', // 70% network, 30% cash
          tenantId: tenantId
        });
      }
    }
    
    // Sort by created_at descending
    sales.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    localStorage.setItem(`tenant_sales_${tenantId}`, JSON.stringify(sales));
  }

  // Generate 5 Purchase Invoices
  const storedPurchases = localStorage.getItem(`tenant_purchases_${tenantId}`);
  if (!storedPurchases) {
    const purchases = [];
    const today = new Date();
    const purchaseNames = ['شامبو سيارات تجريبي', 'مناديل ورقية تجريبية', 'مواد تلميع تجريبية', 'أكياس بلاستيك تجريبية', 'معطرات تجريبية'];
    
    for (let i = 0; i < 5; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - (i * 2)); // Spread out over the last 20 days
      
      purchases.push({
        id: `PUR-${date.getTime()}`,
        created_at: date.toISOString(),
        supplier_name: `مورد تجريبي ${i + 1}`,
        description: purchaseNames[i % purchaseNames.length],
        total: Math.floor(Math.random() * 1000) + 100, // 100 to 1100
        status: Math.random() > 0.2 ? 'paid' : 'pending',
        tenantId: tenantId
      });
    }
    localStorage.setItem(`tenant_purchases_${tenantId}`, JSON.stringify(purchases));
  }
}
