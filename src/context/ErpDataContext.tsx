import React, { createContext, useContext, useState, ReactNode } from 'react';
import {
  AdCampaign,
  AdCampaignOrder,
  AdCampaignExpense,
  AdOrderService,
  OrderStatus,
  CustomerPaymentStatus,
  SupplierPaymentStatus,
  LeadSource,
} from '../types';

export interface ErpContextType {
  orders: AdCampaignOrder[];
  campaigns: AdCampaign[];
  expenses: AdCampaignExpense[];
  exchangeRate: number;
  setExchangeRate: (rate: number) => void;
  // Order actions
  addOrder: (order: Omit<AdCampaignOrder, 'id' | 'created_at' | 'updated_at'>) => void;
  updateOrder: (id: string, updates: Partial<AdCampaignOrder>) => void;
  deleteOrder: (id: string) => void;
  addServiceToOrder: (orderId: string, service: Omit<AdOrderService, 'id' | 'order_id' | 'position'>) => void;
  deleteServiceFromOrder: (orderId: string, serviceId: string) => void;
  // Campaign actions
  addCampaign: (campaign: Omit<AdCampaign, 'id' | 'campaign_code' | 'created_at' | 'updated_at'>) => void;
  updateCampaign: (id: string, updates: Partial<AdCampaign>) => void;
  deleteCampaign: (id: string) => void;
  // Expense actions
  addExpense: (expense: Omit<AdCampaignExpense, 'id' | 'created_at' | 'updated_at'>) => void;
  updateExpense: (id: string, updates: Partial<AdCampaignExpense>) => void;
  deleteExpense: (id: string) => void;
  // Reset
  resetToDefaultSampleData: () => void;
}

// ----------------------------------------------------------------------------
// 1. HARDCODED SAMPLE CAMPAIGNS (1 Historical + 2 Current)
// ----------------------------------------------------------------------------
export const SAMPLE_CAMPAIGNS: AdCampaign[] = [
  {
    id: 'camp-hist',
    campaign_code: 'CAMP-HIST-001',
    name: 'Historical Ad Campaign ($3.45 + $4.46 + $0.28 + $1.77 + $0.28)',
    fb_campaign_ref: 'FB-HIST-ALL',
    platform: 'Facebook',
    start_date: '2026-09-01',
    end_date: '2026-09-26',
    status: 'archived',
    currency: 'USD',
    ad_spend_usd: 10.24,
    exchange_rate: 305.0,
    ad_spend_lkr: 3123.2,
    notes: 'Total historical ad expenses calculated into one single record ($10.24 USD).',
    historical_entries: [
      { id: 'h1', date: '2026-09-02', amount_usd: 3.45, amount_lkr: 1052.25, note: 'Historical Ad Session 1' },
      { id: 'h2', date: '2026-09-08', amount_usd: 4.46, amount_lkr: 1360.30, note: 'Historical Ad Session 2' },
      { id: 'h3', date: '2026-09-14', amount_usd: 0.28, amount_lkr: 85.40, note: 'Historical Ad Session 3' },
      { id: 'h4', date: '2026-09-20', amount_usd: 1.77, amount_lkr: 539.85, note: 'Historical Ad Session 4' },
      { id: 'h5', date: '2026-09-25', amount_usd: 0.28, amount_lkr: 85.40, note: 'Historical Ad Session 5' },
    ],
    created_at: '2026-09-01T10:00:00Z',
    updated_at: '2026-09-26T18:00:00Z',
  },
  {
    id: 'camp-run-1',
    campaign_code: 'CAMP-2026-001',
    name: 'Current Campaign 1: Smart Medicine Dispenser',
    fb_campaign_ref: 'FB-RUN-01',
    platform: 'Facebook',
    start_date: '2026-10-15',
    end_date: null,
    status: 'running',
    currency: 'USD',
    ad_spend_usd: 1.24,
    exchange_rate: 305.0,
    ad_spend_lkr: 378.2,
    notes: 'Active Facebook ad ($1.24 spent). Inquiries received for medical IoT prototype.',
    created_at: '2026-10-15T09:00:00Z',
    updated_at: '2026-10-20T09:00:00Z',
  },
  {
    id: 'camp-run-2',
    campaign_code: 'CAMP-2026-002',
    name: 'Current Campaign 2: Safety Helmet & Panel Hardware',
    fb_campaign_ref: 'FB-RUN-02',
    platform: 'Facebook',
    start_date: '2026-10-18',
    end_date: null,
    status: 'running',
    currency: 'USD',
    ad_spend_usd: 1.87,
    exchange_rate: 305.0,
    ad_spend_lkr: 570.35,
    notes: 'Active Facebook ad ($1.87 spent). Inquiries received for industrial safety hardware.',
    created_at: '2026-10-18T10:00:00Z',
    updated_at: '2026-10-22T11:00:00Z',
  },
];

// ----------------------------------------------------------------------------
// 2. HARDCODED SAMPLE ORDERS (Exact 3 Projects)
// ----------------------------------------------------------------------------
export const SAMPLE_ORDERS: AdCampaignOrder[] = [
  {
    id: 'ord-001',
    campaign_id: 'camp-run-1',
    order_number: 'ORD-2026-001',
    order_name: 'Smart Dispensing Drug Timer Medicine',
    customer_name: 'Dr. K. Perera',
    customer_phone: '0771234567',
    order_date: '2026-10-16',
    lead_source: 'Facebook Campaign',
    status: 'confirmed',
    payment_status: 'partially_paid',
    customer_paid_amount: 10000,
    supplier_payment_status: 'fully_paid',
    supplier_paid_amount: 6000,
    notes: 'Smart dispenser prototype with custom PCB fabrication and testing.',
    created_at: '2026-10-16T14:00:00Z',
    updated_at: '2026-10-16T14:00:00Z',
    services: [
      {
        id: 'svc-001-1',
        order_id: 'ord-001',
        position: 1,
        service_name: 'PCB Design',
        supplier_type: 'outsourced',
        supplier_cost: 4000,
        markup: 6000,
        client_price: 10000,
        is_financial_pending: false,
        supplier_payment_status: 'fully_paid',
        customer_payment_status: 'fully_paid',
        service_status: 'completed',
        notes: 'Circuit schematic & 2-layer PCB layout',
      },
      {
        id: 'svc-001-2',
        order_id: 'ord-001',
        position: 2,
        service_name: 'PCB Printing',
        supplier_type: 'outsourced',
        supplier_cost: 2000,
        markup: 1000,
        client_price: 3000,
        is_financial_pending: false,
        supplier_payment_status: 'fully_paid',
        customer_payment_status: 'unpaid',
        service_status: 'in_progress',
        notes: 'Board printing & solder mask batch',
      },
    ],
  },
  {
    id: 'ord-002',
    campaign_id: 'camp-run-2',
    order_number: 'ORD-2026-002',
    order_name: 'Safety Helmet',
    customer_name: 'Apex Construction',
    customer_phone: '0719876543',
    order_date: '2026-10-17',
    lead_source: 'Facebook Campaign',
    status: 'confirmed',
    payment_status: 'unpaid',
    customer_paid_amount: 0,
    supplier_payment_status: 'unpaid',
    supplier_paid_amount: 0,
    notes: 'Worker safety helmet IoT sensor node.',
    created_at: '2026-10-17T10:00:00Z',
    updated_at: '2026-10-17T10:00:00Z',
    services: [
      {
        id: 'svc-002-1',
        order_id: 'ord-002',
        position: 1,
        service_name: 'PCB Design',
        supplier_type: 'outsourced',
        supplier_cost: 4000,
        markup: 4000,
        client_price: 8000,
        is_financial_pending: false,
        supplier_payment_status: 'unpaid',
        customer_payment_status: 'unpaid',
        service_status: 'in_progress',
        notes: 'Compact accelerometer layout',
      },
      {
        id: 'svc-002-2',
        order_id: 'ord-002',
        position: 2,
        service_name: 'PCB Printing',
        supplier_type: 'outsourced',
        supplier_cost: 3600,
        markup: 1400,
        client_price: 5000,
        is_financial_pending: false,
        supplier_payment_status: 'unpaid',
        customer_payment_status: 'unpaid',
        service_status: 'pending',
        notes: 'Fast turnaround print batch',
      },
    ],
  },
  {
    id: 'ord-003',
    campaign_id: 'camp-run-2',
    order_number: 'ORD-2026-003',
    order_name: 'Safety Panel',
    customer_name: 'BuildTech Lanka',
    customer_phone: '0754433221',
    order_date: '2026-10-18',
    lead_source: 'Facebook Campaign',
    status: 'quotation_pending',
    payment_status: 'not_invoiced',
    customer_paid_amount: 0,
    supplier_payment_status: 'pending_cost_confirmation',
    supplier_paid_amount: 0,
    notes: 'Inquiry in progress. PCB printing quotation awaiting vendor response.',
    created_at: '2026-10-18T16:00:00Z',
    updated_at: '2026-10-18T16:00:00Z',
    services: [
      {
        id: 'svc-003-1',
        order_id: 'ord-003',
        position: 1,
        service_name: 'PCB Design',
        supplier_type: 'outsourced',
        supplier_cost: 4000,
        markup: 4000,
        client_price: 8000,
        is_financial_pending: false,
        supplier_payment_status: 'unpaid',
        customer_payment_status: 'not_invoiced',
        service_status: 'in_progress',
        notes: 'Approved quote for schematic design',
      },
      {
        id: 'svc-003-2',
        order_id: 'ord-003',
        position: 2,
        service_name: 'PCB Printing',
        supplier_type: 'outsourced',
        supplier_cost: null,
        markup: null,
        client_price: null,
        is_financial_pending: true,
        supplier_payment_status: 'pending_cost_confirmation',
        customer_payment_status: 'not_invoiced',
        service_status: 'pending',
        notes: 'Pending final dimensions and supplier quote',
      },
    ],
  },
];

// ----------------------------------------------------------------------------
// 3. HARDCODED SAMPLE EXPENSES (Delivery, Packaging, Internet/Reload)
// ----------------------------------------------------------------------------
export const SAMPLE_EXPENSES: AdCampaignExpense[] = [
  {
    id: 'exp-001',
    campaign_id: 'camp-run-1',
    order_id: 'ord-001',
    category: 'Packaging',
    description: 'Custom anti-static packaging boxes for prototypes',
    expense_date: '2026-10-17',
    amount: 850,
    currency: 'LKR',
    exchange_rate: 305,
    amount_lkr: 850,
    allocation_method: 'revenue_based',
    notes: 'Packaging boxes and bubble wrap',
    created_at: '2026-10-17T12:00:00Z',
    updated_at: '2026-10-17T12:00:00Z',
  },
  {
    id: 'exp-002',
    campaign_id: 'camp-run-1',
    order_id: 'ord-001',
    category: 'Delivery',
    description: 'Courier delivery fee for Smart Dispenser PCB batch',
    expense_date: '2026-10-18',
    amount: 650,
    currency: 'LKR',
    exchange_rate: 305,
    amount_lkr: 650,
    allocation_method: 'revenue_based',
    notes: 'Same-day courier dispatch',
    created_at: '2026-10-18T10:00:00Z',
    updated_at: '2026-10-18T10:00:00Z',
  },
  {
    id: 'exp-003',
    campaign_id: 'camp-run-2',
    order_id: null,
    category: 'Reload / Internet Expenses',
    description: 'Mobile data reload & WhatsApp business communications',
    expense_date: '2026-10-19',
    amount: 1000,
    currency: 'LKR',
    exchange_rate: 305,
    amount_lkr: 1000,
    allocation_method: 'equal',
    notes: 'Monthly communication reload',
    created_at: '2026-10-19T14:00:00Z',
    updated_at: '2026-10-19T14:00:00Z',
  },
];

const ErpContext = createContext<ErpContextType | undefined>(undefined);

export const ErpDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<AdCampaignOrder[]>(SAMPLE_ORDERS);
  const [campaigns, setCampaigns] = useState<AdCampaign[]>(SAMPLE_CAMPAIGNS);
  const [expenses, setExpenses] = useState<AdCampaignExpense[]>(SAMPLE_EXPENSES);
  const [exchangeRate, setExchangeRate] = useState<number>(305.0);

  // ORDER ACTIONS
  const addOrder = (orderData: Omit<AdCampaignOrder, 'id' | 'created_at' | 'updated_at'>) => {
    const newId = `ord-${Date.now()}`;
    const now = new Date().toISOString();
    const newOrder: AdCampaignOrder = {
      ...orderData,
      id: newId,
      created_at: now,
      updated_at: now,
    };
    setOrders(prev => [newOrder, ...prev]);
  };

  const updateOrder = (id: string, updates: Partial<AdCampaignOrder>) => {
    setOrders(prev =>
      prev.map(o => (o.id === id ? { ...o, ...updates, updated_at: new Date().toISOString() } : o))
    );
  };

  const deleteOrder = (id: string) => {
    setOrders(prev => prev.filter(o => o.id !== id));
  };

  const addServiceToOrder = (
    orderId: string,
    serviceData: Omit<AdOrderService, 'id' | 'order_id' | 'position'>
  ) => {
    setOrders(prev =>
      prev.map(o => {
        if (o.id !== orderId) return o;
        const newService: AdOrderService = {
          ...serviceData,
          id: `svc-${Date.now()}`,
          order_id: orderId,
          position: (o.services || []).length + 1,
        };
        return {
          ...o,
          services: [...(o.services || []), newService],
          updated_at: new Date().toISOString(),
        };
      })
    );
  };

  const deleteServiceFromOrder = (orderId: string, serviceId: string) => {
    setOrders(prev =>
      prev.map(o => {
        if (o.id !== orderId) return o;
        return {
          ...o,
          services: (o.services || []).filter(s => s.id !== serviceId),
          updated_at: new Date().toISOString(),
        };
      })
    );
  };

  // CAMPAIGN ACTIONS
  const addCampaign = (campaignData: Omit<AdCampaign, 'id' | 'campaign_code' | 'created_at' | 'updated_at'>) => {
    const newId = `camp-${Date.now()}`;
    const code = `CAMP-2026-${String(campaigns.length + 1).padStart(3, '0')}`;
    const now = new Date().toISOString();
    const newCamp: AdCampaign = {
      ...campaignData,
      id: newId,
      campaign_code: code,
      created_at: now,
      updated_at: now,
    };
    setCampaigns(prev => [newCamp, ...prev]);
  };

  const updateCampaign = (id: string, updates: Partial<AdCampaign>) => {
    setCampaigns(prev =>
      prev.map(c => (c.id === id ? { ...c, ...updates, updated_at: new Date().toISOString() } : c))
    );
  };

  const deleteCampaign = (id: string) => {
    setCampaigns(prev => prev.filter(c => c.id !== id));
    // Also decouple orders
    setOrders(prev => prev.map(o => (o.campaign_id === id ? { ...o, campaign_id: null } : o)));
  };

  // EXPENSE ACTIONS
  const addExpense = (expenseData: Omit<AdCampaignExpense, 'id' | 'created_at' | 'updated_at'>) => {
    const newId = `exp-${Date.now()}`;
    const now = new Date().toISOString();
    const newExp: AdCampaignExpense = {
      ...expenseData,
      id: newId,
      created_at: now,
      updated_at: now,
    };
    setExpenses(prev => [newExp, ...prev]);
  };

  const updateExpense = (id: string, updates: Partial<AdCampaignExpense>) => {
    setExpenses(prev =>
      prev.map(e => (e.id === id ? { ...e, ...updates, updated_at: new Date().toISOString() } : e))
    );
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  // RESET
  const resetToDefaultSampleData = () => {
    setOrders(SAMPLE_ORDERS);
    setCampaigns(SAMPLE_CAMPAIGNS);
    setExpenses(SAMPLE_EXPENSES);
    setExchangeRate(305.0);
  };

  return (
    <ErpContext.Provider
      value={{
        orders,
        campaigns,
        expenses,
        exchangeRate,
        setExchangeRate,
        addOrder,
        updateOrder,
        deleteOrder,
        addServiceToOrder,
        deleteServiceFromOrder,
        addCampaign,
        updateCampaign,
        deleteCampaign,
        addExpense,
        updateExpense,
        deleteExpense,
        resetToDefaultSampleData,
      }}
    >
      {children}
    </ErpContext.Provider>
  );
};

export function useErpData(): ErpContextType {
  const context = useContext(ErpContext);
  if (!context) {
    throw new Error('useErpData must be used within an ErpDataProvider');
  }
  return context;
}

