import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, addDoc, deleteDoc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import ProjectKanban from '../kanban/ProjectKanban';
import ProjectList from './ProjectList';
import ProjectForm from './ProjectForm';
import ProjectFiltersComponent, { ProjectFilters, ProjectSort } from './ProjectFilters';
import ProjectStats from './ProjectStats';
import { usePersistedState } from '../../hooks/usePersistedState';
import { Project, ProjectStatus, ProjectStatusHistoryItem } from '../../types/project';
import { Client } from '../../types/client';
import { useUIConfig } from '../../hooks/useUIConfig';
import { XMarkIcon, TrashIcon } from './icons';
import { KanbanConfig } from '../../types/kanban';
import AppHeader from '../common/AppHeader';

const ProjectsPage: React.FC = () => {
  const [view] = usePersistedState<'kanban' | 'list'>('projectView', 'kanban');
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const { uiConfig } = useUIConfig();

  const [filters, setFilters] = useState<ProjectFilters>({
    status: [],
    city: '',
    teamMember: '',
    dateRange: {
      start: null,
      end: null
    },
    searchQuery: ''
  });

  const [sort, setSort] = useState<ProjectSort>({
    field: 'executionDate',
    direction: 'desc'
  });

  // Dodamo stanje za razširjene projekte
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});

  useEffect(() => {
    console.log('Loading projects from Firebase...');
    const q = query(collection(db, 'projects'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const projectsData: Project[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Normalize project data
        const normalizedProject = {
          id: doc.id,
          ...data,
          tags: data.tags || data.tagIds || [], // Convert tagIds to tags
          executionDate: data.executionDate ? {
            date: data.executionDate.date || data.executionDate,
            time: data.executionDate.time || null
          } : null,
          subcategoryId: data.subcategoryId, // Keep original subcategoryId
          status: data.status || 'DRAFT' // Ensure status exists
        };
        // Remove deprecated fields
        delete (normalizedProject as any).tagIds;
        delete (normalizedProject as any).sequenceNumber;
        
        console.log('Project data:', normalizedProject);
        projectsData.push(normalizedProject as Project);
      });
      console.log('Setting projects:', projectsData);
      setProjects(projectsData);
      setLoading(false);
    }, (error) => {
      console.error('Error loading projects:', error);
      setLoading(false);
    });

    const clientsQ = query(collection(db, 'clients'));
    const unsubscribeClients = onSnapshot(clientsQ, (querySnapshot) => {
      const clientsData: Client[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log('Client data:', { id: doc.id, ...data });
        clientsData.push({ id: doc.id, ...data } as Client);
      });
      console.log('Setting clients:', clientsData);
      setClients(clientsData);
    }, (error) => {
      console.error('Error loading clients:', error);
    });

    return () => {
      unsubscribe();
      unsubscribeClients();
    };
  }, []);

  const { cities, teamMembers } = useMemo(() => {
    const citiesSet = new Set<string>();
    const teamMembersSet = new Set<string>();

    projects.forEach((project) => {
      if (project.location?.city) {
        citiesSet.add(project.location.city);
      }
      if (project.team) {
        Object.values(project.team).forEach((member) => {
          if (member.role) {
            teamMembersSet.add(member.role);
          }
        });
      }
    });

    return {
      cities: Array.from(citiesSet).sort(),
      teamMembers: Array.from(teamMembersSet).sort(),
    };
  }, [projects]);

  const filteredAndSortedProjects = useMemo(() => {
    console.log('Filtering and sorting projects:', { projects, filters, sort });
    const filteredProjects = projects.filter(project => {
      // Apply search filter
      if (filters.searchQuery && !project.name?.toLowerCase().includes(filters.searchQuery.toLowerCase())) {
        return false;
      }

      // Apply status filter
      if (filters.status && filters.status.length > 0 && !filters.status.includes(project.status)) {
        return false;
      }

      // Apply city filter
      if (filters.city && project.location?.city !== filters.city) {
        return false;
      }

      // Apply date range filter
      if (filters.dateRange.start && project.executionDate?.date) {
        const projectDate = new Date(project.executionDate.date);
        if (projectDate < filters.dateRange.start) {
          return false;
        }
      }

      if (filters.dateRange.end && project.executionDate?.date) {
        const projectDate = new Date(project.executionDate.date);
        if (projectDate > filters.dateRange.end) {
          return false;
        }
      }

      // Apply team member filter
      if (filters.teamMember && project.team && !Object.values(project.team).some(member => member.role === filters.teamMember)) {
        return false;
      }

      return true;
    });

    // Apply sorting
    if (sort.field) {
      return [...filteredProjects].sort((a, b) => {
        let aValue = sort.field === 'client' 
          ? clients.find(c => c.id === a.clientId)?.basicInfo?.name || ''
          : sort.field === 'city'
            ? a.location?.city || ''
            : a[sort.field as keyof typeof a] || '';
        let bValue = sort.field === 'client'
          ? clients.find(c => c.id === b.clientId)?.basicInfo?.name || ''
          : sort.field === 'city'
            ? b.location?.city || ''
            : b[sort.field as keyof typeof b] || '';

        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();

        if (aValue < bValue) return sort.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sort.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filteredProjects;
  }, [projects, filters, sort, clients]);

  const extendedUiConfig = useMemo(() => {
    return {
      ...uiConfig,
      filters,
      onFiltersChange: setFilters
    };
  }, [uiConfig, filters]);

  const handleProjectSave = async (project: Project): Promise<void> => {
    try {
      console.log('Saving project:', project);
      
      // Preveri, ali je projekt že v bazi
      if ('id' in project && project.id) {
        // Posodobi obstoječ projekt
        console.log('Updating existing project:', project.id);
        const projectRef = doc(db, 'projects', project.id);
        
        // Posodobi zgodovino statusov, če se je status spremenil
        const docSnap = await getDoc(projectRef);
        if (docSnap.exists()) {
          const existingProject = docSnap.data() as Project;
          
          if (existingProject.status !== project.status) {
            console.log(`Status changed from ${existingProject.status} to ${project.status}`);
            
            // Ustvari nov vnos v zgodovini statusov
            const statusHistoryItem: ProjectStatusHistoryItem = {
              timestamp: Timestamp.fromDate(new Date()),
              oldStatus: existingProject.status,
              newStatus: project.status
            };
            
            // Dodaj v polje statusHistory ali ustvari novo, če ne obstaja
            const statusHistory = existingProject.statusHistory || [];
            statusHistory.push(statusHistoryItem);
            
            // Dodaj lastUpdated polje
            const updateData = {
              ...project,
              statusHistory,
              lastUpdated: Timestamp.fromDate(new Date())
            };
            
            await updateDoc(projectRef, updateData);
          } else {
            // Če se status ni spremenil, samo posodobi projekt
            await updateDoc(projectRef, {
              ...project,
              lastUpdated: Timestamp.fromDate(new Date())
            });
          }
        }
        
        // Zapri obrazec po uspešni posodobitvi
        setShowProjectForm(false);
        setSelectedProject(null);
      } else {
        // Ustvari nov projekt
        console.log('Creating new project');
        const projectsRef = collection(db, 'projects');
        
        // Dodaj začetno zgodovino statusov
        const statusHistory: ProjectStatusHistoryItem[] = [{
          timestamp: Timestamp.fromDate(new Date()),
          oldStatus: null,
          newStatus: project.status
        }];
        
        // Dodaj potrebna polja za nov projekt
        const newProject = {
          ...project,
          statusHistory,
          createdAt: Timestamp.fromDate(new Date()),
          lastUpdated: Timestamp.fromDate(new Date())
        };
        
        // Odstrani polje id, če obstaja, saj ga bo generiral Firestore
        if ('id' in newProject && newProject.id === undefined) {
          delete newProject.id;
        }
        
        // Odstrani vsa nedefinirana polja
        Object.keys(newProject).forEach(key => {
          if (newProject[key] === undefined) {
            console.log(`Odstranjevanje nedefiniranega polja: ${key}`);
            delete newProject[key];
          }
        });
        
        console.log('Shranjevanje projekta:', newProject);
        const docRef = await addDoc(projectsRef, newProject);
        console.log('New project created with ID:', docRef.id);
        
        // Zapri obrazec po uspešnem ustvarjanju
        setShowProjectForm(false);
        setSelectedProject(null);
      }
    } catch (error) {
      console.error('Error saving project:', error);
      // Zapri obrazec tudi v primeru napake
      setShowProjectForm(false);
      setSelectedProject(null);
      throw error;
    }
  };

  const handleProjectDelete = async (projectId: string) => {
    try {
      if (!confirm('Ali ste prepričani, da želite izbrisati ta projekt?')) {
        return;
      }

      console.log('Brišem projekt:', projectId);
      const projectRef = doc(db, 'projects', projectId);
      await deleteDoc(projectRef);
      setShowProjectForm(false);
      setSelectedProject(null);
      console.log('Projekt uspešno izbrisan');
    } catch (error) {
      console.error('Napaka pri brisanju projekta:', error);
      throw error;
    }
  };

  const handleRenameColumn = async (columnIndex: number, newTitle: string) => {
    try {
      const newColumns = [...uiConfig.kanban.columns];
      newColumns[columnIndex] = {
        ...newColumns[columnIndex],
        title: newTitle
      };
      
      const configRef = doc(db, 'config', 'ui');
      await updateDoc(configRef, {
        'kanban.columns': newColumns
      });
    } catch (error) {
      console.error('Napaka pri preimenovanju stolpca:', error);
    }
  };

  const handleDeleteColumn = async (columnIndex: number) => {
    try {
      if (!confirm('Ali ste prepričani, da želite izbrisati to fazo? Vsi projekti v tej fazi bodo ostali brez faze.')) {
        return;
      }

      const newColumns = [...uiConfig.kanban.columns];
      newColumns.splice(columnIndex, 1);
      
      const configRef = doc(db, 'config', 'ui');
      await updateDoc(configRef, {
        'kanban.columns': newColumns
      });
    } catch (error) {
      console.error('Napaka pri brisanju stolpca:', error);
    }
  };

  const handleUpdateKanbanConfigFromUIConfig = async (config: KanbanConfig) => {
    try {
      const configRef = doc(db, 'uiConfig', 'default');
      await updateDoc(configRef, {
        kanban: {
          columns: config.columns.map(column => ({
            id: column.id,
            name: column.name,
            status: column.status,
            title: column.title,
            color: column.color,
            subcategories: column.subcategories
          })),
          defaultColumn: config.defaultColumn
        }
      });
    } catch (error) {
      console.error('Napaka pri posodabljanju kanban konfiguracije:', error);
    }
  };

  // Pretvorba UI konfiguracije v Kanban konfiguracijo
  const kanbanConfig = useMemo(() => {
    if (!uiConfig?.kanban) return { columns: [], defaultColumn: '' };
    
    return {
      columns: uiConfig.kanban.columns.map(column => ({
        id: column.status,
        title: column.title,
        name: column.title,
        status: column.status,
        color: column.status === 'DRAFT' ? 'bg-gray-500' : 
               column.status === 'IN_PROGRESS' ? 'bg-blue-500' : 
               column.status === 'COMPLETED' ? 'bg-green-500' : 
               column.status === 'CANCELLED' ? 'bg-red-500' : 'bg-gray-500',
        subcategories: column.subcategories
      })),
      defaultColumn: uiConfig.kanban.defaultColumn || 'DRAFT'
    };
  }, [uiConfig]);

  // Funkcija za posodobitev zgodovine statusa pri premikanju projekta
  const updateStatusHistory = async (project: Project, sourceColumnId: string, destColumnId: string) => {
    try {
      // Najdi ustrezne statuse iz ID-jev stolpcev
      const sourceColumn = kanbanConfig.columns.find(col => col.status === sourceColumnId);
      const destColumn = kanbanConfig.columns.find(col => col.status === destColumnId);
      
      if (!sourceColumn || !destColumn) {
        console.error('Stolpec ni najden:', { sourceColumnId, destColumnId });
        return;
      }

      // Ustvari nov zapis v zgodovini
      const statusHistoryItem: ProjectStatusHistoryItem = {
        timestamp: Timestamp.fromDate(new Date()),
        oldStatus: sourceColumn.status as ProjectStatus,
        newStatus: destColumn.status as ProjectStatus,
        userId: 'user' // TODO: Add real user ID
      };
      
      // Pridobi trenutni projekt iz baze
      const projectRef = doc(db, 'projects', project.id);
      const projectDoc = await getDoc(projectRef);
      
      if (projectDoc.exists()) {
        const currentProject = projectDoc.data() as Project;
        
        // Dodaj novo zgodovino k obstoječi ali ustvari novo polje
        const statusHistory = currentProject.statusHistory || [];
        statusHistory.push(statusHistoryItem);
        
        // Sledi, v katerih stolpcih je projekt že bil
        const visitedStatuses = currentProject.visitedStatuses || {};
        
        // Označi, da je projekt bil v izvornem in ciljnem stolpcu
        visitedStatuses[sourceColumn.status] = true;
        visitedStatuses[destColumn.status] = true;
        
        // Posodobi projekt v bazi
        await updateDoc(projectRef, { 
          statusHistory,
          status: destColumn.status,
          subcategoryId: project.subcategoryId, // Dodana vrstica za posodobitev subcategoryId
          lastUpdated: Timestamp.fromDate(new Date()),
          visitedStatuses
        });
        
        console.log('Posodobljena zgodovina statusa:', statusHistory);
        console.log('Posodobljen subcategoryId:', project.subcategoryId); // Dodana vrstica za debug
        
        // Posodobi projekt v lokalnem stanju za takojšnjo posodobitev UI
        const updatedProjects = projects.map(p => {
          if (p.id === project.id) {
            return {
              ...p, // Najprej ohrani vse lastnosti trenutnega projekta v seznamu
              status: destColumn.status as ProjectStatus,
              subcategoryId: project.subcategoryId, // Dodana vrstica za posodobitev subcategoryId v lokalnem stanju
              statusHistory,
              visitedStatuses,
              lastUpdated: Timestamp.fromDate(new Date())
            };
          }
          return p;
        });
        
        // Posodobi lokalno stanje
        setProjects(updatedProjects);
      }
    } catch (error) {
      console.error('Napaka pri posodabljanju zgodovine statusa:', error);
    }
  };

  // Funkcije za odpiranje/zapiranje vseh projektov
  const expandAllProjects = () => {
    const expanded: Record<string, boolean> = {};
    projects.forEach(project => {
      expanded[project.id] = true;
    });
    setExpandedProjects(expanded);
  };

  const collapseAllProjects = () => {
    setExpandedProjects({});
  };

  const toggleProjectExpand = (projectId: string) => {
    setExpandedProjects(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div>
      {/* 1.1 Header */}
      <AppHeader />
      
      {/* 1.2 Vsebina strani */}
      <div className="container mx-auto px-4 py-8">
        {/* 1.2.1 Glava strani */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Projekti</h1>
        </div>

        {/* 2. Statistika */}
        <div className="mb-6">
          <ProjectStats projects={filteredAndSortedProjects} />
        </div>

        {/* 3. Kanban tabla ali seznam */}
        {view === 'kanban' && (
          <ProjectKanban
            projects={filteredAndSortedProjects}
            clients={clients}
            kanbanConfig={kanbanConfig}
            onProjectUpdate={handleProjectSave as (project: Project) => Promise<Project | null>}
            onProjectClick={project => {
              setSelectedProject(project);
              setShowProjectForm(true);
            }}
            onConfigUpdate={handleUpdateKanbanConfigFromUIConfig}
            uiConfig={extendedUiConfig}
            onAddProject={() => {
              setSelectedProject(null);
              setShowProjectForm(true);
            }}
            expandedProjects={expandedProjects}
            onToggleExpand={toggleProjectExpand}
            renderFilters={() => (
              <ProjectFiltersComponent
                filters={filters}
                onFiltersChange={setFilters}
                sort={sort}
                onSortChange={setSort}
                cities={cities}
                teamMembers={teamMembers}
              />
            )}
            additionalData={{
              expandAllItems: expandAllProjects,
              collapseAllItems: collapseAllProjects,
              updateStatusHistory: updateStatusHistory
            }}
          />
        ) || (
          <ProjectList
            projects={filteredAndSortedProjects}
            onProjectClick={project => {
              setSelectedProject(project);
              setShowProjectForm(true);
            }}
            clients={clients}
            uiConfig={uiConfig}
            expandedProjects={expandedProjects}
            onToggleExpand={toggleProjectExpand}
          />
        )}

        {/* Modal za nastavitve stolpcev */}
        {showColumnSettings && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-[800px] max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Nastavitve faz</h2>
                <button
                  onClick={() => setShowColumnSettings(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Seznam stolpcev z dodatnimi fazami */}
                <div className="space-y-4">
                  {uiConfig.kanban.columns.map((column, columnIndex) => (
                    <div
                      key={column.status}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4 flex-1">
                          <input
                            type="text"
                            value={column.title}
                            onChange={(e) => handleRenameColumn(columnIndex, e.target.value)}
                            className="text-lg font-medium bg-transparent border-none focus:ring-0 flex-1"
                          />
                          <button
                            onClick={() => handleDeleteColumn(columnIndex)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {column.subcategories?.map((subcategory, subIndex) => (
                          <div
                            key={subcategory.id}
                            className="flex items-center justify-between"
                          >
                            <input
                              type="text"
                              value={subcategory.title}
                              onChange={(e) => {
                                const newColumns = [...uiConfig.kanban.columns];
                                if (newColumns[columnIndex].subcategories) {
                                  newColumns[columnIndex].subcategories[subIndex].title = e.target.value;
                                  handleUpdateKanbanConfigFromUIConfig({ 
                                    columns: newColumns,
                                    defaultColumn: uiConfig.kanban.defaultColumn
                                  });
                                }
                              }}
                              className="bg-transparent border-none focus:ring-0"
                            />
                            <button
                              onClick={() => {
                                const newColumns = [...uiConfig.kanban.columns];
                                if (newColumns[columnIndex].subcategories) {
                                  newColumns[columnIndex].subcategories.splice(subIndex, 1);
                                  handleUpdateKanbanConfigFromUIConfig({ 
                                    columns: newColumns,
                                    defaultColumn: uiConfig.kanban.defaultColumn
                                  });
                                }
                              }}
                              className="text-red-500 hover:text-red-700"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => {
                            const newColumns = [...uiConfig.kanban.columns];
                            if (!newColumns[columnIndex].subcategories) {
                              newColumns[columnIndex].subcategories = [];
                            }
                            newColumns[columnIndex].subcategories.push({
                              id: `SUB_${Date.now()}`,
                              title: 'Nova podfaza',
                              status: newColumns[columnIndex].status // Dodamo status iz nadrejenega stolpca
                            });
                            handleUpdateKanbanConfigFromUIConfig({ 
                              columns: newColumns,
                              defaultColumn: uiConfig.kanban.defaultColumn // Dodamo defaultColumn
                            });
                          }}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          + Dodaj podfazo
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Gumbi za dodajanje novih stolpcev */}
                <div className="flex justify-end gap-4">
                  <button
                    onClick={() => {
                      const newColumn = {
                        id: `COL_${Date.now()}`,
                        title: 'Nov stolpec',
                        name: 'Nov stolpec',
                        status: 'DRAFT' as ProjectStatus,
                        color: '#3B82F6',
                        subcategories: []
                      };
                      handleUpdateKanbanConfigFromUIConfig({ 
                        columns: [...uiConfig.kanban.columns, newColumn],
                        defaultColumn: uiConfig.kanban.defaultColumn
                      });
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    Dodaj nov stolpec
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showProjectForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <ProjectForm
                project={selectedProject}
                onClose={() => setShowProjectForm(false)}
                onSave={handleProjectSave}
                onDelete={handleProjectDelete}
                uiConfig={uiConfig}
                clients={clients}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectsPage;