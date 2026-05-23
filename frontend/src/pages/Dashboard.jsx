import { useState, useEffect } from 'react';
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
                <span className={`badge ${s.status}`}>{s.status}</span>
                <span>{s.SessionUsers?.length || 0}/2 Users</span>
              </div>
              <div className="session-actions">
                {isParticipant ? (
                  <button className="btn-primary" onClick={() => navigate(`/session/${s.id}`)}>Resume</button>
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

export default Dashboard;