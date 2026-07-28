// src/hooks/useMemory.jsx
import { useState, useEffect } from 'react';
import { getMemory, updateMemory } from '../firebase/firestore';
import { useAuth } from './useAuth';

export const useMemory = () => {
  const { user } = useAuth();
  const [memory, setMemory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    
    // Fallback timeout to prevent memory fetch from stalling UI loading
    const memPromise = getMemory(user.uid);
    const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve({}), 2000));
    
    Promise.race([memPromise, timeoutPromise]).then(m => {
      setMemory(m || {});
      setLoading(false);
    }).catch(() => {
      setMemory({});
      setLoading(false);
    });
  }, [user]);

  const update = async (data) => {
    if (!user) return;
    try {
      await updateMemory(user.uid, data);
    } catch (e) {}
    setMemory(prev => ({ ...prev, ...data }));
  };

  return { memory, loading, update };
};
