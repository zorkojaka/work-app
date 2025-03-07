import React, { useEffect, useState } from 'react';
import { Project } from '../../types/project';
import { defaultKanbanConfig } from '../../config/defaultKanbanConfig';
import { UIMetricGoal } from '../../types/ui';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

interface StatisticsProps {
    projects: Project[];
    goals?: UIMetricGoal[];
}

interface Stats {
    totalProjects: number;
    totalValue: number;
    averageValue: number;
    statusCounts: Record<string, number>;
    statusValues: Record<string, number>;
    statusAddedThisMonth: Record<string, number>;
    statusLeftThisMonth: Record<string, number>;
    cityCounts: Record<string, number>;
    upcomingProjects: Project[];
}

const Statistics: React.FC<StatisticsProps> = ({ projects, goals }) => {
    const [monthlyStats, setMonthlyStats] = useState<{
        added: Record<string, number>;
        left: Record<string, number>;
    }>({
        added: {},
        left: {}
    });

    // Pridobi podatke o projektih, ki so bili dodani ali so zapustili stolpec v tekočem mesecu
    useEffect(() => {
        const fetchMonthlyStats = async () => {
            try {
                // Določi začetek tekočega meseca
                const now = new Date();
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                const startTimestamp = Timestamp.fromDate(startOfMonth);
                
                // Inicializiraj števce
                const added: Record<string, number> = {};
                const left: Record<string, number> = {};
                
                defaultKanbanConfig.columns.forEach(column => {
                    added[column.status] = 0;
                    left[column.status] = 0;
                });

                // Pridobi projekte, ki so bili posodobljeni v tem mesecu
                const projectsRef = collection(db, 'projects');
                const q = query(
                    projectsRef,
                    where('lastUpdated', '>=', startTimestamp)
                );
                
                const querySnapshot = await getDocs(q);
                
                // Sledimo, katere projekte smo že šteli za posamezen status
                const countedAddedProjects: Record<string, Set<string>> = {};
                const countedLeftProjects: Record<string, Set<string>> = {};
                
                defaultKanbanConfig.columns.forEach(column => {
                    countedAddedProjects[column.status] = new Set<string>();
                    countedLeftProjects[column.status] = new Set<string>();
                });
                
                querySnapshot.forEach(doc => {
                    const projectData = doc.data() as Project;
                    const projectId = doc.id;
                    
                    // Če je projekt dobil nov status v tem mesecu, povečaj števec za ta status
                    if (projectData.statusHistory && Array.isArray(projectData.statusHistory)) {
                        projectData.statusHistory.forEach((history: any) => {
                            if (history.timestamp && history.timestamp.toDate() >= startOfMonth) {
                                // Štejemo nove projekte za vsak status
                                if (history.newStatus) {
                                    // Preveri, ali smo ta projekt že šteli za ta status
                                    if (!countedAddedProjects[history.newStatus].has(projectId)) {
                                        added[history.newStatus] = (added[history.newStatus] || 0) + 1;
                                        countedAddedProjects[history.newStatus].add(projectId);
                                    }
                                }
                                
                                // Štejemo končane projekte za vsak status
                                if (history.oldStatus) {
                                    // Preveri, ali smo ta projekt že šteli za ta status
                                    if (!countedLeftProjects[history.oldStatus].has(projectId)) {
                                        left[history.oldStatus] = (left[history.oldStatus] || 0) + 1;
                                        countedLeftProjects[history.oldStatus].add(projectId);
                                    }
                                }
                            }
                        });
                    }
                });
                
                // Izpis za debugiranje
                console.log("Novi projekti po statusih:", added);
                console.log("Končani projekti po statusih:", left);
                
                setMonthlyStats({ added, left });
            } catch (error) {
                console.error("Napaka pri pridobivanju mesečnih statistik:", error);
            }
        };
        
        fetchMonthlyStats();
    }, [projects]); // Dodamo projects kot odvisnost, da se statistika posodobi, ko se spremenijo projekti

    const calculateStats = (): Stats => {
        if (!projects) {
            return {
                totalProjects: 0,
                totalValue: 0,
                averageValue: 0,
                statusCounts: {},
                statusValues: {},
                statusAddedThisMonth: {},
                statusLeftThisMonth: {},
                cityCounts: {},
                upcomingProjects: []
            };
        }

        const stats: Stats = {
            totalProjects: projects.length,
            totalValue: 0,
            averageValue: 0,
            statusCounts: {},
            statusValues: {},
            statusAddedThisMonth: {},
            statusLeftThisMonth: {},
            cityCounts: {},
            upcomingProjects: []
        };

        // Initialize status counts and values
        defaultKanbanConfig.columns.forEach(column => {
            stats.statusCounts[column.status] = 0;
            stats.statusValues[column.status] = 0;
            stats.statusAddedThisMonth[column.status] = monthlyStats.added[column.status] || 0;
            stats.statusLeftThisMonth[column.status] = monthlyStats.left[column.status] || 0;
        });

        const now = new Date();
        const twoWeeksFromNow = new Date();
        twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);

        projects.forEach(project => {
            // Calculate total and average value
            if (project.value) {
                stats.totalValue += project.value;
                
                // Dodaj vrednost k ustreznemu statusu
                if (project.status) {
                    stats.statusValues[project.status] = (stats.statusValues[project.status] || 0) + (project.value || 0);
                }
            }

            // Count projects by status
            if (project.status) {
                stats.statusCounts[project.status] = (stats.statusCounts[project.status] || 0) + 1;
            }

            // Count projects by city
            if (project.location?.city) {
                stats.cityCounts[project.location.city] = (stats.cityCounts[project.location.city] || 0) + 1;
            }

            // Check for upcoming projects
            if (project.executionDate?.date) {
                const executionDate = new Date(project.executionDate.date);
                if (executionDate >= now && executionDate <= twoWeeksFromNow) {
                    stats.upcomingProjects.push(project);
                }
            }
        });

        // Calculate average value
        stats.averageValue = stats.totalValue / (projects.length || 1);

        return stats;
    };

    const stats = calculateStats();

    // Pridobi trenutni mesec za prikaz
    const currentMonth = new Date().toLocaleString('sl-SI', { month: 'long' });

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Prikaži statistiko za vsak stolpec */}
            {defaultKanbanConfig.columns.map(column => (
                <div key={column.status} className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-lg font-medium text-gray-900">{column.title}</h3>
                    <div className="flex items-center justify-between mt-2">
                        <p className="text-3xl font-bold" style={{ 
                            color: column.status === 'DRAFT' ? '#6B7280' : 
                                   column.status === 'IN_PROGRESS' ? '#F59E0B' : 
                                   column.status === 'COMPLETED' ? '#10B981' : 
                                   column.status === 'CANCELLED' ? '#EF4444' : '#4B5563'
                        }}>
                            {stats.statusCounts[column.status] || 0}
                        </p>
                        <div className="text-right">
                            <div className="text-xs font-bold text-gray-500">{currentMonth.toUpperCase()}</div>
                            <div>
                                <span className="text-xs text-gray-500">Novi </span>
                                <span className="text-sm font-medium text-green-600">+{stats.statusAddedThisMonth[column.status] || 0}</span>
                            </div>
                            <div>
                                <span className="text-xs text-gray-500">Končani </span>
                                <span className="text-sm font-medium text-red-600">-{stats.statusLeftThisMonth[column.status] || 0}</span>
                            </div>
                        </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                        {(stats.statusValues[column.status] || 0).toLocaleString('sl-SI')} €
                    </p>
                </div>
            ))}
            
            {goals?.map(goal => (
                <div key={goal.id} className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-lg font-medium text-gray-900">{goal.name}</h3>
                    <p className="mt-2 text-3xl font-bold" style={{ color: goal.color || '#4B5563' }}>
                        {goal.current.toLocaleString('sl-SI')} {goal.unit}
                    </p>
                    <p className="text-sm text-gray-500">
                        Cilj: {goal.target.toLocaleString('sl-SI')} {goal.unit}
                    </p>
                </div>
            ))}
        </div>
    );
};

export default Statistics;
