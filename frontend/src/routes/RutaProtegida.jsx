import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function RutaProtegida({ children }) {
  const { isAdmin } = useAuth();
  return isAdmin ? children : <Navigate to="/login" replace />;
}
