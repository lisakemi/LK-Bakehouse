import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Calculator,
  ShoppingBag,
  Package,
  ChefHat,
  Truck,
  Receipt,
  BarChart3,
  Settings,
  Bell,
  Store,
  CheckCheck,
  TrendingUp,
  AlertTriangle,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import { formatTzs, formatDate } from '../../utils/format.ts';
import { POSView } from './POSView.tsx';
import { OrdersView } from './OrdersView.tsx';
import { InventoryView } from './InventoryView.tsx';
import { RecipesView } from './RecipesView.tsx';
import { PurchasingView } from './PurchasingView.tsx';
import { ExpensesView } from './ExpensesView.tsx';
import { ReportsView } from './ReportsView.tsx';
import { SettingsView } from './SettingsView.tsx';
import { SupportView } from './SupportView.tsx';
import { ProductsView } from './ProductsView.tsx';
import { NotificationItem } from '../../types/bakery.ts';
import { UserCheck, Menu, X, UtensilsCrossed, Shield } from 'lucide-react';
import { ErrorBoundary } from '../ErrorBoundary.tsx';

import { subscribeToNotifications, subscribeToOrders } from '../../lib/supabase.ts';
import {
  getCurrentStaff,
  setCurrentStaff,
  DEFAULT_STAFF_MEMBERS,
  getStaffAuthHeaders,
  StaffProfile,
} from '../../lib/auth-client.ts';

interface DashboardLayoutProps {
  onBackToStore: () => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ onBackToStore }) => {
  const [currentTab, setCurrentTab] = useState<
    'overview' | 'pos' | 'products' | 'orders' | 'inventory' | 'recipes' | 'purchasing' | 'expenses' | 'reports' | 'support' | 'settings'
  >('overview');

  const [activeStaff, setActiveStaff] = useState<StaffProfile>(getCurrentStaff());
  const [showStaffDropdown, setShowStaffDropdown] = useState(false);

  const [stats, setStats] = useState<any | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loadingStats, setLoadingStats] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchNotifications();

    // Real-time live listener for instant notifications
    const unsubNotifications = subscribeToNotifications((item: any) => {
      setNotifications((prev) => (Array.isArray(prev) ? [item, ...prev] : [item]));
      fetchStats();
    });

    const unsubOrders = subscribeToOrders(() => {
      fetchStats();
      fetchNotifications();
    });

    // Background polling fallback
    const interval = setInterval(() => {
      fetchNotifications();
      fetchStats();
    }, 20000);

    return () => {
      unsubNotifications();
      unsubOrders();
      clearInterval(interval);
    };
  }, []);

  const handleSwitchStaff = (staff: StaffProfile) => {
    setActiveStaff(staff);
    setCurrentStaff(staff);
    setShowStaffDropdown(false);
    fetchStats();
    fetchNotifications();
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/dashboard/stats', {
        headers: getStaffAuthHeaders(),
      });
      const data = await res.json();
      setStats(data && typeof data === 'object' && !data.error ? data : {});
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications', {
        headers: getStaffAuthHeaders(),
      });
      const data = await res.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const markAllRead = async () => {
    try {
      await fetch('/api/notifications/read-all', {
        method: 'PATCH',
        headers: getStaffAuthHeaders(),
      });
      setNotifications((prev) => (Array.isArray(prev) ? prev : []).map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Error marking notifications as read:', err);
    }
  };

  const handleNotificationClick = async (n: NotificationItem) => {
    if (!n.isRead) {
      try {
        await fetch(`/api/notifications/${n.id}/read`, {
          method: 'PATCH',
          headers: getStaffAuthHeaders(),
        });
        setNotifications((prev) =>
          (Array.isArray(prev) ? prev : []).map((item) => (item.id === n.id ? { ...item, isRead: true } : item))
        );
      } catch (err) {
        console.error('Error marking read:', err);
      }
    }
    setShowNotifications(false);
    if (n.type === 'customer_inquiry' || n.referenceEntityType === 'support_request') {
      setCurrentTab('support');
    } else if (n.type === 'stock_low' || n.referenceEntityType === 'inventory_item') {
      setCurrentTab('inventory');
    } else if (n.type === 'order_submitted' || n.type === 'order_status_changed' || n.type === 'payment_received') {
      setCurrentTab('orders');
    }
  };

  const unreadCount = (Array.isArray(notifications) ? notifications : []).filter((n) => !n.isRead).length;

  const sidebarLinks = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'pos', label: 'Point of Sale (POS)', icon: Calculator, badge: 'Counter' },
    { id: 'products', label: 'Products & Menu', icon: UtensilsCrossed },
    { id: 'orders', label: 'Order Dispatch', icon: ShoppingBag, badge: stats?.pendingCount ? `${stats.pendingCount}` : undefined },
    { id: 'inventory', label: 'Inventory & Stock', icon: Package, badge: stats?.lowStockCount ? `${stats.lowStockCount} Low` : undefined },
    { id: 'recipes', label: 'Recipes & Production', icon: ChefHat },
    { id: 'purchasing', label: 'Purchasing & Suppliers', icon: Truck },
    { id: 'expenses', label: 'Expense Ledger', icon: Receipt },
    { id: 'reports', label: 'Financial Reports', icon: BarChart3 },
    { id: 'support', label: 'Support & Handoff', icon: UserCheck },
    { id: 'settings', label: 'Bakery Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-[#E8DFD8] h-16 flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="md:hidden p-2 text-stone-600 hover:text-stone-900 hover:bg-[#FAF7F2] rounded-lg transition-colors"
            aria-label="Toggle navigation"
          >
            {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <span className="font-display text-xl font-bold text-[#292524]">
            LK Bakehouse
          </span>
          <span className="hidden sm:inline text-xs font-mono bg-[#FAF7F2] border border-[#E8DFD8] text-[#78716C] px-2 py-0.5 rounded">
            Operations Management System
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Notifications Button */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-stone-600 hover:text-stone-900 hover:bg-[#FAF7F2] rounded-lg relative transition-colors"
              aria-label="View In-App Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-[#C85A32] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-[#E8DFD8] p-4 z-50 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#E8DFD8]">
                  <span className="text-xs font-bold text-[#292524] uppercase tracking-wider">
                    In-App Notifications
                  </span>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-[11px] text-[#C85A32] hover:underline flex items-center gap-1"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Mark all as read</span>
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-[#F0EAE1]">
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-xs text-stone-400">
                      No notifications logged.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={`py-2.5 px-2 text-xs rounded-lg cursor-pointer transition-colors ${
                          !n.isRead ? 'bg-[#FAF7F2] hover:bg-[#F0EAE1]' : 'hover:bg-stone-50'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-1">
                          <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${!n.isRead ? 'bg-[#C85A32]' : 'bg-transparent'}`} />
                            <span className={`font-semibold truncate ${!n.isRead ? 'text-[#C85A32]' : 'text-[#292524]'}`}>
                              {n.title}
                            </span>
                          </div>
                          <span className="text-[10px] text-stone-400 whitespace-nowrap shrink-0">
                            {formatDate(n.createdAt)}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#57534E] mt-0.5 leading-relaxed pl-3">
                          {n.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Staff Profile & Role Indicator */}
          <div className="relative">
            <button
              onClick={() => setShowStaffDropdown(!showStaffDropdown)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF7F2] hover:bg-[#F0EAE1] border border-[#E8DFD8] rounded-lg text-xs transition-colors"
              title="Switch Active Staff Profile"
            >
              <Shield className="w-3.5 h-3.5 text-[#C85A32]" />
              <div className="text-left hidden sm:block">
                <span className="font-semibold text-[#292524] block leading-tight">
                  {activeStaff.fullName.split(' ')[0]}
                </span>
                <span className="text-[10px] text-stone-500 uppercase tracking-wider block font-mono">
                  {activeStaff.role}
                </span>
              </div>
            </button>

            {showStaffDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-[#E8DFD8] p-3 z-50 space-y-2">
                <div className="pb-1.5 border-b border-[#E8DFD8]">
                  <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block">
                    Active Staff Session
                  </span>
                  <span className="text-xs font-semibold text-[#292524]">
                    {activeStaff.fullName} ({activeStaff.role})
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-stone-500 block">
                    Switch Active Staff Member:
                  </span>
                  {DEFAULT_STAFF_MEMBERS.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleSwitchStaff(s)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                        activeStaff.id === s.id
                          ? 'bg-[#C85A32] text-white font-semibold'
                          : 'hover:bg-[#FAF7F2] text-[#292524]'
                      }`}
                    >
                      <div>
                        <div className="font-medium">{s.fullName}</div>
                        <div className={`text-[10px] capitalize ${activeStaff.id === s.id ? 'text-amber-100' : 'text-stone-400'}`}>
                          {s.role} • {s.email.split('@')[0]}
                        </div>
                      </div>
                      {activeStaff.id === s.id && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Switch to Storefront */}
          <button
            onClick={onBackToStore}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#292524] bg-[#FAF7F2] hover:bg-[#F0EAE1] border border-[#E8DFD8] rounded-lg transition-colors"
          >
            <Store className="w-4 h-4 text-[#C85A32]" />
            <span className="hidden sm:inline">Storefront</span>
          </button>
        </div>
      </header>

      {/* Main Layout Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile backdrop */}
        {mobileSidebarOpen && (
          <div
            onClick={() => setMobileSidebarOpen(false)}
            className="fixed inset-0 bg-stone-900/40 z-30 md:hidden"
            aria-hidden="true"
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-[#E8DFD8] flex flex-col shrink-0 transform transition-transform duration-200 md:static md:translate-x-0 ${
            mobileSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:shadow-none'
          }`}
        >
          <div className="p-4 border-b border-[#E8DFD8] md:hidden flex items-center justify-between">
            <span className="font-display font-bold text-sm text-[#292524]">Operations Navigation</span>
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="p-1 text-stone-500 hover:text-stone-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
            {sidebarLinks.map((link) => {
              const Icon = link.icon;
              const isActive = currentTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => {
                    setCurrentTab(link.id as any);
                    setMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#292524] text-white shadow-xs'
                      : 'text-[#57534E] hover:bg-[#FAF7F2] hover:text-[#292524]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#C85A32]' : 'text-[#78716C]'}`} />
                    <span>{link.label}</span>
                  </div>
                  {link.badge && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        isActive
                          ? 'bg-[#C85A32] text-white'
                          : 'bg-[#FAF7F2] text-[#78716C] border border-[#E8DFD8]'
                      }`}
                    >
                      {link.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-[#E8DFD8] bg-[#FAF7F2] text-xs text-[#78716C] space-y-1">
            <span className="block font-bold text-[#292524]">LK Bakehouse Masaki</span>
            <span className="block text-[11px]">PostgreSQL Connected</span>
          </div>
        </aside>

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <ErrorBoundary key={currentTab} fallbackTitle={`Operations ${currentTab.toUpperCase()} View Encountered an Error`}>
            {currentTab === 'overview' && (
              <div className="space-y-6">
                {/* Overview Metrics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-xl border border-[#E8DFD8] shadow-xs space-y-1">
                    <span className="text-xs text-[#78716C] uppercase font-bold tracking-wider">
                      Total Completed Sales
                    </span>
                    <div className="text-xl font-bold font-mono text-[#292524]">
                      {formatTzs(stats?.totalRevenueTzs || 0)}
                    </div>
                    <div className="text-[11px] text-[#78716C] flex items-center gap-1 pt-1">
                      <span>POS: {formatTzs(stats?.posRevenueTzs || 0)}</span>
                      <span>·</span>
                      <span>Web: {formatTzs(stats?.onlineRevenueTzs || 0)}</span>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-[#E8DFD8] shadow-xs space-y-1">
                    <span className="text-xs text-[#78716C] uppercase font-bold tracking-wider">
                      Pending / Active Orders
                    </span>
                    <div className="text-xl font-bold font-mono text-[#C85A32]">
                      {(stats?.pendingCount || 0) + (stats?.preparingCount || 0)}
                    </div>
                    <div className="text-[11px] text-[#78716C] pt-1">
                      {stats?.pendingCount || 0} review, {stats?.preparingCount || 0} baking in ovens
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-[#E8DFD8] shadow-xs space-y-1">
                    <span className="text-xs text-[#78716C] uppercase font-bold tracking-wider">
                      Low Stock Alerts
                    </span>
                    <div className="text-xl font-bold font-mono text-amber-600">
                      {stats?.lowStockCount || 0}
                    </div>
                    <div className="text-[11px] text-[#78716C] pt-1">
                      Items needing replenishment
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-[#E8DFD8] shadow-xs space-y-1">
                    <span className="text-xs text-[#78716C] uppercase font-bold tracking-wider">
                      Total Orders Processed
                    </span>
                    <div className="text-xl font-bold font-mono text-[#292524]">
                      {stats?.totalOrdersCount || 0}
                    </div>
                    <div className="text-[11px] text-[#78716C] pt-1">
                      {stats?.completedCount || 0} completed orders
                    </div>
                  </div>
                </div>

                {/* Quick Actions Bar */}
                <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#E8DFD8] flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-[#292524]">
                    Quick Operations:
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentTab('pos')}
                      className="px-3.5 py-1.5 bg-[#C85A32] text-white text-xs font-semibold rounded-lg hover:bg-[#B34F2B] transition-colors"
                    >
                      Open Counter Register
                    </button>
                    <button
                      onClick={() => setCurrentTab('orders')}
                      className="px-3.5 py-1.5 bg-white border border-[#E8DFD8] text-[#292524] text-xs font-semibold rounded-lg hover:bg-[#F0EAE1] transition-colors"
                    >
                      View Kitchen Order Queue
                    </button>
                    <button
                      onClick={() => setCurrentTab('inventory')}
                      className="px-3.5 py-1.5 bg-white border border-[#E8DFD8] text-[#292524] text-xs font-semibold rounded-lg hover:bg-[#F0EAE1] transition-colors"
                    >
                      Check Low Stock
                    </button>
                  </div>
                </div>

                {/* Embedded Live Orders Table on Overview with ErrorBoundary */}
                <ErrorBoundary key="overview-orders" fallbackTitle="Kitchen Orders Table Error">
                  <OrdersView />
                </ErrorBoundary>
              </div>
            )}

            {currentTab === 'pos' && <POSView />}
            {currentTab === 'products' && <ProductsView />}
            {currentTab === 'orders' && <OrdersView />}
            {currentTab === 'inventory' && <InventoryView />}
            {currentTab === 'recipes' && <RecipesView />}
            {currentTab === 'purchasing' && <PurchasingView />}
            {currentTab === 'expenses' && <ExpensesView />}
            {currentTab === 'reports' && <ReportsView />}
            {currentTab === 'support' && <SupportView />}
            {currentTab === 'settings' && <SettingsView />}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};
