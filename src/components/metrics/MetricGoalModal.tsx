import React, { useState } from 'react';
import { Metric, MetricGoal } from '../../types/metrics';
import { defaultKanbanConfig } from '../../config/defaultKanbanConfig';
import { formatCurrency, formatNumber } from '../../utils/formatters';

interface MetricGoalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (goals: MetricGoal[]) => void;
    metrics: Metric[];
    existingGoals: MetricGoal[];
}

const MetricGoalModal: React.FC<MetricGoalModalProps> = ({
    isOpen,
    onClose,
    onSave,
    metrics,
    existingGoals
}) => {
    const [selectedGoals, setSelectedGoals] = useState<Record<string, boolean>>(
        metrics.reduce((acc, metric) => ({
            ...acc,
            [metric.id]: existingGoals.some(g => g.metricId === metric.id)
        }), {})
    );

    const [goalValues, setGoalValues] = useState<Record<string, MetricGoal>>(
        metrics.reduce((acc, metric) => {
            const existingGoal = existingGoals.find(g => g.metricId === metric.id);
            return {
                ...acc,
                [metric.id]: existingGoal || {
                    id: `${metric.id}-${Date.now()}`,
                    metricId: metric.id,
                    target: metric.target || 0,
                    startDate: new Date().toISOString().split('T')[0],
                    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
                    color: defaultKanbanConfig.columns[0].color
                }
            };
        }, {})
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const selectedMetricGoals = Object.entries(selectedGoals)
            .filter(([_, isSelected]) => isSelected)
            .map(([metricId]) => goalValues[metricId]);
        onSave(selectedMetricGoals);
        onClose();
    };

    const formatValue = (value: number, metric: Metric) => {
        switch (metric.unit) {
            case '€':
                return formatCurrency(value);
            case '%':
                return `${value}%`;
            default:
                return formatNumber(value);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl">
                <h2 className="text-xl font-semibold mb-4">Nastavitve ciljev</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="overflow-y-auto max-h-[60vh]">
                        <table className="min-w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Prikaži</th>
                                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Metrika</th>
                                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Trenutno</th>
                                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Cilj</th>
                                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Rok</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {metrics.map(metric => (
                                    <tr key={metric.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-2">
                                            <input
                                                type="checkbox"
                                                checked={selectedGoals[metric.id]}
                                                onChange={(e) => setSelectedGoals({
                                                    ...selectedGoals,
                                                    [metric.id]: e.target.checked
                                                })}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                        </td>
                                        <td className="px-4 py-2">
                                            <div className="font-medium text-gray-900">{metric.name}</div>
                                            <div className="text-sm text-gray-500">{metric.description}</div>
                                        </td>
                                        <td className="px-4 py-2 text-gray-500">
                                            {formatValue(metric.currentValue, metric)}
                                        </td>
                                        <td className="px-4 py-2">
                                            <input
                                                type="number"
                                                value={goalValues[metric.id].target}
                                                onChange={(e) => setGoalValues({
                                                    ...goalValues,
                                                    [metric.id]: {
                                                        ...goalValues[metric.id],
                                                        target: Number(e.target.value)
                                                    }
                                                })}
                                                className="w-32 border-gray-300 rounded-md shadow-sm"
                                                min="0"
                                                disabled={!selectedGoals[metric.id]}
                                            />
                                        </td>
                                        <td className="px-4 py-2">
                                            <input
                                                type="date"
                                                value={goalValues[metric.id].endDate}
                                                onChange={(e) => setGoalValues({
                                                    ...goalValues,
                                                    [metric.id]: {
                                                        ...goalValues[metric.id],
                                                        endDate: e.target.value
                                                    }
                                                })}
                                                className="border-gray-300 rounded-md shadow-sm"
                                                disabled={!selectedGoals[metric.id]}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-end gap-2 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                            Prekliči
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                        >
                            Shrani
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MetricGoalModal;
