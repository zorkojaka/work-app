import { KanbanConfig } from './kanban';
import { ProjectBudgetRange as BaseProjectBudgetRange, ProjectIndustry as BaseProjectIndustry, ProjectTag as BaseProjectTag } from './project';

export interface UIProjectIndustry extends BaseProjectIndustry {
    icon: string;
}

export interface UIProjectBudgetRange extends BaseProjectBudgetRange {
    icon: string;
}

export interface UIProjectTag extends BaseProjectTag {
    icon: string;
}

export interface UIConfig {
    kanban: KanbanConfig;
    industries: UIProjectIndustry[];
    budgetRanges: UIProjectBudgetRange[];
    tags: UIProjectTag[];
}

export interface UserRole {
    id: string;
    name: string;
    permissions: {
        canManageUI: boolean; // Za "builder" vlogo
        canManageUsers: boolean; // Za admin vlogo
        canManageProjects: boolean;
        canViewProjects: boolean;
    };
}
