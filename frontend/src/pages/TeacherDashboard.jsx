import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import sessionService from '../services/session.service';
import { useAuth } from '../hooks/useAuth';
import { Users, MonitorPlay, Activity, BarChart3, Eye, CheckCircle, Clock, BookOpen, GraduationCap, Code2 } from 'lucide-react';

const TeacherDashboard = () => {
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
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
    } finally {
      setLoadingSessions(false);
    }
  };

  const activeSessions = sessions.filter(s => s.status === 'active');
  const waitingSessions = sessions.filter(s => s.status === 'waiting');
  const completedSessions = sessions.filter(s => s.status === 'completed');
  const totalStudents = new Set(sessions.flatMap(s => s.SessionUsers?.map(u => u.userId) || [])).size;

  return (
    <div className="dashboard-container fade-in">
      {/* Teacher Welcome Banner */}
      <div className="dashboard-welcome glass-panel teacher-welcome">
        <div className="welcome-content">
          <div className="welcome-icon-wrapper teacher-icon">
            <GraduationCap size={32} />
          </div>
          <div>
            <h1 className="welcome-title">
              Panel del Profesor — {user?.firstName} {user?.lastName} 📚
            </h1>
            <p className="welcome-subtitle">
              Monitorea las sesiones de pair programming de tus estudiantes y revisa su progreso académico.
            </p>
          </div>
        </div>
        <button className="btn-primary btn-lg" onClick={() => navigate('/analytics')} id="view-analytics-btn">
          <BarChart3 size={20} /> Ver Analíticas
        </button>
      </div>

      {/* Stats Row */}
      <div className="stats-row">
        <div className="mini-stat glass-panel">
          <div className="mini-stat-icon" style={{ background: 'rgba(99, 102, 241, 0.15)' }}>
            <Activity size={20} color="var(--primary)" />
          </div>
          <div>
            <span className="mini-stat-value">{activeSessions.length}</span>
            <span className="mini-stat-label">En Curso</span>
          </div>
        </div>
        <div className="mini-stat glass-panel">
          <div className="mini-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)' }}>
            <Clock size={20} color="var(--warning)" />
          </div>
          <div>
            <span className="mini-stat-value">{waitingSessions.length}</span>
            <span className="mini-stat-label">En Espera</span>
          </div>
        </div>
        <div className="mini-stat glass-panel">
          <div className="mini-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)' }}>
            <CheckCircle size={20} color="var(--success)" />
          </div>
          <div>
            <span className="mini-stat-value">{completedSessions.length}</span>
            <span className="mini-stat-label">Finalizadas</span>
          </div>
        </div>
        <div className="mini-stat glass-panel">
          <div className="mini-stat-icon" style={{ background: 'rgba(236, 72, 153, 0.15)' }}>
            <Users size={20} color="var(--secondary)" />
          </div>
          <div>
            <span className="mini-stat-value">{totalStudents}</span>
            <span className="mini-stat-label">Estudiantes Activos</span>
          </div>
        </div>
      </div>

      {/* Active Sessions Section */}
      <div className="section-header">
        <h2><MonitorPlay size={22} /> Sesiones de Estudiantes</h2>
        <span className="section-count">{sessions.length} total</span>
      </div>

      {loadingSessions ? (
        <div className="loader" style={{ height: '200px' }}>Cargando sesiones...</div>
      ) : (
        <div className="teacher-sessions-table glass-panel" style={{ overflowX: 'auto' }}>
          <table className="data-table" id="sessions-table">
            <thead>
              <tr>
                <th>Sesión</th>
                <th>Curso</th>
                <th>Lenguaje</th>
                <th>Dificultad</th>
                <th>Participantes</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No hay sesiones registradas aún.
                  </td>
                </tr>
              ) : (
                sessions.map(s => {
                  const courseName = s.settings?.course || '—';
                  const lang = s.settings?.language || '—';
                  const difficulty = s.settings?.difficulty || '—';
                  const participantCount = s.SessionUsers?.length || 0;

                  return (
                    <tr key={s.id}>
                      <td>
                        <div className="table-session-title">
                          <Code2 size={16} color="var(--primary)" />
                          <span>{s.title || s.id.substring(0, 12) + '...'}</span>
                        </div>
                      </td>
                      <td><span className="table-tag"><BookOpen size={12} /> {courseName}</span></td>
                      <td><span className="badge-lang">{lang}</span></td>
                      <td>
                        <span className={`badge-difficulty ${difficulty}`}>
                          {difficulty === 'beginner' ? 'Básico' : difficulty === 'intermediate' ? 'Intermedio' : difficulty === 'advanced' ? 'Avanzado' : difficulty}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Users size={14} /> {participantCount}/2
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${s.status}`}>
                          {s.status === 'active' ? 'Activa' : s.status === 'waiting' ? 'Esperando' : 'Completada'}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn-secondary btn-sm"
                          onClick={() => navigate(`/session/${s.id}`)}
                          id={`observe-session-${s.id}`}
                        >
                          <Eye size={14} /> Observar
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
