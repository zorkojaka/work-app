// components/tasks/TaskGroupForm.tsx
import React, { useState } from 'react';
import { Timestamp } from 'firebase/firestore';
import { TaskGroup } from '../../types/projectTask';
import { Project } from '../../types/project';
import { XMarkIcon } from '@heroicons/react/24/solid';

// 1. DEFINICIJA TIPOV
interface TaskGroupFormProps {
  group?: TaskGroup;
  project: Project;
  onSave: (group: TaskGroup) => Promise<void>;
  onCancel: () => void;
  onDelete?: (group: TaskGroup) => Promise<void>;
}

// 2. POMOŽNE FUNKCIJE
const getGroupId = (): string => {
  return Math.random().toString(36).substring(2, 15);
};

const colorOptions = [
  { label: 'Siva', value: 'bg-gray-100' },
  { label: 'Modra', value: 'bg-blue-100' },
  { label: 'Zelena', value: 'bg-green-100' },
  { label: 'Rumena', value: 'bg-yellow-100' },
  { label: 'Rdeča', value: 'bg-red-100' },
  { label: 'Vijolična', value: 'bg-purple-100' },
  { label: 'Roza', value: 'bg-pink-100' },
  { label: 'Indigo', value: 'bg-indigo-100' }
];

// 3. GLAVNA KOMPONENTA
const TaskGroupForm: React.FC<TaskGroupFormProps> = ({
  group,
  project,
  onSave,
  onCancel,
  onDelete
}) => {
  // 3.1 STANJE OBRAZCA
  const [formData, setFormData] = useState<Partial<TaskGroup>>(() => ({
    id: group?.id || getGroupId(),
    projectId: project.id,
    title: group?.title || '',
    description: group?.description || '',
    color: group?.color || 'bg-gray-100',
    createdAt: group?.createdAt || Timestamp.now(),
    updatedAt: Timestamp.now()
  }));
  
  // 3.2 POMOŽNE FUNKCIJE ZA OBRAZEC
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Preveri obvezna polja
    if (!formData.title || !formData.projectId) {
      alert('Prosim izpolnite vsa obvezna polja');
      return;
    }
    
    try {
      await onSave(formData as TaskGroup);
    } catch (error) {
      console.error('Napaka pri shranjevanju skupine:', error);
      alert('Prišlo je do napake pri shranjevanju skupine');
    }
  };
  
  const handleDelete = async () => {
    if (!group || !onDelete) return;
    
    if (window.confirm('Ali ste prepričani, da želite izbrisati to skupino?')) {
      try {
        await onDelete(group);
      } catch (error) {
        console.error('Napaka pri brisanju skupine:', error);
        alert('Prišlo je do napake pri brisanju skupine');
      }
    }
  };
  
  // 3.3 IZRIS KOMPONENTE
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">
          {group ? 'Uredi skupino' : 'Nova skupina'}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>
      </div>
      
      <form onSubmit={handleSubmit}>
        {/* Naslov */}
        <div className="mb-4">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Naslov skupine *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        
        {/* Opis */}
        <div className="mb-4">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Opis
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description || ''}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        {/* Barva */}
        <div className="mb-6">
          <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">
            Barva
          </label>
          <select
            id="color"
            name="color"
            value={formData.color || 'bg-gray-100'}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            {colorOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className={`mt-2 h-6 w-full rounded ${formData.color}`}></div>
        </div>
        
        {/* Gumbi */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          {group && onDelete && (
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2 border border-red-300 text-red-700 rounded-md shadow-sm hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Izbriši
            </button>
          )}
          
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Prekliči
          </button>
          
          <button
            type="submit"
            className="px-4 py-2 border border-transparent text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Shrani
          </button>
        </div>
      </form>
    </div>
  );
};

export default TaskGroupForm;
