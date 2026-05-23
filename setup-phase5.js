const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Install dependencies in frontend
console.log('Installing dependencies in frontend...');
execSync('npm install react-router-dom axios lucide-react', { cwd: path.join(__dirname, 'frontend'), stdio: 'inherit' });

const dirs = [
  'frontend/src/pages',
  'frontend/src/components',
  'frontend/src/services',
  'frontend/src/hooks',
  'frontend/src/store'
];

dirs.forEach(d => fs.mkdirSync(path.join(__dirname, d), { recursive: true }));

const files = {};

// 1. App.jsx
files['frontend/src/App.jsx'] = `import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './store/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Session from './pages/Session';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app-container">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/session/:id" element={<ProtectedRoute><Session /></ProtectedRoute>} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;`;

// 2. AuthContext.jsx
files['frontend/src/store/AuthContext.jsx'] = `import { createContext, useState, useEffect } from 'react';
import authService from '../services/auth.service';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const userData = await authService.getCurrentUser();
          setUser(userData);
        } catch (error) {
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    setUser(data.user);
  };

  const register = async (email, password, role) => {
    const data = await authService.register(email, password, role);
    setUser(data.user);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};`;

// 3. hooks/useAuth.js
files['frontend/src/hooks/useAuth.js'] = `import { useContext } from 'react';
import { AuthContext } from '../store/AuthContext';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};`;

// 4. services/api.js
files['frontend/src/services/api.js'] = `import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api', // Points to Kong API Gateway
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = \`Bearer \${token}\`;
  }
  return config;
});

export default api;`;

// 5. services/auth.service.js
files['frontend/src/services/auth.service.js'] = `import api from './api';

const authService = {
  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.tokens) {
      localStorage.setItem('token', res.data.tokens.access.token);
    }
    return res.data;
  },
  register: async (email, password, role) => {
    const res = await api.post('/auth/register', { email, password, role });
    if (res.data.tokens) {
      localStorage.setItem('token', res.data.tokens.access.token);
    }
    return res.data;
  },
  getCurrentUser: async () => {
    const res = await api.get('/auth/me');
    return res.data.user;
  },
  logout: () => {
    localStorage.removeItem('token');
  }
};

export default authService;`;

// 6. services/session.service.js
files['frontend/src/services/session.service.js'] = `import api from './api';

const sessionService = {
  createSession: async (exerciseId = null) => {
    const res = await api.post('/sessions', { exerciseId });
    return res.data;
  },
  getSessions: async () => {
    const res = await api.get('/sessions');
    return res.data;
  },
  getSessionById: async (id) => {
    const res = await api.get(\`/sessions/\${id}\`);
    return res.data;
  },
  joinSession: async (id) => {
    const res = await api.post(\`/sessions/\${id}/join\`);
    return res.data;
  }
};

export default sessionService;`;

// 7. ProtectedRoute
files['frontend/src/components/ProtectedRoute.jsx'] = `import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="loader">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  
  return children;
};

export default ProtectedRoute;`;

// 8. Navbar
files['frontend/src/components/Navbar.jsx'] = `import { Link, useNavigate } from 'react-router-dom';
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

export default Navbar;`;

// 9. Login
files['frontend/src/pages/Login.jsx'] = `import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card glass-panel">
        <h2>Welcome Back</h2>
        {error && <div className="alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn-primary full-width">Login</button>
        </form>
        <p className="auth-link">Don't have an account? <Link to="/register">Register here</Link></p>
      </div>
    </div>
  );
};

export default Login;`;

// 10. Register
files['frontend/src/pages/Register.jsx'] = `import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(email, password, role);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card glass-panel">
        <h2>Create Account</h2>
        {error && <div className="alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
          </div>
          <button type="submit" className="btn-primary full-width">Register</button>
        </form>
        <p className="auth-link">Already have an account? <Link to="/login">Login here</Link></p>
      </div>
    </div>
  );
};

export default Register;`;

// 11. Dashboard
files['frontend/src/pages/Dashboard.jsx'] = `import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import sessionService from '../services/session.service';
import { useAuth } from '../hooks/useAuth';

const Dashboard = () => {
  const [sessions, setSessions] = useState([]);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const data = await sessionService.getSessions();
      setSessions(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async () => {
    try {
      const session = await sessionService.createSession();
      navigate(\`/session/\${session.id}\`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleJoin = async (id) => {
    try {
      await sessionService.joinSession(id);
      navigate(\`/session/\${id}\`);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="dashboard-container fade-in">
      <div className="dashboard-header">
        <h1>Active Sessions</h1>
        <button className="btn-primary" onClick={handleCreate}>+ New Session</button>
      </div>
      
      <div className="sessions-grid">
        {sessions.map(s => {
          const isParticipant = s.SessionUsers?.some(u => u.userId === user.sub || u.userId === user.id);
          const isFull = s.SessionUsers?.length >= 2;
          
          return (
            <div key={s.id} className="session-card glass-panel">
              <h3>Session</h3>
              <p className="session-id">{s.id.split('-')[0]}</p>
              <div className="session-status">
                <span className={\`badge \${s.status}\`}>{s.status}</span>
                <span>{s.SessionUsers?.length || 0}/2 Users</span>
              </div>
              <div className="session-actions">
                {isParticipant ? (
                  <button className="btn-primary" onClick={() => navigate(\`/session/\${s.id}\`)}>Resume</button>
                ) : !isFull && s.status !== 'completed' ? (
                  <button className="btn-secondary" onClick={() => handleJoin(s.id)}>Join as Navigator</button>
                ) : (
                  <button className="btn-disabled" disabled>Full</button>
                )}
              </div>
            </div>
          );
        })}
        {sessions.length === 0 && <p className="empty-state">No active sessions. Create one!</p>}
      </div>
    </div>
  );
};

export default Dashboard;`;

// 12. Session Placeholder
files['frontend/src/pages/Session.jsx'] = `import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import sessionService from '../services/session.service';

const Session = () => {
  const { id } = useParams();
  const [session, setSession] = useState(null);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const data = await sessionService.getSessionById(id);
        setSession(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchSession();
  }, [id]);

  if (!session) return <div className="loader">Loading Session...</div>;

  return (
    <div className="session-workspace fade-in">
      <div className="workspace-header glass-panel">
        <h2>Pair Programming Session</h2>
        <span className={\`badge \${session.status}\`}>{session.status}</span>
      </div>
      
      <div className="workspace-main">
        <div className="editor-placeholder glass-panel">
          <p>Editor Component (Monaco + Yjs) will be injected here in Phase 7</p>
        </div>
        <div className="sidebar glass-panel">
          <h3>Participants</h3>
          <ul className="participant-list">
            {session.SessionUsers?.map(su => (
              <li key={su.userId}>
                <span className={\`role-badge \${su.role}\`}>{su.role}</span>
                User: {su.userId.split('-')[0]}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Session;`;

// 13. CSS
files['frontend/src/index.css'] = `
:root {
  --bg-dark: #0f172a;
  --bg-glass: rgba(30, 41, 59, 0.7);
  --primary: #6366f1;
  --primary-hover: #4f46e5;
  --secondary: #3b82f6;
  --text-main: #f8fafc;
  --text-muted: #94a3b8;
  --error: #ef4444;
  --success: #10b981;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Inter', system-ui, sans-serif;
  background: var(--bg-dark);
  background-image: radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.1) 0%, transparent 40%),
                    radial-gradient(circle at 90% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 40%);
  background-attachment: fixed;
  color: var(--text-main);
  min-height: 100vh;
}

.glass-panel {
  background: var(--bg-glass);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
}

.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* Navbar */
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}
.nav-brand a { color: white; text-decoration: none; font-size: 1.5rem; font-weight: bold; }
.nav-links { display: flex; gap: 1rem; align-items: center; }

/* Buttons */
button, .btn-primary, .btn-secondary {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s ease;
  display: inline-block;
  text-align: center;
}
.btn-primary { background: var(--primary); color: white; }
.btn-primary:hover { background: var(--primary-hover); transform: translateY(-1px); }
.btn-secondary { background: rgba(255,255,255,0.1); color: white; }
.btn-secondary:hover { background: rgba(255,255,255,0.15); }
.full-width { width: 100%; }

/* Auth */
.auth-container { display: flex; justify-content: center; align-items: center; height: 80vh; }
.auth-card { padding: 2rem; width: 100%; max-width: 400px; }
.auth-card h2 { margin-bottom: 1.5rem; text-align: center; }
.form-group { margin-bottom: 1rem; }
.form-group label { display: block; margin-bottom: 0.5rem; color: var(--text-muted); }
.form-group input, .form-group select { 
  width: 100%; padding: 0.75rem; border-radius: 8px; 
  background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); 
  color: white; outline: none; 
}
.form-group input:focus { border-color: var(--primary); }
.auth-link { margin-top: 1rem; text-align: center; color: var(--text-muted); font-size: 0.9rem; }
.auth-link a { color: var(--primary); text-decoration: none; }

/* Dashboard */
.dashboard-container { padding: 2rem; max-width: 1200px; margin: 0 auto; width: 100%; }
.dashboard-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
.sessions-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; }
.session-card { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
.session-id { color: var(--text-muted); font-family: monospace; }
.session-status { display: flex; justify-content: space-between; font-size: 0.9rem; }
.badge { padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.8rem; font-weight: bold; text-transform: uppercase; }
.badge.waiting { background: rgba(245, 158, 11, 0.2); color: #fcd34d; }
.badge.active { background: rgba(16, 185, 129, 0.2); color: #6ee7b7; }
.badge.completed { background: rgba(107, 114, 128, 0.2); color: #d1d5db; }

/* Session Workspace */
.session-workspace { padding: 1rem; height: calc(100vh - 70px); display: flex; flex-direction: column; gap: 1rem; }
.workspace-header { padding: 1rem; display: flex; justify-content: space-between; align-items: center; }
.workspace-main { display: flex; gap: 1rem; flex: 1; }
.editor-placeholder { flex: 3; display: flex; align-items: center; justify-content: center; color: var(--text-muted); }
.sidebar { flex: 1; padding: 1rem; }
.participant-list { list-style: none; margin-top: 1rem; display: flex; flex-direction: column; gap: 0.5rem; }
.participant-list li { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; background: rgba(0,0,0,0.2); border-radius: 8px; }
.role-badge { font-size: 0.7rem; padding: 0.2rem 0.4rem; border-radius: 4px; text-transform: uppercase; }
.role-badge.driver { background: #3b82f6; }
.role-badge.navigator { background: #8b5cf6; }

/* Utils */
.fade-in { animation: fadeIn 0.3s ease-in; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.alert-error { background: rgba(239, 68, 68, 0.1); color: var(--error); padding: 0.75rem; border-radius: 8px; margin-bottom: 1rem; text-align: center; }
`;

// 14. Dockerfile frontend
files['frontend/Dockerfile'] = `FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]
`;

// Make sure to clean up the default React assets
try {
  fs.unlinkSync(path.join(__dirname, 'frontend/src/App.css'));
  fs.unlinkSync(path.join(__dirname, 'frontend/src/assets/react.svg'));
} catch(e) {}

Object.entries(files).forEach(([f, content]) => {
  fs.writeFileSync(path.join(__dirname, f), content);
});

// Update main.jsx to not include App.css
let mainJsxPath = path.join(__dirname, 'frontend/src/main.jsx');
if (fs.existsSync(mainJsxPath)) {
  let mainJsx = fs.readFileSync(mainJsxPath, 'utf8');
  mainJsx = mainJsx.replace("import './index.css'", "import './index.css'");
  mainJsx = mainJsx.replace("import './App.css'", "");
  fs.writeFileSync(mainJsxPath, mainJsx);
}

// Ensure the frontend is built or dev server can run
console.log('Phase 5 frontend scaffolding complete');
