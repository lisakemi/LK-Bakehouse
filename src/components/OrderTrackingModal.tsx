import React, { useState, useEffect } from 'react';
import { formatTzs, formatDate, formatOrderStatus } from '../utils/format.ts';
import { X, Search, CheckCircle2, Clock, Phone, MessageSquare, PackageCheck, Truck, Radio } from 'lucide-react';
import { subscribeToOrders } from '../lib/supabase.ts';

interface OrderTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialOrderNumber?: string;
  onOpenSupport?: (orderNumber?: string) => void;
}

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({
  isOpen,
  onClose,
  initialOrderNumber,
  onOpenSupport,
}) => {
  if (!isOpen) return null;

  const [orderNumberInput, setOrderNumberInput] = useState(initialOrderNumber || '');
  const [contactInput, setContactInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState<string | null>(null);

  const fetchOrder = async (numberToTrack: string, contactToVerify?: string) => {
    if (!numberToTrack.trim()) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const contactQuery = contactToVerify !== undefined ? contactToVerify.trim() : contactInput.trim();
      const url = `/api/orders/track/${encodeURIComponent(numberToTrack.trim())}${
        contactQuery ? `?contact=${encodeURIComponent(contactQuery)}` : ''
      }`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Order not found');
      }
      setOrderData(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not find order. Please check the order reference.');
      setOrderData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialOrderNumber) {
      setOrderNumberInput(initialOrderNumber);
      fetchOrder(initialOrderNumber);
    }
  }, [initialOrderNumber]);

  // Real-time status update subscription
  useEffect(() => {
    if (!orderData) return;
    const unsubscribe = subscribeToOrders((payload: any) => {
      if (
        (payload.orderId && payload.orderId === orderData.id) ||
        (payload.orderNumber && payload.orderNumber === orderData.orderNumber) ||
        (payload.new && payload.new.order_number === orderData.orderNumber)
      ) {
        const nextStatus = payload.status || payload.new?.status;
        if (nextStatus) {
          setOrderData((prev: any) => (prev ? { ...prev, status: nextStatus } : prev));
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [orderData?.id, orderData?.orderNumber]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrder(orderNumberInput, contactInput);
  };

  const handleVerifyContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderData?.orderNumber) {
      fetchOrder(orderData.orderNumber, contactInput);
    }
  };

  const handleCancelRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderData?.orderNumber) return;
    setCancelling(true);
    setCancelSuccessMsg(null);
    try {
      const res = await fetch(`/api/orders/${orderData.orderNumber}/cancel-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setCancelSuccessMsg(data.message);
        setShowCancelPrompt(false);
        setCancelReason('');
        fetchOrder(orderData.orderNumber);
      }
    } catch (err: any) {
      console.error('Error submitting cancellation:', err);
    } finally {
      setCancelling(false);
    }
  };

  const steps = [
    { key: 'pending_review', label: 'Received & Queued' },
    { key: 'confirmed', label: 'Confirmed by Pastry Chef' },
    { key: 'preparing', label: 'In Deck Oven / Prep' },
    { key: 'ready_for_pickup', label: 'Ready for Pickup / Out for Delivery' },
    { key: 'completed', label: 'Completed & Enjoyed' },
  ];

  const getStepIndex = (status: string) => {
    if (status === 'out_for_delivery') return 3;
    const idx = steps.findIndex((s) => s.key === status);
    return idx !== -1 ? idx : 0;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-[#E8DFD8] overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-[#E8DFD8] bg-[#FAF7F2] flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-[#292524]">
              Track Your LK Bakehouse Order
            </h2>
            <p className="text-xs text-[#78716C]">
              Real-time kitchen and dispatch status
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-[#F0EAE1] rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 sm:p-8 space-y-6">
          {/* Search Box */}
          <form onSubmit={handleSearch} className="space-y-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={orderNumberInput}
                  onChange={(e) => setOrderNumberInput(e.target.value)}
                  placeholder="Enter Order # (e.g. LKB-2026-1001)"
                  className="w-full pl-9 pr-3 py-2.5 text-xs uppercase bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg focus:outline-hidden focus:border-[#C85A32] text-[#292524] font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !orderNumberInput.trim()}
                className="px-4 py-2.5 bg-[#C85A32] text-white text-xs font-semibold rounded-lg hover:bg-[#B34F2B] disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                {loading ? 'Locating...' : 'Track'}
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                value={contactInput}
                onChange={(e) => setContactInput(e.target.value)}
                placeholder="Customer Phone or Email (to unlock verified address & items)"
                className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg focus:outline-hidden focus:border-[#C85A32] text-[#292524]"
              />
            </div>
          </form>

          {errorMessage && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
              {errorMessage}
            </div>
          )}

          {/* Result view */}
          {orderData && (
            <div className="space-y-6">
              {/* Unverified Privacy Warning Banner */}
              {!orderData.verified && (
                <div className="p-4 bg-amber-50/90 border border-amber-200 rounded-xl space-y-2 text-xs text-amber-900">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span>Customer Privacy & Anti-Harvesting Protection</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Personal contact details and delivery street addresses are protected. Verify the phone number or email used during checkout to unlock full details.
                  </p>
                  <form onSubmit={handleVerifyContact} className="flex gap-2 pt-1">
                    <input
                      type="text"
                      value={contactInput}
                      onChange={(e) => setContactInput(e.target.value)}
                      placeholder="e.g. +255 712 345 678 or customer@email.com"
                      className="flex-1 px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs text-stone-900 focus:outline-hidden focus:border-amber-600"
                    />
                    <button
                      type="submit"
                      disabled={loading || !contactInput.trim()}
                      className="px-3.5 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Verifying...' : 'Unlock Details'}
                    </button>
                  </form>
                </div>
              )}

              {/* Status Header */}
              <div className="p-4 bg-[#FAF7F2] rounded-xl border border-[#E8DFD8] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-[#78716C] block">
                      Order Reference
                    </span>
                    {orderData.verified && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Verified
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-base font-bold text-[#292524]">
                    {orderData.orderNumber}
                  </span>
                  <div className="text-xs text-[#78716C] mt-0.5">
                    Customer: <strong className="text-[#292524]">{orderData.customerName || 'Customer (Verified)'}</strong>
                    {orderData.customerPhone && (
                      <span className="ml-2 font-mono text-[11px] text-stone-500">({orderData.customerPhone})</span>
                    )}
                  </div>
                </div>

                <div className={`px-3 py-1.5 rounded-full border text-xs font-semibold ${formatOrderStatus(orderData.status).bg} ${formatOrderStatus(orderData.status).text}`}>
                  {formatOrderStatus(orderData.status).label}
                </div>
              </div>

              {/* Progress Stepper */}
              <div className="py-2">
                <div className="space-y-4">
                  {steps.map((s, idx) => {
                    const currentIdx = getStepIndex(orderData.status);
                    const isDone = idx <= currentIdx;
                    const isCurrent = idx === currentIdx;

                    return (
                      <div key={s.key} className="flex items-center gap-3">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                            isDone
                              ? 'bg-[#C85A32] text-white'
                              : 'bg-stone-100 text-stone-400 border border-stone-200'
                          }`}
                        >
                          {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                        </div>
                        <div className="flex-1">
                          <span
                            className={`text-xs block ${
                              isCurrent
                                ? 'font-bold text-[#292524]'
                                : isDone
                                ? 'text-[#57534E]'
                                : 'text-stone-400'
                            }`}
                          >
                            {s.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Fulfillment & Time Info */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-white p-4 rounded-xl border border-[#E8DFD8]">
                <div>
                  <span className="text-[11px] text-[#78716C] block">Fulfillment Method</span>
                  <span className="font-semibold text-[#292524] capitalize">{orderData.fulfillmentType}</span>
                  <span className="text-[11px] text-[#78716C] block mt-0.5">{orderData.deliveryAddress}</span>
                </div>
                <div>
                  <span className="text-[11px] text-[#78716C] block">Scheduled Window</span>
                  <span className="font-semibold text-[#292524]">{orderData.scheduledTime || 'Ready Today'}</span>
                </div>
              </div>

              {/* Itemized summary */}
              <div>
                <h4 className="text-xs font-bold text-[#292524] uppercase tracking-wider mb-2">
                  Order Items
                </h4>
                <div className="divide-y divide-[#E8DFD8] border border-[#E8DFD8] rounded-xl overflow-hidden bg-[#FAF7F2]">
                  {orderData.items?.map((item: any) => (
                    <div key={item.id} className="p-3 flex justify-between items-start text-xs">
                      <div>
                        <span className="font-semibold text-[#292524]">
                          {item.quantity}x {item.productName}
                        </span>
                        {item.variantName && (
                          <span className="block text-[11px] text-[#78716C]">
                            Variant: {item.variantName}
                          </span>
                        )}
                        {item.customizationNotes && (
                          <span className="block text-[11px] italic text-[#C85A32]">
                            "{item.customizationNotes}"
                          </span>
                        )}
                      </div>
                      <span className="font-mono font-bold text-[#292524]">
                        {formatTzs(item.totalPriceTzs)}
                      </span>
                    </div>
                  ))}

                  <div className="p-3 bg-white flex justify-between text-xs font-bold text-[#292524]">
                    <span>Total Paid / Due</span>
                    <span className="font-mono text-sm text-[#C85A32]">
                      {formatTzs(orderData.totalTzs)}
                    </span>
                  </div>
                </div>
              </div>

              {cancelSuccessMsg && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-xs">
                  {cancelSuccessMsg}
                </div>
              )}

              {/* Cancellation Form Prompt */}
              {showCancelPrompt && (
                <form onSubmit={handleCancelRequest} className="p-3 bg-red-50/70 border border-red-200 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-red-900">Request Order Cancellation</span>
                    <button
                      type="button"
                      onClick={() => setShowCancelPrompt(false)}
                      className="text-stone-400 hover:text-stone-700"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="text-[11px] text-red-800">
                    State the reason for cancellation. Our store manager will be notified in the dashboard.
                  </p>
                  <textarea
                    rows={2}
                    required
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="e.g. Ordered incorrect variant / need to reschedule..."
                    className="w-full px-2.5 py-1.5 bg-white border border-red-300 rounded text-xs"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCancelPrompt(false)}
                      className="px-3 py-1 bg-white border border-stone-300 rounded text-stone-600 font-medium"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={cancelling || !cancelReason.trim()}
                      className="px-3 py-1 bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white rounded font-semibold"
                    >
                      {cancelling ? 'Submitting...' : 'Submit Cancellation'}
                    </button>
                  </div>
                </form>
              )}

              {/* Human Support & Actions Bar */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[#E8DFD8]">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenSupport?.(orderData.orderNumber);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Speak to a Human</span>
                </button>

                {orderData.status !== 'completed' && orderData.status !== 'cancelled' && !showCancelPrompt && (
                  <button
                    type="button"
                    onClick={() => setShowCancelPrompt(true)}
                    className="px-3 py-1.5 bg-white border border-stone-300 hover:border-red-400 text-stone-600 hover:text-red-700 rounded-lg text-xs font-medium transition-colors"
                  >
                    Request Cancellation
                  </button>
                )}
              </div>

              {/* Support Links */}
              <div className="pt-2 flex items-center justify-between text-xs text-[#78716C]">
                <span>Questions about this batch?</span>
                <div className="flex gap-2">
                  <a
                    href="https://wa.me/255754889900"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[#C85A32] font-semibold hover:underline"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                  <span>·</span>
                  <a
                    href="tel:+255754889900"
                    className="flex items-center gap-1 text-[#57534E] hover:underline"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Store</span>
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
