/**** začetek razdelka 1 - imports ****/
import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { Project } from '../../types/project';
/**** konec razdelka 1 ****/

/**** začetek razdelka 2 - interfaces ****/
interface KanbanBoardProps {
    projects: Project[];
    onProjectUpdate: () => void;
}

type ProjectStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

interface KanbanColumn {
    id: string;
    title: string;
    status: ProjectStatus;
}

const COLUMNS: KanbanColumn[] = [
    { id: 'draft', title: 'V pripravi', status: 'DRAFT' },
    { id: 'in-progress', title: 'V izvajanju', status: 'IN_PROGRESS' },
    { id: 'completed', title: 'Zaključeno', status: 'COMPLETED' },
    { id: 'cancelled', title: 'Preklicano', status: 'CANCELLED' }
];
/**** konec razdelka 2 ****/

/**** začetek razdelka 3 - component ****/
const KanbanBoard: React.FC<KanbanBoardProps> = ({ projects = [], onProjectUpdate }) => {
    const getColumnProjects = (status: ProjectStatus): Project[] => {
        if (!Array.isArray(projects)) return [];
        return projects.filter(project => project.status === status);
    };

    const handleDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result;

        // Če ni veljavne destinacije, prekini
        if (!destination) return;

        // Če je destinacija ista kot izvor, prekini
        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return;
        }

        // Najdi ciljni status
        const targetColumn = COLUMNS.find(col => col.id === destination.droppableId);
        if (!targetColumn) return;

        try {
            await updateDoc(doc(db, 'projects', draggableId), {
                status: targetColumn.status,
                lastUpdated: new Date()
            });
            
            onProjectUpdate();
        } catch (error) {
            console.error('Error updating project status:', error);
        }
    };
/**** konec razdelka 3 ****/

/**** začetek razdelka 4 - render ****/
    return (
        <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex gap-4 overflow-x-auto pb-4">
                {COLUMNS.map(column => (
                    <div key={column.id} className="flex-1 min-w-[300px]">
                        <h3 className="font-semibold mb-4 text-gray-700">
                            {column.title}
                        </h3>
                        <Droppable droppableId={column.id}>
                            {(provided) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className="bg-gray-100 p-4 rounded-lg min-h-[500px]"
                                >
                                    {getColumnProjects(column.status).map((project, index) => (
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
                                                    className={`
                                                        bg-white p-4 mb-3 rounded-lg shadow
                                                        ${snapshot.isDragging ? 'shadow-lg bg-blue-50' : ''}
                                                        hover:shadow-md transition-all duration-200
                                                    `}
                                                >
                                                    <h4 className="font-medium text-gray-800">
                                                        {project.name}
                                                    </h4>
                                                    {project.description && (
                                                        <p className="text-sm text-gray-600 mt-1 truncate">
                                                            {project.description}
                                                        </p>
                                                    )}
                                                    <div className="mt-2 text-xs text-gray-500">
                                                        {project.location.city}
                                                    </div>
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
            </div>
        </DragDropContext>
    );
};

export default KanbanBoard;
/**** konec razdelka 4 ****/