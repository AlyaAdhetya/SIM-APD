import { createContext, useContext, useEffect, useState } from 'react';
import { getMe } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);       // data user (mahasiswa atau staff)
  const [userType, setUserType] = useState(null); // 'mahasiswa' | 'staff'
  const [role, setRole] = useState(null);         // 'hc' | 'hsse' | null
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('simapd_token');
    if (!token) {
      setLoading(false);
      return;
    }
    getMe()
      .then((res) => {
        setUser(res.data.user);
        setUserType(res.data.user_type);
        setRole(res.data.role);
      })
      .catch(() => {
        localStorage.removeItem('simapd_token');
      })
      .finally(() => setLoading(false));
  }, []);

  function login({ token, user, user_type, role }) {
    localStorage.setItem('simapd_token', token);
    localStorage.setItem('simapd_user_type', user_type);
    if (role) localStorage.setItem('simapd_role', role);
    setUser(user);
    setUserType(user_type);
    setRole(role || null);
  }

  function logoutLocal() {
    localStorage.removeItem('simapd_token');
    localStorage.removeItem('simapd_user_type');
    localStorage.removeItem('simapd_role');
    setUser(null);
    setUserType(null);
    setRole(null);
  }

  function updateUser(partial) {
    setUser((prev) => ({ ...prev, ...partial }));
  }

  return (
    <AuthContext.Provider value={{ user, userType, role, loading, login, logoutLocal, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth harus dipakai di dalam <AuthProvider>');
  return ctx;
}
