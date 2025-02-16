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

export interface Project {
    id: string;
    clientId: string;
    name: string;
    description: string;
    status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    startDate: Timestamp;
    endDate?: Timestamp;
    location: {
        street: string;
        city: string;
        postalCode: string;
    };
    team: Record<string, ProjectTeamMember>;
    equipment: ProjectEquipment;
    costs: ProjectCosts;
    // Dodamo samo najnujnejša nova polja
    lastUpdated?: Timestamp;
    createdBy?: string;
    createdAt?: Timestamp;
}