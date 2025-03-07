import React from 'react';
import { UIProjectTag } from '../../types/ui';

interface TagSelectorProps {
    selectedTags: string[];
    availableTags: UIProjectTag[];
    onChange: (selectedTags: string[]) => void;
}

const TagSelector: React.FC<TagSelectorProps> = ({
    selectedTags,
    availableTags,
    onChange
}) => {
    const handleToggle = (tagId: string) => {
        const newSelectedTags = selectedTags.includes(tagId)
            ? selectedTags.filter(id => id !== tagId)
            : [...selectedTags, tagId];
        onChange(newSelectedTags);
    };

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700">
                Oznake
            </label>
            <div className="mt-1 flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                    <button
                        key={tag.id}
                        type="button"
                        onClick={() => handleToggle(tag.id)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                            selectedTags.includes(tag.id)
                                ? 'text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        style={{
                            backgroundColor: selectedTags.includes(tag.id) ? tag.color : undefined
                        }}
                    >
                        {tag.name}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default TagSelector;
