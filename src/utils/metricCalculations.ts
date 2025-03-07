import { Project } from '../types/project';

interface ProjectStats {
  totalValue: number;
  totalProjects: number;
  averageValue: number;
  uniqueClients: number;
  inProgressProjects: number;
  completedProjects: number;
  upcomingExecutions: Project[];
}

export const calculateMetrics = (projects: Project[] = []): ProjectStats => {
  const stats: ProjectStats = {
    totalValue: 0,
    totalProjects: projects.length,
    averageValue: 0,
    uniqueClients: 0,
    inProgressProjects: 0,
    completedProjects: 0,
    upcomingExecutions: []
  };

  // Izračun statistik
  const uniqueClientIds = new Set<string>();

  projects.forEach(project => {
    // Skupna vrednost
    if (project.budget?.amount) {
      stats.totalValue += project.budget.amount;
    }

    // Unikatne stranke
    if (project.clientId) {
      uniqueClientIds.add(project.clientId);
    }

    // Projekti po statusu
    if (project.status === 'IN_PROGRESS') {
      stats.inProgressProjects++;
    } else if (project.status === 'COMPLETED') {
      stats.completedProjects++;
    }

    // Prihajajoče izvedbe
    if (project.executionDate && new Date(project.executionDate.date) >= new Date()) {
      stats.upcomingExecutions.push(project);
    }
  });

  // Izračun povprečne vrednosti
  stats.averageValue = stats.totalValue / (stats.totalProjects || 1);
  
  // Število unikatnih strank
  stats.uniqueClients = uniqueClientIds.size;

  // Sortiraj prihajajoče izvedbe po datumu
  stats.upcomingExecutions.sort((a, b) => {
    if (!a.executionDate || !b.executionDate) return 0;
    return new Date(a.executionDate.date).getTime() - new Date(b.executionDate.date).getTime();
  });

  return stats;
};
