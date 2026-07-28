// src/hooks/useAuth.jsx
import { useState, useEffect, createContext, useContext } from 'react';
import { onAuthChange } from '../firebase/auth';
import { getUserProfile } from '../firebase/firestore';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthChange(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          // Timeout profile fetch after 2.5s so database latency never freezes app loading
          const profilePromise = getUserProfile(firebaseUser.uid);
          const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(null), 2500));
          const prof = await Promise.race([profilePromise, timeoutPromise]);
          setProfile(prof || { name: firebaseUser.displayName || 'Student' });
        } catch (e) {
          setProfile({ name: firebaseUser.displayName || 'Student' });
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, setProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
