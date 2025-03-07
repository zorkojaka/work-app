// components/tasks/TaskKanban.tsx
import React, { useState, useEffect } from 'react';
import { Timestamp } from 'firebase/firestore';
import { ProjectTask, TaskStatus, TaskGroup } from '../../types/projectTask';
import { Project } from '../../types/project';
import { User } from '../../types/user';
import ModularKanban from '../kanban/ModularKanban';
import TaskCard from './TaskCard';
import { KanbanConfig } from '../../types/kanban';
import { ClockIcon, CheckCircleIcon, DocumentTextIcon, XCircleIcon } from '@heroicons/react/24/solid';

// 1. DEFINICIJA TIPOV
interface TaskKanbanProps {
  tasks: ProjectTask[];
  taskGroups: TaskGroup[];
  project: Project;
  users: User[];
  kanbanConfig: KanbanConfig;
  onTaskUpdate: (task: ProjectTask) => Promise<void>;
  onTaskClick?: (task: ProjectTask) => void;
  onConfigUpdate?: (config: KanbanConfig) => Promise<void>;
  onAddTask?: () => void;
  expandedTasks?: Record<string, boolean>;
  onToggleExpand?: (taskId: string) => void;
  additionalData?: {
    expandAllItems?: () => void;
    collapseAllItems?: () => void;
    updateStatusHistory?: (task: ProjectTask, sourceColumnId: string, destColumnId: string) => void;
  };
}

// 2. POMOŽNE FUNKCIJE
const getColumnIcon = (column: any) => {
  switch (column.status) {
    case 'TODO':
      return <DocumentTextIcon className="w-5 h-5" />;
    case 'IN_PROGRESS':
      return <ClockIcon className="w-5 h-5" />;
    case 'REVIEW':
      return <DocumentTextIcon className="w-5 h-5" />;
    case 'DONE':
      return <CheckCircleIcon className="w-5 h-5" />;
    default:
      return <DocumentTextIcon className="w-5 h-5" />;
  }
};

// 3. GLAVNA KOMPONENTA
const TaskKanban: React.FC<TaskKanbanProps> = ({
  tasks,
  taskGroups,
  project,
  users,
  kanbanConfig,
  onTaskUpdate,
  onTaskClick,
  onConfigUpdate,
  onAddTask,
  expandedTasks,
  onToggleExpand,
  additionalData
}) => {
  // 3.1 FUNKCIJE ZA DELO Z NALOGAMI
  const getTaskId = (task: ProjectTask) => task.id || '';
  
  const getTaskColumn = (task: ProjectTask) => {
    // Najdi stolpec glede na status naloge
    const column = kanbanConfig.columns.find(col => col.status === task.status);
    return column ? column.id : kanbanConfig.defaultColumn;
  };
  
  const getTaskSubcategory = (task: ProjectTask) => task.category;
  
  const updateTaskPosition = (task: ProjectTask, columnId: string, subcategoryId?: string): ProjectTask => {
    // Najdi stolpec po ID-ju
    const column = kanbanConfig.columns.find(col => col.id === columnId);
    if (!column) return task;
    
    console.log('Posodabljam pozicijo naloge:', {
      taskId: task.id,
      oldStatus: task.status,
      newStatus: column.status,
      oldCategory: task.category,
      newCategory: subcategoryId
    });
    
    return {
      ...task,
      status: column.status as TaskStatus,
      category: subcategoryId,
      updatedAt: Timestamp.fromDate(new Date())
    };
  };
  
  // 3.2 FUNKCIJE ZA FILTRIRANJE NALOG
  const filterTasks = (tasks: ProjectTask[], query: string) => {
    if (!query) return tasks;
    
    const lowerQuery = query.toLowerCase();
    return tasks.filter(task => {
      // Išči po naslovu naloge
      if (task.title.toLowerCase().includes(lowerQuery)) return true;
      
      // Išči po opisu
      if (task.description?.toLowerCase().includes(lowerQuery)) return true;
      
      // Išči po imenu dodeljenega uporabnika
      if (task.assignedTo && task.assignedTo.some(userId => {
        const user = users.find(u => u.id === userId);
        return user && user.displayName.toLowerCase().includes(lowerQuery);
      })) return true;
      
      return false;
    });
  };

  // 3.3 IZRIS KOMPONENTE
  return (
    <ModularKanban
      items={tasks}
      config={kanbanConfig}
      onItemUpdate={onTaskUpdate}
      onItemClick={onTaskClick}
      renderItem={(task, index) => (
        <TaskCard
          key={task.id}
          task={task}
          project={project}
          taskGroup={taskGroups.find(g => g.id === task.taskGroupId)}
          onClick={() => onTaskClick?.(task)}
          dragIndex={index}
          expanded={expandedTasks?.[task.id || ''] || false}
          onToggleExpand={() => onToggleExpand?.(task.id || '')}
          users={users}
        />
      )}
      getItemId={getTaskId}
      getItemColumn={getTaskColumn}
      getItemSubcategory={getTaskSubcategory}
      updateItemPosition={updateTaskPosition}
      onConfigUpdate={onConfigUpdate}
      additionalData={{
        getColumnIcon,
        filterItems: filterTasks,
        users,
        expandAllItems: additionalData?.expandAllItems,
        collapseAllItems: additionalData?.collapseAllItems,
        updateStatusHistory: additionalData?.updateStatusHistory
      }}
      onAddItem={onAddTask}
      addItemLabel="Nova naloga"
    />
  );
};

export default TaskKanban;
