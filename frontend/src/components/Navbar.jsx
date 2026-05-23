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
        <Link to="/">👩‍💻 PairApp</Link>
      </div>
      <div className="nav-links">
        {user ? (
          <>
            <span className="user-badge">{user.role}</span>
            <span className="user-email">{user.email || user.sub}</span>
            <button onClick={handleLogout} className="btn-secondary">Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn-secondary">Login</Link>
            <Link to="/register" className="btn-primary">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;