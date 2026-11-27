import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarClock,
  ChevronRight,
  Pencil,
  Plus,
  Search,
  Trash2,
  Wrench,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  ASSET_CATEGORIES,
  type Asset,
  type AssetCategory,
  type WarrantyStatus,
} from '../../types';
import {
  formatCurrency,
  formatDisplayDate,
  getTaskStatus,
  getWarrantyInfo,
  toISODate,
} from '../../utils/calculations';
import { Modal } from '../ui/Modal';
import { ConfirmDialog } from '../ui/ConfirmDialog';

type SortKey = 'name' | 'purchaseDate' | 'purchasePrice' | 'warrantyExpiry';

interface AssetFormState {
  name: string;
  category: AssetCategory;
  brand: string;
  model: string;
  serialNumber: string;
  purchaseDate: string;
  purchasePrice: string;
  warrantyExpiry: string;
  location: string;
  serviceProvider: string;
  notes: string;
}

function emptyForm(): AssetFormState {
  return {
    name: '',
    category: 'Air conditioner',
    brand: '',
    model: '',
    serialNumber: '',
    purchaseDate: toISODate(new Date()),
    purchasePrice: '',
    warrantyExpiry: '',
    location: '',
    serviceProvider: '',
    notes: '',
  };
}

function assetToForm(asset: Asset): AssetFormState {
  return {
    name: asset.name,
    category: asset.category,
    brand: asset.brand,
    model: asset.model,
    serialNumber: asset.serialNumber,
    purchaseDate: asset.purchaseDate,
    purchasePrice: String(asset.purchasePrice || ''),
    warrantyExpiry: asset.warrantyExpiry,
    location: asset.location,
    serviceProvider: asset.serviceProvider,
    notes: asset.notes,
  };
}

export function InventoryView() {
  const {
    state,
    routeIntent,
    clearRouteIntent,
    navigate,
    addAsset,
    updateAsset,
    deleteAsset,
  } = useApp();
  const { assets, tasks, repairs, expenses, settings } = state;

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [warrantyFilter, setWarrantyFilter] = useState<'All' | WarrantyStatus>(
    'All'
  );
  const [sortBy, setSortBy] = useState<SortKey>('name');

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AssetFormState>(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [detailAssetId, setDetailAssetId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Asset | null>(null);

  useEffect(() => {
    if (!routeIntent) return;
    if (routeIntent.openCreate) {
      setEditingId(null);
      setForm(emptyForm());
      setFormErrors({});
      setFormOpen(true);
    }
    if (routeIntent.selectedAssetId) {
      setDetailAssetId(routeIntent.selectedAssetId);
    }
    clearRouteIntent();
  }, [routeIntent, clearRouteIntent]);

  const filteredAssets = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = assets.filter((asset) => {
      if (categoryFilter !== 'All' && asset.category !== categoryFilter) {
        return false;
      }
      if (warrantyFilter !== 'All') {
        const w = getWarrantyInfo(asset.warrantyExpiry).status;
        if (w !== warrantyFilter) return false;
      }
      if (q) {
        const haystack = [
          asset.name,
          asset.brand,
          asset.model,
          asset.category,
          asset.location,
          asset.serialNumber,
          asset.serviceProvider,
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    list.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'purchasePrice') return b.purchasePrice - a.purchasePrice;
      if (sortBy === 'purchaseDate')
        return (b.purchaseDate || '').localeCompare(a.purchaseDate || '');
      if (sortBy === 'warrantyExpiry') {
        const ax = a.warrantyExpiry || '9999-12-31';
        const bx = b.warrantyExpiry || '9999-12-31';
        return ax.localeCompare(bx);
      }
      return 0;
    });

    return list;
  }, [assets, search, categoryFilter, warrantyFilter, sortBy]);

  const totalInventoryValue = useMemo(
    () => assets.reduce((sum, a) => sum + (a.purchasePrice || 0), 0),
    [assets]
  );

  const detailAsset = useMemo(
    () => assets.find((a) => a.id === detailAssetId) ?? null,
    [assets, detailAssetId]
  );

  const openCreateModal = () => {
    setEditingId(null);
    setForm(emptyForm());
    setFormErrors({});
    setFormOpen(true);
  };

  const openEditModal = (asset: Asset) => {
    setEditingId(asset.id);
    setForm(assetToForm(asset));
    setFormErrors({});
    setFormOpen(true);
  };

  const validateAndSave = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = 'Appliance or asset name is required.';
    if (!form.category) errors.category = 'Please choose a category.';
    const parsedPrice =
      form.purchasePrice.trim() === '' ? 0 : Number(form.purchasePrice);
    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      errors.purchasePrice = 'Enter a valid non-negative purchase price.';
    }
    if (
      form.purchaseDate &&
      form.warrantyExpiry &&
      form.warrantyExpiry < form.purchaseDate
    ) {
      errors.warrantyExpiry =
        'Warranty expiry cannot be earlier than purchase date.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const payload = {
      name: form.name.trim(),
      category: form.category,
      brand: form.brand.trim(),
      model: form.model.trim(),
      serialNumber: form.serialNumber.trim(),
      purchaseDate: form.purchaseDate,
      purchasePrice: parsedPrice,
      warrantyExpiry: form.warrantyExpiry,
      location: form.location.trim(),
      serviceProvider: form.serviceProvider.trim(),
      notes: form.notes.trim(),
    };

    if (editingId) {
      updateAsset(editingId, payload);
    } else {
      addAsset(payload);
    }
    setFormOpen(false);
  };

  const detailTasks = useMemo(
    () =>
      detailAsset ? tasks.filter((t) => t.assetId === detailAsset.id) : [],
    [detailAsset, tasks]
  );
  const detailRepairs = useMemo(
    () =>
      detailAsset ? repairs.filter((r) => r.assetId === detailAsset.id) : [],
    [detailAsset, repairs]
  );
  const detailExpensesTotal = useMemo(
    () =>
      detailAsset
        ? expenses
            .filter((ex) => ex.assetId === detailAsset.id)
            .reduce((sum, ex) => sum + ex.amount, 0)
        : 0,
    [detailAsset, expenses]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#0F1D33] tracking-tight">
            Home Inventory
          </h1>
          <p className="text-sm text-[#64748B] mt-1 tabular-nums">
            {assets.length} registered asset{assets.length === 1 ? '' : 's'} ·
            Total recorded value{' '}
            <span className="font-mono font-medium text-[#0F1D33]">
              {formatCurrency(totalInventoryValue, settings.currency)}
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#0D7A7A] hover:bg-[#0A6363] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Asset
        </button>
      </div>

      {/* Search, Filters & Sort Bar */}
      <div className="bg-white border border-[#E6E3DC] rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5 relative">
            <label htmlFor="inventory-search" className="sr-only">
              Search assets
            </label>
            <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="inventory-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, brand, model, room, serial..."
              className="w-full min-h-[44px] pl-10 pr-3.5 py-2 rounded-xl border border-[#DCD8CF] bg-[#FAF9F6] text-sm text-[#0F1D33] placeholder:text-[#94A3B8] focus:bg-white focus:border-[#0D7A7A] focus:outline-none"
            />
          </div>

          <div className="md:col-span-3">
            <label htmlFor="inventory-category" className="sr-only">
              Filter by category
            </label>
            <select
              id="inventory-category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DCD8CF] bg-[#FAF9F6] text-sm text-[#0F1D33] focus:bg-white focus:border-[#0D7A7A] focus:outline-none"
            >
              <option value="All">All categories</option>
              {ASSET_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="inventory-warranty" className="sr-only">
              Filter by warranty status
            </label>
            <select
              id="inventory-warranty"
              value={warrantyFilter}
              onChange={(e) =>
                setWarrantyFilter(e.target.value as 'All' | WarrantyStatus)
              }
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DCD8CF] bg-[#FAF9F6] text-sm text-[#0F1D33] focus:bg-white focus:border-[#0D7A7A] focus:outline-none"
            >
              <option value="All">All warranties</option>
              <option value="Active">Active</option>
              <option value="Expiring">Expiring soon</option>
              <option value="Expired">Expired</option>
              <option value="None">No warranty</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="inventory-sort" className="sr-only">
              Sort assets
            </label>
            <select
              id="inventory-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DCD8CF] bg-[#FAF9F6] text-sm text-[#0F1D33] focus:bg-white focus:border-[#0D7A7A] focus:outline-none"
            >
              <option value="name">Sort: Name</option>
              <option value="purchaseDate">Sort: Newest</option>
              <option value="purchasePrice">Sort: Highest Price</option>
              <option value="warrantyExpiry">Sort: Warranty Expiry</option>
            </select>
          </div>
        </div>
      </div>

      {/* Asset List / Grid */}
      {assets.length === 0 ? (
        <div className="bg-white border border-[#E6E3DC] rounded-2xl p-10 text-center">
          <h2 className="font-display text-lg font-bold text-[#0F1D33]">
            No appliances registered yet
          </h2>
          <p className="text-sm text-[#64748B] max-w-md mx-auto mt-1.5">
            Track purchase dates, serial numbers, warranty expirations, and
            service providers for every appliance in your home.
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="mt-5 min-h-[44px] px-5 py-2.5 rounded-xl bg-[#0D7A7A] hover:bg-[#0A6363] text-white text-sm font-semibold"
          >
            Add Your First Asset
          </button>
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="bg-white border border-[#E6E3DC] rounded-2xl p-10 text-center">
          <p className="text-sm font-semibold text-[#0F1D33]">
            No assets match your current filters
          </p>
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setCategoryFilter('All');
              setWarrantyFilter('All');
            }}
            className="mt-3 text-sm font-semibold text-[#0D7A7A] hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredAssets.map((asset) => {
            const warranty = getWarrantyInfo(asset.warrantyExpiry);
            const warrantyColor =
              warranty.status === 'Active'
                ? 'text-[#15803D]'
                : warranty.status === 'Expiring'
                  ? 'text-[#B45309]'
                  : warranty.status === 'Expired'
                    ? 'text-[#B91C1C]'
                    : 'text-[#64748B]';

            return (
              <article
                key={asset.id}
                className="bg-white border border-[#E6E3DC] rounded-2xl p-5 flex flex-col justify-between hover:border-[#0D7A7A]/45 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs text-[#64748B]">
                        {asset.category}
                        {asset.location ? ` · ${asset.location}` : ''}
                      </p>
                      <h2 className="font-display text-base font-bold text-[#0F1D33] mt-1 leading-snug">
                        <button
                          type="button"
                          onClick={() => setDetailAssetId(asset.id)}
                          className="text-left hover:text-[#0D7A7A] transition-colors"
                        >
                          {asset.name}
                        </button>
                      </h2>
                      <p className="text-xs text-[#475569] mt-0.5 truncate">
                        {[asset.brand, asset.model].filter(Boolean).join(' · ') ||
                          'Model not specified'}
                      </p>
                    </div>
                    <span className="font-mono text-sm font-semibold text-[#0F1D33] tabular-nums shrink-0">
                      {formatCurrency(asset.purchasePrice, settings.currency)}
                    </span>
                  </div>

                  <dl className="mt-4 pt-3.5 border-t border-[#ECE9E2] grid grid-cols-2 gap-y-2.5 gap-x-3 text-xs">
                    <div>
                      <dt className="text-[#64748B]">Warranty</dt>
                      <dd className={`font-semibold mt-0.5 ${warrantyColor}`}>
                        {warranty.status === 'None'
                          ? 'Not recorded'
                          : warranty.status === 'Expired'
                            ? 'Expired'
                            : warranty.status === 'Expiring'
                              ? `Expiring (${warranty.daysRemaining}d)`
                              : 'Active'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[#64748B]">Purchased</dt>
                      <dd className="text-[#0F1D33] font-medium tabular-nums mt-0.5">
                        {formatDisplayDate(asset.purchaseDate)}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="mt-4 pt-3 border-t border-[#ECE9E2] flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setDetailAssetId(asset.id)}
                    className="min-h-[40px] inline-flex items-center gap-1 text-xs font-semibold text-[#0D7A7A] hover:text-[#0A6363]"
                  >
                    View Details
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(asset)}
                      aria-label={`Edit ${asset.name}`}
                      className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-[#475569] hover:text-[#0F1D33] hover:bg-[#F3F1EC] transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(asset)}
                      aria-label={`Delete ${asset.name}`}
                      className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-[#475569] hover:text-[#B91C1C] hover:bg-[#FEF2F2] transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Add / Edit Asset Modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingId ? 'Edit Asset' : 'Add Home Asset'}
        subtitle="Record appliance details, purchase history, and warranty coverage."
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
              form="asset-form"
              className="min-h-[44px] px-5 py-2 text-sm font-semibold text-white bg-[#0D7A7A] hover:bg-[#0A6363] rounded-xl"
            >
              {editingId ? 'Save Changes' : 'Add Asset'}
            </button>
          </>
        }
      >
        <form
          id="asset-form"
          onSubmit={validateAndSave}
          noValidate
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label
                htmlFor="asset-name"
                className="block text-xs font-semibold text-[#334155] mb-1.5"
              >
                Asset Name *
              </label>
              <input
                id="asset-name"
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Living Room Split AC"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DCD8CF] text-sm text-[#0F1D33] focus:border-[#0D7A7A] focus:outline-none"
              />
              {formErrors.name && (
                <p className="text-xs text-[#B91C1C] mt-1">{formErrors.name}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="asset-category"
                className="block text-xs font-semibold text-[#334155] mb-1.5"
              >
                Category *
              </label>
              <select
                id="asset-category"
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value as AssetCategory })
                }
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DCD8CF] text-sm text-[#0F1D33] bg-white focus:border-[#0D7A7A] focus:outline-none"
              >
                {ASSET_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="asset-location"
                className="block text-xs font-semibold text-[#334155] mb-1.5"
              >
                Location / Room
              </label>
              <input
                id="asset-location"
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="e.g. Main Kitchen"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DCD8CF] text-sm text-[#0F1D33] focus:border-[#0D7A7A] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="asset-brand"
                className="block text-xs font-semibold text-[#334155] mb-1.5"
              >
                Brand
              </label>
              <input
                id="asset-brand"
                type="text"
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                placeholder="e.g. Daikin, LG, Bosch"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DCD8CF] text-sm text-[#0F1D33] focus:border-[#0D7A7A] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="asset-model"
                className="block text-xs font-semibold text-[#334155] mb-1.5"
              >
                Model Number
              </label>
              <input
                id="asset-model"
                type="text"
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                placeholder="e.g. FTKF50U"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DCD8CF] text-sm text-[#0F1D33] focus:border-[#0D7A7A] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="asset-serial"
                className="block text-xs font-semibold text-[#334155] mb-1.5"
              >
                Serial Number
              </label>
              <input
                id="asset-serial"
                type="text"
                value={form.serialNumber}
                onChange={(e) =>
                  setForm({ ...form, serialNumber: e.target.value })
                }
                placeholder="e.g. SN-8841209"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DCD8CF] font-mono text-sm text-[#0F1D33] focus:border-[#0D7A7A] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="asset-price"
                className="block text-xs font-semibold text-[#334155] mb-1.5"
              >
                Purchase Price ({settings.currency})
              </label>
              <input
                id="asset-price"
                type="number"
                min="0"
                step="0.01"
                value={form.purchasePrice}
                onChange={(e) =>
                  setForm({ ...form, purchasePrice: e.target.value })
                }
                placeholder="0.00"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DCD8CF] font-mono text-sm text-[#0F1D33] focus:border-[#0D7A7A] focus:outline-none"
              />
              {formErrors.purchasePrice && (
                <p className="text-xs text-[#B91C1C] mt-1">
                  {formErrors.purchasePrice}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="asset-purchase-date"
                className="block text-xs font-semibold text-[#334155] mb-1.5"
              >
                Purchase Date
              </label>
              <input
                id="asset-purchase-date"
                type="date"
                value={form.purchaseDate}
                onChange={(e) =>
                  setForm({ ...form, purchaseDate: e.target.value })
                }
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DCD8CF] text-sm text-[#0F1D33] focus:border-[#0D7A7A] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="asset-warranty-expiry"
                className="block text-xs font-semibold text-[#334155] mb-1.5"
              >
                Warranty Expiry Date
              </label>
              <input
                id="asset-warranty-expiry"
                type="date"
                value={form.warrantyExpiry}
                onChange={(e) =>
                  setForm({ ...form, warrantyExpiry: e.target.value })
                }
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DCD8CF] text-sm text-[#0F1D33] focus:border-[#0D7A7A] focus:outline-none"
              />
              {formErrors.warrantyExpiry && (
                <p className="text-xs text-[#B91C1C] mt-1">
                  {formErrors.warrantyExpiry}
                </p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="asset-provider"
                className="block text-xs font-semibold text-[#334155] mb-1.5"
              >
                Service Provider / Technician Contact
              </label>
              <input
                id="asset-provider"
                type="text"
                value={form.serviceProvider}
                onChange={(e) =>
                  setForm({ ...form, serviceProvider: e.target.value })
                }
                placeholder="e.g. Authorized Service Center · (555) 010-9921"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DCD8CF] text-sm text-[#0F1D33] focus:border-[#0D7A7A] focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="asset-notes"
                className="block text-xs font-semibold text-[#334155] mb-1.5"
              >
                Notes
              </label>
              <textarea
                id="asset-notes"
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Filter sizes, warranty registration IDs, care instructions..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCD8CF] text-sm text-[#0F1D33] focus:border-[#0D7A7A] focus:outline-none"
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Asset Details Modal */}
      <Modal
        open={Boolean(detailAsset)}
        onClose={() => setDetailAssetId(null)}
        title={detailAsset?.name ?? 'Asset Details'}
        subtitle={
          detailAsset
            ? `${detailAsset.category}${detailAsset.location ? ` · ${detailAsset.location}` : ''}`
            : undefined
        }
        size="lg"
        footer={
          detailAsset && (
            <div className="w-full flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const id = detailAsset.id;
                    setDetailAssetId(null);
                    navigate('maintenance', {
                      openCreate: true,
                      prefillAssetId: id,
                    });
                  }}
                  className="min-h-[40px] px-3 py-1.5 rounded-xl border border-[#DCD8CF] bg-white hover:bg-[#F3F1EC] text-xs font-semibold text-[#0F1D33] inline-flex items-center gap-1.5"
                >
                  <CalendarClock className="w-3.5 h-3.5 text-[#0D7A7A]" />
                  Schedule Maintenance
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const id = detailAsset.id;
                    setDetailAssetId(null);
                    navigate('repairs', {
                      openCreate: true,
                      prefillAssetId: id,
                    });
                  }}
                  className="min-h-[40px] px-3 py-1.5 rounded-xl border border-[#DCD8CF] bg-white hover:bg-[#F3F1EC] text-xs font-semibold text-[#0F1D33] inline-flex items-center gap-1.5"
                >
                  <Wrench className="w-3.5 h-3.5 text-[#0D7A7A]" />
                  Log Repair
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  const asset = detailAsset;
                  setDetailAssetId(null);
                  openEditModal(asset);
                }}
                className="min-h-[40px] px-4 py-1.5 rounded-xl bg-[#0D7A7A] hover:bg-[#0A6363] text-white text-xs font-semibold"
              >
                Edit Asset
              </button>
            </div>
          )
        }
      >
        {detailAsset && (() => {
          const w = getWarrantyInfo(detailAsset.warrantyExpiry);
          return (
            <div className="space-y-6">
              <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <dt className="text-xs text-[#64748B]">Brand</dt>
                  <dd className="font-medium text-[#0F1D33] mt-0.5">
                    {detailAsset.brand || '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[#64748B]">Model</dt>
                  <dd className="font-medium text-[#0F1D33] mt-0.5">
                    {detailAsset.model || '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[#64748B]">Serial Number</dt>
                  <dd className="font-mono text-xs font-medium text-[#0F1D33] mt-1">
                    {detailAsset.serialNumber || '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[#64748B]">Purchase Date</dt>
                  <dd className="font-medium text-[#0F1D33] tabular-nums mt-0.5">
                    {formatDisplayDate(detailAsset.purchaseDate)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[#64748B]">Purchase Price</dt>
                  <dd className="font-mono font-semibold text-[#0F1D33] tabular-nums mt-0.5">
                    {formatCurrency(detailAsset.purchasePrice, settings.currency)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[#64748B]">Warranty Status</dt>
                  <dd
                    className={`font-semibold mt-0.5 ${
                      w.status === 'Active'
                        ? 'text-[#15803D]'
                        : w.status === 'Expiring'
                          ? 'text-[#B45309]'
                          : w.status === 'Expired'
                            ? 'text-[#B91C1C]'
                            : 'text-[#64748B]'
                    }`}
                  >
                    {w.status === 'None'
                      ? 'Not recorded'
                      : `${w.status} · ${formatDisplayDate(detailAsset.warrantyExpiry)}`}
                  </dd>
                </div>
                <div className="col-span-2 sm:col-span-3">
                  <dt className="text-xs text-[#64748B]">Service Provider</dt>
                  <dd className="font-medium text-[#0F1D33] mt-0.5">
                    {detailAsset.serviceProvider || '—'}
                  </dd>
                </div>
                {detailAsset.notes && (
                  <div className="col-span-2 sm:col-span-3">
                    <dt className="text-xs text-[#64748B]">Notes</dt>
                    <dd className="text-sm text-[#334155] leading-relaxed mt-0.5">
                      {detailAsset.notes}
                    </dd>
                  </div>
                )}
              </dl>

              <div className="pt-4 border-t border-[#ECE9E2] grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-xs font-semibold text-[#64748B] mb-2">
                    Linked Maintenance ({detailTasks.length})
                  </h3>
                  {detailTasks.length === 0 ? (
                    <p className="text-xs text-[#94A3B8]">
                      No maintenance scheduled yet.
                    </p>
                  ) : (
                    <ul className="space-y-2 text-xs">
                      {detailTasks.slice(0, 4).map((t) => (
                        <li
                          key={t.id}
                          className="flex items-center justify-between gap-2"
                        >
                          <span className="text-[#0F1D33] font-medium truncate">
                            {t.taskName}
                          </span>
                          <span className="text-[#64748B] shrink-0">
                            {getTaskStatus(t)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-[#64748B] mb-2">
                    Repairs & Logged Expenses
                  </h3>
                  <p className="text-xs text-[#475569] tabular-nums">
                    {detailRepairs.length} repair
                    {detailRepairs.length === 1 ? '' : 's'} ·{' '}
                    <span className="font-mono font-semibold text-[#0F1D33]">
                      {formatCurrency(detailExpensesTotal, settings.currency)}
                    </span>{' '}
                    tracked expenses
                  </p>
                </div>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            deleteAsset(deleteTarget.id);
            if (detailAssetId === deleteTarget.id) setDetailAssetId(null);
          }
        }}
        title="Delete Asset"
        message={`Delete "${deleteTarget?.name}" from your inventory? Linked maintenance, repairs, and expenses will be kept as general home records.`}
        confirmLabel="Delete Asset"
      />
    </div>
  );
}
