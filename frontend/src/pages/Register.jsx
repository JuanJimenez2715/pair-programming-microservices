import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { UserPlus, Code2, AlertCircle } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'student'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(formData);
      navigate('/login', { state: { message: 'Registro exitoso. Por favor, inicia sesión.' } });
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Error en el registro. Verifica los datos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container fade-in">
      <div className="auth-card glass-panel" style={{ padding: '2.5rem', maxWidth: '500px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
          <div style={{ background: 'var(--primary-glow)', padding: '1rem', borderRadius: '50%' }}>
            <UserPlus size={32} color="var(--primary)" />
          </div>
        </div>
        <h2>Crear Cuenta Institucional</h2>
        <p className="auth-subtitle">Regístrate en IntelliPair para comenzar</p>

        {error && (
          <div className="alert-error" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', textAlign: 'left' }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} /> 
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="firstName">Nombre</label>
              <input
                id="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Ej. Juan"
                required
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="lastName">Apellido</label>
              <input
                id="lastName"
                type="text"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Ej. Pérez"
                required
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Correo Institucional</label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="juan.perez@est.edu"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Contraseña (Mín. 6 caracteres)</label>
            <input
              id="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              minLength={6}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="role">Rol Académico</label>
            <select 
              id="role" 
              value={formData.role} 
              onChange={handleChange}
              style={{
                width: '100%', padding: '0.7rem 1rem', borderRadius: '8px',
                background: 'rgba(6, 11, 24, 0.7)', border: '1px solid var(--panel-border)',
                color: 'var(--text-primary)', fontSize: '0.95rem', outline: 'none'
              }}
            >
              <option value="student">Estudiante</option>
              <option value="teacher">Profesor</option>
            </select>
          </div>
          
          <button
            type="submit"
            className={`btn-primary full-width ${loading ? 'btn-loading' : ''}`}
            disabled={loading}
            style={{ marginTop: '1rem', padding: '0.8rem' }}
          >
            {!loading && <Code2 size={18} />}
            {loading ? ' Registrando...' : ' Completar Registro'}
          </button>
        </form>
        
        <p className="auth-link">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión aquí</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;