const fs = require('fs');
const file = 'src/lib/rbac.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /export function getRoles\(\): RoleDef\[\] \{/g,
  'export function getRoles(tenantId?: string): RoleDef[] {'
);

code = code.replace(
  /const customRoles = localStorage.getItem\(\`tenant_roles_\$\{tenantId \|\| "default"\}\`\);/g,
  'const customRoles = localStorage.getItem(`tenant_roles_${tenantId || "default"}`);'
);

code = code.replace(
  /export function saveRoles\(roles: RoleDef\[\]\) \{/g,
  'export function saveRoles(roles: RoleDef[], tenantId?: string) {'
);

code = code.replace(
  /localStorage.setItem\(\`tenant_roles_\$\{tenantId \|\| "default"\}\`, JSON.stringify\(customOnly\)\);/g,
  'localStorage.setItem(`tenant_roles_${tenantId || "default"}`, JSON.stringify(customOnly));'
);

code = code.replace(
  /export function hasPermission\(roleId: string, permission: Permission\): boolean \{/g,
  'export function hasPermission(roleId: string, permission: Permission, tenantId?: string): boolean {'
);

code = code.replace(
  /const role = getRoles\(\).find\(r => r.id === roleId\);/g,
  'const role = getRoles(tenantId).find(r => r.id === roleId);'
);

code = code.replace(
  /export function roleLabel\(role: string, lang: Lang\): string \{/g,
  'export function roleLabel(role: string, lang: Lang, tenantId?: string): string {'
);

code = code.replace(
  /const r = getRoles\(\).find\(x => x.id === role\);/g,
  'const r = getRoles(tenantId).find(x => x.id === role);'
);

code = code.replace(
  /export function canAccess\(role: string, key: ModuleKey\): boolean \{/g,
  'export function canAccess(role: string, key: ModuleKey, tenantId?: string): boolean {'
);

code = code.replace(
  /return hasPermission\(role, MODULE_PERMISSIONS\[key\]\);/g,
  'return hasPermission(role, MODULE_PERMISSIONS[key], tenantId);'
);

fs.writeFileSync(file, code);
