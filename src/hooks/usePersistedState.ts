import { useState, useEffect } from 'react';

export function usePersistedState<T>(key: string, defaultValue: T): [T, (value: T) => void] {
  // Poskusi pridobiti vrednost iz localStorage
  const [state, setState] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  });

  // Posodobi localStorage ob vsaki spremembi
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, state]);

  return [state, setState];
}
