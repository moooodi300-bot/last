const fs = require('fs');
let code = fs.readFileSync('src/lib/mockDataGenerator.ts', 'utf8');

const updateLogic = `
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
      localStorage.setItem(\`tenant_staff_\${tenantId}\`, JSON.stringify(existingStaff));
    }
  }
`;

code = code.replace("    localStorage.setItem(`tenant_staff_${tenantId}`, JSON.stringify(defaultStaff));\n  }", "    localStorage.setItem(`tenant_staff_${tenantId}`, JSON.stringify(defaultStaff));\n  }" + updateLogic);
fs.writeFileSync('src/lib/mockDataGenerator.ts', code);
