import React, { useState } from 'react';
import { ProjectStageGroup } from '../../constants/projectStages';
import { useProjectStages } from '../../hooks/useProjectStages';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { PlusIcon, XMarkIcon, ArrowsUpDownIcon } from '@heroicons/react/24/outline';

interface ProjectStagesSettingsProps {
    onClose: () => void;
}

const ProjectStagesSettings: React.FC<ProjectStagesSettingsProps> = ({ onClose }) => {
    const { stages, updateStages } = useProjectStages();
    const [editedStages, setEditedStages] = useState<ProjectStageGroup[]>(stages);

    // 1. Upravljanje s spremembami
    const handleStageChange = (groupIndex: number, stageIndex: number, field: string, value: string) => {
        const newStages = [...editedStages];
        const stage = newStages[groupIndex].stages[stageIndex];
        if (field === 'id') {
            stage.id = value.toLowerCase().replace(/\s+/g, '-');
        } else if (field === 'title') {
            stage.title = value;
        }
        setEditedStages(newStages);
    };

    const handleGroupChange = (groupIndex: number, field: string, value: string) => {
        const newStages = [...editedStages];
        const group = newStages[groupIndex];
        if (field === 'title') {
            group.title = value;
        }
        setEditedStages(newStages);
    };

    // 2. Dodajanje in brisanje
    const addStage = (groupIndex: number) => {
        const newStages = [...editedStages];
        const newId = `nova-faza-${Date.now()}`;
        newStages[groupIndex].stages.push({
            id: newId,
            title: 'Nova faza',
            order: newStages[groupIndex].stages.length + 1
        });
        setEditedStages(newStages);
    };

    const removeStage = (groupIndex: number, stageIndex: number) => {
        const newStages = [...editedStages];
        newStages[groupIndex].stages.splice(stageIndex, 1);
        setEditedStages(newStages);
    };

    // 3. Drag and Drop
    const handleDragEnd = (result: DropResult) => {
        if (!result.destination) return;

        const { source, destination } = result;
        const newStages = [...editedStages];
        
        // Če premikamo znotraj iste skupine
        if (source.droppableId === destination.droppableId) {
            const groupIndex = parseInt(source.droppableId);
            const stages = newStages[groupIndex].stages;
            const [removed] = stages.splice(source.index, 1);
            stages.splice(destination.index, 0, removed);
            
            // Posodobi vrstni red
            stages.forEach((stage, index) => {
                stage.order = index + 1;
            });
        }
        
        setEditedStages(newStages);
    };

    // 4. Shranjevanje
    const handleSave = async () => {
        try {
            await updateStages(editedStages);
            onClose();
        } catch (error) {
            console.error('Error saving stages:', error);
            alert('Napaka pri shranjevanju faz');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-[800px] max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Nastavitve faz projektov</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                <DragDropContext onDragEnd={handleDragEnd}>
                    {editedStages.map((group, groupIndex) => (
                        <div key={group.status} className="mb-8">
                            <div className="flex items-center gap-4 mb-4">
                                <input
                                    type="text"
                                    value={group.title}
                                    onChange={(e) => handleGroupChange(groupIndex, 'title', e.target.value)}
                                    className="text-xl font-semibold bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none"
                                />
                            </div>

                            <Droppable droppableId={groupIndex.toString()}>
                                {(provided) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className="space-y-2"
                                    >
                                        {group.stages.map((stage, stageIndex) => (
                                            <Draggable
                                                key={stage.id}
                                                draggableId={stage.id}
                                                index={stageIndex}
                                            >
                                                {(provided) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg"
                                                    >
                                                        <div {...provided.dragHandleProps} className="cursor-move">
                                                            <ArrowsUpDownIcon className="w-5 h-5 text-gray-400" />
                                                        </div>
                                                        <div className="flex-grow grid grid-cols-2 gap-4">
                                                            <input
                                                                type="text"
                                                                value={stage.id}
                                                                onChange={(e) => handleStageChange(groupIndex, stageIndex, 'id', e.target.value)}
                                                                className="px-3 py-2 border rounded-lg"
                                                                placeholder="ID faze"
                                                            />
                                                            <input
                                                                type="text"
                                                                value={stage.title}
                                                                onChange={(e) => handleStageChange(groupIndex, stageIndex, 'title', e.target.value)}
                                                                className="px-3 py-2 border rounded-lg"
                                                                placeholder="Naziv faze"
                                                            />
                                                        </div>
                                                        <button
                                                            onClick={() => removeStage(groupIndex, stageIndex)}
                                                            className="text-red-500 hover:text-red-700"
                                                        >
                                                            <XMarkIcon className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>

                            <button
                                onClick={() => addStage(groupIndex)}
                                className="mt-4 flex items-center gap-2 text-blue-500 hover:text-blue-700"
                            >
                                <PlusIcon className="w-5 h-5" />
                                <span>Dodaj fazo</span>
                            </button>
                        </div>
                    ))}
                </DragDropContext>

                <div className="flex justify-end gap-4 mt-8">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                    >
                        Prekliči
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600"
                    >
                        Shrani
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProjectStagesSettings;
