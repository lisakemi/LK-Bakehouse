import React, { useState, useEffect } from 'react';
import { Order } from '../../types/bakery.ts';
import { formatTzs, formatDate, formatOrderStatus } from '../../utils/format.ts';
import { Search, Filter, Clock, Eye, CheckCircle, ChefHat, Truck, Package, XCircle, RotateCw } from 'lucide-react';
import { subscribeToOrders } from '../../lib/supabase.ts';
import { authFetch } from '../../lib/auth-client.ts';

export const OrdersView: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetchOrders();

    // Subscribe to live orders
    const unsubscribe = subscribeToOrders(() => {
      fetchOrders();
    });

    return () => {
      unsubscribe();
    };
  }, [statusFilter, sourceFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (sourceFilter !== 'all') params.set('source', sourceFilter);
      if (searchQuery) params.set('search', searchQuery);

      const res = await fetch(`/api/orders?${params.toString()}`);
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: number, nextStatus: string) => {
    try {
      const res = await authFetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        fetchOrders();
        if (selectedOrder?.id === orderId) {
          setSelectedOrder((prev) => (prev ? { ...prev, status: nextStatus as any } : null));
        }
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const statusTabs = [
    { id: 'all', label: 'All Orders' },
    { id: 'pending_review', label: 'Pending Review' },
    { id: 'confirmed', label: 'Confirmed' },
    { id: 'preparing', label: 'In Kitchen / Oven' },
    { id: 'ready_for_pickup', label: 'Ready for Pickup' },
    { id: 'out_for_delivery', label: 'Out for Delivery' },
    { id: 'completed', label: 'Completed' },
  ];

  return (
    <div className="space-y-6">
      {/* Filters & Search Header */}
      <div className="bg-white p-5 rounded-xl border border-[#E8DFD8] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchOrders()}
              placeholder="Search by order #, customer, or phone..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg focus:outline-hidden focus:border-[#C85A32] text-[#292524]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg focus:outline-hidden focus:border-[#C85A32] text-[#57534E]"
            >
              <option value="all">All Sources</option>
              <option value="website">Website Online Orders</option>
              <option value="pos">In-Shop Counter POS</option>
            </select>

            <button
              onClick={fetchOrders}
              className="p-2 text-stone-500 hover:text-stone-900 bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg transition-colors"
              title="Refresh order board"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status Horizontal Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none border-t border-[#F0EAE1] pt-3">
          {statusTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === tab.id
                  ? 'bg-[#292524] text-white shadow-xs'
                  : 'bg-[#FAF7F2] text-[#57534E] hover:bg-[#F0EAE1]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-[#E8DFD8] overflow-hidden shadow-xs">
        {loading ? (
          <div className="h-48 flex items-center justify-center text-xs text-stone-400">
            Loading orders from PostgreSQL...
          </div>
        ) : orders.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-xs text-stone-400 space-y-1">
            <span>No orders found matching the filter criteria.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7F2] text-[#78716C] uppercase tracking-wider font-semibold border-b border-[#E8DFD8]">
                <tr>
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Fulfillment</th>
                  <th className="py-3 px-4">Scheduled For</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EAE1]">
                {orders.map((o) => {
                  const sInfo = formatOrderStatus(o.status);
                  return (
                    <tr key={o.id} className="hover:bg-[#FAF7F2] transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#292524]">
                        {o.orderNumber}
                        <span className="block text-[10px] font-sans font-normal text-[#78716C]">
                          {o.source === 'pos' ? 'Shop Register' : 'Online Website'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-[#292524] block">{o.customerName}</span>
                        <span className="font-mono text-[11px] text-[#78716C]">{o.customerPhone}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="capitalize font-medium text-[#292524]">{o.fulfillmentType}</span>
                        {o.deliveryAddress && (
                          <span className="block text-[11px] text-[#78716C] truncate max-w-xs">
                            {o.deliveryAddress}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-[#57534E]">
                        {o.scheduledTime || formatDate(o.createdAt)}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-[#292524]">
                        {formatTzs(o.totalTzs)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-full border text-[11px] font-semibold ${sInfo.bg} ${sInfo.text}`}>
                          {sInfo.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedOrder(o)}
                            className="p-1.5 text-stone-500 hover:text-stone-900 bg-[#FAF7F2] hover:bg-[#F0EAE1] rounded border border-[#E8DFD8]"
                            title="View details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick Workflow Action Buttons */}
                          {o.status === 'pending_review' && (
                            <button
                              onClick={() => handleUpdateStatus(o.id, 'confirmed')}
                              className="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-[11px] font-semibold border border-blue-200"
                            >
                              Confirm
                            </button>
                          )}
                          {o.status === 'confirmed' && (
                            <button
                              onClick={() => handleUpdateStatus(o.id, 'preparing')}
                              className="px-2 py-1 bg-orange-50 text-orange-700 hover:bg-orange-100 rounded text-[11px] font-semibold border border-orange-200"
                            >
                              Bake / Prep
                            </button>
                          )}
                          {o.status === 'preparing' && (
                            <button
                              onClick={() => handleUpdateStatus(o.id, 'ready_for_pickup')}
                              className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-[11px] font-semibold border border-emerald-200"
                            >
                              Ready
                            </button>
                          )}
                          {(o.status === 'ready_for_pickup' || o.status === 'out_for_delivery') && (
                            <button
                              onClick={() => handleUpdateStatus(o.id, 'completed')}
                              className="px-2 py-1 bg-stone-900 text-white hover:bg-black rounded text-[11px] font-semibold"
                            >
                              Complete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-[#E8DFD8] p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-[#E8DFD8]">
              <div>
                <span className="font-mono text-base font-bold text-[#292524]">
                  {selectedOrder.orderNumber}
                </span>
                <p className="text-xs text-[#78716C] mt-0.5">
                  Placed {formatDate(selectedOrder.createdAt)} via {selectedOrder.source}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 text-stone-400 hover:text-stone-900 rounded"
              >
                ✕
              </button>
            </div>

            {/* Customer Details */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-[#FAF7F2] p-4 rounded-xl border border-[#E8DFD8]">
              <div>
                <span className="text-[#78716C] block">Customer:</span>
                <span className="font-bold text-[#292524]">{selectedOrder.customerName}</span>
                <span className="block font-mono text-[#57534E]">{selectedOrder.customerPhone}</span>
                {selectedOrder.customerEmail && (
                  <span className="block text-[#78716C]">{selectedOrder.customerEmail}</span>
                )}
              </div>
              <div>
                <span className="text-[#78716C] block">Fulfillment & Slot:</span>
                <span className="font-bold capitalize text-[#292524]">{selectedOrder.fulfillmentType}</span>
                <span className="block text-[#57534E]">{selectedOrder.scheduledTime}</span>
                <span className="block text-[#78716C] mt-1">{selectedOrder.deliveryAddress}</span>
              </div>
            </div>

            {/* Notes */}
            {selectedOrder.notes && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
                <strong>Customer Notes:</strong> {selectedOrder.notes}
              </div>
            )}

            {/* Items */}
            <div>
              <h4 className="text-xs font-bold text-[#292524] uppercase tracking-wider mb-2">
                Order Items
              </h4>
              <div className="divide-y divide-[#E8DFD8] border border-[#E8DFD8] rounded-xl overflow-hidden bg-[#FAF7F2]">
                {selectedOrder.items?.map((item) => (
                  <div key={item.id} className="p-3 flex justify-between text-xs">
                    <div>
                      <span className="font-semibold text-[#292524]">{item.quantity}x {item.productName}</span>
                      {item.variantName && (
                        <span className="block text-[11px] text-[#78716C]">Variant: {item.variantName}</span>
                      )}
                      {item.customizationNotes && (
                        <span className="block text-[11px] italic text-[#C85A32]">"{item.customizationNotes}"</span>
                      )}
                    </div>
                    <span className="font-mono font-bold text-[#292524]">
                      {formatTzs(item.totalPriceTzs)}
                    </span>
                  </div>
                ))}

                <div className="p-3 bg-white space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-mono">{formatTzs(selectedOrder.subtotalTzs)}</span>
                  </div>
                  {Number(selectedOrder.discountTzs) > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Discount:</span>
                      <span className="font-mono">-{formatTzs(selectedOrder.discountTzs)}</span>
                    </div>
                  )}
                  {Number(selectedOrder.deliveryFeeTzs) > 0 && (
                    <div className="flex justify-between">
                      <span>Delivery Fee:</span>
                      <span className="font-mono">{formatTzs(selectedOrder.deliveryFeeTzs)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-sm text-[#292524] pt-1 border-t border-[#E8DFD8]">
                    <span>Total Amount:</span>
                    <span className="font-mono text-[#C85A32]">{formatTzs(selectedOrder.totalTzs)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Change Selector */}
            <div className="pt-2 border-t border-[#E8DFD8] flex items-center justify-between">
              <span className="text-xs font-medium text-[#78716C]">Update Status:</span>
              <div className="flex gap-1.5 flex-wrap">
                {['pending_review', 'confirmed', 'preparing', 'ready_for_pickup', 'completed', 'cancelled'].map((st) => (
                  <button
                    key={st}
                    onClick={() => handleUpdateStatus(selectedOrder.id, st)}
                    className={`px-2 py-1 rounded text-[11px] font-semibold border ${
                      selectedOrder.status === st
                        ? 'bg-[#292524] text-white border-[#292524]'
                        : 'bg-white text-[#57534E] border-[#E8DFD8] hover:bg-[#FAF7F2]'
                    }`}
                  >
                    {st.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
