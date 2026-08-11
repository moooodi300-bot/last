const fs = require('fs');
let code = fs.readFileSync('src/lib/auth.tsx', 'utf8');

code = code.replace(
  /can: \(perm: Permission\) => rbacHasPermission\(role, perm\),/g,
  "can: (perm: Permission) => rbacHasPermission(role, perm, organization?.id),"
);

fs.writeFileSync('src/lib/auth.tsx', code);
