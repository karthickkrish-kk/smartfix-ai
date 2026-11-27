import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  LifeBuoy,
  Package,
  Plus,
  Receipt,
  RotateCcw,
  ShieldAlert,
  Wrench,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  calculateHomeHealthScore,
  calculateSpendingSummary,
  formatCurrency,
  formatDisplayDate,
  getTaskStatus,
  getWarrantyInfo,
} from '../../utils/calculations';
import { SpendingChart } from '../ui/SpendingChart';
import { ConfirmDialog } from '../ui/ConfirmDialog';

export function DashboardView() {
  const {
    state,
    navigate,
    notifications,
    toggleTaskComplete,
    clearAllData,
    resetDemoData,
    updateSettings,
  } = useApp();
  const { assets, tasks, repairs, expenses, settings } = state;
  const [confirmClearDemo, setConfirmClearDemo] = useState(false);

  const isEmptyHome =
    assets.length === 0 &&
    tasks.length === 0 &&
    repairs.length === 0 &&
    expenses.length === 0;

  const assetMap = useMemo(
    () => new Map(assets.map((a) => [a.id, a])),
    [assets]
  );

  const health = useMemo(
    () => calculateHomeHealthScore(assets, tasks, repairs),
    [assets, tasks, repairs]
  );

  const spending = useMemo(
    () => calculateSpendingSummary(expenses, repairs),
    [expenses, repairs]
  );

  const taskGroups = useMemo(() => {
    const overdue = [];
    const upcoming = [];
    for (const t of tasks) {
      const status = getTaskStatus(t);
      if (status === 'Overdue') overdue.push({ task: t, status });
      else if (status === 'Due' || status === 'Upcoming')
        upcoming.push({ task: t, status });
    }
    overdue.sort((a, b) => a.task.date.localeCompare(b.task.date));
    upcoming.sort((a, b) => a.task.date.localeCompare(b.task.date));
    return { overdue, upcoming };
  }, [tasks]);

  const expiringWarrantiesCount = useMemo(
    () =>
      assets.filter((a) => getWarrantyInfo(a.warrantyExpiry).status === 'Expiring')
        .length,
    [assets]
  );

  const recentRepairs = useMemo(
    () => [...repairs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4),
    [repairs]
  );

  // SVG gauge geometry
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = health.hasData
    ? circumference - (health.score / 100) * circumference
    : circumference;
  const scoreStroke = !health.hasData
    ? '#CBD5E1'
    : health.score >= 85
      ? '#0D7A7A'
      : health.score >= 70
        ? '#0F766E'
        : health.score >= 50
          ? '#B45309'
          : '#B91C1C';

  if (isEmptyHome) {
    return (
      <div className="space-y-6">
        <section>
          <p className="text-sm text-[#64748B]">
            Your Home. Smarter Maintenance.
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0F1D33] tracking-tight mt-0.5">
            {settings.homeName}
          </h1>
        </section>

        <section
          aria-label="Get started with SmartFix AI"
          className="bg-white border border-[#E6E3DC] rounded-2xl p-6 sm:p-10 max-w-3xl"
        >
          <p className="text-xs font-semibold text-[#0D7A7A]">
            Ready for Your Home
          </p>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0F1D33] mt-1.5">
            Start tracking your home appliances and maintenance
          </h2>
          <p className="text-sm text-[#475569] mt-2 leading-relaxed max-w-xl">
            Add your first appliance or system to automatically track warranty
            expiration dates, schedule recurring care, log repairs, and monitor
            annual household maintenance spending. All records stay saved
            privately on this device.
          </p>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => navigate('inventory', { openCreate: true })}
              className="min-h-[48px] px-4 py-3 rounded-xl bg-[#0D7A7A] hover:bg-[#0A6363] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add First Asset
            </button>
            <button
              type="button"
              onClick={() => navigate('maintenance', { openCreate: true })}
              className="min-h-[48px] px-4 py-3 rounded-xl bg-white border border-[#DCD8CF] hover:bg-[#F3F1EC] text-[#0F1D33] text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors"
            >
              <CalendarClock className="w-4 h-4 text-[#0D7A7A]" />
              Schedule Maintenance
            </button>
            <button
              type="button"
              onClick={() => navigate('copilot')}
              className="min-h-[48px] px-4 py-3 rounded-xl bg-white border border-[#DCD8CF] hover:bg-[#F3F1EC] text-[#0F1D33] text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors"
            >
              <LifeBuoy className="w-4 h-4 text-[#0D7A7A]" />
              Troubleshooting Guides
            </button>
          </div>

          <div className="mt-6 pt-5 border-t border-[#ECE9E2] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#64748B]">
            <span>
              Want to explore the dashboard before entering your own appliances?
            </span>
            <button
              type="button"
              onClick={() => resetDemoData()}
              className="inline-flex items-center gap-1.5 font-semibold text-[#0D7A7A] hover:text-[#0A6363] whitespace-nowrap self-start sm:self-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Load Sample Home Data
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Row & Quick Actions */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-sm text-[#64748B]">
            Your Home. Smarter Maintenance.
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0F1D33] tracking-tight mt-0.5">
            {settings.homeName}
          </h1>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('inventory', { openCreate: true })}
            className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0D7A7A] hover:bg-[#0A6363] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add Asset
          </button>
          <button
            type="button"
            onClick={() => navigate('maintenance', { openCreate: true })}
            className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#DCD8CF] hover:bg-[#F3F1EC] text-[#0F1D33] text-sm font-medium transition-colors whitespace-nowrap shrink-0"
          >
            <CalendarClock className="w-4 h-4 text-[#0D7A7A]" />
            Schedule Task
          </button>
          <button
            type="button"
            onClick={() => navigate('repairs', { openCreate: true })}
            className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#DCD8CF] hover:bg-[#F3F1EC] text-[#0F1D33] text-sm font-medium transition-colors whitespace-nowrap shrink-0"
          >
            <Wrench className="w-4 h-4 text-[#0D7A7A]" />
            Log Repair
          </button>
          <button
            type="button"
            onClick={() => navigate('expenses', { openCreate: true })}
            className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#DCD8CF] hover:bg-[#F3F1EC] text-[#0F1D33] text-sm font-medium transition-colors whitespace-nowrap shrink-0"
          >
            <Receipt className="w-4 h-4 text-[#0D7A7A]" />
            Add Expense
          </button>
        </div>
      </section>

      {/* Discreet Dismissible Sample Data Strip */}
      {settings.isDemoData && (
        <div className="bg-white border border-[#E6E3DC] rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-[#475569]">
          <span>
            Showing sample home records so you can explore. Ready to set up your
            own home?
          </span>
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setConfirmClearDemo(true)}
              className="font-semibold text-[#0D7A7A] hover:underline whitespace-nowrap"
            >
              Start Fresh (Clear Sample)
            </button>
            <button
              type="button"
              onClick={() => updateSettings({ isDemoData: false })}
              aria-label="Dismiss sample data notice"
              className="p-1 text-[#64748B] hover:text-[#0F1D33] rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 4-Column KPI Strip */}
      <section
        aria-label="Key home metrics"
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
      >
        <button
          type="button"
          onClick={() => navigate('inventory')}
          className="text-left bg-white border border-[#E6E3DC] hover:border-[#0D7A7A]/50 rounded-2xl p-4 sm:p-5 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-[#64748B]">
              Registered Assets
            </span>
            <Package className="w-4 h-4 text-[#0D7A7A]" />
          </div>
          <p
            data-testid="kpi-assets"
            className="font-display text-2xl sm:text-3xl font-bold text-[#0F1D33] tabular-nums mt-2"
          >
            {assets.length}
          </p>
          <p className="text-xs text-[#64748B] mt-1">
            Appliances & systems tracked
          </p>
        </button>

        <button
          type="button"
          onClick={() => navigate('maintenance')}
          className="text-left bg-white border border-[#E6E3DC] hover:border-[#0D7A7A]/50 rounded-2xl p-4 sm:p-5 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-[#64748B]">
              Upcoming Maintenance
            </span>
            <CalendarClock className="w-4 h-4 text-[#0D7A7A]" />
          </div>
          <p
            data-testid="kpi-upcoming"
            className="font-display text-2xl sm:text-3xl font-bold text-[#0F1D33] tabular-nums mt-2"
          >
            {taskGroups.upcoming.length}
          </p>
          <p className="text-xs text-[#64748B] mt-1">
            {health.overdueCount > 0 ? (
              <span className="text-[#B91C1C] font-medium">
                {health.overdueCount} overdue
              </span>
            ) : (
              'None overdue'
            )}
          </p>
        </button>

        <button
          type="button"
          onClick={() => navigate('warranties', { filterStatus: 'Expiring' })}
          className="text-left bg-white border border-[#E6E3DC] hover:border-[#0D7A7A]/50 rounded-2xl p-4 sm:p-5 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-[#64748B]">
              Warranties Expiring
            </span>
            <ShieldAlert className="w-4 h-4 text-[#B45309]" />
          </div>
          <p
            data-testid="kpi-warranties"
            className="font-display text-2xl sm:text-3xl font-bold text-[#0F1D33] tabular-nums mt-2"
          >
            {expiringWarrantiesCount}
          </p>
          <p className="text-xs text-[#64748B] mt-1">Within next 60 days</p>
        </button>

        <button
          type="button"
          onClick={() => navigate('expenses')}
          className="text-left bg-white border border-[#E6E3DC] hover:border-[#0D7A7A]/50 rounded-2xl p-4 sm:p-5 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-[#64748B]">
              Total Spending
            </span>
            <Receipt className="w-4 h-4 text-[#0D7A7A]" />
          </div>
          <p
            data-testid="kpi-spending"
            className="font-display text-2xl sm:text-3xl font-bold text-[#0F1D33] tabular-nums mt-2 truncate"
          >
            {formatCurrency(spending.totalExpenses, settings.currency)}
          </p>
          <p className="text-xs text-[#64748B] mt-1 tabular-nums">
            {formatCurrency(spending.currentMonthExpenses, settings.currency)}{' '}
            this month
          </p>
        </button>
      </section>

      {/* Main Bento Row: Home Health Score + Monthly Spending Chart */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Home Health Score */}
        <div className="lg:col-span-5 bg-white border border-[#E6E3DC] rounded-2xl p-5 sm:p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-base font-bold text-[#0F1D33]">
                Home Health Score
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Calculated from maintenance, warranties & active repairs
              </p>
            </div>
            <span
              className={`text-xs font-semibold ${
                health.score >= 85
                  ? 'text-[#15803D]'
                  : health.score >= 70
                    ? 'text-[#0D7A7A]'
                    : health.score >= 50
                      ? 'text-[#B45309]'
                      : 'text-[#B91C1C]'
              }`}
            >
              {health.label}
            </span>
          </div>

          <div className="my-5 flex items-center gap-6">
            <div className="relative w-28 h-28 shrink-0">
              <svg
                className="w-28 h-28 -rotate-90"
                viewBox="0 0 100 100"
                aria-hidden="true"
              >
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke="#ECE9E2"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke={scoreStroke}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeOffset}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  data-testid="health-score-value"
                  className="font-display text-2xl font-bold text-[#0F1D33] tabular-nums"
                >
                  {health.hasData ? health.score : '—'}
                </span>
                <span className="text-[11px] text-[#64748B]">
                  {health.hasData ? 'of 100' : 'no data'}
                </span>
              </div>
            </div>

            <div className="flex-1 space-y-2.5 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#475569]">Overdue tasks</span>
                <span
                  className={`font-mono font-semibold tabular-nums ${
                    health.overdueCount > 0
                      ? 'text-[#B91C1C]'
                      : 'text-[#15803D]'
                  }`}
                >
                  {health.overdueCount}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#475569]">Due within 7 days</span>
                <span className="font-mono font-semibold text-[#0F1D33] tabular-nums">
                  {health.dueCount}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#475569]">Active repairs</span>
                <span className="font-mono font-semibold text-[#0F1D33] tabular-nums">
                  {health.activeRepairsCount}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#475569]">Expiring warranties</span>
                <span className="font-mono font-semibold text-[#B45309] tabular-nums">
                  {health.expiringWarrantiesCount}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#ECE9E2] flex items-center justify-between">
            <span className="text-xs text-[#64748B]">
              Need help diagnosing an appliance issue?
            </span>
            <button
              type="button"
              onClick={() => navigate('copilot')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#0D7A7A] hover:text-[#0A6363] whitespace-nowrap"
            >
              <LifeBuoy className="w-3.5 h-3.5" />
              Open Copilot
            </button>
          </div>
        </div>

        {/* Spending Chart */}
        <div className="lg:col-span-7 bg-white border border-[#E6E3DC] rounded-2xl p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div>
              <h2 className="font-display text-base font-bold text-[#0F1D33]">
                Maintenance Spending
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Last 6 months household expense activity
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('expenses')}
              className="text-xs font-semibold text-[#0D7A7A] hover:text-[#0A6363] inline-flex items-center gap-1 whitespace-nowrap"
            >
              Full Tracker
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <SpendingChart
            data={spending.monthlySeries}
            currency={settings.currency}
          />
        </div>
      </section>

      {/* Dedicated Overdue Maintenance Widget */}
      {taskGroups.overdue.length > 0 && (
        <section
          aria-label="Overdue maintenance"
          className="bg-[#FEF2F2] border border-[#FECACA] rounded-2xl p-4 sm:p-5 space-y-3"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4.5 h-4.5 text-[#B91C1C] shrink-0" />
              <h2 className="font-display text-sm sm:text-base font-bold text-[#991B1B]">
                Overdue Maintenance ({taskGroups.overdue.length})
              </h2>
            </div>
            <button
              type="button"
              onClick={() => navigate('maintenance')}
              className="text-xs font-semibold text-[#991B1B] hover:underline whitespace-nowrap"
            >
              Manage All →
            </button>
          </div>

          <div className="divide-y divide-[#FECACA]/70">
            {taskGroups.overdue.map(({ task }) => {
              const asset = assetMap.get(task.assetId);
              return (
                <div
                  key={task.id}
                  className="pt-3 first:pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#7F1D1D] truncate">
                      {task.taskName}
                    </p>
                    <p className="text-xs text-[#991B1B]/90 mt-0.5 tabular-nums">
                      Was due {formatDisplayDate(task.date)} ·{' '}
                      {asset ? asset.name : 'General Home'} · {task.priority}{' '}
                      priority
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleTaskComplete(task.id)}
                    aria-label={`Complete overdue task "${task.taskName}"`}
                    className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-[#B91C1C] hover:bg-[#991B1B] text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 self-start sm:self-center"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Mark Completed
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Maintenance Task List + Notifications & Recent Repairs */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Overdue & Upcoming Maintenance List */}
        <div className="lg:col-span-7 bg-white border border-[#E6E3DC] rounded-2xl p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="font-display text-base font-bold text-[#0F1D33]">
                Maintenance Task List
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Overdue and upcoming scheduled care
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('maintenance')}
              className="text-xs font-semibold text-[#0D7A7A] hover:text-[#0A6363] inline-flex items-center gap-1 whitespace-nowrap"
            >
              View Schedule
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {taskGroups.overdue.length === 0 && taskGroups.upcoming.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm font-medium text-[#0F1D33]">
                No pending maintenance tasks
              </p>
              <p className="text-xs text-[#64748B] mt-1">
                Schedule recurring filter changes or annual inspections to stay ahead.
              </p>
              <button
                type="button"
                onClick={() => navigate('maintenance', { openCreate: true })}
                className="mt-4 min-h-[40px] px-4 py-2 rounded-xl bg-[#0D7A7A] text-white text-xs font-semibold hover:bg-[#0A6363]"
              >
                Schedule First Task
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#ECE9E2]">
              {[...taskGroups.overdue, ...taskGroups.upcoming]
                .slice(0, 6)
                .map(({ task, status }) => {
                  const asset = assetMap.get(task.assetId);
                  return (
                    <div
                      key={task.id}
                      className="py-3.5 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                          <span
                            className={`font-semibold ${
                              status === 'Overdue'
                                ? 'text-[#B91C1C]'
                                : status === 'Due'
                                  ? 'text-[#B45309]'
                                  : 'text-[#0D7A7A]'
                            }`}
                          >
                            {status}
                          </span>
                          <span className="text-[#CBD5E1]" aria-hidden="true">
                            ·
                          </span>
                          <span className="text-[#64748B] tabular-nums">
                            {formatDisplayDate(task.date)}
                          </span>
                          {task.recurrence !== 'None' && (
                            <>
                              <span
                                className="text-[#CBD5E1]"
                                aria-hidden="true"
                              >
                                ·
                              </span>
                              <span className="text-[#64748B]">
                                {task.recurrence}
                              </span>
                            </>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-[#0F1D33] mt-0.5 truncate">
                          {task.taskName}
                        </p>
                        <p className="text-xs text-[#64748B] truncate mt-0.5">
                          {asset ? asset.name : 'General Home'} · {task.priority}{' '}
                          priority
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleTaskComplete(task.id)}
                        aria-label={`Mark "${task.taskName}" completed`}
                        className="min-h-[40px] px-3 py-1.5 rounded-xl border border-[#DCD8CF] hover:border-[#0D7A7A] hover:bg-[#EEF7F7] text-xs font-semibold text-[#0F1D33] hover:text-[#0D7A7A] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Complete
                      </button>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Right Column: Notifications + Recent Repairs */}
        <div className="lg:col-span-5 space-y-5">
          {/* Active Notifications Widget */}
          <div className="bg-white border border-[#E6E3DC] rounded-2xl p-5 sm:p-6">
            <div className="flex items-center justify-between gap-2 mb-3">
              <h2 className="font-display text-base font-bold text-[#0F1D33]">
                Priority Alerts
              </h2>
              <span className="text-xs font-mono text-[#64748B] tabular-nums">
                {notifications.length} active
              </span>
            </div>

            {notifications.length === 0 ? (
              <p className="text-sm text-[#64748B] py-3">
                No urgent alerts right now. All tasks and warranties are in good standing.
              </p>
            ) : (
              <div className="divide-y divide-[#ECE9E2]">
                {notifications.slice(0, 4).map((alert) => (
                  <button
                    key={alert.id}
                    type="button"
                    onClick={() => navigate(alert.targetRoute)}
                    className="w-full py-3 flex items-start justify-between gap-3 text-left hover:bg-[#FAF9F6] -mx-2 px-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <AlertCircle
                        className={`w-4 h-4 mt-0.5 shrink-0 ${
                          alert.severity === 'high'
                            ? 'text-[#B91C1C]'
                            : alert.severity === 'medium'
                              ? 'text-[#B45309]'
                              : 'text-[#0D7A7A]'
                        }`}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#0F1D33] truncate">
                          {alert.title}
                        </p>
                        <p className="text-xs text-[#64748B] truncate mt-0.5">
                          {alert.detail}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Recent Repairs Widget */}
          <div className="bg-white border border-[#E6E3DC] rounded-2xl p-5 sm:p-6">
            <div className="flex items-center justify-between gap-2 mb-3">
              <h2 className="font-display text-base font-bold text-[#0F1D33]">
                Recent Repairs
              </h2>
              <button
                type="button"
                onClick={() => navigate('repairs')}
                className="text-xs font-semibold text-[#0D7A7A] hover:text-[#0A6363] inline-flex items-center gap-1 whitespace-nowrap"
              >
                All Repairs
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {recentRepairs.length === 0 ? (
              <div className="py-4">
                <p className="text-sm text-[#64748B]">
                  No repair history recorded yet.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('repairs', { openCreate: true })}
                  className="mt-2 text-xs font-semibold text-[#0D7A7A] hover:underline"
                >
                  Log your first repair →
                </button>
              </div>
            ) : (
              <div className="divide-y divide-[#ECE9E2]">
                {recentRepairs.map((rep) => {
                  const asset = assetMap.get(rep.assetId);
                  return (
                    <div
                      key={rep.id}
                      className="py-3 flex items-start justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#0F1D33] truncate">
                          {asset ? asset.name : 'Home System'}
                        </p>
                        <p className="text-xs text-[#475569] truncate mt-0.5">
                          {rep.issue}
                        </p>
                        <p className="text-xs text-[#64748B] mt-0.5">
                          <span
                            className={
                              rep.status === 'Completed'
                                ? 'text-[#15803D] font-medium'
                                : rep.status === 'In Progress'
                                  ? 'text-[#B45309] font-medium'
                                  : 'text-[#0D7A7A] font-medium'
                            }
                          >
                            {rep.status}
                          </span>{' '}
                          · {formatDisplayDate(rep.date)}
                        </p>
                      </div>
                      <span className="font-mono text-sm font-semibold text-[#0F1D33] tabular-nums shrink-0">
                        {formatCurrency(rep.cost, settings.currency)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      <ConfirmDialog
        open={confirmClearDemo}
        onClose={() => setConfirmClearDemo(false)}
        onConfirm={() => clearAllData()}
        title="Clear Sample Data?"
        message="Remove all sample records so you can start fresh with your own home appliances, schedules, and expenses."
        confirmLabel="Start Fresh"
        tone="danger"
      />
    </div>
  );
}
