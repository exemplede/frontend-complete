import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { setUser(authService.getCurrentUser()); setLoading(false); }, []);

  const login = async (username, password) => { const data = await authService.login(username, password); setUser(data.user); return data; };
  const logout = async () => { await authService.logout(); setUser(null); };
  const hasRole = (role) => user?.groups?.includes(role) || false;
  const hasAnyRole = (roles) => roles.some(r => user?.groups?.includes(r)) || false;

  return (
    <AuthContext.Provider value={{
      user, login, logout, hasRole, hasAnyRole, loading,
      isGestionnaireParticulier: hasRole('GestionnaireParticulier'),
      isGestionnaireGlobal: hasRole('GestionnaireGlobal'),
      isMaire: hasRole('Maire'),
    }}>
      {children}
    </AuthContext.Provider>
  );
};
