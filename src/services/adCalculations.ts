import {
  AdCampaign,
  AdCampaignOrder,
  AdCampaignExpense,
  AdOrderService,
  OrderFinancialSummary,
  CampaignFinancialSummary,
  LedgerOverallMetrics,
  ExpenseAllocationMethod,
} from '../types';

/**
 * Calculates financial amounts for an individual service item.
 */
export function calculateServiceItemValues(service: Partial<AdOrderService>): {
  supplierCost: number;
  markup: number;
  clientPrice: number;
  isIncomplete: boolean;
  hasCalculationMismatch: boolean;
} {
  const isIncomplete =
    Boolean(service.is_financial_pending) ||
    service.supplier_cost === null ||
    service.supplier_cost === undefined ||
    service.client_price === null ||
    service.client_price === undefined;

  const supplierCost = isIncomplete ? 0 : Number(service.supplier_cost) || 0;
  const clientPrice = isIncomplete ? 0 : Number(service.client_price) || 0;
  const markup = isIncomplete ? 0 : Number(service.markup ?? (clientPrice - supplierCost)) || 0;

  // Calculation mismatch check if clientPrice is manually overridden and doesn't equal cost + markup
  const expectedPrice = supplierCost + markup;
  const hasCalculationMismatch = !isIncomplete && Math.abs(clientPrice - expectedPrice) > 0.01;

  return {
    supplierCost,
    markup,
    clientPrice,
    isIncomplete,
    hasCalculationMismatch,
  };
}

/**
 * Computes advertising allocations across a list of orders for a campaign.
 * Guarantees that the sum of allocated amounts equals campaignAdSpendLkr down to the cent.
 */
export function computeOrderAdAllocations(
  orders: AdCampaignOrder[],
  campaignAdSpendLkr: number,
  method: ExpenseAllocationMethod = 'revenue_based'
): Map<string, number> {
  const allocationMap = new Map<string, number>();
  if (campaignAdSpendLkr <= 0 || orders.length === 0) {
    orders.forEach(o => allocationMap.set(o.id, 0));
    return allocationMap;
  }

  // Filter eligible confirmed orders
  const eligibleOrders = orders.filter(o =>
    ['confirmed', 'in_progress', 'ready_for_delivery', 'completed'].includes(o.status)
  );

  if (eligibleOrders.length === 0) {
    orders.forEach(o => allocationMap.set(o.id, 0));
    return allocationMap;
  }

  if (method === 'equal') {
    const count = eligibleOrders.length;
    const baseShare = Math.floor((campaignAdSpendLkr / count) * 100) / 100;
    let accumulated = 0;

    eligibleOrders.forEach((o, index) => {
      if (index === count - 1) {
        // Last item absorbs any rounding cent difference
        const lastShare = Math.round((campaignAdSpendLkr - accumulated) * 100) / 100;
        allocationMap.set(o.id, Math.max(0, lastShare));
      } else {
        allocationMap.set(o.id, baseShare);
        accumulated += baseShare;
      }
    });
  } else if (method === 'manual') {
    // Uses manual_allocated_ad_spend if provided
    let totalManual = 0;
    eligibleOrders.forEach(o => {
      const val = Number(o.manual_allocated_ad_spend) || 0;
      allocationMap.set(o.id, val);
      totalManual += val;
    });
  } else {
    // 'revenue_based'
    let totalEligibleRevenue = 0;
    const orderRevenues = new Map<string, number>();

    eligibleOrders.forEach(o => {
      let rev = 0;
      (o.services || []).forEach(s => {
        const { clientPrice, isIncomplete } = calculateServiceItemValues(s);
        if (!isIncomplete) rev += clientPrice;
      });
      orderRevenues.set(o.id, rev);
      totalEligibleRevenue += rev;
    });

    if (totalEligibleRevenue <= 0) {
      // Fallback to equal allocation if no revenue
      return computeOrderAdAllocations(orders, campaignAdSpendLkr, 'equal');
    }

    let accumulated = 0;
    eligibleOrders.forEach((o, index) => {
      const rev = orderRevenues.get(o.id) || 0;
      if (index === eligibleOrders.length - 1) {
        // Last item absorbs decimal rounding
        const lastShare = Math.round((campaignAdSpendLkr - accumulated) * 100) / 100;
        allocationMap.set(o.id, Math.max(0, lastShare));
      } else {
        const share = Math.round(((campaignAdSpendLkr * rev) / totalEligibleRevenue) * 100) / 100;
        allocationMap.set(o.id, share);
        accumulated += share;
      }
    });
  }

  // Set 0 for any non-eligible orders
  orders.forEach(o => {
    if (!allocationMap.has(o.id)) {
      allocationMap.set(o.id, 0);
    }
  });

  return allocationMap;
}

/**
 * Calculates financial summary for an order.
 * If campaignTotalRevenue and campaignAdSpendLkr are provided,
 * calculates advertising allocation according to the chosen method.
 */
export function calculateOrderFinancials(
  order: AdCampaignOrder,
  campaignTotalRevenue: number = 0,
  campaignAdSpendLkr: number = 0,
  precalculatedAdAllocation?: number
): OrderFinancialSummary {
  const isConfirmed = [
    'confirmed',
    'in_progress',
    'waiting_for_supplier',
    'quality_check',
    'ready_for_delivery',
    'completed',
  ].includes(order.status);

  let hasIncomplete = false;
  let revenue = 0;
  let supplierCosts = 0;

  (order.services || []).forEach(svc => {
    const { supplierCost, clientPrice, isIncomplete } = calculateServiceItemValues(svc);
    if (isIncomplete) {
      hasIncomplete = true;
    } else {
      revenue += clientPrice;
      supplierCosts += supplierCost;
    }
  });

  const grossProfit = revenue - supplierCosts;

  // Order ad allocation
  let allocatedAdSpend = 0;
  if (precalculatedAdAllocation !== undefined) {
    allocatedAdSpend = precalculatedAdAllocation;
  } else if (order.manual_allocated_ad_spend !== undefined && order.manual_allocated_ad_spend !== null) {
    allocatedAdSpend = Number(order.manual_allocated_ad_spend) || 0;
  } else if (isConfirmed && campaignTotalRevenue > 0 && revenue > 0 && campaignAdSpendLkr > 0) {
    allocatedAdSpend = (campaignAdSpendLkr * revenue) / campaignTotalRevenue;
  }

  const netContribution = grossProfit - allocatedAdSpend;

  // Payment Tracking
  const customerPaid = Number(order.customer_paid_amount) || (order.payment_status === 'fully_paid' ? revenue : 0);
  const supplierPaid = Number(order.supplier_paid_amount) || (order.supplier_payment_status === 'fully_paid' ? supplierCosts : 0);

  const customerBalance = Math.max(0, revenue - customerPaid);
  const supplierBalance = Math.max(0, supplierCosts - supplierPaid);

  // Realized profit is based on confirmed collections minus supplier payables
  // If payment status is fully_paid, customer paid is full revenue
  const realizedProfit = customerPaid - supplierPaid;

  return {
    revenue,
    supplier_costs: supplierCosts,
    gross_profit: grossProfit,
    allocated_ad_spend: allocatedAdSpend,
    net_contribution: netContribution,
    customer_paid_amount: customerPaid,
    customer_balance: customerBalance,
    supplier_paid_amount: supplierPaid,
    supplier_balance: supplierBalance,
    realized_profit: realizedProfit,
    has_incomplete_financials: hasIncomplete,
    is_confirmed: isConfirmed,
  };
}

/**
 * Calculates campaign-level financial summary.
 */
export function calculateCampaignFinancials(
  campaign: AdCampaign,
  orders: AdCampaignOrder[],
  expenses: AdCampaignExpense[]
): CampaignFinancialSummary {
  const campaignOrders = orders.filter(o => o.campaign_id === campaign.id);
  const campaignExpenses = expenses.filter(e => e.campaign_id === campaign.id);

  // Ad Spend in LKR (explicit or converted from USD)
  const exchangeRate = Number(campaign.exchange_rate) || 305;
  const adSpendUsd = Number(campaign.ad_spend_usd) || 0;
  const adSpendLkr =
    Number(campaign.ad_spend_lkr) > 0
      ? Number(campaign.ad_spend_lkr)
      : Math.round(adSpendUsd * exchangeRate * 100) / 100;

  // Calculate order allocations
  const allocationMethod = campaign.allocation_method || 'revenue_based';
  const allocationMap = computeOrderAdAllocations(campaignOrders, adSpendLkr, allocationMethod);

  let confirmedCount = 0;
  let pendingCount = 0;
  let totalRevenue = 0;
  let totalSupplierCosts = 0;
  let totalAllocatedAdSpend = 0;
  let outstandingCustomerPayments = 0;
  let outstandingSupplierPayables = 0;
  let totalRealizedGrossProfit = 0;
  let pendingOrderValue = 0;
  let pendingSupplierCost = 0;
  let hasIncomplete = false;

  campaignOrders.forEach(order => {
    const allocatedShare = allocationMap.get(order.id) || 0;
    const financials = calculateOrderFinancials(order, 0, 0, allocatedShare);

    if (financials.has_incomplete_financials) {
      hasIncomplete = true;
    }

    if (financials.is_confirmed) {
      confirmedCount += 1;
      totalRevenue += financials.revenue;
      totalSupplierCosts += financials.supplier_costs;
      totalAllocatedAdSpend += financials.allocated_ad_spend;
      outstandingCustomerPayments += financials.customer_balance;
      outstandingSupplierPayables += financials.supplier_balance;
      totalRealizedGrossProfit += financials.realized_profit > 0 ? financials.realized_profit : financials.gross_profit;
    } else {
      pendingCount += 1;
      // Pending order estimated value
      pendingOrderValue += financials.revenue;
      pendingSupplierCost += financials.supplier_costs;
    }
  });

  const grossProfit = totalRevenue - totalSupplierCosts;

  // Unallocated ad spend
  const unallocatedAdSpend = Math.max(0, Math.round((adSpendLkr - totalAllocatedAdSpend) * 100) / 100);

  // Operational expenses (Packaging, Delivery, etc.)
  const otherExpensesLkr = campaignExpenses.reduce((sum, exp) => {
    const amount = Number(exp.amount_lkr || exp.amount) || 0;
    return sum + amount;
  }, 0);

  // Net Profit After Advertising = Expected Gross Profit - Ad Spend LKR - Other Expenses
  const netProfit = grossProfit - adSpendLkr - otherExpensesLkr;

  return {
    campaign_id: campaign.id,
    confirmed_orders_count: confirmedCount,
    pending_orders_count: pendingCount,
    total_revenue: totalRevenue,
    total_supplier_costs: totalSupplierCosts,
    gross_profit: grossProfit,
    realized_gross_profit: totalRealizedGrossProfit,
    ad_spend_usd: adSpendUsd,
    ad_spend_lkr: adSpendLkr,
    other_expenses_lkr: otherExpensesLkr,
    total_allocated_ad_spend: totalAllocatedAdSpend,
    unallocated_ad_spend: unallocatedAdSpend,
    net_profit: netProfit,
    pending_order_value: pendingOrderValue,
    pending_supplier_cost: pendingSupplierCost,
    outstanding_customer_payments: outstandingCustomerPayments,
    outstanding_supplier_payables: outstandingSupplierPayables,
    has_incomplete_financials: hasIncomplete,
  };
}

/**
 * Calculates top-level metrics across all filtered campaigns and orders.
 * Supports filtering by selected campaign, date range, campaign status, and order status.
 */
export function calculateLedgerOverallMetrics(
  campaigns: AdCampaign[],
  orders: AdCampaignOrder[],
  expenses: AdCampaignExpense[],
  selectedCampaignId: string = 'all',
  dateFilterPreset: 'all' | 'thisMonth' | '30days' = 'all',
  campaignStatusFilter: string = 'all',
  orderStatusFilter: string = 'all'
): LedgerOverallMetrics {
  // 1. Filter campaigns
  let filteredCampaigns = campaigns;
  if (selectedCampaignId !== 'all') {
    filteredCampaigns = campaigns.filter(c => c.id === selectedCampaignId);
  }
  if (campaignStatusFilter !== 'all') {
    filteredCampaigns = filteredCampaigns.filter(c => c.status === campaignStatusFilter);
  }

  // Date filtering on campaigns
  if (dateFilterPreset === 'thisMonth') {
    const currentMonth = new Date().toISOString().slice(0, 7);
    filteredCampaigns = filteredCampaigns.filter(c => c.start_date.startsWith(currentMonth));
  } else if (dateFilterPreset === '30days') {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    filteredCampaigns = filteredCampaigns.filter(c => new Date(c.start_date) >= thirtyDaysAgo);
  }

  // 2. Filter orders
  let filteredOrders = orders;
  if (selectedCampaignId !== 'all') {
    filteredOrders = orders.filter(o => o.campaign_id === selectedCampaignId);
  }
  if (orderStatusFilter !== 'all') {
    filteredOrders = filteredOrders.filter(o => o.status === orderStatusFilter);
  }

  // Date filtering on orders
  if (dateFilterPreset === 'thisMonth') {
    const currentMonth = new Date().toISOString().slice(0, 7);
    filteredOrders = filteredOrders.filter(o => o.order_date.startsWith(currentMonth));
  } else if (dateFilterPreset === '30days') {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    filteredOrders = filteredOrders.filter(o => new Date(o.order_date) >= thirtyDaysAgo);
  }

  // 3. Filter expenses
  let filteredExpenses = expenses;
  if (selectedCampaignId !== 'all') {
    filteredExpenses = expenses.filter(e => e.campaign_id === selectedCampaignId);
  }

  let totalAdSpendUsd = 0;
  let totalAdSpendLkr = 0;
  let runningCount = 0;
  let closedCount = 0;

  filteredCampaigns.forEach(campaign => {
    if (campaign.status === 'running') runningCount += 1;
    if (campaign.status === 'closed') closedCount += 1;

    const usd = Number(campaign.ad_spend_usd) || 0;
    const rate = Number(campaign.exchange_rate) || 305;
    const lkr = Number(campaign.ad_spend_lkr) > 0 ? Number(campaign.ad_spend_lkr) : usd * rate;

    totalAdSpendUsd += usd;
    totalAdSpendLkr += lkr;
  });

  // Calculate confirmed order metrics
  let totalConfirmedRevenue = 0;
  let totalSupplierCosts = 0;
  let totalRealizedProfit = 0;
  let pendingCustomerPayments = 0;
  let pendingSupplierCosts = 0;
  let hasIncompleteRecords = false;

  filteredOrders.forEach(order => {
    const fin = calculateOrderFinancials(order, 0, 0);

    if (fin.has_incomplete_financials) {
      hasIncompleteRecords = true;
    }

    if (fin.is_confirmed) {
      totalConfirmedRevenue += fin.revenue;
      totalSupplierCosts += fin.supplier_costs;
      totalRealizedProfit += fin.realized_profit > 0 ? fin.realized_profit : fin.gross_profit;
      pendingCustomerPayments += fin.customer_balance;
      pendingSupplierCosts += fin.supplier_balance;
    }
  });

  const grossProfit = totalConfirmedRevenue - totalSupplierCosts;
  const totalExpectedProfit = grossProfit;

  // Other expenses
  const otherExpensesLkr = filteredExpenses.reduce((sum, exp) => {
    const amount = Number(exp.amount_lkr || exp.amount) || 0;
    return sum + amount;
  }, 0);

  // Net Profit After Expenses = Realized Profit - Ad Spend LKR - Other Expenses
  const netProfit = grossProfit - totalAdSpendLkr - otherExpensesLkr;

  return {
    total_ad_spend_usd: Math.round(totalAdSpendUsd * 100) / 100,
    total_ad_spend_lkr: Math.round(totalAdSpendLkr * 100) / 100,
    total_confirmed_revenue: Math.round(totalConfirmedRevenue * 100) / 100,
    total_supplier_costs: Math.round(totalSupplierCosts * 100) / 100,
    gross_profit: Math.round(grossProfit * 100) / 100,
    total_expected_profit: Math.round(totalExpectedProfit * 100) / 100,
    total_realized_profit: Math.round(totalRealizedProfit * 100) / 100,
    pending_customer_payments: Math.round(pendingCustomerPayments * 100) / 100,
    pending_supplier_costs: Math.round(pendingSupplierCosts * 100) / 100,
    other_expenses_lkr: Math.round(otherExpensesLkr * 100) / 100,
    net_profit: Math.round(netProfit * 100) / 100,
    total_campaigns_count: filteredCampaigns.length,
    running_campaigns_count: runningCount,
    closed_campaigns_count: closedCount,
    has_incomplete_records: hasIncompleteRecords,
  };
}
