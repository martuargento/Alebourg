import { createContext, useContext, useEffect, useState } from 'react';
import { cerrarSesion, iniciarSesion } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAdmin, setAdmin] = useState(() => Boolean(localStorage.getItem('admin_token')));

  useEffect(() => {
    const manejarSesionExpirada = () => setAdmin(false);
    window.addEventListener('alebourg:auth-expired', manejarSesionExpirada);
    return () => window.removeEventListener('alebourg:auth-expired', manejarSesionExpirada);
  }, []);

  const login = async (credentials) => {
    const session = await iniciarSesion(credentials);
    setAdmin(true);
    return session;
  };

  const logout = () => {
    cerrarSesion();
    setAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider.');
  }
  return context;
}
