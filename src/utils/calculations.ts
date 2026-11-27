import type {
  AppNotification,
  Asset,
  CurrencyCode,
  ExpenseCategory,
  ExpenseRecord,
  MaintenanceTask,
  RepairRecord,
  TaskRecurrence,
  TaskStatus,
  WarrantyInfo,
} from '../types';

export const WARRANTY_EXPIRING_WINDOW_DAYS = 60;
export const TASK_DUE_WINDOW_DAYS = 7;

export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseISODate(dateStr: string): Date | null {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  if (
    dt.getFullYear() !== y ||
    dt.getMonth() !== m - 1 ||
    dt.getDate() !== d
  ) {
    return null;
  }
  return dt;
}

export function diffDays(targetDateStr: string, referenceDate: Date): number | null {
  const target = parseISODate(targetDateStr);
  if (!target) return null;
  const refStart = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  );
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((target.getTime() - refStart.getTime()) / msPerDay);
}

export function formatDisplayDate(dateStr: string): string {
  const dt = parseISODate(dateStr);
  if (!dt) return '—';
  return dt.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getWarrantyInfo(
  expiryDate: string,
  referenceDate: Date = new Date()
): WarrantyInfo {
  if (!expiryDate) {
    return { status: 'None', daysRemaining: null };
  }
  const days = diffDays(expiryDate, referenceDate);
  if (days === null) {
    return { status: 'None', daysRemaining: null };
  }
  if (days < 0) {
    return { status: 'Expired', daysRemaining: days };
  }
  if (days <= WARRANTY_EXPIRING_WINDOW_DAYS) {
    return { status: 'Expiring', daysRemaining: days };
  }
  return { status: 'Active', daysRemaining: days };
}

export function getTaskStatus(
  task: Pick<MaintenanceTask, 'date' | 'completed'>,
  referenceDate: Date = new Date()
): TaskStatus {
  if (task.completed) return 'Completed';
  const days = diffDays(task.date, referenceDate);
  if (days === null) return 'Upcoming';
  if (days < 0) return 'Overdue';
  if (days <= TASK_DUE_WINDOW_DAYS) return 'Due';
  return 'Upcoming';
}

export function computeNextRecurrenceDate(
  dateStr: string,
  recurrence: TaskRecurrence,
  referenceDate?: Date
): string | null {
  if (recurrence === 'None') return null;
  const base = parseISODate(dateStr);
  if (!base) return null;

  const monthsToAdd =
    recurrence === 'Monthly'
      ? 1
      : recurrence === 'Quarterly'
        ? 3
        : recurrence === 'Bi-Annual'
          ? 6
          : 12;

  const refStart = referenceDate
    ? new Date(
        referenceDate.getFullYear(),
        referenceDate.getMonth(),
        referenceDate.getDate()
      )
    : null;

  let step = 1;
  let candidate: Date;
  do {
    const targetMonth = base.getMonth() + monthsToAdd * step;
    const targetYear = base.getFullYear() + Math.floor(targetMonth / 12);
    const normalizedMonth = ((targetMonth % 12) + 12) % 12;

    const lastDayOfTargetMonth = new Date(
      targetYear,
      normalizedMonth + 1,
      0
    ).getDate();
    const clampedDay = Math.min(base.getDate(), lastDayOfTargetMonth);
    candidate = new Date(targetYear, normalizedMonth, clampedDay);
    step++;
  } while (refStart && candidate.getTime() <= refStart.getTime() && step < 120);

  return toISODate(candidate);
}

export interface HealthScoreBreakdown {
  hasData: boolean;
  score: number;
  label: 'Excellent' | 'Good' | 'Fair' | 'Needs Attention' | 'No Data';
  overdueCount: number;
  dueCount: number;
  expiringWarrantiesCount: number;
  expiredWarrantiesCount: number;
  activeRepairsCount: number;
  completionRate: number;
}

export function calculateHomeHealthScore(
  assets: Asset[],
  tasks: MaintenanceTask[],
  repairs: RepairRecord[],
  referenceDate: Date = new Date()
): HealthScoreBreakdown {
  let overdueCount = 0;
  let dueCount = 0;
  let completedCount = 0;

  for (const task of tasks) {
    const status = getTaskStatus(task, referenceDate);
    if (status === 'Overdue') overdueCount++;
    else if (status === 'Due') dueCount++;
    else if (status === 'Completed') completedCount++;
  }

  let expiringWarrantiesCount = 0;
  let expiredWarrantiesCount = 0;
  for (const asset of assets) {
    const info = getWarrantyInfo(asset.warrantyExpiry, referenceDate);
    if (info.status === 'Expiring') expiringWarrantiesCount++;
    else if (info.status === 'Expired') expiredWarrantiesCount++;
  }

  const activeRepairsCount = repairs.filter((r) => r.status !== 'Completed').length;

  const completionRate =
    tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 100;

  if (assets.length === 0 && tasks.length === 0 && repairs.length === 0) {
    return {
      hasData: false,
      score: 0,
      label: 'No Data',
      overdueCount: 0,
      dueCount: 0,
      expiringWarrantiesCount: 0,
      expiredWarrantiesCount: 0,
      activeRepairsCount: 0,
      completionRate: 0,
    };
  }

  let raw = 100;
  raw -= Math.min(40, overdueCount * 12);
  raw -= Math.min(12, dueCount * 3);
  raw -= Math.min(20, activeRepairsCount * 7);
  raw -= Math.min(15, expiringWarrantiesCount * 4);
  raw -= Math.min(13, expiredWarrantiesCount * 3);

  const score = Math.max(0, Math.min(100, Math.round(raw)));
  const label: HealthScoreBreakdown['label'] =
    score >= 85
      ? 'Excellent'
      : score >= 70
        ? 'Good'
        : score >= 50
          ? 'Fair'
          : 'Needs Attention';

  return {
    hasData: true,
    score,
    label,
    overdueCount,
    dueCount,
    expiringWarrantiesCount,
    expiredWarrantiesCount,
    activeRepairsCount,
    completionRate,
  };
}

export interface MonthlySpendPoint {
  monthKey: string; // YYYY-MM
  label: string; // e.g. 'Jun'
  total: number;
}

export interface CategorySpendItem {
  category: ExpenseCategory;
  total: number;
  percentage: number;
  count: number;
}

export interface SpendingSummary {
  totalExpenses: number;
  currentMonthExpenses: number;
  totalRepairCosts: number;
  combinedTotal: number;
  monthlySeries: MonthlySpendPoint[];
  categoryBreakdown: CategorySpendItem[];
}

export function calculateSpendingSummary(
  expenses: ExpenseRecord[],
  repairs: RepairRecord[],
  referenceDate: Date = new Date(),
  monthsCount = 6
): SpendingSummary {
  const currentMonthKey = `${referenceDate.getFullYear()}-${String(
    referenceDate.getMonth() + 1
  ).padStart(2, '0')}`;

  // Prepare last N months buckets
  const monthBuckets = new Map<string, MonthlySpendPoint>();
  for (let i = monthsCount - 1; i >= 0; i--) {
    const d = new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth() - i,
      1
    );
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-US', { month: 'short' });
    monthBuckets.set(key, { monthKey: key, label, total: 0 });
  }

  let totalExpenses = 0;
  let currentMonthExpenses = 0;
  const catMap = new Map<ExpenseCategory, { total: number; count: number }>();

  for (const exp of expenses) {
    const amt = Number.isFinite(exp.amount) && exp.amount > 0 ? exp.amount : 0;
    totalExpenses += amt;

    const monthKey = exp.date ? exp.date.slice(0, 7) : '';
    if (monthKey === currentMonthKey) {
      currentMonthExpenses += amt;
    }

    const bucket = monthBuckets.get(monthKey);
    if (bucket) {
      bucket.total += amt;
    }

    const existing = catMap.get(exp.category) ?? { total: 0, count: 0 };
    existing.total += amt;
    existing.count += 1;
    catMap.set(exp.category, existing);
  }

  let totalRepairCosts = 0;
  for (const rep of repairs) {
    const cost = Number.isFinite(rep.cost) && rep.cost > 0 ? rep.cost : 0;
    totalRepairCosts += cost;
  }

  const categoryBreakdown: CategorySpendItem[] = Array.from(catMap.entries())
    .map(([category, info]) => ({
      category,
      total: Number(info.total.toFixed(2)),
      count: info.count,
      percentage:
        totalExpenses > 0
          ? Math.round((info.total / totalExpenses) * 100)
          : 0,
    }))
    .sort((a, b) => b.total - a.total);

  return {
    totalExpenses: Number(totalExpenses.toFixed(2)),
    currentMonthExpenses: Number(currentMonthExpenses.toFixed(2)),
    totalRepairCosts: Number(totalRepairCosts.toFixed(2)),
    combinedTotal: Number(totalExpenses.toFixed(2)),
    monthlySeries: Array.from(monthBuckets.values()).map((pt) => ({
      ...pt,
      total: Number(pt.total.toFixed(2)),
    })),
    categoryBreakdown,
  };
}

export function generateNotifications(
  assets: Asset[],
  tasks: MaintenanceTask[],
  repairs: RepairRecord[],
  referenceDate: Date = new Date()
): AppNotification[] {
  const assetById = new Map(assets.map((a) => [a.id, a]));
  const items: AppNotification[] = [];

  for (const task of tasks) {
    const status = getTaskStatus(task, referenceDate);
    const assetName = assetById.get(task.assetId)?.name;
    if (status === 'Overdue') {
      const daysLate = Math.abs(diffDays(task.date, referenceDate) ?? 0);
      items.push({
        id: `notif-task-${task.id}`,
        type: 'overdue',
        severity: 'high',
        title: `Overdue: ${task.taskName}`,
        detail: `${assetName ? `${assetName} · ` : ''}${daysLate} day${daysLate === 1 ? '' : 's'} overdue`,
        targetRoute: 'maintenance',
        targetId: task.id,
      });
    } else if (status === 'Due') {
      const daysUntil = diffDays(task.date, referenceDate) ?? 0;
      items.push({
        id: `notif-task-${task.id}`,
        type: 'due',
        severity: 'medium',
        title: `Due soon: ${task.taskName}`,
        detail: `${assetName ? `${assetName} · ` : ''}${
          daysUntil === 0
            ? 'Due today'
            : `Due in ${daysUntil} day${daysUntil === 1 ? '' : 's'}`
        }`,
        targetRoute: 'maintenance',
        targetId: task.id,
      });
    }
  }

  for (const asset of assets) {
    const w = getWarrantyInfo(asset.warrantyExpiry, referenceDate);
    if (w.status === 'Expiring' && w.daysRemaining !== null) {
      items.push({
        id: `notif-warranty-${asset.id}`,
        type: 'warranty',
        severity: w.daysRemaining <= 15 ? 'high' : 'medium',
        title: `Warranty expiring: ${asset.name}`,
        detail: `Expires in ${w.daysRemaining} day${w.daysRemaining === 1 ? '' : 's'} (${formatDisplayDate(asset.warrantyExpiry)})`,
        targetRoute: 'warranties',
        targetId: asset.id,
      });
    }
  }

  for (const repair of repairs) {
    if (repair.status === 'In Progress') {
      const assetName = assetById.get(repair.assetId)?.name ?? 'Home System';
      items.push({
        id: `notif-repair-${repair.id}`,
        type: 'repair',
        severity: 'info',
        title: `Repair in progress: ${assetName}`,
        detail: `${repair.issue} · ${repair.technician || 'Unassigned technician'}`,
        targetRoute: 'repairs',
        targetId: repair.id,
      });
    }
  }

  const severityOrder = { high: 0, medium: 1, info: 2 };
  return items.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
}

const CURRENCY_CONFIG: Record<
  CurrencyCode,
  { locale: string; currency: string; symbol: string }
> = {
  USD: { locale: 'en-US', currency: 'USD', symbol: '$' },
  INR: { locale: 'en-IN', currency: 'INR', symbol: '₹' },
  EUR: { locale: 'de-DE', currency: 'EUR', symbol: '€' },
  GBP: { locale: 'en-GB', currency: 'GBP', symbol: '£' },
  CAD: { locale: 'en-CA', currency: 'CAD', symbol: 'CA$' },
  AUD: { locale: 'en-AU', currency: 'AUD', symbol: 'A$' },
};

export function formatCurrency(
  amount: number,
  currencyCode: CurrencyCode = 'USD'
): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  const cfg = CURRENCY_CONFIG[currencyCode] ?? CURRENCY_CONFIG.USD;
  try {
    return new Intl.NumberFormat(cfg.locale, {
      style: 'currency',
      currency: cfg.currency,
      maximumFractionDigits: safe % 1 === 0 ? 0 : 2,
    }).format(safe);
  } catch {
    return `${cfg.symbol}${safe.toFixed(2)}`;
  }
}

export function getCurrencySymbol(currencyCode: CurrencyCode = 'USD'): string {
  return (CURRENCY_CONFIG[currencyCode] ?? CURRENCY_CONFIG.USD).symbol;
}

export function toCSV(headers: string[], rows: (string | number)[][]): string {
  const escapeCell = (val: string | number): string => {
    const str = String(val ?? '');
    if (/[",\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const lines = [
    headers.map(escapeCell).join(','),
    ...rows.map((r) => r.map(escapeCell).join(',')),
  ];
  return lines.join('\n');
}
