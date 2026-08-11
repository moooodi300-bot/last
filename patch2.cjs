const fs = require('fs');
let code = fs.readFileSync('src/pages/SalesPage.tsx', 'utf8');

const oldCode = `    if (customerId && selectedCustomer) {
      if (hasActiveSub && customerSub) {`;

const newCode = `    if (customerId && selectedCustomer) {
      for (const item of cart) {
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
            washes_remaining: s.washes || 0,
            status: 'active',
            car_type: selectedCustomer.car_type || '',
            car_color: selectedCustomer.car_color || '',
            plate_number: selectedCustomer.plate_number || '',
            manual_price: s.price,
          };
          try {
             await supabase.from('customer_subscriptions').insert(newCs);
          } catch {}
          setCustSubs(prev => [...prev, newCs as any]);
        }
      }

      if (hasActiveSub && customerSub) {`;

code = code.replace(oldCode, newCode);
fs.writeFileSync('src/pages/SalesPage.tsx', code);
