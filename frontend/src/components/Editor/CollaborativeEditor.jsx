import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';
import { useAuth } from '../../hooks/useAuth';

const CollaborativeEditor = ({ sessionId, role, onEditorMount, language = 'javascript', setLanguage }) => {
  const [editorInstance, setEditorInstance] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!editorInstance) return;

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
      editorInstance.getModel(), 
      new Set([editorInstance]), 
      provider.awareness
    );

    // Set Awareness (Cursor color and name)
    provider.awareness.setLocalStateField('user', {
      name: user.firstName || user.email?.split('@')[0] || 'User',
      color: role === 'driver' ? '#3b82f6' : role === 'observer' ? '#f59e0b' : '#8b5cf6'
    });

    return () => {
      binding.destroy();
      provider.disconnect();
      ydoc.destroy();
    };
  }, [sessionId, user, role, editorInstance]);

  const handleEditorDidMount = (editor, monaco) => {
    setEditorInstance(editor);
    if (onEditorMount) onEditorMount(editor);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '0.5rem', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--panel-border)' }}>
        <select 
          value={language} 
          onChange={(e) => setLanguage && setLanguage(e.target.value)}
          style={{ padding: '0.3rem 0.6rem', borderRadius: '4px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
          disabled={role !== 'driver'}
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
            readOnly: role !== 'driver',
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