import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import sessionService from '../services/session.service';
import exerciseService from '../services/exercise.service';
import { useAuth } from '../hooks/useAuth';
import { Users, MonitorPlay, Activity, BarChart3, Eye, CheckCircle, Clock, BookOpen, GraduationCap, Code2, Plus, Trash2, Play } from 'lucide-react';

const TeacherDashboard = () => {
  const [sessions, setSessions] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingExercises, setLoadingExercises] = useState(true);
  const [selectedExercise, setSelectedExercise] = useState('');

  const [showExerciseForm, setShowExerciseForm] = useState(false);
  const [newExercise, setNewExercise] = useState({ title: '', description: '', difficulty: 'Medium', language: 'javascript' });

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
      if (data.length > 0) setSelectedExercise(data[0]._id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingExercises(false);
    }
  };

  const handleCreateSession = async () => {
    try {
      const session = await sessionService.createSession(selectedExercise);
      navigate(`/session/${session.id}`);
    } catch (err) {
      console.error('Failed to create session', err);
    }
  };

  const handleCreateExercise = async (e) => {
    e.preventDefault();
    try {
      await exerciseService.createExercise(newExercise);
      setNewExercise({ title: '', description: '', difficulty: 'Medium', language: 'javascript' });
      setShowExerciseForm(false);
      loadExercises();
    } catch (err) {
      console.error('Failed to create exercise', err);
    }
  };

  const handleDeleteExercise = async (id) => {
    if (!window.confirm('¿Eliminar este ejercicio?')) return;
    try {
      await exerciseService.deleteExercise(id);
      loadExercises();
    } catch (err) {
      console.error('Failed to delete exercise', err);
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
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {exercises.length > 0 && (
            <select
              value={selectedExercise}
              onChange={(e) => setSelectedExercise(e.target.value)}
              style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.5)', color: 'white' }}
            >
              {exercises.map(ex => (
                <option key={ex._id} value={ex._id}>{ex.title} ({ex.language})</option>
              ))}
            </select>
          )}
          <button className="btn-primary btn-lg" onClick={handleCreateSession} disabled={!selectedExercise}>
            <Play size={20} /> Nueva Sesión
          </button>
          <button className="btn-primary btn-lg" onClick={() => navigate('/analytics')} id="view-analytics-btn">
            <BarChart3 size={20} /> Ver Analíticas
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

      {/* Exercises Section */}
      <div className="section-header" style={{ marginTop: '2rem' }}>
        <h2><BookOpen size={22} /> Ejercicios / Retos</h2>
        <button className="btn-primary" onClick={() => setShowExerciseForm(!showExerciseForm)}>
          <Plus size={18} /> Nuevo Ejercicio
        </button>
      </div>

      {showExerciseForm && (
        <form className="auth-form glass-panel" onSubmit={handleCreateExercise} style={{ marginBottom: '2rem' }}>
          <h3>Crear Nuevo Ejercicio</h3>
          <div className="form-group">
            <label>Título del Ejercicio</label>
            <input type="text" required value={newExercise.title} onChange={e => setNewExercise({...newExercise, title: e.target.value})} placeholder="Ej: Calculadora en Python" />
          </div>
          <div className="form-group">
            <label>Descripción / Instrucciones</label>
            <textarea required value={newExercise.description} onChange={e => setNewExercise({...newExercise, description: e.target.value})} rows={3} placeholder="Describe lo que deben construir..."></textarea>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Lenguaje</label>
              <select value={newExercise.language} onChange={e => setNewExercise({...newExercise, language: e.target.value})}>
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
              </select>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Dificultad</label>
              <select value={newExercise.difficulty} onChange={e => setNewExercise({...newExercise, difficulty: e.target.value})}>
                <option value="Easy">Básico</option>
                <option value="Medium">Intermedio</option>
                <option value="Hard">Avanzado</option>
              </select>
            </div>
          </div>
          <button type="submit" className="btn-primary">Guardar Ejercicio</button>
        </form>
      )}

      {loadingExercises ? (
        <div className="loader" style={{ height: '100px' }}>Cargando ejercicios...</div>
      ) : (
        <div className="teacher-sessions-table glass-panel" style={{ overflowX: 'auto', marginBottom: '2rem' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Título</th>
                <th>Descripción</th>
                <th>Lenguaje</th>
                <th>Dificultad</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {exercises.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No hay ejercicios creados aún. Crea el primero con el botón de arriba.
                  </td>
                </tr>
              ) : (
                exercises.map(ex => (
                  <tr key={ex._id}>
                    <td><strong>{ex.title}</strong></td>
                    <td>{ex.description.length > 50 ? ex.description.substring(0, 50) + '...' : ex.description}</td>
                    <td><span className="badge-lang">{ex.language}</span></td>
                    <td><span className={`badge-difficulty ${ex.difficulty.toLowerCase()}`}>{ex.difficulty}</span></td>
                    <td>
                      <button className="btn-secondary btn-sm" onClick={() => handleDeleteExercise(ex._id)} style={{ color: 'var(--danger)' }}>
                        <Trash2 size={14} /> Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Sessions Section */}
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