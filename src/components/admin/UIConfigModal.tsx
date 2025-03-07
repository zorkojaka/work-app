import React, { useState } from 'react';
import { UIConfig, UIProjectIndustry, UIProjectBudgetRange, UIProjectTag } from '../../types/config';
import { ChromePicker } from 'react-color';

interface UIConfigModalProps {
    config: UIConfig;
    onSave: (config: UIConfig) => void;
    onClose: () => void;
}

interface ColorPickerProps {
    color: string;
    onChange: (color: string) => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ color, onChange }) => {
    const [showPicker, setShowPicker] = useState(false);

    return (
        <div className="relative">
            <button
                className="w-8 h-8 rounded border"
                style={{ backgroundColor: color }}
                onClick={() => setShowPicker(!showPicker)}
            />
            {showPicker && (
                <div className="absolute z-50 mt-2">
                    <div
                        className="fixed inset-0"
                        onClick={() => setShowPicker(false)}
                    />
                    <ChromePicker
                        color={color}
                        onChange={(color) => onChange(color.hex)}
                    />
                </div>
            )}
        </div>
    );
};

const UIConfigModal: React.FC<UIConfigModalProps> = ({
    config,
    onSave,
    onClose,
}) => {
    const [industries, setIndustries] = useState<UIProjectIndustry[]>(config.industries);
    const [budgetRanges, setBudgetRanges] = useState<UIProjectBudgetRange[]>(config.budgetRanges);
    const [tags, setTags] = useState<UIProjectTag[]>(config.tags);

    const handleAddIndustry = () => {
        const newIndustry: UIProjectIndustry = {
            id: Date.now().toString(),
            name: '',
            color: '#000000',
            icon: '🏢'
        };
        setIndustries([...industries, newIndustry]);
    };

    const handleUpdateIndustry = (index: number, field: keyof UIProjectIndustry, value: string) => {
        const newIndustries = [...industries];
        newIndustries[index] = { ...newIndustries[index], [field]: value };
        setIndustries(newIndustries);
    };

    const handleDeleteIndustry = (index: number) => {
        setIndustries(industries.filter((_, i) => i !== index));
    };

    const handleAddBudgetRange = () => {
        const newRange: UIProjectBudgetRange = {
            id: Date.now().toString(),
            name: '',
            minAmount: 0,
            maxAmount: null,
            color: '#000000',
            priority: 1,
            icon: '💰'
        };
        setBudgetRanges([...budgetRanges, newRange]);
    };

    const handleUpdateBudgetRange = (index: number, field: keyof UIProjectBudgetRange, value: any) => {
        const newRanges = [...budgetRanges];
        newRanges[index] = { ...newRanges[index], [field]: value };
        setBudgetRanges(newRanges);
    };

    const handleDeleteBudgetRange = (index: number) => {
        setBudgetRanges(budgetRanges.filter((_, i) => i !== index));
    };

    const handleAddTag = () => {
        const newTag: UIProjectTag = {
            id: Date.now().toString(),
            name: '',
            color: '#000000',
            icon: '🏷️'
        };
        setTags([...tags, newTag]);
    };

    const handleUpdateTag = (index: number, field: keyof UIProjectTag, value: string) => {
        const newTags = [...tags];
        newTags[index] = { ...newTags[index], [field]: value };
        setTags(newTags);
    };

    const handleDeleteTag = (index: number) => {
        setTags(tags.filter((_, i) => i !== index));
    };

    const handleSave = () => {
        onSave({
            ...config,
            industries,
            budgetRanges,
            tags
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-6 border-b">
                    <h2 className="text-xl font-semibold">UI Configuration</h2>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Industries */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium">Industries</h3>
                            <button
                                onClick={handleAddIndustry}
                                className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                Add Industry
                            </button>
                        </div>
                        <div className="space-y-4">
                            {industries.map((industry, index) => (
                                <div key={industry.id} className="flex items-center gap-4">
                                    <input
                                        type="text"
                                        value={industry.name}
                                        onChange={(e) => handleUpdateIndustry(index, 'name', e.target.value)}
                                        placeholder="Industry name"
                                        className="flex-1 rounded-md border-gray-300"
                                    />
                                    <ColorPicker
                                        color={industry.color}
                                        onChange={(color) => handleUpdateIndustry(index, 'color', color)}
                                    />
                                    <input
                                        type="text"
                                        value={industry.icon}
                                        onChange={(e) => handleUpdateIndustry(index, 'icon', e.target.value)}
                                        placeholder="Icon"
                                        className="w-16 rounded-md border-gray-300"
                                    />
                                    <button
                                        onClick={() => handleDeleteIndustry(index)}
                                        className="p-2 text-red-600 hover:text-red-700"
                                    >
                                        Delete
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Budget Ranges */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium">Budget Ranges</h3>
                            <button
                                onClick={handleAddBudgetRange}
                                className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                Add Budget Range
                            </button>
                        </div>
                        <div className="space-y-4">
                            {budgetRanges.map((range, index) => (
                                <div key={range.id} className="flex items-center gap-4">
                                    <input
                                        type="text"
                                        value={range.name}
                                        onChange={(e) => handleUpdateBudgetRange(index, 'name', e.target.value)}
                                        placeholder="Range name"
                                        className="flex-1 rounded-md border-gray-300"
                                    />
                                    <input
                                        type="number"
                                        value={range.minAmount}
                                        onChange={(e) => handleUpdateBudgetRange(index, 'minAmount', parseInt(e.target.value))}
                                        placeholder="Min amount"
                                        className="w-32 rounded-md border-gray-300"
                                    />
                                    <input
                                        type="number"
                                        value={range.maxAmount || ''}
                                        onChange={(e) => handleUpdateBudgetRange(index, 'maxAmount', e.target.value ? parseInt(e.target.value) : null)}
                                        placeholder="Max amount"
                                        className="w-32 rounded-md border-gray-300"
                                    />
                                    <ColorPicker
                                        color={range.color}
                                        onChange={(color) => handleUpdateBudgetRange(index, 'color', color)}
                                    />
                                    <input
                                        type="text"
                                        value={range.icon}
                                        onChange={(e) => handleUpdateBudgetRange(index, 'icon', e.target.value)}
                                        placeholder="Icon"
                                        className="w-16 rounded-md border-gray-300"
                                    />
                                    <button
                                        onClick={() => handleDeleteBudgetRange(index)}
                                        className="p-2 text-red-600 hover:text-red-700"
                                    >
                                        Delete
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Tags */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium">Tags</h3>
                            <button
                                onClick={handleAddTag}
                                className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                Add Tag
                            </button>
                        </div>
                        <div className="space-y-4">
                            {tags.map((tag, index) => (
                                <div key={tag.id} className="flex items-center gap-4">
                                    <input
                                        type="text"
                                        value={tag.name}
                                        onChange={(e) => handleUpdateTag(index, 'name', e.target.value)}
                                        placeholder="Tag name"
                                        className="flex-1 rounded-md border-gray-300"
                                    />
                                    <ColorPicker
                                        color={tag.color}
                                        onChange={(color) => handleUpdateTag(index, 'color', color)}
                                    />
                                    <input
                                        type="text"
                                        value={tag.icon}
                                        onChange={(e) => handleUpdateTag(index, 'icon', e.target.value)}
                                        placeholder="Icon"
                                        className="w-16 rounded-md border-gray-300"
                                    />
                                    <button
                                        onClick={() => handleDeleteTag(index)}
                                        className="p-2 text-red-600 hover:text-red-700"
                                    >
                                        Delete
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t bg-gray-50 flex justify-end gap-4">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UIConfigModal;
