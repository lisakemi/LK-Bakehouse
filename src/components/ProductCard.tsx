import React, { useState } from 'react';
import { Product } from '../types/bakery.ts';
import { formatTzs } from '../utils/format.ts';
import { Plus, Clock, Sparkles } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  onQuickAdd: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelect,
  onQuickAdd,
}) => {
  const [imageError, setImageError] = useState(false);

  return (
    <article
      onClick={() => onSelect(product)}
      className="group cursor-pointer flex flex-col bg-white rounded-xl border border-[#E8DFD8] hover:border-[#D5C7BD] shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden"
    >
      {/* Product Image Slot */}
      <div className="relative aspect-4/3 w-full bg-[#F3EDE6] overflow-hidden">
        {!imageError ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-[#F3EDE6] text-[#8C827A] p-4 text-center">
            <Sparkles className="w-8 h-8 text-[#C85A32] mb-1 opacity-70" />
            <span className="font-display text-sm font-semibold text-[#44403C]">LK Bakehouse</span>
            <span className="text-xs text-[#78716C]">{product.name}</span>
          </div>
        )}

        {/* Lead time notice */}
        {product.leadTimeHours > 4 && (
          <div className="absolute bottom-2 left-2 px-2 py-1 bg-[#292524]/85 backdrop-blur-xs text-white text-[11px] font-medium rounded-sm flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-[#E2885E]" />
            <span>{product.leadTimeHours}h lead time required</span>
          </div>
        )}
      </div>

      {/* Card Content Area */}
      <div className="p-5 flex flex-col flex-1 justify-between gap-3">
        <div>
          {/* Unboxed Metadata Line (No static pills) */}
          <div className="flex items-center gap-1.5 text-xs text-[#78716C] mb-1">
            <span>Freshly Baked</span>
            {product.leadTimeHours <= 2 && (
              <>
                <span aria-hidden="true">·</span>
                <span>Ready Today</span>
              </>
            )}
            {product.isFeatured && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-[#C85A32] font-semibold">House Specialty</span>
              </>
            )}
          </div>

          {/* Product Title */}
          <h3 className="font-display text-lg font-bold text-[#292524] group-hover:text-[#C85A32] transition-colors leading-snug">
            {product.name}
          </h3>

          {/* Short Description */}
          <p className="mt-1.5 text-xs text-[#57534E] line-clamp-2 leading-relaxed">
            {product.description}
          </p>

          {/* Allergen Quiet Disclosure */}
          {product.allergens && product.allergens.length > 0 && (
            <div className="mt-2.5 text-[11px] text-[#8C827A] flex items-center gap-1 flex-wrap">
              <span className="font-medium text-[#78716C]">Contains:</span>
              <span>{product.allergens.map((a) => a.name).join(', ')}</span>
            </div>
          )}
        </div>

        {/* Price & Action Row */}
        <div className="pt-3 border-t border-[#F0EAE1] flex items-center justify-between gap-2 mt-auto">
          <div>
            <span className="text-[11px] text-[#78716C] block leading-none">Starting from</span>
            <span className="text-base font-bold font-mono text-[#292524]">
              {formatTzs(product.basePriceTzs)}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (product.variants && product.variants.length > 0) {
                  onSelect(product);
                } else {
                  onQuickAdd(product);
                }
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-[#F5EFEB] hover:bg-[#C85A32] text-[#292524] hover:text-white rounded-md text-xs font-semibold transition-colors whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{product.variants && product.variants.length > 0 ? 'Customize' : 'Add'}</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};
