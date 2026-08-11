const fs = require('fs');
let content = fs.readFileSync('src/lib/types.ts', 'utf8');

// Remove duplicate vat_number and cr_number
content = content.replace(/loyalty_target\?: number;\n  loyalty_enabled\?: boolean;\n  cr_number\?: string;\n  vat_number\?: string;/, 'loyalty_target?: number;\n  loyalty_enabled?: boolean;');

fs.writeFileSync('src/lib/types.ts', content);
