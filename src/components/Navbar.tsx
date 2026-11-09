import React, { useState } from 'react';
import { ShoppingBag, LayoutDashboard, Store, Menu, X, Clock, MapPin, Search } from 'lucide-react';
import { formatTzs } from '../utils/format.ts';

interface NavbarProps {
  currentView: 'store' | 'dashboard';
  setCurrentView: (view: 'store' | 'dashboard') => void;
  cartCount: number;
  cartTotal: number;
  onOpenCart: () => void;
  onOpenTrack: () => void;
  activeSection: string;
  setActiveSection: (section: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  cartCount,
  cartTotal,
  onOpenCart,
  onOpenTrack,
  activeSection,
  setActiveSection,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { id: 'menu', label: 'Bakery Menu' },
    { id: 'story', label: 'Our Story' },
    { id: 'promotions', label: 'Seasonal Offers' },
    { id: 'allergens', label: 'Allergen Safety' },
    { id: 'contact', label: 'Visit Us' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#E8DFD8] transition-all">
      {/* Slim seasonal alert bar */}
      <div className="bg-[#C85A32] text-white px-4 py-1 text-xs text-center font-medium flex items-center justify-center gap-2">
        <span>Karibu! Use code <strong className="font-mono underline underline-offset-2">KARIBU10</strong> for 10% off your first bakery order</span>
        <span className="hidden sm:inline">·</span>
        <span className="hidden sm:inline">Dar es Salaam Daily Oven Runs: 7:00 AM & 2:00 PM</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-20">
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setCurrentView('store');
                setActiveSection('menu');
              }}
              className="group text-left"
            >
              <span className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#292524] group-hover:text-[#C85A32] transition-colors whitespace-nowrap">
                LK Bakehouse
              </span>
              <span className="block text-[11px] font-sans text-[#78716C] tracking-widest uppercase">
                Artisanal Bakery & Patisserie
              </span>
            </button>
          </div>

          {/* Zone 2: Clean 4-5 Navigation Links (Storefront only) */}
          {currentView === 'store' && (
            <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-[#57534E]">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => setActiveSection(link.id)}
                  className={`hover:text-[#C85A32] transition-colors whitespace-nowrap py-1 border-b-2 ${
                    activeSection === link.id
                      ? 'border-[#C85A32] text-[#292524] font-semibold'
                      : 'border-transparent'
                  }`}
                >
                  {link.label}
                </button>
              ))}
              <button
                onClick={onOpenTrack}
                className="hover:text-[#C85A32] text-[#78716C] transition-colors whitespace-nowrap py-1"
              >
                Track Order
              </button>
            </nav>
          )}

          {/* Zone 3: Primary Action & View Toggle */}
          <div className="flex items-center gap-3 shrink-0">
            {currentView === 'store' ? (
              <>
                <button
                  onClick={onOpenCart}
                  className="relative flex items-center gap-2.5 px-4 py-2.5 bg-[#292524] hover:bg-[#1C1917] text-white rounded-lg transition-all shadow-sm active:scale-95"
                  aria-label="View Shopping Cart"
                >
                  <ShoppingBag className="w-4 h-4 text-[#C85A32]" />
                  <span className="text-xs font-semibold whitespace-nowrap">
                    Cart
                  </span>
                  {cartCount > 0 && (
                    <span className="bg-[#C85A32] text-white text-[11px] font-bold px-1.5 py-0.5 rounded-full font-mono">
                      {cartCount}
                    </span>
                  )}
                  {cartTotal > 0 && (
                    <span className="hidden sm:inline text-xs font-mono text-stone-300 border-l border-stone-600 pl-2">
                      {formatTzs(cartTotal)}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setCurrentView('dashboard')}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-xs font-medium text-[#57534E] hover:text-[#292524] hover:bg-[#F0EAE1] rounded-lg transition-colors border border-[#E8DFD8]"
                  title="Switch to Management Dashboard"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-[#C85A32]" />
                  <span className="hidden sm:inline whitespace-nowrap">Staff Dashboard</span>
                  <span className="sm:hidden text-xs font-semibold">Staff</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => setCurrentView('store')}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#C85A32] hover:bg-[#B34F2B] rounded-lg transition-colors shadow-sm"
              >
                <Store className="w-4 h-4" />
                <span className="whitespace-nowrap">Customer Storefront</span>
              </button>
            )}

            {/* Mobile Hamburger toggle */}
            {currentView === 'store' && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-[#57534E] hover:text-[#292524] hover:bg-[#F0EAE1] rounded-md transition-colors"
                aria-label="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && currentView === 'store' && (
        <div className="lg:hidden border-t border-[#E8DFD8] bg-[#FAF7F2] px-4 pt-3 pb-6 space-y-3">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => {
                setActiveSection(link.id);
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left py-2 text-sm font-medium text-[#292524] hover:text-[#C85A32]"
            >
              {link.label}
            </button>
          ))}
          <button
            onClick={() => {
              onOpenTrack();
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 text-sm font-medium text-[#78716C] hover:text-[#C85A32]"
          >
            Track Existing Order
          </button>
          <div className="pt-2 border-t border-[#E8DFD8]">
            <button
              onClick={() => {
                setCurrentView('dashboard');
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-medium text-[#57534E] bg-[#F0EAE1] rounded-lg"
            >
              <LayoutDashboard className="w-4 h-4 text-[#C85A32]" />
              <span>Open Staff Operations Dashboard</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
