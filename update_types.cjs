const fs = require('fs');
let code = fs.readFileSync('src/lib/types.ts', 'utf8');
const discountCodeType = `
export interface DiscountCode {
  id: string;
  code: string;
  description: string;
  type: 'percentage' | 'fixed';
  value: number;
  start_date: string;
  end_date: string;
  max_uses: number;
  uses_count: number;
  is_active: boolean;
  min_invoice_amount?: number;
  max_discount_amount?: number;
}
`;
if (!code.includes('DiscountCode')) {
  code += discountCodeType;
  fs.writeFileSync('src/lib/types.ts', code);
}
