import React from 'react';
import { XMarkIcon, TrashIcon } from '../projects/icons';

export interface KanbanColumn {
  id: string;
  title: string;
  type: 'status' | 'execution';
  subcategories?: {
    id: string;
    title: string;
  }[];
}

interface KanbanSettingsProps {
  columns: KanbanColumn[];
  onClose: () => void;
  onUpdate: (columns: KanbanColumn[]) => Promise<void>;
}

const KanbanSettings: React.FC<KanbanSettingsProps> = ({
  columns,
  onClose,
  onUpdate
}) => {
  const handleAddColumn = async (type: 'status' | 'execution') => {
    try {
      const newColumn: KanbanColumn = {
        id: `COLUMN_${Date.now()}`,
        title: type === 'status' ? 'Nova faza' : 'Nov stolpec',
        type,
        subcategories: type === 'status' ? [] : undefined
      };
      
      const newColumns = [...columns, newColumn];
      await onUpdate(newColumns);
    } catch (error) {
      console.error('Napaka pri dodajanju stolpca:', error);
    }
  };

  const handleRenameColumn = async (columnIndex: number, newTitle: string) => {
    try {
      const newColumns = [...columns];
      newColumns[columnIndex] = {
        ...newColumns[columnIndex],
        title: newTitle
      };
      
      await onUpdate(newColumns);
    } catch (error) {
      console.error('Napaka pri preimenovanju stolpca:', error);
    }
  };

  const handleDeleteColumn = async (columnIndex: number) => {
    try {
      if (!confirm('Ali ste prepričani, da želite izbrisati ta stolpec? Vsi projekti v tem stolpcu bodo ostali brez oznake.')) {
        return;
      }

      const newColumns = [...columns];
      newColumns.splice(columnIndex, 1);
      
      await onUpdate(newColumns);
    } catch (error) {
      console.error('Napaka pri brisanju stolpca:', error);
    }
  };

  const handleAddSubcategory = async (columnIndex: number) => {
    try {
      const newColumns = [...columns];
      const column = newColumns[columnIndex];
      if (column.type === 'status' && column.subcategories) {
        column.subcategories.push({
          id: `SUB_${Date.now()}`,
          title: 'Nova podfaza'
        });
        await onUpdate(newColumns);
      }
    } catch (error) {
      console.error('Napaka pri dodajanju podfaze:', error);
    }
  };

  const handleRenameSubcategory = async (columnIndex: number, subIndex: number, newTitle: string) => {
    try {
      const newColumns = [...columns];
      const column = newColumns[columnIndex];
      if (column.type === 'status' && column.subcategories) {
        column.subcategories[subIndex].title = newTitle;
        await onUpdate(newColumns);
      }
    } catch (error) {
      console.error('Napaka pri preimenovanju podfaze:', error);
    }
  };

  const handleDeleteSubcategory = async (columnIndex: number, subIndex: number) => {
    try {
      const newColumns = [...columns];
      const column = newColumns[columnIndex];
      if (column.type === 'status' && column.subcategories) {
        column.subcategories.splice(subIndex, 1);
        await onUpdate(newColumns);
      }
    } catch (error) {
      console.error('Napaka pri brisanju podfaze:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[800px] max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Nastavitve Kanban table</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        
        <div className="space-y-6">
          <div className="flex justify-end gap-4">
            <button
              onClick={() => handleAddColumn('status')}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Nova faza
            </button>
            <button
              onClick={() => handleAddColumn('execution')}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
            >
              Nov stolpec
            </button>
          </div>

          <div className="space-y-4">
            {columns.map((column, columnIndex) => (
              <div
                key={column.id}
                className={`border rounded-lg p-4 ${
                  column.type === 'status' ? 'border-blue-200' : 'border-green-200'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <input
                    type="text"
                    value={column.title}
                    onChange={(e) => handleRenameColumn(columnIndex, e.target.value)}
                    className="text-lg font-medium bg-transparent border-none focus:ring-0"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                      {column.type === 'status' ? 'Faza' : 'Stolpec'}
                    </span>
                    <button
                      onClick={() => handleDeleteColumn(columnIndex)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {column.type === 'status' && (
                  <div className="space-y-2">
                    {column.subcategories?.map((subcategory, subIndex) => (
                      <div
                        key={subcategory.id}
                        className="flex items-center justify-between"
                      >
                        <input
                          type="text"
                          value={subcategory.title}
                          onChange={(e) => handleRenameSubcategory(columnIndex, subIndex, e.target.value)}
                          className="bg-transparent border-none focus:ring-0"
                        />
                        <button
                          onClick={() => handleDeleteSubcategory(columnIndex, subIndex)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => handleAddSubcategory(columnIndex)}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      + Dodaj podfazo
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KanbanSettings;
