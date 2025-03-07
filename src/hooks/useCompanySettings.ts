// hooks/useCompanySettings.ts
import { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { CompanySettings } from '../types/companySettings';

// 1. HOOK ZA NASTAVITVE PODJETJA
export const useCompanySettings = () => {
  // 1.1 Stanje
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1.2 Pridobivanje nastavitev
  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const settingsRef = doc(db, 'settings', 'company');
      const settingsDoc = await getDoc(settingsRef);
      
      if (settingsDoc.exists()) {
        setSettings(settingsDoc.data() as CompanySettings);
      } else {
        // Če nastavitve še ne obstajajo, ustvarimo privzete nastavitve
        const defaultSettings: CompanySettings = {
          name: 'Moje podjetje',
          address: 'Naslov podjetja',
          city: 'Mesto',
          postalCode: '1000',
          country: 'Slovenija',
          taxNumber: '',
          registrationNumber: '',
          email: '',
          phone: '',
          website: '',
          logoUrl: '',
          colors: {
            primary: '#3B82F6', // modra
            secondary: '#10B981', // zelena
            accent: '#F59E0B', // oranžna
          },
          // Privzete nastavitve za odmore in malice
          breakSettings: {
            lunchBreakDuration: 35, // 35 minut za malico
            shortBreakDuration: 5, // 5 minut za kratko pavzo
            totalBreakAllowance: 45, // 45 minut skupno
          },
          // Privzete nastavitve za uporabniške pravice
          userPermissions: {
            trackBreaks: true, // privzeto se beležijo odmori za vse
            exemptedUsers: [], // privzeto ni izvzetih uporabnikov
            exemptedRoles: [], // privzeto ni izvzetih vlog
          },
          createdAt: serverTimestamp() as any,
          updatedAt: serverTimestamp() as any,
        };
        
        await setDoc(settingsRef, defaultSettings);
        setSettings(defaultSettings);
      }
    } catch (err) {
      console.error('Napaka pri pridobivanju nastavitev podjetja:', err);
      setError('Napaka pri pridobivanju nastavitev podjetja');
    } finally {
      setLoading(false);
    }
  };

  // 1.3 Posodabljanje nastavitev
  const updateSettings = async (newSettings: Partial<CompanySettings>) => {
    setLoading(true);
    setError(null);
    
    try {
      const settingsRef = doc(db, 'settings', 'company');
      
      // Posodobimo samo polja, ki so bila spremenjena
      await updateDoc(settingsRef, {
        ...newSettings,
        updatedAt: serverTimestamp()
      });
      
      // Posodobimo lokalno stanje
      setSettings(prev => {
        if (!prev) return null;
        return { ...prev, ...newSettings };
      });
      
      return true;
    } catch (err) {
      console.error('Napaka pri posodabljanju nastavitev podjetja:', err);
      setError('Napaka pri posodabljanju nastavitev podjetja');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 1.4 Nalaganje nastavitev ob inicializaciji
  useEffect(() => {
    fetchSettings();
  }, []);

  // 1.5 Vračanje vrednosti
  return {
    settings,
    loading,
    error,
    updateSettings,
    refreshSettings: fetchSettings
  };
};
