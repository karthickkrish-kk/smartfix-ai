import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AppShell } from './components/layout/AppShell';
import { DashboardView } from './components/views/DashboardView';
import { InventoryView } from './components/views/InventoryView';
import { MaintenanceView } from './components/views/MaintenanceView';
import { CopilotView } from './components/views/CopilotView';
import { MoreHubView } from './components/views/MoreHubView';
import { RepairsView } from './components/views/RepairsView';
import { ExpensesView } from './components/views/ExpensesView';
import { WarrantiesView } from './components/views/WarrantiesView';
import { ReportsView } from './components/views/ReportsView';
import { SettingsView } from './components/views/SettingsView';

function RouteRenderer() {
  const { route } = useApp();

  switch (route) {
    case 'dashboard':
      return <DashboardView />;
    case 'inventory':
      return <InventoryView />;
    case 'maintenance':
      return <MaintenanceView />;
    case 'copilot':
      return <CopilotView />;
    case 'more':
      return <MoreHubView />;
    case 'repairs':
      return <RepairsView />;
    case 'expenses':
      return <ExpensesView />;
    case 'warranties':
      return <WarrantiesView />;
    case 'reports':
      return <ReportsView />;
    case 'settings':
      return <SettingsView />;
    default:
      return <DashboardView />;
  }
}

export default function App() {
  return (
    <AppProvider>
      <AppShell>
        <RouteRenderer />
      </AppShell>
    </AppProvider>
  );
}
