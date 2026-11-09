import React, { useState, useEffect } from 'react';
import { formatTzs, formatDate } from '../utils/format.ts';
import {
  CheckCircle2,
  Clock,
  MapPin,
  Truck,
  ShoppingBag,
  Phone,
  Mail,
  MessageSquare,
  Instagram,
  UserCheck,
  ChevronRight,
  ExternalLink,
  AlertCircle,
  Copy,
  Check,
  Sparkles,
} from 'lucide-react';

interface OrderConfirmationModalProps {
  orderNumber: string;
  isOpen: boolean;
  onClose: () => void;
  onOpenTracking: (orderNumber: string) => void;
  onOpenSupport: (orderNumber?: string) => void;
}

export const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({
  orderNumber,
  isOpen,
  onClose,
  onOpenTracking,
  onOpenSupport,
}) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);

  useEffect(() => {
    if (isOpen && orderNumber) {
      fetchConfirmation();
    }
  }, [isOpen, orderNumber]);

  const fetchConfirmation = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderNumber}/confirmation`);
      const payload = await res.json();
      if (res.ok) {
        setData(payload);
      }
    } catch (err) {
      console.error('Error fetching order confirmation:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(orderNumber);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const order = data?.order;
  const products = data?.orderedProducts || [];
  const fulfillment = data?.fulfillmentDetails || {};
  const channels = data?.contactChannels || {};
  const automatedResponse = data?.automatedResponse || {};
  const isDelivery = order?.fulfillmentType === 'delivery';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-[#E8DFD8] my-8 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Header Banner */}
        <div className="bg-[#292524] text-white p-6 relative">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-widest font-semibold block">
                  Authoritative Order Record
                </span>
                <h3 className="font-display text-xl sm:text-2xl font-bold">
                  Order Successfully Saved!
                </h3>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-stone-400 hover:text-white text-xl leading-none p-1"
            >
              ✕
            </button>
          </div>

          <p className="text-xs text-stone-300 mt-3 leading-relaxed">
            Asante sana, <strong>{order?.customerName || 'Valued Customer'}</strong>! Your order is saved in the LK Bakehouse database.
            Below is your official confirmation reflecting the saved records and fulfillment specifications.
          </p>

          {/* Reference pill */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 p-3 bg-stone-800/80 rounded-xl border border-stone-700/80">
            <div>
              <span className="text-[10px] text-stone-400 uppercase block font-semibold">Order Reference Number:</span>
              <span className="font-mono text-base font-bold text-[#E8DFD8] tracking-wider">{orderNumber}</span>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-700 hover:bg-stone-600 rounded-lg text-xs font-medium text-stone-200 transition-colors"
            >
              {copiedRef ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedRef ? 'Copied' : 'Copy Ref'}</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {loading ? (
            <div className="py-12 text-center text-stone-400 space-y-2">
              <div className="w-6 h-6 border-2 border-[#C85A32] border-t-transparent rounded-full animate-spin mx-auto" />
              <p>Retrieving authoritative order confirmation...</p>
            </div>
          ) : !data ? (
            <div className="p-4 bg-red-50 text-red-800 rounded-xl border border-red-200">
              Unable to load order details for #{orderNumber}.
            </div>
          ) : (
            <>
              {/* Order Status & Verification Distinction Notice */}
              <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#E8DFD8] space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-[#E8DFD8]">
                  <span className="font-semibold text-[#292524] flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#C85A32]" />
                    <span>Current Order Status:</span>
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    order?.status === 'confirmed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : order?.status === 'pending_review'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-stone-200 text-stone-800'
                  }`}>
                    {order?.statusLabel}
                  </span>
                </div>

                <p className="text-[11px] text-[#78716C]">
                  {order?.status === 'pending_review' ? (
                    <span>
                      <strong>Distinction Notice:</strong> This confirmation acknowledges <em>order receipt</em> by LK Bakehouse. Our Masaki baking staff will inspect ingredient availability and schedule slots before marking it as officially <em>accepted</em>.
                    </span>
                  ) : (
                    <span>
                      Your order has been officially confirmed and scheduled into our stone deck baking rotation.
                    </span>
                  )}
                </p>

                {/* Automated response preview */}
                {automatedResponse?.renderedBody && (
                  <div className="p-3 bg-white rounded-lg border border-[#E8DFD8] text-[11px] text-[#57534E] italic font-serif">
                    &ldquo;{automatedResponse.renderedBody}&rdquo;
                  </div>
                )}
              </div>

              {/* Fulfillment Method & Specifics */}
              <div className="bg-white p-4 rounded-xl border border-[#E8DFD8] space-y-3">
                <h4 className="font-display text-sm font-bold text-[#292524] flex items-center gap-2">
                  {isDelivery ? <Truck className="w-4 h-4 text-[#C85A32]" /> : <MapPin className="w-4 h-4 text-[#C85A32]" />}
                  <span>{fulfillment.title}</span>
                </h4>

                {isDelivery ? (
                  <div className="space-y-2 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-[#78716C]">Delivery Address:</span>
                      <strong className="text-[#292524] font-medium text-right max-w-xs">{fulfillment.deliveryStreetAddress}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#78716C]">Standard Delivery Fee:</span>
                      <span className="font-mono font-bold text-[#292524]">{formatTzs(fulfillment.deliveryFeeTzs)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#78716C]">Expected Window:</span>
                      <span className="font-semibold text-emerald-700">{fulfillment.expectedFulfillmentWindow}</span>
                    </div>
                    <p className="text-[10px] text-[#78716C] bg-stone-50 p-2 rounded border border-stone-200/80">
                      {fulfillment.driverCalloutNotice}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-[#78716C]">Masaki Store Location:</span>
                      <strong className="text-[#292524] font-medium text-right max-w-xs">{fulfillment.pickupLocation}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#78716C]">Bakehouse Operating Hours:</span>
                      <span className="text-[#292524]">{fulfillment.operatingHours}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#78716C]">Expected Pickup Time:</span>
                      <span className="font-semibold text-emerald-700">{fulfillment.expectedPickupTime}</span>
                    </div>
                    <p className="text-[10px] text-[#78716C] bg-stone-50 p-2 rounded border border-stone-200/80">
                      {fulfillment.pickupInstructions}
                    </p>
                  </div>
                )}
              </div>

              {/* Ordered Products & Line Items */}
              <div className="bg-white rounded-xl border border-[#E8DFD8] overflow-hidden">
                <div className="p-3 bg-[#FAF7F2] border-b border-[#E8DFD8] font-bold text-[#292524] flex items-center justify-between">
                  <span>Ordered Products ({products.length})</span>
                  <span className="text-[11px] font-mono text-[#78716C]">Frozen Line Pricing</span>
                </div>

                <div className="divide-y divide-[#F0EAE1]">
                  {products.map((p: any) => (
                    <div key={p.id} className="p-3 flex items-center justify-between gap-3">
                      <div>
                        <strong className="text-[#292524] block">{p.productName}</strong>
                        {p.variantName && (
                          <span className="text-[10px] text-[#78716C] block">Variant: {p.variantName}</span>
                        )}
                        {p.customizationInstructions && (
                          <span className="text-[10px] text-[#C85A32] italic block">Note: &ldquo;{p.customizationInstructions}&rdquo;</span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-[#78716C] block text-[11px] font-mono">{p.quantity} × {formatTzs(p.unitPriceTzs)}</span>
                        <strong className="font-mono text-xs font-bold text-[#292524]">{formatTzs(p.lineTotalTzs)}</strong>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals Summary */}
                <div className="p-4 bg-[#FAF7F2] border-t border-[#E8DFD8] space-y-1.5">
                  <div className="flex justify-between text-[#78716C]">
                    <span>Subtotal:</span>
                    <span className="font-mono">{formatTzs(order?.subtotalTzs)}</span>
                  </div>
                  {order?.discountAmountTzs > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Discount Applied:</span>
                      <span className="font-mono">-{formatTzs(order?.discountAmountTzs)}</span>
                    </div>
                  )}
                  {isDelivery && (
                    <div className="flex justify-between text-[#78716C]">
                      <span>Delivery Fee:</span>
                      <span className="font-mono">{formatTzs(order?.deliveryFeeTzs)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-[#E8DFD8] font-bold text-sm text-[#292524]">
                    <span>Total Amount:</span>
                    <span className="font-mono text-[#C85A32] text-base">{formatTzs(order?.totalAmountTzs)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-[#78716C] pt-1">
                    <span>Payment Status:</span>
                    <span className={`font-semibold ${order?.isFullyPaid ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {order?.isFullyPaid ? 'Paid in Full' : `Balance Due: ${formatTzs(order?.outstandingBalanceTzs)}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Click-to-Contact Channels for Further Assistance */}
              <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#E8DFD8] space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-display text-xs font-bold text-[#292524]">
                    Need Further Assistance?
                  </h4>
                  <span className="text-[10px] text-[#78716C]">Official Bakery Channels</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <a
                    href={channels.links?.phoneClickUrl}
                    className="p-2.5 bg-white border border-[#E8DFD8] rounded-lg hover:border-[#C85A32] transition-colors flex flex-col items-center text-center gap-1"
                  >
                    <Phone className="w-4 h-4 text-[#C85A32]" />
                    <span className="text-[10px] font-bold text-[#292524]">Call Shop</span>
                    <span className="text-[9px] text-[#78716C] truncate w-full">{channels.phone}</span>
                  </a>

                  <a
                    href={channels.links?.whatsappClickUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 bg-white border border-[#E8DFD8] rounded-lg hover:border-emerald-500 transition-colors flex flex-col items-center text-center gap-1"
                  >
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    <span className="text-[10px] font-bold text-[#292524]">WhatsApp</span>
                    <span className="text-[9px] text-[#78716C]">Direct Chat</span>
                  </a>

                  <a
                    href={channels.links?.emailClickUrl}
                    className="p-2.5 bg-white border border-[#E8DFD8] rounded-lg hover:border-blue-500 transition-colors flex flex-col items-center text-center gap-1"
                  >
                    <Mail className="w-4 h-4 text-blue-600" />
                    <span className="text-[10px] font-bold text-[#292524]">Email Us</span>
                    <span className="text-[9px] text-[#78716C] truncate w-full">{channels.email}</span>
                  </a>

                  <a
                    href={channels.links?.instagramClickUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 bg-white border border-[#E8DFD8] rounded-lg hover:border-pink-500 transition-colors flex flex-col items-center text-center gap-1"
                  >
                    <Instagram className="w-4 h-4 text-pink-600" />
                    <span className="text-[10px] font-bold text-[#292524]">Instagram</span>
                    <span className="text-[9px] text-[#78716C] truncate w-full">{channels.instagram}</span>
                  </a>
                </div>
              </div>

              {/* Human Handoff Option */}
              <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200/80 flex items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <UserCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-emerald-950 font-bold block">Need direct support from a human?</strong>
                    <span className="text-[11px] text-emerald-800 block">
                      Connect with our Masaki store manager. Automated bot replies will be paused to prevent contradiction.
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onClose();
                    onOpenSupport(orderNumber);
                  }}
                  className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold whitespace-nowrap transition-colors shadow-xs"
                >
                  Speak to a Human
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#FAF7F2] border-t border-[#E8DFD8] flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => {
              onClose();
              onOpenTracking(orderNumber);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#C85A32] hover:bg-[#B34F2B] text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
          >
            <Clock className="w-4 h-4" />
            <span>Track Order Status</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-stone-50 border border-[#E8DFD8] text-[#57534E] text-xs font-semibold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
