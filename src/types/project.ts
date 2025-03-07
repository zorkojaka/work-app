import { Timestamp } from 'firebase/firestore';

export interface ProjectEquipment {
    cameras: Array<{
        type: string;
        quantity: number;
    }>;
    materials: Array<{
        name: string;
        quantity: number;
        unit: string;
    }>;
}

export interface ProjectCosts {
    materials: number;
    labor: number;
    travel: number;
}

export interface ProjectTeamMember {
    userId: string;
    role: string;
    tasks: string[];
}

export interface ProjectLocation {
    city: string | undefined;
    street?: string;
    postalCode?: string;
}

export interface ProjectBudget {
    amount: number;
    currency: string;
}

export type ProjectStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface ProjectTag {
    id: string;
    name: string;
    color: string;
}

export interface ProjectIndustry {
    id: string;
    name: string;
    color: string;
}

export interface ProjectBudgetRange {
    id: string;
    name: string; 
    min: number;
    max: number;
    color: string;
}

export interface ProjectExecutionDate {
    date: string;  // ISO date string
    time: string;  // HH:mm format
    confirmed: boolean;
}

export interface ProjectStatusHistoryItem {
    timestamp: Timestamp;
    oldStatus?: ProjectStatus;
    newStatus: ProjectStatus;
    userId?: string;
    note?: string;
}

export interface Project {
    id: string;
    projectId?: string;  // 4-mestna ID številka projekta
    name: string;
    client?: string;
    description?: string;
    clientId: string;
    status: ProjectStatus;
    startDate?: Timestamp;
    endDate?: Timestamp;
    location?: ProjectLocation;
    team?: Record<string, ProjectTeamMember>;
    equipment?: ProjectEquipment;
    costs?: ProjectCosts;
    budget?: ProjectBudget;
    executionDate?: ProjectExecutionDate;
    progress?: number;
    completedDate?: Timestamp;
    lastUpdated?: Timestamp;
    createdAt?: Timestamp;
    createdBy?: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH';
    tags?: string[];
    subcategoryId?: string;
    industryIds?: string[];
    budgetRangeId?: string;
    value?: number;
    exactPrice?: number;  // Točna končna cena projekta
    statusHistory?: ProjectStatusHistoryItem[];  // Zgodovina sprememb statusa
    visitedStatuses?: Record<string, boolean>;  // Statusi, v katerih je projekt že bil
    deadline?: Timestamp | string;  // Rok za izvedbo projekta
    contact?: {
        name?: string;
        email?: string;
        phone?: string;
    };  // Kontaktna oseba za projekt
    taskGroups?: string[]; // ID-ji sklopov nalog v projektu
    assignedInstallers?: string[]; // ID-ji monterjev, dodeljenih projektu
}