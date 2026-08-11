const fs = require('fs');
let content = fs.readFileSync('src/pages/SalesPage.tsx', 'utf8');

content = content.replace(
  /\s*\}\n\s*\}\n\s*\}\n\n\s*setShowInvoice\(true\);/,
  `
      }
    }

    setShowInvoice(true);`
);

fs.writeFileSync('src/pages/SalesPage.tsx', content);
