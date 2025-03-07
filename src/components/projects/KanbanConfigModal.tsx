import React, { useState } from 'react';
import { KanbanConfig, KanbanColumn, KanbanSubcategory } from '../../types/kanban';

interface KanbanConfigModalProps {
  config: KanbanConfig;
  onSave: (config: KanbanConfig) => void;
  onClose: () => void;
}

const KanbanConfigModal: React.FC<KanbanConfigModalProps> = ({
  config,
  onSave,
  onClose,
}) => {
  const [editedConfig, setEditedConfig] = useState<KanbanConfig>({
    ...config,
    columns: [...config.columns],
  });

  const handleColumnChange = (index: number, field: keyof KanbanColumn, value: any) => {
    const newColumns = [...editedConfig.columns];
    newColumns[index] = { ...newColumns[index], [field]: value };
    setEditedConfig({ ...editedConfig, columns: newColumns });
  };

  const handleSubcategoryChange = (
    columnIndex: number,
    subIndex: number,
    field: keyof KanbanSubcategory,
    value: any
  ) => {
    const newColumns = [...editedConfig.columns];
    const column = { ...newColumns[columnIndex] };
    const subcategories = [...(column.subcategories || [])];
    subcategories[subIndex] = { ...subcategories[subIndex], [field]: value };
    column.subcategories = subcategories;
    newColumns[columnIndex] = column;
    setEditedConfig({ ...editedConfig, columns: newColumns });
  };

  const addColumn = () => {
    const newColumn: KanbanColumn = {
      id: `column-${Date.now()}`,
      title: 'Nov stolpec',
      status: 'DRAFT',
    };
    setEditedConfig({
      ...editedConfig,
      columns: [...editedConfig.columns, newColumn],
    });
  };

  const removeColumn = (index: number) => {
    const newColumns = editedConfig.columns.filter((_, i) => i !== index);
    setEditedConfig({ ...editedConfig, columns: newColumns });
  };

  const addSubcategory = (columnIndex: number) => {
    const newColumns = [...editedConfig.columns];
    const column = { ...newColumns[columnIndex] };
    const subcategories = [...(column.subcategories || [])];
    const newSubcategory: KanbanSubcategory = {
      id: `sub-${Date.now()}`,
      title: 'Nova podkategorija',
      status: column.status,
    };
    column.subcategories = [...subcategories, newSubcategory];
    newColumns[columnIndex] = column;
    setEditedConfig({ ...editedConfig, columns: newColumns });
  };

  const removeSubcategory = (columnIndex: number, subIndex: number) => {
    const newColumns = [...editedConfig.columns];
    const column = { ...newColumns[columnIndex] };
    const subcategories = [...(column.subcategories || [])];
    column.subcategories = subcategories.filter((_, i) => i !== subIndex);
    newColumns[columnIndex] = column;
    setEditedConfig({ ...editedConfig, columns: newColumns });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Nastavitve Kanban table</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {editedConfig.columns.map((column, columnIndex) => (
            <div
              key={column.id}
              className="border rounded-lg p-4 bg-gray-50"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1 mr-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Naslov stolpca
                  </label>
                  <input
                    type="text"
                    value={column.title}
                    onChange={(e) =>
                      handleColumnChange(columnIndex, 'title', e.target.value)
                    }
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="flex-1 mr-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={column.status}
                    onChange={(e) =>
                      handleColumnChange(columnIndex, 'status', e.target.value)
                    }
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="DRAFT">V pripravi</option>
                    <option value="IN_PROGRESS">V izvajanju</option>
                    <option value="COMPLETED">Zaključeno</option>
                    <option value="CANCELLED">Preklicano</option>
                  </select>
                </div>
                <div className="flex items-end space-x-2">
                  <button
                    onClick={() => addSubcategory(columnIndex)}
                    className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    + Podkategorija
                  </button>
                  <button
                    onClick={() => removeColumn(columnIndex)}
                    className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                  >
                    Izbriši
                  </button>
                </div>
              </div>

              {/* Podkategorije */}
              {column.subcategories && column.subcategories.length > 0 && (
                <div className="ml-6 space-y-4">
                  {column.subcategories.map((sub, subIndex) => (
                    <div key={sub.id} className="flex items-center space-x-4">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Naslov podkategorije
                        </label>
                        <input
                          type="text"
                          value={sub.title}
                          onChange={(e) =>
                            handleSubcategoryChange(
                              columnIndex,
                              subIndex,
                              'title',
                              e.target.value
                            )
                          }
                          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      <button
                        onClick={() => removeSubcategory(columnIndex, subIndex)}
                        className="px-2 py-1 text-red-500 hover:text-red-600"
                      >
                        Izbriši
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          <div className="flex justify-between">
            <button
              onClick={addColumn}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              + Dodaj stolpec
            </button>
            <div className="space-x-4">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Prekliči
              </button>
              <button
                onClick={() => onSave(editedConfig)}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
              >
                Shrani
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KanbanConfigModal;
