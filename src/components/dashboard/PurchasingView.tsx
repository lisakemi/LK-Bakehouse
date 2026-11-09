import React, { useState, useEffect } from 'react';
import { Supplier, PurchaseOrder, InventoryItem, PurchaseOrderItem } from '../../types/bakery.ts';
import { formatTzs, formatDate } from '../../utils/format.ts';
import {
  Truck,
  Plus,
  CheckCircle2,
  Clock,
  DollarSign,
  PackageCheck,
  Search,
  Filter,
  CreditCard,
  Building2,
  AlertCircle,
  FileText,
  RefreshCw,
} from 'lucide-react';
import { authFetch } from '../../lib/auth-client.ts';

export const PurchasingView: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'suppliers'>('orders');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Create PO Modal
  const [showPoModal, setShowPoModal] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [poItems, setPoItems] = useState<Array<{ inventoryItemId: string; quantity: number; unitCostTzs: number }>>([]);
  const [expectedDate, setExpectedDate] = useState('');
  const [initialPayment, setInitialPayment] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [receiveNow, setReceiveNow] = useState(false);
  const [poNotes, setPoNotes] = useState('');
  const [isSubmittingPo, setIsSubmittingPo] = useState(false);

  // Goods-Received Modal
  const [receivingPo, setReceivingPo] = useState<PurchaseOrder | null>(null);
  const [receiveQtyMap, setReceiveQtyMap] = useState<Record<string, number>>({});
  const [isSubmittingReceive, setIsSubmittingReceive] = useState(false);
  const [receiveError, setReceiveError] = useState<string | null>(null);

  // Record Payment Modal
  const [payingPo, setPayingPo] = useState<PurchaseOrder | null>(null);
  const [payAmount, setPayAmount] = useState<number | ''>('');
  const [payMethod, setPayMethod] = useState('bank_transfer');
  const [payReference, setPayReference] = useState('');
  const [isSubmittingPay, setIsSubmittingPay] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  // New Supplier Modal
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [supplierName, setSupplierName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [supplierEmail, setSupplierEmail] = useState('');
  const [supplierAddress, setSupplierAddress] = useState('');
  const [supplierTerms, setSupplierTerms] = useState('Net 15 days');
  const [supplierTin, setSupplierTin] = useState('');
  const [isSubmittingSupplier, setIsSubmittingSupplier] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sRes, poRes, invRes] = await Promise.all([
        fetch('/api/suppliers'),
        fetch('/api/purchases'),
        fetch('/api/inventory'),
      ]);
      const sData = await sRes.json();
      const poData = await poRes.json();
      const invData = await invRes.json();
      setSuppliers(Array.isArray(sData) ? sData : []);
      setPurchaseOrders(Array.isArray(poData) ? poData : []);
      setInventoryItems(Array.isArray(invData) ? invData : []);
      if (sData.length > 0 && !selectedSupplierId) {
        setSelectedSupplierId(String(sData[0].id));
      }
    } catch (err) {
      console.error('Error fetching purchasing data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPoItem = () => {
    if (inventoryItems.length === 0) return;
    const defaultItem = inventoryItems[0];
    setPoItems((prev) => [
      ...prev,
      {
        inventoryItemId: String(defaultItem.id),
        quantity: 10,
        unitCostTzs: Number(defaultItem.unitCostTzs) || 1000,
      },
    ]);
  };

  const handleCreatePo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId || poItems.length === 0) return;
    setIsSubmittingPo(true);

    try {
      const res = await authFetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId: selectedSupplierId,
          items: poItems,
          expectedDeliveryDate: expectedDate || undefined,
          amountPaidTzs: initialPayment || 0,
          paymentMethod: initialPayment ? paymentMethod : undefined,
          receiveNow,
          notes: poNotes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create purchase order');

      setShowPoModal(false);
      setPoItems([]);
      setInitialPayment('');
      setPoNotes('');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error creating PO');
    } finally {
      setIsSubmittingPo(false);
    }
  };

  // Open Receive Goods Modal
  const openReceiveModal = (po: PurchaseOrder) => {
    setReceivingPo(po);
    setReceiveError(null);
    const initialMap: Record<string, number> = {};
    po.items?.forEach((item) => {
      const remaining = Math.max(0, Number(item.quantityOrdered) - Number(item.quantityReceived));
      initialMap[String(item.id || item.inventoryItemId)] = remaining;
    });
    setReceiveQtyMap(initialMap);
  };

  const handleReceiveGoods = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receivingPo) return;
    setReceiveError(null);
    setIsSubmittingReceive(true);

    try {
      const receivedItemsPayload = (receivingPo.items || []).map((line) => {
        const key = String(line.id || line.inventoryItemId);
        return {
          itemId: line.id,
          inventoryItemId: line.inventoryItemId,
          quantityReceivedNow: receiveQtyMap[key] || 0,
        };
      });

      const res = await authFetch(`/api/purchases/${receivingPo.id}/receive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receivedItems: receivedItemsPayload,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to receive goods');

      setReceivingPo(null);
      fetchData();
    } catch (err: any) {
      setReceiveError(err.message || 'Error receiving goods');
    } finally {
      setIsSubmittingReceive(false);
    }
  };

  // Open Pay PO Modal
  const openPayModal = (po: PurchaseOrder) => {
    setPayingPo(po);
    setPayError(null);
    setPayAmount(Number(po.outstandingBalanceTzs) || '');
    setPayReference(`PO-PMT-${po.poNumber}`);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingPo || !payAmount) return;
    setPayError(null);
    setIsSubmittingPay(true);

    try {
      const res = await authFetch(`/api/purchases/${payingPo.id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountTzs: Number(payAmount),
          paymentMethod: payMethod,
          referenceNumber: payReference.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record supplier payment');

      setPayingPo(null);
      fetchData();
    } catch (err: any) {
      setPayError(err.message || 'Error recording payment');
    } finally {
      setIsSubmittingPay(false);
    }
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim()) return;
    setIsSubmittingSupplier(true);

    try {
      const res = await authFetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: supplierName.trim(),
          contactPerson: contactPerson.trim() || undefined,
          phone: supplierPhone.trim() || undefined,
          email: supplierEmail.trim() || undefined,
          address: supplierAddress.trim() || undefined,
          paymentTerms: supplierTerms,
          taxIdentificationNumber: supplierTin.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create supplier');

      setShowSupplierModal(false);
      setSupplierName('');
      setContactPerson('');
      setSupplierPhone('');
      setSupplierEmail('');
      setSupplierAddress('');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error registering supplier');
    } finally {
      setIsSubmittingSupplier(false);
    }
  };

  // Calculations for summary KPI cards
  const totalSpend = purchaseOrders.reduce((sum, p) => sum + Number(p.totalCostTzs || 0), 0);
  const totalPaid = purchaseOrders.reduce((sum, p) => sum + Number(p.amountPaidTzs || 0), 0);
  const totalOutstanding = Math.max(0, totalSpend - totalPaid);

  // Filtered PO list
  const filteredOrders = purchaseOrders.filter((po) => {
    if (statusFilter !== 'all' && po.status !== statusFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchPo = (po.poNumber || '').toLowerCase().includes(q);
      const matchSup = (po.supplierName || '').toLowerCase().includes(q);
      if (!matchPo && !matchSup) return false;
    }
    return true;
  });

  const poTotalModal = poItems.reduce((acc, i) => acc + i.quantity * i.unitCostTzs, 0);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#E8DFD8] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#78716C] uppercase tracking-wider">
              Total Purchases (Procurement)
            </span>
            <div className="text-xl font-mono font-bold text-[#292524] mt-1">
              {formatTzs(totalSpend)}
            </div>
            <span className="text-[10px] text-[#78716C] mt-0.5 block">
              {purchaseOrders.length} purchase orders recorded
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#FAF7F2] border border-[#E8DFD8] flex items-center justify-center text-[#C85A32]">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E8DFD8] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#78716C] uppercase tracking-wider">
              Settled Supplier Payments
            </span>
            <div className="text-xl font-mono font-bold text-emerald-700 mt-1">
              {formatTzs(totalPaid)}
            </div>
            <span className="text-[10px] text-[#78716C] mt-0.5 block">
              Disbursed via bank transfer & mobile money
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E8DFD8] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#78716C] uppercase tracking-wider">
              Outstanding Accounts Payable
            </span>
            <div className={`text-xl font-mono font-bold mt-1 ${totalOutstanding > 0 ? 'text-amber-700' : 'text-stone-700'}`}>
              {formatTzs(totalOutstanding)}
            </div>
            <span className="text-[10px] text-[#78716C] mt-0.5 block">
              Due to approved suppliers
            </span>
          </div>
          <div className={`w-10 h-10 rounded-lg border flex items-center justify-center ${totalOutstanding > 0 ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-[#FAF7F2] border-[#E8DFD8] text-[#57534E]'}`}>
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E8DFD8] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#78716C] uppercase tracking-wider">
              Approved Suppliers
            </span>
            <div className="text-xl font-mono font-bold text-[#292524] mt-1">
              {suppliers.length} vendors
            </div>
            <span className="text-[10px] text-[#78716C] mt-0.5 block">
              Active grain, dairy & packaging suppliers
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#FAF7F2] border border-[#E8DFD8] flex items-center justify-center text-[#57534E]">
            <Building2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Action Header Banner */}
      <div className="bg-white p-4 rounded-xl border border-[#E8DFD8] shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="flex bg-[#FAF7F2] p-1 rounded-lg border border-[#E8DFD8] w-full md:w-auto">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'orders'
                ? 'bg-white text-[#292524] shadow-xs border border-[#E8DFD8]'
                : 'text-[#78716C] hover:text-[#292524]'
            }`}
          >
            Purchase Orders ({purchaseOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('suppliers')}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'suppliers'
                ? 'bg-white text-[#292524] shadow-xs border border-[#E8DFD8]'
                : 'text-[#78716C] hover:text-[#292524]'
            }`}
          >
            Suppliers Directory ({suppliers.length})
          </button>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            onClick={() => fetchData()}
            className="p-2 bg-white border border-[#E8DFD8] hover:bg-[#FAF7F2] text-[#57534E] rounded-lg text-xs font-medium transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowSupplierModal(true)}
            className="px-3 py-2 bg-white border border-[#E8DFD8] hover:border-[#D5C7BD] text-[#57534E] text-xs font-semibold rounded-lg transition-colors"
          >
            Add Supplier
          </button>
          <button
            onClick={() => {
              if (poItems.length === 0) handleAddPoItem();
              setShowPoModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#C85A32] hover:bg-[#B34F2B] text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Purchase Order</span>
          </button>
        </div>
      </div>

      {activeTab === 'orders' ? (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-3 rounded-xl border border-[#E8DFD8] shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by PO # or supplier..."
                className="w-full pl-9 pr-3 py-1.5 bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg text-xs focus:outline-hidden focus:border-[#C85A32]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
              {[
                { id: 'all', label: 'All Orders' },
                { id: 'ordered', label: 'Ordered / Pending' },
                { id: 'partially_received', label: 'Partially Received' },
                { id: 'received', label: 'Fully Received' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    statusFilter === tab.id
                      ? 'bg-[#292524] text-white'
                      : 'bg-[#FAF7F2] text-[#57534E] hover:bg-[#F0EAE1] border border-[#E8DFD8]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-xl border border-[#E8DFD8] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F2] text-[#78716C] uppercase tracking-wider font-semibold border-b border-[#E8DFD8]">
                  <tr>
                    <th className="py-3 px-4">PO Number</th>
                    <th className="py-3 px-4">Supplier</th>
                    <th className="py-3 px-4">Ordered Date</th>
                    <th className="py-3 px-4 text-right">Total Cost</th>
                    <th className="py-3 px-4 text-right">Amount Paid</th>
                    <th className="py-3 px-4 text-right">Balance Due</th>
                    <th className="py-3 px-4 text-center">Receipt Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EAE1]">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-stone-400">
                        Loading purchase orders...
                      </td>
                    </tr>
                  ) : filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-stone-400">
                        No purchase orders found matching current filter.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((po) => {
                      const balance = Number(po.outstandingBalanceTzs || 0);
                      const isFullyReceived = po.status === 'received';

                      let badgeClass = 'bg-stone-100 text-stone-700';
                      if (po.status === 'received') badgeClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                      else if (po.status === 'partially_received') badgeClass = 'bg-blue-50 text-blue-800 border-blue-200';
                      else if (po.status === 'ordered') badgeClass = 'bg-amber-50 text-amber-800 border-amber-200';

                      return (
                        <tr key={po.id} className="hover:bg-[#FAF7F2] transition-colors">
                          <td className="py-3 px-4">
                            <span className="font-mono font-bold text-[#292524]">{po.poNumber}</span>
                          </td>
                          <td className="py-3 px-4 font-semibold text-[#292524]">
                            {po.supplierName}
                          </td>
                          <td className="py-3 px-4 text-[#78716C] font-mono">
                            {formatDate(po.createdAt)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-[#292524]">
                            {formatTzs(po.totalCostTzs)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-emerald-700">
                            {formatTzs(po.amountPaidTzs)}
                          </td>
                          <td className={`py-3 px-4 text-right font-mono font-bold ${balance > 0 ? 'text-amber-700' : 'text-stone-400'}`}>
                            {formatTzs(balance)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border capitalize ${badgeClass}`}>
                              {po.status.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {!isFullyReceived && (
                                <button
                                  onClick={() => openReceiveModal(po)}
                                  className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded text-[11px] font-semibold border border-emerald-200"
                                >
                                  <PackageCheck className="w-3 h-3" />
                                  <span>Receive</span>
                                </button>
                              )}

                              {balance > 0 && (
                                <button
                                  onClick={() => openPayModal(po)}
                                  className="flex items-center gap-1 px-2.5 py-1 bg-stone-100 text-stone-800 hover:bg-stone-200 rounded text-[11px] font-semibold border border-stone-200"
                                >
                                  <CreditCard className="w-3 h-3" />
                                  <span>Pay Invoice</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Suppliers Directory Tab */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-xl border border-[#E8DFD8] p-5 shadow-xs flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-display text-sm font-bold text-[#292524]">{s.name}</h4>
                    {s.contactPerson && (
                      <p className="text-xs text-[#78716C] mt-0.5">Contact: {s.contactPerson}</p>
                    )}
                  </div>
                  <span className="px-2 py-0.5 bg-[#FAF7F2] border border-[#E8DFD8] rounded text-[10px] font-semibold text-[#57534E]">
                    {s.paymentTerms || 'Net 15'}
                  </span>
                </div>

                <div className="mt-3 space-y-1 text-xs text-[#57534E]">
                  {s.phone && (
                    <div className="flex items-center gap-1.5 font-mono">
                      <span className="text-[#78716C]">Tel:</span> {s.phone}
                    </div>
                  )}
                  {s.email && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[#78716C]">Email:</span> {s.email}
                    </div>
                  )}
                  {s.address && (
                    <div className="text-[11px] text-[#78716C]">
                      Location: {s.address}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-[#F0EAE1] flex justify-between items-center text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#78716C] block">Outstanding</span>
                  <span className={`font-mono font-bold ${Number(s.outstandingBalanceTzs || 0) > 0 ? 'text-amber-700' : 'text-stone-400'}`}>
                    {formatTzs(s.outstandingBalanceTzs || 0)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-[#78716C] block">Total Orders</span>
                  <span className="font-mono font-semibold text-[#292524]">{s.totalOrders || 0}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* GOODS-RECEIVED WORKFLOW MODAL */}
      {receivingPo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-[#E8DFD8] p-6 space-y-4">
            <div className="flex items-start justify-between pb-2 border-b border-[#E8DFD8]">
              <div>
                <h4 className="font-display text-base font-bold text-[#292524]">
                  Receive Goods: {receivingPo.poNumber}
                </h4>
                <p className="text-xs text-[#78716C]">
                  Supplier: <strong>{receivingPo.supplierName}</strong>
                </p>
              </div>
              <button
                onClick={() => setReceivingPo(null)}
                className="text-stone-400 hover:text-stone-900 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            {receiveError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{receiveError}</span>
              </div>
            )}

            <div className="p-3 bg-[#FAF7F2] rounded-lg border border-[#E8DFD8] text-xs text-[#57534E]">
              <p>
                <strong>Weighted Average Costing (WAC) Notice:</strong> Each received item automatically increments
                inventory stock and re-calculates the weighted average unit cost in Tanzanian Shillings.
              </p>
            </div>

            <form onSubmit={handleReceiveGoods} className="space-y-4 text-xs">
              <div className="space-y-2 max-h-60 overflow-y-auto">
                <div className="text-[11px] font-bold text-[#78716C] uppercase grid grid-cols-12 gap-2 pb-1 border-b border-[#E8DFD8]">
                  <span className="col-span-5">Item</span>
                  <span className="col-span-2 text-right">Ordered</span>
                  <span className="col-span-2 text-right">Received</span>
                  <span className="col-span-3 text-right">Receive Now</span>
                </div>

                {(receivingPo.items || []).map((item) => {
                  const key = String(item.id || item.inventoryItemId);
                  const ordered = Number(item.quantityOrdered || 0);
                  const received = Number(item.quantityReceived || 0);
                  const remaining = Math.max(0, ordered - received);

                  // Find inventory name
                  const inv = inventoryItems.find((i) => i.id === item.inventoryItemId);
                  const name = item.itemName || inv?.name || 'Inventory item';
                  const unit = item.unit || inv?.unit || 'kg';

                  return (
                    <div key={key} className="grid grid-cols-12 gap-2 items-center py-2 border-b border-[#F0EAE1]">
                      <div className="col-span-5 font-semibold text-[#292524]">
                        {name}
                        <div className="text-[10px] text-[#78716C] font-normal font-mono">
                          Remaining: {remaining.toFixed(2)} {unit}
                        </div>
                      </div>
                      <div className="col-span-2 text-right font-mono text-[#57534E]">
                        {ordered.toFixed(1)}
                      </div>
                      <div className="col-span-2 text-right font-mono text-emerald-700">
                        {received.toFixed(1)}
                      </div>
                      <div className="col-span-3 text-right">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max={remaining}
                          value={receiveQtyMap[key] !== undefined ? receiveQtyMap[key] : remaining}
                          onChange={(e) => {
                            const val = Math.max(0, Number(e.target.value));
                            setReceiveQtyMap((prev) => ({
                              ...prev,
                              [key]: val,
                            }));
                          }}
                          className="w-full px-2 py-1 text-right font-mono bg-[#FAF7F2] border border-[#E8DFD8] rounded focus:outline-hidden focus:border-[#C85A32]"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setReceivingPo(null)}
                  className="flex-1 py-2 bg-[#FAF7F2] hover:bg-[#F0EAE1] text-[#57534E] rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReceive}
                  className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold disabled:opacity-50 shadow-xs"
                >
                  {isSubmittingReceive ? 'Processing Receipt...' : 'Confirm Goods Received'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD SUPPLIER PAYMENT MODAL */}
      {payingPo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-xl shadow-2xl border border-[#E8DFD8] p-6 space-y-4">
            <div className="flex items-start justify-between pb-2 border-b border-[#E8DFD8]">
              <div>
                <h4 className="font-display text-base font-bold text-[#292524]">
                  Pay Supplier: {payingPo.supplierName}
                </h4>
                <p className="text-xs text-[#78716C]">
                  PO #{payingPo.poNumber} — Outstanding: <strong>{formatTzs(payingPo.outstandingBalanceTzs || 0)}</strong>
                </p>
              </div>
              <button
                onClick={() => setPayingPo(null)}
                className="text-stone-400 hover:text-stone-900 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            {payError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{payError}</span>
              </div>
            )}

            <form onSubmit={handleRecordPayment} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-[#78716C] uppercase mb-1">
                  Payment Amount (TSh) *
                </label>
                <input
                  type="number"
                  step="1"
                  required
                  max={Number(payingPo.outstandingBalanceTzs || 0)}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg font-mono text-sm font-bold text-[#292524] focus:outline-hidden focus:border-[#C85A32]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#78716C] uppercase mb-1">
                  Payment Method *
                </label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg"
                >
                  <option value="bank_transfer">Bank Transfer (CRDB / NMB)</option>
                  <option value="m_pesa">Vodacom M-Pesa</option>
                  <option value="airtel_money">Airtel Money</option>
                  <option value="cash">Petty Cash</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#78716C] uppercase mb-1">
                  Bank Reference / Slip Number
                </label>
                <input
                  type="text"
                  value={payReference}
                  onChange={(e) => setPayReference(e.target.value)}
                  placeholder="e.g. CRDB-TXN-90218 or M-PESA REF"
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg font-mono"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setPayingPo(null)}
                  className="flex-1 py-2 bg-[#FAF7F2] text-[#57534E] rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPay || !payAmount}
                  className="flex-1 py-2 bg-[#C85A32] hover:bg-[#B34F2B] text-white rounded-lg font-semibold disabled:opacity-50 shadow-xs"
                >
                  {isSubmittingPay ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE PURCHASE ORDER MODAL */}
      {showPoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white rounded-xl shadow-2xl border border-[#E8DFD8] p-6 space-y-4">
            <div className="flex items-start justify-between pb-2 border-b border-[#E8DFD8]">
              <div>
                <h4 className="font-display text-base font-bold text-[#292524]">
                  Create Supplier Purchase Order
                </h4>
                <p className="text-xs text-[#78716C]">
                  Issue a new procurement purchase order for raw bakery materials.
                </p>
              </div>
              <button onClick={() => setShowPoModal(false)} className="text-stone-400 hover:text-stone-900">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePo} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#78716C] uppercase mb-1">
                    Select Supplier *
                  </label>
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.paymentTerms})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#78716C] uppercase mb-1">
                    Expected Delivery Date
                  </label>
                  <input
                    type="date"
                    value={expectedDate}
                    onChange={(e) => setExpectedDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg font-mono"
                  />
                </div>
              </div>

              {/* Items in PO */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-bold text-[#78716C] uppercase">
                    Order Item Lines
                  </label>
                  <button
                    type="button"
                    onClick={handleAddPoItem}
                    className="text-xs text-[#C85A32] font-semibold hover:underline"
                  >
                    + Add Item Line
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {poItems.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-center bg-[#FAF7F2] p-2 rounded-lg border border-[#E8DFD8]">
                      <select
                        value={item.inventoryItemId}
                        onChange={(e) => {
                          const nextId = e.target.value;
                          const inv = inventoryItems.find((i) => i.id === nextId);
                          setPoItems((prev) => {
                            const copy = [...prev];
                            copy[idx].inventoryItemId = nextId;
                            if (inv) copy[idx].unitCostTzs = Number(inv.unitCostTzs);
                            return copy;
                          });
                        }}
                        className="flex-1 px-2 py-1 bg-white border border-[#E8DFD8] rounded"
                      >
                        {inventoryItems.map((inv) => (
                          <option key={inv.id} value={inv.id}>
                            {inv.name} ({inv.unit})
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setPoItems((prev) => {
                            const copy = [...prev];
                            copy[idx].quantity = val;
                            return copy;
                          });
                        }}
                        className="w-16 px-2 py-1 text-center font-mono bg-white border border-[#E8DFD8] rounded"
                        placeholder="Qty"
                      />

                      <input
                        type="number"
                        min="0"
                        value={item.unitCostTzs}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setPoItems((prev) => {
                            const copy = [...prev];
                            copy[idx].unitCostTzs = val;
                            return copy;
                          });
                        }}
                        className="w-24 px-2 py-1 text-right font-mono bg-white border border-[#E8DFD8] rounded"
                        placeholder="Cost"
                      />

                      <div className="w-24 text-right font-mono font-bold text-[#292524] text-[11px]">
                        {formatTzs(item.quantity * item.unitCostTzs)}
                      </div>

                      <button
                        type="button"
                        onClick={() => setPoItems((prev) => prev.filter((_, i) => i !== idx))}
                        className="text-stone-400 hover:text-red-600 p-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Receive Now Checkbox */}
              <div className="flex items-center gap-2 p-2.5 bg-[#FAF7F2] rounded-lg border border-[#E8DFD8]">
                <input
                  type="checkbox"
                  id="receiveNow"
                  checked={receiveNow}
                  onChange={(e) => setReceiveNow(e.target.checked)}
                  className="rounded text-[#C85A32]"
                />
                <label htmlFor="receiveNow" className="text-xs text-[#292524] cursor-pointer">
                  <strong>Receive into inventory now</strong> (instantly updates stock on hand with WAC)
                </label>
              </div>

              {/* Initial Payment */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#78716C] uppercase mb-1">
                    Initial Payment Tendered (TSh)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={poTotalModal}
                    value={initialPayment}
                    onChange={(e) => setInitialPayment(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#78716C] uppercase mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg"
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="m_pesa">M-Pesa</option>
                    <option value="cash">Petty Cash</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center text-sm font-bold text-[#292524] border-t border-[#E8DFD8]">
                <span>Total PO Amount:</span>
                <span className="font-mono text-base text-[#C85A32]">{formatTzs(poTotalModal)}</span>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowPoModal(false)}
                  className="flex-1 py-2 bg-[#FAF7F2] text-[#57534E] rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPo || poItems.length === 0}
                  className="flex-1 py-2 bg-[#C85A32] text-white rounded-lg font-semibold hover:bg-[#B34F2B]"
                >
                  {isSubmittingPo ? 'Creating...' : 'Create Purchase Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REGISTER SUPPLIER MODAL */}
      {showSupplierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-[#E8DFD8] p-6 space-y-4">
            <h4 className="font-display text-base font-bold text-[#292524] pb-2 border-b border-[#E8DFD8]">
              Register Approved Supplier
            </h4>

            <form onSubmit={handleCreateSupplier} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-[#78716C] uppercase mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder="e.g. Bakhresa Flour Mills, Mara Dairy Co."
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-[#78716C] uppercase mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="e.g. Juma Ally"
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#78716C] uppercase mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={supplierPhone}
                    onChange={(e) => setSupplierPhone(e.target.value)}
                    placeholder="+255 7XX XXX XXX"
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-[#78716C] uppercase mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={supplierEmail}
                    onChange={(e) => setSupplierEmail(e.target.value)}
                    placeholder="sales@supplier.co.tz"
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#78716C] uppercase mb-1">
                    TIN (Tax ID)
                  </label>
                  <input
                    type="text"
                    value={supplierTin}
                    onChange={(e) => setSupplierTin(e.target.value)}
                    placeholder="100-200-300"
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#78716C] uppercase mb-1">
                  Physical Address
                </label>
                <input
                  type="text"
                  value={supplierAddress}
                  onChange={(e) => setSupplierAddress(e.target.value)}
                  placeholder="e.g. Nyerere Road Industrial Area, Dar es Salaam"
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#78716C] uppercase mb-1">
                  Credit & Payment Terms
                </label>
                <input
                  type="text"
                  value={supplierTerms}
                  onChange={(e) => setSupplierTerms(e.target.value)}
                  placeholder="e.g. Net 15 days, 50% advance, COD"
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowSupplierModal(false)}
                  className="flex-1 py-2 bg-[#FAF7F2] text-[#57534E] rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSupplier || !supplierName.trim()}
                  className="flex-1 py-2 bg-[#C85A32] text-white rounded-lg font-semibold hover:bg-[#B34F2B]"
                >
                  {isSubmittingSupplier ? 'Saving...' : 'Save Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
