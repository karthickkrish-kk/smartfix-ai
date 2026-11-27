export type AssetCategory =
  | 'Air conditioner'
  | 'Refrigerator'
  | 'Washing machine'
  | 'Television'
  | 'Water heater'
  | 'Inverter'
  | 'Water purifier'
  | 'Electrical systems'
  | 'Plumbing'
  | 'Other';

export const ASSET_CATEGORIES: AssetCategory[] = [
  'Air conditioner',
  'Refrigerator',
  'Washing machine',
  'Television',
  'Water heater',
  'Inverter',
  'Water purifier',
  'Electrical systems',
  'Plumbing',
  'Other',
];

export interface Asset {
  id: string;
  name: string;
  category: AssetCategory;
  brand: string;
  model: string;
  serialNumber: string;
  purchaseDate: string; // YYYY-MM-DD
  purchasePrice: number;
  warrantyExpiry: string; // YYYY-MM-DD or ''
  location: string;
  serviceProvider: string;
  notes: string;
  createdAt: string;
}

export type TaskPriority = 'Low' | 'Medium' | 'High';

export type TaskRecurrence =
  | 'None'
  | 'Monthly'
  | 'Quarterly'
  | 'Bi-Annual'
  | 'Annual';

export type TaskReminder =
  | 'None'
  | 'Same day'
  | '1 day before'
  | '3 days before'
  | '7 days before';

export type TaskStatus = 'Overdue' | 'Due' | 'Upcoming' | 'Completed';

export interface MaintenanceTask {
  id: string;
  taskName: string;
  assetId: string; // '' if general home task
  date: string; // YYYY-MM-DD
  priority: TaskPriority;
  recurrence: TaskRecurrence;
  reminder: TaskReminder;
  notes: string;
  completed: boolean;
  completedDate?: string; // YYYY-MM-DD
  createdAt: string;
}

export type RepairStatus = 'Scheduled' | 'In Progress' | 'Completed';

export interface RepairRecord {
  id: string;
  assetId: string;
  issue: string;
  date: string; // YYYY-MM-DD
  cost: number;
  technician: string;
  notes: string;
  status: RepairStatus;
  createdAt: string;
}

export type ExpenseCategory =
  | 'Maintenance'
  | 'Repair'
  | 'Spare Parts'
  | 'Warranty & AMC'
  | 'Installation'
  | 'Tools & Supplies'
  | 'Utilities & Safety';

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Maintenance',
  'Repair',
  'Spare Parts',
  'Warranty & AMC',
  'Installation',
  'Tools & Supplies',
  'Utilities & Safety',
];

export type PaymentMethod =
  | 'Credit / Debit Card'
  | 'Bank Transfer'
  | 'Cash'
  | 'Digital Wallet / UPI'
  | 'Check';

export const PAYMENT_METHODS: PaymentMethod[] = [
  'Credit / Debit Card',
  'Bank Transfer',
  'Cash',
  'Digital Wallet / UPI',
  'Check',
];

export interface ExpenseRecord {
  id: string;
  category: ExpenseCategory;
  amount: number;
  date: string; // YYYY-MM-DD
  assetId: string; // '' if general household
  description: string;
  paymentMethod: PaymentMethod;
  createdAt: string;
}

export type CurrencyCode = 'USD' | 'INR' | 'EUR' | 'GBP' | 'CAD' | 'AUD';

export interface HomeSettings {
  homeName: string;
  currency: CurrencyCode;
  ownerName: string;
  ownerEmail: string;
  propertyAddress: string;
  emergencyContact: string;
  isDemoData: boolean;
}

export interface AppState {
  assets: Asset[];
  tasks: MaintenanceTask[];
  repairs: RepairRecord[];
  expenses: ExpenseRecord[];
  settings: HomeSettings;
}

export type WarrantyStatus = 'Active' | 'Expiring' | 'Expired' | 'None';

export interface WarrantyInfo {
  status: WarrantyStatus;
  daysRemaining: number | null;
}

export interface AppNotification {
  id: string;
  type: 'overdue' | 'due' | 'warranty' | 'repair';
  severity: 'high' | 'medium' | 'info';
  title: string;
  detail: string;
  targetRoute: AppRoute;
  targetId?: string;
}

export type AppRoute =
  | 'dashboard'
  | 'inventory'
  | 'maintenance'
  | 'copilot'
  | 'more'
  | 'repairs'
  | 'expenses'
  | 'warranties'
  | 'reports'
  | 'settings';
