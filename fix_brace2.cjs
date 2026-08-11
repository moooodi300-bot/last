const fs = require('fs');
let code = fs.readFileSync('src/pages/DashboardPage.tsx', 'utf8');

code = code.replace(
  "            }\n          }\n        }\n        // 2. Additional Recorded Costs (from accounts_transactions)",
  "            }\n          }\n        // 2. Additional Recorded Costs (from accounts_transactions)"
);

fs.writeFileSync('src/pages/DashboardPage.tsx', code);
