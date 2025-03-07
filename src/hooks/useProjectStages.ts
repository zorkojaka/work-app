import { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { 
    ProjectStageGroup, 
    DEFAULT_PROJECT_STAGES,
    convertToKanbanConfig 
} from '../constants/projectStages';

export const useProjectStages = () => {
    const [stages, setStages] = useState<ProjectStageGroup[]>(DEFAULT_PROJECT_STAGES);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    // 1. Nalaganje konfiguracije iz Firebase
    useEffect(() => {
        const unsubscribe = onSnapshot(
            doc(db, 'config', 'projectStages'),
            (doc) => {
                if (doc.exists()) {
                    console.log('Loaded project stages:', doc.data());
                    setStages(doc.data().stages);
                } else {
                    console.log('Using default project stages');
                    setStages(DEFAULT_PROJECT_STAGES);
                }
                setLoading(false);
            },
            (error) => {
                console.error('Error loading project stages:', error);
                setError(error as Error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    // 2. Shranjevanje sprememb
    const updateStages = async (newStages: ProjectStageGroup[]) => {
        try {
            await updateDoc(doc(db, 'config', 'projectStages'), {
                stages: newStages,
                lastUpdated: new Date()
            });
            console.log('Project stages updated successfully');
        } catch (error) {
            console.error('Error updating project stages:', error);
            throw error;
        }
    };

    // 3. Pretvorba v kanban konfiguracijo
    const kanbanConfig = convertToKanbanConfig(stages);

    return {
        stages,
        updateStages,
        kanbanConfig,
        loading,
        error
    };
};
