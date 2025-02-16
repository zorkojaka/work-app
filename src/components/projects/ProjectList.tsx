// Imports
import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../auth/AuthProvider';
import Header from '../common/Header';
import { Project } from '../../types/project';
import ProjectForm from './ProjectForm';

// Component definition
const ProjectList: React.FC = () => {
    // State management
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const { user, activeRole } = useAuth();

    // Form handling functions
    const handleCloseForm = () => {
        setEditingProject(null);
        setShowForm(false);
    };

    const handleEdit = (project: Project) => {
        setEditingProject(project);
        setShowForm(true);
    };

    // Data fetching
    const fetchProjects = async () => {
        if (!user) return;

        try {
            const projectsRef = collection(db, 'projects');
            let q = query(projectsRef);
            
            // Filter projects based on role
            if (activeRole === 'INSTALLER') {
                q = query(projectsRef, where(`team.${user.uid}`, '!=', null));
            }

            const querySnapshot = await getDocs(q);
            const projectData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Project[];

            setProjects(projectData);
        } catch (error) {
            console.error('Error fetching projects:', error);
        } finally {
            setLoading(false);
        }
    };

    // Effects
    useEffect(() => {
        fetchProjects();
    }, [user, activeRole]);

    // Loading state
    if (loading) {
        return (
            <>
                <Header title="Projekti" />
                <div className="flex justify-center items-center h-screen">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            </>
        );
    }

    // Main render
    return (
        <div className="min-h-screen bg-gray-100">
            <Header title="Projekti" />
            <div className="container mx-auto px-4 py-8">
                {/* Header section */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">Projekti</h1>
                    <button
                        onClick={() => setShowForm(true)}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                        Nov projekt
                    </button>
                </div>

                {/* Projects grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project) => (
                        <div key={project.id} className="bg-white rounded-lg shadow-md p-6">
                            <h3 className="text-xl font-semibold mb-2">{project.name}</h3>
                            <p className="text-gray-600 mb-4">{project.description}</p>
                            <div className="flex justify-between items-center">
                                <span className={`px-2 py-1 rounded text-sm ${
                                    project.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                                    project.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                    project.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'
                                }`}>
                                    {project.status}
                                </span>
                                <button
                                    onClick={() => handleEdit(project)}
                                    className="text-blue-500 hover:text-blue-700"
                                >
                                    Podrobnosti
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Project form modal */}
                {showForm && (
                    <ProjectForm 
                        onClose={handleCloseForm}
                        onSuccess={() => {
                            handleCloseForm();
                            fetchProjects();
                        }}
                        editProject={editingProject}
                    />
                )}
            </div>
        </div>
    );
};

export default ProjectList;