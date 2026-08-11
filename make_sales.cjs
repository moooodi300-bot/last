const fs = require('fs');

let jc = fs.readFileSync('src/pages/JobCardsPage.tsx', 'utf8');

const saveSaleCodeJC = `
        // Save as a unified sale
        const savedSales = localStorage.getItem(\`tenant_sales_\${currentTenantId}\`);
        const sales = savedSales ? JSON.parse(savedSales) : [];
        
        const saleItems = (viewCard.services || []).map((s: any) => ({
          item_id: s.id,
          name: s.name,
          qty: 1,
          price: s.price,
          total: s.price,
          type: 'service'
        }));
        
        sales.push({
          id: \`sale-\${Date.now()}\`,
          created_at: new Date().toISOString(),
          total: cardTotal,
          subtotal: cardTotal,
          tax: 0,
          payment_method: paymentMethod,
          items: saleItems,
          customer_id: '',
          customer_name: viewCard.customerName,
          source: 'job_card'
        });
        localStorage.setItem(\`tenant_sales_\${currentTenantId}\`, JSON.stringify(sales));
`;

jc = jc.replace(
  `localStorage.setItem('accounts_transactions', JSON.stringify(transactions));`,
  `localStorage.setItem('accounts_transactions', JSON.stringify(transactions));` + '\n' + saveSaleCodeJC
);

fs.writeFileSync('src/pages/JobCardsPage.tsx', jc);

let mob = fs.readFileSync('src/pages/MobilePage.tsx', 'utf8');

const saveSaleCodeMob = `
      // Save as a unified sale
      const savedSales = localStorage.getItem(\`tenant_sales_\${currentTenantId}\`);
      const sales = savedSales ? JSON.parse(savedSales) : [];
      
      const app = appointments.find(a => a.id === id);
      const amount = 150;
      sales.push({
        id: \`sale-\${Date.now()}\`,
        created_at: new Date().toISOString(),
        total: amount,
        subtotal: amount,
        tax: 0,
        payment_method: paymentMethod,
        items: [{
          item_id: 'mobile-wash',
          name: app?.service || 'غسيل متنقل',
          qty: 1,
          price: amount,
          total: amount,
          type: 'service'
        }],
        customer_id: '',
        customer_name: app?.customerName || '',
        source: 'mobile_pos'
      });
      localStorage.setItem(\`tenant_sales_\${currentTenantId}\`, JSON.stringify(sales));
`;

mob = mob.replace(
  `localStorage.setItem('accounts_transactions', JSON.stringify(transactions));`,
  `localStorage.setItem('accounts_transactions', JSON.stringify(transactions));` + '\n' + saveSaleCodeMob
);

fs.writeFileSync('src/pages/MobilePage.tsx', mob);

