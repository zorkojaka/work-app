import { ProjectStatus } from './project';

export type MetricType = 
    | 'revenue'               // Prihodek
    | 'project_count'        // Število vseh projektov
    | 'proposals_sent'       // Poslane ponudbe
    | 'proposals_accepted'   // Sprejete ponudbe
    | 'executions_completed' // Zaključene izvedbe
    | 'conversion_rate'      // Stopnja konverzije (%)
    | 'avg_project_value'    // Povprečna vrednost projekta
    | 'projects_by_status'   // Projekti po statusu
    | 'custom';              // Po meri

export interface Metric {
    id: string;
    name: string;
    type: MetricType;
    description: string;
    status?: ProjectStatus;    // Za metrike vezane na status
    currentValue: number;
    target?: number;          // Ciljna vrednost
    unit: string;            // €, %, kos, itd.
    period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    calculation: 'sum' | 'average' | 'count' | 'percentage';
}

export interface MetricGoal {
    id: string;
    metricId: string;
    target: number;
    startDate: string;
    endDate: string;
    color: string;
    description?: string;
}

export interface MetricCalculation {
    type: MetricType;
    status?: ProjectStatus;
    period: string;
    value: number;
}
