import {
  AdCampaign,
  AdCampaignOrder,
  AdCampaignExpense,
  AdOrderService,
  OrderFinancialSummary,
  CampaignFinancialSummary,
  LedgerOverallMetrics,
} from '../types';

/**
 * Calculates financial amounts for an individual service item.
 */
export function calculateServiceItemValues(service: Partial<AdOrderService>): {
  supplierCost: number;
  markup: number;
  clientPrice: number;
  isIncomplete: boolean;
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

  return {
    supplierCost,
    markup,
    clientPrice,
    isIncomplete,
  };
}

/**
 * Calculates financial summary for an order.
 * If campaignTotalRevenue and campaignAdSpendLkr are provided,
 * calculates the proportional order advertising allocation:
 * Order Ad Allocation = Campaign Ad Spend * (Order Revenue / Total Eligible Campaign Revenue)
 */
export function calculateOrderFinancials(
  order: AdCampaignOrder,
  campaignTotalRevenue: number = 0,
  campaignAdSpendLkr: number = 0
): OrderFinancialSummary {
  const isConfirmed = ['confirmed', 'in_progress', 'completed'].includes(order.status);

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

  // Order ad allocation only applies to confirmed orders with positive revenue in the campaign
  let allocatedAdSpend = 0;
  if (isConfirmed && campaignTotalRevenue > 0 && revenue > 0 && campaignAdSpendLkr > 0) {
    allocatedAdSpend = (campaignAdSpendLkr * revenue) / campaignTotalRevenue;
  }

  const netContribution = grossProfit - allocatedAdSpend;

  return {
    revenue,
    supplier_costs: supplierCosts,
    gross_profit: grossProfit,
    allocated_ad_spend: allocatedAdSpend,
    net_contribution: netContribution,
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

  let confirmedCount = 0;
  let pendingCount = 0;
  let totalRevenue = 0;
  let totalSupplierCosts = 0;
  let hasIncomplete = false;

  campaignOrders.forEach(order => {
    const financials = calculateOrderFinancials(order, 0, 0);

    if (financials.has_incomplete_financials) {
      hasIncomplete = true;
    }

    if (financials.is_confirmed) {
      confirmedCount += 1;
      totalRevenue += financials.revenue;
      totalSupplierCosts += financials.supplier_costs;
    } else if (order.status === 'pending') {
      pendingCount += 1;
    }
  });

  const grossProfit = totalRevenue - totalSupplierCosts;

  // Ad Spend in LKR (explicit or converted from USD)
  const exchangeRate = Number(campaign.exchange_rate) || 305;
  const adSpendUsd = Number(campaign.ad_spend_usd) || 0;
  const adSpendLkr =
    Number(campaign.ad_spend_lkr) > 0
      ? Number(campaign.ad_spend_lkr)
      : Math.round(adSpendUsd * exchangeRate * 100) / 100;

  // Operational expenses (Packaging, Delivery, etc.)
  const otherExpensesLkr = campaignExpenses.reduce((sum, exp) => {
    const amount = Number(exp.amount_lkr || exp.amount) || 0;
    return sum + amount;
  }, 0);

  // Net Profit After Advertising = Gross Profit - Ad Spend LKR - Other Expenses
  const netProfit = grossProfit - adSpendLkr - otherExpensesLkr;

  return {
    campaign_id: campaign.id,
    confirmed_orders_count: confirmedCount,
    pending_orders_count: pendingCount,
    total_revenue: totalRevenue,
    total_supplier_costs: totalSupplierCosts,
    gross_profit: grossProfit,
    ad_spend_usd: adSpendUsd,
    ad_spend_lkr: adSpendLkr,
    other_expenses_lkr: otherExpensesLkr,
    net_profit: netProfit,
    has_incomplete_financials: hasIncomplete,
  };
}

/**
 * Calculates top-level metrics across all filtered campaigns and orders.
 */
export function calculateLedgerOverallMetrics(
  campaigns: AdCampaign[],
  orders: AdCampaignOrder[],
  expenses: AdCampaignExpense[]
): LedgerOverallMetrics {
  let totalAdSpendUsd = 0;
  let totalAdSpendLkr = 0;
  let totalConfirmedRevenue = 0;
  let totalSupplierCosts = 0;
  let grossProfit = 0;
  let otherExpensesLkr = 0;
  let runningCount = 0;
  let closedCount = 0;
  let hasIncompleteRecords = false;

  campaigns.forEach(campaign => {
    if (campaign.status === 'running') runningCount += 1;
    if (campaign.status === 'closed') closedCount += 1;

    const summary = calculateCampaignFinancials(campaign, orders, expenses);

    totalAdSpendUsd += summary.ad_spend_usd;
    totalAdSpendLkr += summary.ad_spend_lkr;
    totalConfirmedRevenue += summary.total_revenue;
    totalSupplierCosts += summary.total_supplier_costs;
    grossProfit += summary.gross_profit;
    otherExpensesLkr += summary.other_expenses_lkr;

    if (summary.has_incomplete_financials) {
      hasIncompleteRecords = true;
    }
  });

  const netProfit = grossProfit - totalAdSpendLkr - otherExpensesLkr;

  return {
    total_ad_spend_usd: Math.round(totalAdSpendUsd * 100) / 100,
    total_ad_spend_lkr: Math.round(totalAdSpendLkr * 100) / 100,
    total_confirmed_revenue: Math.round(totalConfirmedRevenue * 100) / 100,
    total_supplier_costs: Math.round(totalSupplierCosts * 100) / 100,
    gross_profit: Math.round(grossProfit * 100) / 100,
    other_expenses_lkr: Math.round(otherExpensesLkr * 100) / 100,
    net_profit: Math.round(netProfit * 100) / 100,
    total_campaigns_count: campaigns.length,
    running_campaigns_count: runningCount,
    closed_campaigns_count: closedCount,
    has_incomplete_records: hasIncompleteRecords,
  };
}

