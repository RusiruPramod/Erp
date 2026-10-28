export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          role: 'admin' | 'member';
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          email: string;
          role?: 'admin' | 'member';
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string;
          role?: 'admin' | 'member';
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      customers: {
        Row: {
          id: string;
          name: string;
          company: string | null;
          phone: string;
          email: string | null;
          address: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          company?: string | null;
          phone: string;
          email?: string | null;
          address?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          company?: string | null;
          phone?: string;
          email?: string | null;
          address?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          name: string;
          customer_id: string;
          project_date: string;
          price: number;              // Client price = invoice total
          outsourcer_name: string | null;
          outsourcer_cost: number;    // What we pay outsourcer
          broker_name: string | null;
          broker_commission: number;  // What we pay broker
          status: 'active' | 'completed' | 'cancelled';
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          customer_id: string;
          project_date?: string;
          price?: number;
          outsourcer_name?: string | null;
          outsourcer_cost?: number;
          broker_name?: string | null;
          broker_commission?: number;
          status?: 'active' | 'completed' | 'cancelled';
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          customer_id?: string;
          project_date?: string;
          price?: number;
          outsourcer_name?: string | null;
          outsourcer_cost?: number;
          broker_name?: string | null;
          broker_commission?: number;
          status?: 'active' | 'completed' | 'cancelled';
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      project_members: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          user_id?: string;
          created_at?: string;
        };
      };
      income_payments: {
        Row: {
          id: string;
          project_id: string;
          payment_date: string;
          amount: number;
          note: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          payment_date?: string;
          amount: number;
          note?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          payment_date?: string;
          amount?: number;
          note?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      expenses: {
        Row: {
          id: string;
          project_id: string | null;
          expense_date: string;
          type: 'advertisement' | 'other';
          platform: 'Facebook' | 'Instagram' | 'Google' | 'TikTok' | 'YouTube' | 'Other' | null;
          category: string | null;
          description: string;
          amount: number;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id?: string | null;
          expense_date?: string;
          type?: 'advertisement' | 'other';
          platform?: 'Facebook' | 'Instagram' | 'Google' | 'TikTok' | 'YouTube' | 'Other' | null;
          category?: string | null;
          description: string;
          amount: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string | null;
          expense_date?: string;
          type?: 'advertisement' | 'other';
          platform?: 'Facebook' | 'Instagram' | 'Google' | 'TikTok' | 'YouTube' | 'Other' | null;
          category?: string | null;
          description?: string;
          amount?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      documents: {
        Row: {
          id: string;
          type: 'quotation' | 'invoice';
          number: string;
          project_id: string;
          customer_id: string;
          status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'partially_paid' | 'paid' | 'overdue';
          issue_date: string;
          due_date: string | null;
          discount: number;
          notes: string | null;
          total: number;
          share_token: string;
          pdf_path: string | null;
          sent_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          type: 'quotation' | 'invoice';
          number: string;
          project_id: string;
          customer_id: string;
          status?: 'draft' | 'sent' | 'accepted' | 'rejected' | 'partially_paid' | 'paid' | 'overdue';
          issue_date?: string;
          due_date?: string | null;
          discount?: number;
          notes?: string | null;
          total?: number;
          share_token?: string;
          pdf_path?: string | null;
          sent_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          type?: 'quotation' | 'invoice';
          number?: string;
          project_id?: string;
          customer_id?: string;
          status?: 'draft' | 'sent' | 'accepted' | 'rejected' | 'partially_paid' | 'paid' | 'overdue';
          issue_date?: string;
          due_date?: string | null;
          discount?: number;
          notes?: string | null;
          total?: number;
          share_token?: string;
          pdf_path?: string | null;
          sent_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      document_items: {
        Row: {
          id: string;
          document_id: string;
          position: number;
          task: string;
          description: string | null;
          hours: number | null;
          price: number;
          show_included: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          document_id: string;
          position?: number;
          task: string;
          description?: string | null;
          hours?: number | null;
          price?: number;
          show_included?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          document_id?: string;
          position?: number;
          task?: string;
          description?: string | null;
          hours?: number | null;
          price?: number;
          show_included?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      settings: {
        Row: {
          id: number;
          business_name: string;
          owner_name: string;
          mobile: string;
          email: string;
          address: string;
          logo_primary_color: string;
          logo_secondary_color: string;
          bank_account_name: string;
          bank_account_number: string;
          bank_name: string;
          bank_branch: string;
          default_invoice_notes: string;
          whatsapp_invoice_template: string;
          whatsapp_quotation_template: string;
          invoice_prefix: string;
          quotation_prefix: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          business_name?: string;
          owner_name?: string;
          mobile?: string;
          email?: string;
          address?: string;
          logo_primary_color?: string;
          logo_secondary_color?: string;
          bank_account_name?: string;
          bank_account_number?: string;
          bank_name?: string;
          bank_branch?: string;
          default_invoice_notes?: string;
          whatsapp_invoice_template?: string;
          whatsapp_quotation_template?: string;
          invoice_prefix?: string;
          quotation_prefix?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          business_name?: string;
          owner_name?: string;
          mobile?: string;
          email?: string;
          address?: string;
          logo_primary_color?: string;
          logo_secondary_color?: string;
          bank_account_name?: string;
          bank_account_number?: string;
          bank_name?: string;
          bank_branch?: string;
          default_invoice_notes?: string;
          whatsapp_invoice_template?: string;
          whatsapp_quotation_template?: string;
          invoice_prefix?: string;
          quotation_prefix?: string;
          updated_at?: string;
        };
      };
      counters: {
        Row: {
          id: string;
          doc_type: 'quotation' | 'invoice';
          year: number;
          last_number: number;
        };
        Insert: {
          id?: string;
          doc_type: 'quotation' | 'invoice';
          year: number;
          last_number?: number;
        };
        Update: {
          id?: string;
          doc_type?: 'quotation' | 'invoice';
          year?: number;
          last_number?: number;
        };
      };
      ad_campaigns: {
        Row: {
          id: string;
          campaign_code: string;
          name: string;
          fb_campaign_ref: string | null;
          start_date: string;
          end_date: string | null;
          status: 'running' | 'review' | 'closed';
          ad_spend_usd: number;
          exchange_rate: number;
          ad_spend_lkr: number;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          campaign_code: string;
          name: string;
          fb_campaign_ref?: string | null;
          start_date?: string;
          end_date?: string | null;
          status?: 'running' | 'review' | 'closed';
          ad_spend_usd?: number;
          exchange_rate?: number;
          ad_spend_lkr?: number;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          campaign_code?: string;
          name?: string;
          fb_campaign_ref?: string | null;
          start_date?: string;
          end_date?: string | null;
          status?: 'running' | 'review' | 'closed';
          ad_spend_usd?: number;
          exchange_rate?: number;
          ad_spend_lkr?: number;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      ad_campaign_orders: {
        Row: {
          id: string;
          campaign_id: string | null;
          order_number: string;
          order_name: string;
          customer_name: string | null;
          customer_phone: string | null;
          order_date: string;
          status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          campaign_id?: string | null;
          order_number: string;
          order_name: string;
          customer_name?: string | null;
          customer_phone?: string | null;
          order_date?: string;
          status?: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          campaign_id?: string | null;
          order_number?: string;
          order_name?: string;
          customer_name?: string | null;
          customer_phone?: string | null;
          order_date?: string;
          status?: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      ad_order_services: {
        Row: {
          id: string;
          order_id: string;
          position: number;
          service_name: string;
          supplier_type: 'in_house' | 'outsourced';
          supplier_cost: number | null;
          markup: number | null;
          client_price: number | null;
          is_financial_pending: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          position?: number;
          service_name: string;
          supplier_type?: 'in_house' | 'outsourced';
          supplier_cost?: number | null;
          markup?: number | null;
          client_price?: number | null;
          is_financial_pending?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          position?: number;
          service_name?: string;
          supplier_type?: 'in_house' | 'outsourced';
          supplier_cost?: number | null;
          markup?: number | null;
          client_price?: number | null;
          is_financial_pending?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      ad_campaign_expenses: {
        Row: {
          id: string;
          campaign_id: string;
          category: 'Packaging' | 'Delivery' | 'Material purchases' | 'Operational' | 'Other';
          description: string;
          expense_date: string;
          amount: number;
          currency: 'LKR' | 'USD';
          exchange_rate: number;
          amount_lkr: number;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          category?: 'Packaging' | 'Delivery' | 'Material purchases' | 'Operational' | 'Other';
          description: string;
          expense_date?: string;
          amount: number;
          currency?: 'LKR' | 'USD';
          exchange_rate?: number;
          amount_lkr?: number;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          category?: 'Packaging' | 'Delivery' | 'Material purchases' | 'Operational' | 'Other';
          description?: string;
          expense_date?: string;
          amount?: number;
          currency?: 'LKR' | 'USD';
          exchange_rate?: number;
          amount_lkr?: number;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      project_summary: {
        Row: {
          id: string;
          name: string;
          customer_id: string;
          customer_name: string | null;
          customer_company: string | null;
          customer_phone: string | null;
          project_date: string;
          income: number;
          total_paid: number;
          balance: number;
          total_expenses: number;
          net_profit: number;
          margin_pct: number;
          status: 'active' | 'completed' | 'cancelled';
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
      };
    };
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_active: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      has_project_access: {
        Args: { p_project_id: string };
        Returns: boolean;
      };
      next_document_number: {
        Args: { p_type: 'quotation' | 'invoice' };
        Returns: string;
      };
      dashboard_kpis: {
        Args: { from_date?: string | null; to_date?: string | null };
        Returns: {
          total_income: number;
          total_expenses: number;
          net_profit: number;
          outstanding_balance: number;
          active_projects_count: number;
        }[];
      };
      monthly_series: {
        Args: { from_date?: string | null; to_date?: string | null };
        Returns: {
          month_date: string;
          month_label: string;
          income: number;
          expenses: number;
          profit: number;
        }[];
      };
      ledger: {
        Args: { from_date?: string | null; to_date?: string | null };
        Returns: {
          id: string;
          entry_date: string;
          type: 'income' | 'expense';
          title: string;
          project_id: string | null;
          project_name: string | null;
          category_or_platform: string | null;
          amount: number;
          running_balance: number;
        }[];
      };
    };
  };
}
