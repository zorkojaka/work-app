/**** začetek razdelka 1 - imports ****/
import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { Project } from '../../types/project';
/**** konec razdelka 1 ****/

/**** začetek razdelka 2 - interfaces ****/
interface KanbanBoardProps {
    projects: Project[];
    onProjectUpdate: () => void;
}

interface Column {
    id: string;
    title: string;
    status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED';
    items: Project[];
}
/**** konec razdelka 2 ****/

/**** začetek razdelka 3 - component ****/
const KanbanBoard: React.FC<KanbanBoardProps> = ({ projects, onProjectUpdate }) => {
    const [columns, setColumns] = useState<Column[]>([
        { id: 'draft', title: 'V pripravi', status: 'DRAFT', items: [] },
        { id: 'progress', title: 'V izvajanju', status: 'IN_PROGRESS', items: [] },
        { id: 'completed', title: 'Zaključeno', status: 'COMPLETED', items: [] }
    ]);

    useEffect(() => {
        // Razporedi projekte v ustrezne stolpce
        const newColumns = columns.map(col => ({
            ...col,
            items: projects.filter(project => project.status === col.status)
        }));
        setColumns(newColumns);
    }, [projects]);

    const onDragEnd = async (result: any) => {
        if (!result.destination) return;

        const { source, destination, draggableId } = result;

        if (source.droppableId === destination.droppableId) {
            // Premik znotraj istega stolpca
            const column = columns.find(col => col.id === source.droppableId);
            if (!column) return;

            const items = Array.from(column.items);
            const [removed] = items.splice(source.index, 1);
            items.splice(destination.index, 0, removed);

            setColumns(columns.map(col =>
                col.id === source.droppableId ? { ...col, items } : col
            ));
        } else {
            // Premik med stolpci
            const sourceColumn = columns.find(col => col.id === source.droppableId);
            const destColumn = columns.find(col => col.id === destination.droppableId);
            if (!sourceColumn || !destColumn) return;

            // Posodobi Firestore
            try {
                const projectRef = doc(db, 'projects', draggableId);
                await updateDoc(projectRef, {
                    status: destColumn.status
                });

                // Posodobi lokalno stanje
                const sourceItems = Array.from(sourceColumn.items);
                const destItems = Array.from(destColumn.items);
                const [removed] = sourceItems.splice(source.index, 1);
                destItems.splice(destination.index, 0, { ...removed, status: destColumn.status });

                setColumns(columns.map(col => {
                    if (col.id === source.droppableId) {
                        return { ...col, items: sourceItems };
                    }
                    if (col.id === destination.droppableId) {
                        return { ...col, items: destItems };
                    }
                    return col;
                }));

                onProjectUpdate();
            } catch (error) {
                console.error('Error updating project status:', error);
            }
        }
    };
/**** konec razdelka 3 ****/

/**** začetek razdelka 4 - render ****/
    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-4 overflow-x-auto pb-4">
                {columns.map(column => (
                    <div key={column.id} className="flex-1 min-w-[300px]">
                        <h3 className="font-semibold mb-4 text-gray-700">{column.title}</h3>
                        <Droppable droppableId={column.id}>
                            {(provided) => (
                                <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    className="bg-gray-100 p-4 rounded-lg min-h-[500px]"
                                >
                                    {column.items.map((project, index) => (
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
                                                    className={`bg-white p-4 mb-3 rounded-lg shadow-sm ${
                                                        snapshot.isDragging ? 'shadow-lg' : ''
                                                    }`}
                                                >
                                                    <h4 className="font-medium text-gray-800">{project.name}</h4>
                                                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                                        {project.description}
                                                    </p>
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