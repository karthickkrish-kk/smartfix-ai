import React, { useMemo, useState } from 'react';
import { Download, Printer } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  calculateSpendingSummary,
  formatCurrency,
  formatDisplayDate,
  getTaskStatus,
  getWarrantyInfo,
  toCSV,
  toISODate,
} from '../../utils/calculations';
import { downloadTextFile } from '../../utils/storage';

type ReportTab = 'maintenance' | 'repairs' | 'expenses' | 'warranties';

const REPORT_TABS: { id: ReportTab; label: string }[] = [
  { id: 'maintenance', label: 'Maintenance Report' },
  { id: 'repairs', label: 'Repair Report' },
  { id: 'expenses', label: 'Expense Report' },
  { id: 'warranties', label: 'Warranty Report' },
];

export function ReportsView() {
  const { state, pushToast } = useApp();
  const { assets, tasks, repairs, expenses, settings } = state;
  const [activeTab, setActiveTab] = useState<ReportTab>('maintenance');

  const assetMap = useMemo(
    () => new Map(assets.map((a) => [a.id, a])),
    [assets]
  );

  const spending = useMemo(
    () => calculateSpendingSummary(expenses, repairs),
    [expenses, repairs]
  );

  const todayDisplay = formatDisplayDate(toISODate(new Date()));

  const handleExportCSV = () => {
    const slug = `${settings.homeName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')}-${activeTab}-report-${toISODate(new Date())}.csv`;

    if (activeTab === 'maintenance') {
      const csv = toCSV(
        ['Task', 'Asset', 'Date', 'Status', 'Priority', 'Recurrence', 'Notes'],
        tasks.map((t) => [
          t.taskName,
          assetMap.get(t.assetId)?.name ?? 'General Home',
          t.date,
          getTaskStatus(t),
          t.priority,
          t.recurrence,
          t.notes,
        ])
      );
      downloadTextFile(slug, csv, 'text/csv;charset=utf-8');
    } else if (activeTab === 'repairs') {
      const csv = toCSV(
        ['Date', 'Appliance', 'Issue', 'Status', 'Technician', 'Cost', 'Notes'],
        repairs.map((r) => [
          r.date,
          assetMap.get(r.assetId)?.name ?? 'General Home',
          r.issue,
          r.status,
          r.technician,
          r.cost,
          r.notes,
        ])
      );
      downloadTextFile(slug, csv, 'text/csv;charset=utf-8');
    } else if (activeTab === 'expenses') {
      const csv = toCSV(
        ['Date', 'Category', 'Asset', 'Description', 'Payment Method', 'Amount'],
        expenses.map((e) => [
          e.date,
          e.category,
          assetMap.get(e.assetId)?.name ?? 'General Household',
          e.description,
          e.paymentMethod,
          e.amount,
        ])
      );
      downloadTextFile(slug, csv, 'text/csv;charset=utf-8');
    } else {
      const csv = toCSV(
        [
          'Asset',
          'Category',
          'Brand / Model',
          'Serial Number',
          'Purchase Date',
          'Warranty Expiry',
          'Status',
          'Service Provider',
        ],
        assets.map((a) => [
          a.name,
          a.category,
          `${a.brand} ${a.model}`.trim(),
          a.serialNumber,
          a.purchaseDate,
          a.warrantyExpiry || 'N/A',
          getWarrantyInfo(a.warrantyExpiry).status,
          a.serviceProvider,
        ])
      );
      downloadTextFile(slug, csv, 'text/csv;charset=utf-8');
    }
    pushToast('CSV report downloaded');
  };

  return (
    <div className="space-y-6">
      {/* Screen Header (hidden on print) */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 no-print">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#0F1D33] tracking-tight">
            Home Reports
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Print-ready maintenance, repair, expense, and warranty documentation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="min-h-[42px] px-3.5 py-2 rounded-xl border border-[#DCD8CF] bg-white hover:bg-[#F3F1EC] text-sm font-medium text-[#0F1D33] inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <Download className="w-4 h-4 text-[#0D7A7A]" />
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="min-h-[42px] px-4 py-2 rounded-xl bg-[#0D7A7A] hover:bg-[#0A6363] text-white text-sm font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <Printer className="w-4 h-4" />
            Print Report
          </button>
        </div>
      </div>

      {/* Report Tabs (hidden on print) */}
      <div
        role="tablist"
        aria-label="Report types"
        className="inline-flex flex-wrap items-center gap-1 p-1 rounded-xl bg-[#F3F1EC] no-print"
      >
        {REPORT_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={activeTab === t.id}
            onClick={() => setActiveTab(t.id)}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
              activeTab === t.id
                ? 'bg-white text-[#0F1D33] shadow-xs'
                : 'text-[#64748B] hover:text-[#0F1D33]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Printable Report Sheet */}
      <article className="bg-white border border-[#E6E3DC] rounded-2xl p-6 sm:p-8 print-clean space-y-6">
        {/* Document Masthead */}
        <header className="pb-5 border-b border-[#E6E3DC] flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-[#0D7A7A]">
              SmartFix AI · Homeowner Report
            </p>
            <h2 className="font-display text-xl font-bold text-[#0F1D33] mt-1">
              {REPORT_TABS.find((t) => t.id === activeTab)?.label}
            </h2>
            <p className="text-sm text-[#475569] mt-0.5">
              {settings.homeName}
              {settings.propertyAddress ? ` · ${settings.propertyAddress}` : ''}
            </p>
          </div>
          <div className="text-xs text-[#64748B] sm:text-right tabular-nums">
            <p>Generated {todayDisplay}</p>
            {settings.ownerName && <p className="mt-0.5">{settings.ownerName}</p>}
          </div>
        </header>

        {/* Report Body by Tab */}
        {activeTab === 'maintenance' && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Total Tasks', value: tasks.length },
                {
                  label: 'Overdue',
                  value: tasks.filter((t) => getTaskStatus(t) === 'Overdue')
                    .length,
                },
                {
                  label: 'Upcoming / Due',
                  value: tasks.filter((t) => {
                    const s = getTaskStatus(t);
                    return s === 'Due' || s === 'Upcoming';
                  }).length,
                },
                {
                  label: 'Completed',
                  value: tasks.filter((t) => t.completed).length,
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="p-3.5 rounded-xl bg-[#FAF9F6] border border-[#ECE9E2]"
                >
                  <span className="text-xs text-[#64748B]">{stat.label}</span>
                  <p className="font-mono text-xl font-bold text-[#0F1D33] tabular-nums mt-0.5">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            {tasks.length === 0 ? (
              <p className="text-sm text-[#64748B]">
                No maintenance tasks recorded.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[#E6E3DC] text-xs text-[#64748B]">
                      <th className="py-2.5 pr-4 font-semibold">Task</th>
                      <th className="py-2.5 pr-4 font-semibold">Asset</th>
                      <th className="py-2.5 pr-4 font-semibold">Date</th>
                      <th className="py-2.5 pr-4 font-semibold">Status</th>
                      <th className="py-2.5 pr-4 font-semibold">Priority</th>
                      <th className="py-2.5 font-semibold">Recurrence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ECE9E2]">
                    {tasks.map((t) => (
                      <tr key={t.id}>
                        <td className="py-3 pr-4 font-medium text-[#0F1D33]">
                          {t.taskName}
                        </td>
                        <td className="py-3 pr-4 text-[#475569]">
                          {assetMap.get(t.assetId)?.name ?? 'General Home'}
                        </td>
                        <td className="py-3 pr-4 font-mono text-xs tabular-nums">
                          {formatDisplayDate(t.date)}
                        </td>
                        <td className="py-3 pr-4 font-medium">
                          {getTaskStatus(t)}
                        </td>
                        <td className="py-3 pr-4 text-[#475569]">
                          {t.priority}
                        </td>
                        <td className="py-3 text-[#475569]">{t.recurrence}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'repairs' && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-[#FAF9F6] border border-[#ECE9E2]">
                <span className="text-xs text-[#64748B]">Total Repairs</span>
                <p className="font-mono text-xl font-bold text-[#0F1D33] tabular-nums mt-0.5">
                  {repairs.length}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#FAF9F6] border border-[#ECE9E2]">
                <span className="text-xs text-[#64748B]">Completed</span>
                <p className="font-mono text-xl font-bold text-[#0F1D33] tabular-nums mt-0.5">
                  {repairs.filter((r) => r.status === 'Completed').length}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#FAF9F6] border border-[#ECE9E2]">
                <span className="text-xs text-[#64748B]">Total Repair Spend</span>
                <p className="font-mono text-xl font-bold text-[#0F1D33] tabular-nums mt-0.5">
                  {formatCurrency(spending.totalRepairCosts, settings.currency)}
                </p>
              </div>
            </div>

            {repairs.length === 0 ? (
              <p className="text-sm text-[#64748B]">No repairs recorded.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[#E6E3DC] text-xs text-[#64748B]">
                      <th className="py-2.5 pr-4 font-semibold">Date</th>
                      <th className="py-2.5 pr-4 font-semibold">Appliance</th>
                      <th className="py-2.5 pr-4 font-semibold">Issue</th>
                      <th className="py-2.5 pr-4 font-semibold">Technician</th>
                      <th className="py-2.5 pr-4 font-semibold">Status</th>
                      <th className="py-2.5 text-right font-semibold">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ECE9E2]">
                    {repairs.map((r) => (
                      <tr key={r.id}>
                        <td className="py-3 pr-4 font-mono text-xs tabular-nums">
                          {formatDisplayDate(r.date)}
                        </td>
                        <td className="py-3 pr-4 font-medium text-[#0F1D33]">
                          {assetMap.get(r.assetId)?.name ?? 'General Home'}
                        </td>
                        <td className="py-3 pr-4 text-[#334155]">{r.issue}</td>
                        <td className="py-3 pr-4 text-[#475569]">
                          {r.technician || '—'}
                        </td>
                        <td className="py-3 pr-4 font-medium">{r.status}</td>
                        <td className="py-3 text-right font-mono tabular-nums">
                          {formatCurrency(r.cost, settings.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'expenses' && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-[#FAF9F6] border border-[#ECE9E2]">
                <span className="text-xs text-[#64748B]">Total Spending</span>
                <p className="font-mono text-xl font-bold text-[#0F1D33] tabular-nums mt-0.5">
                  {formatCurrency(spending.totalExpenses, settings.currency)}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#FAF9F6] border border-[#ECE9E2]">
                <span className="text-xs text-[#64748B]">Current Month</span>
                <p className="font-mono text-xl font-bold text-[#0F1D33] tabular-nums mt-0.5">
                  {formatCurrency(
                    spending.currentMonthExpenses,
                    settings.currency
                  )}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#FAF9F6] border border-[#ECE9E2]">
                <span className="text-xs text-[#64748B]">Entries</span>
                <p className="font-mono text-xl font-bold text-[#0F1D33] tabular-nums mt-0.5">
                  {expenses.length}
                </p>
              </div>
            </div>

            {expenses.length === 0 ? (
              <p className="text-sm text-[#64748B]">No expenses recorded.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[#E6E3DC] text-xs text-[#64748B]">
                      <th className="py-2.5 pr-4 font-semibold">Date</th>
                      <th className="py-2.5 pr-4 font-semibold">Category</th>
                      <th className="py-2.5 pr-4 font-semibold">Description</th>
                      <th className="py-2.5 pr-4 font-semibold">Asset</th>
                      <th className="py-2.5 pr-4 font-semibold">Method</th>
                      <th className="py-2.5 text-right font-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ECE9E2]">
                    {expenses.map((e) => (
                      <tr key={e.id}>
                        <td className="py-3 pr-4 font-mono text-xs tabular-nums">
                          {formatDisplayDate(e.date)}
                        </td>
                        <td className="py-3 pr-4 font-medium text-[#0F1D33]">
                          {e.category}
                        </td>
                        <td className="py-3 pr-4 text-[#334155]">
                          {e.description}
                        </td>
                        <td className="py-3 pr-4 text-[#475569]">
                          {assetMap.get(e.assetId)?.name ?? 'General'}
                        </td>
                        <td className="py-3 pr-4 text-[#475569]">
                          {e.paymentMethod}
                        </td>
                        <td className="py-3 text-right font-mono tabular-nums">
                          {formatCurrency(e.amount, settings.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'warranties' && (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-3">
              {(['Active', 'Expiring', 'Expired'] as const).map((status) => (
                <div
                  key={status}
                  className="p-3.5 rounded-xl bg-[#FAF9F6] border border-[#ECE9E2]"
                >
                  <span className="text-xs text-[#64748B]">{status}</span>
                  <p className="font-mono text-xl font-bold text-[#0F1D33] tabular-nums mt-0.5">
                    {
                      assets.filter(
                        (a) => getWarrantyInfo(a.warrantyExpiry).status === status
                      ).length
                    }
                  </p>
                </div>
              ))}
            </div>

            {assets.length === 0 ? (
              <p className="text-sm text-[#64748B]">No assets registered.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[#E6E3DC] text-xs text-[#64748B]">
                      <th className="py-2.5 pr-4 font-semibold">Asset</th>
                      <th className="py-2.5 pr-4 font-semibold">Brand / Model</th>
                      <th className="py-2.5 pr-4 font-semibold">Serial #</th>
                      <th className="py-2.5 pr-4 font-semibold">Expiry Date</th>
                      <th className="py-2.5 pr-4 font-semibold">Status</th>
                      <th className="py-2.5 font-semibold">Service Contact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ECE9E2]">
                    {assets.map((a) => {
                      const w = getWarrantyInfo(a.warrantyExpiry);
                      return (
                        <tr key={a.id}>
                          <td className="py-3 pr-4 font-medium text-[#0F1D33]">
                            {a.name}
                          </td>
                          <td className="py-3 pr-4 text-[#475569]">
                            {[a.brand, a.model].filter(Boolean).join(' ') || '—'}
                          </td>
                          <td className="py-3 pr-4 font-mono text-xs">
                            {a.serialNumber || '—'}
                          </td>
                          <td className="py-3 pr-4 font-mono text-xs tabular-nums">
                            {formatDisplayDate(a.warrantyExpiry)}
                          </td>
                          <td className="py-3 pr-4 font-medium">{w.status}</td>
                          <td className="py-3 text-[#475569]">
                            {a.serviceProvider || '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </article>
    </div>
  );
}
