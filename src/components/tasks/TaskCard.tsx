// components/tasks/TaskCard.tsx
import React from 'react';
import { ProjectTask, TaskGroup } from '../../types/projectTask';
import { Project } from '../../types/project';
import { User } from '../../types/user';
import { 
  ClockIcon, 
  CheckCircleIcon, 
  ExclamationCircleIcon, 
  UserIcon, 
  ChevronDownIcon, 
  ChevronUpIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/solid';

// 1. DEFINICIJA TIPOV
interface TaskCardProps {
  task: ProjectTask;
  project: Project;
  taskGroup?: TaskGroup;
  onClick?: () => void;
  dragIndex?: number;
  expanded?: boolean;
  onToggleExpand?: () => void;
  users: User[];
}

// 2. POMOŽNE FUNKCIJE
const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'LOW':
      return 'bg-blue-100 text-blue-800';
    case 'MEDIUM':
      return 'bg-yellow-100 text-yellow-800';
    case 'HIGH':
      return 'bg-orange-100 text-orange-800';
    case 'URGENT':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'TODO':
      return 'bg-gray-100 text-gray-800';
    case 'IN_PROGRESS':
      return 'bg-blue-100 text-blue-800';
    case 'REVIEW':
      return 'bg-purple-100 text-purple-800';
    case 'DONE':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'TODO':
      return <ClockIcon className="w-4 h-4" />;
    case 'IN_PROGRESS':
      return <ClockIcon className="w-4 h-4" />;
    case 'REVIEW':
      return <ExclamationCircleIcon className="w-4 h-4" />;
    case 'DONE':
      return <CheckCircleIcon className="w-4 h-4" />;
    default:
      return <ClockIcon className="w-4 h-4" />;
  }
};

const formatDate = (date: any) => {
  if (!date) return 'Ni določen';
  
  if (typeof date === 'object' && date.toDate) {
    return date.toDate().toLocaleDateString('sl-SI');
  } else if (typeof date === 'string') {
    return new Date(date).toLocaleDateString('sl-SI');
  }
  
  return 'Ni določen';
};

// 3. GLAVNA KOMPONENTA
const TaskCard: React.FC<TaskCardProps> = ({
  task,
  project,
  taskGroup,
  onClick,
  dragIndex,
  expanded = false,
  onToggleExpand,
  users
}) => {
  // 3.1 IZRAČUNI ZA PRIKAZ
  const assignedUsers = task.assignedTo?.map(userId => 
    users.find(user => user.id === userId)
  ).filter(Boolean) || [];

  const totalValue = (task.quantity || 0) * (task.pricePerUnit || 0);
  const completedValue = (task.completedQuantity || 0) * (task.pricePerUnit || 0);
  const progressPercentage = task.quantity ? Math.round((task.completedQuantity || 0) / task.quantity * 100) : 0;

  // 3.2 IZRIS KOMPONENTE
  return (
    <div 
      className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200 ${
        dragIndex !== undefined ? 'mb-3' : ''
      }`}
      onClick={onClick}
    >
      {/* Glava kartice */}
      <div className="p-3 border-b border-gray-100">
        <div className="flex justify-between items-start">
          <h3 className="font-medium text-gray-900 truncate">{task.title}</h3>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(task.priority)}`}>
              {task.priority}
            </span>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand?.();
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              {expanded ? (
                <ChevronUpIcon className="w-5 h-5" />
              ) : (
                <ChevronDownIcon className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
        
        {/* Skupina nalog */}
        {taskGroup && (
          <div className="mt-1 text-xs text-gray-500">
            Sklop: {taskGroup.title}
          </div>
        )}
        
        {/* Napredek */}
        <div className="mt-2">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Napredek: {progressPercentage}%</span>
            <span>{task.completedQuantity || 0} / {task.quantity || 0} {task.unit || 'kos'}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full" 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>
      
      {/* Razširjeni del kartice */}
      {expanded && (
        <div className="p-3 bg-gray-50">
          {/* Opis */}
          {task.description && (
            <div className="mb-3">
              <h4 className="text-xs font-medium text-gray-500 mb-1">Opis</h4>
              <p className="text-sm text-gray-700">{task.description}</p>
            </div>
          )}
          
          {/* Podatki o količini in ceni */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <h4 className="text-xs font-medium text-gray-500">Količina</h4>
              <p className="text-sm text-gray-700">{task.quantity} {task.unit || 'kos'}</p>
            </div>
            <div>
              <h4 className="text-xs font-medium text-gray-500">Cena na enoto</h4>
              <p className="text-sm text-gray-700">{task.pricePerUnit?.toFixed(2) || '0.00'} €</p>
            </div>
            <div>
              <h4 className="text-xs font-medium text-gray-500">Skupna vrednost</h4>
              <p className="text-sm text-gray-700">{totalValue.toFixed(2)} €</p>
            </div>
            <div>
              <h4 className="text-xs font-medium text-gray-500">Dokončana vrednost</h4>
              <p className="text-sm text-gray-700">{completedValue.toFixed(2)} €</p>
            </div>
          </div>
          
          {/* Dodeljeni uporabniki */}
          {assignedUsers.length > 0 && (
            <div className="mb-3">
              <h4 className="text-xs font-medium text-gray-500 mb-1">Dodeljeni monterji</h4>
              <div className="flex flex-wrap gap-2">
                {assignedUsers.map(user => (
                  <div key={user?.id} className="flex items-center bg-gray-200 rounded-full px-2 py-1 text-xs">
                    <UserIcon className="w-3 h-3 mr-1" />
                    <span>{user?.displayName}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Rok */}
          {task.dueDate && (
            <div>
              <h4 className="text-xs font-medium text-gray-500">Rok</h4>
              <p className="text-sm text-gray-700">{formatDate(task.dueDate)}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskCard;
