import { useState, useCallback } from 'react';

const STORAGE_KEY = 'touchgrass-supporter';

export function useSupporter() {
  const [isSupporter, setIsSupporter] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const activate = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsSupporter(true);
  }, []);

  const reset = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setIsSupporter(false);
  }, []);

  return { isSupporter, activate, reset };
}
