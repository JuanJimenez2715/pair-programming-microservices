import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import sessionService from '../services/session.service';
import { useWebSocket } from '../hooks/useWebSocket';

const Session = () => {
  const { id } = useParams();
  const [session, setSession] = useState(null);
  const { isConnected } = useWebSocket(id);

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
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span className={`badge ${isConnected ? 'active' : 'waiting'}`}>
            WS: {isConnected ? 'Connected' : 'Connecting...'}
          </span>
          <span className={`badge ${session.status}`}>{session.status}</span>
        </div>
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
                <span className={`role-badge ${su.role}`}>{su.role}</span>
                User: {su.userId.split('-')[0]}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Session;