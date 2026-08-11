const fs = require('fs');

// 1. mockData update
let mockData = fs.readFileSync('src/lib/mockData.ts', 'utf8');

const tenCustomers = `export const DEMO_CUSTOMERS: Customer[] = [
  { id: 'c-1', name: 'أحمد صالح', phone: '0501111111', plate_number: 'أ ب ت 1111', loyalty_stamps: 0, free_washes_earned: 0, notes: '', created_at: new Date().toISOString() },
  { id: 'c-2', name: 'خالد عبدالله', phone: '0502222222', plate_number: 'ب ت ث 2222', loyalty_stamps: 2, free_washes_earned: 0, notes: '', created_at: new Date().toISOString() },
  { id: 'c-3', name: 'سارة محمد', phone: '0503333333', plate_number: 'ت ث ج 3333', loyalty_stamps: 4, free_washes_earned: 0, notes: '', created_at: new Date().toISOString() },
  { id: 'c-4', name: 'فهد عبدالعزيز', phone: '0504444444', plate_number: 'ث ج ح 4444', loyalty_stamps: 1, free_washes_earned: 0, notes: '', created_at: new Date().toISOString() },
  { id: 'c-5', name: 'نورة السالم', phone: '0505555555', plate_number: 'ج ح خ 5555', loyalty_stamps: 5, free_washes_earned: 0, notes: '', created_at: new Date().toISOString() },
  { id: 'c-6', name: 'ماجد الشمري', phone: '0506666666', plate_number: 'ح خ د 6666', loyalty_stamps: 0, free_washes_earned: 0, notes: '', created_at: new Date().toISOString() },
  { id: 'c-7', name: 'فيصل المطيري', phone: '0507777777', plate_number: 'خ د ذ 7777', loyalty_stamps: 3, free_washes_earned: 0, notes: '', created_at: new Date().toISOString() },
  { id: 'c-8', name: 'منى القحطاني', phone: '0508888888', plate_number: 'د ذ ر 8888', loyalty_stamps: 0, free_washes_earned: 0, notes: '', created_at: new Date().toISOString() },
  { id: 'c-9', name: 'سعود الدوسري', phone: '0509999999', plate_number: 'ذ ر ز 9999', loyalty_stamps: 6, free_washes_earned: 1, notes: '', created_at: new Date().toISOString() },
  { id: 'c-10', name: 'تركي العتيبي', phone: '0500000000', plate_number: 'ر ز س 1000', loyalty_stamps: 0, free_washes_earned: 0, notes: '', created_at: new Date().toISOString() },
];

export function getSampleCustomersForTenant(tenantId?: string): Customer[] {
  return DEMO_CUSTOMERS;
}

export const SAMPLE_CUSTOMERS: Customer[] = DEMO_CUSTOMERS;
`;

mockData = mockData.replace(/export const CLIENT_01_CUSTOMERS: Customer\[\] = \[[\s\S]*?export const SAMPLE_CUSTOMERS: Customer\[\] = CLIENT_01_CUSTOMERS;/g, tenCustomers);

fs.writeFileSync('src/lib/mockData.ts', mockData);

// 2. customerStore change key to clear old cache
let custStore = fs.readFileSync('src/lib/customerStore.ts', 'utf8');
custStore = custStore.replace(
  "return `raqam_custom_customers_${cleanId}`;",
  "return `raqam_custom_customers_v2_${cleanId}`;"
);
fs.writeFileSync('src/lib/customerStore.ts', custStore);

// 3. Remove accounts page
if (fs.existsSync('src/pages/AccountsPage.tsx')) {
  fs.unlinkSync('src/pages/AccountsPage.tsx');
}
