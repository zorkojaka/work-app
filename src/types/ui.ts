export interface UIProjectIndustry {
    id: string;
    name: string;
    icon?: string;
    color: string;
}

export interface UIProjectTag {
    id: string;
    name: string;
    icon?: string;
    color: string;
}

export interface UIProjectBudgetRange {
    id: string;
    min: number;
    max: number;
    title: string;
    color: string;
    icon?: string;
    name?: string;
}

export interface UIMetricGoal {
    id: string;
    name: string;
    target: number;
    current: number;
    unit: string;
    color?: string;
}

export interface UIConfig {
    industries: UIProjectIndustry[];
    budgetRanges: UIProjectBudgetRange[];
    tags: UIProjectTag[];
    kanban: {
        columns: KanbanColumn[];
        defaultColumn: string;
    };
}

export interface KanbanColumn {
  id: string;
  title: string;
  name: string;  
  status: ProjectStatus;
  color: string;  
  subcategories?: {
    id: string;
    title: string;
    status: ProjectStatus;
  }[];
}

export type ProjectStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
