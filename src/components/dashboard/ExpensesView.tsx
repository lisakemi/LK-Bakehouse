import React, { useState, useEffect } from 'react';
import { Expense } from '../../types/bakery.ts';
import { formatTzs, formatDate } from '../../utils/format.ts';
import {
  Plus,
  Receipt,
  DollarSign,
  Search,
  Filter,
  AlertCircle,
  Building,
  Zap,
  Droplets,
  Wifi,
  Truck,
  Users,
  Wrench,
  ShoppingBag,
  Info,
  RefreshCw,
} from 'lucide-react';
import { authFetch, getStaffAuthHeaders } from '../../lib/auth-client.ts';

export const ExpensesView: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Filters & Search
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [category, setCategory] = useState('utilities_energy');
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState('m_pesa');
  const [payeeVendor, setPayeeVendor] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/expenses', {
        headers: getStaffAuthHeaders(),
      });
      const data = await res.json();
      setExpenses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    setFormError(null);
    setIsSubmitting(true);

    try {
      const res = await authFetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          amountTzs: Number(amount),
          paymentMethod,
          payeeVendor: payeeVendor.trim() || undefined,
          reference: reference.trim() || undefined,
          notes: notes.trim() || undefined,
          expenseDate,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record expense');

      setShowModal(false);
      setAmount('');
      setPayeeVendor('');
      setReference('');
      setNotes('');
      fetchExpenses();
    } catch (err: any) {
      setFormError(err.message || 'Error recording expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = [
    { id: 'all', label: 'All Expenses' },
    { id: 'utilities_energy', label: 'Utilities (Electricity/Water)' },
    { id: 'premises_rent', label: 'Rent (Masaki)' },
    { id: 'salaries_wages', label: 'Salaries & Wages' },
    { id: 'equipment_maintenance', label: 'Equipment & Repairs' },
    { id: 'logistics_delivery', label: 'Transport & Fuel' },
    { id: 'packaging', label: 'Packaging' },
    { id: 'marketing_promotion', label: 'Marketing' },
    { id: 'other', label: 'Other Overheads' },
  ];

  // Filtering
  const filteredExpenses = expenses.filter((e) => {
    if (categoryFilter !== 'all' && (e.category || '').toLowerCase() !== categoryFilter.toLowerCase()) {
      return false;
    }
    if (searchQuery.trim()) {
      const s = searchQuery.toLowerCase();
      const matchVendor = (e.payeeVendor || '').toLowerCase().includes(s);
      const matchRef = (e.reference || '').toLowerCase().includes(s);
      const matchNotes = (e.notes || '').toLowerCase().includes(s);
      const matchCat = (e.category || '').toLowerCase().includes(s);
      if (!matchVendor && !matchRef && !matchNotes && !matchCat) return false;
    }
    return true;
  });

  const totalFilteredExpenses = filteredExpenses.reduce((acc, e) => acc + Number(e.amountTzs || 0), 0);
  const totalAllExpenses = expenses.reduce((acc, e) => acc + Number(e.amountTzs || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-white p-5 rounded-xl border border-[#E8DFD8] shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-display text-lg font-bold text-[#292524]">
            Operating Expenses & Overhead Ledger
          </h3>
          <p className="text-xs text-[#78716C] mt-0.5">
            Record commercial rent, electricity, water, internet, baker wages, repairs, and store overheads in Tanzanian Shillings.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-[#78716C] block tracking-wider">
              Total Logged Overheads
            </span>
            <span className="font-mono text-lg font-bold text-[#292524]">
              {formatTzs(totalAllExpenses)}
            </span>
          </div>

          <button
            onClick={() => fetchExpenses()}
            className="p-2 bg-white border border-[#E8DFD8] hover:bg-[#FAF7F2] text-[#57534E] rounded-lg text-xs font-medium transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              setFormError(null);
              setShowModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#C85A32] hover:bg-[#B34F2B] text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Operating Expense</span>
          </button>
        </div>
      </div>

      {/* Safeguard Notice: Distinguishing Operating Expenses from Supplier Purchases */}
      <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200/80 shadow-xs flex items-start gap-2.5 text-xs text-amber-900">
        <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold">Financial Integrity Safeguard:</strong> Supplier raw materials (flour, dairy, sugar, bulk packaging) must be recorded through the <strong>Purchasing (POs)</strong> module rather than logged as loose expenses. This ensures raw material costs flow authoritatively into inventory valuation and Cost of Goods Sold (COGS) without double-counting business expenses.
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-[#E8DFD8] shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search vendor, ref #, or notes..."
            className="w-full pl-9 pr-3 py-1.5 bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg text-xs focus:outline-hidden focus:border-[#C85A32]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {categories.slice(0, 6).map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                categoryFilter === cat.id
                  ? 'bg-[#292524] text-white'
                  : 'bg-[#FAF7F2] text-[#57534E] hover:bg-[#F0EAE1] border border-[#E8DFD8]'
              }`}
            >
              {cat.label}
            </button>
          ))}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2 py-1 bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg text-xs text-[#57534E]"
          >
            <option value="all">More Categories...</option>
            {categories.slice(6).map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-xl border border-[#E8DFD8] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7F2] text-[#78716C] uppercase tracking-wider font-semibold border-b border-[#E8DFD8]">
              <tr>
                <th className="py-3 px-4">Expense Date</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Payee / Vendor</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Reference Slip #</th>
                <th className="py-3 px-4">Responsible User</th>
                <th className="py-3 px-4">Notes</th>
                <th className="py-3 px-4 text-right">Amount (TSh)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EAE1]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-stone-400">
                    Loading operating expenses...
                  </td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-stone-400">
                    No operating expenses found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((e) => (
                  <tr key={e.id} className="hover:bg-[#FAF7F2] transition-colors">
                    <td className="py-3 px-4 font-mono text-[#78716C]">
                      {e.expenseDate}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-sm text-[10px] font-semibold bg-[#FAF7F2] border border-[#E8DFD8] text-[#292524] capitalize">
                        {(e.category || 'other').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#292524]">
                      {e.payeeVendor || '—'}
                    </td>
                    <td className="py-3 px-4 uppercase text-[#57534E] font-mono text-[11px]">
                      {e.paymentMethod.replace(/_/g, ' ')}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-[#78716C]">
                      {e.reference || '—'}
                    </td>
                    <td className="py-3 px-4 text-[#57534E]">
                      {e.authorizedByStaffName || 'Bakery Staff'}
                    </td>
                    <td className="py-3 px-4 text-[#78716C]">
                      {e.notes || '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#C85A32]">
                      {formatTzs(e.amountTzs)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Expense Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-[#E8DFD8] p-6 space-y-4">
            <div className="flex items-start justify-between pb-2 border-b border-[#E8DFD8]">
              <div>
                <h4 className="font-display text-base font-bold text-[#292524]">
                  Record Operating Expense
                </h4>
                <p className="text-xs text-[#78716C]">
                  Overhead costs will be posted directly to the financial ledger.
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-stone-400 hover:text-stone-900 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateExpense} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-[#78716C] uppercase mb-1">
                  Operating Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg"
                >
                  <option value="utilities_energy">Utilities & Energy (Electricity TANESCO / Water DAWASA)</option>
                  <option value="premises_rent">Premises Rent (Masaki Bakery Store)</option>
                  <option value="salaries_wages">Staff & Baker Wages</option>
                  <option value="equipment_maintenance">Oven & Equipment Maintenance / Repairs</option>
                  <option value="logistics_delivery">Transport, Delivery Logistics & Fuel</option>
                  <option value="packaging">Store Counter Packaging & Paper Bags</option>
                  <option value="marketing_promotion">Brand Marketing & Signage</option>
                  <option value="other">Other Operational Overheads</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#78716C] uppercase mb-1">
                  Amount in Tanzanian Shillings (TSh) *
                </label>
                <input
                  type="number"
                  step="1"
                  required
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. 150000"
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg font-mono text-sm font-bold text-[#292524] focus:outline-hidden focus:border-[#C85A32]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-[#78716C] uppercase mb-1">
                    Payee / Vendor Name
                  </label>
                  <input
                    type="text"
                    value={payeeVendor}
                    onChange={(e) => setPayeeVendor(e.target.value)}
                    placeholder="e.g. TANESCO, Landlord, Vodacom"
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#78716C] uppercase mb-1">
                    Payment Method *
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg"
                  >
                    <option value="m_pesa">Vodacom M-Pesa</option>
                    <option value="tigo_pesa">Tigo Pesa</option>
                    <option value="airtel_money">Airtel Money</option>
                    <option value="bank_transfer">Bank Transfer (CRDB / NMB)</option>
                    <option value="cash">Petty Cash</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-[#78716C] uppercase mb-1">
                    Receipt / Reference Number
                  </label>
                  <input
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="e.g. TAN-REC-8921"
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#78716C] uppercase mb-1">
                    Expense Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#78716C] uppercase mb-1">
                  Description & Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. October 2026 electricity token recharge for deck ovens"
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg text-xs"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 bg-[#FAF7F2] text-[#57534E] rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !amount}
                  className="flex-1 py-2 bg-[#C85A32] text-white rounded-lg font-semibold hover:bg-[#B34F2B] shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Recording...' : 'Commit Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
