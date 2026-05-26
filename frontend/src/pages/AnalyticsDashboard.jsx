import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { BarChart3, Brain, Users, Activity } from 'lucide-react';

const COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ec4899'];

const AnalyticsDashboard = () => {
  const [aiStats, setAiStats] = useState([]);
  const [collabStats, setCollabStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [aiRes, collabRes] = await Promise.all([
          fetch('http://localhost:8000/analytics/api/analytics/ai-stats'),
          fetch('http://localhost:8000/analytics/api/analytics/collaboration')
        ]);
        const aiData = await aiRes.json();
        const collabData = await collabRes.json();
        setAiStats(Array.isArray(aiData) ? aiData : []);
        setCollabStats(Array.isArray(collabData) ? collabData : []);
      } catch (err) {
        setError('No se pudieron cargar las analíticas. Asegúrate de que ms-analytics esté corriendo.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  // Group collab stats by eventType for the bar chart
  const collabByEvent = collabStats.reduce((acc, item) => {
    const existing = acc.find(a => a.eventType === item.eventType);
    if (existing) {
      existing.total += item.total;
    } else {
      acc.push({ eventType: item.eventType, total: item.total });
    }
    return acc;
  }, []);

  return (
    <div className="dashboard-container fade-in">
      {/* Header */}
      <div className="dashboard-welcome glass-panel teacher-welcome">
        <div className="welcome-content">
          <div className="welcome-icon-wrapper teacher-icon">
            <BarChart3 size={32} />
          </div>
          <div>
            <h1 className="welcome-title">Analíticas de la Plataforma 📊</h1>
            <p className="welcome-subtitle">
              Métricas de colaboración e inteligencia artificial de los últimos 7 días.
            </p>
          </div>
        </div>
      </div>

      {loading && (
        <div className="loader" style={{ height: '200px' }}>Cargando analíticas...</div>
      )}

      {error && (
        <div className="glass-panel" style={{ padding: '2rem', color: 'var(--danger)', textAlign: 'center', marginTop: '1rem' }}>
          ⚠️ {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Stats summary */}
          <div className="stats-row" style={{ marginTop: '1.5rem' }}>
            <div className="mini-stat glass-panel">
              <div className="mini-stat-icon" style={{ background: 'rgba(99,102,241,0.15)' }}>
                <Brain size={20} color="var(--primary)" />
              </div>
              <div>
                <span className="mini-stat-value">{aiStats.reduce((a, b) => a + (b.count || 0), 0)}</span>
                <span className="mini-stat-label">Sugerencias IA</span>
              </div>
            </div>
            <div className="mini-stat glass-panel">
              <div className="mini-stat-icon" style={{ background: 'rgba(16,185,129,0.15)' }}>
                <Activity size={20} color="var(--success)" />
              </div>
              <div>
                <span className="mini-stat-value">{collabStats.reduce((a, b) => a + (b.total || 0), 0)}</span>
                <span className="mini-stat-label">Eventos de Colaboración</span>
              </div>
            </div>
            <div className="mini-stat glass-panel">
              <div className="mini-stat-icon" style={{ background: 'rgba(59,130,246,0.15)' }}>
                <Users size={20} color="var(--primary)" />
              </div>
              <div>
                <span className="mini-stat-value">{new Set(collabStats.map(s => s.sessionId)).size}</span>
                <span className="mini-stat-label">Sesiones con Datos</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
            {/* AI Suggestions Pie Chart */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Brain size={18} color="var(--primary)" /> Sugerencias IA por Tipo
              </h3>
              {aiStats.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>
                  Sin datos aún. Las sugerencias aparecerán cuando los estudiantes usen la IA.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={aiStats} dataKey="count" nameKey="type" cx="50%" cy="50%" outerRadius={100} label={({ type, count }) => `${type}: ${count}`}>
                      {aiStats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Collaboration Events Bar Chart */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Activity size={18} color="var(--success)" /> Eventos de Colaboración por Tipo
              </h3>
              {collabByEvent.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>
                  Sin datos aún. Los eventos aparecerán cuando los estudiantes trabajen en sesiones.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={collabByEvent}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="eventType" stroke="var(--text-muted)" />
                    <YAxis stroke="var(--text-muted)" />
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)' }} />
                    <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Per-session breakdown */}
          {collabStats.length > 0 && (
            <div className="glass-panel" style={{ padding: '1.5rem', marginTop: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>Detalle por Sesión</h3>
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Sesión ID</th>
                      <th>Tipo de Evento</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {collabStats.map((row, i) => (
                      <tr key={i}>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{row.sessionId?.substring(0, 16)}...</td>
                        <td><span className="badge-lang">{row.eventType}</span></td>
                        <td><strong>{row.total}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AnalyticsDashboard;