import re

with open('src/pages/SalesPage.tsx', 'r') as f:
    content = f.read()

# Modify the addCarSubscription function
start_func = content.find("const addCarSubscription = async () => {")
end_func = content.find("const endDate = subForm.end_date", start_func)
end_func = content.find("};", end_func) + 2

new_func = """const addCarSubscription = async () => {
    if (!customerId) {
        alert('الرجاء اختيار العميل أولاً');
        return;
    }
    const selectedPkg = subs.find(s => s.id === subForm.subscription_id);
    if (!selectedPkg) {
        alert('الرجاء اختيار الباقة');
        return;
    }
    const sPrice = selectedPkg.monthly_price || selectedPkg.price_monthly || 0;
    const sWashes = selectedPkg.washes_included || 0;
    
    // Create Sale
    const saleId = 'inv-' + Date.now();
    const finalSale = {
        id: saleId,
        customer_id: customerId,
        staff_id: staffId,
        branch_id: branches[0]?.id ?? null,
        customer_subscription_id: null,
        total: sPrice,
        cash_amount: paymentMethod === 'cash' ? sPrice : 0,
        card_amount: paymentMethod === 'card' ? sPrice : 0,
        payment_method: paymentMethod,
        wash_count: 0,
        is_free: false,
        notes: 'مبيعات اشتراك سيارة',
        is_refund: false,
        refund_amount: 0,
        refund_method: null,
        created_at: new Date().toISOString(),
        subscription_id: selectedPkg.id,
        original_sale_id: null,
    };
    
    const invoiceItems = [{
        sale_id: saleId,
        service_id: selectedPkg.id,
        service_name: selectedPkg.name,
        qty: 1,
        price: sPrice,
        line_total: sPrice,
    }];
    
    // Create Subscription
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30); // 30 days
    
    const newCs = {
        id: 'cs_' + Date.now() + Math.random(),
        customer_id: customerId,
        subscription_id: selectedPkg.id,
        start_date: new Date().toISOString().slice(0,10),
        end_date: endDate.toISOString().slice(0,10),
        washes_used: 0,
        washes_remaining: sWashes,
        status: 'active',
        car_type: selectedCustomer?.vehicle_type || subForm.car_type || '',
        car_color: selectedCustomer?.vehicle_color || subForm.car_color || '',
        plate_number: selectedCustomer?.plate_number || subForm.plate_number || '',
        manual_price: sPrice,
    };
    
    try {
        const savedSub = saveTenantCustomerSubscription(newCs, currentTenantId);
        setCustSubs(prev => [...prev, savedSub]);
    } catch {}
    
    setSales(prev => {
        const updated = [finalSale, ...prev];
        localStorage.setItem(`tenant_sales_${currentTenantId}`, JSON.stringify(updated));
        return updated as any;
    });
    
    alert('تم شراء الباقة وإنشاء الفاتورة وتفعيل الاشتراك بنجاح.');
    setSubForm({ subscription_id: '', manual_price: 0, car_type: '', car_color: '', plate_number: '', wash_limit: 0, start_date: new Date().toISOString().slice(0, 10), end_date: '' });
    setShowSubForm(false);
    
    try {
        if (selectedCustomer) {
            setLastSubInvoice({ customer: selectedCustomer, sub: { ...subForm, manual_price: sPrice, wash_limit: sWashes, end_date: newCs.end_date } });
            setShowSubInvoice(true);
        }
    } catch(e) {}
  };"""

content = content[:start_func] + new_func + content[end_func:]

with open('src/pages/SalesPage.tsx', 'w') as f:
    f.write(content)
