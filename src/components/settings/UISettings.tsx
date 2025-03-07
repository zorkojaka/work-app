// components/settings/UISettings.tsx
import React, { useState } from 'react';
import { useUIConfig } from '../../hooks/useUIConfig';
import { useAuth } from '../../components/auth/AuthProvider';
import { Navigate } from 'react-router-dom';
import Header from '../common/Header';
import IndustriesSettings from './ui/IndustriesSettings';
import BudgetRangesSettings from './ui/BudgetRangesSettings';
import TagsSettings from './ui/TagsSettings';

// 1. KOMPONENTA ZA NASTAVITVE UI
const UISettings: React.FC = () => {
  // 1.1 Stanje in hooki
  const { uiConfig, loading, error, saving } = useUIConfig();
  const [activeTab, setActiveTab] = useState<'industries' | 'budgetRanges' | 'tags'>('industries');
  const { activeRole } = useAuth();

  // 1.2 Preverjanje pravic
  if (activeRole !== 'admin' && activeRole !== 'director') {
    return <Navigate to="/" replace />;
  }

  // 1.3 Prikaz nalaganja
  if (loading) {
    return (
      <div className="p-6">
        <Header title="Nastavitve UI" />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  // 1.4 Prikaz napake
  if (error) {
    return (
      <div className="p-6">
        <Header title="Nastavitve UI" />
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4">
          <p>Napaka pri nalaganju nastavitev: {error}</p>
        </div>
      </div>
    );
  }

  // 1.5 Glavna vsebina
  return (
    <div className="p-6">
      <Header title="Nastavitve UI" />
      
      {/* 1.5.1 Zavihki */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('industries')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'industries'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Panoge
          </button>
          <button
            onClick={() => setActiveTab('budgetRanges')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'budgetRanges'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Finančni rangi
          </button>
          <button
            onClick={() => setActiveTab('tags')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'tags'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Oznake
          </button>
        </nav>
      </div>

      {/* 1.5.2 Vsebina zavihkov */}
      <div className="mt-6">
        {activeTab === 'industries' && <IndustriesSettings />}
        {activeTab === 'budgetRanges' && <BudgetRangesSettings />}
        {activeTab === 'tags' && <TagsSettings />}
      </div>
    </div>
  );
};

export default UISettings;
