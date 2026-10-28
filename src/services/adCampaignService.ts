import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  AdCampaign,
  AdCampaignOrder,
  AdCampaignExpense,
  AdOrderService,
  CampaignStatus,
  OrderStatus,
} from '../types';

const STORAGE_KEY_CAMPAIGNS = 'codecrew_ad_campaigns_v5';
const STORAGE_KEY_ORDERS = 'codecrew_ad_orders_v5';
const STORAGE_KEY_EXPENSES = 'codecrew_ad_expenses_v5';

// Purge obsolete legacy mock data caches so browser displays only user's exact data
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    ['v1', 'v2', 'v3', 'v4'].forEach(v => {
      localStorage.removeItem(`codecrew_ad_campaigns_${v}`);
      localStorage.removeItem(`codecrew_ad_orders_${v}`);
      localStorage.removeItem(`codecrew_ad_expenses_${v}`);
    });
  } catch (_) {}
}

// Seed ONLY the exact records specified in user's prompt
export const INITIAL_SAMPLE_CAMPAIGNS: AdCampaign[] = [
  {
    id: 'camp-hist-total',
    campaign_code: 'CAMP-HIST-TOTAL',
    name: 'Historical Ad Campaign ($3.45 + $4.46 + $0.28 + $1.77 + $0.28)',
    fb_campaign_ref: 'FB-HIST-ALL',
    start_date: '2026-09-01',
    end_date: '2026-09-26',
    status: 'closed',
    ad_spend_usd: 10.24,
    exchange_rate: 305.0,
    ad_spend_lkr: 3123.2,
    notes: 'Total historical ad expenses calculated into one single ad record ($10.24 USD)',
    created_at: '2026-09-01T10:00:00Z',
    updated_at: '2026-09-26T18:00:00Z',
  },
  {
    id: 'camp-closed-236',
    campaign_code: 'CAMP-2026-001',
    name: 'Ad Campaign — Smart Drug Timer & Safety Equipment',
    fb_campaign_ref: 'FB-AD-OCT-236',
    start_date: '2026-10-10',
    end_date: '2026-10-18',
    status: 'closed',
    ad_spend_usd: 2.36,
    exchange_rate: 305.0,
    ad_spend_lkr: 719.8,
    notes: 'Ad campaign closed. Final ad spend: $2.36 (LKR 719.80)',
    created_at: '2026-10-10T09:00:00Z',
    updated_at: '2026-10-18T18:00:00Z',
  },
  {
    id: 'camp-run-124',
    campaign_code: 'CAMP-2026-002',
    name: 'Currently Running Ad 1',
    fb_campaign_ref: 'FB-AD-RUN-01',
    start_date: '2026-10-20',
    end_date: null,
    status: 'running',
    ad_spend_usd: 1.24,
    exchange_rate: 305.0,
    ad_spend_lkr: 378.2,
    notes: 'Currently running Facebook ad ($1.24 spent). Inquiries received, orders pending confirmation.',
    created_at: '2026-10-20T09:00:00Z',
    updated_at: '2026-10-20T09:00:00Z',
  },
  {
    id: 'camp-run-187',
    campaign_code: 'CAMP-2026-003',
    name: 'Currently Running Ad 2',
    fb_campaign_ref: 'FB-AD-RUN-02',
    start_date: '2026-10-22',
    end_date: null,
    status: 'running',
    ad_spend_usd: 1.87,
    exchange_rate: 305.0,
    ad_spend_lkr: 570.35,
    notes: 'Currently running Facebook ad ($1.87 spent). Inquiries received, orders pending confirmation.',
    created_at: '2026-10-22T11:00:00Z',
    updated_at: '2026-10-22T11:00:00Z',
  },
];

export const INITIAL_SAMPLE_ORDERS: AdCampaignOrder[] = [
  {
    id: 'ord-001',
    campaign_id: 'camp-closed-236',
    order_number: 'ORD-2026-001',
    order_name: 'Smart Dispensing Drug Timer Medicine',
    customer_name: 'Dr. K. Perera',
    customer_phone: '0771234567',
    order_date: '2026-10-16',
    status: 'confirmed',
    notes: 'Smart dispenser prototype with PCB fabrication and testing.',
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
        notes: 'Schematic + Board layout',
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
        notes: '2-layer board batch',
      },
    ],
  },
  {
    id: 'ord-002',
    campaign_id: 'camp-closed-236',
    order_number: 'ORD-2026-002',
    order_name: 'Safety Helmet',
    customer_name: 'Apex Construction',
    customer_phone: '0719876543',
    order_date: '2026-10-17',
    status: 'confirmed',
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
        notes: 'Fast turnaround print',
      },
    ],
  },
  {
    id: 'ord-003',
    campaign_id: 'camp-closed-236',
    order_number: 'ORD-2026-003',
    order_name: 'Safety Panel',
    customer_name: 'BuildTech Lanka',
    customer_phone: '0754433221',
    order_date: '2026-10-18',
    status: 'pending',
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
        notes: 'Approved quote for schematic',
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
        notes: 'Pending final dimensions and supplier quote',
      },
    ],
  },
];

export const INITIAL_SAMPLE_EXPENSES: AdCampaignExpense[] = [];

// Helper: read and write to LocalStorage
function getLocalCampaigns(): AdCampaign[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CAMPAIGNS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_CAMPAIGNS, JSON.stringify(INITIAL_SAMPLE_CAMPAIGNS));
      return INITIAL_SAMPLE_CAMPAIGNS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load campaigns from storage', e);
    return INITIAL_SAMPLE_CAMPAIGNS;
  }
}

function setLocalCampaigns(campaigns: AdCampaign[]) {
  localStorage.setItem(STORAGE_KEY_CAMPAIGNS, JSON.stringify(campaigns));
}

function getLocalOrders(): AdCampaignOrder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ORDERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(INITIAL_SAMPLE_ORDERS));
      return INITIAL_SAMPLE_ORDERS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load orders from storage', e);
    return INITIAL_SAMPLE_ORDERS;
  }
}

function setLocalOrders(orders: AdCampaignOrder[]) {
  localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(orders));
}

function getLocalExpenses(): AdCampaignExpense[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_EXPENSES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_EXPENSES, JSON.stringify(INITIAL_SAMPLE_EXPENSES));
      return INITIAL_SAMPLE_EXPENSES;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load expenses from storage', e);
    return INITIAL_SAMPLE_EXPENSES;
  }
}

function setLocalExpenses(expenses: AdCampaignExpense[]) {
  localStorage.setItem(STORAGE_KEY_EXPENSES, JSON.stringify(expenses));
}

// Generate unique IDs
export function generateCampaignCode(existingCampaigns: AdCampaign[]): string {
  const currentYear = new Date().getFullYear();
  const yearCampaigns = existingCampaigns.filter(c =>
    c.campaign_code?.startsWith(`CAMP-${currentYear}`)
  );
  const nextNum = yearCampaigns.length + 1;
  return `CAMP-${currentYear}-${String(nextNum).padStart(3, '0')}`;
}

export function generateOrderNumber(existingOrders: AdCampaignOrder[]): string {
  const currentYear = new Date().getFullYear();
  const yearOrders = existingOrders.filter(o =>
    o.order_number?.startsWith(`ORD-${currentYear}`)
  );
  const nextNum = yearOrders.length + 1;
  return `ORD-${currentYear}-${String(nextNum).padStart(3, '0')}`;
}

// ============================================================================
// Service API with Supabase + LocalStorage Fallback
// ============================================================================

export const adCampaignService = {
  // CAMPAIGNS
  async getCampaigns(): Promise<AdCampaign[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('ad_campaigns')
          .select('*')
          .order('start_date', { ascending: false });

        if (!error && data && data.length > 0) {
          // Keep local mirror updated
          setLocalCampaigns(data as AdCampaign[]);
          return data as AdCampaign[];
        }
      } catch (err) {
        console.warn('Supabase getCampaigns failed, falling back to local storage', err);
      }
    }
    return getLocalCampaigns();
  },

  async getCampaignById(id: string): Promise<AdCampaign | null> {
    const campaigns = await this.getCampaigns();
    return campaigns.find(c => c.id === id) || null;
  },

  async createCampaign(
    campaignData: Omit<AdCampaign, 'id' | 'campaign_code' | 'created_at' | 'updated_at'>
  ): Promise<AdCampaign> {
    const existing = getLocalCampaigns();
    const campaignCode = generateCampaignCode(existing);
    const now = new Date().toISOString();
    const newId = `camp-${Date.now()}`;

    const newCampaign: AdCampaign = {
      ...campaignData,
      id: newId,
      campaign_code: campaignCode,
      status: campaignData.status || 'running',
      ad_spend_usd: Number(campaignData.ad_spend_usd) || 0,
      exchange_rate: Number(campaignData.exchange_rate) || 305,
      ad_spend_lkr:
        Number(campaignData.ad_spend_lkr) ||
        (Number(campaignData.ad_spend_usd) || 0) * (Number(campaignData.exchange_rate) || 305),
      created_at: now,
      updated_at: now,
    };

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('ad_campaigns')
          .insert([
            {
              campaign_code: campaignCode,
              name: newCampaign.name,
              fb_campaign_ref: newCampaign.fb_campaign_ref || null,
              start_date: newCampaign.start_date,
              end_date: newCampaign.end_date || null,
              status: newCampaign.status,
              ad_spend_usd: newCampaign.ad_spend_usd,
              exchange_rate: newCampaign.exchange_rate,
              ad_spend_lkr: newCampaign.ad_spend_lkr,
              notes: newCampaign.notes || null,
            },
          ])
          .select()
          .single();

        if (!error && data) {
          newCampaign.id = data.id;
        }
      } catch (err) {
        console.warn('Supabase createCampaign failed, persisting locally', err);
      }
    }

    const updated = [newCampaign, ...existing];
    setLocalCampaigns(updated);
    return newCampaign;
  },

  async updateCampaign(id: string, updates: Partial<AdCampaign>): Promise<AdCampaign> {
    const campaigns = getLocalCampaigns();
    const index = campaigns.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Campaign not found');

    const updatedCampaign: AdCampaign = {
      ...campaigns[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    // Auto-update LKR ad spend if USD or exchange rate changed and LKR not explicitly updated
    if (updates.ad_spend_usd !== undefined || updates.exchange_rate !== undefined) {
      if (updates.ad_spend_lkr === undefined) {
        updatedCampaign.ad_spend_lkr =
          Number(updatedCampaign.ad_spend_usd) * Number(updatedCampaign.exchange_rate);
      }
    }

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('ad_campaigns')
          .update({
            name: updatedCampaign.name,
            fb_campaign_ref: updatedCampaign.fb_campaign_ref,
            start_date: updatedCampaign.start_date,
            end_date: updatedCampaign.end_date,
            status: updatedCampaign.status,
            ad_spend_usd: updatedCampaign.ad_spend_usd,
            exchange_rate: updatedCampaign.exchange_rate,
            ad_spend_lkr: updatedCampaign.ad_spend_lkr,
            notes: updatedCampaign.notes,
          })
          .eq('id', id);
      } catch (err) {
        console.warn('Supabase updateCampaign failed', err);
      }
    }

    campaigns[index] = updatedCampaign;
    setLocalCampaigns(campaigns);
    return updatedCampaign;
  },

  async deleteCampaign(id: string): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        await supabase.from('ad_campaigns').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase deleteCampaign failed', err);
      }
    }

    const campaigns = getLocalCampaigns().filter(c => c.id !== id);
    setLocalCampaigns(campaigns);

    // Also unassign or delete associated orders & expenses
    const orders = getLocalOrders().map(o => (o.campaign_id === id ? { ...o, campaign_id: null } : o));
    setLocalOrders(orders);

    const expenses = getLocalExpenses().filter(e => e.campaign_id !== id);
    setLocalExpenses(expenses);
  },

  // ORDERS
  async getOrders(campaignId?: string): Promise<AdCampaignOrder[]> {
    if (isSupabaseConfigured) {
      try {
        let query = supabase
          .from('ad_campaign_orders')
          .select('*, services:ad_order_services(*)')
          .order('order_date', { ascending: false });

        if (campaignId) {
          query = query.eq('campaign_id', campaignId);
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          const parsed = data.map((d: any) => ({
            ...d,
            services: d.services || [],
          }));
          return parsed as AdCampaignOrder[];
        }
      } catch (err) {
        console.warn('Supabase getOrders failed, falling back to local storage', err);
      }
    }

    const localOrders = getLocalOrders();
    if (campaignId) {
      return localOrders.filter(o => o.campaign_id === campaignId);
    }
    return localOrders;
  },

  async createOrder(
    orderData: Omit<AdCampaignOrder, 'id' | 'order_number' | 'created_at' | 'updated_at' | 'services'>,
    services: Array<Omit<AdOrderService, 'id' | 'order_id'>>
  ): Promise<AdCampaignOrder> {
    const existingOrders = getLocalOrders();
    const orderNumber = generateOrderNumber(existingOrders);
    const now = new Date().toISOString();
    const newOrderId = `ord-${Date.now()}`;

    const newServices: AdOrderService[] = services.map((svc, idx) => ({
      ...svc,
      id: `svc-${Date.now()}-${idx}`,
      order_id: newOrderId,
      position: idx + 1,
      supplier_type: svc.supplier_type || 'outsourced',
      supplier_cost: svc.supplier_cost !== null && svc.supplier_cost !== undefined ? Number(svc.supplier_cost) : null,
      markup: svc.markup !== null && svc.markup !== undefined ? Number(svc.markup) : null,
      client_price: svc.client_price !== null && svc.client_price !== undefined ? Number(svc.client_price) : null,
      is_financial_pending: Boolean(svc.is_financial_pending),
    }));

    const newOrder: AdCampaignOrder = {
      ...orderData,
      id: newOrderId,
      order_number: orderNumber,
      campaign_id: orderData.campaign_id || null,
      status: orderData.status || 'pending',
      services: newServices,
      created_at: now,
      updated_at: now,
    };

    if (isSupabaseConfigured) {
      try {
        const { data: dbOrder, error: orderErr } = await supabase
          .from('ad_campaign_orders')
          .insert([
            {
              campaign_id: newOrder.campaign_id,
              order_number: orderNumber,
              order_name: newOrder.order_name,
              customer_name: newOrder.customer_name || null,
              customer_phone: newOrder.customer_phone || null,
              order_date: newOrder.order_date,
              status: newOrder.status,
              notes: newOrder.notes || null,
            },
          ])
          .select()
          .single();

        if (!orderErr && dbOrder) {
          newOrder.id = dbOrder.id;
          if (newServices.length > 0) {
            const dbServices = newServices.map(s => ({
              order_id: dbOrder.id,
              position: s.position,
              service_name: s.service_name,
              supplier_type: s.supplier_type,
              supplier_cost: s.supplier_cost,
              markup: s.markup,
              client_price: s.client_price,
              is_financial_pending: s.is_financial_pending,
              notes: s.notes || null,
            }));
            await supabase.from('ad_order_services').insert(dbServices);
          }
        }
      } catch (err) {
        console.warn('Supabase createOrder failed, persisting locally', err);
      }
    }

    const updated = [newOrder, ...existingOrders];
    setLocalOrders(updated);
    return newOrder;
  },

  async updateOrder(
    id: string,
    updates: Partial<AdCampaignOrder>,
    services?: Array<Omit<AdOrderService, 'order_id'> | AdOrderService>
  ): Promise<AdCampaignOrder> {
    const orders = getLocalOrders();
    const index = orders.findIndex(o => o.id === id);
    if (index === -1) throw new Error('Order not found');

    const existingOrder = orders[index];
    const now = new Date().toISOString();

    let updatedServices = existingOrder.services;
    if (services) {
      updatedServices = services.map((svc, idx) => ({
        ...svc,
        id: (svc as any).id || `svc-${Date.now()}-${idx}`,
        order_id: id,
        position: idx + 1,
        supplier_type: svc.supplier_type || 'outsourced',
        supplier_cost: svc.supplier_cost !== null && svc.supplier_cost !== undefined ? Number(svc.supplier_cost) : null,
        markup: svc.markup !== null && svc.markup !== undefined ? Number(svc.markup) : null,
        client_price: svc.client_price !== null && svc.client_price !== undefined ? Number(svc.client_price) : null,
        is_financial_pending: Boolean(svc.is_financial_pending),
      }));
    }

    const updatedOrder: AdCampaignOrder = {
      ...existingOrder,
      ...updates,
      services: updatedServices,
      updated_at: now,
    };

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('ad_campaign_orders')
          .update({
            campaign_id: updatedOrder.campaign_id,
            order_name: updatedOrder.order_name,
            customer_name: updatedOrder.customer_name,
            customer_phone: updatedOrder.customer_phone,
            order_date: updatedOrder.order_date,
            status: updatedOrder.status,
            notes: updatedOrder.notes,
          })
          .eq('id', id);

        if (services) {
          // Replace services
          await supabase.from('ad_order_services').delete().eq('order_id', id);
          if (updatedServices.length > 0) {
            const dbServices = updatedServices.map(s => ({
              order_id: id,
              position: s.position,
              service_name: s.service_name,
              supplier_type: s.supplier_type,
              supplier_cost: s.supplier_cost,
              markup: s.markup,
              client_price: s.client_price,
              is_financial_pending: s.is_financial_pending,
              notes: s.notes || null,
            }));
            await supabase.from('ad_order_services').insert(dbServices);
          }
        }
      } catch (err) {
        console.warn('Supabase updateOrder failed', err);
      }
    }

    orders[index] = updatedOrder;
    setLocalOrders(orders);
    return updatedOrder;
  },

  async updateOrderStatus(id: string, status: OrderStatus): Promise<AdCampaignOrder> {
    return this.updateOrder(id, { status });
  },

  async deleteOrder(id: string): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        await supabase.from('ad_campaign_orders').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase deleteOrder failed', err);
      }
    }

    const orders = getLocalOrders().filter(o => o.id !== id);
    setLocalOrders(orders);
  },

  // EXPENSES
  async getExpenses(campaignId?: string): Promise<AdCampaignExpense[]> {
    if (isSupabaseConfigured) {
      try {
        let query = supabase
          .from('ad_campaign_expenses')
          .select('*')
          .order('expense_date', { ascending: false });

        if (campaignId) {
          query = query.eq('campaign_id', campaignId);
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data as AdCampaignExpense[];
        }
      } catch (err) {
        console.warn('Supabase getExpenses failed', err);
      }
    }

    const localExpenses = getLocalExpenses();
    if (campaignId) {
      return localExpenses.filter(e => e.campaign_id === campaignId);
    }
    return localExpenses;
  },

  async createExpense(
    expenseData: Omit<AdCampaignExpense, 'id' | 'created_at' | 'updated_at'>
  ): Promise<AdCampaignExpense> {
    const existing = getLocalExpenses();
    const now = new Date().toISOString();
    const newId = `exp-${Date.now()}`;

    const amount = Number(expenseData.amount) || 0;
    const exchangeRate = Number(expenseData.exchange_rate) || 305;
    const amountLkr =
      expenseData.currency === 'USD'
        ? Math.round(amount * exchangeRate * 100) / 100
        : amount;

    const newExpense: AdCampaignExpense = {
      ...expenseData,
      id: newId,
      amount,
      exchange_rate: exchangeRate,
      amount_lkr: amountLkr,
      created_at: now,
      updated_at: now,
    };

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('ad_campaign_expenses')
          .insert([
            {
              campaign_id: newExpense.campaign_id,
              category: newExpense.category,
              description: newExpense.description,
              expense_date: newExpense.expense_date,
              amount: newExpense.amount,
              currency: newExpense.currency,
              exchange_rate: newExpense.exchange_rate,
              amount_lkr: newExpense.amount_lkr,
              notes: newExpense.notes || null,
            },
          ])
          .select()
          .single();

        if (!error && data) {
          newExpense.id = data.id;
        }
      } catch (err) {
        console.warn('Supabase createExpense failed', err);
      }
    }

    const updated = [newExpense, ...existing];
    setLocalExpenses(updated);
    return newExpense;
  },

  async deleteExpense(id: string): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        await supabase.from('ad_campaign_expenses').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase deleteExpense failed', err);
      }
    }

    const expenses = getLocalExpenses().filter(e => e.id !== id);
    setLocalExpenses(expenses);
  },

  // RESET / RE-SEED DATA
  resetToSampleData(): void {
    localStorage.setItem(STORAGE_KEY_CAMPAIGNS, JSON.stringify(INITIAL_SAMPLE_CAMPAIGNS));
    localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(INITIAL_SAMPLE_ORDERS));
    localStorage.setItem(STORAGE_KEY_EXPENSES, JSON.stringify(INITIAL_SAMPLE_EXPENSES));
  },

  clearAllData(): void {
    localStorage.removeItem(STORAGE_KEY_CAMPAIGNS);
    localStorage.removeItem(STORAGE_KEY_ORDERS);
    localStorage.removeItem(STORAGE_KEY_EXPENSES);
  },
};

