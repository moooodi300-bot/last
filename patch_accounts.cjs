const fs = require('fs');

let code = fs.readFileSync('src/pages/AccountsPage.tsx', 'utf8');

code = code.replace(
  /const \[transactions\] = useState<Transaction\[\]>\(\[[\s\S]*?\]\);/,
  `const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('accounts_transactions');
      if (saved) {
        setTransactions(JSON.parse(saved));
      } else {
        setTransactions([
          { id: '1', date: '2026-08-01 14:30', description: 'إيراد غسيل - كرت JC-1001', type: 'in', paymentMethod: 'pos', amount: 150 },
          { id: '2', date: '2026-08-01 15:00', description: 'إيراد غسيل - كرت JC-1002', type: 'in', paymentMethod: 'cash', amount: 350 },
          { id: '3', date: '2026-08-01 10:00', description: 'مشتريات مواد تنظيف (فاتورة 1)', type: 'out', paymentMethod: 'transfer', amount: 450 }
        ]);
      }
    } catch(e) {}
  }, []);`
);

// We need to add useEffect import if it's missing.
if (!code.includes('useEffect')) {
  code = code.replace(/import \{ useState \} from 'react';/, "import { useState, useEffect } from 'react';");
}

fs.writeFileSync('src/pages/AccountsPage.tsx', code);
