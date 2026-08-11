const fs = require('fs');
let code = fs.readFileSync('src/pages/SalesPage.tsx', 'utf8');

const oldCode = `    const loadedCS = (cs.data as CustomerSubscription[]) ?? [];

    setServices(loadedSv.length > 0 ? loadedSv : SAMPLE_SERVICES);`;

const newCode = `    const loadedCS = (cs.data as CustomerSubscription[]) ?? [];

    const mappedSubs = finalSubs.map((s: any) => ({
      id: \`sub_\${s.id}\`,
      name: \`اشتراك - \${s.name}\`,
      category: 'اشتراكات',
      price: s.price,
      cost_estimate: 0,
      duration_min: 0,
      active: true,
      original_sub: s
    }));

    const allServices = [...(loadedSv.length > 0 ? loadedSv : SAMPLE_SERVICES), ...mappedSubs];
    setServices(allServices as any);`;

code = code.replace(oldCode, newCode);
fs.writeFileSync('src/pages/SalesPage.tsx', code);
