import React from 'react';
import { UIProjectIndustry } from '../../types/ui';

interface IndustrySelectorProps {
    selectedIds: string[];
    industries: UIProjectIndustry[];
    onChange: (selectedIds: string[]) => void;
}

const IndustrySelector: React.FC<IndustrySelectorProps> = ({
    selectedIds,
    industries,
    onChange
}) => {
    const handleToggle = (industryId: string) => {
        const newSelectedIds = selectedIds.includes(industryId)
            ? selectedIds.filter(id => id !== industryId)
            : [...selectedIds, industryId];
        onChange(newSelectedIds);
    };

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700">
                Panoge
            </label>
            <div className="mt-1 flex flex-wrap gap-2">
                {industries.map((industry) => (
                    <button
                        key={industry.id}
                        type="button"
                        onClick={() => handleToggle(industry.id)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                            selectedIds.includes(industry.id)
                                ? 'text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        style={{
                            backgroundColor: selectedIds.includes(industry.id) ? industry.color : undefined
                        }}
                    >
                        {industry.icon} {industry.name}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default IndustrySelector;
