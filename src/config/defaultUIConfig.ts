import { UIConfig } from '../types/ui';
import { defaultKanbanConfig } from './defaultKanbanConfig';

export const defaultUIConfig: UIConfig = {
    kanban: defaultKanbanConfig,
    industries: [
        {
            id: 'videonadzor',
            name: 'Videonadzor',
            color: '#2563eb', // blue-600
            icon: '📹'
        },
        {
            id: 'alarm',
            name: 'Alarm',
            color: '#dc2626', // red-600
            icon: '🚨'
        },
        {
            id: 'pametni-dom',
            name: 'Pametni dom',
            color: '#16a34a', // green-600
            icon: '🏠'
        },
        {
            id: 'gradnja',
            name: 'Gradnja',
            color: '#ca8a04', // yellow-600
            icon: '🏗️'
        },
        {
            id: 'programiranje',
            name: 'Programiranje',
            color: '#9333ea', // purple-600
            icon: '💻'
        }
    ],
    budgetRanges: [
        {
            id: 'xs',
            title: 'do 500 €',
            min: 0,
            max: 500,
            color: '#4b5563', // gray-600
            icon: '💰'
        },
        {
            id: 'sm',
            title: 'do 1.000 €',
            min: 500,
            max: 1000,
            color: '#6b7280', // gray-500
            icon: '💰💰'
        },
        {
            id: 'md',
            title: 'do 2.500 €',
            min: 1000,
            max: 2500,
            color: '#4b5563', // gray-600
            icon: '💰💰💰'
        },
        {
            id: 'lg',
            title: 'do 5.000 €',
            min: 2500,
            max: 5000,
            color: '#374151', // gray-700
            icon: '💰💰💰💰'
        },
        {
            id: 'xl',
            title: 'več kot 5.000 €',
            min: 5000,
            max: 10000,
            color: '#1f2937', // gray-800
            icon: '💰💰💰💰💰'
        }
    ],
    tags: [
        {
            id: 'urgent',
            name: 'Nujno',
            color: '#dc2626', // red-600
            icon: '🚨'
        },
        {
            id: 'maintenance',
            name: 'Vzdrževanje',
            color: '#2563eb', // blue-600
            icon: '🔧'
        },
        {
            id: 'upgrade',
            name: 'Nadgradnja',
            color: '#16a34a', // green-600
            icon: '⬆️'
        }
    ],
    goals: [
        {
            id: 'monthly-revenue',
            name: 'Mesečni prihodki',
            target: 10000,
            current: 0,
            unit: '€',
            color: '#2563eb' // blue-600
        },
        {
            id: 'projects-completed',
            name: 'Zaključeni projekti',
            target: 10,
            current: 0,
            unit: '',
            color: '#16a34a' // green-600
        }
    ]
};
