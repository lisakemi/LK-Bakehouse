import React, { useState, useEffect } from 'react';
import { Product, ProductVariant } from '../../types/bakery.ts';
import { formatTzs, formatDate } from '../../utils/format.ts';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Printer,
  CheckCircle,
  RotateCcw,
  User,
  CreditCard,
  UserPlus,
  Phone,
  DollarSign,
  AlertTriangle,
  RefreshCw,
  Receipt,
  FileText,
  Check,
  X,
  BarChart3,
  Clock,
  Tag,
  ShieldCheck,
  Layers,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';
import { authFetch, getStaffAuthHeaders } from '../../lib/auth-client.ts';

interface POSItem {
  product: Product;
  variant?: ProductVariant;
  quantity: number;
  unitPrice: number;
}

interface CustomerRecord {
  id: string;
  fullName: string;
  phoneNumber: string;
  email?: string;
  totalLifetimeOrders?: number;
  totalLifetimeSpendTzs?: string;
  notes?: string;
}

interface StaffUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

export const POSView: React.FC = () => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'register' | 'reports' | 'transactions'>('register');

  // Catalog state
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Staff state
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [selectedCashier, setSelectedCashier] = useState<StaffUser | null>(null);

  // POS Register Cart & Checkout State
  const [cart, setCart] = useState<POSItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);
  const [customerNameInput, setCustomerNameInput] = useState('Counter Walk-in Customer');
  const [customerPhoneInput, setCustomerPhoneInput] = useState('');
  
  // Customer search & modal state
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [customerSearchResults, setCustomerSearchResults] = useState<CustomerRecord[]>([]);
  const [searchingCustomers, setSearchingCustomers] = useState(false);
  
  // New customer form
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('+255 ');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustNotes, setNewCustNotes] = useState('');

  // Discount state
  const [discountType, setDiscountType] = useState<'none' | '5' | '10' | '15' | 'custom'>('none');
  const [customDiscountTzs, setCustomDiscountTzs] = useState<number | ''>('');
  const [discountReason, setDiscountReason] = useState<string>('');

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'm_pesa' | 'tigo_pesa' | 'airtel_money' | 'bank_transfer' | 'card'>('cash');
  const [amountTendered, setAmountTendered] = useState<number | ''>('');
  const [saleNotes, setSaleNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Completed Receipt Modal
  const [completedSale, setCompletedSale] = useState<any | null>(null);

  // Reports & Analytics State
  const [reportsData, setReportsData] = useState<any | null>(null);
  const [loadingReports, setLoadingReports] = useState(false);

  // Transactions History State
  const [transactionsList, setTransactionsList] = useState<any[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [transactionSearchQuery, setTransactionSearchQuery] = useState('');

  // Refund Modal State
  const [refundTargetOrder, setRefundTargetOrder] = useState<any | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [isRefunding, setIsRefunding] = useState(false);

  // Load initial data
  useEffect(() => {
    fetchInitialCatalogAndStaff();
  }, []);

  // Fetch reports when switching to reports tab
  useEffect(() => {
    if (activeTab === 'reports') {
      fetchReports();
    } else if (activeTab === 'transactions') {
      fetchTransactions();
    }
  }, [activeTab]);

  const fetchInitialCatalogAndStaff = async () => {
    setLoading(true);
    try {
      const [pRes, cRes, uRes] = await Promise.all([
        fetch('/api/products?available=true'),
        fetch('/api/categories'),
        fetch('/api/users', { headers: getStaffAuthHeaders() }).catch(() => null),
      ]);

      const pData = await pRes.json();
      const cData = await cRes.json();
      setProductsList(Array.isArray(pData) ? pData : []);
      setCategoriesList(Array.isArray(cData) ? cData : []);

      if (uRes && uRes.ok) {
        const uData = await uRes.json();
        const activeStaff = Array.isArray(uData) ? uData.filter((u: any) => u.isActive !== false) : [];
        setStaffList(activeStaff);
        // Default to a cashier or first staff
        const cashier = activeStaff.find((s: any) => s.role === 'cashier') || activeStaff[0];
        if (cashier) setSelectedCashier(cashier);
      }
    } catch (err) {
      console.error('POS fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    setLoadingReports(true);
    try {
      const res = await authFetch('/api/pos/reports');
      const data = await res.json();
      setReportsData(data);
    } catch (err) {
      console.error('Error fetching POS reports:', err);
    } finally {
      setLoadingReports(false);
    }
  };

  const fetchTransactions = async (search = transactionSearchQuery) => {
    setLoadingTransactions(true);
    try {
      const url = search.trim()
        ? `/api/pos/transactions?search=${encodeURIComponent(search.trim())}`
        : '/api/pos/transactions';
      const res = await authFetch(url);
      const data = await res.json();
      setTransactionsList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setTransactionsList([]);
    } finally {
      setLoadingTransactions(false);
    }
  };

  // Customer Autocomplete Search
  const searchCustomers = async (query: string) => {
    setCustomerSearchQuery(query);
    setSearchingCustomers(true);
    try {
      const res = await authFetch(`/api/pos/customers/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setCustomerSearchResults(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Customer search error:', err);
      setCustomerSearchResults([]);
    } finally {
      setSearchingCustomers(false);
    }
  };

  const handleSelectCustomer = (customer: CustomerRecord) => {
    setSelectedCustomer(customer);
    setCustomerNameInput(customer.fullName);
    setCustomerPhoneInput(customer.phoneNumber);
    setIsCustomerModalOpen(false);
  };

  const handleClearCustomer = () => {
    setSelectedCustomer(null);
    setCustomerNameInput('Counter Walk-in Customer');
    setCustomerPhoneInput('');
  };

  const handleCreateNewCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim() || !newCustPhone.trim()) {
      alert('Please provide customer name and phone number');
      return;
    }

    try {
      const res = await authFetch('/api/pos/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: newCustName.trim(),
          phoneNumber: newCustPhone.trim(),
          email: newCustEmail.trim() || null,
          notes: newCustNotes.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to register customer');

      handleSelectCustomer(data.customer);
      setIsNewCustomerModalOpen(false);
      setNewCustName('');
      setNewCustPhone('+255 ');
      setNewCustEmail('');
      setNewCustNotes('');
    } catch (err: any) {
      alert(err.message || 'Error creating customer');
    }
  };

  // Cart operations
  const addToCart = (product: Product, variant?: ProductVariant) => {
    const v = variant || (product.variants && product.variants.length > 0 ? product.variants[0] : undefined);
    const unitPrice = Number(product.basePriceTzs) + (v ? Number(v.priceAdjustmentTzs || 0) : 0);

    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (i) => i.product.id === product.id && i.variant?.id === v?.id
      );
      if (existingIdx !== -1) {
        const next = [...prev];
        next[existingIdx].quantity += 1;
        return next;
      }
      return [...prev, { product, variant: v, quantity: 1, unitPrice }];
    });
  };

  const updateQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      setCart((prev) => prev.filter((_, i) => i !== index));
    } else {
      setCart((prev) => {
        const next = [...prev];
        next[index].quantity = newQty;
        return next;
      });
    }
  };

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);

  let discountTzs = 0;
  let computedDiscountReason = discountReason;
  if (discountType === '5') {
    discountTzs = Math.round(subtotal * 0.05);
    computedDiscountReason = '5% Loyalty Discount';
  } else if (discountType === '10') {
    discountTzs = Math.round(subtotal * 0.10);
    computedDiscountReason = '10% Staff Privilege Discount';
  } else if (discountType === '15') {
    discountTzs = Math.round(subtotal * 0.15);
    computedDiscountReason = '15% VIP Patron Discount';
  } else if (discountType === 'custom') {
    discountTzs = Math.min(subtotal, Math.max(0, Number(customDiscountTzs) || 0));
    computedDiscountReason = discountReason || 'Custom POS Adjustment';
  }

  const totalDue = Math.max(0, subtotal - discountTzs);
  const tendered = typeof amountTendered === 'number' ? amountTendered : totalDue;
  const isPartialPayment = tendered < totalDue;
  const changeDue = isPartialPayment ? 0 : Math.max(0, tendered - totalDue);
  const outstandingBalance = isPartialPayment ? totalDue - tendered : 0;

  // Complete POS Sale
  const handleCompleteSale = async () => {
    if (cart.length === 0) return;
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const idempotencyKey = `pos_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

      const payload = {
        customerId: selectedCustomer?.id || null,
        customerName: customerNameInput.trim() || 'Counter Walk-in Customer',
        customerPhone: customerPhoneInput.trim() || 'Counter',
        items: cart.map((i) => ({
          productId: i.product.id,
          variantId: i.variant?.id,
          variantName: i.variant?.variantName || (i.variant as any)?.name || undefined,
          quantity: i.quantity,
        })),
        discountAmountTzs: discountTzs,
        discountReason: computedDiscountReason,
        paymentMethod,
        amountTenderedTzs: tendered,
        cashierStaffId: selectedCashier?.id || null,
        idempotencyKey,
        notes: saleNotes.trim() || undefined,
      };

      const res = await authFetch('/api/pos/sale', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-idempotency-key': idempotencyKey,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to complete sale');
      }

      setCompletedSale(data);
      // Reset ticket
      setCart([]);
      setDiscountType('none');
      setCustomDiscountTzs('');
      setDiscountReason('');
      setAmountTendered('');
      setSaleNotes('');
      handleClearCustomer();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error processing POS sale');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Refund Execution
  const handleExecuteRefund = async () => {
    if (!refundTargetOrder || !refundReason.trim()) {
      alert('Please enter a valid reason for this refund');
      return;
    }

    setIsRefunding(true);
    try {
      const res = await authFetch('/api/pos/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: refundTargetOrder.id,
          reason: refundReason.trim(),
          staffId: selectedCashier?.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to process refund');

      alert(`Refund processed: ${data.message}`);
      setRefundTargetOrder(null);
      setRefundReason('');
      fetchTransactions();
      if (activeTab === 'reports') fetchReports();
    } catch (err: any) {
      alert(err.message || 'Error executing refund');
    } finally {
      setIsRefunding(false);
    }
  };

  const filteredProducts = productsList.filter((p) => {
    const matchesCat = selectedCategory === 'all' || String(p.categoryId) === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] space-y-3 font-sans">
      {/* POS Top Control Bar */}
      <div className="bg-white rounded-xl border border-[#E8DFD8] p-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#C85A32]/10 border border-[#C85A32]/20 flex items-center justify-center text-[#C85A32]">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display text-sm font-bold text-[#292524] tracking-tight flex items-center gap-2">
              LK Bakehouse Masaki Register
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1" />
                Live DB
              </span>
            </h2>
            <p className="text-[11px] text-[#78716C]">
              Station #01 • Plot 42 Haile Selassie Rd
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-[#FAF7F2] p-1 rounded-lg border border-[#E8DFD8]">
          <button
            onClick={() => setActiveTab('register')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'register'
                ? 'bg-white text-[#C85A32] shadow-2xs border border-[#E8DFD8]'
                : 'text-[#57534E] hover:text-[#292524]'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Counter Register</span>
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'reports'
                ? 'bg-white text-[#C85A32] shadow-2xs border border-[#E8DFD8]'
                : 'text-[#57534E] hover:text-[#292524]'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Shift Reports</span>
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'transactions'
                ? 'bg-white text-[#C85A32] shadow-2xs border border-[#E8DFD8]'
                : 'text-[#57534E] hover:text-[#292524]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Audit & Refunds</span>
          </button>
        </div>

        {/* Active Cashier Selector */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[11px] text-[#78716C] font-medium">Logged Cashier:</span>
          <select
            value={selectedCashier?.id || ''}
            onChange={(e) => {
              const staff = staffList.find((s) => s.id === e.target.value);
              if (staff) setSelectedCashier(staff);
            }}
            className="px-2.5 py-1.5 bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg text-xs font-semibold text-[#292524] focus:outline-hidden focus:border-[#C85A32]"
          >
            {staffList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.fullName} ({s.role})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ERROR BANNER IF ANY */}
      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-red-500 hover:text-red-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. SALES REGISTER TAB */}
      {/* ========================================================================= */}
      {activeTab === 'register' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">
          {/* Left Column: Product Grid */}
          <div className="lg:col-span-7 flex flex-col bg-white rounded-xl border border-[#E8DFD8] overflow-hidden shadow-2xs">
            {/* Search & Category Filter Bar */}
            <div className="p-3.5 border-b border-[#E8DFD8] bg-[#FAF7F2] space-y-2.5">
              <div className="relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Quick search bakery items by name, sourdough, croissants..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#E8DFD8] rounded-lg focus:outline-hidden focus:border-[#C85A32] text-[#292524] placeholder-stone-400"
                />
              </div>

              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedCategory === 'all'
                      ? 'bg-[#C85A32] text-white shadow-2xs'
                      : 'bg-white border border-[#E8DFD8] text-[#57534E] hover:border-[#D5C7BD]'
                  }`}
                >
                  All Items
                </button>
                {categoriesList.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(String(cat.id))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                      selectedCategory === String(cat.id)
                        ? 'bg-[#C85A32] text-white shadow-2xs'
                        : 'bg-white border border-[#E8DFD8] text-[#57534E] hover:border-[#D5C7BD]'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Cards Grid */}
            <div className="flex-1 overflow-y-auto p-3.5">
              {loading ? (
                <div className="h-48 flex items-center justify-center text-xs text-stone-400">
                  <RefreshCw className="w-5 h-5 animate-spin mr-2 text-[#C85A32]" />
                  Loading fresh bakery items from database...
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-xs text-stone-400">
                  <p>No products found matching "{searchQuery}"</p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('all');
                    }}
                    className="mt-2 text-xs text-[#C85A32] font-semibold underline"
                  >
                    Reset filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {filteredProducts.map((prod) => (
                    <div
                      key={prod.id}
                      onClick={() => addToCart(prod)}
                      className="p-2.5 bg-[#FAF7F2] hover:bg-white rounded-xl border border-[#E8DFD8] hover:border-[#C85A32] transition-all cursor-pointer flex flex-col justify-between group shadow-2xs hover:shadow-sm"
                    >
                      <div className="aspect-4/3 rounded-lg overflow-hidden bg-white mb-2 border border-[#E8DFD8] relative">
                        <img
                          src={prod.imageUrl}
                          alt={prod.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {!prod.isAvailable && (
                          <div className="absolute inset-0 bg-stone-900/60 flex items-center justify-center text-[10px] font-bold text-white uppercase tracking-wider">
                            Out of Stock
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-display text-xs font-bold text-[#292524] line-clamp-1 group-hover:text-[#C85A32]">
                          {prod.name}
                        </h4>
                        <div className="flex items-center justify-between mt-1">
                          <span className="font-mono text-xs font-bold text-[#C85A32]">
                            {formatTzs(prod.basePriceTzs)}
                          </span>
                          <span className="text-[10px] text-stone-400">
                            {prod.leadTimeHours ? `${prod.leadTimeHours}h lead` : 'Ready'}
                          </span>
                        </div>
                      </div>

                      {prod.variants && prod.variants.length > 1 && (
                        <div className="mt-2 pt-1 border-t border-[#E8DFD8] flex gap-1 overflow-x-auto">
                          {prod.variants.map((v) => {
                            const vLabel = (v.variantName || (v as any).name || 'Standard').toString();
                            return (
                              <button
                                key={v.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addToCart(prod, v);
                                }}
                                className="px-1.5 py-0.5 text-[10px] bg-white border border-[#E8DFD8] hover:border-[#C85A32] rounded text-[#57534E] whitespace-nowrap"
                              >
                                {vLabel.split(' ')[0]}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Register Counter Ticket & Tender Terminal */}
          <div className="lg:col-span-5 flex flex-col bg-white rounded-xl border border-[#E8DFD8] overflow-hidden shadow-2xs">
            {/* Customer Association Bar */}
            <div className="p-3 border-b border-[#E8DFD8] bg-[#FAF7F2]">
              {selectedCustomer ? (
                <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-[#C85A32]/30 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#C85A32]/10 text-[#C85A32] flex items-center justify-center font-bold">
                      {selectedCustomer.fullName?.[0] || 'C'}
                    </div>
                    <div>
                      <div className="font-bold text-[#292524] flex items-center gap-1.5">
                        {selectedCustomer.fullName}
                        <span className="text-[10px] px-1.5 py-0.2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-normal">
                          {selectedCustomer.totalLifetimeOrders || 0} orders
                        </span>
                      </div>
                      <div className="text-[11px] text-[#78716C] font-mono">
                        {selectedCustomer.phoneNumber}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleClearCustomer}
                    className="p-1 text-stone-400 hover:text-stone-700 rounded"
                    title="Change Customer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-[#57534E]">
                    <User className="w-3.5 h-3.5 text-[#C85A32]" />
                    <span className="font-medium text-[#292524]">Counter Walk-in</span>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => {
                        searchCustomers('');
                        setIsCustomerModalOpen(true);
                      }}
                      className="px-2 py-1 bg-white border border-[#E8DFD8] hover:border-[#C85A32] rounded text-[11px] font-semibold text-[#57534E] flex items-center gap-1"
                    >
                      <Search className="w-3 h-3" />
                      <span>Find Customer</span>
                    </button>
                    <button
                      onClick={() => setIsNewCustomerModalOpen(true)}
                      className="px-2 py-1 bg-[#C85A32]/10 hover:bg-[#C85A32]/20 text-[#C85A32] border border-[#C85A32]/30 rounded text-[11px] font-semibold flex items-center gap-1"
                    >
                      <UserPlus className="w-3 h-3" />
                      <span>+ New</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-xs text-stone-400 space-y-1 py-12">
                  <Receipt className="w-8 h-8 text-stone-300" />
                  <span className="font-semibold text-stone-500">Register ticket is empty</span>
                  <span className="text-[11px] text-stone-400">Click bakery items on the left to add to sale</span>
                </div>
              ) : (
                cart.map((item, idx) => (
                  <div
                    key={`${item.product.id}-${item.variant?.id || 'default'}-${idx}`}
                    className="p-2.5 bg-[#FAF7F2] rounded-lg border border-[#E8DFD8] flex items-center justify-between gap-2.5 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-[#292524] truncate">
                        {item.product.name}
                      </div>
                      {item.variant && (
                        <div className="text-[11px] text-[#78716C] truncate">
                          {item.variant.variantName || (item.variant as any).name || 'Standard'}
                        </div>
                      )}
                      <div className="font-mono text-[#78716C] text-[11px]">
                        {formatTzs(item.unitPrice)} ea
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center border border-[#E8DFD8] rounded-md bg-white">
                        <button
                          onClick={() => updateQuantity(idx, item.quantity - 1)}
                          className="p-1 text-stone-600 hover:text-stone-900"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 font-mono font-bold text-[#292524]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(idx, item.quantity + 1)}
                          className="p-1 text-stone-600 hover:text-stone-900"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="font-mono font-bold text-[#292524] w-20 text-right">
                        {formatTzs(item.unitPrice * item.quantity)}
                      </span>

                      <button
                        onClick={() => updateQuantity(idx, 0)}
                        className="text-stone-400 hover:text-red-600 p-1"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Financials & Checkout Bottom Panel */}
            <div className="p-3.5 border-t border-[#E8DFD8] bg-[#FAF7F2] space-y-2.5">
              {/* Discount Selector */}
              <div>
                <div className="flex items-center justify-between text-[11px] font-bold text-[#292524] mb-1">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3 h-3 text-[#C85A32]" />
                    Apply Authorized Discount
                  </span>
                  {discountTzs > 0 && (
                    <span className="font-mono text-emerald-700">-{formatTzs(discountTzs)}</span>
                  )}
                </div>
                <div className="grid grid-cols-5 gap-1 text-[11px]">
                  {[
                    { id: 'none', label: 'None (0%)' },
                    { id: '5', label: 'Loyalty 5%' },
                    { id: '10', label: 'Staff 10%' },
                    { id: '15', label: 'VIP 15%' },
                    { id: 'custom', label: 'Custom' },
                  ].map((d) => (
                    <button
                      key={d.id}
                      onClick={() => setDiscountType(d.id as any)}
                      className={`py-1 rounded text-center font-medium transition-colors ${
                        discountType === d.id
                          ? 'bg-[#292524] text-white shadow-2xs'
                          : 'bg-white border border-[#E8DFD8] text-[#57534E] hover:border-[#D5C7BD]'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>

                {discountType === 'custom' && (
                  <div className="flex gap-2 mt-1.5">
                    <input
                      type="number"
                      placeholder="Amount in TSh"
                      value={customDiscountTzs}
                      onChange={(e) => setCustomDiscountTzs(Math.max(0, Number(e.target.value) || 0))}
                      className="w-1/2 px-2 py-1 text-xs font-mono bg-white border border-[#E8DFD8] rounded focus:outline-hidden focus:border-[#C85A32]"
                    />
                    <input
                      type="text"
                      placeholder="Discount reason (required)"
                      value={discountReason}
                      onChange={(e) => setDiscountReason(e.target.value)}
                      className="w-1/2 px-2 py-1 text-xs bg-white border border-[#E8DFD8] rounded focus:outline-hidden focus:border-[#C85A32]"
                    />
                  </div>
                )}
              </div>

              {/* Subtotal, Discount & Total Row */}
              <div className="space-y-1 text-xs text-[#57534E] pt-1 border-t border-[#E8DFD8]">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-mono font-medium text-[#292524]">{formatTzs(subtotal)}</span>
                </div>
                {discountTzs > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount ({computedDiscountReason}):</span>
                    <span className="font-mono">-{formatTzs(discountTzs)}</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline pt-1 border-t border-[#E8DFD8]">
                  <span className="text-sm font-bold text-[#292524]">Total Payable:</span>
                  <span className="font-mono text-lg font-bold text-[#C85A32]">{formatTzs(totalDue)}</span>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-[11px] font-bold text-[#292524] uppercase tracking-wider mb-1">
                  Payment Method
                </label>
                <div className="grid grid-cols-6 gap-1 text-[11px]">
                  {[
                    { id: 'cash', label: 'Cash' },
                    { id: 'm_pesa', label: 'M-Pesa' },
                    { id: 'tigo_pesa', label: 'Tigo' },
                    { id: 'airtel_money', label: 'Airtel' },
                    { id: 'card', label: 'Card' },
                    { id: 'bank_transfer', label: 'Bank' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setPaymentMethod(m.id as any)}
                      className={`py-1.5 rounded text-center transition-colors font-semibold ${
                        paymentMethod === m.id
                          ? 'bg-[#C85A32] text-white shadow-2xs'
                          : 'bg-white border border-[#E8DFD8] text-[#57534E] hover:border-[#D5C7BD]'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cash Quick Denominations & Amount Received */}
              <div className="space-y-1.5 pt-1 border-t border-[#E8DFD8]">
                {paymentMethod === 'cash' && (
                  <div className="flex gap-1 text-xs">
                    {[10000, 20000, 50000, 100000].map((denom) => (
                      <button
                        key={denom}
                        onClick={() => setAmountTendered(denom)}
                        className="flex-1 py-1 bg-white border border-[#E8DFD8] rounded text-[11px] font-mono text-[#57534E] hover:border-[#C85A32]"
                      >
                        {denom / 1000}k
                      </button>
                    ))}
                    <button
                      onClick={() => setAmountTendered(totalDue)}
                      className="flex-1 py-1 bg-white border border-[#E8DFD8] rounded text-[11px] font-mono text-[#C85A32] font-semibold"
                    >
                      Exact
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#78716C] font-medium">Amount Received / Tendered (TSh):</span>
                  <input
                    type="number"
                    value={amountTendered}
                    onChange={(e) => setAmountTendered(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder={String(totalDue)}
                    className="w-32 px-2.5 py-1 text-right font-mono text-xs font-bold bg-white border border-[#E8DFD8] rounded focus:outline-hidden focus:border-[#C85A32]"
                  />
                </div>

                {/* Change or Partial Balance Notice */}
                {isPartialPayment ? (
                  <div className="p-2 bg-amber-50 border border-amber-300 rounded-lg flex items-center justify-between text-xs text-amber-900">
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Partial Payment (Balance Due):</span>
                    </div>
                    <span className="font-mono font-bold text-amber-800">
                      {formatTzs(outstandingBalance)}
                    </span>
                  </div>
                ) : changeDue > 0 ? (
                  <div className="p-2 bg-emerald-50 border border-emerald-300 rounded-lg flex items-center justify-between text-xs text-emerald-900">
                    <span className="font-medium">Change to Return:</span>
                    <span className="font-mono text-sm font-bold text-emerald-800">
                      {formatTzs(changeDue)}
                    </span>
                  </div>
                ) : null}
              </div>

              {/* Complete Sale Button */}
              <button
                onClick={handleCompleteSale}
                disabled={cart.length === 0 || isSubmitting}
                className="w-full py-3 bg-[#C85A32] hover:bg-[#B34F2B] text-white font-semibold text-xs rounded-lg transition-all shadow-sm active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Committing Sale to Database...</span>
                  </>
                ) : (
                  <>
                    <Receipt className="w-4 h-4" />
                    <span>
                      Complete Sale ({formatTzs(tendered)}) & Print Receipt
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SHIFT REPORTS & ANALYTICS TAB */}
      {/* ========================================================================= */}
      {activeTab === 'reports' && (
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {loadingReports ? (
            <div className="h-64 flex items-center justify-center text-xs text-stone-400">
              <RefreshCw className="w-5 h-5 animate-spin mr-2 text-[#C85A32]" />
              Compiling real-time shift analytics from PostgreSQL database...
            </div>
          ) : reportsData ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-white rounded-xl border border-[#E8DFD8] shadow-2xs">
                  <div className="text-[11px] font-semibold text-[#78716C] uppercase tracking-wider">
                    Today's POS Revenue
                  </div>
                  <div className="font-mono text-2xl font-bold text-[#C85A32] mt-1">
                    {formatTzs(reportsData.today?.totalRevenueTzs || 0)}
                  </div>
                  <div className="text-[11px] text-stone-500 mt-1">
                    {reportsData.today?.transactionCount || 0} sales recorded today
                  </div>
                </div>

                <div className="p-4 bg-white rounded-xl border border-[#E8DFD8] shadow-2xs">
                  <div className="text-[11px] font-semibold text-[#78716C] uppercase tracking-wider">
                    Average Ticket Size
                  </div>
                  <div className="font-mono text-2xl font-bold text-[#292524] mt-1">
                    {formatTzs(reportsData.today?.averageTicketTzs || 0)}
                  </div>
                  <div className="text-[11px] text-stone-500 mt-1">
                    Per counter checkout
                  </div>
                </div>

                <div className="p-4 bg-white rounded-xl border border-[#E8DFD8] shadow-2xs">
                  <div className="text-[11px] font-semibold text-[#78716C] uppercase tracking-wider">
                    Total Refunds Processed
                  </div>
                  <div className="font-mono text-2xl font-bold text-red-600 mt-1">
                    {formatTzs(reportsData.refunds?.totalTzs || 0)}
                  </div>
                  <div className="text-[11px] text-stone-500 mt-1">
                    {reportsData.refunds?.count || 0} refunded transactions
                  </div>
                </div>

                <div className="p-4 bg-white rounded-xl border border-[#E8DFD8] shadow-2xs">
                  <div className="text-[11px] font-semibold text-[#78716C] uppercase tracking-wider">
                    Outstanding Customer Balances
                  </div>
                  <div className="font-mono text-2xl font-bold text-amber-600 mt-1">
                    {formatTzs(reportsData.outstandingBalances?.totalOutstandingTzs || 0)}
                  </div>
                  <div className="text-[11px] text-stone-500 mt-1">
                    {reportsData.outstandingBalances?.records?.length || 0} partially paid orders
                  </div>
                </div>
              </div>

              {/* Two columns: Cashiers & Payment Methods */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Sales by Cashier */}
                <div className="bg-white rounded-xl border border-[#E8DFD8] p-4 shadow-2xs">
                  <h3 className="font-display text-sm font-bold text-[#292524] mb-3 flex items-center justify-between">
                    <span>Sales by Cashier</span>
                    <span className="text-[11px] font-normal text-stone-500">Grouped by Staff Profile</span>
                  </h3>
                  <div className="space-y-2">
                    {reportsData.salesByCashier && reportsData.salesByCashier.length > 0 ? (
                      reportsData.salesByCashier.map((c: any, i: number) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-2.5 bg-[#FAF7F2] rounded-lg border border-[#E8DFD8] text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-[#C85A32]/10 text-[#C85A32] flex items-center justify-center font-bold">
                              {c.cashier_name?.[0] || 'S'}
                            </div>
                            <div>
                              <div className="font-semibold text-[#292524]">{c.cashier_name}</div>
                              <div className="text-[10px] text-stone-500">{c.transaction_count} sales</div>
                            </div>
                          </div>
                          <span className="font-mono font-bold text-[#C85A32]">
                            {formatTzs(c.total_sales_tzs)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-xs text-stone-400">
                        No cashier sales recorded yet.
                      </div>
                    )}
                  </div>
                </div>

                {/* Sales by Payment Method */}
                <div className="bg-white rounded-xl border border-[#E8DFD8] p-4 shadow-2xs">
                  <h3 className="font-display text-sm font-bold text-[#292524] mb-3 flex items-center justify-between">
                    <span>Sales by Payment Method</span>
                    <span className="text-[11px] font-normal text-stone-500">Financial Ledger Breakdown</span>
                  </h3>
                  <div className="space-y-2">
                    {reportsData.salesByPaymentMethod && reportsData.salesByPaymentMethod.length > 0 ? (
                      reportsData.salesByPaymentMethod.map((pm: any, i: number) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-2.5 bg-[#FAF7F2] rounded-lg border border-[#E8DFD8] text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded font-mono font-bold uppercase text-[10px] bg-stone-200 text-stone-800">
                              {pm.payment_method}
                            </span>
                            <span className="text-stone-500 text-[11px]">
                              {pm.count} transactions
                            </span>
                          </div>
                          <span className="font-mono font-bold text-[#292524]">
                            {formatTzs(pm.total_tzs)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-xs text-stone-400">
                        No payment records yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Outstanding Customer Balances Table */}
              <div className="bg-white rounded-xl border border-[#E8DFD8] p-4 shadow-2xs">
                <h3 className="font-display text-sm font-bold text-[#292524] mb-3 flex items-center justify-between">
                  <span>Outstanding Customer Balances (Partially Paid Sales)</span>
                  <button
                    onClick={fetchReports}
                    className="text-xs text-[#C85A32] hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> Refresh
                  </button>
                </h3>
                {reportsData.outstandingBalances?.records?.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-[#FAF7F2] text-[#78716C] uppercase text-[10px] font-bold">
                        <tr>
                          <th className="p-2.5">Order Number</th>
                          <th className="p-2.5">Customer</th>
                          <th className="p-2.5">Phone</th>
                          <th className="p-2.5">Sale Total</th>
                          <th className="p-2.5">Amount Paid</th>
                          <th className="p-2.5">Balance Due</th>
                          <th className="p-2.5">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E8DFD8]">
                        {reportsData.outstandingBalances.records.map((r: any, idx: number) => (
                          <tr key={idx} className="hover:bg-amber-50/50">
                            <td className="p-2.5 font-mono font-bold text-[#292524]">
                              {r.order_number}
                            </td>
                            <td className="p-2.5 font-semibold text-[#292524]">
                              {r.customer_name}
                            </td>
                            <td className="p-2.5 text-stone-600 font-mono">
                              {r.customer_phone}
                            </td>
                            <td className="p-2.5 font-mono">{formatTzs(r.total_amount_tzs)}</td>
                            <td className="p-2.5 font-mono text-emerald-700">{formatTzs(r.amount_paid_tzs)}</td>
                            <td className="p-2.5 font-mono font-bold text-amber-700">
                              {formatTzs(r.balance_due_tzs)}
                            </td>
                            <td className="p-2.5 text-stone-500 text-[11px]">
                              {formatDate(r.created_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-stone-400">
                    No outstanding customer balances currently pending.
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. TRANSACTION HISTORY & REFUNDS TAB */}
      {/* ========================================================================= */}
      {activeTab === 'transactions' && (
        <div className="flex-1 bg-white rounded-xl border border-[#E8DFD8] flex flex-col overflow-hidden shadow-2xs">
          {/* Filter Bar */}
          <div className="p-3.5 border-b border-[#E8DFD8] bg-[#FAF7F2] flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={transactionSearchQuery}
                onChange={(e) => {
                  setTransactionSearchQuery(e.target.value);
                  fetchTransactions(e.target.value);
                }}
                placeholder="Search transactions by POS order number, customer name, or phone..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-[#E8DFD8] rounded-lg focus:outline-hidden focus:border-[#C85A32] text-[#292524]"
              />
            </div>
            <button
              onClick={() => fetchTransactions()}
              className="px-3 py-1.5 bg-white border border-[#E8DFD8] hover:border-[#C85A32] rounded-lg text-xs font-semibold text-[#57534E] flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          {/* Transactions Table */}
          <div className="flex-1 overflow-y-auto">
            {loadingTransactions ? (
              <div className="h-64 flex items-center justify-center text-xs text-stone-400">
                <RefreshCw className="w-5 h-5 animate-spin mr-2 text-[#C85A32]" />
                Loading POS transactions from database...
              </div>
            ) : transactionsList.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-xs text-stone-400">
                <FileText className="w-8 h-8 text-stone-300 mb-1" />
                <p>No POS transactions found.</p>
              </div>
            ) : (
              <table className="w-full text-xs text-left">
                <thead className="bg-[#FAF7F2] text-[#78716C] uppercase text-[10px] font-bold sticky top-0 border-b border-[#E8DFD8]">
                  <tr>
                    <th className="p-3">Order Number</th>
                    <th className="p-3">Date & Time</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Cashier</th>
                    <th className="p-3">Payment</th>
                    <th className="p-3 text-right">Total TZS</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8DFD8]">
                  {transactionsList.map((tx) => (
                    <tr key={tx.id} className="hover:bg-[#FAF7F2]/50">
                      <td className="p-3 font-mono font-bold text-[#292524]">
                        {tx.order_number}
                      </td>
                      <td className="p-3 text-stone-500 text-[11px]">
                        {formatDate(tx.created_at)}
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-[#292524]">{tx.customer_name}</div>
                        <div className="text-[10px] text-stone-500 font-mono">{tx.customer_phone}</div>
                      </td>
                      <td className="p-3 text-stone-700">
                        {tx.cashier_name || 'Counter Cashier'}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded font-mono uppercase text-[10px] font-semibold bg-stone-100 text-stone-800 border border-stone-200">
                          {tx.payment_method || 'cash'}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-bold text-right text-[#292524]">
                        {formatTzs(tx.total_amount_tzs)}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                            tx.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : tx.status === 'refunded'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : tx.status === 'partially_paid'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-stone-100 text-stone-600'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-1">
                        {tx.status !== 'refunded' && tx.status !== 'cancelled' && (
                          <button
                            onClick={() => {
                              setRefundTargetOrder(tx);
                              setRefundReason('');
                            }}
                            className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded text-[11px] font-semibold transition-colors"
                          >
                            Refund
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. CUSTOMER AUTOCOMPLETE SEARCH MODAL */}
      {/* ========================================================================= */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-[#E8DFD8] bg-[#FAF7F2] flex items-center justify-between">
              <h3 className="font-display text-sm font-bold text-[#292524] flex items-center gap-2">
                <Search className="w-4 h-4 text-[#C85A32]" />
                Select Customer for Sale
              </h3>
              <button
                onClick={() => setIsCustomerModalOpen(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 border-b border-[#E8DFD8]">
              <input
                type="text"
                autoFocus
                placeholder="Search by customer phone (+255) or name..."
                value={customerSearchQuery}
                onChange={(e) => searchCustomers(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-[#E8DFD8] rounded-lg focus:outline-hidden focus:border-[#C85A32]"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {searchingCustomers ? (
                <div className="p-6 text-center text-xs text-stone-400">Searching customers...</div>
              ) : customerSearchResults.length === 0 ? (
                <div className="p-6 text-center text-xs text-stone-400 space-y-2">
                  <p>No customers found matching "{customerSearchQuery}"</p>
                  <button
                    onClick={() => {
                      setIsCustomerModalOpen(false);
                      setIsNewCustomerModalOpen(true);
                      setNewCustPhone(customerSearchQuery.startsWith('+') ? customerSearchQuery : '+255 ');
                    }}
                    className="text-xs font-semibold text-[#C85A32] underline"
                  >
                    + Register "{customerSearchQuery}" as New Customer
                  </button>
                </div>
              ) : (
                customerSearchResults.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => handleSelectCustomer(c)}
                    className="p-2.5 bg-[#FAF7F2] hover:bg-[#C85A32]/5 hover:border-[#C85A32] rounded-lg border border-[#E8DFD8] transition-all cursor-pointer flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-[#292524]">{c.fullName}</div>
                      <div className="text-[11px] text-[#78716C] font-mono">{c.phoneNumber}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] px-1.5 py-0.5 bg-white border border-stone-200 rounded text-stone-600 font-mono">
                        {c.totalLifetimeOrders || 0} orders
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. NEW CUSTOMER QUICK REGISTRATION MODAL */}
      {/* ========================================================================= */}
      {isNewCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
          <form
            onSubmit={handleCreateNewCustomer}
            className="w-full max-w-sm bg-white rounded-xl shadow-2xl border border-stone-200 p-5 space-y-3 text-xs"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#E8DFD8]">
              <h3 className="font-display text-sm font-bold text-[#292524] flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#C85A32]" />
                Register Customer at Counter
              </h3>
              <button
                type="button"
                onClick={() => setIsNewCustomerModalOpen(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#292524] mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={newCustName}
                onChange={(e) => setNewCustName(e.target.value)}
                placeholder="e.g. Lisa Rutasitara"
                className="w-full px-3 py-1.5 bg-white border border-[#E8DFD8] rounded-lg focus:outline-hidden focus:border-[#C85A32]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#292524] mb-1">
                Phone Number (Tanzania) *
              </label>
              <input
                type="text"
                required
                value={newCustPhone}
                onChange={(e) => setNewCustPhone(e.target.value)}
                placeholder="+255 754 123 456"
                className="w-full px-3 py-1.5 font-mono bg-white border border-[#E8DFD8] rounded-lg focus:outline-hidden focus:border-[#C85A32]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#292524] mb-1">
                Email Address (Optional)
              </label>
              <input
                type="email"
                value={newCustEmail}
                onChange={(e) => setNewCustEmail(e.target.value)}
                placeholder="lisa@example.co.tz"
                className="w-full px-3 py-1.5 bg-white border border-[#E8DFD8] rounded-lg focus:outline-hidden focus:border-[#C85A32]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#292524] mb-1">
                Notes / Preferences
              </label>
              <textarea
                rows={2}
                value={newCustNotes}
                onChange={(e) => setNewCustNotes(e.target.value)}
                placeholder="Prefers sourdough sliced, allergic to peanuts, etc."
                className="w-full px-3 py-1.5 bg-white border border-[#E8DFD8] rounded-lg focus:outline-hidden focus:border-[#C85A32]"
              />
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setIsNewCustomerModalOpen(false)}
                className="flex-1 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 bg-[#C85A32] hover:bg-[#B34F2B] text-white rounded-lg font-semibold"
              >
                Save & Link Customer
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. REFUND & CORRECTION MODAL */}
      {/* ========================================================================= */}
      {refundTargetOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-xl shadow-2xl border border-stone-200 p-5 space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-red-200">
              <h3 className="font-display text-sm font-bold text-red-700 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-red-600" />
                Issue Refund / Correction
              </h3>
              <button
                onClick={() => setRefundTargetOrder(null)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-2.5 bg-red-50 rounded-lg border border-red-200 text-red-900 space-y-1">
              <div className="flex justify-between font-bold">
                <span>Order: {refundTargetOrder.order_number}</span>
                <span>{formatTzs(refundTargetOrder.total_amount_tzs)}</span>
              </div>
              <div className="text-[11px] text-red-700">
                Customer: {refundTargetOrder.customer_name} ({refundTargetOrder.customer_phone})
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#292524] mb-1">
                Reason for Refund / Correction *
              </label>
              <textarea
                required
                rows={3}
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Specify reason (e.g., Customer return, wrong item rung up, damaged pastry)..."
                className="w-full px-3 py-1.5 bg-white border border-[#E8DFD8] rounded-lg focus:outline-hidden focus:border-red-500"
              />
            </div>

            <div className="text-[10px] text-stone-500">
              * This will reverse the revenue in the financial ledger and update the audit log with your staff ID. Original transaction history is permanently preserved.
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setRefundTargetOrder(null)}
                className="flex-1 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteRefund}
                disabled={isRefunding || !refundReason.trim()}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold disabled:opacity-50"
              >
                {isRefunding ? 'Reversing...' : 'Confirm Refund'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. PRINTABLE RECEIPT MODAL */}
      {/* ========================================================================= */}
      {completedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-xl shadow-2xl border border-stone-200 p-6 space-y-3.5 font-mono text-xs">
            {/* Header */}
            <div className="text-center space-y-1 pb-3 border-b border-dashed border-stone-300">
              <h3 className="font-display text-lg font-bold text-stone-900 tracking-tight">
                LK BAKEHOUSE
              </h3>
              <p className="text-[11px] text-stone-600 font-sans">Artisanal Bakery & Espresso</p>
              <p className="text-[10px] text-stone-500">Plot 42, Haile Selassie Rd, Masaki</p>
              <p className="text-[10px] text-stone-500">Dar es Salaam, Tanzania • Tel: +255 754 889 900</p>
              <div className="pt-2 text-[10px] text-stone-500 space-y-0.5">
                <div>RECEIPT: <span className="font-bold text-stone-900">{completedSale.order.orderNumber}</span></div>
                <div>DATE: {new Date(completedSale.timestamp || Date.now()).toLocaleString('en-GB')}</div>
                <div>CASHIER: {completedSale.cashier?.name || 'Counter Staff'}</div>
                <div>CUSTOMER: {completedSale.customer?.name || completedSale.order.customerName}</div>
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-1.5 py-2 border-b border-dashed border-stone-300">
              <div className="flex justify-between font-bold text-[11px] text-stone-700 pb-1 border-b border-stone-200">
                <span>ITEM</span>
                <span>TOTAL</span>
              </div>
              {completedSale.items.map((i: any, idx: number) => (
                <div key={idx} className="flex justify-between text-[11px]">
                  <div className="truncate pr-2">
                    <span>{i.quantity}x {i.productName}</span>
                    {i.variantName && (
                      <span className="text-[10px] text-stone-500 block">({i.variantName})</span>
                    )}
                  </div>
                  <span className="shrink-0">{formatTzs(i.lineTotalTzs)}</span>
                </div>
              ))}
            </div>

            {/* Totals Breakdown */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatTzs(completedSale.order.subtotalTzs)}</span>
              </div>
              {Number(completedSale.order.discountTzs) > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Discount:</span>
                  <span>-{formatTzs(completedSale.order.discountTzs)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm text-stone-900 pt-1 border-t border-stone-200">
                <span>TOTAL PAYABLE:</span>
                <span>{formatTzs(completedSale.order.totalTzs)}</span>
              </div>
              <div className="flex justify-between text-stone-700 pt-1">
                <span>Paid via {completedSale.payment.paymentMethod.toUpperCase()}:</span>
                <span className="font-bold">{formatTzs(completedSale.payment.amountTzs)}</span>
              </div>
              {completedSale.changeDueTzs > 0 && (
                <div className="flex justify-between text-emerald-800 font-bold">
                  <span>Change Given:</span>
                  <span>{formatTzs(completedSale.changeDueTzs)}</span>
                </div>
              )}
              {completedSale.outstandingBalanceTzs > 0 && (
                <div className="flex justify-between text-amber-800 font-bold bg-amber-50 p-1.5 rounded">
                  <span>Outstanding Balance:</span>
                  <span>{formatTzs(completedSale.outstandingBalanceTzs)}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="text-center pt-3 border-t border-dashed border-stone-300 text-[10px] text-stone-500 space-y-1">
              <p className="font-bold text-stone-700">Asante sana for shopping with LK Bakehouse!</p>
              <p>Baked fresh with love in Dar es Salaam.</p>
              <p className="text-[9px] text-stone-400">Ref: {completedSale.receiptReference}</p>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex gap-2 font-sans">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Receipt</span>
              </button>
              <button
                onClick={() => setCompletedSale(null)}
                className="flex-1 py-2 bg-[#C85A32] hover:bg-[#B34F2B] text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                New Sale
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
