// components/projects/ProjectTaskBoard.tsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../../firebaseConfig';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  addDoc, 
  Timestamp, 
  writeBatch 
} from 'firebase/firestore';
import { useAuth } from '../auth/AuthProvider';
import { Project } from '../../types/project';
import { ProjectTask, TaskColumn, ProjectBoard, TaskStatus } from '../../types/projectTask';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

// 1. KOMPONENTA ZA PRIKAZ KANBAN TABLE NALOG PROJEKTA
const ProjectTaskBoard: React.FC = () => {
  // 1.1 Stanje in hooki
  const { projectId } = useParams<{ projectId: string }>();
  const { user, activeRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<Project | null>(null);
  const [board, setBoard] = useState<ProjectBoard>({ columns: [], projectId: projectId || '' });
  const [error, setError] = useState<string | null>(null);
  const [isManager, setIsManager] = useState(false);
  
  // 1.2 Nalaganje podatkov o projektu in nalogah
  useEffect(() => {
    if (!projectId || !user) return;
    
    const fetchProjectAndTasks = async () => {
      try {
        setLoading(true);
        
        // Pridobi podatke o projektu
        const projectRef = doc(db, 'projects', projectId);
        const projectSnapshot = await getDoc(projectRef);
        
        if (!projectSnapshot.exists()) {
          setError('Projekt ne obstaja');
          setLoading(false);
          return;
        }
        
        const projectData = { ...projectSnapshot.data(), id: projectSnapshot.id } as Project;
        setProject(projectData);
        
        // Preveri, če je uporabnik vodja projekta
        setIsManager(projectData.projectManager?.id === user.uid || activeRole === 'DIRECTOR' || activeRole === 'ADMIN');
        
        // Pridobi stolpce za projekt
        const columnsRef = collection(db, 'projects', projectId, 'columns');
        const columnsQuery = query(columnsRef, orderBy('order', 'asc'));
        const columnsSnapshot = await getDocs(columnsQuery);
        
        const columns: TaskColumn[] = [];
        
        // Če ni stolpcev, ustvari privzete
        if (columnsSnapshot.empty && (activeRole === 'DIRECTOR' || activeRole === 'ADMIN' || projectData.projectManager?.id === user.uid)) {
          await createDefaultColumns(projectId);
          // Ponovno naloži stolpce
          const newColumnsSnapshot = await getDocs(columnsQuery);
          newColumnsSnapshot.forEach(doc => {
            columns.push({ ...doc.data(), id: doc.id, tasks: [] } as TaskColumn);
          });
        } else {
          columnsSnapshot.forEach(doc => {
            columns.push({ ...doc.data(), id: doc.id, tasks: [] } as TaskColumn);
          });
        }
        
        // Pridobi naloge za projekt
        const tasksRef = collection(db, 'projects', projectId, 'tasks');
        const tasksSnapshot = await getDocs(tasksRef);
        
        const tasks: ProjectTask[] = [];
        tasksSnapshot.forEach(doc => {
          tasks.push({ ...doc.data(), id: doc.id } as ProjectTask);
        });
        
        // Razvrsti naloge v ustrezne stolpce
        tasks.forEach(task => {
          const columnId = task.column;
          if (columnId) {
            const column = columns.find(col => col.id === columnId);
            if (column) {
              column.tasks.push(task);
            }
          }
        });
        
        // Razvrsti naloge znotraj stolpcev po vrstnem redu
        columns.forEach(column => {
          column.tasks.sort((a, b) => (a.order || 0) - (b.order || 0));
        });
        
        setBoard({ columns, projectId });
        setLoading(false);
      } catch (error) {
        console.error('Napaka pri nalaganju projekta in nalog:', error);
        setError('Napaka pri nalaganju projekta in nalog');
        setLoading(false);
      }
    };
    
    fetchProjectAndTasks();
  }, [projectId, user, activeRole]);
  
  // 1.3 Ustvarjanje privzetih stolpcev
  const createDefaultColumns = async (projectId: string) => {
    try {
      const batch = writeBatch(db);
      const columnsRef = collection(db, 'projects', projectId, 'columns');
      
      const defaultColumns = [
        { title: 'Za narediti', order: 0 },
        { title: 'V izvajanju', order: 1 },
        { title: 'Pregled', order: 2 },
        { title: 'Zaključeno', order: 3 }
      ];
      
      for (const column of defaultColumns) {
        const newColumnRef = doc(columnsRef);
        batch.set(newColumnRef, {
          ...column,
          createdAt: Timestamp.now()
        });
      }
      
      await batch.commit();
      console.log('Ustvarjeni privzeti stolpci');
    } catch (error) {
      console.error('Napaka pri ustvarjanju privzetih stolpcev:', error);
      throw error;
    }
  };
  
  // 1.4 Dodajanje nove naloge
  const handleAddTask = async (columnId: string) => {
    if (!projectId || !user) return;
    
    try {
      const tasksRef = collection(db, 'projects', projectId, 'tasks');
      const column = board.columns.find(col => col.id === columnId);
      
      if (!column) return;
      
      // Določi naslednji vrstni red v stolpcu
      const order = column.tasks.length;
      
      // Ustvari novo nalogo
      const newTask: Partial<ProjectTask> = {
        projectId,
        title: 'Nova naloga',
        description: '',
        status: 'TODO' as TaskStatus,
        priority: 'MEDIUM',
        column: columnId,
        order,
        createdBy: user.uid,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      const docRef = await addDoc(tasksRef, newTask);
      
      // Posodobi stanje
      const updatedColumns = [...board.columns];
      const columnIndex = updatedColumns.findIndex(col => col.id === columnId);
      
      if (columnIndex !== -1) {
        updatedColumns[columnIndex].tasks.push({
          ...newTask,
          id: docRef.id
        } as ProjectTask);
        
        setBoard({
          ...board,
          columns: updatedColumns
        });
      }
    } catch (error) {
      console.error('Napaka pri dodajanju naloge:', error);
    }
  };
  
  // 1.5 Premikanje nalog med stolpci
  const handleDragEnd = async (result: DropResult) => {
    const { source, destination } = result;
    
    // Če ni cilja ali je isti kot izvor, ne naredi nič
    if (!destination || (source.droppableId === destination.droppableId && source.index === destination.index)) {
      return;
    }
    
    try {
      // Kopiraj obstoječe stolpce
      const updatedColumns = [...board.columns];
      
      // Najdi izvorni in ciljni stolpec
      const sourceColumnIndex = updatedColumns.findIndex(col => col.id === source.droppableId);
      const destColumnIndex = updatedColumns.findIndex(col => col.id === destination.droppableId);
      
      if (sourceColumnIndex === -1 || destColumnIndex === -1) return;
      
      // Kopiraj naloge iz izvornega in ciljnega stolpca
      const sourceTasks = [...updatedColumns[sourceColumnIndex].tasks];
      const destTasks = sourceColumnIndex === destColumnIndex ? 
        sourceTasks : [...updatedColumns[destColumnIndex].tasks];
      
      // Odstrani nalogo iz izvornega stolpca
      const [movedTask] = sourceTasks.splice(source.index, 1);
      
      // Vstavi nalogo v ciljni stolpec
      destTasks.splice(destination.index, 0, movedTask);
      
      // Posodobi vrstni red nalog v ciljnem stolpcu
      destTasks.forEach((task, index) => {
        task.order = index;
      });
      
      // Posodobi stolpce
      if (sourceColumnIndex === destColumnIndex) {
        updatedColumns[sourceColumnIndex].tasks = destTasks;
      } else {
        updatedColumns[sourceColumnIndex].tasks = sourceTasks;
        updatedColumns[destColumnIndex].tasks = destTasks;
        
        // Posodobi stolpec naloge v Firestore
        const taskRef = doc(db, 'projects', projectId || '', 'tasks', movedTask.id || '');
        await updateDoc(taskRef, {
          column: destination.droppableId,
          order: destination.index,
          updatedAt: Timestamp.now()
        });
      }
      
      // Posodobi vrstni red nalog v Firestore
      for (const task of destTasks) {
        if (task.id) {
          const taskRef = doc(db, 'projects', projectId || '', 'tasks', task.id);
          await updateDoc(taskRef, {
            order: task.order,
            updatedAt: Timestamp.now()
          });
        }
      }
      
      // Posodobi stanje
      setBoard({
        ...board,
        columns: updatedColumns
      });
    } catch (error) {
      console.error('Napaka pri premikanju naloge:', error);
    }
  };
  
  // 1.6 Prikaz nalaganja
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // 1.7 Prikaz napake
  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Napaka!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }
  
  // 1.8 Prikaz kanban table
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{project?.name} - Naloge</h1>
        
        {isManager && (
          <button 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            onClick={() => {/* TODO: Dodaj funkcionalnost za urejanje stolpcev */}}
          >
            Uredi stolpce
          </button>
        )}
      </div>
      
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex space-x-4 overflow-x-auto pb-4">
          {board.columns.map(column => (
            <div 
              key={column.id} 
              className="bg-gray-100 rounded-lg p-3 min-w-[300px] max-w-[300px]"
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-lg">{column.title}</h3>
                <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs">
                  {column.tasks.length}
                </span>
              </div>
              
              <Droppable droppableId={column.id}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="min-h-[200px]"
                  >
                    {column.tasks.map((task, index) => (
                      <Draggable
                        key={task.id}
                        draggableId={task.id || 'unknown'}
                        index={index}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="bg-white p-3 rounded-lg shadow-sm mb-2 border-l-4 border-blue-500"
                          >
                            <h4 className="font-medium mb-1">{task.title}</h4>
                            {task.description && (
                              <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                {task.description}
                              </p>
                            )}
                            <div className="flex justify-between items-center text-xs">
                              <span className={`px-2 py-1 rounded-full ${
                                task.priority === 'HIGH' || task.priority === 'URGENT' 
                                  ? 'bg-red-100 text-red-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {task.priority}
                              </span>
                              {task.dueDate && (
                                <span className="text-gray-600">
                                  {task.dueDate.toDate().toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
              
              <button
                className="w-full mt-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm text-gray-700 flex items-center justify-center"
                onClick={() => handleAddTask(column.id)}
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                Dodaj nalogo
              </button>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};

export default ProjectTaskBoard;
