// hooks/useTheme.ts
import { useState, useEffect } from 'react';
import { useCompanySettings } from './useCompanySettings';

// 1. HOOK ZA UPRAVLJANJE TEM
export const useTheme = () => {
  // 1.1 Stanje
  const [theme, setTheme] = useState({
    primary: '#3B82F6',
    secondary: '#10B981',
    accent: '#F59E0B'
  });
  
  // 1.2 Pridobivanje nastavitev podjetja
  const { settings, loading } = useCompanySettings();
  
  // 1.3 Posodobitev teme ob spremembi nastavitev
  useEffect(() => {
    if (settings && settings.colors) {
      // Posodobi temo z barvami iz nastavitev podjetja
      setTheme({
        primary: settings.colors.primary,
        secondary: settings.colors.secondary,
        accent: settings.colors.accent
      });
      
      // Posodobi CSS spremenljivke
      document.documentElement.style.setProperty('--color-primary', settings.colors.primary);
      document.documentElement.style.setProperty('--color-secondary', settings.colors.secondary);
      document.documentElement.style.setProperty('--color-accent', settings.colors.accent);
    }
  }, [settings]);
  
  // 1.4 Vračanje vrednosti
  return {
    theme,
    loading
  };
};
