import { supabase } from './supabase';

export async function checkAndSeedDemoData(organizationId: string) {
  try {
    // Check customers
    const { count: customersCount } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });
      
    if (customersCount !== null && customersCount < 10) {
      const customersToInsert = Array.from({ length: 10 - customersCount }).map((_, i) => ({
        name: `عميل تجريبي ${i + 1 + customersCount}`,
        phone: `055500000${i + 1 + customersCount}`,
        loyalty_stamps: Math.floor(Math.random() * 5),
      }));
      await supabase.from('customers').insert(customersToInsert);
    }

    // Check services
    const { count: servicesCount } = await supabase
      .from('services')
      .select('*', { count: 'exact', head: true });
      
    if (servicesCount !== null && servicesCount < 10) {
      const servicesToInsert = Array.from({ length: 10 - servicesCount }).map((_, i) => ({
        name: `خدمة غسيل ${i + 1 + servicesCount}`,
        price: 35 + (i * 5),
        duration_min: 15 + (i * 5),
        active: true
      }));
      await supabase.from('services').insert(servicesToInsert);
    }

    // Check purchases
    const { count: purchasesCount } = await supabase
      .from('purchases')
      .select('*', { count: 'exact', head: true });
      
    if (purchasesCount !== null && purchasesCount < 10) {
      const purchasesToInsert = Array.from({ length: 10 - purchasesCount }).map((_, i) => ({
        supplier_name: `مورد تجريبي ${i + 1 + purchasesCount}`,
        invoice_number: `INV-${1000 + i}`,
        total_amount: 150 + (i * 50),
        tax_amount: 22.5,
        purchase_date: new Date().toISOString().split('T')[0],
      }));
      await supabase.from('purchases').insert(purchasesToInsert);
    }

    // Check expenses
    const { count: expensesCount } = await supabase
      .from('expenses')
      .select('*', { count: 'exact', head: true });
      
    if (expensesCount !== null && expensesCount < 10) {
      const expensesToInsert = Array.from({ length: 10 - expensesCount }).map((_, i) => ({
        expense_type: `مصروف تجريبي ${i + 1 + expensesCount}`,
        amount: 100 + (i * 20),
        expense_date: new Date().toISOString().split('T')[0],
        description: 'مصروفات تشغيلية',
      }));
      await supabase.from('expenses').insert(expensesToInsert);
    }

    // Check sales
    // Note: Sales might require customer_id and staff_id, but if they are nullable it's fine.
    const { count: salesCount } = await supabase
      .from('sales')
      .select('*', { count: 'exact', head: true });
      
    if (salesCount !== null && salesCount < 10) {
      const salesToInsert = Array.from({ length: 10 - salesCount }).map((_, i) => ({
        total: 50 + (i * 10),
        cash_amount: 50 + (i * 10),
        payment_method: 'cash',
        notes: 'عملية بيع تجريبية'
      }));
      await supabase.from('sales').insert(salesToInsert);
    }

  } catch (error) {
    console.error('Error seeding demo data:', error);
  }
}
