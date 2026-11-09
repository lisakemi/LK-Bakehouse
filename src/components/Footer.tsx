import React from 'react';
import { MapPin, Phone, Mail, Instagram, MessageSquare, Clock, ShieldCheck } from 'lucide-react';

interface FooterProps {
  onOpenTrack: () => void;
  onNavigateSection: (section: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenTrack, onNavigateSection }) => {
  return (
    <footer className="bg-[#292524] text-[#E7E5E4] border-t border-[#44403C] mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Col 1: Brand & Craft */}
          <div className="space-y-4 md:col-span-1">
            <span className="font-display text-2xl font-bold tracking-tight text-white block">
              LK Bakehouse
            </span>
            <p className="text-xs text-[#A8A29E] leading-relaxed">
              Dar es Salaam’s premier artisanal bakery. Handcrafted sourdough, French viennoiserie, and bespoke celebration cakes baked fresh daily using stoneground wheat and pure creamery butter.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://wa.me/255754889900"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-[#44403C] hover:bg-[#C85A32] flex items-center justify-center text-white transition-colors"
                aria-label="LK Bakehouse WhatsApp"
              >
                <MessageSquare className="w-4 h-4" />
              </a>
              <a
                href="https://instagram.com/lkbakehouse_tz"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-[#44403C] hover:bg-[#C85A32] flex items-center justify-center text-white transition-colors"
                aria-label="LK Bakehouse Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="tel:+255754889900"
                className="w-8 h-8 rounded-full bg-[#44403C] hover:bg-[#C85A32] flex items-center justify-center text-white transition-colors"
                aria-label="Call LK Bakehouse"
              >
                <Phone className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Col 2: Navigation & Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#C85A32]">
              Quick Navigation
            </h4>
            <ul className="space-y-2 text-xs text-[#D6D3D1]">
              <li>
                <button
                  onClick={() => onNavigateSection('menu')}
                  className="hover:text-white transition-colors"
                >
                  Artisanal Bakery Catalog
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateSection('story')}
                  className="hover:text-white transition-colors"
                >
                  Our Heritage & Slow Fermentation
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateSection('promotions')}
                  className="hover:text-white transition-colors"
                >
                  Seasonal Offers & Gift Sets
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateSection('allergens')}
                  className="hover:text-white transition-colors"
                >
                  Allergen Transparency Guide
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenTrack}
                  className="hover:text-[#C85A32] transition-colors"
                >
                  Live Order Tracking
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Hours & Location */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#C85A32]">
              Bakery Store & Hours
            </h4>
            <div className="space-y-2.5 text-xs text-[#D6D3D1]">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#C85A32] shrink-0 mt-0.5" />
                <span>Plot 42, Haile Selassie Road, Masaki, Dar es Salaam, Tanzania</span>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-[#C85A32] shrink-0 mt-0.5" />
                <div>
                  <span className="block font-medium text-white">Baking & Oven Hours:</span>
                  <span>Monday – Saturday: 7:00 AM – 8:00 PM</span>
                  <span className="block">Sunday: 8:00 AM – 5:00 PM</span>
                </div>
              </div>
            </div>
          </div>

          {/* Col 4: Payments & Standards */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#C85A32]">
              Payment & Standards
            </h4>
            <div className="space-y-2 text-xs text-[#A8A29E]">
              <div className="flex items-center gap-1.5 text-white font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Certified Food Safety & Hygiene</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Accepted: M-Pesa Lipa Namba, Tigo Pesa, Airtel Money, CRDB, NMB & Cash upon Store Pickup.
              </p>
              <div className="pt-2 text-[11px] text-[#78716C]">
                All prices quoted in Tanzanian Shillings (TSh).
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-[#44403C] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#78716C]">
          <div>
            © {new Date().getFullYear()} LK Bakehouse. All rights reserved. Registered Bakery & Confectionery in Tanzania.
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <button onClick={() => onNavigateSection('allergens')} className="hover:text-white transition-colors">
              Allergen Policy
            </button>
            <span>·</span>
            <button onClick={() => onNavigateSection('terms')} className="hover:text-white transition-colors">
              Terms & Delivery Conditions
            </button>
            <span>·</span>
            <button onClick={() => onNavigateSection('privacy')} className="hover:text-white transition-colors">
              Privacy Notice
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
