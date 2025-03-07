import { Project } from './project';

export interface KanbanSubcategory {
  id: string;
  title: string;
  status: Project['status'];
  filter?: (project: Project) => boolean;
}

export interface KanbanColumn {
  id: string;
  title: string;
  name: string;  
  status: Project['status'];
  color: string;  
  subcategories?: KanbanSubcategory[];
  filter?: (project: Project) => boolean;
}

export interface KanbanConfig {
  columns: KanbanColumn[];
  defaultColumn: string;
}
