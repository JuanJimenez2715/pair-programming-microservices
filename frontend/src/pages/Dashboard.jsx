import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import sessionService from '../services/session.service';
import { useAuth } from '../hooks/useAuth';
import { Plus, Users, MonitorPlay, Activity, ArrowRight, Frown } from 'lucide-react';

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

  return (
    <div className="dashboard-container fade-in">
      <div className="dashboard-header glass-panel" style={{ padding: '1.5rem 2rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Activity color="var(--primary)" size={28} />
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Active Sessions</h1>
        </div>
        <button className="btn-primary" onClick={handleCreate} style={{ padding: '0.6rem 1.2rem' }}>
          <Plus size={18} /> New Session
        </button>
      </div>
      
      <div className="sessions-grid">
        {sessions.map(s => {
          const isParticipant = s.SessionUsers?.some(u => u.userId === user.sub || u.userId === user.id);
          const isFull = s.SessionUsers?.length >= 2;
          
          return (
            <div key={s.id} className="session-card glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                  <MonitorPlay size={18} color="var(--secondary)" /> Session
                </h3>
                <span className={`badge ${s.status}`}>{s.status}</span>
              </div>
              <p className="session-id" style={{ marginTop: 0, background: 'rgba(255,255,255,0.05)', padding: '0.3rem 0.6rem', borderRadius: '4px', display: 'inline-block' }}>
                {s.id.split('-')[0]}...
              </p>
              
              <div className="session-status" style={{ marginTop: 'auto', paddingTop: '1rem' }}>
                <Users size={16} />
                <span>{s.SessionUsers?.length || 0}/2 Users Connected</span>
              </div>
              
              <div className="session-actions" style={{ marginTop: '1rem' }}>
                {isParticipant ? (
                  <button className="btn-primary full-width" onClick={() => navigate(`/session/${s.id}`)}>
                    Resume <ArrowRight size={16} />
                  </button>
                ) : !isFull && s.status !== 'completed' ? (
                  <button className="btn-secondary full-width" onClick={() => handleJoin(s.id)}>
                    Join as Navigator
                  </button>
                ) : (
                  <button className="btn-disabled full-width" disabled>Session Full</button>
                )}
              </div>
            </div>
          );
        })}
        {sessions.length === 0 && (
          <div className="empty-state">
            <Frown className="empty-state-icon" style={{ margin: '0 auto 1rem' }} />
            <h3>No active sessions found</h3>
            <p>You can create a new pair programming session to get started.</p>
            <button className="btn-primary" onClick={handleCreate} style={{ marginTop: '1.5rem' }}>
              <Plus size={18} /> Create First Session
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;