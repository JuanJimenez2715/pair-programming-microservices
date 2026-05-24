import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LogIn, Code2, AlertCircle } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, getDashboardPath } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      // Navigate to their specific dashboard based on role
      navigate(getDashboardPath(user.role));
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Credenciales inválidas. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container fade-in">
      <div className="auth-card glass-panel" style={{ padding: '3.5rem 2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <div style={{ background: 'var(--primary-glow)', padding: '1rem', borderRadius: '50%' }}>
            <Code2 size={40} color="var(--primary)" />
          </div>
        </div>
        <h2>Bienvenido de Nuevo</h2>
        <p className="auth-subtitle">Ingresa a la plataforma académica IntelliPair</p>

        {error && (
          <div className="alert-error" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
            <AlertCircle size={18} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Correo Institucional</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@est.edu o @docente.edu"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            className={`btn-primary full-width ${loading ? 'btn-loading' : ''}`}
            disabled={loading}
            style={{ marginTop: '1rem', padding: '0.8rem' }}
          >
            {!loading && <LogIn size={18} />}
            {loading ? ' Autenticando...' : ' Iniciar Sesión'}
          </button>
        </form>

        <p className="auth-link">
          ¿No tienes cuenta institucional? <Link to="/register">Regístrate aquí</Link>
        </p>

        <div className="auth-hint">
          <strong>Demo Credenciales:</strong><br/>
          Estudiante: carlos.mendez@est.edu / password123<br/>
          Profesor: prof.garcia@docente.edu / password123
        </div>
      </div>
    </div>
  );
};

export default Login;