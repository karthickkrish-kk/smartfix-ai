import React, { useMemo } from 'react';
import {
  ChevronRight,
  FileBarChart2,
  Receipt,
  Settings,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { AppRoute } from '../../types';
import {
  calculateSpendingSummary,
  formatCurrency,
  getWarrantyInfo,
} from '../../utils/calculations';

export function MoreHubView() {
  const { state, navigate } = useApp();
  const { assets, repairs, expenses, settings } = state;

  const spending = useMemo(
    () => calculateSpendingSummary(expenses, repairs),
    [expenses, repairs]
  );

  const expiringCount = useMemo(
    () =>
      assets.filter((a) => getWarrantyInfo(a.warrantyExpiry).status === 'Expiring')
        .length,
    [assets]
  );

  const activeRepairsCount = useMemo(
    () => repairs.filter((r) => r.status !== 'Completed').length,
    [repairs]
  );

  const items: {
    route: AppRoute;
    title: string;
    description: string;
    metric: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    {
      route: 'repairs',
      title: 'Repair History',
      description:
        'Log appliance breakdowns, repair costs, technician contacts, and service status.',
      metric: `${repairs.length} logged · ${activeRepairsCount} active`,
      icon: Wrench,
    },
    {
      route: 'expenses',
      title: 'Expense Tracker',
      description:
        'Track household maintenance spending, monthly totals, and category breakdowns.',
      metric: `${formatCurrency(spending.totalExpenses, settings.currency)} total`,
      icon: Receipt,
    },
    {
      route: 'warranties',
      title: 'Warranty Tracker',
      description:
        'Automatic coverage tracking across active, expiring, and expired appliance warranties.',
      metric: `${expiringCount} expiring within 60 days`,
      icon: ShieldCheck,
    },
    {
      route: 'reports',
      title: 'Reports',
      description:
        'Print-friendly maintenance, repair, expense, and warranty reports with CSV export.',
      metric: '4 printable reports',
      icon: FileBarChart2,
    },
    {
      route: 'settings',
      title: 'Settings & Data',
      description:
        'Manage home profile, currency, JSON backup export, and sample data controls.',
      metric: `${settings.homeName} · ${settings.currency}`,
      icon: Settings,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#0F1D33] tracking-tight">
          More Tools & Records
        </h1>
        <p className="text-sm text-[#64748B] mt-1">
          Repairs, household expenses, warranties, printable reports, and home
          settings.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.route}
              type="button"
              onClick={() => navigate(item.route)}
              className="text-left bg-white border border-[#E6E3DC] hover:border-[#0D7A7A] rounded-2xl p-5 flex items-start justify-between gap-4 transition-colors group"
            >
              <div className="flex items-start gap-4 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-[#EEF7F7] text-[#0D7A7A] flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-display text-base font-bold text-[#0F1D33] group-hover:text-[#0D7A7A] transition-colors">
                    {item.title}
                  </h2>
                  <p className="text-sm text-[#475569] mt-1 leading-relaxed">
                    {item.description}
                  </p>
                  <p className="text-xs font-medium text-[#64748B] mt-2 tabular-nums">
                    {item.metric}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-[#94A3B8] group-hover:text-[#0D7A7A] shrink-0 mt-1" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
