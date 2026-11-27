import type { AppState } from '../types';
import { createSeedState } from '../data/seedData';

export const STORAGE_KEY = 'smartfix_ai_state_v1';

export function loadAppState(): AppState {
  if (typeof window === 'undefined') {
    return createSeedState();
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = createSeedState();
      saveAppState(initial);
      return initial;
    }
    const parsed = JSON.parse(raw) as Partial<AppState>;
    if (
      !parsed ||
      !Array.isArray(parsed.assets) ||
      !Array.isArray(parsed.tasks) ||
      !Array.isArray(parsed.repairs) ||
      !Array.isArray(parsed.expenses) ||
      !parsed.settings
    ) {
      const fallback = createSeedState();
      saveAppState(fallback);
      return fallback;
    }
    return {
      assets: parsed.assets,
      tasks: parsed.tasks,
      repairs: parsed.repairs,
      expenses: parsed.expenses,
      settings: {
        homeName: parsed.settings.homeName || 'My Home',
        currency: parsed.settings.currency || 'USD',
        ownerName: parsed.settings.ownerName || '',
        ownerEmail: parsed.settings.ownerEmail || '',
        propertyAddress: parsed.settings.propertyAddress || '',
        emergencyContact: parsed.settings.emergencyContact || '',
        isDemoData: Boolean(parsed.settings.isDemoData),
      },
    };
  } catch {
    return createSeedState();
  }
}

export function saveAppState(state: AppState): { ok: boolean; error?: string } {
  if (typeof window === 'undefined') return { ok: true };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : 'Unable to save to browser storage.',
    };
  }
}

const VALID_CURRENCIES = new Set(['USD', 'INR', 'EUR', 'GBP', 'CAD', 'AUD']);

export function validateImportedState(rawText: string): {
  state?: AppState;
  error?: string;
} {
  try {
    const parsed = JSON.parse(rawText) as Partial<AppState>;
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      !Array.isArray(parsed.assets) ||
      !Array.isArray(parsed.tasks) ||
      !Array.isArray(parsed.repairs) ||
      !Array.isArray(parsed.expenses) ||
      !parsed.settings ||
      typeof parsed.settings !== 'object'
    ) {
      return {
        error:
          'Invalid backup format. Expected a SmartFix AI JSON export file.',
      };
    }

    const currency = VALID_CURRENCIES.has(String(parsed.settings.currency))
      ? parsed.settings.currency!
      : 'USD';

    return {
      state: {
        assets: parsed.assets
          .filter((a) => a && typeof a.id === 'string' && typeof a.name === 'string')
          .map((a) => ({
            ...a,
            purchasePrice:
              Number.isFinite(Number(a.purchasePrice)) && Number(a.purchasePrice) >= 0
                ? Number(a.purchasePrice)
                : 0,
          })),
        tasks: parsed.tasks.filter(
          (t) => t && typeof t.id === 'string' && typeof t.taskName === 'string'
        ),
        repairs: parsed.repairs
          .filter((r) => r && typeof r.id === 'string' && typeof r.issue === 'string')
          .map((r) => ({
            ...r,
            cost:
              Number.isFinite(Number(r.cost)) && Number(r.cost) >= 0
                ? Number(r.cost)
                : 0,
          })),
        expenses: parsed.expenses
          .filter((e) => e && typeof e.id === 'string' && typeof e.description === 'string')
          .map((e) => ({
            ...e,
            amount:
              Number.isFinite(Number(e.amount)) && Number(e.amount) >= 0
                ? Number(e.amount)
                : 0,
          })),
        settings: {
          homeName: String(parsed.settings.homeName || 'My Home'),
          currency,
          ownerName: String(parsed.settings.ownerName || ''),
          ownerEmail: String(parsed.settings.ownerEmail || ''),
          propertyAddress: String(parsed.settings.propertyAddress || ''),
          emergencyContact: String(parsed.settings.emergencyContact || ''),
          isDemoData: false,
        },
      },
    };
  } catch {
    return { error: 'File could not be parsed as valid JSON.' };
  }
}

export function downloadTextFile(
  filename: string,
  content: string,
  mimeType = 'application/json;charset=utf-8'
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
