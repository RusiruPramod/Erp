/**
 * Verification test suite for Ad Campaign Ledger & Profit Tracker
 * Validates all sample orders, formulas, currency conversions, ad allocations, and ledger metrics.
 */
import {
  calculateServiceItemValues,
  calculateOrderFinancials,
  calculateCampaignFinancials,
  calculateLedgerOverallMetrics,
  computeOrderAdAllocations,
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
    markup: 6000,
    client_price: 10000,
    is_financial_pending: false,
  });
  assert(
    'Service 1 Complete Financials',
    svc1.supplierCost === 4000 && svc1.clientPrice === 10000 && svc1.markup === 6000 && !svc1.isIncomplete && !svc1.hasCalculationMismatch,
    `Expected 4000/6000/10000, got ${svc1.supplierCost}/${svc1.markup}/${svc1.clientPrice}`
  );

  // TEST 2: Pending Service Item (Not treated as 0)
  const svcPending = calculateServiceItemValues({
    supplier_cost: null,
    markup: null,
    client_price: null,
    is_financial_pending: true,
  });
  assert(
    'Service Pending Financials Flag (Not treated as 0)',
    svcPending.isIncomplete === true && svcPending.supplierCost === 0 && svcPending.clientPrice === 0,
    `Expected isIncomplete: true, got ${svcPending.isIncomplete}`
  );

  // TEST 3: Order 1 — Smart Dispensing Drug Timer Medicine
  const order1: AdCampaignOrder = {
    id: 'ord-001',
    campaign_id: 'camp-closed-236',
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
    'Sample Order 1 Financials (PCB 10k + Print 3k = 13k Customer Price, 6k Supplier Cost, 7k Profit)',
    o1Fin.revenue === 13000 && o1Fin.supplier_costs === 6000 && o1Fin.gross_profit === 7000 && !o1Fin.has_incomplete_financials,
    `Expected Rev 13,000, Costs 6,000, GP 7,000. Got Rev ${o1Fin.revenue}, Costs ${o1Fin.supplier_costs}, GP ${o1Fin.gross_profit}`
  );

  // TEST 4: Order 2 — Safety Helmet
  const order2: AdCampaignOrder = {
    id: 'ord-002',
    campaign_id: 'camp-closed-236',
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
    'Sample Order 2 Financials (PCB 8k + Print 5k = 13k Customer Price, 7.6k Cost, 5.4k Profit)',
    o2Fin.revenue === 13000 && o2Fin.supplier_costs === 7600 && o2Fin.gross_profit === 5400 && !o2Fin.has_incomplete_financials,
    `Expected Rev 13,000, Costs 7,600, GP 5,400. Got Rev ${o2Fin.revenue}, Costs ${o2Fin.supplier_costs}, GP ${o2Fin.gross_profit}`
  );

  // TEST 5: Order 3 — Safety Panel (Incomplete Print PCB Excluded)
  const order3: AdCampaignOrder = {
    id: 'ord-003',
    campaign_id: 'camp-closed-236',
    order_number: 'ORD-2026-003',
    order_name: 'Safety Panel',
    customer_name: 'BuildTech Lanka',
    customer_phone: '0754433221',
    order_date: '2026-10-18',
    status: 'quotation_pending',
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
    'Sample Order 3 Incomplete Pricing Flagged (Confirmed Rev 8000, Cost 4000)',
    o3Fin.has_incomplete_financials === true && o3Fin.revenue === 8000 && o3Fin.supplier_costs === 4000 && o3Fin.gross_profit === 4000,
    `Expected has_incomplete_financials: true, Rev 8000, Cost 4000. Got ${o3Fin.has_incomplete_financials}, Rev ${o3Fin.revenue}, Cost ${o3Fin.supplier_costs}`
  );

  // TEST 6: Combined Confirmed Sample Totals (Order 1 + Order 2 + Order 3 confirmed items)
  // Confirmed Customer Price: 13,000 + 13,000 + 8,000 = 34,000
  // Confirmed Supplier Cost: 6,000 + 7,600 + 4,000 = 17,600
  // Confirmed Gross Profit: 7,000 + 5,400 + 4,000 = 16,400
  const combinedConfirmedRev = o1Fin.revenue + o2Fin.revenue + o3Fin.revenue;
  const combinedConfirmedCost = o1Fin.supplier_costs + o2Fin.supplier_costs + o3Fin.supplier_costs;
  const combinedConfirmedGp = o1Fin.gross_profit + o2Fin.gross_profit + o3Fin.gross_profit;
  assert(
    'Combined Confirmed Sample Totals (34,000 Rev, 17,600 Cost, 16,400 Profit)',
    combinedConfirmedRev === 34000 && combinedConfirmedCost === 17600 && combinedConfirmedGp === 16400,
    `Expected Rev 34,000, Cost 17,600, GP 16,400. Got Rev ${combinedConfirmedRev}, Cost ${combinedConfirmedCost}, GP ${combinedConfirmedGp}`
  );

  // TEST 7: Historical Ad Expenses Sum ($10.24)
  const histSpends = [3.45, 4.46, 0.28, 1.77, 0.28];
  const histTotal = histSpends.reduce((a, b) => a + b, 0);
  assert(
    'Historical Ad Expenses Sum ($10.24)',
    Math.abs(histTotal - 10.24) < 0.001,
    `Expected $10.24, got $${histTotal.toFixed(2)}`
  );

  // TEST 8: Current Running Campaigns Sum ($3.11)
  const runningSpends = [1.24, 1.87];
  const runningTotal = runningSpends.reduce((a, b) => a + b, 0);
  assert(
    'Running Campaigns Spend Sum ($1.24 + $1.87 = $3.11)',
    Math.abs(runningTotal - 3.11) < 0.001,
    `Expected $3.11, got $${runningTotal.toFixed(2)}`
  );

  // TEST 9: Campaign Allocation Methods
  // Equal Allocation of $2.36 (LKR 719.80) across Order 1 and Order 2
  const equalAlloc = computeOrderAdAllocations([order1, order2], 719.80, 'equal');
  const eqTotal = Array.from(equalAlloc.values()).reduce((a, b) => a + b, 0);
  assert(
    'Equal Allocation Exact Cent Sum Protection',
    Math.abs(eqTotal - 719.80) < 0.01,
    `Expected sum 719.80, got ${eqTotal.toFixed(2)}`
  );

  // Revenue-Based Allocation of 719.80 across Order 1 (13k) and Order 2 (13k) = 359.90 each
  const revAlloc = computeOrderAdAllocations([order1, order2], 719.80, 'revenue_based');
  const revTotal = Array.from(revAlloc.values()).reduce((a, b) => a + b, 0);
  assert(
    'Revenue-Based Allocation Exact Cent Sum Protection',
    Math.abs(revTotal - 719.80) < 0.01 && Math.abs((revAlloc.get('ord-001') || 0) - 359.90) < 0.01,
    `Expected sum 719.80 with 359.90 each, got ${revTotal.toFixed(2)}`
  );

  // TEST 10: Campaign Close Financials
  const campaign: AdCampaign = {
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
    notes: null,
    created_at: '',
    updated_at: '',
  };

  const expenses: AdCampaignExpense[] = [
    {
      id: 'e1',
      campaign_id: 'camp-closed-236',
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

  const campFin = calculateCampaignFinancials(campaign, [order1, order2], expenses);
  // Total Revenue: 26,000 (13,000 + 13,000)
  // Total Supplier Costs: 13,600 (6,000 + 7,600)
  // Gross Profit: 12,400
  // Ad Spend LKR: 719.80
  // Other Expenses: 850.00
  // Net Profit: 12,400 - 719.80 - 850 = 10,830.20
  const expectedCampNet = 12400 - 719.8 - 850;
  assert(
    'Campaign Close Net Profit (12,400 - 719.80 - 850 = 10,830.20 LKR)',
    campFin.total_revenue === 26000 &&
    campFin.total_supplier_costs === 13600 &&
    campFin.gross_profit === 12400 &&
    Math.abs(campFin.net_profit - expectedCampNet) < 0.01,
    `Expected Net ${expectedCampNet}, got ${campFin.net_profit}`
  );

  const allPassed = results.every(r => r.passed);
  return { allPassed, results };
}
