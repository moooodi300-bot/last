import re

with open('src/pages/SalesPage.tsx', 'r') as f:
    content = f.read()

# Update newCust state
content = content.replace(
    "const [newCust, setNewCust] = useState({ name: '', phone: '', plate_number: '' });",
    "const [newCust, setNewCust] = useState({ name: '', phone: '', plate_number: '', vehicle_color: '', vehicle_type: '', vehicle_brand: '', vehicle_model: '' });"
)

# Update addQuickCustomer
add_cust_start = content.find("const addQuickCustomer = async () => {")
add_cust_end = content.find("setShowAddCust(false);", add_cust_start)
add_cust_replacement = """const addQuickCustomer = async () => {
    if (!newCust.name) return;
    const cust: Customer = {
      id: 'c-' + Date.now(),
      name: newCust.name,
      phone: newCust.phone || null,
      plate_number: newCust.plate_number || null,
      vehicle_color: newCust.vehicle_color || null,
      vehicle_type: newCust.vehicle_type || null,
      vehicle_brand: newCust.vehicle_brand || null,
      vehicle_model: newCust.vehicle_model || null,
      loyalty_stamps: 0,
      free_washes_earned: 0,
      total_visits: 0,
      notes: null,
      created_at: new Date().toISOString(),
    };
    try {
        saveLocalCustomer(cust);
    } catch(e) {}
    setCustomers((prev) => [cust, ...prev]);
    setCustomerId(cust.id);
    setNewCust({ name: '', phone: '', plate_number: '', vehicle_color: '', vehicle_type: '', vehicle_brand: '', vehicle_model: '' });
"""
content = content[:add_cust_start] + add_cust_replacement + content[add_cust_end:]

# Update the checkout function
# We will use string replace for specific parts

checkout_start = content.find('for (const item of cart) {')
checkout_end = content.find('} else if (isFree && loyaltyEnabled) {', checkout_start)

checkout_replacement = """for (const item of cart) {
        if (item.service.id.startsWith('sub_') && (item.service as any).original_sub) {
          const s = (item.service as any).original_sub;
          const endDate = new Date();
          endDate.setDate(endDate.getDate() + (s.durationDays || 30));
          const newCs = {
            id: 'cs_' + Date.now() + Math.random(),
            customer_id: customerId,
            subscription_id: s.id,
            start_date: new Date().toISOString().slice(0,10),
            end_date: endDate.toISOString().slice(0,10),
            washes_used: 0,
            washes_remaining: s.washes_included || s.washes || 0,
            status: 'active',
            car_type: selectedCustomer.vehicle_type || '',
            car_color: selectedCustomer.vehicle_color || '',
            plate_number: selectedCustomer.plate_number || '',
            manual_price: s.price,
          };
          try {
             const savedSub = saveTenantCustomerSubscription(newCs, currentTenantId);
             setCustSubs(prev => [...prev, savedSub]);
          } catch {}
        }
      }
      if (hasActiveSub && customerSub) {
        for(let w=0; w < cartWashes; w++) {
           consumeSubscriptionWash(customerSub.id, 'تم استهلاك من الكاشير - فاتورة: ' + finalSale.id, currentTenantId);
        }
        setLoyaltyMsg(tr('subscriptionDeducted', lang));
"""
content = content[:checkout_start] + checkout_replacement + content[checkout_end:]

with open('src/pages/SalesPage.tsx', 'w') as f:
    f.write(content)

