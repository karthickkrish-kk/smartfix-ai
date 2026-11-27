import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type {
  AppRoute,
  AppState,
  Asset,
  ExpenseRecord,
  HomeSettings,
  MaintenanceTask,
  RepairRecord,
} from '../types';
import {
  computeNextRecurrenceDate,
  generateNotifications,
  toISODate,
} from '../utils/calculations';
import { createEmptyState, createSeedState } from '../data/seedData';
import { loadAppState, saveAppState } from '../utils/storage';

export interface ToastMessage {
  id: string;
  text: string;
  tone: 'success' | 'info' | 'error';
}

export interface RouteIntent {
  openCreate?: boolean;
  prefillAssetId?: string;
  prefillTitle?: string;
  prefillNotes?: string;
  filterStatus?: string;
  selectedAssetId?: string;
}

interface AppContextValue {
  state: AppState;
  route: AppRoute;
  routeIntent: RouteIntent | null;
  navigate: (route: AppRoute, intent?: RouteIntent) => void;
  clearRouteIntent: () => void;
  notifications: ReturnType<typeof generateNotifications>;
  toasts: ToastMessage[];
  pushToast: (text: string, tone?: ToastMessage['tone']) => void;
  dismissToast: (id: string) => void;
  storageError: string | null;

  // Asset CRUD
  addAsset: (input: Omit<Asset, 'id' | 'createdAt'>) => Asset;
  updateAsset: (id: string, updates: Omit<Asset, 'id' | 'createdAt'>) => void;
  deleteAsset: (id: string) => void;

  // Maintenance CRUD
  addTask: (input: Omit<MaintenanceTask, 'id' | 'createdAt'>) => MaintenanceTask;
  updateTask: (
    id: string,
    updates: Omit<MaintenanceTask, 'id' | 'createdAt'>
  ) => void;
  deleteTask: (id: string) => void;
  toggleTaskComplete: (id: string) => void;

  // Repair CRUD
  addRepair: (
    input: Omit<RepairRecord, 'id' | 'createdAt'>,
    alsoLogExpense?: boolean
  ) => RepairRecord;
  updateRepair: (
    id: string,
    updates: Omit<RepairRecord, 'id' | 'createdAt'>
  ) => void;
  deleteRepair: (id: string) => void;

  // Expense CRUD
  addExpense: (
    input: Omit<ExpenseRecord, 'id' | 'createdAt'>
  ) => ExpenseRecord;
  updateExpense: (
    id: string,
    updates: Omit<ExpenseRecord, 'id' | 'createdAt'>
  ) => void;
  deleteExpense: (id: string) => void;

  // Settings & Data Management
  updateSettings: (updates: Partial<HomeSettings>) => void;
  clearAllData: () => void;
  resetDemoData: () => void;
  replaceAllState: (nextState: AppState) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadAppState());
  const [route, setRoute] = useState<AppRoute>('dashboard');
  const [routeIntent, setRouteIntent] = useState<RouteIntent | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [storageError, setStorageError] = useState<string | null>(null);

  useEffect(() => {
    const res = saveAppState(state);
    if (!res.ok) {
      setStorageError(res.error ?? 'Failed to save changes locally.');
    } else {
      setStorageError(null);
    }
  }, [state]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback(
    (text: string, tone: ToastMessage['tone'] = 'success') => {
      const id = makeId('toast');
      setToasts((prev) => [...prev.slice(-2), { id, text, tone }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3600);
    },
    []
  );

  const navigate = useCallback((nextRoute: AppRoute, intent?: RouteIntent) => {
    setRoute(nextRoute);
    setRouteIntent(intent ?? null);
    window.scrollTo(0, 0);
  }, []);

  const clearRouteIntent = useCallback(() => {
    setRouteIntent(null);
  }, []);

  // Assets
  const addAsset = useCallback(
    (input: Omit<Asset, 'id' | 'createdAt'>) => {
      const created: Asset = {
        ...input,
        id: makeId('asset'),
        createdAt: toISODate(new Date()),
      };
      setState((prev) => ({
        ...prev,
        assets: [created, ...prev.assets],
      }));
      pushToast(`Added "${created.name}" to inventory`);
      return created;
    },
    [pushToast]
  );

  const updateAsset = useCallback(
    (id: string, updates: Omit<Asset, 'id' | 'createdAt'>) => {
      setState((prev) => ({
        ...prev,
        assets: prev.assets.map((a) =>
          a.id === id ? { ...a, ...updates } : a
        ),
      }));
      pushToast(`Updated "${updates.name}"`);
    },
    [pushToast]
  );

  const deleteAsset = useCallback(
    (id: string) => {
      let deletedName = 'Asset';
      setState((prev) => {
        const found = prev.assets.find((a) => a.id === id);
        if (found) deletedName = found.name;
        return {
          ...prev,
          assets: prev.assets.filter((a) => a.id !== id),
          tasks: prev.tasks.map((t) =>
            t.assetId === id ? { ...t, assetId: '' } : t
          ),
          repairs: prev.repairs.map((r) =>
            r.assetId === id ? { ...r, assetId: '' } : r
          ),
          expenses: prev.expenses.map((e) =>
            e.assetId === id ? { ...e, assetId: '' } : e
          ),
        };
      });
      pushToast(`Deleted "${deletedName}"`, 'info');
    },
    [pushToast]
  );

  // Maintenance Tasks
  const addTask = useCallback(
    (input: Omit<MaintenanceTask, 'id' | 'createdAt'>) => {
      const created: MaintenanceTask = {
        ...input,
        id: makeId('task'),
        createdAt: toISODate(new Date()),
      };
      setState((prev) => ({
        ...prev,
        tasks: [created, ...prev.tasks],
      }));
      pushToast(`Scheduled "${created.taskName}"`);
      return created;
    },
    [pushToast]
  );

  const updateTask = useCallback(
    (id: string, updates: Omit<MaintenanceTask, 'id' | 'createdAt'>) => {
      setState((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
      }));
      pushToast(`Updated "${updates.taskName}"`);
    },
    [pushToast]
  );

  const deleteTask = useCallback(
    (id: string) => {
      setState((prev) => ({
        ...prev,
        tasks: prev.tasks.filter((t) => t.id !== id),
      }));
      pushToast('Maintenance task deleted', 'info');
    },
    [pushToast]
  );

  const toggleTaskComplete = useCallback(
    (id: string) => {
      const today = toISODate(new Date());
      let toastMsg = 'Task updated';

      setState((prev) => {
        const target = prev.tasks.find((t) => t.id === id);
        if (!target) return prev;

        const markingComplete = !target.completed;
        const updatedTasks = prev.tasks.map((t) =>
          t.id === id
            ? {
                ...t,
                completed: markingComplete,
                completedDate: markingComplete ? today : undefined,
              }
            : t
        );

        if (markingComplete && target.recurrence !== 'None') {
          const nextDate = computeNextRecurrenceDate(
            target.date,
            target.recurrence,
            new Date()
          );
          if (nextDate) {
            const nextTask: MaintenanceTask = {
              id: makeId('task'),
              taskName: target.taskName,
              assetId: target.assetId,
              date: nextDate,
              priority: target.priority,
              recurrence: target.recurrence,
              reminder: target.reminder,
              notes: target.notes,
              completed: false,
              createdAt: today,
            };
            toastMsg = `Completed "${target.taskName}" & scheduled next (${nextDate})`;
            return { ...prev, tasks: [nextTask, ...updatedTasks] };
          }
        }

        toastMsg = markingComplete
          ? `Completed "${target.taskName}"`
          : `Reopened "${target.taskName}"`;
        return { ...prev, tasks: updatedTasks };
      });

      pushToast(toastMsg);
    },
    [pushToast]
  );

  // Repairs
  const addRepair = useCallback(
    (
      input: Omit<RepairRecord, 'id' | 'createdAt'>,
      alsoLogExpense = false
    ) => {
      const today = toISODate(new Date());
      const created: RepairRecord = {
        ...input,
        id: makeId('rep'),
        createdAt: today,
      };
      setState((prev) => {
        const nextExpenses =
          alsoLogExpense && input.cost > 0
            ? [
                {
                  id: makeId('exp'),
                  category: 'Repair' as const,
                  amount: input.cost,
                  date: input.date,
                  assetId: input.assetId,
                  description: `Repair: ${input.issue}`,
                  paymentMethod: 'Credit / Debit Card' as const,
                  createdAt: today,
                },
                ...prev.expenses,
              ]
            : prev.expenses;

        return {
          ...prev,
          repairs: [created, ...prev.repairs],
          expenses: nextExpenses,
        };
      });
      pushToast(
        alsoLogExpense && input.cost > 0
          ? 'Repair logged and added to Expense Tracker'
          : 'Repair record saved'
      );
      return created;
    },
    [pushToast]
  );

  const updateRepair = useCallback(
    (id: string, updates: Omit<RepairRecord, 'id' | 'createdAt'>) => {
      setState((prev) => ({
        ...prev,
        repairs: prev.repairs.map((r) =>
          r.id === id ? { ...r, ...updates } : r
        ),
      }));
      pushToast('Repair record updated');
    },
    [pushToast]
  );

  const deleteRepair = useCallback(
    (id: string) => {
      setState((prev) => ({
        ...prev,
        repairs: prev.repairs.filter((r) => r.id !== id),
      }));
      pushToast('Repair record deleted', 'info');
    },
    [pushToast]
  );

  // Expenses
  const addExpense = useCallback(
    (input: Omit<ExpenseRecord, 'id' | 'createdAt'>) => {
      const created: ExpenseRecord = {
        ...input,
        id: makeId('exp'),
        createdAt: toISODate(new Date()),
      };
      setState((prev) => ({
        ...prev,
        expenses: [created, ...prev.expenses],
      }));
      pushToast('Expense recorded');
      return created;
    },
    [pushToast]
  );

  const updateExpense = useCallback(
    (id: string, updates: Omit<ExpenseRecord, 'id' | 'createdAt'>) => {
      setState((prev) => ({
        ...prev,
        expenses: prev.expenses.map((e) =>
          e.id === id ? { ...e, ...updates } : e
        ),
      }));
      pushToast('Expense updated');
    },
    [pushToast]
  );

  const deleteExpense = useCallback(
    (id: string) => {
      setState((prev) => ({
        ...prev,
        expenses: prev.expenses.filter((e) => e.id !== id),
      }));
      pushToast('Expense deleted', 'info');
    },
    [pushToast]
  );

  // Settings & Data Management
  const updateSettings = useCallback(
    (updates: Partial<HomeSettings>) => {
      setState((prev) => ({
        ...prev,
        settings: {
          ...prev.settings,
          ...updates,
          isDemoData:
            updates.isDemoData !== undefined ? updates.isDemoData : false,
        },
      }));
      pushToast('Settings saved');
    },
    [pushToast]
  );

  const clearAllData = useCallback(() => {
    setState((prev) => createEmptyState(prev.settings));
    pushToast('All home records cleared', 'info');
  }, [pushToast]);

  const resetDemoData = useCallback(() => {
    setState(createSeedState());
    pushToast('Sample demo data restored');
  }, [pushToast]);

  const replaceAllState = useCallback(
    (nextState: AppState) => {
      setState(nextState);
      pushToast('Backup data imported successfully');
    },
    [pushToast]
  );

  const notifications = useMemo(
    () => generateNotifications(state.assets, state.tasks, state.repairs),
    [state.assets, state.tasks, state.repairs]
  );

  const value = useMemo<AppContextValue>(
    () => ({
      state,
      route,
      routeIntent,
      navigate,
      clearRouteIntent,
      notifications,
      toasts,
      pushToast,
      dismissToast,
      storageError,
      addAsset,
      updateAsset,
      deleteAsset,
      addTask,
      updateTask,
      deleteTask,
      toggleTaskComplete,
      addRepair,
      updateRepair,
      deleteRepair,
      addExpense,
      updateExpense,
      deleteExpense,
      updateSettings,
      clearAllData,
      resetDemoData,
      replaceAllState,
    }),
    [
      state,
      route,
      routeIntent,
      navigate,
      clearRouteIntent,
      notifications,
      toasts,
      pushToast,
      dismissToast,
      storageError,
      addAsset,
      updateAsset,
      deleteAsset,
      addTask,
      updateTask,
      deleteTask,
      toggleTaskComplete,
      addRepair,
      updateRepair,
      deleteRepair,
      addExpense,
      updateExpense,
      deleteExpense,
      updateSettings,
      clearAllData,
      resetDemoData,
      replaceAllState,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used inside AppProvider');
  }
  return ctx;
}
