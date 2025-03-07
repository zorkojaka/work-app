import React from 'react';
import { useAuth } from '../auth/AuthProvider';

const RoleSwitcher: React.FC = () => {
  const { roles, activeRole, switchRole } = useAuth();

  const roleLabels: Record<string, string> = {
    'INSTALLER': 'Monter',
    'PROJECT_MANAGER': 'Vodja projektov',
    'ADMIN': 'Administrator',
    'DIRECTOR': 'Direktor',
    'ACCOUNTANT': 'Računovodja',
    'SALES': 'Prodaja'
  };

  return (
    <div className="relative">
      <select
        value={activeRole}
        onChange={(e) => switchRole(e.target.value)}
        className="block w-full bg-white border border-gray-300 rounded-md py-2 pl-3 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        {roles.map((role) => (
          <option key={role} value={role}>
            {roleLabels[role] || role}
          </option>
        ))}
      </select>
    </div>
  );
};

export default RoleSwitcher;