import React, { useEffect, useRef, useState } from 'react';
import { Download, RotateCcw, Trash2, Upload } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { CurrencyCode } from '../../types';
import { toISODate } from '../../utils/calculations';
import { downloadTextFile, validateImportedState } from '../../utils/storage';
import { ConfirmDialog } from '../ui/ConfirmDialog';

const CURRENCIES: { code: CurrencyCode; label: string }[] = [
  { code: 'USD', label: 'USD ($) — US Dollar' },
  { code: 'INR', label: 'INR (₹) — Indian Rupee' },
  { code: 'EUR', label: 'EUR (€) — Euro' },
  { code: 'GBP', label: 'GBP (£) — British Pound' },
  { code: 'CAD', label: 'CAD (CA$) — Canadian Dollar' },
  { code: 'AUD', label: 'AUD (A$) — Australian Dollar' },
];

export function SettingsView() {
  const {
    state,
    updateSettings,
    clearAllData,
    resetDemoData,
    replaceAllState,
    pushToast,
  } = useApp();

  const [homeName, setHomeName] = useState(state.settings.homeName);
  const [currency, setCurrency] = useState<CurrencyCode>(
    state.settings.currency
  );
  const [ownerName, setOwnerName] = useState(state.settings.ownerName);
  const [ownerEmail, setOwnerEmail] = useState(state.settings.ownerEmail);
  const [propertyAddress, setPropertyAddress] = useState(
    state.settings.propertyAddress
  );
  const [emergencyContact, setEmergencyContact] = useState(
    state.settings.emergencyContact
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setHomeName(state.settings.homeName);
    setCurrency(state.settings.currency);
    setOwnerName(state.settings.ownerName);
    setOwnerEmail(state.settings.ownerEmail);
    setPropertyAddress(state.settings.propertyAddress);
    setEmergencyContact(state.settings.emergencyContact);
  }, [state.settings]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    let hasErr = false;
    if (!homeName.trim()) {
      setFormError('Home name cannot be empty.');
      hasErr = true;
    } else {
      setFormError(null);
    }
    const trimmedEmail = ownerEmail.trim();
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setEmailError('Enter a valid email address or leave blank.');
      hasErr = true;
    } else {
      setEmailError(null);
    }
    if (hasErr) return;

    updateSettings({
      homeName: homeName.trim(),
      currency,
      ownerName: ownerName.trim(),
      ownerEmail: trimmedEmail,
      propertyAddress: propertyAddress.trim(),
      emergencyContact: emergencyContact.trim(),
    });
  };

  const handleExportJSON = () => {
    const filename = `smartfix-ai-backup-${toISODate(new Date())}.json`;
    downloadTextFile(
      filename,
      JSON.stringify(state, null, 2),
      'application/json;charset=utf-8'
    );
    pushToast('Full JSON backup exported');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = validateImportedState(String(reader.result ?? ''));
      if (result.error || !result.state) {
        setImportError(result.error ?? 'Unable to import file.');
      } else {
        setImportError(null);
        replaceAllState(result.state);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#0F1D33] tracking-tight">
          Settings & Data
        </h1>
        <p className="text-sm text-[#64748B] mt-1">
          Configure your home profile, currency preferences, and local data
          backups. All data stays private in your browser.
        </p>
      </div>

      {/* Home & Profile Form */}
      <form
        noValidate
        onSubmit={handleSaveProfile}
        className="bg-white border border-[#E6E3DC] rounded-2xl p-5 sm:p-6 space-y-5"
      >
        <div>
          <h2 className="font-display text-base font-bold text-[#0F1D33]">
            Home & Homeowner Profile
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Displayed on your dashboard and printable maintenance reports.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="set-home-name"
              className="block text-xs font-semibold text-[#334155] mb-1.5"
            >
              Home Name *
            </label>
            <input
              id="set-home-name"
              type="text"
              value={homeName}
              onChange={(e) => setHomeName(e.target.value)}
              placeholder="e.g. Maple Creek Residence"
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DCD8CF] text-sm text-[#0F1D33] focus:border-[#0D7A7A] focus:outline-none"
            />
            {formError && (
              <p className="text-xs text-[#B91C1C] mt-1">{formError}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="set-currency"
              className="block text-xs font-semibold text-[#334155] mb-1.5"
            >
              Currency
            </label>
            <select
              id="set-currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DCD8CF] bg-white text-sm text-[#0F1D33] focus:border-[#0D7A7A] focus:outline-none"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="set-owner-name"
              className="block text-xs font-semibold text-[#334155] mb-1.5"
            >
              Homeowner Name
            </label>
            <input
              id="set-owner-name"
              type="text"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder="Your name"
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DCD8CF] text-sm text-[#0F1D33] focus:border-[#0D7A7A] focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="set-owner-email"
              className="block text-xs font-semibold text-[#334155] mb-1.5"
            >
              Email
            </label>
            <input
              id="set-owner-email"
              type="email"
              value={ownerEmail}
              onChange={(e) => {
                setOwnerEmail(e.target.value);
                if (emailError) setEmailError('');
              }}
              placeholder="you@example.com"
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DCD8CF] text-sm text-[#0F1D33] focus:border-[#0D7A7A] focus:outline-none"
            />
            {emailError && (
              <p className="text-xs text-[#B91C1C] mt-1">{emailError}</p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="set-address"
              className="block text-xs font-semibold text-[#334155] mb-1.5"
            >
              Property Address
            </label>
            <input
              id="set-address"
              type="text"
              value={propertyAddress}
              onChange={(e) => setPropertyAddress(e.target.value)}
              placeholder="Street, City, State"
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DCD8CF] text-sm text-[#0F1D33] focus:border-[#0D7A7A] focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="set-emergency"
              className="block text-xs font-semibold text-[#334155] mb-1.5"
            >
              Emergency Service Contact (Plumber / Electrician)
            </label>
            <input
              id="set-emergency"
              type="text"
              value={emergencyContact}
              onChange={(e) => setEmergencyContact(e.target.value)}
              placeholder="e.g. 24/7 Local Electrician · (555) 234-8890"
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DCD8CF] text-sm text-[#0F1D33] focus:border-[#0D7A7A] focus:outline-none"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="min-h-[44px] px-5 py-2 rounded-xl bg-[#0D7A7A] hover:bg-[#0A6363] text-white text-sm font-semibold transition-colors"
          >
            Save Profile Settings
          </button>
        </div>
      </form>

      {/* Data Backup & Portability */}
      <section className="bg-white border border-[#E6E3DC] rounded-2xl p-5 sm:p-6 space-y-4">
        <div>
          <h2 className="font-display text-base font-bold text-[#0F1D33]">
            Data Export & Backup
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5 tabular-nums">
            Currently storing {state.assets.length} assets, {state.tasks.length}{' '}
            tasks, {state.repairs.length} repairs, and {state.expenses.length}{' '}
            expenses in LocalStorage.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleExportJSON}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-[#DCD8CF] bg-white hover:bg-[#F3F1EC] text-sm font-semibold text-[#0F1D33] inline-flex items-center gap-2"
          >
            <Download className="w-4 h-4 text-[#0D7A7A]" />
            Export All Data (JSON)
          </button>

          <label className="min-h-[44px] px-4 py-2 rounded-xl border border-[#DCD8CF] bg-white hover:bg-[#F3F1EC] text-sm font-semibold text-[#0F1D33] inline-flex items-center gap-2 cursor-pointer">
            <Upload className="w-4 h-4 text-[#0D7A7A]" />
            Import Backup (JSON)
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              onChange={handleImportFile}
              className="sr-only"
            />
          </label>
        </div>

        {importError && (
          <p role="alert" className="text-xs text-[#B91C1C]">
            {importError}
          </p>
        )}
      </section>

      {/* Reset & Clear Controls */}
      <section className="bg-white border border-[#E6E3DC] rounded-2xl p-5 sm:p-6 space-y-4">
        <div>
          <h2 className="font-display text-base font-bold text-[#0F1D33]">
            Sample Data & Reset
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Start with a clean slate for your own home or restore the realistic
            demo dataset.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-[#DCD8CF] bg-white hover:bg-[#F3F1EC] text-sm font-semibold text-[#0F1D33] inline-flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4 text-[#0D7A7A]" />
            Reset Demo Data
          </button>

          <button
            type="button"
            onClick={() => setConfirmClear(true)}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-[#FECACA] bg-[#FEF2F2] hover:bg-[#FEE2E2] text-sm font-semibold text-[#B91C1C] inline-flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Clear All Data
          </button>
        </div>
      </section>

      <ConfirmDialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={() => clearAllData()}
        title="Clear All Home Data?"
        message="This will remove all assets, maintenance tasks, repairs, and expenses from this browser. Export a JSON backup first if you want to keep a copy."
        confirmLabel="Clear Everything"
        tone="danger"
      />

      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={() => {
          resetDemoData();
        }}
        title="Restore Demo Data?"
        message="This will replace your current records with SmartFix AI's sample homeowner dataset."
        confirmLabel="Restore Demo Data"
        tone="primary"
      />
    </div>
  );
}
