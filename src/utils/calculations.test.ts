import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateHomeHealthScore,
  calculateSpendingSummary,
  computeNextRecurrenceDate,
  formatCurrency,
  generateNotifications,
  getTaskStatus,
  getWarrantyInfo,
  toCSV,
} from './calculations';
import type { Asset, ExpenseRecord, MaintenanceTask, RepairRecord } from '../types';

const REF_DATE = new Date(2026, 10, 26); // Nov 26, 2026

test('getWarrantyInfo classifies Active, Expiring, Expired, and None accurately', () => {
  assert.deepEqual(getWarrantyInfo('', REF_DATE), {
    status: 'None',
    daysRemaining: null,
  });

  const expired = getWarrantyInfo('2026-11-20', REF_DATE);
  assert.equal(expired.status, 'Expired');
  assert.equal(expired.daysRemaining, -6);

  const expiringToday = getWarrantyInfo('2026-11-26', REF_DATE);
  assert.equal(expiringToday.status, 'Expiring');
  assert.equal(expiringToday.daysRemaining, 0);

  const expiringSoon = getWarrantyInfo('2027-01-10', REF_DATE);
  assert.equal(expiringSoon.status, 'Expiring');
  assert.equal(expiringSoon.daysRemaining, 45);

  const active = getWarrantyInfo('2027-06-01', REF_DATE);
  assert.equal(active.status, 'Active');
  assert.ok((active.daysRemaining ?? 0) > 60);
});

test('getTaskStatus resolves Completed, Overdue, Due, and Upcoming', () => {
  assert.equal(
    getTaskStatus({ date: '2026-11-01', completed: true }, REF_DATE),
    'Completed'
  );
  assert.equal(
    getTaskStatus({ date: '2026-11-25', completed: false }, REF_DATE),
    'Overdue'
  );
  assert.equal(
    getTaskStatus({ date: '2026-11-26', completed: false }, REF_DATE),
    'Due'
  );
  assert.equal(
    getTaskStatus({ date: '2026-12-03', completed: false }, REF_DATE),
    'Due'
  );
  assert.equal(
    getTaskStatus({ date: '2026-12-10', completed: false }, REF_DATE),
    'Upcoming'
  );
});

test('computeNextRecurrenceDate handles month-end clamping, intervals, and long-overdue tasks', () => {
  assert.equal(computeNextRecurrenceDate('2026-01-31', 'None'), null);
  assert.equal(computeNextRecurrenceDate('2026-01-31', 'Monthly'), '2026-02-28');
  assert.equal(computeNextRecurrenceDate('2026-11-26', 'Quarterly'), '2027-02-26');
  assert.equal(computeNextRecurrenceDate('2026-05-15', 'Bi-Annual'), '2026-11-15');
  assert.equal(computeNextRecurrenceDate('2026-11-26', 'Annual'), '2027-11-26');
  // Completing a 4-month overdue monthly task should advance into the future past REF_DATE
  assert.equal(
    computeNextRecurrenceDate('2026-07-10', 'Monthly', REF_DATE),
    '2026-12-10'
  );
});

test('calculateHomeHealthScore reflects real overdue tasks, warranties, and active repairs', () => {
  const emptyHealth = calculateHomeHealthScore([], [], [], REF_DATE);
  assert.equal(emptyHealth.hasData, false);
  assert.equal(emptyHealth.score, 0);
  assert.equal(emptyHealth.label, 'No Data');

  const assets: Asset[] = [
    {
      id: 'a1',
      name: 'Split AC',
      category: 'Air conditioner',
      brand: 'Daikin',
      model: 'FTKF50',
      serialNumber: 'SN1',
      purchaseDate: '2024-01-10',
      purchasePrice: 900,
      warrantyExpiry: '2026-12-15', // Expiring (-4)
      location: 'Bedroom',
      serviceProvider: 'CoolCare',
      notes: '',
      createdAt: '2024-01-10',
    },
  ];
  const tasks: MaintenanceTask[] = [
    {
      id: 't1',
      taskName: 'Clean Filter',
      assetId: 'a1',
      date: '2026-11-20', // Overdue (-12)
      priority: 'High',
      recurrence: 'Quarterly',
      reminder: '1 day before',
      notes: '',
      completed: false,
      createdAt: '2026-10-01',
    },
    {
      id: 't2',
      taskName: 'Inspect Drainage',
      assetId: 'a1',
      date: '2026-10-01',
      priority: 'Low',
      recurrence: 'None',
      reminder: 'None',
      notes: '',
      completed: true,
      completedDate: '2026-10-01',
      createdAt: '2026-09-01',
    },
  ];
  const repairs: RepairRecord[] = [
    {
      id: 'r1',
      assetId: 'a1',
      issue: 'Capacitor humming',
      date: '2026-11-24',
      cost: 120,
      technician: 'Apex HVAC',
      notes: '',
      status: 'In Progress', // Active (-7)
      createdAt: '2026-11-24',
    },
  ];

  const health = calculateHomeHealthScore(assets, tasks, repairs, REF_DATE);
  // 100 - 12 (overdue) - 4 (expiring) - 7 (active repair) = 77
  assert.equal(health.score, 77);
  assert.equal(health.label, 'Good');
  assert.equal(health.overdueCount, 1);
  assert.equal(health.expiringWarrantiesCount, 1);
  assert.equal(health.activeRepairsCount, 1);
  assert.equal(health.completionRate, 50);
});

test('calculateSpendingSummary computes totals, monthly series, and category percentages', () => {
  const expenses: ExpenseRecord[] = [
    {
      id: 'e1',
      category: 'Repair',
      amount: 300,
      date: '2026-11-12',
      assetId: 'a1',
      description: 'AC service',
      paymentMethod: 'Credit / Debit Card',
      createdAt: '2026-11-12',
    },
    {
      id: 'e2',
      category: 'Maintenance',
      amount: 100,
      date: '2026-10-05',
      assetId: 'a1',
      description: 'Filter pack',
      paymentMethod: 'Cash',
      createdAt: '2026-10-05',
    },
  ];

  const summary = calculateSpendingSummary(expenses, [], REF_DATE, 6);
  assert.equal(summary.totalExpenses, 400);
  assert.equal(summary.currentMonthExpenses, 300);
  assert.equal(summary.monthlySeries.length, 6);
  assert.equal(summary.monthlySeries[5].monthKey, '2026-11');
  assert.equal(summary.monthlySeries[5].total, 300);
  assert.equal(summary.monthlySeries[4].total, 100);
  assert.equal(summary.categoryBreakdown[0].category, 'Repair');
  assert.equal(summary.categoryBreakdown[0].percentage, 75);
});

test('generateNotifications prioritizes high-severity overdue and expiring items', () => {
  const assets: Asset[] = [
    {
      id: 'a1',
      name: 'RO Purifier',
      category: 'Water purifier',
      brand: 'Kent',
      model: 'Grand',
      serialNumber: 'KT-10',
      purchaseDate: '2025-12-01',
      purchasePrice: 280,
      warrantyExpiry: '2026-12-05', // 9 days left -> high severity
      location: 'Kitchen',
      serviceProvider: 'Kent Service',
      notes: '',
      createdAt: '2025-12-01',
    },
  ];
  const tasks: MaintenanceTask[] = [
    {
      id: 't1',
      taskName: 'Replace sediment filter',
      assetId: 'a1',
      date: '2026-11-24', // 2 days overdue
      priority: 'High',
      recurrence: 'Quarterly',
      reminder: '3 days before',
      notes: '',
      completed: false,
      createdAt: '2026-09-01',
    },
  ];
  const notifications = generateNotifications(assets, tasks, [], REF_DATE);
  assert.equal(notifications.length, 2);
  assert.equal(notifications[0].type, 'overdue');
  assert.equal(notifications[1].type, 'warranty');
});

test('formatCurrency and toCSV format cleanly', () => {
  assert.equal(formatCurrency(1250, 'USD'), '$1,250');
  assert.equal(formatCurrency(45.5, 'EUR').includes('45'), true);
  assert.equal(
    toCSV(['Name', 'Notes'], [['AC Unit', 'Contains "quote", comma']]),
    'Name,Notes\nAC Unit,"Contains ""quote"", comma"'
  );
});
