import type { AppState } from '../types';
import { toISODate } from '../utils/calculations';

function offsetDays(days: number, base: Date = new Date()): string {
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + days);
  return toISODate(d);
}

function offsetMonths(months: number, dayOfMonth: number, base: Date = new Date()): string {
  const d = new Date(base.getFullYear(), base.getMonth() + months, 1);
  const maxDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(dayOfMonth, maxDay));
  return toISODate(d);
}

export function createSeedState(referenceDate: Date = new Date()): AppState {
  const today = toISODate(referenceDate);

  return {
    settings: {
      homeName: 'Maple Creek Residence',
      currency: 'USD',
      ownerName: 'Alex Morgan',
      ownerEmail: 'alex.morgan@homeowner.example',
      propertyAddress: '418 Maple Creek Lane, Austin, TX',
      emergencyContact: 'RapidHome 24/7 Services · (555) 234-8890',
      isDemoData: true,
    },
    assets: [
      {
        id: 'asset-ac-1',
        name: 'Master Bedroom Split AC',
        category: 'Air conditioner',
        brand: 'Daikin',
        model: 'FTKF50U Inverter 1.5T',
        serialNumber: 'DK-2024-88412',
        purchaseDate: offsetDays(-540, referenceDate),
        purchasePrice: 1280,
        warrantyExpiry: offsetDays(24, referenceDate), // Expiring soon
        location: 'Master Bedroom',
        serviceProvider: 'CoolAir Certified HVAC',
        notes: 'Uses R-32 refrigerant. Clean washable mesh filter every 60 days.',
        createdAt: today,
      },
      {
        id: 'asset-fridge-1',
        name: 'French Door Smart Refrigerator',
        category: 'Refrigerator',
        brand: 'LG',
        model: 'LRMVS3006S InstaView',
        serialNumber: 'LG-RF-672910',
        purchaseDate: offsetDays(-410, referenceDate),
        purchasePrice: 2350,
        warrantyExpiry: offsetDays(320, referenceDate), // Active
        location: 'Main Kitchen',
        serviceProvider: 'LG Authorized Care',
        notes: 'Water filter model LT1000P. Condenser coils vacuumed every 6 months.',
        createdAt: today,
      },
      {
        id: 'asset-washer-1',
        name: 'Front-Load Washing Machine',
        category: 'Washing machine',
        brand: 'Bosch',
        model: 'Serie 6 WAT28400',
        serialNumber: 'BS-WM-449102',
        purchaseDate: offsetDays(-760, referenceDate),
        purchasePrice: 1090,
        warrantyExpiry: offsetDays(-30, referenceDate), // Expired
        location: 'Utility Laundry Room',
        serviceProvider: 'Bosch Home Service',
        notes: 'Run tub-clean cycle monthly and clear front coin trap filter quarterly.',
        createdAt: today,
      },
      {
        id: 'asset-heater-1',
        name: 'Storage Water Heater 50 Gal',
        category: 'Water heater',
        brand: 'A. O. Smith',
        model: 'ProLine XE EN6-50',
        serialNumber: 'AOS-WH-19034',
        purchaseDate: offsetDays(-690, referenceDate),
        purchasePrice: 890,
        warrantyExpiry: offsetDays(42, referenceDate), // Expiring soon
        location: 'Garage Utility Closet',
        serviceProvider: 'ClearFlow Plumbing & Heating',
        notes: 'Flush tank sediment annually and inspect anode rod every 2 years.',
        createdAt: today,
      },
      {
        id: 'asset-purifier-1',
        name: 'Under-Sink RO+UV Water Purifier',
        category: 'Water purifier',
        brand: 'Kent',
        model: 'Supreme Extra Mineral RO',
        serialNumber: 'KT-RO-55182',
        purchaseDate: offsetDays(-210, referenceDate),
        purchasePrice: 340,
        warrantyExpiry: offsetDays(155, referenceDate), // Active
        location: 'Main Kitchen',
        serviceProvider: 'PureDrop Filter Care',
        notes: 'TDS calibrated to 85 ppm. Sediment & carbon cartridges due every 6 months.',
        createdAt: today,
      },
      {
        id: 'asset-inverter-1',
        name: 'Home Backup Pure Sine Inverter',
        category: 'Inverter',
        brand: 'Luminous',
        model: 'Zelio+ 1700 with 150Ah Battery',
        serialNumber: 'LM-INV-90231',
        purchaseDate: offsetDays(-310, referenceDate),
        purchasePrice: 520,
        warrantyExpiry: offsetDays(420, referenceDate), // Active
        location: 'Garage Wall Rack',
        serviceProvider: 'VoltGuard Power Tech',
        notes: 'Check battery distilled water level every quarter; keep vents clear.',
        createdAt: today,
      },
      {
        id: 'asset-tv-1',
        name: 'Living Room 65" OLED TV',
        category: 'Television',
        brand: 'Sony',
        model: 'BRAVIA XR A80L',
        serialNumber: 'SNY-TV-77821',
        purchaseDate: offsetDays(-180, referenceDate),
        purchasePrice: 1799,
        warrantyExpiry: offsetDays(185, referenceDate), // Active
        location: 'Living Room',
        serviceProvider: 'Sony Direct Support',
        notes: 'Mounted on surge-protected dedicated outlet.',
        createdAt: today,
      },
      {
        id: 'asset-elec-1',
        name: '200A Main Electrical Panel',
        category: 'Electrical systems',
        brand: 'Schneider Electric',
        model: 'Square D QO Series',
        serialNumber: 'SE-PNL-3309',
        purchaseDate: offsetDays(-1150, referenceDate),
        purchasePrice: 1450,
        warrantyExpiry: offsetDays(-120, referenceDate), // Expired
        location: 'Garage North Wall',
        serviceProvider: 'BrightLine Licensed Electricians',
        notes: 'Annual GFCI/AFCI trip test recommended. Professional servicing only.',
        createdAt: today,
      },
    ],
    tasks: [
      {
        id: 'task-1',
        taskName: 'Clean AC indoor air filters & drain pan',
        assetId: 'asset-ac-1',
        date: offsetDays(-4, referenceDate), // Overdue
        priority: 'High',
        recurrence: 'Quarterly',
        reminder: '1 day before',
        notes: 'Rinse mesh filters with lukewarm water and dry completely before reinstalling.',
        completed: false,
        createdAt: today,
      },
      {
        id: 'task-2',
        taskName: 'Replace RO sediment & carbon filter cartridges',
        assetId: 'asset-purifier-1',
        date: offsetDays(3, referenceDate), // Due soon
        priority: 'High',
        recurrence: 'Bi-Annual',
        reminder: '3 days before',
        notes: 'Verify output TDS reads under 100 ppm after flushing new filters for 10 mins.',
        completed: false,
        createdAt: today,
      },
      {
        id: 'task-3',
        taskName: 'Inspect inverter battery distilled water levels',
        assetId: 'asset-inverter-1',
        date: offsetDays(5, referenceDate), // Due soon
        priority: 'Medium',
        recurrence: 'Quarterly',
        reminder: '1 day before',
        notes: 'Top up only with deionized distilled water. Wipe terminal oxidation.',
        completed: false,
        createdAt: today,
      },
      {
        id: 'task-4',
        taskName: 'Flush water heater tank & test T&P valve',
        assetId: 'asset-heater-1',
        date: offsetDays(18, referenceDate), // Upcoming
        priority: 'Medium',
        recurrence: 'Annual',
        reminder: '7 days before',
        notes: 'Turn off breaker and cold inlet before draining 3–5 gallons to clear sediment.',
        completed: false,
        createdAt: today,
      },
      {
        id: 'task-5',
        taskName: 'Vacuum refrigerator condenser coils',
        assetId: 'asset-fridge-1',
        date: offsetDays(29, referenceDate), // Upcoming
        priority: 'Low',
        recurrence: 'Bi-Annual',
        reminder: '3 days before',
        notes: 'Unplug unit before brushing rear coils to improve compressor efficiency.',
        completed: false,
        createdAt: today,
      },
      {
        id: 'task-6',
        taskName: 'Clean washing machine drain pump filter & seal',
        assetId: 'asset-washer-1',
        date: offsetDays(-22, referenceDate),
        priority: 'Medium',
        recurrence: 'Quarterly',
        reminder: 'Same day',
        notes: 'Removed lint buildup and ran 60°C tub clean cycle.',
        completed: true,
        completedDate: offsetDays(-21, referenceDate),
        createdAt: today,
      },
      {
        id: 'task-7',
        taskName: 'Annual GFCI & breaker safety inspection',
        assetId: 'asset-elec-1',
        date: offsetDays(-48, referenceDate),
        priority: 'High',
        recurrence: 'Annual',
        reminder: '7 days before',
        notes: 'Licensed electrician tested all bathroom/kitchen GFCI outlets and torque lugs.',
        completed: true,
        completedDate: offsetDays(-47, referenceDate),
        createdAt: today,
      },
    ],
    repairs: [
      {
        id: 'rep-1',
        assetId: 'asset-washer-1',
        issue: 'Drain pump impeller jammed causing E18 drain error',
        date: offsetDays(-14, referenceDate),
        cost: 165,
        technician: 'Bosch Home Service (M. Rivera)',
        notes: 'Replaced worn drain pump seal and cleared coin trap obstruction. Tested spin cycle.',
        status: 'Completed',
        createdAt: today,
      },
      {
        id: 'rep-2',
        assetId: 'asset-ac-1',
        issue: 'Outdoor condenser fan capacitor weak on startup',
        date: offsetDays(-3, referenceDate),
        cost: 140,
        technician: 'CoolAir Certified HVAC',
        notes: 'Replacement dual-run capacitor ordered; follow-up installation visit scheduled.',
        status: 'In Progress',
        createdAt: today,
      },
      {
        id: 'rep-3',
        assetId: 'asset-heater-1',
        issue: 'Slow drip at hot-water outlet dielectric union',
        date: offsetDays(-75, referenceDate),
        cost: 115,
        technician: 'ClearFlow Plumbing & Heating',
        notes: 'Tightened and resealed dielectric union with fresh PTFE tape and washer.',
        status: 'Completed',
        createdAt: today,
      },
    ],
    expenses: [
      {
        id: 'exp-1',
        category: 'Repair',
        amount: 165,
        date: offsetDays(-14, referenceDate),
        assetId: 'asset-washer-1',
        description: 'Washing machine drain pump service & seal kit',
        paymentMethod: 'Credit / Debit Card',
        createdAt: today,
      },
      {
        id: 'exp-2',
        category: 'Spare Parts',
        amount: 64,
        date: offsetDays(-8, referenceDate),
        assetId: 'asset-purifier-1',
        description: 'RO sediment, activated carbon & post-carbon filter pack',
        paymentMethod: 'Digital Wallet / UPI',
        createdAt: today,
      },
      {
        id: 'exp-3',
        category: 'Maintenance',
        amount: 145,
        date: offsetMonths(-1, 14, referenceDate),
        assetId: 'asset-elec-1',
        description: 'Annual licensed electrical panel safety inspection',
        paymentMethod: 'Bank Transfer',
        createdAt: today,
      },
      {
        id: 'exp-4',
        category: 'Warranty & AMC',
        amount: 190,
        date: offsetMonths(-2, 19, referenceDate),
        assetId: 'asset-ac-1',
        description: 'Annual HVAC preventive maintenance contract renewal',
        paymentMethod: 'Credit / Debit Card',
        createdAt: today,
      },
      {
        id: 'exp-5',
        category: 'Repair',
        amount: 115,
        date: offsetMonths(-2, 6, referenceDate),
        assetId: 'asset-heater-1',
        description: 'Water heater outlet union leak repair',
        paymentMethod: 'Credit / Debit Card',
        createdAt: today,
      },
      {
        id: 'exp-6',
        category: 'Spare Parts',
        amount: 48,
        date: offsetMonths(-3, 21, referenceDate),
        assetId: 'asset-fridge-1',
        description: 'Replacement LG LT1000P refrigerator water filter',
        paymentMethod: 'Credit / Debit Card',
        createdAt: today,
      },
      {
        id: 'exp-7',
        category: 'Tools & Supplies',
        amount: 52,
        date: offsetMonths(-4, 11, referenceDate),
        assetId: '',
        description: 'Coil cleaner spray, distilled water jugs & silicone grease',
        paymentMethod: 'Cash',
        createdAt: today,
      },
      {
        id: 'exp-8',
        category: 'Maintenance',
        amount: 130,
        date: offsetMonths(-5, 16, referenceDate),
        assetId: 'asset-ac-1',
        description: 'Pre-season split AC jet wash & airflow calibration',
        paymentMethod: 'Bank Transfer',
        createdAt: today,
      },
    ],
  };
}

export function createEmptyState(
  existingSettings?: AppState['settings']
): AppState {
  const keepProfile = existingSettings && !existingSettings.isDemoData;
  return {
    assets: [],
    tasks: [],
    repairs: [],
    expenses: [],
    settings: keepProfile
      ? { ...existingSettings, isDemoData: false }
      : {
          homeName: 'My Home',
          currency: existingSettings?.currency ?? 'USD',
          ownerName: '',
          ownerEmail: '',
          propertyAddress: '',
          emergencyContact: '',
          isDemoData: false,
        },
  };
}
