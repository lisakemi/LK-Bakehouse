import React, { useState } from 'react';
import { CartItem } from '../types/bakery.ts';
import { formatTzs } from '../utils/format.ts';
import { X, MapPin, Store, Calendar, CreditCard, Phone, CheckCircle, ShieldCheck } from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  appliedPromo: any | null;
  onOrderSuccess: (orderData: any) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  appliedPromo,
  onOrderSuccess,
}) => {
  if (!isOpen) return null;

  const [fulfillmentType, setFulfillmentType] = useState<'pickup' | 'delivery'>('pickup');
  const [scheduledSlot, setScheduledSlot] = useState('Tomorrow Morning (9:00 AM - 12:00 PM)');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('+255 ');
  const [customerEmail, setCustomerEmail] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'m_pesa' | 'tigo_pesa' | 'airtel_money' | 'bank_transfer' | 'cash'>('m_pesa');
  
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const subtotal = items.reduce((acc, item) => acc + item.unitPriceTzs * item.quantity, 0);
  const discount = appliedPromo ? Number(appliedPromo.discountAmount || 0) : 0;
  const deliveryFee = fulfillmentType === 'delivery' ? 7000 : 0;
  const finalTotal = subtotal - discount + deliveryFee;

  const [idempotencyKey] = useState(() => `idemp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      setErrorMessage('Please enter your full name and Tanzanian phone number.');
      return;
    }

    if (fulfillmentType === 'delivery' && !deliveryAddress.trim()) {
      setErrorMessage('Please provide a specific delivery address in Dar es Salaam.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const payload = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        fulfillmentType,
        scheduledTime: scheduledSlot,
        deliveryAddress: fulfillmentType === 'delivery' ? deliveryAddress.trim() : 'Masaki Bakery Store Pickup',
        notes: notes.trim() || undefined,
        promoCode: appliedPromo?.code,
        paymentMethod,
        idempotencyKey,
        items: items.map((i) => ({
          productId: i.product.id,
          variantId: i.selectedVariant?.id,
          variantName: i.selectedVariant?.name,
          quantity: i.quantity,
          customizationNotes: i.customizationNotes,
        })),
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to place order');
      }

      onOrderSuccess(data.order);
      onClose();
    } catch (err: any) {
      console.error('Order submission error:', err);
      setErrorMessage(err.message || 'Something went wrong while placing your order.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-[#E8DFD8] overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-[#E8DFD8] bg-[#FAF7F2] flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-[#292524]">
              Complete Your Bakery Order
            </h2>
            <p className="text-xs text-[#78716C]">
              LK Bakehouse Masaki, Dar es Salaam
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-[#F0EAE1] rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 sm:p-8 space-y-6">
          {errorMessage && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
              {errorMessage}
            </div>
          )}

          {/* Step 1: Fulfillment Type */}
          <div>
            <label className="block text-xs font-bold text-[#292524] uppercase tracking-wider mb-2">
              1. Fulfillment Method
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFulfillmentType('pickup')}
                className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 ${
                  fulfillmentType === 'pickup'
                    ? 'border-[#C85A32] bg-[#FDF9F6] shadow-xs'
                    : 'border-[#E8DFD8] bg-white hover:border-[#D5C7BD]'
                }`}
              >
                <Store className={`w-5 h-5 shrink-0 mt-0.5 ${fulfillmentType === 'pickup' ? 'text-[#C85A32]' : 'text-stone-400'}`} />
                <div>
                  <div className="text-xs font-bold text-[#292524]">Masaki Store Pickup</div>
                  <div className="text-[11px] text-[#78716C] mt-0.5">Plot 42, Haile Selassie Rd (Free)</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFulfillmentType('delivery')}
                className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 ${
                  fulfillmentType === 'delivery'
                    ? 'border-[#C85A32] bg-[#FDF9F6] shadow-xs'
                    : 'border-[#E8DFD8] bg-white hover:border-[#D5C7BD]'
                }`}
              >
                <MapPin className={`w-5 h-5 shrink-0 mt-0.5 ${fulfillmentType === 'delivery' ? 'text-[#C85A32]' : 'text-stone-400'}`} />
                <div>
                  <div className="text-xs font-bold text-[#292524]">Dar es Salaam Delivery</div>
                  <div className="text-[11px] text-[#78716C] mt-0.5">Doorstep dispatch (+TSh 7,000)</div>
                </div>
              </button>
            </div>
          </div>

          {/* Scheduled Date/Time Slot */}
          <div>
            <label className="block text-xs font-bold text-[#292524] uppercase tracking-wider mb-2">
              2. Pickup or Delivery Time Window
            </label>
            <select
              value={scheduledSlot}
              onChange={(e) => setScheduledSlot(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#E8DFD8] rounded-lg focus:outline-hidden focus:border-[#C85A32] text-[#292524]"
            >
              <option value="Today Afternoon (3:00 PM - 6:00 PM)">Today Afternoon (3:00 PM - 6:00 PM)</option>
              <option value="Tomorrow Morning (9:00 AM - 12:00 PM)">Tomorrow Morning (9:00 AM - 12:00 PM)</option>
              <option value="Tomorrow Afternoon (2:00 PM - 5:00 PM)">Tomorrow Afternoon (2:00 PM - 5:00 PM)</option>
              <option value="Saturday Morning (8:00 AM - 11:30 AM)">Saturday Morning Weekend Batch (8:00 AM - 11:30 AM)</option>
              <option value="Sunday Brunch Batch (9:00 AM - 1:00 PM)">Sunday Brunch Batch (9:00 AM - 1:00 PM)</option>
            </select>
          </div>

          {/* Step 3: Contact & Delivery Details */}
          <div>
            <label className="block text-xs font-bold text-[#292524] uppercase tracking-wider mb-2">
              3. Customer Contact Information
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] text-[#78716C] block mb-1">Full Name *</span>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Lisa Rutasitara"
                  className="w-full px-3 py-2 text-xs bg-white border border-[#E8DFD8] rounded-lg focus:outline-hidden focus:border-[#C85A32] text-[#292524]"
                />
              </div>

              <div>
                <span className="text-[11px] text-[#78716C] block mb-1">Phone Number (Tanzania) *</span>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+255 754 123 456"
                  className="w-full px-3 py-2 text-xs bg-white border border-[#E8DFD8] rounded-lg focus:outline-hidden focus:border-[#C85A32] text-[#292524] font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <span className="text-[11px] text-[#78716C] block mb-1">Email Address (Optional, for digital receipt)</span>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3 py-2 text-xs bg-white border border-[#E8DFD8] rounded-lg focus:outline-hidden focus:border-[#C85A32] text-[#292524]"
                />
              </div>

              {fulfillmentType === 'delivery' && (
                <div className="sm:col-span-2">
                  <span className="text-[11px] text-[#78716C] block mb-1">Delivery Address & Landmarks in Dar es Salaam *</span>
                  <textarea
                    required
                    rows={2}
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Street name, house number, area (e.g. Oysterbay, Masaki, Mikocheni, Upanga) & nearest landmark"
                    className="w-full px-3 py-2 text-xs bg-white border border-[#E8DFD8] rounded-lg focus:outline-hidden focus:border-[#C85A32] text-[#292524]"
                  />
                </div>
              )}

              <div className="sm:col-span-2">
                <span className="text-[11px] text-[#78716C] block mb-1">Order Notes or Gate Access (Optional)</span>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Ring bell at main gate, handle fragile cake gently"
                  className="w-full px-3 py-2 text-xs bg-white border border-[#E8DFD8] rounded-lg focus:outline-hidden focus:border-[#C85A32] text-[#292524]"
                />
              </div>
            </div>
          </div>

          {/* Step 4: Payment Method */}
          <div>
            <label className="block text-xs font-bold text-[#292524] uppercase tracking-wider mb-2">
              4. Payment Method
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {[
                { id: 'm_pesa', label: 'Vodacom M-Pesa' },
                { id: 'tigo_pesa', label: 'Tigo Pesa' },
                { id: 'airtel_money', label: 'Airtel Money' },
                { id: 'bank_transfer', label: 'CRDB / NMB Transfer' },
                { id: 'cash', label: 'Cash upon Pickup' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id as any)}
                  className={`p-3 rounded-lg border text-left text-xs transition-colors ${
                    paymentMethod === m.id
                      ? 'border-[#C85A32] bg-[#FDF9F6] font-semibold text-[#292524]'
                      : 'border-[#E8DFD8] bg-white text-[#57534E] hover:border-[#D5C7BD]'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <div className="mt-2.5 p-3 bg-[#FAF7F2] rounded-lg border border-[#E8DFD8] text-[11px] text-[#78716C] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#C85A32] shrink-0" />
              <span>
                Payment instructions (Lipa Number or Bank details) will be displayed on confirmation and sent via SMS / WhatsApp.
              </span>
            </div>
          </div>

          {/* Order Financial Summary */}
          <div className="p-4 bg-[#FAF7F2] rounded-xl border border-[#E8DFD8] space-y-1.5 text-xs text-[#57534E]">
            <div className="flex justify-between">
              <span>Items Subtotal ({items.length} items)</span>
              <span className="font-mono text-[#292524]">{formatTzs(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Promotional Discount</span>
                <span className="font-mono">-{formatTzs(discount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Delivery Fee</span>
              <span className="font-mono text-[#292524]">{formatTzs(deliveryFee)}</span>
            </div>
            <div className="pt-2 border-t border-[#E8DFD8] flex justify-between text-sm font-bold text-[#292524]">
              <span>Amount Due</span>
              <span className="font-mono text-base text-[#C85A32]">{formatTzs(finalTotal)}</span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 bg-[#C85A32] hover:bg-[#B34F2B] text-white font-semibold text-xs rounded-lg transition-all shadow-sm active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Placing Order in Database...</span>
            ) : (
              <span>Submit Bakery Order ({formatTzs(finalTotal)})</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
