import { useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, loginWithGoogle, logoutUser } from '../lib/firebase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    setAuthError(null);
    try {
      const loggedUser = await loginWithGoogle();
      return loggedUser;
    } catch (err: any) {
      setAuthError(err.message || 'Google 로그인에 실패했습니다.');
      throw err;
    }
  };

  const signOut = async () => {
    setAuthError(null);
    try {
      await logoutUser();
    } catch (err: any) {
      setAuthError(err.message || '로그아웃에 실패했습니다.');
      throw err;
    }
  };

  return {
    user,
    loading,
    authError,
    signIn,
    signOut,
  };
}
