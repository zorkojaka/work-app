import React from 'react';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { Project } from '../../types/project';
import { Client } from '../../types/client';
import { KanbanConfig } from '../../types/kanban';
import { UIConfig } from '../../types/ui';
import { ProjectFilters } from '../projects/ProjectFilters';
import ModularKanban from './ModularKanban';
import ProjectCard from '../projects/ProjectCard';
import { CheckCircleIcon, ClockIcon, DocumentTextIcon, XCircleIcon } from '@heroicons/react/24/solid';

// 1. Definicija tipov
interface ProjectKanbanProps {
  projects: Project[];
  clients: Client[];
  kanbanConfig: KanbanConfig;
  onProjectUpdate: (project: Project) => Promise<void>;
  onProjectClick?: (project: Project) => void;
  onConfigUpdate?: (config: KanbanConfig) => Promise<void>;
  uiConfig: UIConfig;
  onAddProject?: () => void;
  renderFilters?: () => React.ReactNode;
  expandedProjects?: Record<string, boolean>;
  onToggleExpand?: (projectId: string) => void;
  additionalData?: {
    expandAllItems?: () => void;
    collapseAllItems?: () => void;
    updateStatusHistory?: (project: Project, sourceColumnId: string, destColumnId: string) => void;
  };
}

// 2. Pomožne funkcije
const getColumnIcon = (column: any) => {
  switch (column.status) {
    case 'DRAFT':
      return <DocumentTextIcon className="w-5 h-5" />;
    case 'IN_PROGRESS':
      return <ClockIcon className="w-5 h-5" />;
    case 'COMPLETED':
      return <CheckCircleIcon className="w-5 h-5" />;
    case 'CANCELLED':
      return <XCircleIcon className="w-5 h-5" />;
    default:
      return <DocumentTextIcon className="w-5 h-5" />;
  }
};

// 3. Komponenta za Kanban tablo projektov
const ProjectKanban: React.FC<ProjectKanbanProps> = ({
  projects,
  clients,
  kanbanConfig,
  onProjectUpdate,
  onProjectClick,
  onConfigUpdate,
  uiConfig,
  onAddProject,
  renderFilters,
  expandedProjects,
  onToggleExpand,
  additionalData
}) => {
  // 3.1 Funkcije za delo s projekti
  const getProjectId = (project: Project) => project.id;
  
  const getProjectColumn = (project: Project) => {
    // Najdi stolpec glede na status projekta
    const column = kanbanConfig.columns.find(col => col.status === project.status);
    return column ? column.id : kanbanConfig.defaultColumn;
  };
  
  const getProjectSubcategory = (project: Project) => project.subcategoryId;
  
  const updateProjectPosition = (project: Project, columnId: string, subcategoryId?: string): Project => {
    // Najdi stolpec po ID-ju
    const column = kanbanConfig.columns.find(col => col.id === columnId);
    if (!column) return project;
    
    console.log('Posodabljam pozicijo projekta:', {
      projectId: project.id,
      oldStatus: project.status,
      newStatus: column.status,
      oldSubcategoryId: project.subcategoryId,
      newSubcategoryId: subcategoryId
    });
    
    return {
      ...project,
      status: column.status,
      subcategoryId: subcategoryId,
      lastUpdated: Timestamp.fromDate(new Date())
    };
  };
  
  // 3.2 Funkcije za filtriranje projektov
  const filterProjects = (projects: Project[], query: string) => {
    if (!query) return projects;
    
    const lowerQuery = query.toLowerCase();
    return projects.filter(project => {
      // Išči po imenu projekta
      if (project.name.toLowerCase().includes(lowerQuery)) return true;
      
      // Išči po opisu
      if (project.description?.toLowerCase().includes(lowerQuery)) return true;
      
      // Išči po imenu stranke
      const client = clients.find(c => c.id === project.clientId);
      if (client && client.basicInfo.name.toLowerCase().includes(lowerQuery)) return true;
      
      // Išči po mestu
      if (project.location?.city?.toLowerCase().includes(lowerQuery)) return true;
      
      return false;
    });
  };

  // 3.2 Funkcija za preverjanje aktivnosti filtrov
  const areFiltersActive = () => {
    const defaultFilters: ProjectFilters = {
      status: [],
      city: '',
      teamMember: '',
      dateRange: {
        start: null,
        end: null
      },
      searchQuery: ''
    };

    // Preveri, če so filtri aktivni
    return (
      (uiConfig.filters.status && uiConfig.filters.status.length > 0) ||
      !!uiConfig.filters.city ||
      !!uiConfig.filters.teamMember ||
      !!uiConfig.filters.dateRange.start ||
      !!uiConfig.filters.dateRange.end ||
      !!uiConfig.filters.searchQuery
    );
  };

  // 3.3 Funkcija za resetiranje filtrov
  const resetFilters = () => {
    if (uiConfig.onFiltersChange) {
      uiConfig.onFiltersChange({
        status: [],
        city: '',
        teamMember: '',
        dateRange: {
          start: null,
          end: null
        },
        searchQuery: uiConfig.filters.searchQuery // Ohranimo iskalni niz
      });
    }
  };

  // 3.3 Izris komponente
  return (
    <ModularKanban
      items={projects}
      config={kanbanConfig}
      onItemUpdate={onProjectUpdate}
      onItemClick={onProjectClick}
      renderItem={(project, index) => (
        <ProjectCard
          key={project.id}
          project={project}
          onClick={() => onProjectClick?.(project)}
          uiConfig={uiConfig}
          client={clients.find(c => c.id === project.clientId)}
          dragIndex={index}
          expanded={expandedProjects?.[project.id] || false}
          onToggleExpand={() => onToggleExpand?.(project.id)}
        />
      )}
      getItemId={getProjectId}
      getItemColumn={getProjectColumn}
      getItemSubcategory={getProjectSubcategory}
      updateItemPosition={updateProjectPosition}
      onConfigUpdate={onConfigUpdate}
      additionalData={{
        getColumnIcon,
        filterItems: filterProjects,
        clients,
        renderFilters,
        areFiltersActive,
        resetFilters,
        expandAllItems: additionalData?.expandAllItems,
        collapseAllItems: additionalData?.collapseAllItems,
        updateStatusHistory: additionalData?.updateStatusHistory
      }}
      onAddItem={onAddProject}
      addItemLabel="Nov projekt"
    />
  );
};

export default ProjectKanban;
