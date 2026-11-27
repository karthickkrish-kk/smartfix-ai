import React, { useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { RepairRecord, RepairStatus } from '../../types';
import {
  formatCurrency,
  formatDisplayDate,
  toISODate,
} from '../../utils/calculations';
import { Modal } from '../ui/Modal';
import { ConfirmDialog } from '../ui/ConfirmDialog';

const STATUSES: RepairStatus[] = ['Scheduled', 'In Progress', 'Completed'];

interface RepairFormState {
  assetId: string;
  issue: string;
  date: string;
  cost: string;
  technician: string;
  notes: string;
  status: RepairStatus;
  alsoLogExpense: boolean;
}

function emptyRepairForm(
  prefillAssetId = '',
  prefillTitle = '',
  prefillNotes = ''
): RepairFormState {
  return {
    assetId: prefillAssetId,
    issue: prefillTitle,
    date: toISODate(new Date()),
    cost: '',
    technician: '',
    notes: prefillNotes,
    status: 'Scheduled',
    alsoLogExpense: true,
  };
}

export function RepairsView() {
  const {
    state,
    routeIntent,
    clearRouteIntent,
    addRepair,
    updateRepair,
    deleteRepair,
  } = useApp();
  const { repairs, assets, settings } = state;

  const assetMap = useMemo(
    () => new Map(assets.map((a) => [a.id, a])),
    [assets]
  );

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | RepairStatus>('All');
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<RepairFormState>(() => emptyRepairForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<RepairRecord | null>(null);

  useEffect(() => {
    if (!routeIntent) return;
    if (routeIntent.openCreate) {
      setEditingId(null);
      setForm(
        emptyRepairForm(
          routeIntent.prefillAssetId ?? '',
          routeIntent.prefillTitle ?? '',
          routeIntent.prefillNotes ?? ''
        )
      );
      setErrors({});
      setFormOpen(true);
    }
    clearRouteIntent();
  }, [routeIntent, clearRouteIntent]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return repairs
      .filter((r) => {
        if (statusFilter !== 'All' && r.status !== statusFilter) return false;
        if (q) {
          const assetName = assetMap.get(r.assetId)?.name ?? 'General Home';
          const hay =
            `${assetName} ${r.issue} ${r.technician} ${r.notes}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [repairs, statusFilter, search, assetMap]);

  const totalCost = useMemo(
    () => repairs.reduce((sum, r) => sum + (r.cost || 0), 0),
    [repairs]
  );

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyRepairForm());
    setErrors({});
    setFormOpen(true);
  };

  const openEdit = (rep: RepairRecord) => {
    setEditingId(rep.id);
    setForm({
      assetId: rep.assetId,
      issue: rep.issue,
      date: rep.date,
      cost: String(rep.cost || ''),
      technician: rep.technician,
      notes: rep.notes,
      status: rep.status,
      alsoLogExpense: false,
    });
    setErrors({});
    setFormOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.issue.trim()) errs.issue = 'Please describe the repair issue.';
    if (!form.date) errs.date = 'Repair date is required.';
    const parsedCost = form.cost.trim() === '' ? 0 : Number(form.cost);
    if (Number.isNaN(parsedCost) || parsedCost < 0) {
      errs.cost = 'Enter a valid non-negative cost.';
    }
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const payload = {
      assetId: form.assetId,
      issue: form.issue.trim(),
      date: form.date,
      cost: parsedCost,
      technician: form.technician.trim(),
      notes: form.notes.trim(),
      status: form.status,
    };

    if (editingId) {
      updateRepair(editingId, payload);
    } else {
      addRepair(payload, form.alsoLogExpense);
    }
    setFormOpen(false);
  };

  const statusColor = (status: RepairStatus) =>
    status === 'Completed'
      ? 'text-[#15803D]'
      : status === 'In Progress'
        ? 'text-[#B45309]'
        : 'text-[#0D7A7A]';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#0F1D33] tracking-tight">
            Repair History
          </h1>
          <p className="text-sm text-[#64748B] mt-1 tabular-nums">
            {repairs.length} repair record{repairs.length === 1 ? '' : 's'} ·
            Total repair cost{' '}
            <span className="font-mono font-medium text-[#0F1D33]">
              {formatCurrency(totalCost, settings.currency)}
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#0D7A7A] hover:bg-[#0A6363] text-white text-sm font-semibold whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          Log Repair
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-[#E6E3DC] rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <label htmlFor="repair-search" className="sr-only">
            Search repairs
          </label>
          <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="repair-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search appliance, issue, technician..."
            className="w-full min-h-[42px] pl-10 pr-3.5 py-2 rounded-xl border border-[#DCD8CF] bg-[#FAF9F6] text-sm text-[#0F1D33] focus:bg-white focus:border-[#0D7A7A] focus:outline-none"
          />
        </div>

        <div
          role="tablist"
          aria-label="Filter repairs by status"
          className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#F3F1EC] overflow-x-auto"
        >
          {(['All', ...STATUSES] as const).map((st) => (
            <button
              key={st}
              type="button"
              role="tab"
              aria-selected={statusFilter === st}
              onClick={() => setStatusFilter(st)}
              className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-white text-[#0F1D33] shadow-xs'
                  : 'text-[#64748B] hover:text-[#0F1D33]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Repair List */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-[#E6E3DC] rounded-2xl p-10 text-center">
          <h2 className="font-display text-base font-bold text-[#0F1D33]">
            {repairs.length === 0
              ? 'No repair records yet'
              : 'No repairs match your search'}
          </h2>
          <p className="text-sm text-[#64748B] mt-1">
            Keep a permanent service log of issues, parts replaced, costs, and
            technicians.
          </p>
          {repairs.length === 0 && (
            <button
              type="button"
              onClick={openCreate}
              className="mt-4 min-h-[44px] px-4 py-2 rounded-xl bg-[#0D7A7A] text-white text-sm font-semibold hover:bg-[#0A6363]"
            >
              Log First Repair
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-[#E6E3DC] rounded-2xl divide-y divide-[#ECE9E2]">
          {filtered.map((rep) => {
            const asset = assetMap.get(rep.assetId);
            return (
              <div
                key={rep.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                    <span className={`font-semibold ${statusColor(rep.status)}`}>
                      {rep.status}
                    </span>
                    <span className="text-[#CBD5E1]" aria-hidden="true">
                      ·
                    </span>
                    <span className="text-[#0F1D33] font-medium tabular-nums">
                      {formatDisplayDate(rep.date)}
                    </span>
                    <span className="text-[#CBD5E1]" aria-hidden="true">
                      ·
                    </span>
                    <span className="text-[#64748B]">
                      {asset ? asset.name : 'General Home System'}
                    </span>
                  </div>

                  <h2 className="font-display text-base font-bold text-[#0F1D33] mt-1">
                    {rep.issue}
                  </h2>

                  {rep.technician && (
                    <p className="text-xs text-[#475569] mt-1">
                      Technician: {rep.technician}
                    </p>
                  )}
                  {rep.notes && (
                    <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed">
                      {rep.notes}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  <span className="font-mono text-base font-semibold text-[#0F1D33] tabular-nums">
                    {formatCurrency(rep.cost, settings.currency)}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(rep)}
                      aria-label={`Edit repair "${rep.issue}"`}
                      className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-[#475569] hover:text-[#0F1D33] hover:bg-[#F3F1EC]"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(rep)}
                      aria-label={`Delete repair "${rep.issue}"`}
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

      {/* Add/Edit Modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingId ? 'Edit Repair Record' : 'Log Appliance Repair'}
        subtitle="Document service issues, technician details, and repair costs."
        size="lg"
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
              form="repair-form"
              className="min-h-[44px] px-5 py-2 text-sm font-semibold text-white bg-[#0D7A7A] hover:bg-[#0A6363] rounded-xl"
            >
              {editingId ? 'Save Changes' : 'Save Repair'}
            </button>
          </>
        }
      >
        <form
          id="repair-form"
          onSubmit={handleSave}
          noValidate
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="repair-asset"
                className="block text-xs font-semibold text-[#334155] mb-1.5"
              >
                Appliance
              </label>
              <select
                id="repair-asset"
                value={form.assetId}
                onChange={(e) => setForm({ ...form, assetId: e.target.value })}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DCD8CF] bg-white text-sm text-[#0F1D33] focus:border-[#0D7A7A] focus:outline-none"
              >
                <option value="">General Home System</option>
                {assets.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.category})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="repair-status"
                className="block text-xs font-semibold text-[#334155] mb-1.5"
              >
                Status
              </label>
              <select
                id="repair-status"
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as RepairStatus })
                }
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DCD8CF] bg-white text-sm text-[#0F1D33] focus:border-[#0D7A7A] focus:outline-none"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="repair-issue"
                className="block text-xs font-semibold text-[#334155] mb-1.5"
              >
                Repair Issue *
              </label>
              <input
                id="repair-issue"
                type="text"
                value={form.issue}
                onChange={(e) => setForm({ ...form, issue: e.target.value })}
                placeholder="e.g. Replaced dual-run compressor capacitor"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DCD8CF] text-sm text-[#0F1D33] focus:border-[#0D7A7A] focus:outline-none"
              />
              {errors.issue && (
                <p className="text-xs text-[#B91C1C] mt-1">{errors.issue}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="repair-date"
                className="block text-xs font-semibold text-[#334155] mb-1.5"
              >
                Repair Date *
              </label>
              <input
                id="repair-date"
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
                htmlFor="repair-cost"
                className="block text-xs font-semibold text-[#334155] mb-1.5"
              >
                Repair Cost ({settings.currency})
              </label>
              <input
                id="repair-cost"
                type="number"
                min="0"
                step="0.01"
                value={form.cost}
                onChange={(e) => setForm({ ...form, cost: e.target.value })}
                placeholder="0.00"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DCD8CF] font-mono text-sm text-[#0F1D33] focus:border-[#0D7A7A] focus:outline-none"
              />
              {errors.cost && (
                <p className="text-xs text-[#B91C1C] mt-1">{errors.cost}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="repair-technician"
                className="block text-xs font-semibold text-[#334155] mb-1.5"
              >
                Technician / Service Company
              </label>
              <input
                id="repair-technician"
                type="text"
                value={form.technician}
                onChange={(e) =>
                  setForm({ ...form, technician: e.target.value })
                }
                placeholder="e.g. CoolAir Certified HVAC (Alex T.)"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DCD8CF] text-sm text-[#0F1D33] focus:border-[#0D7A7A] focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="repair-notes"
                className="block text-xs font-semibold text-[#334155] mb-1.5"
              >
                Notes & Parts Replaced
              </label>
              <textarea
                id="repair-notes"
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Invoice reference, warranty on parts, follow-up observations..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCD8CF] text-sm text-[#0F1D33] focus:border-[#0D7A7A] focus:outline-none"
              />
            </div>

            {!editingId && (
              <div className="sm:col-span-2">
                <label className="inline-flex items-center gap-2.5 text-sm text-[#0F1D33] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.alsoLogExpense}
                    onChange={(e) =>
                      setForm({ ...form, alsoLogExpense: e.target.checked })
                    }
                    className="w-4 h-4 accent-[#0D7A7A]"
                  />
                  Automatically record this repair cost in Expense Tracker
                </label>
              </div>
            )}
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteRepair(deleteTarget.id);
        }}
        title="Delete Repair Record"
        message={`Delete repair "${deleteTarget?.issue}"?`}
        confirmLabel="Delete Repair"
      />
    </div>
  );
}
