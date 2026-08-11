const fs = require('fs');
let code = fs.readFileSync('src/components/Layout.tsx', 'utf8');

code = code.replace(
  "{organization?.name && (",
  "{(settings?.company_name || organization?.name) && ("
);

code = code.replace(
  "{organization.name}",
  "{settings?.company_name || organization?.name}"
);

fs.writeFileSync('src/components/Layout.tsx', code);
