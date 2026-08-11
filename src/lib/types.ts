export interface SubscriptionPlan {
  id: string;
  key: string;
  name: string;
  price_monthly: number;
  max_branches: number;
  max_staff: number;
  features: string[];
  sort_order: number;
  active: boolean;
}

export interface Organization {
  id: string;
  name: string;
  owner_id: string | null;
  subscription_plan_id: string | null;
  subscription_status: 'trialing' | 'active' | 'past_due' | 'canceled';
  trial_ends_at: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  organization_id: string;
  full_name: string | null;
  role: string;
}

export interface Settings {
  updated_at: string;
  organization_id?: string;
  id: string;
  company_name: string;
  logo_url: string | null;
  currency: string;
  daily_volume_target: number;
  working_days: number;
  avg_service_price?: number;
  loyalty_target?: number;
  loyalty_enabled?: boolean;
  phone: string | null;
  address: string | null;
  city: string | null;
  district: string | null;
  street: string | null;
  postal_code: string | null;
  building_number: string | null;
  vat_rate: number;
  created_at: string;
  vat_number: string | null;
  cr_number: string | null;
  brand_color: string;
  brand_accent: string;
  language: string;
  whatsapp_in_progress?: string;
  whatsapp_completed?: string;
  whatsapp_delivered?: string;
}

export interface Branch {
  id: string;
  name: string;
  location: string | null;
  phone: string | null;
  manager: string | null;
  active: boolean;
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  position: string | null;
  phone: string | null;
  monthly_salary: number;
  hire_date: string;
  active: boolean;
  branch_id: string | null;
  pin_code: string | null;
}

export interface Service {
  id: string;
  name: string;
  category: string;
  price: number;
  cost_estimate: number;
  duration_min: number;
  active: boolean;
}

export interface CustomerVehicle {
  id: string;
  plate_number: string;
  vehicle_type: string;
  vehicle_brand?: string;
  vehicle_model?: string;
  vehicle_color: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string | null;
  plate_number: string | null;
  vehicle_type?: string | null;
  vehicle_brand?: string | null;
  vehicle_model?: string | null;
  vehicle_color?: string | null;
  vehicles?: CustomerVehicle[];
  loyalty_stamps: number;
  free_washes_earned: number;
  total_visits?: number;
  notes: string | null;
  created_at: string;
}

export interface Subscription {
  id: string;
  name: string;
  monthly_price: number;
  price_monthly?: number;
  washes_included: number;
  duration_days?: number;
  subscription_type?: 'washes_count' | 'time_period' | 'washes_and_time' | string;
  vehicle_scope?: 'specific_vehicle' | 'all_vehicles' | string;
  included_services?: string;
  description: string | null;
  active: boolean;
  tenant_id?: string;
}

export interface CustomerSubscription {
  id: string;
  customer_id: string;
  subscription_id: string;
  tenant_id?: string;
  package_name_snapshot?: string;
  subscription_type?: string;
  vehicle_scope?: 'specific_vehicle' | 'all_vehicles' | string;
  vehicle_id?: string;
  start_date: string;
  end_date: string;
  washes_used: number;
  washes_remaining: number;
  total_washes?: number;
  status: string;
  car_type: string | null;
  car_color: string | null;
  plate_number: string | null;
  manual_price: number | null;
  payment_method?: string;
  invoice_id?: string;
  included_services?: string;
}

export interface Sale {
  id: string;
  customer_id: string | null;
  staff_id: string | null;
  branch_id: string | null;
  subscription_id: string | null;
  customer_subscription_id: string | null;
  total: number;
  cash_amount: number;
  card_amount: number;
  payment_method: string;
  wash_count: number;
  is_free: boolean;
  notes: string | null;
  created_at: string;
  refund_amount: number;
  is_refund: boolean;
  refund_method: string | null;
  original_sale_id: string | null;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  service_id: string | null;
  service_name: string;
  qty: number;
  price: number;
  line_total: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  current_stock: number;
  min_stock: number;
  unit_cost: number;
  supplier: string | null;
  yield_per_car: number | null;
}

export interface Purchase {
  id: string;
  supplier: string;
  inventory_item_id: string | null;
  item_name: string | null;
  qty: number;
  unit_cost: number;
  total: number;
  category: string;
  expense_type: string;
  purchase_date: string;
  notes: string | null;
}

export interface PurchaseInvoice {
  id: string;
  supplier: string;
  invoice_date: string;
  total: number;
  category: string;
  notes: string | null;
  created_at: string;
}

export interface PurchaseInvoiceItem {
  id: string;
  invoice_id: string;
  item_name: string;
  qty: number;
  unit_cost: number;
  line_total: number;
  yield_per_car: number;
  inventory_item_id: string | null;
}

export interface Expense {
  id: string;
  category: string;
  expense_type: string;
  amount: number;
  expense_date: string;
  description: string | null;
  recurring: boolean;
  recurring_period: string | null;
}

export interface Shift {
  id: string;
  staff_id: string | null;
  branch_id: string | null;
  shift_date: string;
  start_time: string | null;
  end_time: string | null;
  opening_cash: number;
  closing_cash: number;
  status: string;
  notes: string | null;
}

export interface ChartAccount {
  id: string;
  code: string;
  name: string;
  type: string;
  balance: number;
}

export interface JournalEntry {
  id: string;
  entry_date: string;
  account_code: string;
  account_name: string;
  debit: number;
  credit: number;
  description: string | null;
  reference: string | null;
}

export interface Template {
  id: string;
  name: string;
  type: string;
  content: string | null;
  created_at: string;
}

export interface CostConfig {
  id: string;
  rule_name: string;
  applies_to: string;
  period_days: number;
  weight: number;
  active: boolean;
}

export interface MobileVehicle {
  id: string;
  name: string;
  plate_number: string | null;
  driver_name: string | null;
  driver_phone: string | null;
  active: boolean;
}

export interface MobileService {
  id: string;
  name: string;
  price: number;
  duration_min: number;
  active: boolean;
}

export interface MobileSubscription {
  id: string;
  name: string;
  monthly_price: number;
  washes_included: number;
  active: boolean;
}

export interface MobileBooking {
  id: string;
  vehicle_id: string;
  service_id: string | null;
  customer_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  location: string | null;
  booking_date: string;
  start_hour: number;
  end_hour: number;
  status: string;
  price: number;
  notes: string | null;
}

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
