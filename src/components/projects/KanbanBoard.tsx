import React, { useState } from 'react';
import { DragDropContext, Droppable, DropResult, Draggable } from '@hello-pangea/dnd';
import { Project, ProjectStatus } from '../../types/project';
import { Client } from '../../types/client';
import { UIConfig, KanbanColumn } from '../../types/ui';
import ProjectCard from './ProjectCard';
import ColumnPhaseEditor from './ColumnPhaseEditor';
import { useProjectStages } from '../../hooks/useProjectStages';
import ProjectStagesSettings from './ProjectStagesSettings';
import { ClipboardDocumentIcon, PlayIcon, CheckIcon, XMarkIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

interface KanbanBoardProps {
    projects: Project[];
    onProjectUpdate: (project: Project) => Promise<void>;
    onProjectClick?: (project: Project) => void;
    clients: Client[];
    uiConfig: UIConfig;
    onUpdateKanbanConfig?: (config: any) => Promise<void>;
    expandedProjects?: Record<string, boolean>;
    onToggleExpand?: (projectId: string) => void;
}

const getColumnIcon = (status: ProjectStatus) => {
    switch (status) {
        case 'DRAFT':
            return <ClipboardDocumentIcon className="w-6 h-6" />;
        case 'IN_PROGRESS':
            return <PlayIcon className="w-6 h-6" />;
        case 'COMPLETED':
            return <CheckIcon className="w-6 h-6" />;
        case 'CANCELLED':
            return <XMarkIcon className="w-6 h-6" />;
        default:
            return null;
    }
};

const KanbanBoard: React.FC<KanbanBoardProps> = ({
    projects = [],
    onProjectUpdate,
    onProjectClick,
    clients = [],
    uiConfig,
    onUpdateKanbanConfig,
    expandedProjects,
    onToggleExpand
}) => {
    // 1. State
    const { kanbanConfig, loading, error } = useProjectStages();
    const [showSettings, setShowSettings] = useState(false);

    if (loading) {
        return <div>Nalaganje...</div>;
    }

    if (error) {
        return <div>Napaka pri nalaganju konfiguracije: {error.message}</div>;
    }

    // 2. Pomožne funkcije za projekte
    const getStageProjects = (status: ProjectStatus, stageId: string) => {
        return projects.filter(project => 
            project.status === status && 
            project.subcategoryId === stageId
        );
    };

    // 3. Upravljanje z drag-and-drop
    const handleDragEnd = async (result: DropResult) => {
        if (!result.destination) return;

        const { draggableId, destination } = result;
        console.log('Drop destination:', destination);
        
        // Uporabimo drugačen separator za droppableId
        // Format: STATUS|PHASE_ID
        const parts = destination.droppableId.split('|');
        const destStatus = parts[0];
        const destPhaseId = parts.length > 1 ? parts[1] : undefined;
        
        console.log('Parsed destination:', { destStatus, destPhaseId });

        // Preveri če je status veljaven
        if (!['DRAFT', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(destStatus)) {
            console.error('Neveljaven status:', destStatus);
            return;
        }

        // Najdi projekt ki ga premikamo
        const project = projects.find(p => p.id === draggableId);
        if (!project) {
            console.error('Projekt ni najden:', draggableId);
            return;
        }

        // Pripravi posodobljen projekt
        const updatedProject: Project = {
            ...project,
            status: destStatus as any,
            subcategoryId: destPhaseId || undefined,
            lastUpdated: Timestamp.fromDate(new Date())
        };

        try {
            // Posodobi v Firebase
            const projectRef = doc(db, 'projects', draggableId);
            await updateDoc(projectRef, {
                status: destStatus as any,
                subcategoryId: destPhaseId || undefined,
                lastUpdated: Timestamp.fromDate(new Date())
            });

            console.log('Projekt posodobljen:', {
                id: updatedProject.id,
                status: updatedProject.status,
                subcategoryId: updatedProject.subcategoryId
            });

            // Posodobi lokalno stanje
            onProjectUpdate?.(updatedProject);
            
        } catch (error) {
            console.error('Napaka pri premikanju projekta:', error);
        }
    };

    // Funkcija za posodobitev stolpca
    const handleUpdateColumn = async (columnIndex: number, updatedColumn: KanbanColumn) => {
        console.log('Posodabljam stolpec:', columnIndex, updatedColumn);
        if (onUpdateKanbanConfig) {
            const newColumns = [...kanbanConfig.columns];
            newColumns[columnIndex] = updatedColumn;
            await onUpdateKanbanConfig({
                ...kanbanConfig,
                columns: newColumns
            });
        }
    };

    // 4. Izris komponente
    return (
        <>
            <div className="flex justify-end mb-4">
                <button
                    onClick={() => setShowSettings(true)}
                    className="flex items-center gap-2 px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                    <Cog6ToothIcon className="w-5 h-5" />
                    <span>Nastavitve faz</span>
                </button>
            </div>

            <DragDropContext onDragEnd={handleDragEnd}>
                <div className="flex gap-4 overflow-x-auto p-4 min-h-[calc(100vh-200px)]">
                    {kanbanConfig.columns.map((column, columnIndex) => {
                        // Določimo barvo glede na status
                        const columnColor = column.status === 'DRAFT' ? 'bg-gray-500' :
                                          column.status === 'IN_PROGRESS' ? 'bg-blue-500' :
                                          column.status === 'COMPLETED' ? 'bg-green-500' :
                                          column.status === 'CANCELLED' ? 'bg-red-500' : 'bg-gray-500';

                        return (
                            <div
                                key={column.status}
                                className="flex-shrink-0 w-80 bg-gray-100 rounded-lg"
                            >
                                {/* 4.1 Glava stolpca */}
                                <div className={`p-3 ${columnColor} text-white rounded-t-lg flex items-center justify-between`}>
                                    <div className="flex items-center gap-2">
                                        {getColumnIcon(column.status)}
                                        <h3 className="font-semibold">{column.title}</h3>
                                    </div>
                                    <span className="text-sm bg-white/20 px-2 py-0.5 rounded-full">
                                        {projects.filter(p => p.status === column.status).length}
                                    </span>
                                </div>

                                {/* 4.2 Vsebina stolpca */}
                                <div className="p-2">
                                    {column.subcategories?.map((stage) => (
                                        <div key={stage.id} className="mb-3">
                                            <h4 className="text-sm font-medium text-gray-700 mb-2 flex justify-between items-center">
                                                <span>{stage.title}</span>
                                                <span className="text-xs text-gray-500">
                                                    {getStageProjects(column.status, stage.id).length}
                                                </span>
                                            </h4>
                                            <Droppable droppableId={`${column.status}|${stage.id}`}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.droppableProps}
                                                        className={`min-h-[100px] rounded-md p-2 ${
                                                            snapshot.isDraggingOver ? 'bg-blue-50' : 'bg-gray-50'
                                                        }`}
                                                    >
                                                        {getStageProjects(column.status, stage.id).map((project, index) => (
                                                            <Draggable
                                                                key={project.id}
                                                                draggableId={project.id}
                                                                index={index}
                                                            >
                                                                {(provided, snapshot) => (
                                                                    <div
                                                                        ref={provided.innerRef}
                                                                        {...provided.draggableProps}
                                                                        {...provided.dragHandleProps}
                                                                        style={{
                                                                            ...provided.draggableProps.style,
                                                                            opacity: snapshot.isDragging ? 0.5 : 1
                                                                        }}
                                                                    >
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
                                                                    </div>
                                                                )}
                                                            </Draggable>
                                                        ))}
                                                        {provided.placeholder}
                                                    </div>
                                                )}
                                            </Droppable>
                                        </div>
                                    ))}
                                    
                                    {/* Dodamo urejevalnik faz na dno stolpca */}
                                    <ColumnPhaseEditor
                                        column={column}
                                        columnIndex={columnIndex}
                                        projects={projects}
                                        onUpdateColumn={handleUpdateColumn}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </DragDropContext>

            {showSettings && (
                <ProjectStagesSettings onClose={() => setShowSettings(false)} />
            )}
        </>
    );
};

export default KanbanBoard;