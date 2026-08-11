const fs = require('fs');
let code = fs.readFileSync('src/lib/mockDataGenerator.ts', 'utf8');

if (!code.includes('tenant_staff_')) {
  const staffLogic = `
  // Generate Staff
  const storedStaff = localStorage.getItem(\`tenant_staff_\${tenantId}\`);
  if (!storedStaff) {
    const defaultStaff = [
      { id: \`stf-1-\${tenantId}\`, name: 'المالك / المدير', role: 'owner', position: 'المالك ومدير النظام', active: true, pin_code: '1111' },
      { id: \`stf-2-\${tenantId}\`, name: 'مدير الفرع', role: 'manager', position: 'مدير الفرع', active: true, pin_code: '2222' },
      { id: \`stf-3-\${tenantId}\`, name: 'كاشير', role: 'cashier', position: 'كاشير ومسؤول الاستقبال', active: true, pin_code: '3333' },
      { id: \`stf-4-\${tenantId}\`, name: 'محاسب', role: 'accountant', position: 'محاسب مالي', active: true, pin_code: '4444' },
      { id: \`stf-5-\${tenantId}\`, name: 'مسؤول المخزون', role: 'inventory', position: 'مشرف الجودة والمخزون', active: true, pin_code: '5555' }
    ];
    localStorage.setItem(\`tenant_staff_\${tenantId}\`, JSON.stringify(defaultStaff));
  }
`;
  code = code.replace("export function generateMockData(tenantId: string) {\n", "export function generateMockData(tenantId: string) {\n" + staffLogic);
  fs.writeFileSync('src/lib/mockDataGenerator.ts', code);
}
