// types/projectTask.ts
import { Timestamp } from 'firebase/firestore';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';

// 1. OSNOVNI TIPI NALOG
export interface ProjectTask {
  id?: string;
  projectId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Timestamp;
  assignedTo?: string[];
  createdBy?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  completedAt?: Timestamp;
  completedBy?: string;
  category?: string;
  column?: string;
  order?: number;
  attachments?: string[];
  comments?: TaskComment[];
  checklist?: TaskChecklistItem[];
  estimatedHours?: number;
  actualHours?: number;
  tags?: string[];
  // 1.1 Dodani novi atributi za količino in ceno
  quantity?: number;
  completedQuantity?: number;
  pricePerUnit?: number;
  unit?: string;
  taskGroupId?: string; // ID sklopa nalog, ki mu naloga pripada
  progress?: number; // Odstotek dokončanosti naloge (0-100)
}

// 2. KOMENTARJI IN KONTROLNI SEZNAMI
export interface TaskComment {
  id?: string;
  text: string;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface TaskChecklistItem {
  id?: string;
  text: string;
  completed: boolean;
  completedBy?: string;
  completedAt?: Timestamp;
}

// 3. STOLPCI IN DESKA
export interface TaskColumn {
  id: string;
  title: string;
  tasks: ProjectTask[];
  order: number;
}

export interface ProjectBoard {
  columns: TaskColumn[];
  projectId: string;
}

// 4. SKLOPI NALOG
export interface TaskGroup {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  createdBy?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  order?: number;
  progress?: number; // Odstotek dokončanosti sklopa (0-100)
  totalTasks?: number; // Skupno število nalog v sklopu
  completedTasks?: number; // Število dokončanih nalog v sklopu
}

// 5. DODELITEV NALOG
export interface TaskAssignment {
  id?: string;
  taskId: string;
  userId: string;
  assignedAt: Timestamp;
  assignedBy?: string;
  completedQuantity?: number; // Količina, ki jo je uporabnik dokončal
  status: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'PARTIAL';
}
