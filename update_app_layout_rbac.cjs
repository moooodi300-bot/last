const fs = require('fs');

let appCode = fs.readFileSync('src/App.tsx', 'utf8');
appCode = appCode.replace(/canAccess\(role, active\)/g, "canAccess(role, active, organization?.id)");
appCode = appCode.replace(/canAccess\(role, effectiveKey\)/g, "canAccess(role, effectiveKey, organization?.id)");
fs.writeFileSync('src/App.tsx', appCode);

let layoutCode = fs.readFileSync('src/components/Layout.tsx', 'utf8');
layoutCode = layoutCode.replace(/canAccess\(role, m.key\)/g, "canAccess(role, m.key, organization?.id)");
layoutCode = layoutCode.replace(/roleLabel\(role, lang\)/g, "roleLabel(role, lang, organization?.id)");
fs.writeFileSync('src/components/Layout.tsx', layoutCode);
