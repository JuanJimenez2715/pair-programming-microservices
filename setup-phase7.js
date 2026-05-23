const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Installing dependencies...');
execSync('npm install ws yjs y-websocket', { cwd: path.join(__dirname, 'ms-editor'), stdio: 'inherit' });
execSync('npm install @monaco-editor/react yjs y-websocket y-monaco', { cwd: path.join(__dirname, 'frontend'), stdio: 'inherit' });

// Setup Yjs server in ms-editor
const appJsPath = path.join(__dirname, 'ms-editor/src/app.js');
let appJsContent = fs.readFileSync(appJsPath, 'utf8');

if (!appJsContent.includes('WebSocketServer')) {
  appJsContent = appJsContent.replace("const { Server } = require('socket.io');", "const { Server } = require('socket.io');\nconst { WebSocketServer } = require('ws');\nconst setupWSConnection = require('y-websocket/bin/utils').setupWSConnection;");
  appJsContent = appJsContent.replace("server.listen(env.port", `const wss = new WebSocketServer({ server });
wss.on('connection', (ws, req) => {
  setupWSConnection(ws, req);
});

server.listen(env.port`);
  fs.writeFileSync(appJsPath, appJsContent);
}

const editorDir = path.join(__dirname, 'frontend/src/components/Editor');
if (!fs.existsSync(editorDir)) fs.mkdirSync(editorDir, { recursive: true });

const colabEditorCode = `import { useRef, useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';
import { useAuth } from '../../hooks/useAuth';

const CollaborativeEditor = ({ sessionId, role }) => {
  const editorRef = useRef(null);
  const { user } = useAuth();
  const [language, setLanguage] = useState('javascript');

  useEffect(() => {
    if (!editorRef.current) return;

    // Initialize Yjs Document
    const ydoc = new Y.Doc();
    
    // Connect to y-websocket server (ms-editor running on 3003)
    const provider = new WebsocketProvider(
      'ws://localhost:3003',
      sessionId,
      ydoc
    );

    const type = ydoc.getText('monaco');
    
    // Bind Yjs to Monaco
    const binding = new MonacoBinding(
      type, 
      editorRef.current.getModel(), 
      new Set([editorRef.current]), 
      provider.awareness
    );

    // Set Awareness (Cursor color and name)
    provider.awareness.setLocalStateField('user', {
      name: user.email?.split('@')[0] || 'User',
      color: role === 'driver' ? '#3b82f6' : '#8b5cf6'
    });

    return () => {
      binding.destroy();
      provider.disconnect();
      ydoc.destroy();
    };
  }, [sessionId, user, role]);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
        <select 
          value={language} 
          onChange={(e) => setLanguage(e.target.value)}
          style={{ padding: '0.5rem', borderRadius: '4px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
        </select>
        <span className={\`role-badge \${role}\`}>Mode: {role.toUpperCase()}</span>
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Editor
          height="100%"
          theme="vs-dark"
          language={language}
          onMount={handleEditorDidMount}
          options={{
            readOnly: role === 'navigator',
            minimap: { enabled: false },
            fontSize: 14,
            wordWrap: 'on'
          }}
        />
      </div>
    </div>
  );
};

export default CollaborativeEditor;`;

fs.writeFileSync(path.join(editorDir, 'CollaborativeEditor.jsx'), colabEditorCode);

// Update Session.jsx to include the CollaborativeEditor
const sessionPath = path.join(__dirname, 'frontend/src/pages/Session.jsx');
let sessionContent = fs.readFileSync(sessionPath, 'utf8');

if (!sessionContent.includes('CollaborativeEditor')) {
  sessionContent = sessionContent.replace(
    "import { useWebSocket } from '../hooks/useWebSocket';", 
    "import { useWebSocket } from '../hooks/useWebSocket';\nimport CollaborativeEditor from '../components/Editor/CollaborativeEditor';\nimport { useAuth } from '../hooks/useAuth';"
  );
  sessionContent = sessionContent.replace("const { isConnected } = useWebSocket(id);", "const { isConnected } = useWebSocket(id);\n  const { user } = useAuth();");
  sessionContent = sessionContent.replace(
    '<div className="editor-placeholder glass-panel">\n          <p>Editor Component (Monaco + Yjs) will be injected here in Phase 7</p>\n        </div>',
    `{session ? (() => {
          const myRole = session.SessionUsers?.find(su => su.userId === user?.sub || su.userId === user?.id)?.role || 'navigator';
          return (
            <div className="editor-container glass-panel" style={{ flex: 3, overflow: 'hidden' }}>
              <CollaborativeEditor sessionId={session.id} role={myRole} />
            </div>
          );
        })() : null}`
  );
  fs.writeFileSync(sessionPath, sessionContent);
}

// Ensure .gitignore ignores yjs related local builds just in case
const gitignorePath = path.join(__dirname, '.gitignore');
let gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
if (!gitignoreContent.includes('.yjs')) {
  fs.writeFileSync(gitignorePath, gitignoreContent + '\n.yjs\n');
}

console.log('Phase 7 ms-editor setup complete');
