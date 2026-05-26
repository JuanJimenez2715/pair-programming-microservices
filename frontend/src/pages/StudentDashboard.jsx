import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import sessionService from '../services/session.service';
import exerciseService from '../services/exercise.service';
import { useAuth } from '../hooks/useAuth';
import { Plus, Users, MonitorPlay, Activity, ArrowRight, Frown, BookOpen, Clock, CheckCircle, Code2, Play } from 'lucide-react';

const StudentDashboard = () => {
  const [sessions, setSessions] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState('');
  const [loadingSessions, setLoadingSessions] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    loadSessions();
    loadExercises();
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

  const loadExercises = async () => {
    try {
      const data = await exerciseService.getExercises();
      setExercises(data);
      if (data.length > 0) {
        setSelectedExercise(data[0]._id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async () => {
    try {
      const session = await sessionService.createSession(selectedExercise);
      navigate(`/session/${session.id}`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleJoin = async (id) => {
    try {
      await sessionService.joinSession(id);
      navigate(`/session/${id}`);
    } catch (err) {
      console.error(err);
    }
  };

  // Calculate stats
  const mySessions = sessions.filter(s => s.SessionUsers?.some(u => u.userId === user?.id));
  const activeSessions = sessions.filter(s => s.status === 'active');
  const completedSessions = mySessions.filter(s => s.status === 'completed');

  return (
    <div className="dashboard-container fade-in">
      {/* Welcome Banner */}
      <div className="dashboard-welcome glass-panel">
        <div className="welcome-content">
          <div className="welcome-icon-wrapper">
            <Code2 size={32} />
          </div>
          <div>
            <h1 className="welcome-title">
              ¡Hola, {user?.firstName || 'Estudiante'}! 👋
            </h1>
            <p className="welcome-subtitle">
              Bienvenido a tu espacio de pair programming. Selecciona un reto y crea una sesión para comenzar.
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {exercises.length > 0 ? (
            <select 
              value={selectedExercise} 
              onChange={(e) => setSelectedExercise(e.target.value)}
              style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.5)', color: 'white' }}
            >
              {exercises.map(ex => (
                <option key={ex._id} value={ex._id}>{ex.title} ({ex.language})</option>
              ))}
            </select>
          ) : (
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Sin retos disponibles. Inicia en modo libre.</span>
          )}
          <button className="btn-primary btn-lg" onClick={handleCreate} id="create-session-btn">
            <Play size={20} /> {exercises.length > 0 ? 'Empezar Reto' : 'Modo Libre'}
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="stats-row">
        <div className="mini-stat glass-panel">
          <div className="mini-stat-icon" style={{ background: 'rgba(99, 102, 241, 0.15)' }}>
            <Activity size={20} color="var(--primary)" />
          </div>
          <div>
            <span className="mini-stat-value">{activeSessions.length}</span>
            <span className="mini-stat-label">Sesiones Activas</span>
          </div>
        </div>
        <div className="mini-stat glass-panel">
          <div className="mini-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)' }}>
            <CheckCircle size={20} color="var(--success)" />
          </div>
          <div>
            <span className="mini-stat-value">{completedSessions.length}</span>
            <span className="mini-stat-label">Completadas</span>
          </div>
        </div>
        <div className="mini-stat glass-panel">
          <div className="mini-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)' }}>
            <BookOpen size={20} color="var(--warning)" />
          </div>
          <div>
            <span className="mini-stat-value">{mySessions.length}</span>
            <span className="mini-stat-label">Mis Sesiones</span>
          </div>
        </div>
        <div className="mini-stat glass-panel">
          <div className="mini-stat-icon" style={{ background: 'rgba(236, 72, 153, 0.15)' }}>
            <Users size={20} color="var(--secondary)" />
          </div>
          <div>
            <span className="mini-stat-value">{sessions.length}</span>
            <span className="mini-stat-label">Total Disponibles</span>
          </div>
        </div>
      </div>

      {/* Section Title */}
      <div className="section-header">
        <h2><MonitorPlay size={22} /> Sesiones de Programación</h2>
      </div>

      {/* Sessions Grid */}
      {loadingSessions ? (
        <div className="loader" style={{ height: '200px' }}>Cargando sesiones...</div>
      ) : (
        <div className="sessions-grid">
          {sessions.map(s => {
            const isParticipant = s.SessionUsers?.some(u => u.userId === user?.id || u.userId === user?.sub);
            const isFull = s.SessionUsers?.length >= 2;
            
            if (isFull && !isParticipant) return null; // Ocultar sesiones llenas a los que no participan

            const courseName = s.settings?.course || 'Sin curso asignado';
            const lang = s.settings?.language || 'javascript';
            const difficulty = s.settings?.difficulty || 'beginner';

            const fallbackTitles = ["Práctica de Algoritmos", "Desafío de Lógica", "Estructuras de Datos", "Optimización de Código", "Pair Programming Libre"];
            const randomFallback = fallbackTitles[s.id.charCodeAt(0) % fallbackTitles.length];
            const sessionTitle = s.title || (s.exerciseId ? 'Reto Asignado' : randomFallback);

            return (
              <div key={s.id} className="session-card glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <span className={`badge ${s.status}`}>{s.status === 'active' ? 'Activa' : s.status === 'waiting' ? 'Esperando' : 'Completada'}</span>
                  <span className="badge-lang">{lang}</span>
                </div>

                <h3 className="session-title">{sessionTitle}</h3>

                <div className="session-meta">
                  <span><BookOpen size={14} /> {courseName}</span>
                  <span><Clock size={14} /> {difficulty === 'beginner' ? 'Básico' : difficulty === 'intermediate' ? 'Intermedio' : 'Avanzado'}</span>
                </div>

                <div className="session-status" style={{ marginTop: 'auto', paddingTop: '1rem' }}>
                  <Users size={16} />
                  <span>{s.SessionUsers?.length || 0}/2 Participantes</span>
                </div>

                <div className="session-actions" style={{ marginTop: '0.75rem' }}>
                  {isParticipant ? (
                    <button className="btn-primary full-width" onClick={() => navigate(`/session/${s.id}`)} id={`resume-session-${s.id}`}>
                      Continuar <ArrowRight size={16} />
                    </button>
                  ) : !isFull && s.status !== 'completed' ? (
                    <button className="btn-secondary full-width" onClick={() => handleJoin(s.id)} id={`join-session-${s.id}`}>
                      Unirse a Sesión
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
          {sessions.length === 0 && (
            <div className="empty-state">
              <Frown className="empty-state-icon" style={{ margin: '0 auto 1rem', width: 48, height: 48 }} />
              <h3>No hay sesiones disponibles</h3>
              <p>Crea tu primera sesión de pair programming para comenzar.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
