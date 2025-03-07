// components/settings/ui/IndustriesSettings.tsx
import React, { useState, useEffect } from 'react';
import { useUIConfig } from '../../../hooks/useUIConfig';
import { UIProjectIndustry } from '../../../types/ui';
import { ChromePicker, ColorResult } from 'react-color';
import { PlusIcon, TrashIcon, PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

// 1. KOMPONENTA ZA NASTAVITVE PANOG
const IndustriesSettings: React.FC = () => {
  // 1.1 Stanje in hooki
  const { uiConfig, saving, error, updateIndustries } = useUIConfig();
  const [industries, setIndustries] = useState<UIProjectIndustry[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  // 1.2 Inicializacija stanja
  useEffect(() => {
    if (uiConfig?.industries) {
      setIndustries([...uiConfig.industries]);
    }
  }, [uiConfig]);

  // 1.3 Funkcija za dodajanje nove panoge
  const handleAddIndustry = () => {
    const newId = `industry-${Date.now()}`;
    const newIndustry: UIProjectIndustry = {
      id: newId,
      name: 'Nova panoga',
      color: '#3B82F6', // blue-500
      icon: '🏢'
    };
    
    setIndustries([...industries, newIndustry]);
    setEditingId(newId);
  };

  // 1.4 Funkcija za brisanje panoge
  const handleDeleteIndustry = (id: string) => {
    setIndustries(industries.filter(industry => industry.id !== id));
  };

  // 1.5 Funkcija za urejanje panoge
  const handleEditIndustry = (id: string, field: keyof UIProjectIndustry, value: string) => {
    setIndustries(
      industries.map(industry => {
        if (industry.id === id) {
          return { ...industry, [field]: value };
        }
        return industry;
      })
    );
  };

  // 1.6 Funkcija za spreminjanje barve
  const handleColorChange = (id: string, color: ColorResult) => {
    handleEditIndustry(id, 'color', color.hex);
  };

  // 1.7 Funkcija za shranjevanje sprememb
  const handleSave = async () => {
    const success = await updateIndustries(industries);
    setSaveStatus(success ? 'success' : 'error');
    
    // Ponastavi status po 3 sekundah
    setTimeout(() => {
      setSaveStatus('idle');
    }, 3000);
  };

  // 1.8 Prikaz komponente
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">Panoge</h2>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`px-4 py-2 rounded-md text-white ${
            saving ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {saving ? 'Shranjevanje...' : 'Shrani spremembe'}
        </button>
      </div>
      
      {/* 1.8.1 Prikaz statusa */}
      {saveStatus === 'success' && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <p>Spremembe so bile uspešno shranjene.</p>
        </div>
      )}
      
      {saveStatus === 'error' && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>Napaka pri shranjevanju sprememb: {error}</p>
        </div>
      )}
      
      {/* 1.8.2 Seznam panog */}
      <div className="bg-white shadow overflow-hidden rounded-md">
        <ul className="divide-y divide-gray-200">
          {industries.map(industry => (
            <li key={industry.id} className="px-4 py-4">
              {editingId === industry.id ? (
                // 1.8.3 Urejanje panoge
                <div className="flex flex-col space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
                      <input
                        type="text"
                        value={industry.id}
                        onChange={(e) => handleEditIndustry(industry.id, 'id', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ime</label>
                      <input
                        type="text"
                        value={industry.name}
                        onChange={(e) => handleEditIndustry(industry.id, 'name', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ikona</label>
                      <input
                        type="text"
                        value={industry.icon || ''}
                        onChange={(e) => handleEditIndustry(industry.id, 'icon', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Emoji ali ikona"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Barva</label>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setShowColorPicker(showColorPicker === industry.id ? null : industry.id)}
                        className="w-10 h-10 rounded-md border border-gray-300"
                        style={{ backgroundColor: industry.color }}
                      ></button>
                      <span>{industry.color}</span>
                    </div>
                    
                    {showColorPicker === industry.id && (
                      <div className="absolute z-10 mt-2">
                        <div 
                          className="fixed inset-0" 
                          onClick={() => setShowColorPicker(null)}
                        ></div>
                        <ChromePicker
                          color={industry.color}
                          onChange={(color) => handleColorChange(industry.id, color)}
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-500 hover:bg-blue-600"
                    >
                      <CheckIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ) : (
                // 1.8.4 Prikaz panoge
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <div
                      className="w-10 h-10 flex items-center justify-center rounded-md"
                      style={{ backgroundColor: industry.color }}
                    >
                      <span className="text-white">{industry.icon}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium">{industry.name}</h3>
                      <p className="text-sm text-gray-500">ID: {industry.id}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setEditingId(industry.id)}
                      className="p-2 text-blue-600 hover:text-blue-800"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteIndustry(industry.id)}
                      className="p-2 text-red-600 hover:text-red-800"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
      
      {/* 1.8.5 Gumb za dodajanje */}
      <div className="mt-4">
        <button
          type="button"
          onClick={handleAddIndustry}
          className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-500 hover:bg-blue-600"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Dodaj panogo
        </button>
      </div>
    </div>
  );
};

export default IndustriesSettings;
