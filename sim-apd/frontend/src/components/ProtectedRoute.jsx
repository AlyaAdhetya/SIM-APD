import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingPage } from './Loading';

/**
 * allowedUserType: 'mahasiswa' | 'staff'
 * allowedRoles: ['hc'] | ['hsse'] | undefined (semua role staff boleh)
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, role, loading } = useAuth();

  if (loading) return <LoadingPage label="Memeriksa sesi login..." />;

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
