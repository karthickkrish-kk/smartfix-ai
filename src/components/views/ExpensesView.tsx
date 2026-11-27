import React, { useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  EXPENSE_CATEGORIES,
  PAYMENT_METHODS,
  type ExpenseCategory,
  type ExpenseRecord,
  type PaymentMethod,
} from '../../types';
import {
  calculateSpendingSummary,
  formatCurrency,
  formatDisplayDate,
  toISODate,
} from '../../utils/calculations';
import { SpendingChart } from '../ui/SpendingChart';
import { Modal } from '../ui/Modal';
import { ConfirmDialog } from '../ui/ConfirmDialog';

interface ExpenseFormState {
  category: ExpenseCategory;
  amount: string;
  date: string;
  assetId: string;
  description: string;
  paymentMethod: PaymentMethod;
}

function emptyExpenseForm(): ExpenseFormState {
  return {
    category: 'Maintenance',
    amount: '',
    date: toISODate(new Date()),
    assetId: '',
    description: '',
    paymentMethod: 'Credit / Debit Card',
  };
}

export function ExpensesView() {
  const {
    state,
    routeIntent,
    clearRouteIntent,
    addExpense,
    updateExpense,
    deleteExpense,
  } = useApp();
  const { expenses, repairs, assets, settings } = state;

  const assetMap = useMemo(
    () => new Map(assets.map((a) => [a.id, a])),
    [assets]
  );

  const summary = useMemo(
    () => calculateSpendingSummary(expenses, repairs),
    [expenses, repairs]
  );

  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<'All' | ExpenseCategory>('All');
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ExpenseFormState>(emptyExpenseForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<ExpenseRecord | null>(null);

  useEffect(() => {
    if (!routeIntent) return;
    if (routeIntent.openCreate) {
      setEditingId(null);
      setForm(emptyExpenseForm());
      setErrors({});
      setFormOpen(true);
    }
    clearRouteIntent();
  }, [routeIntent, clearRouteIntent]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return expenses
      .filter((ex) => {
        if (catFilter !== 'All' && ex.category !== catFilter) return false;
        if (q) {
          const assetName = assetMap.get(ex.assetId)?.name ?? 'General Home';
          const hay =
            `${ex.description} ${ex.category} ${ex.paymentMethod} ${assetName}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [expenses, catFilter, search, assetMap]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyExpenseForm());
    setErrors({});
    setFormOpen(true);
  };

  const openEdit = (ex: ExpenseRecord) => {
    setEditingId(ex.id);
    setForm({
      category: ex.category,
      amount: String(ex.amount),
      date: ex.date,
      assetId: ex.assetId,
      description: ex.description,
      paymentMethod: ex.paymentMethod,
    });
    setErrors({});
    setFormOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    const amt = Number(form.amount);
    if (!form.amount.trim() || Number.isNaN(amt) || amt <= 0) {
      errs.amount = 'Enter a valid amount greater than 0.';
    }
    if (!form.date) errs.date = 'Date is required.';
    if (!form.description.trim()) {
      errs.description = 'Enter a short description of the expense.';
    }
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const payload = {
      category: form.category,
      amount: amt,
      date: form.date,
      assetId: form.assetId,
      description: form.description.trim(),
      paymentMethod: form.paymentMethod,
    };

    if (editingId) {
      updateExpense(editingId, payload);
    } else {
      addExpense(payload);
    }
    setFormOpen(false);
  };

  const avgPerEntry =
    expenses.length > 0 ? summary.totalExpenses / expenses.length : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#0F1D33] tracking-tight">
            Expense Tracker
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Monitor monthly maintenance outlays, repairs, parts, and service
            contracts.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#0D7A7A] hover:bg-[#0A6363] text-white text-sm font-semibold whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Expense
        </button>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#E6E3DC] rounded-2xl p-5">
          <span className="text-xs font-medium text-[#64748B]">
            Total Spending
          </span>
          <p className="font-display text-2xl font-bold text-[#0F1D33] tabular-nums mt-1.5">
            {formatCurrency(summary.totalExpenses, settings.currency)}
          </p>
          <p className="text-xs text-[#64748B] mt-1">
            Across {expenses.length} recorded entr
            {expenses.length === 1 ? 'y' : 'ies'}
          </p>
        </div>

        <div className="bg-white border border-[#E6E3DC] rounded-2xl p-5">
          <span className="text-xs font-medium text-[#64748B]">
            This Month
          </span>
          <p className="font-display text-2xl font-bold text-[#0D7A7A] tabular-nums mt-1.5">
            {formatCurrency(summary.currentMonthExpenses, settings.currency)}
          </p>
          <p className="text-xs text-[#64748B] mt-1">Current calendar month</p>
        </div>

        <div className="bg-white border border-[#E6E3DC] rounded-2xl p-5">
          <span className="text-xs font-medium text-[#64748B]">
            Average Entry
          </span>
          <p className="font-display text-2xl font-bold text-[#0F1D33] tabular-nums mt-1.5">
            {formatCurrency(avgPerEntry, settings.currency)}
          </p>
          <p className="text-xs text-[#64748B] mt-1">Per logged maintenance item</p>
        </div>
      </div>

      {/* Chart + Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 bg-white border border-[#E6E3DC] rounded-2xl p-5 sm:p-6">
          <h2 className="font-display text-base font-bold text-[#0F1D33] mb-3">
            Monthly Expenses (Last 6 Months)
          </h2>
          <SpendingChart
            data={summary.monthlySeries}
            currency={settings.currency}
          />
        </div>

        <div className="lg:col-span-5 bg-white border border-[#E6E3DC] rounded-2xl p-5 sm:p-6">
          <h2 className="font-display text-base font-bold text-[#0F1D33] mb-4">
            Category Breakdown
          </h2>
          {summary.categoryBreakdown.length === 0 ? (
            <p className="text-sm text-[#64748B] py-6">
              Add expenses to see how household maintenance spending distributes
              by category.
            </p>
          ) : (
            <div className="space-y-4">
              {summary.categoryBreakdown.map((item) => (
                <div key={item.category}>
                  <div className="flex items-baseline justify-between gap-2 text-sm">
                    <span className="font-medium text-[#0F1D33] truncate">
                      {item.category}
                    </span>
                    <span className="font-mono text-xs font-semibold text-[#0F1D33] tabular-nums shrink-0">
                      {formatCurrency(item.total, settings.currency)} ·{' '}
                      <span className="text-[#64748B]">{item.percentage}%</span>
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 rounded-full bg-[#ECE9E2] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#0D7A7A]"
                      style={{ width: `${Math.max(4, item.percentage)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Expense History */}
      <div className="bg-white border border-[#E6E3DC] rounded-2xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#ECE9E2] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="font-display text-base font-bold text-[#0F1D33]">
            Expense History
          </h2>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative flex-1 sm:w-60">
              <label htmlFor="exp-search" className="sr-only">
                Search expenses
              </label>
              <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="exp-search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search description, asset..."
                className="w-full min-h-[40px] pl-9 pr-3 py-1.5 rounded-xl border border-[#DCD8CF] bg-[#FAF9F6] text-sm focus:bg-white focus:border-[#0D7A7A] focus:outline-none"
              />
            </div>

            <select
              aria-label="Filter by expense category"
              value={catFilter}
              onChange={(e) =>
                setCatFilter(e.target.value as 'All' | ExpenseCategory)
              }
              className="min-h-[40px] px-3 py-1.5 rounded-xl border border-[#DCD8CF] bg-[#FAF9F6] text-sm focus:bg-white focus:border-[#0D7A7A] focus:outline-none"
            >
              <option value="All">All categories</option>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-semibold text-[#0F1D33]">
              {expenses.length === 0
                ? 'No expenses logged yet'
                : 'No expense records match your filters'}
            </p>
            <p className="text-xs text-[#64748B] mt-1">
              {expenses.length === 0
                ? 'Log your first repair, filter replacement, or maintenance bill.'
                : 'Try adjusting your search or category filter.'}
            </p>
            {expenses.length === 0 && (
              <button
                type="button"
                onClick={openCreate}
                className="mt-4 min-h-[44px] px-4 py-2 rounded-xl bg-[#0D7A7A] text-white text-sm font-semibold hover:bg-[#0A6363]"
              >
                Add First Expense
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-[#ECE9E2]">
            {filtered.map((ex) => {
              const asset = assetMap.get(ex.assetId);
              return (
                <div
                  key={ex.id}
                  className="px-4 sm:px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FAF9F6]/60 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 text-xs text-[#64748B]">
                      <span className="font-semibold text-[#0D7A7A]">
                        {ex.category}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">
                        {formatDisplayDate(ex.date)}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{ex.paymentMethod}</span>
                    </div>
                    <p className="text-sm font-semibold text-[#0F1D33] mt-0.5">
                      {ex.description}
                    </p>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      {asset ? asset.name : 'General Household'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    <span className="font-mono text-sm sm:text-base font-semibold text-[#0F1D33] tabular-nums">
                      {formatCurrency(ex.amount, settings.currency)}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(ex)}
                        aria-label={`Edit expense "${ex.description}"`}
                        className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-[#475569] hover:text-[#0F1D33] hover:bg-[#F3F1EC]"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(ex)}
                        aria-label={`Delete expense "${ex.description}"`}
                        className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-[#475569] hover:text-[#B91C1C] hover:bg-[#FEF2F2]"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Expense Modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingId ? 'Edit Expense' : 'Add Maintenance Expense'}
        subtitle="Track service bills, parts purchases, and annual contracts."
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="min-h-[44px] px-4 py-2 text-sm font-medium text-[#334155] bg-white border border-[#DCD8CF] rounded-xl hover:bg-[#F3F1EC]"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="expense-form"
              className="min-h-[44px] px-5 py-2 text-sm font-semibold text-white bg-[#0D7A7A] hover:bg-[#0A6363] rounded-xl"
            >
              {editingId ? 'Save Changes' : 'Save Expense'}
            </button>
          </>
        }
      >
        <form
          id="expense-form"
          onSubmit={handleSave}
          noValidate
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="exp-category"
                className="block text-xs font-semibold text-[#334155] mb-1.5"
              >
                Category
              </label>
              <select
                id="exp-category"
                value={form.category}
                onChange={(e) =>
                  setForm({
                    ...form,
                    category: e.target.value as ExpenseCategory,
                  })
                }
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DCD8CF] bg-white text-sm text-[#0F1D33] focus:border-[#0D7A7A] focus:outline-none"
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="exp-amount"
                className="block text-xs font-semibold text-[#334155] mb-1.5"
              >
                Amount ({settings.currency}) *
              </label>
              <input
                id="exp-amount"
                type="number"
                min="0.01"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="0.00"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DCD8CF] font-mono text-sm text-[#0F1D33] focus:border-[#0D7A7A] focus:outline-none"
              />
              {errors.amount && (
                <p className="text-xs text-[#B91C1C] mt-1">{errors.amount}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="exp-date"
                className="block text-xs font-semibold text-[#334155] mb-1.5"
              >
                Date *
              </label>
              <input
                id="exp-date"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DCD8CF] text-sm text-[#0F1D33] focus:border-[#0D7A7A] focus:outline-none"
              />
              {errors.date && (
                <p className="text-xs text-[#B91C1C] mt-1">{errors.date}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="exp-payment"
                className="block text-xs font-semibold text-[#334155] mb-1.5"
              >
                Payment Method
              </label>
              <select
                id="exp-payment"
                value={form.paymentMethod}
                onChange={(e) =>
                  setForm({
                    ...form,
                    paymentMethod: e.target.value as PaymentMethod,
                  })
                }
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DCD8CF] bg-white text-sm text-[#0F1D33] focus:border-[#0D7A7A] focus:outline-none"
              >
                {PAYMENT_METHODS.map((pm) => (
                  <option key={pm} value={pm}>
                    {pm}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="exp-asset"
                className="block text-xs font-semibold text-[#334155] mb-1.5"
              >
                Linked Asset
              </label>
              <select
                id="exp-asset"
                value={form.assetId}
                onChange={(e) => setForm({ ...form, assetId: e.target.value })}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DCD8CF] bg-white text-sm text-[#0F1D33] focus:border-[#0D7A7A] focus:outline-none"
              >
                <option value="">General Household</option>
                {assets.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.category})
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="exp-description"
                className="block text-xs font-semibold text-[#334155] mb-1.5"
              >
                Description *
              </label>
              <input
                id="exp-description"
                type="text"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="e.g. Replacement HEPA and carbon water filters"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DCD8CF] text-sm text-[#0F1D33] focus:border-[#0D7A7A] focus:outline-none"
              />
              {errors.description && (
                <p className="text-xs text-[#B91C1C] mt-1">
                  {errors.description}
                </p>
              )}
            </div>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteExpense(deleteTarget.id);
        }}
        title="Delete Expense"
        message={`Delete expense "${deleteTarget?.description}"?`}
        confirmLabel="Delete Expense"
      />
    </div>
  );
}
