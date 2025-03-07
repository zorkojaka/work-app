import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { UIConfig, UIProjectBudgetRange, UIProjectIndustry, UIProjectTag } from '../types/ui';
import { defaultUIConfig } from '../config/defaultUIConfig';

export const useUIConfig = () => {
    const [uiConfig, setUIConfig] = useState<UIConfig>(defaultUIConfig);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const configRef = doc(db, 'uiConfig', 'default');
        
        // First try to get the existing config
        getDoc(configRef)
            .then(docSnap => {
                if (!docSnap.exists()) {
                    // Only create if it doesn't exist
                    return setDoc(configRef, defaultUIConfig);
                }
            })
            .catch(err => {
                console.error('Error checking UI config:', err);
                setError(err.message);
            });

        // Set up the listener
        const unsubscribe = onSnapshot(
            configRef,
            (doc) => {
                if (doc.exists()) {
                    const data = doc.data() as UIConfig;
                    // Merge with default config to ensure all fields exist
                    setUIConfig({
                        ...defaultUIConfig,
                        ...data,
                        kanban: {
                            ...defaultUIConfig.kanban,
                            ...data.kanban
                        }
                    });
                } else {
                    setUIConfig(defaultUIConfig);
                }
                setLoading(false);
                setError(null);
            },
            (err) => {
                console.error('Error loading UI config:', err);
                setError(err.message);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    // Funkcija za posodabljanje celotne konfiguracije
    const updateUIConfig = async (newConfig: UIConfig) => {
        setSaving(true);
        setError(null);
        try {
            const configRef = doc(db, 'uiConfig', 'default');
            await updateDoc(configRef, newConfig);
            setSaving(false);
            return true;
        } catch (err: any) {
            console.error('Error updating UI config:', err);
            setError(err.message);
            setSaving(false);
            return false;
        }
    };

    // Funkcija za posodabljanje industrij
    const updateIndustries = async (industries: UIProjectIndustry[]) => {
        setSaving(true);
        setError(null);
        try {
            const configRef = doc(db, 'uiConfig', 'default');
            await updateDoc(configRef, { industries });
            setSaving(false);
            return true;
        } catch (err: any) {
            console.error('Error updating industries:', err);
            setError(err.message);
            setSaving(false);
            return false;
        }
    };

    // Funkcija za posodabljanje finančnih rangov
    const updateBudgetRanges = async (budgetRanges: UIProjectBudgetRange[]) => {
        setSaving(true);
        setError(null);
        try {
            const configRef = doc(db, 'uiConfig', 'default');
            await updateDoc(configRef, { budgetRanges });
            setSaving(false);
            return true;
        } catch (err: any) {
            console.error('Error updating budget ranges:', err);
            setError(err.message);
            setSaving(false);
            return false;
        }
    };

    // Funkcija za posodabljanje oznak
    const updateTags = async (tags: UIProjectTag[]) => {
        setSaving(true);
        setError(null);
        try {
            const configRef = doc(db, 'uiConfig', 'default');
            await updateDoc(configRef, { tags });
            setSaving(false);
            return true;
        } catch (err: any) {
            console.error('Error updating tags:', err);
            setError(err.message);
            setSaving(false);
            return false;
        }
    };

    return { 
        uiConfig, 
        loading, 
        error, 
        saving,
        updateUIConfig,
        updateIndustries,
        updateBudgetRanges,
        updateTags
    };
};
