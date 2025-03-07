import React, { useEffect } from 'react';
import { UIProjectBudgetRange } from '../../types/ui';
import { defaultUIConfig } from '../../config/defaultUIConfig';

interface BudgetRangeSelectorProps {
    selectedId?: string;
    budgetRanges: UIProjectBudgetRange[];
    onChange: (selectedId: string) => void;
}

const BudgetRangeSelector: React.FC<BudgetRangeSelectorProps> = ({
    selectedId,
    budgetRanges,
    onChange
}) => {
    // Razvrsti razpone po vrednosti (od najmanjšega do največjega)
    const sortedRanges = [...budgetRanges].sort((a, b) => (a.max || 0) - (b.max || 0));
    
    // Zagotovimo, da imajo vsi rangi naslove in max vrednosti
    const rangesWithTitlesAndValues = sortedRanges.map(range => {
        // Poiščemo ustrezen range v privzetih nastavitvah
        const defaultRange = defaultUIConfig.budgetRanges.find(r => r.id === range.id);
        
        // Če range nima naslova ali max vrednosti, jih pridobimo iz privzetih nastavitev
        if (!range.title || range.max === undefined) {
            if (defaultRange) {
                return { 
                    ...range, 
                    title: range.title || defaultRange.title,
                    max: range.max !== undefined ? range.max : defaultRange.max,
                    min: range.min !== undefined ? range.min : defaultRange.min,
                    icon: range.icon || defaultRange.icon
                };
            }
        }
        return range;
    });
    
    // Debugiranje - izpišemo vse range vrednosti v konzolo
    useEffect(() => {
        console.log("BudgetRangeSelector - Ranges:", rangesWithTitlesAndValues);
        rangesWithTitlesAndValues.forEach(range => {
            console.log(`Range ID: ${range.id}, Title: ${range.title}, Max: ${range.max}, Icon: ${range.icon}`);
        });
    }, [rangesWithTitlesAndValues]);
    
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                Finančni rang
            </label>
            <div className="mt-1 flex flex-wrap gap-2">
                {rangesWithTitlesAndValues.map((range, index) => {
                    // Debugiranje - izpišemo vsak range, ki se prikazuje
                    console.log(`Rendering range: ${range.id}, Title: ${range.title}, Max: ${range.max}, Index: ${index}`);
                    
                    // Določimo prikaz vrednosti glede na range.id
                    let displayText = '';
                    
                    if (range.icon === '⭐') {
                        // Posebna obravnava za zvezdico - nedenarne vrednosti
                        displayText = '0€ ⭐';
                    } else if (range.id === 'xs') {
                        displayText = '0.5k';
                    } else if (range.id === 'sm') {
                        displayText = '1k';
                    } else if (range.id === 'md') {
                        displayText = '2.5k';
                    } else if (range.id === 'lg') {
                        displayText = '5k';
                    } else if (range.id === 'xl') {
                        displayText = '10k+';
                    } else {
                        // Če ni posebne obravnave, prikažemo max vrednost
                        const maxValue = range.max || 0;
                        displayText = maxValue >= 1000 ? 
                            `${Math.floor(maxValue / 1000)}k` : 
                            `${maxValue}€`;
                    }
                    
                    return (
                        <button
                            key={range.id}
                            type="button"
                            onClick={() => onChange(range.id)}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                                selectedId === range.id
                                    ? 'text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                            style={{
                                backgroundColor: selectedId === range.id ? range.color || '#3B82F6' : undefined
                            }}
                            title={`${range.title || 'Finančni rang'} (max: ${range.max || 0} €)`}
                        >
                            {range.icon && range.icon !== '⭐' ? <span className="mr-1">{range.icon}</span> : null} {displayText}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default BudgetRangeSelector;
