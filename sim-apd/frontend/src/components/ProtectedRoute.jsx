import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingPage } from './Loading';

/**
 * allowedUserType: 'mahasiswa' | 'staff'
 * allowedRoles: ['hc'] | ['hsse'] | undefined (semua role staff boleh)
 */
export default function ProtectedRoute({ children, allowedUserType, allowedRoles }) {
  const { user, userType, role, loading } = useAuth();

  if (loading) return <LoadingPage label="Memeriksa sesi login..." />;

  if (!user) {
    return <Navigate to={allowedUserType === 'mahasiswa' ? '/login' : '/staff/login'} replace />;
  }
  if (allowedUserType && userType !== allowedUserType) {
    return <Navigate to="/" replace />;
  }
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }


  return children;
}
