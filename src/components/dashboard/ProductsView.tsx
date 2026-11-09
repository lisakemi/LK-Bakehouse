import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Archive,
  CheckCircle,
  XCircle,
  AlertCircle,
  Sparkles,
  Clock,
  Tag,
  DollarSign,
  Package,
  Layers,
  Image as ImageIcon,
  Check,
  X,
  ExternalLink,
} from 'lucide-react';
import { formatTzs } from '../../utils/format.ts';
import { authFetch, getStaffAuthHeaders } from '../../lib/auth-client.ts';

interface ProductVariant {
  id?: string;
  variantName: string;
  sku?: string;
  priceAdjustmentTzs: number | string;
  isAvailable?: boolean;
}

interface AllergenItem {
  id: string;
  name: string;
}

interface ProductCategory {
  id: string;
  name: string;
  slug: string;
}

interface ProductItem {
  id: string;
  categoryId?: string;
  sku?: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  basePriceTzs: string;
  leadTimeHours?: number;
  isFeatured?: boolean;
  isAvailable?: boolean;
  isArchived?: boolean;
  variants?: ProductVariant[];
  allergens?: AllergenItem[];
}

const BAKERY_IMAGE_PRESETS = [
  {
    name: 'Artisan Sourdough',
    url: 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Butter Croissant',
    url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Rustic Baguette',
    url: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Celebration Cake',
    url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Brioche Loaf',
    url: 'https://images.unsplash.com/photo-1608198093002-ad4e005484ec?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Olive Focaccia',
    url: 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Cinnamon Roll',
    url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Fruit Danish',
    url: 'https://images.unsplash.com/photo-1509365465985-25d11c17e812?auto=format&fit=crop&w=800&q=80',
  },
];

export const ProductsView: React.FC = () => {
  const [productsList, setProductsList] = useState<ProductItem[]>([]);
  const [categoriesList, setCategoriesList] = useState<ProductCategory[]>([]);
  const [allergensList, setAllergensList] = useState<AllergenItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'sold_out'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formBasePrice, setFormBasePrice] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formLeadTime, setFormLeadTime] = useState('2');
  const [formIsFeatured, setFormIsFeatured] = useState(false);
  const [formIsAvailable, setFormIsAvailable] = useState(true);
  const [formVariants, setFormVariants] = useState<{ variantName: string; priceAdjustmentTzs: string; sku: string }[]>([
    { variantName: 'Standard', priceAdjustmentTzs: '0', sku: '' },
  ]);
  const [formSelectedAllergens, setFormSelectedAllergens] = useState<string[]>([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes, algRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/categories'),
        fetch('/api/allergens').catch(() => null),
      ]);

      if (prodRes.ok) {
        const pData = await prodRes.json();
        setProductsList(Array.isArray(pData) ? pData : []);
      }
      if (catRes.ok) {
        const cData = await catRes.json();
        setCategoriesList(Array.isArray(cData) ? cData : []);
      }
      if (algRes && algRes.ok) {
        const aData = await algRes.json();
        setAllergensList(Array.isArray(aData) ? aData : []);
      }
    } catch (err) {
      console.error('Error loading products data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormName('');
    setFormCategoryId(categoriesList[0]?.id || '');
    setFormBasePrice('');
    setFormDescription('');
    setFormImageUrl(BAKERY_IMAGE_PRESETS[0].url);
    setFormSku('');
    setFormLeadTime('2');
    setFormIsFeatured(false);
    setFormIsAvailable(true);
    setFormVariants([{ variantName: 'Standard', priceAdjustmentTzs: '0', sku: '' }]);
    setFormSelectedAllergens([]);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: ProductItem) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormCategoryId(p.categoryId || categoriesList[0]?.id || '');
    setFormBasePrice(p.basePriceTzs || '');
    setFormDescription(p.description || '');
    setFormImageUrl(p.imageUrl || BAKERY_IMAGE_PRESETS[0].url);
    setFormSku(p.sku || '');
    setFormLeadTime(String(p.leadTimeHours || 2));
    setFormIsFeatured(Boolean(p.isFeatured));
    setFormIsAvailable(p.isAvailable !== false);
    setFormVariants(
      p.variants && p.variants.length > 0
        ? p.variants.map((v) => ({
            variantName: v.variantName,
            priceAdjustmentTzs: String(v.priceAdjustmentTzs || 0),
            sku: v.sku || '',
          }))
        : [{ variantName: 'Standard', priceAdjustmentTzs: '0', sku: '' }]
    );
    setFormSelectedAllergens(p.allergens ? p.allergens.map((a) => a.id) : []);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleToggleAvailability = async (p: ProductItem) => {
    const nextStatus = !p.isAvailable;
    // Optimistic UI update
    setProductsList((prev) =>
      prev.map((item) => (item.id === p.id ? { ...item, isAvailable: nextStatus } : item))
    );

    try {
      const res = await authFetch(`/api/products/${p.id}/availability`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: nextStatus }),
      });
      if (!res.ok) {
        // revert on failure
        fetchInitialData();
      }
    } catch (err) {
      console.error('Failed to toggle availability:', err);
      fetchInitialData();
    }
  };

  const handleArchive = async (p: ProductItem) => {
    if (!window.confirm(`Are you sure you want to archive "${p.name}"? It will be removed from the catalog.`)) {
      return;
    }

    try {
      const res = await authFetch(`/api/products/${p.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setProductsList((prev) => prev.filter((item) => item.id !== p.id));
      }
    } catch (err) {
      console.error('Failed to archive product:', err);
    }
  };

  const handleAddVariantRow = () => {
    setFormVariants([...formVariants, { variantName: '', priceAdjustmentTzs: '0', sku: '' }]);
  };

  const handleRemoveVariantRow = (index: number) => {
    setFormVariants(formVariants.filter((_, idx) => idx !== index));
  };

  const handleVariantChange = (index: number, field: string, val: string) => {
    setFormVariants(
      formVariants.map((item, idx) => (idx === index ? { ...item, [field]: val } : item))
    );
  };

  const toggleAllergen = (aId: string) => {
    setFormSelectedAllergens((prev) =>
      prev.includes(aId) ? prev.filter((id) => id !== aId) : [...prev, aId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Product name is required');
      return;
    }
    if (!formBasePrice || Number(formBasePrice) <= 0) {
      setFormError('Please provide a valid base price in TZS');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    const payload = {
      name: formName.trim(),
      categoryId: formCategoryId || undefined,
      basePriceTzs: formBasePrice,
      description: formDescription.trim(),
      imageUrl: formImageUrl.trim() || BAKERY_IMAGE_PRESETS[0].url,
      sku: formSku.trim() || undefined,
      leadTimeHours: Number(formLeadTime || 2),
      isFeatured: formIsFeatured,
      isAvailable: formIsAvailable,
      variants: formVariants.filter((v) => v.variantName.trim()),
      allergenIds: formSelectedAllergens,
    };

    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save product');
      }

      setIsModalOpen(false);
      fetchInitialData();
    } catch (err: any) {
      setFormError(err.message || 'Error saving product');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = productsList.filter((p) => {
    if (p.isArchived) return false;
    if (selectedCategory !== 'all' && String(p.categoryId) !== String(selectedCategory)) {
      return false;
    }
    if (availabilityFilter === 'available' && !p.isAvailable) return false;
    if (availabilityFilter === 'sold_out' && p.isAvailable) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchDesc = p.description?.toLowerCase().includes(q);
      const matchSku = p.sku?.toLowerCase().includes(q);
      if (!matchName && !matchDesc && !matchSku) return false;
    }
    return true;
  });

  const availableCount = productsList.filter((p) => p.isAvailable && !p.isArchived).length;
  const soldOutCount = productsList.filter((p) => !p.isAvailable && !p.isArchived).length;
  const featuredCount = productsList.filter((p) => p.isFeatured && !p.isArchived).length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Actions */}
      <div className="bg-white p-5 rounded-xl border border-[#E8DFD8] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold text-[#292524]">
            Bakery Products & Menu Management
          </h2>
          <p className="text-xs text-[#78716C] mt-0.5">
            Manage your daily baked goods, authoritative prices, variants, allergen disclosures, and stock availability.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 bg-[#C85A32] hover:bg-[#B34F2B] text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#E8DFD8] shadow-xs">
          <span className="text-[11px] font-semibold text-[#78716C] uppercase tracking-wider block">
            Total Catalog
          </span>
          <span className="text-2xl font-bold text-[#292524] mt-1 block">
            {productsList.filter((p) => !p.isArchived).length}
          </span>
          <span className="text-[10px] text-stone-400">Active bakery recipes</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E8DFD8] shadow-xs">
          <span className="text-[11px] font-semibold text-[#78716C] uppercase tracking-wider block">
            Available Today
          </span>
          <span className="text-2xl font-bold text-emerald-600 mt-1 block">
            {availableCount}
          </span>
          <span className="text-[10px] text-stone-400">Orderable online & POS</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E8DFD8] shadow-xs">
          <span className="text-[11px] font-semibold text-[#78716C] uppercase tracking-wider block">
            Sold Out / Batch Out
          </span>
          <span className="text-2xl font-bold text-amber-600 mt-1 block">
            {soldOutCount}
          </span>
          <span className="text-[10px] text-stone-400">Temporarily paused</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E8DFD8] shadow-xs">
          <span className="text-[11px] font-semibold text-[#78716C] uppercase tracking-wider block">
            Featured Items
          </span>
          <span className="text-2xl font-bold text-[#C85A32] mt-1 block">
            {featuredCount}
          </span>
          <span className="text-[10px] text-stone-400">Highlighted on homepage</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#E8DFD8] shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products by name, SKU, or ingredients..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg focus:outline-hidden focus:border-[#C85A32] text-[#292524]"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg text-[#292524] focus:outline-hidden focus:border-[#C85A32]"
          >
            <option value="all">All Categories</option>
            {categoriesList.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value as any)}
            className="px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg text-[#292524] focus:outline-hidden focus:border-[#C85A32]"
          >
            <option value="all">All Availability</option>
            <option value="available">In Stock Only</option>
            <option value="sold_out">Sold Out Only</option>
          </select>
        </div>
      </div>

      {/* Product Catalog Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-stone-400">Loading bakery catalog...</div>
      ) : filteredProducts.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-xl border border-[#E8DFD8] p-8 space-y-3">
          <Package className="w-8 h-8 text-stone-300 mx-auto" />
          <p className="text-sm font-semibold text-stone-700">No products match your search.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setAvailabilityFilter('all');
            }}
            className="text-xs text-[#C85A32] underline hover:text-[#B34F2B]"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.map((p) => {
            const cat = categoriesList.find((c) => c.id === p.categoryId);
            return (
              <div
                key={p.id}
                className={`bg-white rounded-xl border overflow-hidden shadow-xs flex flex-col transition-all hover:shadow-md ${
                  p.isAvailable ? 'border-[#E8DFD8]' : 'border-stone-200 opacity-85'
                }`}
              >
                {/* Product Image & Badges */}
                <div className="relative h-44 bg-stone-100 overflow-hidden">
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = BAKERY_IMAGE_PRESETS[0].url;
                    }}
                  />
                  <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
                    {cat && (
                      <span className="px-2 py-0.5 rounded-full bg-stone-900/80 backdrop-blur-xs text-white text-[10px] font-semibold">
                        {cat.name}
                      </span>
                    )}
                    {p.isFeatured && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-semibold flex items-center gap-1 shadow-xs">
                        <Sparkles className="w-2.5 h-2.5" /> Featured
                      </span>
                    )}
                  </div>

                  <div className="absolute top-2.5 right-2.5">
                    <button
                      onClick={() => handleToggleAvailability(p)}
                      title={p.isAvailable ? 'Click to mark as Sold Out' : 'Click to mark as Available'}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 shadow-sm transition-transform active:scale-95 ${
                        p.isAvailable
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-stone-800 hover:bg-stone-900 text-amber-300'
                      }`}
                    >
                      {p.isAvailable ? (
                        <>
                          <CheckCircle className="w-3 h-3" /> Available
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3" /> Sold Out
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-display text-base font-bold text-[#292524] line-clamp-1">
                        {p.name}
                      </h4>
                      <span className="font-mono text-sm font-bold text-[#C85A32] whitespace-nowrap">
                        {formatTzs(p.basePriceTzs)}
                      </span>
                    </div>

                    <p className="text-xs text-[#78716C] mt-1 line-clamp-2 leading-relaxed">
                      {p.description}
                    </p>

                    {/* Variants preview */}
                    {p.variants && p.variants.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {p.variants.map((v, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] bg-[#FAF7F2] border border-[#E8DFD8] text-[#57534E] px-2 py-0.5 rounded"
                          >
                            {v.variantName}
                            {Number(v.priceAdjustmentTzs) > 0
                              ? ` (+${formatTzs(v.priceAdjustmentTzs)})`
                              : ''}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Card Footer Actions */}
                  <div className="pt-3 border-t border-[#F0EAE1] flex items-center justify-between text-xs">
                    <span className="text-[10px] font-mono text-stone-400">
                      {p.sku || `PRD-${p.id.slice(0, 6)}`}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="px-2.5 py-1 text-stone-600 hover:text-stone-900 hover:bg-[#FAF7F2] border border-[#E8DFD8] rounded-md transition-colors flex items-center gap-1"
                      >
                        <Edit2 className="w-3 h-3" /> Edit
                      </button>

                      <button
                        onClick={() => handleArchive(p)}
                        className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                        title="Archive product"
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div
            className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-[#E8DFD8] overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#E8DFD8] bg-[#FAF7F2] flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-bold text-[#292524]">
                  {editingProduct ? 'Edit Bakery Product' : 'Add New Bakery Product'}
                </h3>
                <p className="text-xs text-[#78716C]">
                  Configure item specifications, pricing, variants, and dietary disclosures
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-stone-500 hover:text-stone-900 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#292524] block mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Traditional Cardamom Babka"
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg focus:outline-hidden focus:border-[#C85A32]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#292524] block mb-1">
                    Category *
                  </label>
                  <select
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg focus:outline-hidden focus:border-[#C85A32]"
                  >
                    {categoriesList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#292524] block mb-1">
                    Base Price (TZS) *
                  </label>
                  <input
                    type="number"
                    step="100"
                    min="0"
                    required
                    value={formBasePrice}
                    onChange={(e) => setFormBasePrice(e.target.value)}
                    placeholder="e.g. 12000"
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg focus:outline-hidden focus:border-[#C85A32] font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#292524] block mb-1">
                    SKU Code
                  </label>
                  <input
                    type="text"
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    placeholder="e.g. LKB-BBK-01"
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg focus:outline-hidden focus:border-[#C85A32] font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#292524] block mb-1">
                    Lead Time (Hours)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formLeadTime}
                    onChange={(e) => setFormLeadTime(e.target.value)}
                    placeholder="2"
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg focus:outline-hidden focus:border-[#C85A32]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#292524] block mb-1">
                  Product Description *
                </label>
                <textarea
                  rows={2}
                  required
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Artisan crumb profile, natural fermentation notes, serving recommendations..."
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg focus:outline-hidden focus:border-[#C85A32]"
                />
              </div>

              {/* Image URL & Quick Presets */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#292524] block">
                  Product Image URL
                </label>
                <input
                  type="url"
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg focus:outline-hidden focus:border-[#C85A32]"
                />
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[10px] text-stone-400 self-center mr-1">Quick Presets:</span>
                  {BAKERY_IMAGE_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormImageUrl(preset.url)}
                      className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                        formImageUrl === preset.url
                          ? 'bg-[#C85A32] text-white border-[#C85A32]'
                          : 'bg-[#FAF7F2] text-[#57534E] border-[#E8DFD8] hover:bg-white'
                      }`}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Variants Section */}
              <div className="p-3.5 bg-[#FAF7F2] rounded-xl border border-[#E8DFD8] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#292524] flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#C85A32]" />
                    <span>Product Variants & Sizes</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddVariantRow}
                    className="text-[11px] text-[#C85A32] font-semibold hover:underline flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" /> Add Variant
                  </button>
                </div>

                <div className="space-y-2">
                  {formVariants.map((v, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        required
                        value={v.variantName}
                        onChange={(e) => handleVariantChange(idx, 'variantName', e.target.value)}
                        placeholder="Variant name (e.g. Sliced, 500g)"
                        className="flex-2 px-2.5 py-1.5 text-xs bg-white border border-[#E8DFD8] rounded-md focus:outline-hidden focus:border-[#C85A32]"
                      />
                      <div className="flex-1 flex items-center gap-1">
                        <span className="text-[11px] text-stone-400">+TSh</span>
                        <input
                          type="number"
                          step="100"
                          value={v.priceAdjustmentTzs}
                          onChange={(e) => handleVariantChange(idx, 'priceAdjustmentTzs', e.target.value)}
                          placeholder="Price diff"
                          className="w-full px-2 py-1.5 text-xs bg-white border border-[#E8DFD8] rounded-md focus:outline-hidden focus:border-[#C85A32] font-mono"
                        />
                      </div>
                      {formVariants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveVariantRow(idx)}
                          className="p-1.5 text-stone-400 hover:text-red-600 rounded"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="pt-2 flex flex-wrap items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#292524]">
                  <input
                    type="checkbox"
                    checked={formIsAvailable}
                    onChange={(e) => setFormIsAvailable(e.target.checked)}
                    className="w-4 h-4 rounded text-[#C85A32] focus:ring-[#C85A32]"
                  />
                  <span>Available for Order Today</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#292524]">
                  <input
                    type="checkbox"
                    checked={formIsFeatured}
                    onChange={(e) => setFormIsFeatured(e.target.checked)}
                    className="w-4 h-4 rounded text-[#C85A32] focus:ring-[#C85A32]"
                  />
                  <span>Feature on Storefront Homepage</span>
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 border-t border-[#E8DFD8] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 border border-[#E8DFD8] rounded-lg hover:bg-stone-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#C85A32] hover:bg-[#B34F2B] disabled:opacity-50 rounded-lg transition-colors shadow-xs"
                >
                  {submitting ? 'Saving...' : editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
