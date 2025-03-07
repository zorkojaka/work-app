// components/dashboard/Dashboard.tsx
import React from 'react';
import { useAuth } from '../auth/AuthProvider';
import AppHeader from '../common/AppHeader';

// Role-specific dashboards
import InstallerDashboard from './InstallerDashboard';
import ManagerDashboard from './ManagerDashboard';
import DirectorDashboard from './DirectorDashboard';
import AccountantDashboard from './AccountantDashboard';
import SalesDashboard from './SalesDashboard';
import AdminDashboard from './AdminDashboard';

// 1. GLAVNA KOMPONENTA
const Dashboard: React.FC = () => {
  // 1.1 Pridobivanje podatkov o uporabniku in njegovi vlogi
  const { activeRole } = useAuth();

  // 1.2 Prikaz ustrezne nadzorne plošče glede na vlogo
  return (
    <div>
      <AppHeader />
      <div className="container mx-auto px-4 py-6">
        {activeRole === 'INSTALLER' && <InstallerDashboard />}
        {activeRole === 'PROJECT_MANAGER' && <ManagerDashboard />}
        {activeRole === 'DIRECTOR' && <DirectorDashboard />}
        {activeRole === 'ACCOUNTANT' && <AccountantDashboard />}
        {activeRole === 'SALES' && <SalesDashboard />}
        {activeRole === 'ADMIN' && <AdminDashboard />}
      </div>
    </div>
  );
};

export default Dashboard;
