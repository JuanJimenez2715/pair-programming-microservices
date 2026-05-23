import { useRef, useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';
import { useAuth } from '../../hooks/useAuth';

const CollaborativeEditor = ({ sessionId, role, onEditorMount }) => {
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
        <span className={`role-badge ${role}`}>Mode: {role.toUpperCase()}</span>
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

export default CollaborativeEditor;