const fs = require('fs');
const path = require('path');

// 1. Update ms-editor app.js
const appJsPath = path.join(__dirname, 'ms-editor/src/app.js');
let appJsContent = fs.readFileSync(appJsPath, 'utf8');

appJsContent = appJsContent.replace(
  "redisPubSub.publish(`session:${suggestion.sessionId}:ai-suggestions`, suggestion);",
  "redisPubSub.publish('ai-suggestions-broadcast', suggestion);"
);

if (!appJsContent.includes("redisPubSub.subscribe('ai-suggestions-broadcast'")) {
  const subscribeCode = `
redisPubSub.subscribe('ai-suggestions-broadcast', (message) => {
  try {
    const suggestion = typeof message === 'string' ? JSON.parse(message) : message;
    io.to(suggestion.sessionId).emit('ai-suggestion', suggestion);
  } catch(e) {
    logger.error('Error parsing broadcast suggestion', e);
  }
});
`;
  const serverListenPos = appJsContent.indexOf('server.listen(env.port');
  appJsContent = appJsContent.slice(0, serverListenPos) + subscribeCode + appJsContent.slice(serverListenPos);
  
  fs.writeFileSync(appJsPath, appJsContent);
}

// 2. Add AI panel to Session.jsx
const sessionPath = path.join(__dirname, 'frontend/src/pages/Session.jsx');
let sessionContent = fs.readFileSync(sessionPath, 'utf8');

if (!sessionContent.includes('aiSuggestions')) {
  sessionContent = `import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import sessionService from '../services/session.service';
import { useWebSocket } from '../hooks/useWebSocket';
import CollaborativeEditor from '../components/Editor/CollaborativeEditor';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

const Session = () => {
  const { id } = useParams();
  const [session, setSession] = useState(null);
  const { socket, isConnected } = useWebSocket(id);
  const { user } = useAuth();
  
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [isAskingAi, setIsAskingAi] = useState(false);
  const editorRef = useRef(null);

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

  useEffect(() => {
    if (!socket) return;
    
    const onAiSuggestion = (suggestion) => {
      setAiSuggestions(prev => [suggestion, ...prev]);
      setIsAskingAi(false);
    };

    socket.on('ai-suggestion', onAiSuggestion);
    return () => socket.off('ai-suggestion', onAiSuggestion);
  }, [socket]);

  const handleAskAI = async () => {
    if (!editorRef.current) return;
    setIsAskingAi(true);
    
    // Get full code from Monaco
    const code = editorRef.current.getValue();
    
    try {
      // Direct call to ms-editor sync endpoint.
      await fetch(\`http://localhost:3003/api/editor/\${id}/sync\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language: 'javascript', userId: user?.sub || user?.id || 'unknown' })
      });
    } catch (err) {
      console.error('Failed to request AI sync', err);
      setIsAskingAi(false);
    }
  };

  if (!session) return <div className="loader">Loading Session...</div>;

  const myRole = session.SessionUsers?.find(su => su.userId === user?.sub || su.userId === user?.id)?.role || 'navigator';

  return (
    <div className="session-workspace fade-in">
      <div className="workspace-header glass-panel">
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <h2>Pair Programming Session</h2>
          <span className={\`badge \${isConnected ? 'active' : 'waiting'}\`}>
            WS: {isConnected ? 'Connected' : 'Connecting...'}
          </span>
          <span className={\`badge \${session.status}\`}>{session.status}</span>
        </div>
        
        <div className="header-actions">
          <button 
            className="btn-primary" 
            onClick={handleAskAI} 
            disabled={isAskingAi || !isConnected}
            style={{ background: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            {isAskingAi ? '🤖 Analyzing...' : '✨ Ask AI'}
          </button>
        </div>
      </div>
      
      <div className="workspace-main">
        <div className="editor-container glass-panel" style={{ flex: 3, overflow: 'hidden' }}>
          <CollaborativeEditor sessionId={session.id} role={myRole} onEditorMount={(editor) => editorRef.current = editor} />
        </div>
        
        <div className="sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
          <div className="glass-panel" style={{ padding: '1rem' }}>
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
          
          <div className="glass-panel ai-panel" style={{ padding: '1rem', flex: 1, overflowY: 'auto' }}>
            <h3>AI Suggestions</h3>
            {aiSuggestions.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '1rem' }}>
                No suggestions yet. Click "Ask AI" to analyze your code.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                {aiSuggestions.map((s, idx) => (
                  <div key={idx} className="suggestion-card" style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid var(--primary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.8rem' }}>
                      <span className="badge active">{s.type}</span>
                      <span style={{ color: 'var(--text-muted)' }}>Confidence: {(s.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <p style={{ fontSize: '0.9rem' }}>{s.suggestion}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Session;`;

  fs.writeFileSync(sessionPath, sessionContent);
}

// 3. Update CollaborativeEditor to expose the instance
const colabEditorPath = path.join(__dirname, 'frontend/src/components/Editor/CollaborativeEditor.jsx');
let colabEditorContent = fs.readFileSync(colabEditorPath, 'utf8');
if (!colabEditorContent.includes('onEditorMount')) {
  colabEditorContent = colabEditorContent.replace(
    'const CollaborativeEditor = ({ sessionId, role }) => {',
    'const CollaborativeEditor = ({ sessionId, role, onEditorMount }) => {'
  );
  colabEditorContent = colabEditorContent.replace(
    'const handleEditorDidMount = (editor, monaco) => {\\n    editorRef.current = editor;\\n  };',
    'const handleEditorDidMount = (editor, monaco) => {\\n    editorRef.current = editor;\\n    if (onEditorMount) onEditorMount(editor);\\n  };'
  );
  fs.writeFileSync(colabEditorPath, colabEditorContent);
}

console.log('Phase 12 Frontend AI Integration complete');
