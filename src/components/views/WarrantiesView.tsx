import React, { useEffect, useMemo, useState } from 'react';
import { ChevronRight, ShieldAlert, ShieldCheck, ShieldOff } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { WarrantyStatus } from '../../types';
import {
  formatDisplayDate,
  getWarrantyInfo,
} from '../../utils/calculations';

export function WarrantiesView() {
  const { state, routeIntent, clearRouteIntent, navigate } = useApp();
  const { assets } = state;

  const [tab, setTab] = useState<'All' | 'Active' | 'Expiring' | 'Expired'>(
    'All'
  );

  useEffect(() => {
    if (!routeIntent) return;
    if (
      routeIntent.filterStatus === 'Active' ||
      routeIntent.filterStatus === 'Expiring' ||
      routeIntent.filterStatus === 'Expired'
    ) {
      setTab(routeIntent.filterStatus);
    }
    clearRouteIntent();
  }, [routeIntent, clearRouteIntent]);

  const enriched = useMemo(() => {
    return assets
      .map((asset) => ({
        asset,
        info: getWarrantyInfo(asset.warrantyExpiry),
      }))
      .sort((a, b) => {
        const ax = a.info.daysRemaining ?? 999999;
        const bx = b.info.daysRemaining ?? 999999;
        return ax - bx;
      });
  }, [assets]);

  const counts = useMemo(() => {
    const res = { Active: 0, Expiring: 0, Expired: 0, None: 0 };
    for (const item of enriched) {
      res[item.info.status] += 1;
    }
    return res;
  }, [enriched]);

  const filtered = useMemo(() => {
    if (tab === 'All') {
      return enriched.filter((i) => i.info.status !== 'None');
    }
    return enriched.filter((i) => i.info.status === tab);
  }, [enriched, tab]);

  const statusTextClass = (status: WarrantyStatus) =>
    status === 'Active'
      ? 'text-[#15803D]'
      : status === 'Expiring'
        ? 'text-[#B45309]'
        : status === 'Expired'
          ? 'text-[#B91C1C]'
          : 'text-[#64748B]';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#0F1D33] tracking-tight">
            Warranty Tracker
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Automatically calculated from each appliance’s recorded expiry date.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('inventory', { openCreate: true })}
          className="min-h-[44px] px-4 py-2 rounded-xl bg-[#0D7A7A] hover:bg-[#0A6363] text-white text-sm font-semibold whitespace-nowrap shrink-0"
        >
          + Add Asset Warranty
        </button>
      </div>

      {/* 3 Status Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          type="button"
          onClick={() => setTab('Active')}
          className={`text-left bg-white border rounded-2xl p-5 transition-colors ${
            tab === 'Active'
              ? 'border-[#15803D] ring-1 ring-[#15803D]/20'
              : 'border-[#E6E3DC] hover:border-[#0D7A7A]/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#64748B]">
              Active Warranties
            </span>
            <ShieldCheck className="w-4 h-4 text-[#15803D]" />
          </div>
          <p className="font-display text-2xl font-bold text-[#0F1D33] tabular-nums mt-2">
            {counts.Active}
          </p>
          <p className="text-xs text-[#64748B] mt-1">More than 60 days left</p>
        </button>

        <button
          type="button"
          onClick={() => setTab('Expiring')}
          className={`text-left bg-white border rounded-2xl p-5 transition-colors ${
            tab === 'Expiring'
              ? 'border-[#B45309] ring-1 ring-[#B45309]/20'
              : 'border-[#E6E3DC] hover:border-[#0D7A7A]/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#64748B]">
              Expiring Soon
            </span>
            <ShieldAlert className="w-4 h-4 text-[#B45309]" />
          </div>
          <p className="font-display text-2xl font-bold text-[#B45309] tabular-nums mt-2">
            {counts.Expiring}
          </p>
          <p className="text-xs text-[#64748B] mt-1">Within next 60 days</p>
        </button>

        <button
          type="button"
          onClick={() => setTab('Expired')}
          className={`text-left bg-white border rounded-2xl p-5 transition-colors ${
            tab === 'Expired'
              ? 'border-[#B91C1C] ring-1 ring-[#B91C1C]/20'
              : 'border-[#E6E3DC] hover:border-[#0D7A7A]/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#64748B]">
              Expired Warranties
            </span>
            <ShieldOff className="w-4 h-4 text-[#B91C1C]" />
          </div>
          <p className="font-display text-2xl font-bold text-[#B91C1C] tabular-nums mt-2">
            {counts.Expired}
          </p>
          <p className="text-xs text-[#64748B] mt-1">Out of manufacturer term</p>
        </button>
      </div>

      {/* Filter Tabs */}
      <div
        role="tablist"
        aria-label="Filter warranties"
        className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#F3F1EC]"
      >
        {(['All', 'Active', 'Expiring', 'Expired'] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
              tab === t
                ? 'bg-white text-[#0F1D33] shadow-xs'
                : 'text-[#64748B] hover:text-[#0F1D33]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Warranty List */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-[#E6E3DC] rounded-2xl p-10 text-center">
          <p className="text-sm font-semibold text-[#0F1D33]">
            No {tab === 'All' ? '' : tab.toLowerCase()} warranties recorded
          </p>
          <p className="text-xs text-[#64748B] mt-1">
            Add warranty expiry dates to appliances in your Inventory to track
            coverage automatically.
          </p>
          <button
            type="button"
            onClick={() => navigate('inventory', { openCreate: true })}
            className="mt-4 min-h-[44px] px-4 py-2 rounded-xl bg-[#0D7A7A] hover:bg-[#0A6363] text-white text-sm font-semibold"
          >
            Add Asset Warranty
          </button>
        </div>
      ) : (
        <div className="bg-white border border-[#E6E3DC] rounded-2xl divide-y divide-[#ECE9E2]">
          {filtered.map(({ asset, info }) => {
            const daysText =
              info.daysRemaining === null
                ? 'No expiry date'
                : info.daysRemaining < 0
                  ? `Expired ${Math.abs(info.daysRemaining)} day${
                      Math.abs(info.daysRemaining) === 1 ? '' : 's'
                    } ago`
                  : info.daysRemaining === 0
                    ? 'Expires today'
                    : `${info.daysRemaining} day${
                        info.daysRemaining === 1 ? '' : 's'
                      } remaining`;

            return (
              <div
                key={asset.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 text-xs">
                    <span className={`font-semibold ${statusTextClass(info.status)}`}>
                      {info.status}
                    </span>
                    <span className="text-[#CBD5E1]" aria-hidden="true">
                      ·
                    </span>
                    <span className="text-[#0F1D33] font-medium tabular-nums">
                      {daysText}
                    </span>
                    <span className="text-[#CBD5E1]" aria-hidden="true">
                      ·
                    </span>
                    <span className="text-[#64748B]">
                      Expires {formatDisplayDate(asset.warrantyExpiry)}
                    </span>
                  </div>

                  <h2 className="font-display text-base font-bold text-[#0F1D33] mt-1">
                    {asset.name}
                  </h2>
                  <p className="text-xs text-[#475569] mt-0.5">
                    {[asset.brand, asset.model, asset.serialNumber && `SN: ${asset.serialNumber}`]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                  {asset.serviceProvider && (
                    <p className="text-xs text-[#64748B] mt-0.5">
                      Service contact: {asset.serviceProvider}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    navigate('inventory', { selectedAssetId: asset.id })
                  }
                  className="min-h-[40px] px-3.5 py-2 rounded-xl border border-[#DCD8CF] hover:border-[#0D7A7A] text-xs font-semibold text-[#0F1D33] hover:text-[#0D7A7A] inline-flex items-center gap-1 whitespace-nowrap shrink-0 self-start sm:self-center"
                >
                  Inspect Asset
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
