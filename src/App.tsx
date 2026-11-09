import React, { useState, useEffect } from 'react';
import {
  Product,
  Category,
  CartItem,
  ProductVariant,
  Promotion,
  Allergen,
} from './types/bakery.ts';
import { Navbar } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';
import { ProductCard } from './components/ProductCard.tsx';
import { ProductDetailModal } from './components/ProductDetailModal.tsx';
import { CartDrawer } from './components/CartDrawer.tsx';
import { CheckoutModal } from './components/CheckoutModal.tsx';
import { OrderTrackingModal } from './components/OrderTrackingModal.tsx';
import { OrderConfirmationModal } from './components/OrderConfirmationModal.tsx';
import { CustomerSupportModal } from './components/CustomerSupportModal.tsx';
import { DashboardLayout } from './components/dashboard/DashboardLayout.tsx';
import { formatTzs } from './utils/format.ts';
import {
  Search,
  Sparkles,
  Clock,
  ShieldCheck,
  ChevronRight,
  HeartHandshake,
  MessageSquare,
  Phone,
  MapPin,
  CheckCircle2,
  Calendar,
  Filter,
  UserCheck,
} from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<'store' | 'dashboard'>('store');
  const [activeSection, setActiveSection] = useState('menu');

  // Products & Categories
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [excludedAllergen, setExcludedAllergen] = useState<string>('none');
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  // Cart & Orders State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<any | null>(null);

  // Modals
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [trackingOrderNumber, setTrackingOrderNumber] = useState<string | undefined>();
  const [orderConfirmation, setOrderConfirmation] = useState<any | null>(null);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [supportOrderNumber, setSupportOrderNumber] = useState<string | undefined>();

  // Contact Form State
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSent, setContactSent] = useState(false);

  useEffect(() => {
    fetchStoreData();
  }, []);

  const fetchStoreData = async () => {
    setLoadingCatalog(true);
    try {
      const [prodRes, catRes, promoRes] = await Promise.all([
        fetch('/api/products?available=true'),
        fetch('/api/categories'),
        fetch('/api/promotions/active'),
      ]);
      const prodData = await prodRes.json();
      const catData = await catRes.json();
      const promoData = await promoRes.json();

      setProducts(prodData);
      setCategories(catData);
      setPromotions(promoData);
    } catch (err) {
      console.error('Error loading store data:', err);
    } finally {
      setLoadingCatalog(false);
    }
  };

  // Cart operations
  const handleAddToCart = (
    product: Product,
    variant?: ProductVariant,
    quantity = 1,
    notes = ''
  ) => {
    const v = variant || (product.variants && product.variants.length > 0 ? product.variants[0] : undefined);
    const unitPrice = Number(product.basePriceTzs) + (v ? Number(v.priceAdjustmentTzs || 0) : 0);
    const cartItemId = `${product.id}-${v?.id || 'base'}-${notes}`;

    setCart((prev) => {
      const existing = prev.findIndex((i) => i.id === cartItemId);
      if (existing !== -1) {
        const copy = [...prev];
        copy[existing].quantity += quantity;
        return copy;
      }
      return [
        ...prev,
        {
          id: cartItemId,
          product,
          selectedVariant: v,
          quantity,
          unitPriceTzs: unitPrice,
          customizationNotes: notes || undefined,
        },
      ];
    });
  };

  const handleUpdateQuantity = (cartItemId: string, newQty: number) => {
    if (newQty <= 0) {
      setCart((prev) => prev.filter((i) => i.id !== cartItemId));
    } else {
      setCart((prev) =>
        prev.map((i) => (i.id === cartItemId ? { ...i, quantity: newQty } : i))
      );
    }
  };

  const handleRemoveFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((i) => i.id !== cartItemId));
  };

  const handleApplyPromo = async (code: string) => {
    const subtotal = cart.reduce((acc, i) => acc + i.unitPriceTzs * i.quantity, 0);
    try {
      const res = await fetch('/api/promotions/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotalTzs: subtotal }),
      });
      const data = await res.json();
      if (!res.ok || !data.valid) {
        return { success: false, error: data.error || 'Invalid code' };
      }
      setAppliedPromo(data.promo);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: 'Failed to validate code' };
    }
  };

  const handleOrderSuccess = (order: any) => {
    setOrderConfirmation(order);
    setCart([]);
    setAppliedPromo(null);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSent(true);
    setTimeout(() => {
      setContactSent(false);
      setContactName('');
      setContactPhone('');
      setContactMessage('');
    }, 4000);
  };

  const cartCount = cart.reduce((acc, i) => acc + i.quantity, 0);
  const cartTotal = cart.reduce((acc, i) => acc + i.unitPriceTzs * i.quantity, 0);

  // Filter products by category, search, and allergen exclusion
  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      selectedCategory === 'all' || String(p.categoryId) === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());

    let passesAllergen = true;
    if (excludedAllergen !== 'none' && p.allergens) {
      passesAllergen = !p.allergens.some((a) =>
        a.name.toLowerCase().includes(excludedAllergen.toLowerCase())
      );
    }

    return matchesCategory && matchesSearch && passesAllergen;
  });

  // If in Dashboard View, render the staff operations management dashboard
  const handleNavigateSection = (sectionId: string) => {
    if (sectionId === 'track') {
      setTrackingOrderNumber(undefined);
      setIsTrackingOpen(true);
      return;
    }
    setActiveSection(sectionId);
    if (currentView !== 'store') {
      setCurrentView('store');
    }
    setTimeout(() => {
      const targetMap: Record<string, string> = {
        menu: 'menu-section',
        story: 'story-section',
        promotions: 'promotions-section',
        allergens: 'allergens-section',
        contact: 'contact-section',
      };
      const elementId = targetMap[sectionId] || `${sectionId}-section` || sectionId;
      const el = document.getElementById(elementId) || document.getElementById('catalog-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 60);
  };

  if (currentView === 'dashboard') {
    return <DashboardLayout onBackToStore={() => setCurrentView('store')} />;
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#292524] flex flex-col font-sans">
      {/* 3-Zone Navigation Header */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        cartCount={cartCount}
        cartTotal={cartTotal}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenTrack={() => handleNavigateSection('track')}
        activeSection={activeSection}
        setActiveSection={handleNavigateSection}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative bg-[#FAF7F2] overflow-hidden pt-8 pb-16 lg:pt-14 lg:pb-24 border-b border-[#E8DFD8]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
              {/* Left Column: Editorial Headline & Actions */}
              <div className="lg:col-span-7 space-y-6">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#C85A32]">
                  <Sparkles className="w-4 h-4" />
                  <span className="uppercase tracking-widest">
                    Dar es Salaam’s Artisanal Bakehouse
                  </span>
                </div>

                <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#292524] leading-[1.1] text-balance">
                  Real Sourdough. Handcrafted Viennoiserie. Pure Ingredients.
                </h1>

                <p className="text-sm sm:text-base text-[#57534E] leading-relaxed max-w-xl">
                  Naturally leavened over 36 hours with our vintage Tanzanian starter, European cultured butter, and stoneground wheat. Baked fresh twice daily in our Masaki stone-deck ovens.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      setActiveSection('menu');
                      const el = document.getElementById('catalog-section');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="px-6 py-3.5 bg-[#C85A32] hover:bg-[#B34F2B] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-all active:scale-98"
                  >
                    Explore Today's Fresh Bakes
                  </button>

                  <button
                    onClick={() => {
                      setTrackingOrderNumber(undefined);
                      setIsTrackingOpen(true);
                    }}
                    className="px-5 py-3.5 bg-white hover:bg-[#F5EFEB] border border-[#E8DFD8] text-[#292524] text-xs sm:text-sm font-semibold rounded-xl transition-colors"
                  >
                    Track Existing Order
                  </button>
                </div>

                {/* 3 Core Guarantees */}
                <div className="pt-6 grid grid-cols-3 gap-4 border-t border-[#E8DFD8] text-xs text-[#57534E]">
                  <div>
                    <strong className="block font-bold text-[#292524]">36h Ferment</strong>
                    <span>Digestible & gentle sourdough</span>
                  </div>
                  <div>
                    <strong className="block font-bold text-[#292524]">Pure Creamery</strong>
                    <span>82% pure butter, zero additives</span>
                  </div>
                  <div>
                    <strong className="block font-bold text-[#292524]">Twice Daily</strong>
                    <span>Fresh morning & afternoon runs</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Hero Image Slot */}
              <div className="lg:col-span-5 relative">
                <div className="aspect-16/9 lg:aspect-4/3 rounded-2xl overflow-hidden border border-[#E8DFD8] shadow-lg bg-[#F5EFEB]">
                  <img
                    src="/src/assets/images/hero_artisanal_bakery_1791942715072.jpg"
                    alt="Freshly baked artisanal breads and pastries at LK Bakehouse"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ACTIVE SEASONAL PROMOTIONS BANNER */}
        <section id="promotions-section" className="bg-[#F5EFEB] border-b border-[#E8DFD8] py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {promotions.length > 0 ? (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#C85A32] text-white flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-sm font-bold text-[#292524]">
                      {promotions[0].name}
                    </h3>
                    <p className="text-xs text-[#57534E]">
                      {promotions[0].description} (Code:{' '}
                      <strong className="font-mono text-[#C85A32]">
                        {promotions[0].code}
                      </strong>
                      )
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      handleApplyPromo(promotions[0].code);
                      setIsCartOpen(true);
                    }}
                    className="px-4 py-2 bg-[#292524] hover:bg-black text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
                  >
                    Apply Promo to Cart
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#C85A32] text-white flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-sm font-bold text-[#292524]">
                      Seasonal Deck Oven Specials & Daily Bakes
                    </h3>
                    <p className="text-xs text-[#57534E]">
                      Enjoy 10% off your first online order with code <strong className="font-mono text-[#C85A32]">KARIBU10</strong> at checkout.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      handleApplyPromo('KARIBU10');
                      setIsCartOpen(true);
                    }}
                    className="px-4 py-2 bg-[#C85A32] hover:bg-[#B34F2B] text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
                  >
                    Claim 10% Discount
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* PRODUCT CATALOG & SEARCH */}
        <section id="menu-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
          <div id="catalog-section" className="-mt-16 pt-16" />
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#C85A32] block mb-1">
                From Our Deck Ovens
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#292524]">
                The Artisanal Bakery Collection
              </h2>
            </div>

            {/* Live Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search sourdough, cakes, rolls..."
                className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-white border border-[#E8DFD8] rounded-xl focus:outline-hidden focus:border-[#C85A32] text-[#292524]"
              />
            </div>
          </div>

          {/* Category Tabs & Allergen Exclusion Filter */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-[#E8DFD8]">
            {/* Category Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-[#C85A32] text-white shadow-xs'
                    : 'bg-white border border-[#E8DFD8] text-[#57534E] hover:border-[#D5C7BD]'
                }`}
              >
                All Bakes ({products.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(String(cat.id))}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedCategory === String(cat.id)
                      ? 'bg-[#C85A32] text-white shadow-xs'
                      : 'bg-white border border-[#E8DFD8] text-[#57534E] hover:border-[#D5C7BD]'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Allergen Filter Dropdown */}
            <div className="flex items-center gap-2 text-xs text-[#57534E] self-end lg:self-auto shrink-0">
              <Filter className="w-3.5 h-3.5 text-[#C85A32]" />
              <span>Exclude Allergen:</span>
              <select
                value={excludedAllergen}
                onChange={(e) => setExcludedAllergen(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-[#E8DFD8] rounded-lg text-xs font-medium text-[#292524] focus:outline-hidden focus:border-[#C85A32]"
              >
                <option value="none">Show All Ingredients</option>
                <option value="nuts">Exclude Tree Nuts & Peanuts</option>
                <option value="dairy">Exclude Dairy / Milk</option>
                <option value="eggs">Exclude Eggs</option>
              </select>
            </div>
          </div>

          {/* Product Grid */}
          {loadingCatalog ? (
            <div className="h-64 flex items-center justify-center text-xs text-stone-400">
              Loading fresh bakery batches...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center text-stone-400 space-y-2">
              <span className="font-display text-base text-[#292524]">No bakery items found</span>
              <span className="text-xs text-[#78716C]">
                Try adjusting your search terms or allergen filters.
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {filteredProducts.map((prod) => (
                <ProductCard
                  key={prod.id}
                  product={prod}
                  onSelect={(p) => setSelectedProduct(p)}
                  onQuickAdd={(p) => handleAddToCart(p)}
                />
              ))}
            </div>
          )}
        </section>

        {/* OUR STORY / CRAFTSMANSHIP SECTION */}
        <section id="story-section" className="bg-[#F5EFEB] border-y border-[#E8DFD8] py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-6 space-y-5">
                <span className="text-xs font-bold uppercase tracking-widest text-[#C85A32]">
                  The LK Bakehouse Heritage
                </span>
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#292524] leading-tight">
                  Slow Fermentation, Local Grains & Uncompromising Standards
                </h2>
                <p className="text-xs sm:text-sm text-[#57534E] leading-relaxed">
                  Founded in Masaki, Dar es Salaam, LK Bakehouse was born out of a desire for authentic, crusty sourdough and honest pastries made without commercial bread enhancers or shortcuts.
                </p>
                <p className="text-xs sm:text-sm text-[#57534E] leading-relaxed">
                  Every loaf undergoes a patient 36-hour cold fermentation that naturally degrades phytates and gluten structures, yielding a bread that is deeply flavorful, blistered with golden crust caramelization, and light on digestion.
                </p>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#E8DFD8]">
                  <div>
                    <span className="font-display text-2xl font-bold text-[#C85A32] block font-mono">
                      100%
                    </span>
                    <span className="text-xs text-[#57534E]">Stoneground Flours & Butter</span>
                  </div>
                  <div>
                    <span className="font-display text-2xl font-bold text-[#C85A32] block font-mono">
                      0%
                    </span>
                    <span className="text-xs text-[#57534E]">Preservatives or Premixes</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6">
                <div className="aspect-16/9 rounded-2xl overflow-hidden border border-[#E8DFD8] shadow-md bg-white">
                  <img
                    src="/src/assets/images/bakery_interior_cafe_1791942716825.jpg"
                    alt="Warm bakery interior with display cases and pastry kitchen"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ALLERGEN SAFETY SECTION */}
        <section id="allergens-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-6">
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-widest text-[#C85A32] block mb-1">
              Dietary Transparency
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#292524]">
              Our Allergen Safety Commitment
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-[#57534E] leading-relaxed">
              We believe every customer deserves full transparency regarding what goes into their food. Here is how we manage and label potential allergens:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-xl border border-[#E8DFD8] shadow-xs space-y-2">
              <h4 className="font-display text-sm font-bold text-[#292524]">
                Wheat & Gluten Notice
              </h4>
              <p className="text-xs text-[#78716C] leading-relaxed">
                Wheat flour is the primary ingredient in our sourdoughs, brioche, and croissants. Airborne flour dust is present in our kitchen during mixing and folding.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-[#E8DFD8] shadow-xs space-y-2">
              <h4 className="font-display text-sm font-bold text-[#292524]">
                Dairy & Eggs
              </h4>
              <p className="text-xs text-[#78716C] leading-relaxed">
                We use 82% pure butter and whole eggs extensively across cakes and laminated pastries. Our artisan sourdough boules are naturally vegan (flour, water, salt).
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-[#E8DFD8] shadow-xs space-y-2">
              <h4 className="font-display text-sm font-bold text-[#292524]">
                Nut Protocol
              </h4>
              <p className="text-xs text-[#78716C] leading-relaxed">
                Pecans, walnuts, and almonds are stored in dedicated airtight bins and handled on separate prep tables with sanitized utensils between batches.
              </p>
            </div>
          </div>
        </section>

        {/* CONTACT & ORDER ENQUIRIES SECTION */}
        <section id="contact-section" className="bg-[#FAF7F2] border-t border-[#E8DFD8] py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              {/* Left: Contact Info & Opening Coordinates */}
              <div className="lg:col-span-5 space-y-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-[#C85A32] block mb-1">
                    Visit Our Masaki Store
                  </span>
                  <h2 className="font-display text-3xl font-bold text-[#292524]">
                    We'd Love to Hear From You
                  </h2>
                </div>

                <div className="space-y-4 text-xs text-[#57534E]">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-[#C85A32] shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-[#292524]">Bakery Location:</strong>
                      <span>Plot 42, Haile Selassie Road, Masaki, Dar es Salaam, Tanzania</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-[#C85A32] shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-[#292524]">Opening Hours:</strong>
                      <span>Monday – Saturday: 7:00 AM – 8:00 PM</span>
                      <span className="block">Sunday: 8:00 AM – 5:00 PM</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-[#C85A32] shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-[#292524]">Telephone:</strong>
                      <span className="font-mono">+255 754 889 900</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MessageSquare className="w-5 h-5 text-[#C85A32] shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-[#292524]">WhatsApp Direct:</strong>
                      <a
                        href="https://wa.me/255754889900"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#C85A32] font-semibold hover:underline"
                      >
                        Click to chat on WhatsApp (+255 754 889 900)
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Interactive Message Box */}
              <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-2xl border border-[#E8DFD8] shadow-xs">
                <h3 className="font-display text-lg font-bold text-[#292524] mb-1">
                  Send a Message or Custom Cake Inquiry
                </h3>
                <p className="text-xs text-[#78716C] mb-6">
                  Planning a wedding, birthday, or corporate event? Let our master bakers prepare something extraordinary.
                </p>

                {contactSent ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-emerald-800">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Asante sana! Your message has been received. Our team will contact you shortly.</span>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-[#78716C] uppercase mb-1">Your Name *</label>
                        <input
                          type="text"
                          required
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          placeholder="e.g. Lisa"
                          className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg focus:outline-hidden focus:border-[#C85A32]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-[#78716C] uppercase mb-1">Phone Number (Tanzania) *</label>
                        <input
                          type="tel"
                          required
                          value={contactPhone}
                          onChange={(e) => setContactPhone(e.target.value)}
                          placeholder="+255 ..."
                          className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg font-mono focus:outline-hidden focus:border-[#C85A32]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#78716C] uppercase mb-1">Message or Event Details *</label>
                      <textarea
                        required
                        rows={3}
                        value={contactMessage}
                        onChange={(e) => setContactMessage(e.target.value)}
                        placeholder="Tell us about your celebration date, guest count, or flavor preferences..."
                        className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg focus:outline-hidden focus:border-[#C85A32]"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-[#292524] hover:bg-black text-white text-xs font-semibold rounded-lg transition-colors"
                    >
                      Send Inquiry to LK Bakehouse
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer
        onOpenTrack={() => {
          setTrackingOrderNumber(undefined);
          setIsTrackingOpen(true);
        }}
        onNavigateSection={(sec) => {
          setActiveSection(sec);
          const el = document.getElementById(`${sec}-section`);
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* MODALS */}
      {/* 1. Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={(p, v, q, n) => {
          handleAddToCart(p, v, q, n);
          setIsCartOpen(true);
        }}
      />

      {/* 2. Slide-out Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveFromCart}
        onProceedToCheckout={() => setIsCheckoutOpen(true)}
        appliedPromo={appliedPromo}
        onApplyPromo={handleApplyPromo}
        onRemovePromo={() => setAppliedPromo(null)}
      />

      {/* 3. Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={cart}
        appliedPromo={appliedPromo}
        onOrderSuccess={handleOrderSuccess}
      />

      {/* 4. Order Tracking Modal */}
      <OrderTrackingModal
        isOpen={isTrackingOpen}
        onClose={() => setIsTrackingOpen(false)}
        initialOrderNumber={trackingOrderNumber}
        onOpenSupport={(num) => {
          setSupportOrderNumber(num);
          setIsSupportOpen(true);
        }}
      />

      {/* 5. Authoritative Order Confirmation Modal */}
      {orderConfirmation && (
        <OrderConfirmationModal
          isOpen={Boolean(orderConfirmation)}
          orderNumber={orderConfirmation.orderNumber}
          onClose={() => setOrderConfirmation(null)}
          onOpenTracking={(num) => {
            setOrderConfirmation(null);
            setTrackingOrderNumber(num);
            setIsTrackingOpen(true);
          }}
          onOpenSupport={(num) => {
            setOrderConfirmation(null);
            setSupportOrderNumber(num);
            setIsSupportOpen(true);
          }}
        />
      )}

      {/* 6. Human Handoff Support Modal */}
      <CustomerSupportModal
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
        defaultOrderNumber={supportOrderNumber}
      />

      {/* 7. Floating Concierge & Human Support Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => {
            setSupportOrderNumber(undefined);
            setIsSupportOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#292524] hover:bg-stone-800 text-white rounded-full shadow-2xl border border-stone-700 text-xs font-semibold transition-all hover:scale-105 active:scale-95"
          title="Speak directly to an LK Bakehouse team member"
        >
          <UserCheck className="w-4 h-4 text-emerald-400" />
          <span>Speak to a Human</span>
        </button>
      </div>
    </div>
  );
}
