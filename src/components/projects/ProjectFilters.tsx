import React from 'react';
import { ProjectStatus } from '../../types/project';

export interface ProjectFilters {
    status: ProjectStatus[];
    city: string;
    teamMember: string;
    dateRange: {
        start: Date | null;
        end: Date | null;
    };
    executionDate: Date | null;
    searchQuery: string;
}

export type ProjectSort = {
    field: 'name' | 'executionDate' | 'city' | 'status' | 'client';
    direction: 'asc' | 'desc';
};

interface ProjectFiltersProps {
    filters: ProjectFilters;
    onFiltersChange: (filters: ProjectFilters) => void;
    sort: ProjectSort;
    onSortChange: (sort: ProjectSort) => void;
    cities: string[];
    teamMembers: string[];
}

const ProjectFilters: React.FC<ProjectFiltersProps> = ({
    filters,
    onFiltersChange,
    sort,
    onSortChange,
    cities,
    teamMembers
}) => {
    const handleFilterChange = (field: keyof ProjectFilters, value: any) => {
        console.log('Filter change:', field, value);
        onFiltersChange({
            ...filters,
            [field]: value
        });
    };

    const handleSortChange = (field: ProjectSort['field']) => {
        const newSort: ProjectSort = {
            field,
            direction: sort.field === field && sort.direction === 'asc' ? 'desc' : 'asc'
        };
        onSortChange(newSort);
    };

    console.log('Current filters:', filters);

    return (
        <div className="bg-white shadow rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Status */}
                <div>
                    <select
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={filters.status?.length === 1 ? filters.status[0] : ''}
                        onChange={(e) => {
                            const value = e.target.value;
                            handleFilterChange('status', value ? [value] : []);
                        }}
                    >
                        <option value="">Vsi statusi</option>
                        <option value="DRAFT">V pripravi</option>
                        <option value="IN_PROGRESS">V izvajanju</option>
                        <option value="COMPLETED">Zaključeno</option>
                        <option value="CANCELLED">Preklicano</option>
                    </select>
                </div>

                {/* City */}
                <div>
                    <select
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={filters.city}
                        onChange={(e) => handleFilterChange('city', e.target.value)}
                    >
                        <option value="">Vsa mesta</option>
                        {cities.map((city) => (
                            <option key={city} value={city}>
                                {city}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Team Member */}
                <div>
                    <select
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={filters.teamMember}
                        onChange={(e) => handleFilterChange('teamMember', e.target.value)}
                    >
                        <option value="">Vsi člani</option>
                        {teamMembers.map((member) => (
                            <option key={member} value={member}>
                                {member}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Execution Date */}
                <div>
                    <input
                        type="date"
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={filters.executionDate ? filters.executionDate.toISOString().split('T')[0] : ''}
                        onChange={(e) => handleFilterChange('executionDate', e.target.value ? new Date(e.target.value) : null)}
                    />
                </div>
            </div>

            {/* Sort buttons */}
            <div className="flex gap-2 mt-4">
                <button
                    className={`px-3 py-1 rounded-lg ${
                        sort.field === 'name'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                    }`}
                    onClick={() => handleSortChange('name')}
                >
                    Ime {sort.field === 'name' && (sort.direction === 'asc' ? '↑' : '↓')}
                </button>
                <button
                    className={`px-3 py-1 rounded-lg ${
                        sort.field === 'executionDate'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                    }`}
                    onClick={() => handleSortChange('executionDate')}
                >
                    Datum {sort.field === 'executionDate' && (sort.direction === 'asc' ? '↑' : '↓')}
                </button>
                <button
                    className={`px-3 py-1 rounded-lg ${
                        sort.field === 'status'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                    }`}
                    onClick={() => handleSortChange('status')}
                >
                    Status {sort.field === 'status' && (sort.direction === 'asc' ? '↑' : '↓')}
                </button>
                <button
                    className={`px-3 py-1 rounded-lg ${
                        sort.field === 'client'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                    }`}
                    onClick={() => handleSortChange('client')}
                >
                    Stranka {sort.field === 'client' && (sort.direction === 'asc' ? '↑' : '↓')}
                </button>
            </div>
        </div>
    );
};

export default ProjectFilters;
