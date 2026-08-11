const fs = require('fs');
let content = fs.readFileSync('src/pages/SalesPage.tsx', 'utf8');

content = content.replace(
  /const loyaltyTarget = getLoyaltyTarget\(settings\);/,
  `const loyaltyTarget = getLoyaltyTarget(settings);
  const loyaltyEnabled = settings?.loyalty_enabled !== false;`
);

// We need to bypass loyalty calculation if loyaltyEnabled is false
content = content.replace(
  /const isFreeWash = !hasActiveSub && selectedCustomer \? selectedCustomer\.loyalty_stamps >= loyaltyTarget : false;/,
  `const isFreeWash = loyaltyEnabled && !hasActiveSub && selectedCustomer ? selectedCustomer.loyalty_stamps >= loyaltyTarget : false;`
);

// We need to disable adding stamps if loyaltyEnabled is false
content = content.replace(
  /if \(isFree\) \{/g,
  `if (isFree && loyaltyEnabled) {`
);

content = content.replace(
  /\} else \{\n\s*const newStamps = \(selectedCustomer\.loyalty_stamps \|\| 0\) \+ cartWashes;/g,
  `} else if (loyaltyEnabled) {
        const newStamps = (selectedCustomer.loyalty_stamps || 0) + cartWashes;`
);

// Add fallback for when loyalty is disabled but sale goes through
content = content.replace(
  /\} else \{\n\s*setLoyaltyMsg\(\`تم تسجيل الغسلة بنجاح! رصيد الأختام الحالي: \$\{remStamps\}\/\$\{loyaltyTarget\}\ 🚗\`\);\n\s*\}/g,
  `} else {
          setLoyaltyMsg(\`تم تسجيل الغسلة بنجاح! رصيد الأختام الحالي: \${remStamps}/\${loyaltyTarget} 🚗\`);
        }
      } else {
        const newVisits = (selectedCustomer.total_visits || 0) + cartWashes;
        const updatedCust: Customer = {
          ...selectedCustomer,
          total_visits: newVisits,
        };
        saveLocalCustomer(updatedCust);
        setCustomers((prev) => prev.map((c) => (c.id === customerId ? updatedCust : c)));
        try {
          await supabase.from('customers').update({ total_visits: newVisits }).eq('id', customerId);
        } catch {}
        setLoyaltyMsg('تم تسجيل البيع بنجاح!');
      }`
);

fs.writeFileSync('src/pages/SalesPage.tsx', content);
