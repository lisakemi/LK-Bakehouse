import React, { useState, useEffect } from 'react';
import { InventoryItem, InventoryMovement, Supplier } from '../../types/bakery.ts';
import { formatTzs, formatDate } from '../../utils/format.ts';
import {
  AlertTriangle,
  Plus,
  History,
  Search,
  Filter,
  DollarSign,
  Package,
  Layers,
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
import { authFetch } from '../../lib/auth-client.ts';

export const InventoryView: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'stock' | 'movements'>('stock');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'ingredient' | 'packaging' | 'finished_product' | 'low_stock'>('all');
  const [movementFilter, setMovementFilter] = useState<string>('all');

  // Adjust Movement Modal
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [adjustType, setAdjustType] = useState<'spoilage_wastage' | 'audit_adjustment' | 'supplier_return'>('spoilage_wastage');
  const [quantityDelta, setQuantityDelta] = useState<number | ''>('');
  const [unitCost, setUnitCost] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [referenceId, setReferenceId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [adjustError, setAdjustError] = useState<string | null>(null);

  // Register New Item Modal
  const [showNewItemModal, setShowNewItemModal] = useState(false);
  const [newItemCode, setNewItemCode] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<'ingredient' | 'packaging' | 'finished_product'>('ingredient');
  const [newItemUnit, setNewItemUnit] = useState('kg');
  const [newItemQty, setNewItemQty] = useState('0');
  const [newItemReorder, setNewItemReorder] = useState('10');
  const [newItemCost, setNewItemCost] = useState('0');
  const [newItemLocation, setNewItemLocation] = useState('Main Dry Pantry');
  const [newItemSupplierId, setNewItemSupplierId] = useState('');

  useEffect(() => {
    fetchInventory();
    fetchSuppliers();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const [invRes, movRes] = await Promise.all([
        fetch('/api/inventory'),
        fetch('/api/inventory/movements'),
      ]);
      const invData = await invRes.json();
      const movData = await movRes.json();
      setItems(Array.isArray(invData) ? invData : []);
      setMovements(Array.isArray(movData) ? movData : []);
    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await fetch('/api/suppliers');
      const data = await res.json();
      if (Array.isArray(data)) setSuppliers(data);
    } catch (err) {
      console.error('Error fetching suppliers:', err);
    }
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdjustError(null);
    if (!selectedItem || !quantityDelta) return;
    setIsSubmitting(true);

    try {
      const absDelta = Math.abs(Number(quantityDelta));
      // For spoilage or supplier return, it always decreases stock
      const finalDelta = adjustType === 'spoilage_wastage' || adjustType === 'supplier_return'
        ? -absDelta
        : Number(quantityDelta);

      const res = await authFetch(`/api/inventory/${selectedItem.id}/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          movementType: adjustType,
          quantityDelta: finalDelta,
          unitCostTzs: unitCost || selectedItem.unitCostTzs,
          notes: notes.trim() || undefined,
          referenceId: referenceId.trim() || undefined,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to adjust inventory');
      }

      setSelectedItem(null);
      setQuantityDelta('');
      setUnitCost('');
      setNotes('');
      setReferenceId('');
      fetchInventory();
    } catch (err: any) {
      setAdjustError(err.message || 'Error updating stock');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    setIsSubmitting(true);

    try {
      const res = await authFetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemCode: newItemCode.trim() || undefined,
          name: newItemName.trim(),
          category: newItemCategory,
          unit: newItemUnit,
          quantityOnHand: newItemQty,
          reorderLevel: newItemReorder,
          unitCostTzs: newItemCost,
          storageLocation: newItemLocation,
          supplierId: newItemSupplierId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to register item');

      setShowNewItemModal(false);
      setNewItemCode('');
      setNewItemName('');
      setNewItemQty('0');
      setNewItemCost('0');
      fetchInventory();
    } catch (err: any) {
      alert(err.message || 'Error registering item');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Metrics calculations
  const totalValuation = items.reduce((sum, item) => sum + (item.valuationTzs || 0), 0);
  const lowStockItems = items.filter((i) => Number(i.quantityOnHand) <= Number(i.reorderLevel));
  const lowStockCount = lowStockItems.length;

  // Filtered Items
  const filteredItems = items.filter((item) => {
    // Search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(query);
      const matchCode = (item.itemCode || '').toLowerCase().includes(query);
      const matchSupplier = (item.supplierName || '').toLowerCase().includes(query);
      const matchLocation = (item.storageLocation || '').toLowerCase().includes(query);
      if (!matchName && !matchCode && !matchSupplier && !matchLocation) return false;
    }

    // Category / Low Stock tab
    if (categoryFilter === 'low_stock') {
      return Number(item.quantityOnHand) <= Number(item.reorderLevel);
    }
    if (categoryFilter !== 'all') {
      return item.category.toLowerCase() === categoryFilter.toLowerCase();
    }

    return true;
  });

  // Filtered Movements
  const filteredMovements = movements.filter((m) => {
    if (movementFilter !== 'all') {
      return m.movementType === movementFilter;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* KPI & Valuation Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#E8DFD8] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#78716C] uppercase tracking-wider">
              Total Stock Valuation (WAC)
            </span>
            <div className="text-xl font-mono font-bold text-[#292524] mt-1">
              {formatTzs(totalValuation)}
            </div>
            <span className="text-[10px] text-[#78716C] mt-0.5 block">
              Weighted Average Cost across all SKUs
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#FAF7F2] border border-[#E8DFD8] flex items-center justify-center text-[#C85A32]">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E8DFD8] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#78716C] uppercase tracking-wider">
              Registered SKUs
            </span>
            <div className="text-xl font-mono font-bold text-[#292524] mt-1">
              {items.length} items
            </div>
            <span className="text-[10px] text-[#78716C] mt-0.5 block">
              Ingredients, packaging & goods
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#FAF7F2] border border-[#E8DFD8] flex items-center justify-center text-[#57534E]">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E8DFD8] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#78716C] uppercase tracking-wider">
              Low Stock Alerts
            </span>
            <div className={`text-xl font-mono font-bold mt-1 ${lowStockCount > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
              {lowStockCount} {lowStockCount === 1 ? 'item' : 'items'}
            </div>
            <span className="text-[10px] text-[#78716C] mt-0.5 block">
              At or below reorder threshold
            </span>
          </div>
          <div className={`w-10 h-10 rounded-lg border flex items-center justify-center ${lowStockCount > 0 ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-emerald-50 border-emerald-200 text-emerald-600'}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E8DFD8] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#78716C] uppercase tracking-wider">
              Audited Movements
            </span>
            <div className="text-xl font-mono font-bold text-[#292524] mt-1">
              {movements.length} logged
            </div>
            <span className="text-[10px] text-[#78716C] mt-0.5 block">
              Double-entry stock audit trail
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#FAF7F2] border border-[#E8DFD8] flex items-center justify-center text-[#57534E]">
            <History className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Top Action Header */}
      <div className="bg-white p-4 rounded-xl border border-[#E8DFD8] shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* View Mode Tabs */}
          <div className="flex bg-[#FAF7F2] p-1 rounded-lg border border-[#E8DFD8]">
            <button
              onClick={() => setActiveTab('stock')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'stock'
                  ? 'bg-white text-[#292524] shadow-xs border border-[#E8DFD8]'
                  : 'text-[#78716C] hover:text-[#292524]'
              }`}
            >
              Stock On Hand ({items.length})
            </button>
            <button
              onClick={() => setActiveTab('movements')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'movements'
                  ? 'bg-white text-[#292524] shadow-xs border border-[#E8DFD8]'
                  : 'text-[#78716C] hover:text-[#292524]'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Audit Movements Log ({movements.length})</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            onClick={() => fetchInventory()}
            className="p-2 bg-white border border-[#E8DFD8] hover:bg-[#FAF7F2] text-[#57534E] rounded-lg text-xs font-medium transition-colors"
            title="Refresh Inventory"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowNewItemModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#C85A32] hover:bg-[#B34F2B] text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register New Item</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'stock' ? (
        <div className="space-y-4">
          {/* Search & Category Filter Bar */}
          <div className="bg-white p-3 rounded-xl border border-[#E8DFD8] shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, SKU, or supplier..."
                className="w-full pl-9 pr-3 py-1.5 bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg text-xs focus:outline-hidden focus:border-[#C85A32]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
              {[
                { id: 'all', label: 'All Items' },
                { id: 'ingredient', label: 'Ingredients' },
                { id: 'packaging', label: 'Packaging' },
                { id: 'finished_product', label: 'Finished Goods' },
                { id: 'low_stock', label: `Low Stock (${lowStockCount})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setCategoryFilter(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    categoryFilter === tab.id
                      ? tab.id === 'low_stock'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-[#292524] text-white'
                      : 'bg-[#FAF7F2] text-[#57534E] hover:bg-[#F0EAE1] border border-[#E8DFD8]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Stock Table */}
          <div className="bg-white rounded-xl border border-[#E8DFD8] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F2] text-[#78716C] uppercase tracking-wider font-semibold border-b border-[#E8DFD8]">
                  <tr>
                    <th className="py-3 px-4">Item & Code</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Storage Location</th>
                    <th className="py-3 px-4">Supplier</th>
                    <th className="py-3 px-4 text-right">Quantity On Hand</th>
                    <th className="py-3 px-4 text-right">Reorder Level</th>
                    <th className="py-3 px-4 text-right">Unit Cost (WAC)</th>
                    <th className="py-3 px-4 text-right">Valuation (TSh)</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EAE1]">
                  {loading ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-stone-400">
                        Loading inventory records...
                      </td>
                    </tr>
                  ) : filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-stone-400">
                        No inventory items matching current filter.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => {
                      const qty = Number(item.quantityOnHand || 0);
                      const reorder = Number(item.reorderLevel || 0);
                      const isLow = qty <= reorder;
                      const shortfall = Math.max(0, reorder - qty);

                      return (
                        <tr key={item.id} className="hover:bg-[#FAF7F2] transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-[#292524]">{item.name}</div>
                            {item.itemCode && (
                              <div className="text-[10px] font-mono text-[#78716C]">{item.itemCode}</div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-[#78716C] capitalize">
                            <span className="px-2 py-0.5 rounded-sm text-[10px] font-medium bg-[#FAF7F2] border border-[#E8DFD8]">
                              {item.category.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-[#57534E]">
                            {item.storageLocation || 'Main Pantry'}
                          </td>
                          <td className="py-3 px-4 text-[#57534E]">
                            {item.supplierName || '—'}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-[#292524]">
                            {qty.toFixed(2)} {item.unit}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-[#78716C]">
                            {reorder.toFixed(2)} {item.unit}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-[#57534E]">
                            {formatTzs(item.unitCostTzs)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-[#292524]">
                            {formatTzs(item.valuationTzs || 0)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isLow ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                <span>Low (-{shortfall.toFixed(1)} {item.unit})</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Adequate
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => {
                                setSelectedItem(item);
                                setAdjustType('spoilage_wastage');
                                setQuantityDelta('');
                                setUnitCost(Number(item.unitCostTzs) || '');
                                setAdjustError(null);
                              }}
                              className="px-2.5 py-1 bg-stone-100 text-stone-800 hover:bg-[#C85A32] hover:text-white rounded text-[11px] font-semibold border border-stone-200 transition-colors"
                            >
                              Record Movement
                            </button>
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
        /* Audit Movements Log Tab */
        <div className="space-y-4">
          {/* Movement Type Filter Bar */}
          <div className="bg-white p-3 rounded-xl border border-[#E8DFD8] shadow-xs flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-semibold text-[#78716C]">Filter by Movement Category:</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'all', label: 'All Movements' },
                { id: 'purchase_received', label: 'Purchases Received' },
                { id: 'production_consumed', label: 'Production Consumed' },
                { id: 'pos_sale', label: 'POS Sales' },
                { id: 'spoilage_wastage', label: 'Spoilage & Waste' },
                { id: 'audit_adjustment', label: 'Audit Corrections' },
                { id: 'supplier_return', label: 'Supplier Returns' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMovementFilter(m.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    movementFilter === m.id
                      ? 'bg-[#292524] text-white'
                      : 'bg-[#FAF7F2] text-[#57534E] hover:bg-[#F0EAE1] border border-[#E8DFD8]'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#E8DFD8] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F2] text-[#78716C] uppercase tracking-wider font-semibold border-b border-[#E8DFD8]">
                  <tr>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Item Name</th>
                    <th className="py-3 px-4">Movement Type</th>
                    <th className="py-3 px-4 text-right">Quantity Delta</th>
                    <th className="py-3 px-4 text-right">Balance After</th>
                    <th className="py-3 px-4">Reference / Order #</th>
                    <th className="py-3 px-4">Recorded By</th>
                    <th className="py-3 px-4">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EAE1]">
                  {filteredMovements.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-stone-400">
                        No movement records found.
                      </td>
                    </tr>
                  ) : (
                    filteredMovements.map((m) => {
                      const delta = Number(m.quantityDelta || 0);
                      const isPositive = delta > 0;

                      let badgeClass = 'bg-stone-100 text-stone-700';
                      if (m.movementType === 'purchase_received') badgeClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                      else if (m.movementType === 'production_consumed') badgeClass = 'bg-blue-50 text-blue-800 border-blue-200';
                      else if (m.movementType === 'pos_sale') badgeClass = 'bg-indigo-50 text-indigo-800 border-indigo-200';
                      else if (m.movementType === 'spoilage_wastage') badgeClass = 'bg-red-50 text-red-800 border-red-200';
                      else if (m.movementType === 'audit_adjustment') badgeClass = 'bg-amber-50 text-amber-800 border-amber-200';
                      else if (m.movementType === 'supplier_return') badgeClass = 'bg-purple-50 text-purple-800 border-purple-200';

                      return (
                        <tr key={m.id} className="hover:bg-[#FAF7F2] transition-colors">
                          <td className="py-3 px-4 text-[#78716C] font-mono">
                            {formatDate(m.createdAt)}
                          </td>
                          <td className="py-3 px-4 font-semibold text-[#292524]">
                            {m.itemName}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${badgeClass}`}>
                              {m.movementType.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className={`py-3 px-4 text-right font-mono font-bold ${isPositive ? 'text-emerald-700' : 'text-red-700'}`}>
                            {isPositive ? `+${delta.toFixed(2)}` : delta.toFixed(2)} {m.unit}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-[#57534E]">
                            {m.balanceAfterMovement ? `${Number(m.balanceAfterMovement).toFixed(2)} ${m.unit}` : '—'}
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-[#78716C]">
                            {m.referenceId || '—'}
                          </td>
                          <td className="py-3 px-4 text-[#57534E]">
                            {m.recordedByStaffName || 'Bakery Staff'}
                          </td>
                          <td className="py-3 px-4 text-[#78716C]">
                            {m.notes || '—'}
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
      )}

      {/* Adjust Stock / Movement Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-[#E8DFD8] p-6 space-y-4">
            <div className="flex items-start justify-between pb-2 border-b border-[#E8DFD8]">
              <div>
                <h4 className="font-display text-base font-bold text-[#292524]">
                  Record Stock Movement: {selectedItem.name}
                </h4>
                <p className="text-xs text-[#78716C]">
                  Current Stock On Hand:{' '}
                  <strong className="text-[#292524]">
                    {Number(selectedItem.quantityOnHand).toFixed(2)} {selectedItem.unit}
                  </strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-stone-400 hover:text-stone-900 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            {adjustError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{adjustError}</span>
              </div>
            )}

            <form onSubmit={handleAdjustSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-[#78716C] uppercase mb-1">
                  Movement Category *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'spoilage_wastage', label: 'Spoilage / Waste' },
                    { id: 'audit_adjustment', label: 'Audit Correction' },
                    { id: 'supplier_return', label: 'Supplier Return' },
                  ].map((op) => (
                    <button
                      key={op.id}
                      type="button"
                      onClick={() => setAdjustType(op.id as any)}
                      className={`p-2 rounded-lg border text-center text-xs transition-colors ${
                        adjustType === op.id
                          ? 'bg-[#292524] text-white font-semibold border-[#292524]'
                          : 'bg-[#FAF7F2] text-[#57534E] border-[#E8DFD8] hover:bg-[#F0EAE1]'
                      }`}
                    >
                      {op.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#78716C] uppercase mb-1">
                  {adjustType === 'audit_adjustment'
                    ? `Quantity Adjustment (${selectedItem.unit}) — enter positive or negative`
                    : `Quantity to Deduct (${selectedItem.unit}) *`}
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={quantityDelta}
                  onChange={(e) => setQuantityDelta(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder={adjustType === 'audit_adjustment' ? 'e.g. +5 or -2' : 'e.g. 5'}
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg font-mono text-xs focus:outline-hidden focus:border-[#C85A32]"
                />
              </div>

              {/* Balance projection preview */}
              {quantityDelta !== '' && (
                <div className="p-2.5 bg-[#FAF7F2] rounded-lg border border-[#E8DFD8] text-xs flex justify-between items-center">
                  <span className="text-[#78716C]">Projected Balance After:</span>
                  <span className="font-mono font-bold text-[#292524]">
                    {(
                      Number(selectedItem.quantityOnHand) +
                      (adjustType === 'spoilage_wastage' || adjustType === 'supplier_return'
                        ? -Math.abs(Number(quantityDelta))
                        : Number(quantityDelta))
                    ).toFixed(2)}{' '}
                    {selectedItem.unit}
                  </span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-[#78716C] uppercase mb-1">
                  Reference / Batch / Reason Code
                </label>
                <input
                  type="text"
                  value={referenceId}
                  onChange={(e) => setReferenceId(e.target.value)}
                  placeholder="e.g. AUDIT-2026-Q1, EXP-BAG-09, or DEFECT-PO-104"
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg text-xs focus:outline-hidden focus:border-[#C85A32]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#78716C] uppercase mb-1">
                  Auditor / Baker Explanation Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Bag torn in transit, humidity contamination, or physical count variance"
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg text-xs focus:outline-hidden focus:border-[#C85A32]"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="flex-1 py-2 bg-[#FAF7F2] hover:bg-[#F0EAE1] text-[#57534E] rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || quantityDelta === ''}
                  className="flex-1 py-2 bg-[#C85A32] hover:bg-[#B34F2B] text-white rounded-lg font-semibold disabled:opacity-50 shadow-xs"
                >
                  {isSubmitting ? 'Recording...' : 'Commit Movement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Register Item Modal */}
      {showNewItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-[#E8DFD8] p-6 space-y-4">
            <div className="flex items-start justify-between pb-2 border-b border-[#E8DFD8]">
              <div>
                <h4 className="font-display text-base font-bold text-[#292524]">
                  Register New Inventory Item
                </h4>
                <p className="text-xs text-[#78716C]">
                  Automatically creates initial opening stock audit movement.
                </p>
              </div>
              <button
                onClick={() => setShowNewItemModal(false)}
                className="text-stone-400 hover:text-stone-900 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateItem} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-[#78716C] uppercase mb-1">
                    Item Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="e.g. Organic Rye Flour, Salted Cream Butter"
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg focus:outline-hidden focus:border-[#C85A32]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#78716C] uppercase mb-1">
                    Item Code / SKU
                  </label>
                  <input
                    type="text"
                    value={newItemCode}
                    onChange={(e) => setNewItemCode(e.target.value)}
                    placeholder="e.g. ING-FLOUR-RYE"
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg font-mono focus:outline-hidden focus:border-[#C85A32]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-[#78716C] uppercase mb-1">
                    Category *
                  </label>
                  <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg focus:outline-hidden focus:border-[#C85A32]"
                  >
                    <option value="ingredient">Raw Ingredient</option>
                    <option value="packaging">Packaging Material</option>
                    <option value="finished_product">Finished Bakery Good</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#78716C] uppercase mb-1">
                    Unit of Measurement *
                  </label>
                  <select
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg focus:outline-hidden focus:border-[#C85A32]"
                  >
                    <option value="kg">kg (Kilograms)</option>
                    <option value="g">g (Grams)</option>
                    <option value="liters">liters (Liters)</option>
                    <option value="pcs">pcs (Pieces / Units)</option>
                    <option value="boxes">boxes (Boxes / Cartons)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 font-mono">
                <div>
                  <label className="block text-[10px] font-bold text-[#78716C] uppercase mb-1">
                    Opening Stock Qty
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newItemQty}
                    onChange={(e) => setNewItemQty(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#78716C] uppercase mb-1">
                    Reorder Threshold
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newItemReorder}
                    onChange={(e) => setNewItemReorder(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#78716C] uppercase mb-1">
                    Unit Cost (TSh)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newItemCost}
                    onChange={(e) => setNewItemCost(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-[#78716C] uppercase mb-1">
                    Storage Bin Location
                  </label>
                  <input
                    type="text"
                    value={newItemLocation}
                    onChange={(e) => setNewItemLocation(e.target.value)}
                    placeholder="e.g. Shelf B2, Chiller 1"
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#78716C] uppercase mb-1">
                    Primary Supplier
                  </label>
                  <select
                    value={newItemSupplierId}
                    onChange={(e) => setNewItemSupplierId(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg"
                  >
                    <option value="">No supplier specified</option>
                    {suppliers.map((sup) => (
                      <option key={sup.id} value={sup.id}>
                        {sup.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewItemModal(false)}
                  className="flex-1 py-2 bg-[#FAF7F2] hover:bg-[#F0EAE1] text-[#57534E] rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newItemName.trim()}
                  className="flex-1 py-2 bg-[#C85A32] hover:bg-[#B34F2B] text-white rounded-lg font-semibold shadow-xs"
                >
                  {isSubmitting ? 'Registering...' : 'Register Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
