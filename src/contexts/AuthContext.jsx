import { createContext, useContext, useEffect, useState } from 'react';
import { getAuth, signInAnonymously, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
import { app } from '@/firebase/config';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth(app);

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);

      // Store auth state in localStorage
      if (firebaseUser) {
        localStorage.setItem('isAuthenticated', 'true');
      } else {
        localStorage.removeItem('isAuthenticated');
      }
    });

    return unsubscribe;
  }, [auth]);

  const signIn = async () => {
    try {
      await signInAnonymously(auth);
      return true;
    } catch (error) {
      console.error('Error signing in:', error);
      return false;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      localStorage.removeItem('isAuthenticated');
      return true;
    } catch (error) {
      console.error('Error signing out:', error);
      return false;
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
