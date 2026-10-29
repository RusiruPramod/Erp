import { Database } from './database.types';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Customer = Database['public']['Tables']['customers']['Row'];
export type Project = Database['public']['Tables']['projects']['Row'];
export type ProjectMember = Database['public']['Tables']['project_members']['Row'];
export type IncomePayment = Database['public']['Tables']['income_payments']['Row'];
export type Expense = Database['public']['Tables']['expenses']['Row'];
export type Document = Database['public']['Tables']['documents']['Row'];
export type DocumentItem = Database['public']['Tables']['document_items']['Row'];
export type Settings = Database['public']['Tables']['settings']['Row'];
export type ProjectSummary = Database['public']['Views']['project_summary']['Row'];

export type Role = 'admin' | 'member';
export type ProjectStatus = 'active' | 'completed' | 'cancelled';
export type ExpenseType = 'advertisement' | 'other';
export type AdPlatform = 'Facebook' | 'Instagram' | 'Google' | 'TikTok' | 'YouTube' | 'Other';
export type DocumentType = 'quotation' | 'invoice';
export type DocumentStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'partially_paid' | 'paid' | 'overdue';

export interface DashboardKpisData {
  total_income: number;
  total_expenses: number;
  net_profit: number;
  outstanding_balance: number;
  active_projects_count: number;
}

export interface MonthlyChartData {
  month_date: string;
  month_label: string;
  income: number;
  expenses: number;
  profit: number;
}

export interface LedgerItem {
  id: string;
  entry_date: string;
  type: 'income' | 'expense';
  title: string;
  project_id: string | null;
  project_name: string | null;
  category_or_platform: string | null;
  amount: number;
  running_balance: number;
}

export interface DocumentWithDetails extends Document {
  customer?: Customer;
  project?: Project;
  items: DocumentItem[];
}

// ============================================================================
// AD CAMPAIGN LEDGER & PROFIT TRACKER MODULE TYPES
// ============================================================================

export type CampaignStatus =
  | 'planned'
  | 'running'
  | 'waiting_for_orders'
  | 'review'
  | 'closed'
  | 'archived';

export type OrderStatus =
  | 'new'
  | 'quotation_pending'
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'waiting_for_supplier'
  | 'quality_check'
  | 'ready_for_delivery'
  | 'completed'
  | 'cancelled';

export type CustomerPaymentStatus =
  | 'not_invoiced'
  | 'unpaid'
  | 'partially_paid'
  | 'fully_paid'
  | 'refunded';

export type SupplierPaymentStatus =
  | 'pending_cost_confirmation'
  | 'unpaid'
  | 'partially_paid'
  | 'fully_paid';

export type LeadSource =
  | 'Facebook Campaign'
  | 'Direct Message'
  | 'Friend / Referral'
  | 'Existing Customer'
  | 'Manual Entry'
  | 'Other';

export type SupplierType = 'in_house' | 'outsourced';

export type AdExpenseCategory =
  | 'Packaging'
  | 'Delivery'
  | 'Material purchases'
  | 'Reload / Internet Expenses'
  | 'Additional Outsourcing'
  | 'Operational'
  | 'Other';

export type ExpenseAllocationMethod = 'equal' | 'revenue_based' | 'manual';

export interface AdOrderService {
  id: string;
  order_id: string;
  position: number;
  service_name: string;
  supplier_type: SupplierType;
  supplier_cost: number | null;
  markup: number | null;
  client_price: number | null;
  is_financial_pending: boolean;
  supplier_payment_status?: SupplierPaymentStatus;
  customer_payment_status?: CustomerPaymentStatus;
  service_status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string | null;
}

export interface AdCampaignOrder {
  id: string;
  campaign_id: string | null;
  order_number: string;
  order_name: string;
  customer_name: string | null;
  customer_phone: string | null;
  order_date: string;
  lead_source?: LeadSource;
  status: OrderStatus;
  payment_status?: CustomerPaymentStatus;
  customer_paid_amount?: number;
  supplier_payment_status?: SupplierPaymentStatus;
  supplier_paid_amount?: number;
  manual_allocated_ad_spend?: number | null;
  notes: string | null;
  services: AdOrderService[];
  created_at: string;
  updated_at: string;
}

export interface AdCampaignExpense {
  id: string;
  campaign_id: string | null;
  order_id?: string | null;
  category: AdExpenseCategory;
  description: string;
  expense_date: string;
  amount: number;
  currency: 'LKR' | 'USD';
  exchange_rate: number;
  amount_lkr: number;
  allocation_method?: ExpenseAllocationMethod;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface HistoricalAdSpendEntry {
  id: string;
  date: string;
  amount_usd: number;
  amount_lkr: number;
  note?: string;
}

export interface AdCampaignAuditEntry {
  timestamp: string;
  action: string;
  details: string;
}

export interface AdCampaign {
  id: string;
  campaign_code: string;
  name: string;
  fb_campaign_ref: string | null;
  platform?: 'Facebook' | 'Other' | string;
  start_date: string;
  end_date: string | null;
  status: CampaignStatus;
  currency?: 'USD' | 'LKR';
  ad_spend_usd: number;
  exchange_rate: number;
  ad_spend_lkr: number;
  allocation_method?: ExpenseAllocationMethod;
  notes: string | null;
  audit_trail?: AdCampaignAuditEntry[];
  historical_entries?: HistoricalAdSpendEntry[];
  created_at: string;
  updated_at: string;
}

export interface OrderFinancialSummary {
  revenue: number;
  supplier_costs: number;
  gross_profit: number;
  allocated_ad_spend: number;
  net_contribution: number;
  customer_paid_amount: number;
  customer_balance: number;
  supplier_paid_amount: number;
  supplier_balance: number;
  realized_profit: number;
  has_incomplete_financials: boolean;
  is_confirmed: boolean;
}

export interface CampaignFinancialSummary {
  campaign_id: string;
  confirmed_orders_count: number;
  pending_orders_count: number;
  total_revenue: number;
  total_supplier_costs: number;
  gross_profit: number;
  realized_gross_profit: number;
  ad_spend_usd: number;
  ad_spend_lkr: number;
  other_expenses_lkr: number;
  total_allocated_ad_spend: number;
  unallocated_ad_spend: number;
  net_profit: number;
  pending_order_value: number;
  pending_supplier_cost: number;
  outstanding_customer_payments: number;
  outstanding_supplier_payables: number;
  has_incomplete_financials: boolean;
}

export interface LedgerOverallMetrics {
  total_ad_spend_usd: number;
  total_ad_spend_lkr: number;
  total_confirmed_revenue: number;
  total_supplier_costs: number;
  gross_profit: number;
  total_expected_profit: number;
  total_realized_profit: number;
  pending_customer_payments: number;
  pending_supplier_costs: number;
  other_expenses_lkr: number;
  net_profit: number;
  total_campaigns_count: number;
  running_campaigns_count: number;
  closed_campaigns_count: number;
  has_incomplete_records: boolean;
}
