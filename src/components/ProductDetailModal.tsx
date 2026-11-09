import React, { useState } from 'react';
import { Product, ProductVariant } from '../types/bakery.ts';
import { formatTzs } from '../utils/format.ts';
import { X, Clock, AlertTriangle, Check, Plus, Minus, ShieldAlert } from 'lucide-react';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, variant?: ProductVariant, quantity?: number, notes?: string) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCart,
}) => {
  if (!product) return null;

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(
    product.variants && product.variants.length > 0 ? product.variants[0] : undefined
  );
  const [quantity, setQuantity] = useState(1);
  const [customizationNotes, setCustomizationNotes] = useState('');
  const [addedNotice, setAddedNotice] = useState(false);

  const basePrice = Number(product.basePriceTzs);
  const adjustment = selectedVariant ? Number(selectedVariant.priceAdjustmentTzs || 0) : 0;
  const unitPrice = basePrice + adjustment;
  const totalPrice = unitPrice * quantity;

  const handleAdd = () => {
    onAddToCart(product, selectedVariant, quantity, customizationNotes.trim());
    setAddedNotice(true);
    setTimeout(() => {
      setAddedNotice(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-[#E8DFD8] overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 text-stone-500 hover:text-stone-900 bg-white/80 hover:bg-white rounded-full transition-colors shadow-xs"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="overflow-y-auto p-6 sm:p-8 space-y-6">
          {/* Header Split: Image + Essential Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="aspect-4/3 rounded-xl overflow-hidden bg-[#F5EFEB] border border-[#E8DFD8]">
              <img
                src={product.imageUrl}
                alt={product.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex flex-col justify-between">
              <div>
                <div className="text-xs text-[#78716C] mb-1 flex items-center gap-1.5">
                  <span>LK Bakehouse Artisanal Selection</span>
                  {product.isFeatured && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="text-[#C85A32] font-semibold">Featured</span>
                    </>
                  )}
                </div>

                <h2 className="font-display text-2xl font-bold text-[#292524] leading-tight">
                  {product.name}
                </h2>

                <div className="mt-2 text-xl font-bold font-mono text-[#C85A32]">
                  {formatTzs(unitPrice)}
                </div>

                <p className="mt-3 text-xs text-[#57534E] leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Lead Time Indicator */}
              <div className="mt-4 p-3 bg-[#FAF7F2] rounded-lg border border-[#E8DFD8] flex items-center gap-2.5 text-xs text-[#57534E]">
                <Clock className="w-4 h-4 text-[#C85A32] shrink-0" />
                <span>
                  <strong>Preparation Lead Time:</strong> {product.leadTimeHours} {product.leadTimeHours === 1 ? 'hour' : 'hours'} required for freshly baked batches.
                </span>
              </div>
            </div>
          </div>

          {/* Variants Selector */}
          {product.variants && product.variants.length > 0 && (
            <div className="border-t border-[#F0EAE1] pt-5">
              <label className="block text-xs font-bold text-[#292524] uppercase tracking-wider mb-2.5">
                Select Size or Portion Variant
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {product.variants.map((v) => {
                  const adj = Number(v.priceAdjustmentTzs || 0);
                  const isSelected = selectedVariant?.id === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariant(v)}
                      className={`p-3 text-left rounded-lg border text-xs transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'border-[#C85A32] bg-[#FDF9F6] text-[#292524] shadow-xs'
                          : 'border-[#E8DFD8] bg-white text-[#57534E] hover:border-[#D5C7BD]'
                      }`}
                    >
                      <span className="font-semibold">{v.variantName || (v as any).name || 'Standard'}</span>
                      <span className="mt-1 font-mono text-[11px] text-[#78716C]">
                        {adj === 0 ? 'Standard price' : adj > 0 ? `+${formatTzs(adj)}` : `-${formatTzs(Math.abs(adj))}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Customization Notes (e.g. piped text, dietary preferences) */}
          <div className="border-t border-[#F0EAE1] pt-5">
            <label className="block text-xs font-bold text-[#292524] uppercase tracking-wider mb-1.5">
              Special Customization or Inscription Instructions (Optional)
            </label>
            <input
              type="text"
              value={customizationNotes}
              onChange={(e) => setCustomizationNotes(e.target.value)}
              placeholder='e.g., "Piped message: Happy 30th Lisa!", "Please slice loaf", "Less sugar glaze"'
              className="w-full px-3.5 py-2.5 text-xs bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg focus:outline-hidden focus:border-[#C85A32] text-[#292524] placeholder-[#A8A29E]"
              maxLength={150}
            />
          </div>

          {/* Allergen Disclosure Section */}
          <div className="border-t border-[#F0EAE1] pt-5">
            <div className="p-4 bg-[#FBF9F7] rounded-xl border border-[#E8DFD8] space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#854D0E]">
                <ShieldAlert className="w-4 h-4 text-[#D97706]" />
                <span>Allergen Transparency & Safety Information</span>
              </div>
              <p className="text-[11px] text-[#78716C] leading-relaxed">
                {product.allergens && product.allergens.length > 0 ? (
                  <>
                    This product contains: <strong className="text-[#292524]">{product.allergens.map((a) => a.name).join(', ')}</strong>.
                  </>
                ) : (
                  'No direct major allergens listed in base formulation.'
                )}
                <span className="block mt-1 text-[#A8A29E]">
                  Disclaimer: Prepared in an artisanal kitchen where wheat flour, nuts, dairy, eggs, and sesame are handled. We follow strict sanitation protocols, but cannot guarantee zero microscopic cross-contamination.
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Sticky Purchase Footer Module */}
        <div className="p-4 sm:p-6 bg-[#FAF7F2] border-t border-[#E8DFD8] flex items-center justify-between gap-4">
          {/* Quantity Stepper */}
          <div className="flex items-center border border-[#E8DFD8] rounded-lg bg-white overflow-hidden">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              className="p-2.5 text-stone-600 hover:text-stone-900 hover:bg-[#F5EFEB] disabled:opacity-40 transition-colors"
              aria-label="Decrease quantity"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="px-3.5 text-xs font-bold font-mono text-[#292524]">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="p-2.5 text-stone-600 hover:text-stone-900 hover:bg-[#F5EFEB] transition-colors"
              aria-label="Increase quantity"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Add to Cart CTA */}
          <button
            onClick={handleAdd}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-lg text-xs font-semibold text-white transition-all shadow-sm ${
              addedNotice
                ? 'bg-emerald-600'
                : 'bg-[#C85A32] hover:bg-[#B34F2B] active:scale-98'
            }`}
          >
            {addedNotice ? (
              <>
                <Check className="w-4 h-4" />
                <span>Added to Basket!</span>
              </>
            ) : (
              <>
                <span>Add to Basket</span>
                <span>·</span>
                <span className="font-mono">{formatTzs(totalPrice)}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
