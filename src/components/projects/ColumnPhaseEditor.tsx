import React, { useState } from 'react';
import { PencilIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { KanbanColumn } from '../../types/ui';
import { Project } from '../../types/project';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

interface ColumnPhaseEditorProps {
  column: KanbanColumn;
  columnIndex: number;
  projects: Project[];
  onUpdateColumn: (columnIndex: number, updatedColumn: KanbanColumn) => Promise<void>;
}

const ColumnPhaseEditor: React.FC<ColumnPhaseEditorProps> = ({
  column,
  columnIndex,
  projects,
  onUpdateColumn
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingPhases, setEditingPhases] = useState(column.subcategories || []);

  const handleSave = async () => {
    const updatedColumn = {
      ...column,
      subcategories: editingPhases
    };
    await onUpdateColumn(columnIndex, updatedColumn);
    setIsEditing(false);
  };

  const handleDeletePhase = async (phaseIndex: number) => {
    const phaseToDelete = editingPhases[phaseIndex];
    
    // Preveri če je to zadnja faza
    if (editingPhases.length <= 1) {
      alert('Stolpec mora imeti vsaj eno fazo!');
      return;
    }

    // Najdi projekte v tej fazi
    const projectsInPhase = projects.filter(p => p.status === column.status && p.subcategoryId === phaseToDelete.id);

    // Določi novo fazo za projekte
    let newPhaseId: string | null = null;
    if (projectsInPhase.length > 0) {
      if (phaseIndex > 0) {
        // Prestavi na prejšnjo fazo
        newPhaseId = editingPhases[phaseIndex - 1].id;
      } else if (phaseIndex < editingPhases.length - 1) {
        // Prestavi na naslednjo fazo
        newPhaseId = editingPhases[phaseIndex + 1].id;
      }
    }

    // Posodobi faze
    const newPhases = [...editingPhases];
    newPhases.splice(phaseIndex, 1);
    setEditingPhases(newPhases);

    // Posodobi projekte v Firebase
    if (projectsInPhase.length > 0 && newPhaseId) {
      try {
        await Promise.all(projectsInPhase.map(async (project) => {
          const projectRef = doc(db, 'projects', project.id);
          await updateDoc(projectRef, {
            subcategoryId: newPhaseId,
            lastUpdated: new Date()
          });
          console.log(`Projekt ${project.id} prestavljen v fazo ${newPhaseId}`);
        }));
      } catch (error) {
        console.error('Napaka pri prestavljanju projektov:', error);
      }
    }
  };

  const handleAddPhase = () => {
    setEditingPhases([
      ...editingPhases,
      {
        id: `PHASE_${Date.now()}`,
        title: 'Nova faza'
      }
    ]);
  };

  if (!isEditing) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className="w-full mt-4 p-2 text-gray-500 hover:text-gray-700 flex items-center justify-center gap-2 rounded-md hover:bg-gray-50"
      >
        <PencilIcon className="w-4 h-4" />
        <span className="text-sm">Uredi faze</span>
      </button>
    );
  }

  return (
    <div className="mt-4 p-4 border-t border-gray-200">
      <div className="space-y-2">
        {editingPhases.map((phase, index) => (
          <div key={phase.id} className="flex items-center gap-2">
            <input
              type="text"
              value={phase.title}
              onChange={(e) => {
                const newPhases = [...editingPhases];
                newPhases[index] = { ...phase, title: e.target.value };
                setEditingPhases(newPhases);
              }}
              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-md"
            />
            <button
              onClick={() => handleDeletePhase(index)}
              className="p-1 text-red-500 hover:text-red-700"
              title="Izbriši fazo"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={handleAddPhase}
          className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          <PlusIcon className="w-4 h-4" />
          Dodaj fazo
        </button>
        <button
          onClick={handleSave}
          className="px-3 py-1 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          Shrani
        </button>
        <button
          onClick={() => setIsEditing(false)}
          className="px-3 py-1 text-sm text-gray-600 hover:text-gray-700"
        >
          Prekliči
        </button>
      </div>
    </div>
  );
};

export default ColumnPhaseEditor;
