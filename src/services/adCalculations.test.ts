/**
 * Verification test suite for Ad Campaign Ledger & Profit Tracker
 * Validates all sample orders, formulas, currency conversions, and ad allocations.
 */
import {
  calculateServiceItemValues,
  calculateOrderFinancials,
  calculateCampaignFinancials,
  calculateLedgerOverallMetrics,
} from './adCalculations';
import { AdCampaign, AdCampaignOrder, AdCampaignExpense } from '../types';

export function runAdCampaignTests(): {
  allPassed: boolean;
  results: Array<{ testName: string; passed: boolean; details: string }>;
} {
  const results: Array<{ testName: string; passed: boolean; details: string }> = [];

  function assert(testName: string, condition: boolean, details: string) {
    results.push({ testName, passed: condition, details });
  }

  // TEST 1: Service Item calculation
  const svc1 = calculateServiceItemValues({
    supplier_cost: 4000,
    markup: 4000,
    client_price: 8000,
    is_financial_pending: false,
  });
  assert(
    'Service 1 Complete Financials',
    svc1.supplierCost === 4000 && svc1.clientPrice === 8000 && svc1.markup === 4000 && !svc1.isIncomplete,
    `Expected 4000/4000/8000, got ${svc1.supplierCost}/${svc1.markup}/${svc1.clientPrice}`
  );

  // TEST 2: Pending Service Item
  const svcPending = calculateServiceItemValues({
    supplier_cost: null,
    markup: null,
    client_price: null,
    is_financial_pending: true,
  });
  assert(
    'Service Pending Financials Flag',
    svcPending.isIncomplete === true && svcPending.supplierCost === 0 && svcPending.clientPrice === 0,
    `Expected isIncomplete: true, got ${svcPending.isIncomplete}`
  );

  // TEST 3: Order 1 — Smart Dispensing Drug Timer Medicine (Updated 4k/6k/10k)
  const order1: AdCampaignOrder = {
    id: 'ord-001',
    campaign_id: 'camp-run-001',
    order_number: 'ORD-2026-001',
    order_name: 'Smart Dispensing Drug Timer Medicine',
    customer_name: 'Dr. K. Perera',
    customer_phone: '0771234567',
    order_date: '2026-10-16',
    status: 'confirmed',
    notes: null,
    created_at: '',
    updated_at: '',
    services: [
      {
        id: '1',
        order_id: 'ord-001',
        position: 1,
        service_name: 'PCB Design',
        supplier_type: 'outsourced',
        supplier_cost: 4000,
        markup: 6000,
        client_price: 10000,
        is_financial_pending: false,
      },
      {
        id: '2',
        order_id: 'ord-001',
        position: 2,
        service_name: 'PCB Printing',
        supplier_type: 'outsourced',
        supplier_cost: 2000,
        markup: 1000,
        client_price: 3000,
        is_financial_pending: false,
      },
    ],
  };

  const o1Fin = calculateOrderFinancials(order1, 0, 0);
  assert(
    'Sample Order 1 Financials (PCB 10k + Print 3k)',
    o1Fin.revenue === 13000 && o1Fin.supplier_costs === 6000 && o1Fin.gross_profit === 7000 && !o1Fin.has_incomplete_financials,
    `Expected Rev 13,000, Costs 6,000, GP 7,000. Got Rev ${o1Fin.revenue}, Costs ${o1Fin.supplier_costs}, GP ${o1Fin.gross_profit}`
  );

  // TEST 4: Order 2 — Safety Helmet
  const order2: AdCampaignOrder = {
    id: 'ord-002',
    campaign_id: 'camp-run-001',
    order_number: 'ORD-2026-002',
    order_name: 'Safety Helmet',
    customer_name: 'Apex Construction',
    customer_phone: '0719876543',
    order_date: '2026-10-17',
    status: 'confirmed',
    notes: null,
    created_at: '',
    updated_at: '',
    services: [
      {
        id: '1',
        order_id: 'ord-002',
        position: 1,
        service_name: 'PCB Design',
        supplier_type: 'outsourced',
        supplier_cost: 4000,
        markup: 4000,
        client_price: 8000,
        is_financial_pending: false,
      },
      {
        id: '2',
        order_id: 'ord-002',
        position: 2,
        service_name: 'PCB Printing',
        supplier_type: 'outsourced',
        supplier_cost: 3600,
        markup: 1400,
        client_price: 5000,
        is_financial_pending: false,
      },
    ],
  };

  const o2Fin = calculateOrderFinancials(order2, 0, 0);
  assert(
    'Sample Order 2 Financials',
    o2Fin.revenue === 13000 && o2Fin.supplier_costs === 7600 && o2Fin.gross_profit === 5400 && !o2Fin.has_incomplete_financials,
    `Expected Rev 13,000, Costs 7,600, GP 5,400. Got Rev ${o2Fin.revenue}, Costs ${o2Fin.supplier_costs}, GP ${o2Fin.gross_profit}`
  );

  // TEST 5: Combined Order 1 + Order 2
  const combinedRev = o1Fin.revenue + o2Fin.revenue;
  const combinedCosts = o1Fin.supplier_costs + o2Fin.supplier_costs;
  const combinedGp = o1Fin.gross_profit + o2Fin.gross_profit;
  assert(
    'Combined Order 1 + Order 2 Totals',
    combinedRev === 26000 && combinedCosts === 13600 && combinedGp === 12400,
    `Expected Rev 26,000, Costs 13,600, GP 12,400. Got Rev ${combinedRev}, Costs ${combinedCosts}, GP ${combinedGp}`
  );

  // TEST 6: Order 3 — Incomplete Order
  const order3: AdCampaignOrder = {
    id: 'ord-003',
    campaign_id: 'camp-run-001',
    order_number: 'ORD-2026-003',
    order_name: 'Safety Helmet',
    customer_name: 'BuildTech Lanka',
    customer_phone: '0754433221',
    order_date: '2026-10-18',
    status: 'pending',
    notes: null,
    created_at: '',
    updated_at: '',
    services: [
      {
        id: '1',
        order_id: 'ord-003',
        position: 1,
        service_name: 'PCB Design',
        supplier_type: 'outsourced',
        supplier_cost: 4000,
        markup: 4000,
        client_price: 8000,
        is_financial_pending: false,
      },
      {
        id: '2',
        order_id: 'ord-003',
        position: 2,
        service_name: 'PCB Printing',
        supplier_type: 'outsourced',
        supplier_cost: null,
        markup: null,
        client_price: null,
        is_financial_pending: true,
      },
    ],
  };

  const o3Fin = calculateOrderFinancials(order3, 0, 0);
  assert(
    'Sample Order 3 Incomplete Financials Excluded',
    o3Fin.has_incomplete_financials === true && o3Fin.revenue === 8000 && o3Fin.supplier_costs === 4000,
    `Expected has_incomplete_financials: true, Rev 8000, Cost 4000. Got ${o3Fin.has_incomplete_financials}, Rev ${o3Fin.revenue}, Cost ${o3Fin.supplier_costs}`
  );

  // TEST 7: Campaign-Level Calculation with Order 1, Order 2, and Order 3
  const campaign1: AdCampaign = {
    id: 'camp-run-001',
    campaign_code: 'CAMP-2026-001',
    name: 'Smart Drug Timer & Safety Helmet Ads',
    fb_campaign_ref: 'FB-CAMP-01',
    start_date: '2026-10-15',
    end_date: null,
    status: 'running',
    ad_spend_usd: 1.24,
    exchange_rate: 305,
    ad_spend_lkr: 378.2,
    notes: null,
    created_at: '',
    updated_at: '',
  };

  const c1Expenses: AdCampaignExpense[] = [
    {
      id: 'e1',
      campaign_id: 'camp-run-001',
      category: 'Packaging',
      description: 'Boxes',
      expense_date: '2026-10-17',
      amount: 850,
      currency: 'LKR',
      exchange_rate: 305,
      amount_lkr: 850,
      notes: null,
      created_at: '',
      updated_at: '',
    },
  ];

  const campFin = calculateCampaignFinancials(campaign1, [order1, order2, order3], c1Expenses);
  // Order 1 & 2 are confirmed (13,000 + 13,000 = 26,000). Order 3 is pending (excluded).
  // Total Revenue: 26,000
  // Total Supplier Costs: 13,600
  // Gross Profit: 12,400
  // Ad Spend LKR: 378.20
  // Other Expenses: 850.00
  // Net Profit: 12,400 - 378.20 - 850 = 11,171.80
  const expectedNet = 12400 - 378.2 - 850;
  assert(
    'Campaign 1 Revenue, Costs, and Net Profit with Pending Exclusion',
    campFin.total_revenue === 26000 &&
    campFin.total_supplier_costs === 13600 &&
    campFin.gross_profit === 12400 &&
    campFin.confirmed_orders_count === 2 &&
    campFin.pending_orders_count === 1 &&
    Math.abs(campFin.net_profit - expectedNet) < 0.01 &&
    campFin.has_incomplete_financials === true,
    `Expected Rev 26,000, GP 12,400, Net ${expectedNet}. Got Rev ${campFin.total_revenue}, GP ${campFin.gross_profit}, Net ${campFin.net_profit}`
  );

  // TEST 8: Order-Level Advertising Allocation
  // Order 1: 13,000 / 26,000 * 378.20 = 189.10 LKR
  // Order 2: 13,000 / 26,000 * 378.20 = 189.10 LKR
  const o1Allocated = calculateOrderFinancials(order1, campFin.total_revenue, campFin.ad_spend_lkr);
  const o2Allocated = calculateOrderFinancials(order2, campFin.total_revenue, campFin.ad_spend_lkr);

  const expectedO1Alloc = (378.2 * 13000) / 26000;
  const expectedO2Alloc = (378.2 * 13000) / 26000;
  assert(
    'Order 1 and 2 Proportional Advertising Allocation',
    Math.abs(o1Allocated.allocated_ad_spend - expectedO1Alloc) < 0.01 &&
    Math.abs(o2Allocated.allocated_ad_spend - expectedO2Alloc) < 0.01,
    `Expected O1: ${expectedO1Alloc.toFixed(2)}, got ${o1Allocated.allocated_ad_spend.toFixed(2)}. Expected O2: ${expectedO2Alloc.toFixed(2)}, got ${o2Allocated.allocated_ad_spend.toFixed(2)}`
  );

  // TEST 9: Historical Advertising Sum
  const histSpends = [3.45, 4.46, 0.28, 1.77, 0.28];
  const histTotal = histSpends.reduce((a, b) => a + b, 0);
  assert(
    'Historical Ad Expenses Sum ($10.24)',
    Math.abs(histTotal - 10.24) < 0.001,
    `Expected $10.24, got $${histTotal.toFixed(2)}`
  );

  // TEST 10: Zero Revenue Zero Division Protection
  const emptyCampaignOrder = calculateOrderFinancials(order1, 0, 378.2);
  assert(
    'Zero Campaign Revenue Division Guard',
    emptyCampaignOrder.allocated_ad_spend === 0 && !isNaN(emptyCampaignOrder.allocated_ad_spend),
    `Expected 0, got ${emptyCampaignOrder.allocated_ad_spend}`
  );

  const allPassed = results.every(r => r.passed);
  return { allPassed, results };
}

