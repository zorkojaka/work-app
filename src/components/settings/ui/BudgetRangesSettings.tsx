// components/settings/ui/BudgetRangesSettings.tsx
import React, { useState, useEffect } from 'react';
import { useUIConfig } from '../../../hooks/useUIConfig';
import { UIProjectBudgetRange } from '../../../types/ui';
import { ChromePicker, ColorResult } from 'react-color';
import { PlusIcon, TrashIcon, PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

// 1. KOMPONENTA ZA NASTAVITVE FINANČNIH RANGOV
const BudgetRangesSettings: React.FC = () => {
  // 1.1 Stanje in hooki
  const { uiConfig, saving, error, updateBudgetRanges } = useUIConfig();
  const [budgetRanges, setBudgetRanges] = useState<UIProjectBudgetRange[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  // 1.2 Inicializacija stanja
  useEffect(() => {
    if (uiConfig?.budgetRanges) {
      // Razvrsti range po vrednosti (od najmanjšega do največjega)
      const sortedRanges = [...uiConfig.budgetRanges].sort((a, b) => a.max - b.max);
      setBudgetRanges(sortedRanges);
    }
  }, [uiConfig]);

  // 1.3 Funkcija za dodajanje novega ranga
  const handleAddBudgetRange = () => {
    const newId = `range-${Date.now()}`;
    // Določi največjo vrednost obstoječih rangov
    const maxValue = budgetRanges.length > 0 
      ? Math.max(...budgetRanges.map(range => range.max)) 
      : 0;
    
    const newRange: UIProjectBudgetRange = {
      id: newId,
      title: `Nov rang (${maxValue} - ${maxValue + 1000} €)`,
      min: maxValue,
      max: maxValue + 1000,
      color: '#3B82F6', // blue-500
      icon: '💰'
    };
    
    setBudgetRanges([...budgetRanges, newRange]);
    setEditingId(newId);
  };

  // 1.4 Funkcija za brisanje ranga
  const handleDeleteBudgetRange = (id: string) => {
    setBudgetRanges(budgetRanges.filter(range => range.id !== id));
  };

  // 1.5 Funkcija za urejanje ranga
  const handleEditBudgetRange = (id: string, field: keyof UIProjectBudgetRange, value: any) => {
    setBudgetRanges(
      budgetRanges.map(range => {
        if (range.id === id) {
          // Pretvori vrednosti v številke, če je potrebno
          if (field === 'min' || field === 'max') {
            return { ...range, [field]: parseFloat(value) || 0 };
          }
          return { ...range, [field]: value };
        }
        return range;
      })
    );
  };

  // 1.6 Funkcija za spreminjanje barve
  const handleColorChange = (id: string, color: ColorResult) => {
    handleEditBudgetRange(id, 'color', color.hex);
  };

  // 1.7 Funkcija za shranjevanje sprememb
  const handleSave = async () => {
    // Razvrsti range po vrednosti pred shranjevanjem
    const sortedRanges = [...budgetRanges].sort((a, b) => a.max - b.max);
    const success = await updateBudgetRanges(sortedRanges);
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
        <h2 className="text-lg font-medium">Finančni rangi</h2>
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
      
      {/* 1.8.2 Seznam finančnih rangov */}
      <div className="bg-white shadow overflow-hidden rounded-md">
        <ul className="divide-y divide-gray-200">
          {budgetRanges.map(range => (
            <li key={range.id} className="px-4 py-4">
              {editingId === range.id ? (
                // 1.8.3 Urejanje ranga
                <div className="flex flex-col space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
                      <input
                        type="text"
                        value={range.id}
                        onChange={(e) => handleEditBudgetRange(range.id, 'id', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div className="col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Naziv</label>
                      <input
                        type="text"
                        value={range.title}
                        onChange={(e) => handleEditBudgetRange(range.id, 'title', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Minimalna vrednost (€)</label>
                      <input
                        type="number"
                        value={range.min}
                        onChange={(e) => handleEditBudgetRange(range.id, 'min', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Maksimalna vrednost (€)</label>
                      <input
                        type="number"
                        value={range.max}
                        onChange={(e) => handleEditBudgetRange(range.id, 'max', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Barva</label>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => setShowColorPicker(showColorPicker === range.id ? null : range.id)}
                          className="w-10 h-10 rounded-md border border-gray-300"
                          style={{ backgroundColor: range.color }}
                        ></button>
                        <span>{range.color}</span>
                      </div>
                      
                      {showColorPicker === range.id && (
                        <div className="absolute z-10 mt-2">
                          <div 
                            className="fixed inset-0" 
                            onClick={() => setShowColorPicker(null)}
                          ></div>
                          <ChromePicker
                            color={range.color}
                            onChange={(color) => handleColorChange(range.id, color)}
                          />
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ikona</label>
                      <input
                        type="text"
                        value={range.icon || ''}
                        onChange={(e) => handleEditBudgetRange(range.id, 'icon', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Emoji ali ikona"
                      />
                    </div>
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
                // 1.8.4 Prikaz ranga
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <div
                      className="w-10 h-10 flex items-center justify-center rounded-md"
                      style={{ backgroundColor: range.color }}
                    >
                      <span className="text-white">{range.icon || '💰'}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium">{range.title}</h3>
                      <p className="text-sm text-gray-500">
                        {range.min} € - {range.max} €
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setEditingId(range.id)}
                      className="p-2 text-blue-600 hover:text-blue-800"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteBudgetRange(range.id)}
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
          onClick={handleAddBudgetRange}
          className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-500 hover:bg-blue-600"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Dodaj finančni rang
        </button>
      </div>
    </div>
  );
};

export default BudgetRangesSettings;
