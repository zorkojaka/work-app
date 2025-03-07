// pages/ProjectExecutionPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  Timestamp 
} from 'firebase/firestore';
import { useAuth } from '../components/auth/AuthProvider';
import { Project } from '../types/project';
import { ProjectTask, TaskGroup } from '../types/projectTask';
import { User } from '../types/user';
import { KanbanConfig } from '../types/kanban';
import TaskKanban from '../components/tasks/TaskKanban';
import TaskForm from '../components/tasks/TaskForm';
import TaskGroupForm from '../components/tasks/TaskGroupForm';
import AppHeader from '../components/common/AppHeader';
import { 
  ArrowLeftIcon, 
  PlusIcon, 
  FolderPlusIcon,
  DocumentTextIcon
} from '@heroicons/react/24/solid';

// 1. DEFINICIJA TIPOV
interface ProjectExecutionPageProps {}

// 2. POMOŽNE FUNKCIJE
const defaultKanbanConfig: KanbanConfig = {
  columns: [
    { id: 'todo', title: 'Za narediti', status: 'TODO', color: 'bg-gray-100' },
    { id: 'in-progress', title: 'V izvajanju', status: 'IN_PROGRESS', color: 'bg-blue-100' },
    { id: 'review', title: 'V pregledu', status: 'REVIEW', color: 'bg-purple-100' },
    { id: 'done', title: 'Končano', status: 'DONE', color: 'bg-green-100' }
  ],
  defaultColumn: 'todo',
  subcategories: []
};

// 3. GLAVNA KOMPONENTA
const ProjectExecutionPage: React.FC<ProjectExecutionPageProps> = () => {
  // 3.1 STANJE KOMPONENTE
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [taskGroups, setTaskGroups] = useState<TaskGroup[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [kanbanConfig, setKanbanConfig] = useState<KanbanConfig>(defaultKanbanConfig);
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});
  
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState<ProjectTask | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<TaskGroup | null>(null);
  
  // 3.2 PRIDOBIVANJE PODATKOV
  useEffect(() => {
    if (!projectId || !user) return;
    
    const fetchProjectData = async () => {
      try {
        setLoading(true);
        
        // Pridobi projekt
        const projectRef = doc(db, 'projects', projectId);
        const projectSnap = await getDoc(projectRef);
        
        if (!projectSnap.exists()) {
          setError('Projekt ne obstaja');
          setLoading(false);
          return;
        }
        
        const projectData = { ...projectSnap.data(), id: projectSnap.id } as Project;
        setProject(projectData);
        
        // Pridobi skupine nalog
        const taskGroupsRef = collection(db, 'projects', projectId, 'taskGroups');
        const taskGroupsSnap = await getDocs(taskGroupsRef);
        
        const taskGroupsData: TaskGroup[] = [];
        taskGroupsSnap.forEach(doc => {
          taskGroupsData.push({ ...doc.data(), id: doc.id } as TaskGroup);
        });
        
        setTaskGroups(taskGroupsData);
        
        // Posodobi kanban konfiguracijo s skupinami nalog
        setKanbanConfig(prev => ({
          ...prev,
          subcategories: taskGroupsData.map(group => ({
            id: group.id || '',
            title: group.title || '',
            color: group.color || 'bg-gray-100'
          }))
        }));
        
        // Pridobi naloge
        const tasksRef = collection(db, 'projects', projectId, 'tasks');
        const tasksSnap = await getDocs(tasksRef);
        
        const tasksData: ProjectTask[] = [];
        tasksSnap.forEach(doc => {
          tasksData.push({ ...doc.data(), id: doc.id } as ProjectTask);
        });
        
        setTasks(tasksData);
        
        // Pridobi uporabnike
        const usersRef = collection(db, 'users');
        const usersSnap = await getDocs(usersRef);
        
        const usersData: User[] = [];
        usersSnap.forEach(doc => {
          const userData = doc.data() as User;
          if (userData.role === 'installer') {
            usersData.push({ ...userData, id: doc.id });
          }
        });
        
        setUsers(usersData);
        
        setLoading(false);
      } catch (error) {
        console.error('Napaka pri pridobivanju podatkov:', error);
        setError('Prišlo je do napake pri nalaganju podatkov');
        setLoading(false);
      }
    };
    
    fetchProjectData();
  }, [projectId, user]);
  
  // 3.3 FUNKCIJE ZA DELO Z NALOGAMI
  const handleTaskClick = (task: ProjectTask) => {
    setSelectedTask(task);
    setShowTaskForm(true);
  };
  
  const handleAddTask = () => {
    setSelectedTask(null);
    setShowTaskForm(true);
  };
  
  const handleAddGroup = () => {
    setSelectedGroup(null);
    setShowGroupForm(true);
  };
  
  const handleToggleExpand = (taskId: string) => {
    setExpandedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };
  
  const handleExpandAll = () => {
    const expanded: Record<string, boolean> = {};
    tasks.forEach(task => {
      if (task.id) {
        expanded[task.id] = true;
      }
    });
    setExpandedTasks(expanded);
  };
  
  const handleCollapseAll = () => {
    setExpandedTasks({});
  };
  
  // 3.4 FUNKCIJE ZA SHRANJEVANJE PODATKOV
  const handleSaveTask = async (task: ProjectTask): Promise<void> => {
    if (!projectId || !user) return;
    
    try {
      if (task.id && tasks.some(t => t.id === task.id)) {
        // Posodobi obstoječo nalogo
        const taskRef = doc(db, 'projects', projectId, 'tasks', task.id);
        await updateDoc(taskRef, {
          ...task,
          updatedAt: Timestamp.now()
        });
        
        setTasks(prev => prev.map(t => (t.id === task.id ? task : t)));
      } else {
        // Ustvari novo nalogo
        const taskRef = collection(db, 'projects', projectId, 'tasks');
        const newTask = {
          ...task,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        };
        
        const docRef = await addDoc(taskRef, newTask);
        
        setTasks(prev => [...prev, { ...newTask, id: docRef.id }]);
      }
      
      setShowTaskForm(false);
      setSelectedTask(null);
    } catch (error) {
      console.error('Napaka pri shranjevanju naloge:', error);
      throw error;
    }
  };
  
  const handleDeleteTask = async (task: ProjectTask): Promise<void> => {
    if (!projectId || !user || !task.id) return;
    
    try {
      const taskRef = doc(db, 'projects', projectId, 'tasks', task.id);
      await deleteDoc(taskRef);
      
      setTasks(prev => prev.filter(t => t.id !== task.id));
      setShowTaskForm(false);
      setSelectedTask(null);
    } catch (error) {
      console.error('Napaka pri brisanju naloge:', error);
      throw error;
    }
  };
  
  const handleSaveGroup = async (group: TaskGroup): Promise<void> => {
    if (!projectId || !user) return;
    
    try {
      if (group.id && taskGroups.some(g => g.id === group.id)) {
        // Posodobi obstoječo skupino
        const groupRef = doc(db, 'projects', projectId, 'taskGroups', group.id);
        await updateDoc(groupRef, {
          ...group,
          updatedAt: Timestamp.now()
        });
        
        setTaskGroups(prev => prev.map(g => (g.id === group.id ? group : g)));
      } else {
        // Ustvari novo skupino
        const groupRef = collection(db, 'projects', projectId, 'taskGroups');
        const newGroup = {
          ...group,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        };
        
        const docRef = await addDoc(groupRef, newGroup);
        
        setTaskGroups(prev => [...prev, { ...newGroup, id: docRef.id }]);
        
        // Posodobi kanban konfiguracijo
        setKanbanConfig(prev => ({
          ...prev,
          subcategories: [
            ...prev.subcategories,
            {
              id: docRef.id,
              title: group.title || '',
              color: group.color || 'bg-gray-100'
            }
          ]
        }));
      }
      
      setShowGroupForm(false);
      setSelectedGroup(null);
    } catch (error) {
      console.error('Napaka pri shranjevanju skupine:', error);
      throw error;
    }
  };
  
  const handleDeleteGroup = async (group: TaskGroup): Promise<void> => {
    if (!projectId || !user || !group.id) return;
    
    // Preveri, če obstajajo naloge v tej skupini
    const tasksInGroup = tasks.filter(task => task.taskGroupId === group.id);
    
    if (tasksInGroup.length > 0) {
      alert('Skupina vsebuje naloge. Najprej izbrišite ali premaknite naloge iz te skupine.');
      return;
    }
    
    try {
      const groupRef = doc(db, 'projects', projectId, 'taskGroups', group.id);
      await deleteDoc(groupRef);
      
      setTaskGroups(prev => prev.filter(g => g.id !== group.id));
      
      // Posodobi kanban konfiguracijo
      setKanbanConfig(prev => ({
        ...prev,
        subcategories: prev.subcategories.filter(sc => sc.id !== group.id)
      }));
      
      setShowGroupForm(false);
      setSelectedGroup(null);
    } catch (error) {
      console.error('Napaka pri brisanju skupine:', error);
      throw error;
    }
  };
  
  const handleTaskUpdate = async (task: ProjectTask): Promise<void> => {
    if (!projectId || !user || !task.id) return;
    
    try {
      const taskRef = doc(db, 'projects', projectId, 'tasks', task.id);
      await updateDoc(taskRef, {
        ...task,
        updatedAt: Timestamp.now()
      });
      
      setTasks(prev => prev.map(t => (t.id === task.id ? task : t)));
    } catch (error) {
      console.error('Napaka pri posodabljanju naloge:', error);
      throw error;
    }
  };
  
  // 3.5 IZRIS KOMPONENTE
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h2 className="text-xl font-bold text-red-600 mb-4">Napaka</h2>
        <p className="text-gray-700">{error || 'Projekt ni bil najden'}</p>
        <button
          onClick={() => navigate('/projects')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Nazaj na projekte
        </button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-6">
      <AppHeader />
      {/* 3.5.1 GLAVA STRANI */}
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <button
            onClick={() => navigate(`/projects/${projectId}`)}
            className="mr-2 p-1 rounded-full hover:bg-gray-200"
          >
            <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">{project.name}</h1>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={handleAddTask}
            className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <PlusIcon className="w-4 h-4 mr-1" />
            Nova naloga
          </button>
          
          <button
            onClick={handleAddGroup}
            className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            <FolderPlusIcon className="w-4 h-4 mr-1" />
            Nova skupina
          </button>
          
          <button
            onClick={handleExpandAll}
            className="flex items-center px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            <DocumentTextIcon className="w-4 h-4 mr-1" />
            Razširi vse
          </button>
          
          <button
            onClick={handleCollapseAll}
            className="flex items-center px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            <DocumentTextIcon className="w-4 h-4 mr-1" />
            Strni vse
          </button>
        </div>
      </div>
      
      {/* 3.5.2 KANBAN TABLA */}
      <div className="bg-white rounded-lg shadow-md p-4">
        {tasks.length === 0 && taskGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <DocumentTextIcon className="w-16 h-16 text-gray-300 mb-4" />
            <h2 className="text-xl font-medium text-gray-700 mb-2">Ni nalog</h2>
            <p className="text-gray-500 mb-6">Začnite z dodajanjem skupin in nalog za ta projekt</p>
            <div className="flex gap-4">
              <button
                onClick={handleAddGroup}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                <FolderPlusIcon className="w-4 h-4 mr-2" />
                Dodaj skupino
              </button>
              <button
                onClick={handleAddTask}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Dodaj nalogo
              </button>
            </div>
          </div>
        ) : (
          <TaskKanban
            tasks={tasks}
            taskGroups={taskGroups}
            project={project}
            users={users}
            kanbanConfig={kanbanConfig}
            onTaskUpdate={handleTaskUpdate}
            onTaskClick={handleTaskClick}
            expandedTasks={expandedTasks}
            onToggleExpand={handleToggleExpand}
            additionalData={{
              expandAllItems: handleExpandAll,
              collapseAllItems: handleCollapseAll
            }}
            onAddTask={handleAddTask}
          />
        )}
      </div>
      
      {/* 3.5.3 OBRAZCI */}
      {showTaskForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <TaskForm
              task={selectedTask || undefined}
              project={project}
              taskGroups={taskGroups}
              users={users}
              onSave={handleSaveTask}
              onCancel={() => {
                setShowTaskForm(false);
                setSelectedTask(null);
              }}
              onDelete={handleDeleteTask}
            />
          </div>
        </div>
      )}
      
      {showGroupForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
            <TaskGroupForm
              group={selectedGroup || undefined}
              project={project}
              onSave={handleSaveGroup}
              onCancel={() => {
                setShowGroupForm(false);
                setSelectedGroup(null);
              }}
              onDelete={handleDeleteGroup}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectExecutionPage;
