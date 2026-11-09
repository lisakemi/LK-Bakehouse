import React, { useState } from 'react';
import { CartItem } from '../types/bakery.ts';
import { formatTzs } from '../utils/format.ts';
import { X, Trash2, Plus, Minus, ArrowRight, Tag, ShoppingBag, CheckCircle } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (cartItemId: string, newQty: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onProceedToCheckout: () => void;
  appliedPromo: any | null;
  onApplyPromo: (code: string) => Promise<{ success: boolean; error?: string }>;
  onRemovePromo: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
  appliedPromo,
  onApplyPromo,
  onRemovePromo,
}) => {
  if (!isOpen) return null;

  const [promoInput, setPromoInput] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);

  const subtotal = items.reduce((acc, item) => acc + item.unitPriceTzs * item.quantity, 0);
  const discount = appliedPromo ? Number(appliedPromo.discountAmount || 0) : 0;
  const estimatedTotal = Math.max(0, subtotal - discount);

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;
    setPromoLoading(true);
    setPromoError(null);

    const result = await onApplyPromo(promoInput.trim());
    setPromoLoading(false);
    if (!result.success) {
      setPromoError(result.error || 'Invalid promotion code');
    } else {
      setPromoInput('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-stone-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-[#E8DFD8] shadow-2xl flex flex-col">
          {/* Drawer Header */}
          <div className="px-6 py-5 border-b border-[#E8DFD8] flex items-center justify-between bg-[#FAF7F2]">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#C85A32]" />
              <h2 className="font-display text-lg font-bold text-[#292524]">
                Your Bakery Basket
              </h2>
              <span className="text-xs font-mono text-[#78716C] bg-white border border-[#E8DFD8] px-2 py-0.5 rounded-full">
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-[#F0EAE1] rounded-md transition-colors"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Items List or Empty State */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12 text-[#78716C] space-y-3">
                <div className="w-16 h-16 rounded-full bg-[#FAF7F2] border border-[#E8DFD8] flex items-center justify-center text-[#C85A32]">
                  <ShoppingBag className="w-8 h-8 opacity-70" />
                </div>
                <h3 className="font-display text-lg font-semibold text-[#292524]">
                  Your basket is empty
                </h3>
                <p className="text-xs text-[#57534E] max-w-xs">
                  Discover our freshly baked artisanal sourdough, cinnamon rolls, and handcrafted celebration cakes.
                </p>
                <button
                  onClick={onClose}
                  className="mt-2 px-4 py-2 bg-[#C85A32] text-white text-xs font-semibold rounded-lg hover:bg-[#B34F2B] transition-colors"
                >
                  Explore Bakery Menu
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-[#FAF7F2] rounded-xl border border-[#E8DFD8] flex gap-3 relative group"
                >
                  <img
                    src={item.product.imageUrl}
                    alt={item.product.name}
                    className="w-18 h-18 object-cover rounded-lg border border-[#E8DFD8] shrink-0"
                  />

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-display text-sm font-bold text-[#292524] truncate">
                          {item.product.name}
                        </h4>
                        <button
                          onClick={() => onRemoveItem(item.id)}
                          className="text-stone-400 hover:text-red-600 transition-colors p-0.5"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {item.selectedVariant && (
                        <p className="text-[11px] text-[#78716C] mt-0.5">
                          Variant: {item.selectedVariant.name}
                        </p>
                      )}

                      {item.customizationNotes && (
                        <p className="text-[11px] italic text-[#C85A32] mt-0.5 truncate">
                          Note: "{item.customizationNotes}"
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 mt-2 border-t border-[#E8DFD8]">
                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-[#E8DFD8] rounded-md bg-white">
                        <button
                          onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                          className="p-1 text-stone-600 hover:text-stone-900 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-bold font-mono text-[#292524]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                          className="p-1 text-stone-600 hover:text-stone-900 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="font-mono text-xs font-bold text-[#292524]">
                        {formatTzs(item.unitPriceTzs * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Area: Promo + Calculation + Checkout */}
          {items.length > 0 && (
            <div className="p-6 bg-[#FAF7F2] border-t border-[#E8DFD8] space-y-4">
              {/* Promo Code Input */}
              {!appliedPromo ? (
                <form onSubmit={handleApplyPromo} className="space-y-1.5">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value)}
                        placeholder="Discount code (e.g. KARIBU10)"
                        className="w-full pl-8 pr-3 py-2 text-xs uppercase bg-white border border-[#E8DFD8] rounded-lg focus:outline-hidden focus:border-[#C85A32] text-[#292524]"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={promoLoading || !promoInput.trim()}
                      className="px-3.5 py-2 bg-[#292524] text-white text-xs font-semibold rounded-lg hover:bg-stone-800 disabled:opacity-50 transition-colors whitespace-nowrap"
                    >
                      {promoLoading ? 'Checking...' : 'Apply'}
                    </button>
                  </div>
                  {promoError && (
                    <p className="text-[11px] text-red-600 pl-1">{promoError}</p>
                  )}
                </form>
              ) : (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs text-emerald-800">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Code <strong>{appliedPromo.code}</strong> applied ({appliedPromo.name})
                    </span>
                  </div>
                  <button
                    onClick={onRemovePromo}
                    className="text-emerald-700 underline text-[11px] hover:text-emerald-900"
                  >
                    Remove
                  </button>
                </div>
              )}

              {/* Cost Summary */}
              <div className="space-y-1.5 text-xs text-[#57534E]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono font-medium text-[#292524]">{formatTzs(subtotal)}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Discount</span>
                    <span className="font-mono">-{formatTzs(discount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-[#78716C]">
                  <span>Fulfillment & Delivery</span>
                  <span>Calculated at checkout</span>
                </div>

                <div className="pt-2 border-t border-[#E8DFD8] flex justify-between text-sm font-bold text-[#292524]">
                  <span>Estimated Total</span>
                  <span className="font-mono text-base text-[#C85A32]">
                    {formatTzs(estimatedTotal)}
                  </span>
                </div>
              </div>

              {/* Checkout CTA */}
              <button
                onClick={() => {
                  onClose();
                  onProceedToCheckout();
                }}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#C85A32] hover:bg-[#B34F2B] text-white font-semibold text-xs rounded-lg transition-all shadow-sm active:scale-98"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
