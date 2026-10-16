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
