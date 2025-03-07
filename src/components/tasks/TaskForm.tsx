// components/tasks/TaskForm.tsx
import React, { useState, useEffect } from 'react';
import { Timestamp } from 'firebase/firestore';
import { ProjectTask, TaskPriority, TaskStatus, TaskGroup } from '../../types/projectTask';
import { User } from '../../types/user';
import { Project } from '../../types/project';
import { 
  XMarkIcon, 
  PlusIcon, 
  MinusIcon,
  CalendarIcon,
  UserIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/solid';

// 1. DEFINICIJA TIPOV
interface TaskFormProps {
  task?: ProjectTask;
  project: Project;
  taskGroups: TaskGroup[];
  users: User[];
  onSave: (task: ProjectTask) => Promise<void>;
  onCancel: () => void;
  onDelete?: (task: ProjectTask) => Promise<void>;
}

// 2. POMOŽNE FUNKCIJE
const getTaskId = (): string => {
  return Math.random().toString(36).substring(2, 15);
};

const priorityOptions: { label: string; value: TaskPriority }[] = [
  { label: 'Nizka', value: 'LOW' },
  { label: 'Srednja', value: 'MEDIUM' },
  { label: 'Visoka', value: 'HIGH' },
  { label: 'Nujna', value: 'URGENT' }
];

const statusOptions: { label: string; value: TaskStatus }[] = [
  { label: 'Za narediti', value: 'TODO' },
  { label: 'V izvajanju', value: 'IN_PROGRESS' },
  { label: 'V pregledu', value: 'REVIEW' },
  { label: 'Končano', value: 'DONE' }
];

// 3. GLAVNA KOMPONENTA
const TaskForm: React.FC<TaskFormProps> = ({
  task,
  project,
  taskGroups,
  users,
  onSave,
  onCancel,
  onDelete
}) => {
  // 3.1 STANJE OBRAZCA
  const [formData, setFormData] = useState<Partial<ProjectTask>>(() => ({
    id: task?.id || getTaskId(),
    projectId: project.id,
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'TODO',
    priority: task?.priority || 'MEDIUM',
    taskGroupId: task?.taskGroupId || (taskGroups.length > 0 ? taskGroups[0].id : undefined),
    quantity: task?.quantity || 1,
    completedQuantity: task?.completedQuantity || 0,
    unit: task?.unit || 'kos',
    pricePerUnit: task?.pricePerUnit || 0,
    assignedTo: task?.assignedTo || [],
    dueDate: task?.dueDate || null,
    createdAt: task?.createdAt || Timestamp.now(),
    updatedAt: Timestamp.now()
  }));
  
  // 3.2 POMOŽNE FUNKCIJE ZA OBRAZEC
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseFloat(value);
    
    if (!isNaN(numValue)) {
      setFormData(prev => ({ ...prev, [name]: numValue }));
    }
  };
  
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (value) {
      const date = new Date(value);
      setFormData(prev => ({ ...prev, [name]: Timestamp.fromDate(date) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: null }));
    }
  };
  
  const handleUserToggle = (userId: string) => {
    setFormData(prev => {
      const assignedTo = prev.assignedTo || [];
      
      if (assignedTo.includes(userId)) {
        return { ...prev, assignedTo: assignedTo.filter(id => id !== userId) };
      } else {
        return { ...prev, assignedTo: [...assignedTo, userId] };
      }
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Preveri obvezna polja
    if (!formData.title || !formData.projectId || !formData.taskGroupId) {
      alert('Prosim izpolnite vsa obvezna polja');
      return;
    }
    
    try {
      await onSave(formData as ProjectTask);
    } catch (error) {
      console.error('Napaka pri shranjevanju naloge:', error);
      alert('Prišlo je do napake pri shranjevanju naloge');
    }
  };
  
  const handleDelete = async () => {
    if (!task || !onDelete) return;
    
    if (window.confirm('Ali ste prepričani, da želite izbrisati to nalogo?')) {
      try {
        await onDelete(task);
      } catch (error) {
        console.error('Napaka pri brisanju naloge:', error);
        alert('Prišlo je do napake pri brisanju naloge');
      }
    }
  };
  
  // 3.3 IZRIS KOMPONENTE
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">
          {task ? 'Uredi nalogo' : 'Nova naloga'}
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
        {/* 3.3.1 OSNOVNI PODATKI */}
        <div className="space-y-4 mb-6">
          {/* Naslov */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Naslov naloge *
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
          <div>
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
          
          {/* Skupina nalog */}
          <div>
            <label htmlFor="taskGroupId" className="block text-sm font-medium text-gray-700 mb-1">
              Skupina nalog *
            </label>
            <select
              id="taskGroupId"
              name="taskGroupId"
              value={formData.taskGroupId || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Izberi skupino</option>
              {taskGroups.map(group => (
                <option key={group.id} value={group.id}>
                  {group.title}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* 3.3.2 KOLIČINA IN CENA */}
        <div className="bg-gray-50 p-4 rounded-md mb-6">
          <h3 className="text-md font-medium text-gray-700 mb-3 flex items-center">
            <CurrencyDollarIcon className="w-5 h-5 mr-1 text-gray-500" />
            Količina in cena
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Količina */}
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                Količina
              </label>
              <div className="flex">
                <input
                  type="number"
                  id="quantity"
                  name="quantity"
                  value={formData.quantity || 0}
                  onChange={handleNumberChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="text"
                  id="unit"
                  name="unit"
                  value={formData.unit || 'kos'}
                  onChange={handleChange}
                  placeholder="Enota"
                  className="w-24 px-3 py-2 border border-gray-300 rounded-r-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            {/* Cena na enoto */}
            <div>
              <label htmlFor="pricePerUnit" className="block text-sm font-medium text-gray-700 mb-1">
                Cena na enoto (€)
              </label>
              <input
                type="number"
                id="pricePerUnit"
                name="pricePerUnit"
                value={formData.pricePerUnit || 0}
                onChange={handleNumberChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            {/* Dokončana količina */}
            <div>
              <label htmlFor="completedQuantity" className="block text-sm font-medium text-gray-700 mb-1">
                Dokončana količina
              </label>
              <input
                type="number"
                id="completedQuantity"
                name="completedQuantity"
                value={formData.completedQuantity || 0}
                onChange={handleNumberChange}
                min="0"
                max={formData.quantity || 0}
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            {/* Skupna vrednost (samo za prikaz) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Skupna vrednost (€)
              </label>
              <input
                type="text"
                value={((formData.quantity || 0) * (formData.pricePerUnit || 0)).toFixed(2)}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100"
              />
            </div>
          </div>
        </div>
        
        {/* 3.3.3 STATUS IN PRIORITETA */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Status */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status || 'TODO'}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* Prioriteta */}
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
              Prioriteta
            </label>
            <select
              id="priority"
              name="priority"
              value={formData.priority || 'MEDIUM'}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              {priorityOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* 3.3.4 DODELITEV IN ROK */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Dodeljeni monterji */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <UserIcon className="w-4 h-4 mr-1 text-gray-500" />
              Dodeljeni monterji
            </label>
            <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2">
              {users.length === 0 ? (
                <p className="text-sm text-gray-500">Ni najdenih monterjev</p>
              ) : (
                users.map(user => (
                  <div key={user.id} className="flex items-center mb-2 last:mb-0">
                    <input
                      type="checkbox"
                      id={`user-${user.id}`}
                      checked={(formData.assignedTo || []).includes(user.id)}
                      onChange={() => handleUserToggle(user.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`user-${user.id}`} className="ml-2 text-sm text-gray-700">
                      {user.displayName}
                    </label>
                  </div>
                ))
              )}
            </div>
          </div>
          
          {/* Rok */}
          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <CalendarIcon className="w-4 h-4 mr-1 text-gray-500" />
              Rok
            </label>
            <input
              type="date"
              id="dueDate"
              name="dueDate"
              value={formData.dueDate ? formData.dueDate.toDate().toISOString().split('T')[0] : ''}
              onChange={handleDateChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        {/* 3.3.5 GUMBI */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          {task && onDelete && (
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

export default TaskForm;
