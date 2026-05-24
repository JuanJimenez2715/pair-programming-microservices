import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * ProtectedRoute — Guards routes by authentication and optionally by role.
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @param {string[]} [props.allowedRoles] - Roles allowed to access this route. If empty, any authenticated user is allowed.
 */
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading, getDashboardPath } = useAuth();

  if (loading) {
    return (
      <div className="loader">
        <span>Cargando...</span>
      </div>
    );
  }

  // Not authenticated → redirect to login
  if (!user) return <Navigate to="/login" replace />;

  // Role check: if allowedRoles is specified, verify user has the right role
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect to their correct dashboard
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }

  return children;
};

export default ProtectedRoute;