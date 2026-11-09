import React, { useState, useEffect } from 'react';
import { FinancialSummary, FinancialTransaction, CustomerInvoice } from '../../types/bakery.ts';
import { formatTzs, formatDate } from '../../utils/format.ts';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  PieChart,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Layers,
  Building2,
  Clock,
  Info,
  Scale,
  RefreshCw,
  Receipt,
  CreditCard,
  Wallet,
  CheckCircle2,
  FileText,
  Calendar,
  History,
} from 'lucide-react';
import { authFetch, getStaffAuthHeaders } from '../../lib/auth-client.ts';

export const ReportsView: React.FC = () => {
  const [period, setPeriod] = useState<string>('this_month');
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [inventoryReport, setInventoryReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Active view tab inside Reports
  const [activeTab, setActiveTab] = useState<
    'pl_margins' | 'collections' | 'receivables' | 'payables' | 'cash_ledger' | 'inventory_wac'
  >('pl_margins');

  // Settle Invoice Modal State
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [settleAmount, setSettleAmount] = useState<number | ''>('');
  const [settleMethod, setSettleMethod] = useState('m_pesa');
  const [settleRef, setSettleRef] = useState('');
  const [isSubmittingSettle, setIsSubmittingSettle] = useState(false);
  const [settleError, setSettleError] = useState<string | null>(null);

  useEffect(() => {
    fetchFinancialData();
  }, [period]);

  const fetchFinancialData = async () => {
    setLoading(true);
    try {
      const staffHeaders = getStaffAuthHeaders();
      const [sumRes, txRes, invRes] = await Promise.all([
        fetch(`/api/financial/summary?period=${period}`, { headers: staffHeaders }),
        fetch('/api/financial/transactions?limit=100', { headers: staffHeaders }),
        fetch('/api/inventory/reports', { headers: staffHeaders }),
      ]);

      const sumData = await sumRes.json();
      const txData = await txRes.json();
      const invData = await invRes.json();

      setFinancialSummary(sumData);
      setTransactions(Array.isArray(txData) ? txData : []);
      setInventoryReport(invData);
    } catch (err) {
      console.error('Error fetching financial reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSettlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice || !settleAmount) return;
    setSettleError(null);
    setIsSubmittingSettle(true);

    try {
      const res = await authFetch(`/api/financial/invoices/${selectedInvoice.orderId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountTzs: Number(settleAmount),
          paymentMethod: settleMethod,
          transactionReference: settleRef.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record invoice settlement');

      setSelectedInvoice(null);
      fetchFinancialData();
    } catch (err: any) {
      setSettleError(err.message || 'Error settling invoice');
    } finally {
      setIsSubmittingSettle(false);
    }
  };

  if (loading || !financialSummary) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-xs text-stone-400 gap-2">
        <RefreshCw className="w-5 h-5 animate-spin text-[#C85A32]" />
        <span>Compiling financial reports, P&L statements, and ledger reconciliations...</span>
      </div>
    );
  }

  const {
    salesAndRevenue,
    paymentCollections,
    accountsReceivable,
    accountsPayable,
    operatingExpenses,
    profitabilityAnalysis,
    cashFlowSummary,
    periodComparison,
    accountingDisclaimer,
  } = financialSummary;

  return (
    <div className="space-y-6">
      {/* Top Banner & Period Selector */}
      <div className="bg-white p-5 rounded-xl border border-[#E8DFD8] shadow-xs flex flex-col lg:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-display text-lg font-bold text-[#292524]">
              Financial Management & Operating Performance
            </h3>
            <span className="text-[10px] font-mono bg-[#FAF7F2] border border-[#E8DFD8] text-[#78716C] px-2 py-0.5 rounded">
              TZS (Tanzanian Shillings)
            </span>
          </div>
          <p className="text-xs text-[#78716C] mt-0.5">
            Accrual vs. cash revenue tracking, gross margin estimations, supplier accounts payable, and customer receivables.
          </p>
        </div>

        {/* Period Filter Dropdown / Buttons */}
        <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
          <div className="flex bg-[#FAF7F2] p-1 rounded-lg border border-[#E8DFD8]">
            {[
              { id: 'today', label: 'Today' },
              { id: 'this_week', label: 'This Week' },
              { id: 'this_month', label: 'This Month' },
              { id: 'last_month', label: 'Last Month' },
              { id: 'this_year', label: 'This Year' },
              { id: 'all', label: 'All Time' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  period === p.id
                    ? 'bg-white text-[#292524] shadow-xs border border-[#E8DFD8]'
                    : 'text-[#78716C] hover:text-[#292524]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => fetchFinancialData()}
            className="p-2 bg-white border border-[#E8DFD8] hover:bg-[#FAF7F2] text-[#57534E] rounded-lg text-xs font-medium transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Accounting Methodology & Disclaimer Notice */}
      <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/80 shadow-xs flex items-start gap-2.5 text-xs text-stone-700">
        <Info className="w-4 h-4 text-[#C85A32] shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold text-[#292524]">{accountingDisclaimer}</p>
          <p className="text-[11px] text-[#78716C]">
            Sales revenue is strictly distinguished from net profit. Gross sales are computed using historical transaction prices frozen at order completion rather than current catalog prices. Cost of Goods Sold (COGS) is derived from standardized recipe ingredient consumption and Weighted Average Costing (WAC).
          </p>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap gap-1.5 bg-white p-1.5 rounded-xl border border-[#E8DFD8] shadow-xs">
        {[
          { id: 'pl_margins', label: 'P&L & Profitability', icon: TrendingUp },
          { id: 'collections', label: 'Payment Tender Collections', icon: Wallet },
          { id: 'receivables', label: `Customer Invoices (${accountsReceivable.unpaidInvoicesCount} Due)`, icon: FileText },
          { id: 'payables', label: 'Supplier Accounts Payable', icon: Building2 },
          { id: 'cash_ledger', label: 'Cash Flow & Audit Ledger', icon: History },
          { id: 'inventory_wac', label: 'Inventory & WAC Valuation', icon: Package },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-[#292524] text-white shadow-xs'
                  : 'text-[#78716C] hover:text-[#292524] hover:bg-[#FAF7F2]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: P&L AND PROFITABILITY ESTIMATIONS */}
      {activeTab === 'pl_margins' && (
        <div className="space-y-6">
          {/* Executive KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-[#E8DFD8] shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-[#78716C] uppercase tracking-wider block">
                Net Sales Revenue
              </span>
              <div className="text-2xl font-bold font-mono text-[#292524]">
                {formatTzs(salesAndRevenue.netSalesTzs)}
              </div>
              <span className="text-[11px] text-[#78716C] block">
                Gross {formatTzs(salesAndRevenue.grossSalesTzs)} - Disc {formatTzs(salesAndRevenue.discountTotalTzs)} - Ref {formatTzs(salesAndRevenue.refundTotalTzs)}
              </span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-[#E8DFD8] shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-[#78716C] uppercase tracking-wider block">
                Estimated COGS
              </span>
              <div className="text-2xl font-bold font-mono text-[#C85A32]">
                {formatTzs(profitabilityAnalysis.estimatedCogsTzs)}
              </div>
              <span className="text-[11px] text-[#78716C] block">
                Flour, butter, sugar, spices & direct baking costs
              </span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-[#E8DFD8] shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-[#78716C] uppercase tracking-wider block">
                Estimated Gross Profit
              </span>
              <div className="text-2xl font-bold font-mono text-emerald-700">
                {formatTzs(profitabilityAnalysis.estimatedGrossProfitTzs)}
              </div>
              <span className="text-[11px] text-emerald-800 font-semibold block">
                Gross Margin: {profitabilityAnalysis.grossMarginPercent}% of Net Sales
              </span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-[#E8DFD8] shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-[#78716C] uppercase tracking-wider block">
                Net Operating Profit (Estimate)
              </span>
              <div className={`text-2xl font-bold font-mono ${profitabilityAnalysis.estimatedNetOperatingProfitTzs >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                {formatTzs(profitabilityAnalysis.estimatedNetOperatingProfitTzs)}
              </div>
              <span className="text-[11px] text-[#78716C] block">
                After deducting {formatTzs(operatingExpenses.totalOperatingExpensesTzs)} overheads
              </span>
            </div>
          </div>

          {/* Revenue Recognition vs. Cash Actually Received */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-[#E8DFD8] p-6 shadow-xs space-y-4">
              <h4 className="font-display text-base font-bold text-[#292524] pb-2 border-b border-[#E8DFD8] flex items-center justify-between">
                <span>Revenue Recognized vs. Cash Collected</span>
                <span className="text-xs font-mono font-normal text-[#78716C]">Accrual vs. Cash Accounting</span>
              </h4>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E8DFD8] flex items-center justify-between">
                  <div>
                    <strong className="text-[#292524] block">Revenue Recognized (Accrual Basis):</strong>
                    <span className="text-[11px] text-[#78716C]">From {salesAndRevenue.completedSalesCount} completed sales orders</span>
                  </div>
                  <span className="font-mono text-base font-bold text-[#292524]">
                    {formatTzs(salesAndRevenue.revenueRecognizedTzs)}
                  </span>
                </div>

                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/80 flex items-center justify-between">
                  <div>
                    <strong className="text-emerald-950 block">Cash Actually Received (Cash Basis):</strong>
                    <span className="text-[11px] text-emerald-800">Verified receipts deposited into counter/bank</span>
                  </div>
                  <span className="font-mono text-base font-bold text-emerald-700">
                    {formatTzs(salesAndRevenue.cashActuallyReceivedTzs)}
                  </span>
                </div>

                {salesAndRevenue.unsettledAccrualTzs > 0 && (
                  <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/80 flex items-center justify-between">
                    <div>
                      <strong className="text-amber-950 block">Unsettled Accrual Revenue:</strong>
                      <span className="text-[11px] text-amber-800">Delivered orders with pending customer payment</span>
                    </div>
                    <span className="font-mono text-base font-bold text-amber-700">
                      {formatTzs(salesAndRevenue.unsettledAccrualTzs)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Period-over-Period Performance Comparison */}
            <div className="bg-white rounded-xl border border-[#E8DFD8] p-6 shadow-xs space-y-4">
              <h4 className="font-display text-base font-bold text-[#292524] pb-2 border-b border-[#E8DFD8] flex items-center justify-between">
                <span>Period Comparison</span>
                <span className="text-xs font-mono font-normal text-[#78716C]">vs. {periodComparison?.priorPeriodName}</span>
              </h4>

              {periodComparison ? (
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E8DFD8] flex items-center justify-between">
                    <div>
                      <span className="text-[#78716C] block">Net Sales Velocity:</span>
                      <span className="font-mono text-xs text-[#57534E]">Prior: {formatTzs(periodComparison.priorNetSalesTzs)}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-base font-bold text-[#292524] block">
                        {formatTzs(salesAndRevenue.netSalesTzs)}
                      </span>
                      <span className={`text-[11px] font-bold flex items-center justify-end gap-0.5 ${periodComparison.salesChangePercent >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                        {periodComparison.salesChangePercent >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                        {Math.abs(periodComparison.salesChangePercent)}%
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E8DFD8] flex items-center justify-between">
                    <div>
                      <span className="text-[#78716C] block">Operating Expenses:</span>
                      <span className="font-mono text-xs text-[#57534E]">Prior: {formatTzs(periodComparison.priorExpensesTzs)}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-base font-bold text-[#C85A32] block">
                        {formatTzs(operatingExpenses.totalOperatingExpensesTzs)}
                      </span>
                      <span className={`text-[11px] font-bold flex items-center justify-end gap-0.5 ${periodComparison.expensesChangePercent <= 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {periodComparison.expensesChangePercent <= 0 ? 'Decreased' : 'Increased'} by {Math.abs(periodComparison.expensesChangePercent)}%
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E8DFD8] flex items-center justify-between">
                    <div>
                      <span className="text-[#78716C] block">Net Operating Profit:</span>
                      <span className="font-mono text-xs text-[#57534E]">Prior: {formatTzs(periodComparison.priorNetProfitTzs)}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-base font-bold text-emerald-700 block">
                        {formatTzs(profitabilityAnalysis.estimatedNetOperatingProfitTzs)}
                      </span>
                      <span className="text-[11px] text-emerald-700 font-bold">
                        Margin: {profitabilityAnalysis.netMarginPercent}%
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-stone-400 py-6 text-center">No prior period comparison data available.</p>
              )}
            </div>
          </div>

          {/* Operating Overhead Breakdown */}
          <div className="bg-white rounded-xl border border-[#E8DFD8] p-6 shadow-xs space-y-4">
            <h4 className="font-display text-base font-bold text-[#292524] pb-2 border-b border-[#E8DFD8]">
              Operating Overheads by Category
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Object.entries(operatingExpenses.byCategory || {}).map(([cat, amount]) => (
                <div key={cat} className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E8DFD8]">
                  <span className="text-[11px] font-semibold text-[#78716C] uppercase block capitalize">
                    {cat.replace(/_/g, ' ')}
                  </span>
                  <span className="font-mono text-base font-bold text-[#292524] block mt-1">
                    {formatTzs(amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PAYMENT TENDER COLLECTIONS */}
      {activeTab === 'collections' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-[#E8DFD8] shadow-xs">
              <span className="text-[11px] font-bold text-[#78716C] uppercase tracking-wider block">
                Total Collected Tender
              </span>
              <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">
                {formatTzs(paymentCollections.totalCollectedTzs)}
              </div>
              <span className="text-[11px] text-[#78716C] block mt-0.5">
                Verified through cashier register and gateway confirm
              </span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-[#E8DFD8] shadow-xs">
              <span className="text-[11px] font-bold text-[#78716C] uppercase tracking-wider block">
                Verified Payment Transactions
              </span>
              <div className="text-2xl font-bold font-mono text-[#292524] mt-1">
                {paymentCollections.verifiedCount} receipts
              </div>
              <span className="text-[11px] text-[#78716C] block mt-0.5">
                Authoritative financial transactions
              </span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-[#E8DFD8] shadow-xs">
              <span className="text-[11px] font-bold text-[#78716C] uppercase tracking-wider block">
                Pending Gateway Verifications
              </span>
              <div className="text-2xl font-bold font-mono text-amber-700 mt-1">
                {paymentCollections.pendingCount} pending
              </div>
              <span className="text-[11px] text-[#78716C] block mt-0.5">
                Awaiting mobile money / card webhook verification
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#E8DFD8] p-6 shadow-xs space-y-4">
            <h4 className="font-display text-base font-bold text-[#292524] pb-2 border-b border-[#E8DFD8]">
              Collections Breakdown by Payment Tender
            </h4>

            <div className="space-y-3">
              {Object.entries(paymentCollections.byMethod || {}).map(([method, amount]) => {
                const total = paymentCollections.totalCollectedTzs;
                const percentage = total > 0 ? (amount / total) * 100 : 0;

                return (
                  <div key={method} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-[#292524]">
                      <span className="capitalize">{method.replace(/_/g, ' ')}</span>
                      <span className="font-mono">
                        {formatTzs(amount)} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-[#FAF7F2] h-2.5 rounded-full overflow-hidden border border-[#E8DFD8]">
                      <div
                        className="bg-[#C85A32] h-full rounded-full"
                        style={{ width: `${Math.min(100, percentage)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CUSTOMER ACCOUNTS RECEIVABLE / UNPAID INVOICES */}
      {activeTab === 'receivables' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-[#E8DFD8] shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-[#78716C] uppercase tracking-wider block">
                Total Outstanding Customer Receivables
              </span>
              <div className="text-2xl font-bold font-mono text-amber-700 mt-1">
                {formatTzs(accountsReceivable.totalOutstandingCustomerBalancesTzs)}
              </div>
              <span className="text-xs text-[#78716C] mt-0.5 block">
                Across {accountsReceivable.unpaidInvoicesCount} open customer invoices / orders
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#E8DFD8] overflow-hidden shadow-xs">
            <div className="p-4 border-b border-[#E8DFD8] bg-[#FAF7F2]">
              <h4 className="font-display text-sm font-bold text-[#292524]">
                Customer Receivables Ledger (Unpaid / Partially Paid Invoices)
              </h4>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F2] text-[#78716C] uppercase tracking-wider font-semibold border-b border-[#E8DFD8]">
                  <tr>
                    <th className="py-3 px-4">Invoice / Order #</th>
                    <th className="py-3 px-4">Customer Name</th>
                    <th className="py-3 px-4">Telephone</th>
                    <th className="py-3 px-4 text-right">Invoice Total</th>
                    <th className="py-3 px-4 text-right">Amount Paid</th>
                    <th className="py-3 px-4 text-right">Balance Due</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EAE1]">
                  {accountsReceivable.invoices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-stone-400">
                        No outstanding customer invoices found. All orders are settled.
                      </td>
                    </tr>
                  ) : (
                    accountsReceivable.invoices.map((inv) => (
                      <tr key={inv.orderId} className="hover:bg-[#FAF7F2] transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-[#292524]">
                          {inv.orderNumber}
                        </td>
                        <td className="py-3 px-4 font-semibold text-[#292524]">
                          {inv.customerName}
                        </td>
                        <td className="py-3 px-4 font-mono text-[#57534E]">
                          {inv.customerPhone}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-[#57534E]">
                          {formatTzs(inv.totalTzs)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-700">
                          {formatTzs(inv.amountPaidTzs)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-amber-700">
                          {formatTzs(inv.balanceDueTzs)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => {
                              setSelectedInvoice(inv);
                              setSettleAmount(inv.balanceDueTzs);
                              setSettleRef(`INV-PAY-${inv.orderNumber}`);
                              setSettleError(null);
                            }}
                            className="px-2.5 py-1 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded text-[11px] font-semibold border border-emerald-200 transition-colors"
                          >
                            Record Settlement
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SUPPLIER ACCOUNTS PAYABLE */}
      {activeTab === 'payables' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-[#E8DFD8] shadow-xs">
              <span className="text-[11px] font-bold text-[#78716C] uppercase tracking-wider block">
                Total Purchases Invoiced
              </span>
              <div className="text-2xl font-bold font-mono text-[#292524] mt-1">
                {formatTzs(accountsPayable.totalPurchasesBilledTzs)}
              </div>
              <span className="text-xs text-[#78716C] mt-0.5 block">
                Across {accountsPayable.supplierCount} approved vendors
              </span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-[#E8DFD8] shadow-xs">
              <span className="text-[11px] font-bold text-[#78716C] uppercase tracking-wider block">
                Disbursed Supplier Payments
              </span>
              <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">
                {formatTzs(accountsPayable.totalPurchasesPaidTzs)}
              </div>
              <span className="text-xs text-[#78716C] mt-0.5 block">
                Direct bank transfer and mobile payments
              </span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-[#E8DFD8] shadow-xs">
              <span className="text-[11px] font-bold text-[#78716C] uppercase tracking-wider block">
                Outstanding Supplier Balances
              </span>
              <div className="text-2xl font-bold font-mono text-amber-700 mt-1">
                {formatTzs(accountsPayable.totalOutstandingSupplierBalancesTzs)}
              </div>
              <span className="text-xs text-[#78716C] mt-0.5 block">
                Liabilities due to suppliers under credit terms
              </span>
            </div>
          </div>

          <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-200/80 text-xs text-amber-900 leading-relaxed">
            <strong>Accounting Distinction Notice:</strong> Recording a supplier invoice (purchase order) establishes an accounts payable liability. It is NOT logged as a cash expense until payment is disbursed. This guarantees that raw materials are neither double-counted as expenses nor omitted from cash flow.
          </div>
        </div>
      )}

      {/* TAB 5: CASH MOVEMENTS & AUDIT LEDGER */}
      {activeTab === 'cash_ledger' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-[#E8DFD8] shadow-xs">
              <span className="text-[11px] font-bold text-[#78716C] uppercase tracking-wider block">
                Total Cash Inflows
              </span>
              <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">
                +{formatTzs(cashFlowSummary.totalCashInflowTzs)}
              </div>
              <span className="text-xs text-[#78716C] mt-0.5 block">Verified customer tenders</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-[#E8DFD8] shadow-xs">
              <span className="text-[11px] font-bold text-[#78716C] uppercase tracking-wider block">
                Total Cash Outflows
              </span>
              <div className="text-2xl font-bold font-mono text-red-700 mt-1">
                -{formatTzs(cashFlowSummary.totalCashOutflowTzs)}
              </div>
              <span className="text-xs text-[#78716C] mt-0.5 block">Overheads + Supplier payouts + Refunds</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-[#E8DFD8] shadow-xs">
              <span className="text-[11px] font-bold text-[#78716C] uppercase tracking-wider block">
                Net Cash Movement
              </span>
              <div className={`text-2xl font-bold font-mono mt-1 ${cashFlowSummary.netCashMovementTzs >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                {formatTzs(cashFlowSummary.netCashMovementTzs)}
              </div>
              <span className="text-xs text-[#78716C] mt-0.5 block">Net operational liquidity shift</span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#E8DFD8] overflow-hidden shadow-xs">
            <div className="p-4 border-b border-[#E8DFD8] bg-[#FAF7F2] flex items-center justify-between">
              <h4 className="font-display text-sm font-bold text-[#292524]">
                Financial Transactions Ledger Stream ({transactions.length} entries)
              </h4>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F2] text-[#78716C] uppercase tracking-wider font-semibold border-b border-[#E8DFD8]">
                  <tr>
                    <th className="py-3 px-4">Transaction Code</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Payment Tender</th>
                    <th className="py-3 px-4">Order / PO Reference</th>
                    <th className="py-3 px-4">Recorded By</th>
                    <th className="py-3 px-4">Date / Time</th>
                    <th className="py-3 px-4 text-right">Amount (TSh)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EAE1]">
                  {transactions.map((tx) => {
                    const isInflow = tx.transactionType === 'sale_revenue';

                    return (
                      <tr key={tx.id} className="hover:bg-[#FAF7F2] transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-[#292524]">
                          {tx.transactionCode}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${
                            tx.transactionType === 'sale_revenue'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : tx.transactionType === 'refund'
                              ? 'bg-red-50 text-red-800 border-red-200'
                              : tx.transactionType === 'purchase'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}>
                            {tx.transactionType.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4 uppercase text-[#57534E] font-mono text-[11px]">
                          {tx.paymentMethod.replace(/_/g, ' ')}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-[#78716C]">
                          {tx.orderNumber || tx.poNumber || tx.externalReference || '—'}
                        </td>
                        <td className="py-3 px-4 text-[#57534E]">
                          {tx.recordedByStaffName || 'Staff'}
                        </td>
                        <td className="py-3 px-4 text-[#78716C] font-mono">
                          {formatDate(tx.createdAt)}
                        </td>
                        <td className={`py-3 px-4 text-right font-mono font-bold ${isInflow ? 'text-emerald-700' : 'text-stone-800'}`}>
                          {isInflow ? `+${formatTzs(tx.amountTzs)}` : `-${formatTzs(tx.amountTzs)}`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: INVENTORY & WAC VALUATION */}
      {activeTab === 'inventory_wac' && (
        <div className="space-y-6">
          <div className="bg-amber-50/70 p-5 rounded-xl border border-amber-200/80 shadow-xs space-y-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-amber-900">
              <Info className="w-4 h-4 text-amber-700" />
              <span>Inventory Costing Method: Weighted Average Cost (WAC)</span>
            </div>
            <p className="text-amber-900/90 leading-relaxed">
              LK Bakehouse applies the <strong>Weighted Average Costing (WAC)</strong> methodology to value all stored ingredients, packaging, and finished goods. Whenever new stock is received from a supplier purchase order, the authoritative standard unit cost is recalculated dynamically.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-[#E8DFD8] shadow-xs">
              <span className="text-[11px] font-bold text-[#78716C] uppercase tracking-wider block">
                Total Stock Valuation
              </span>
              <div className="text-xl font-mono font-bold text-[#292524] mt-1">
                {formatTzs(inventoryReport?.totalValuationTzs || 0)}
              </div>
              <span className="text-[10px] text-[#78716C] mt-0.5 block">
                Across {inventoryReport?.itemCount || 0} active inventory items
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#E8DFD8] shadow-xs">
              <span className="text-[11px] font-bold text-[#78716C] uppercase tracking-wider block">
                Raw Ingredients Value
              </span>
              <div className="text-xl font-mono font-bold text-[#C85A32] mt-1">
                {formatTzs(inventoryReport?.categoryValuation?.ingredient || 0)}
              </div>
              <span className="text-[10px] text-[#78716C] mt-0.5 block">
                Flour, dairy, yeast, sugar, spices
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#E8DFD8] shadow-xs">
              <span className="text-[11px] font-bold text-[#78716C] uppercase tracking-wider block">
                Packaging Material Value
              </span>
              <div className="text-xl font-mono font-bold text-[#57534E] mt-1">
                {formatTzs(inventoryReport?.categoryValuation?.packaging || 0)}
              </div>
              <span className="text-[10px] text-[#78716C] mt-0.5 block">
                Bread bags, cake boxes, labels
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#E8DFD8] shadow-xs">
              <span className="text-[11px] font-bold text-[#78716C] uppercase tracking-wider block">
                Finished Goods Value
              </span>
              <div className="text-xl font-mono font-bold text-emerald-700 mt-1">
                {formatTzs(inventoryReport?.categoryValuation?.finished_product || 0)}
              </div>
              <span className="text-[10px] text-[#78716C] mt-0.5 block">
                Baked goods ready in display case
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SETTLE INVOICE PAYMENT MODAL */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-xl shadow-2xl border border-[#E8DFD8] p-6 space-y-4">
            <div className="flex items-start justify-between pb-2 border-b border-[#E8DFD8]">
              <div>
                <h4 className="font-display text-base font-bold text-[#292524]">
                  Record Invoice Settlement
                </h4>
                <p className="text-xs text-[#78716C]">
                  Invoice #{selectedInvoice.orderNumber} • Balance: <strong>{formatTzs(selectedInvoice.balanceDueTzs)}</strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="text-stone-400 hover:text-stone-900 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            {settleError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{settleError}</span>
              </div>
            )}

            <form onSubmit={handleSettlePayment} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-[#78716C] uppercase mb-1">
                  Payment Amount (TSh) *
                </label>
                <input
                  type="number"
                  step="1"
                  required
                  max={selectedInvoice.balanceDueTzs}
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg font-mono text-sm font-bold text-[#292524]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#78716C] uppercase mb-1">
                  Payment Method *
                </label>
                <select
                  value={settleMethod}
                  onChange={(e) => setSettleMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg"
                >
                  <option value="m_pesa">Vodacom M-Pesa</option>
                  <option value="tigo_pesa">Tigo Pesa</option>
                  <option value="airtel_money">Airtel Money</option>
                  <option value="bank_transfer">Bank Transfer (CRDB/NMB)</option>
                  <option value="cash">Counter Cash</option>
                  <option value="card">Card Payment</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#78716C] uppercase mb-1">
                  Transaction Reference / Slip #
                </label>
                <input
                  type="text"
                  value={settleRef}
                  onChange={(e) => setSettleRef(e.target.value)}
                  placeholder="e.g. MPESA-TXN-9902"
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg font-mono"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="flex-1 py-2 bg-[#FAF7F2] text-[#57534E] rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSettle || !settleAmount}
                  className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold shadow-xs disabled:opacity-50"
                >
                  {isSubmittingSettle ? 'Recording...' : 'Confirm Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
