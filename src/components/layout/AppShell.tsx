import React, { useState } from 'react';
import {
  Bell,
  CalendarClock,
  ChevronRight,
  FileBarChart2,
  Grid2x2,
  Home,
  LayoutDashboard,
  LifeBuoy,
  MoreHorizontal,
  Package,
  Receipt,
  Settings,
  ShieldCheck,
  Wrench,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { AppRoute } from '../../types';
import { Modal } from '../ui/Modal';

interface NavItem {
  route: AppRoute;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const PRIMARY_NAV: NavItem[] = [
  { route: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { route: 'inventory', label: 'Inventory', icon: Package },
  { route: 'maintenance', label: 'Maintenance', icon: CalendarClock },
  { route: 'copilot', label: 'Copilot', icon: LifeBuoy },
  { route: 'more', label: 'More', icon: MoreHorizontal },
];

const MORE_SUB_NAV: NavItem[] = [
  { route: 'repairs', label: 'Repair History', icon: Wrench },
  { route: 'expenses', label: 'Expense Tracker', icon: Receipt },
  { route: 'warranties', label: 'Warranty Tracker', icon: ShieldCheck },
  { route: 'reports', label: 'Reports', icon: FileBarChart2 },
  { route: 'settings', label: 'Settings', icon: Settings },
];

const ROUTE_TITLES: Record<AppRoute, string> = {
  dashboard: 'Dashboard',
  inventory: 'Inventory',
  maintenance: 'Maintenance',
  copilot: 'SmartFix Copilot',
  more: 'More',
  repairs: 'Repair History',
  expenses: 'Expense Tracker',
  warranties: 'Warranty Tracker',
  reports: 'Reports',
  settings: 'Settings',
};

const MORE_ROUTES: AppRoute[] = [
  'more',
  'repairs',
  'expenses',
  'warranties',
  'reports',
  'settings',
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const {
    state,
    route,
    navigate,
    notifications,
    toasts,
    dismissToast,
    storageError,
  } = useApp();
  const [notifOpen, setNotifOpen] = useState(false);

  const highPriorityCount = notifications.filter(
    (n) => n.severity === 'high'
  ).length;
  const totalNotifCount = notifications.length;

  const isMoreActive = MORE_ROUTES.includes(route);

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#0F1D33] flex flex-col lg:flex-row">
      {/* Desktop Left Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:left-0 bg-white border-r border-[#E6E3DC] z-30 no-print">
        <div className="px-6 pt-6 pb-5 border-b border-[#ECE9E2]">
          <button
            type="button"
            onClick={() => navigate('dashboard')}
            className="flex items-center gap-3 text-left w-full group"
          >
            <div className="w-9 h-9 rounded-xl bg-[#0F1D33] text-white flex items-center justify-center shrink-0">
              <Home className="w-4.5 h-4.5 text-[#5EEAD4]" />
            </div>
            <div className="min-w-0">
              <span className="block font-display text-base font-bold tracking-tight text-[#0F1D33] leading-tight whitespace-nowrap">
                SmartFix AI
              </span>
              <span className="block text-[11px] text-[#64748B] truncate mt-0.5">
                {state.settings.homeName}
              </span>
            </div>
          </button>
        </div>

        <nav
          aria-label="Primary navigation"
          className="flex-1 px-3 py-4 overflow-y-auto space-y-6"
        >
          <div className="space-y-1">
            {PRIMARY_NAV.filter((n) => n.route !== 'more').map((item) => {
              const Icon = item.icon;
              const active = route === item.route;
              return (
                <button
                  key={item.route}
                  type="button"
                  onClick={() => navigate(item.route)}
                  aria-current={active ? 'page' : undefined}
                  className={`w-full min-h-[42px] flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-[#EEF7F7] text-[#0D7A7A] font-semibold'
                      : 'text-[#334155] hover:bg-[#F5F3EE] hover:text-[#0F1D33]'
                  }`}
                >
                  <Icon
                    className={`w-4.5 h-4.5 shrink-0 ${
                      active ? 'text-[#0D7A7A]' : 'text-[#64748B]'
                    }`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div>
            <div className="px-3.5 mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-[#64748B]">
                More Tools
              </span>
              <button
                type="button"
                onClick={() => navigate('more')}
                className="text-xs text-[#0D7A7A] hover:underline"
              >
                All
              </button>
            </div>
            <div className="space-y-1">
              {MORE_SUB_NAV.map((item) => {
                const Icon = item.icon;
                const active = route === item.route;
                return (
                  <button
                    key={item.route}
                    type="button"
                    onClick={() => navigate(item.route)}
                    aria-current={active ? 'page' : undefined}
                    className={`w-full min-h-[40px] flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                      active
                        ? 'bg-[#EEF7F7] text-[#0D7A7A] font-semibold'
                        : 'text-[#334155] hover:bg-[#F5F3EE] hover:text-[#0F1D33]'
                    }`}
                  >
                    <Icon
                      className={`w-4.5 h-4.5 shrink-0 ${
                        active ? 'text-[#0D7A7A]' : 'text-[#64748B]'
                      }`}
                    />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        <div className="px-5 py-4 border-t border-[#ECE9E2]">
          <p className="text-xs text-[#64748B] leading-relaxed">
            Your Home. Smarter Maintenance.
          </p>
        </div>
      </aside>

      {/* Main Column */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Compact Top Bar (Mobile 52px + Desktop 64px) */}
        <header className="sticky top-0 z-20 h-[52px] lg:h-16 bg-[#FAF9F6]/92 backdrop-blur-md border-b border-[#E6E3DC] px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 no-print">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => navigate('dashboard')}
              className="lg:hidden w-8 h-8 rounded-lg bg-[#0F1D33] text-white flex items-center justify-center shrink-0"
              aria-label="Go to Dashboard"
            >
              <Home className="w-4 h-4 text-[#5EEAD4]" />
            </button>
            <div className="min-w-0 flex items-center gap-2">
              <span className="font-display text-base lg:text-lg font-bold text-[#0F1D33] truncate">
                {ROUTE_TITLES[route]}
              </span>
              <span
                className="hidden sm:inline text-[#CBD5E1]"
                aria-hidden="true"
              >
                /
              </span>
              <span className="hidden sm:inline text-sm text-[#64748B] truncate">
                {state.settings.homeName}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setNotifOpen(true)}
              aria-label={`Notifications (${totalNotifCount} alerts)`}
              className="relative min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#334155] hover:bg-[#ECE9E2]/70 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {totalNotifCount > 0 && (
                <span
                  className={`absolute top-2 right-2 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-mono font-semibold text-white flex items-center justify-center tabular-nums ${
                    highPriorityCount > 0 ? 'bg-[#B91C1C]' : 'bg-[#0D7A7A]'
                  }`}
                >
                  {totalNotifCount > 9 ? '9+' : totalNotifCount}
                </span>
              )}
            </button>
          </div>
        </header>

        {storageError && (
          <div
            role="alert"
            className="mx-4 sm:mx-6 lg:mx-8 mt-4 px-4 py-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-sm text-[#991B1B] no-print"
          >
            Local storage warning: {storageError}
          </div>
        )}

        {/* Viewport Content */}
        <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-5 sm:pt-7 pb-24 lg:pb-12">
          {children}
        </main>
      </div>

      {/* Mobile Fixed Bottom Tab Bar (64px height; 52px + 64px = 116px < 15% of 844px) */}
      <nav
        aria-label="Mobile navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 h-16 bg-white/95 backdrop-blur-md border-t border-[#E6E3DC] grid grid-cols-5 items-center px-1 no-print"
      >
        {PRIMARY_NAV.map((item) => {
          const Icon = item.icon === MoreHorizontal ? Grid2x2 : item.icon;
          const active =
            item.route === 'more' ? isMoreActive : route === item.route;
          return (
            <button
              key={item.route}
              type="button"
              onClick={() => navigate(item.route)}
              aria-current={active ? 'page' : undefined}
              className={`min-h-[48px] flex flex-col items-center justify-center gap-0.5 rounded-lg transition-colors ${
                active ? 'text-[#0D7A7A]' : 'text-[#64748B]'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span
                className={`text-[10px] leading-tight whitespace-nowrap ${
                  active ? 'font-semibold' : 'font-medium'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Notifications Modal */}
      <Modal
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        title="Home Alerts & Notifications"
        subtitle={`${totalNotifCount} active item${totalNotifCount === 1 ? '' : 's'} computed from your saved records`}
        size="md"
      >
        {notifications.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm font-semibold text-[#0F1D33]">
              All caught up
            </p>
            <p className="text-sm text-[#64748B] mt-1">
              No overdue maintenance, expiring warranties, or active repairs.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#ECE9E2]">
            {notifications.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => {
                  setNotifOpen(false);
                  const filterStatus =
                    n.type === 'overdue'
                      ? 'Overdue'
                      : n.type === 'due'
                        ? 'Due'
                        : n.type === 'warranty'
                          ? 'Expiring'
                          : undefined;
                  navigate(n.targetRoute, filterStatus ? { filterStatus } : undefined);
                }}
                className="w-full py-3.5 flex items-center justify-between gap-3 text-left hover:bg-[#FAF9F6] -mx-2 px-2 rounded-xl transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <span
                      className={
                        n.severity === 'high'
                          ? 'text-[#B91C1C]'
                          : n.severity === 'medium'
                            ? 'text-[#B45309]'
                            : 'text-[#0D7A7A]'
                      }
                    >
                      {n.severity === 'high'
                        ? 'Action Required'
                        : n.severity === 'medium'
                          ? 'Upcoming'
                          : 'Active'}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-[#0F1D33] mt-0.5 truncate">
                    {n.title}
                  </p>
                  <p className="text-xs text-[#64748B] mt-0.5 truncate">
                    {n.detail}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-[#94A3B8] shrink-0" />
              </button>
            ))}
          </div>
        )}
      </Modal>

      {/* Subtle Toast Stack */}
      <div
        aria-live="polite"
        className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-50 flex flex-col gap-2 max-w-sm w-[calc(100%-2rem)] sm:w-auto pointer-events-none no-print"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-[#0F1D33] text-white text-sm shadow-lg"
          >
            <span className="leading-snug">{toast.text}</span>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss message"
              className="text-white/70 hover:text-white p-1 shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
