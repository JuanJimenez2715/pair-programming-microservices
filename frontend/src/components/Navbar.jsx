import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <Link to="/">✨ IntelliPair</Link>
      </div>
      <div className="nav-links">
        {user ? (
          <>
            <span className="user-badge">{user.role || 'student'}</span>
            <Link to="/analytics" className="btn-secondary" style={{ fontSize: '0.85rem', padding: '0.4rem 1rem' }}>
              📊 Analytics
            </Link>
            <span className="user-email">{user.email || user.sub}</span>
            <button onClick={handleLogout} className="btn-secondary">Salir</button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn-secondary">Iniciar Sesión</Link>
            <Link to="/register" className="btn-primary">Registrarse</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;