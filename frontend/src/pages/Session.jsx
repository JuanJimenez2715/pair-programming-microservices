import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import sessionService from '../services/session.service';
import exerciseService from '../services/exercise.service';
import { useWebSocket } from '../hooks/useWebSocket';
import CollaborativeEditor from '../components/Editor/CollaborativeEditor';
import { useAuth } from '../hooks/useAuth';
import { Play, Terminal as TerminalIcon, BookOpen } from 'lucide-react';

const Session = () => {
  const { id } = useParams();
  const [session, setSession] = useState(null);
  const [exercise, setExercise] = useState(null);
  const { socket, isConnected } = useWebSocket(id);
  const { user } = useAuth();
  
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [isAskingAi, setIsAskingAi] = useState(false);
  const editorRef = useRef(null);
  
  const [language, setLanguage] = useState('javascript');
  const [terminalOutput, setTerminalOutput] = useState('Terminal lista...\n');
  const [isExecuting, setIsExecuting] = useState(false);

  useEffect(() => {
    const fetchSessionAndExercise = async () => {
      try {
        const data = await sessionService.getSessionById(id);
        setSession(data);
        if (data.exerciseId) {
          const exData = await exerciseService.getExerciseById(data.exerciseId);
          setExercise(exData);
          if (exData.language) {
            setLanguage(exData.language);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchSessionAndExercise();
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
      await fetch(`http://localhost:3003/api/editor/${id}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language, userId: user?.sub || user?.id || 'unknown' })
      });
    } catch (err) {
      console.error('Failed to request AI sync', err);
      setIsAskingAi(false);
    }
  };

  const handleExecuteCode = async () => {
    if (!editorRef.current) return;
    setIsExecuting(true);
    setTerminalOutput('Ejecutando código...\n');
    
    const code = editorRef.current.getValue();

    setTimeout(() => {
      try {
        if (language === 'javascript') {
          let logs = [];
          
          const customConsole = {
            log: (...args) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ')),
            error: (...args) => logs.push('[Error]: ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ')),
            warn: (...args) => logs.push('[Warn]: ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ')),
            info: (...args) => logs.push('[Info]: ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ')),
          };
          
          const customAlert = (msg) => {
            logs.push(`[Alert pop-up]: ${msg}`);
            window.alert(msg);
          };
          
          const customPrompt = (msg, def) => {
            logs.push(`[Prompt pop-up]: ${msg}`);
            const res = window.prompt(msg, def);
            logs.push(`> Usuario respondió: ${res}`);
            return res;
          };
          
          try {
            // Usamos new Function para inyectar nuestras variables de entorno de forma segura
            // Evitamos modificar los objetos globales originales.
            // Envolvemos en un return para poder obtener resultados directos si los hay (opcional).
            const runner = new Function('console', 'alert', 'prompt', 'window', `
              ${code}
            `);
            
            // Pasamos 'window' mockeado con nuestras funciones por si hacen window.alert
            const mockWindow = { alert: customAlert, prompt: customPrompt, console: customConsole };
            
            const result = runner(customConsole, customAlert, customPrompt, mockWindow);
            
            if (result !== undefined && typeof result !== 'function') {
              logs.push(`\n[Retorno]: ${typeof result === 'object' ? JSON.stringify(result) : result}`);
            }
            setTerminalOutput(`> Output:\n${logs.join('\n') || '(Sin salida)'}\n\n> Proceso finalizó con código: 0`);
          } catch (err) {
            setTerminalOutput(`> Error de ejecución:\n${err.toString()}`);
          }
        } 
        else if (language === 'python') {
          // Un mock muy básico para Python
          if (code.includes('print')) {
            // Intentar extraer cualquier cosa dentro de print(...) de forma muy cruda
            const matches = code.match(/print\((.*)\)/g);
            const outputs = matches ? matches.map(m => m.replace(/print\((.*)\)/, '$1').replace(/['"]/g, '')).join('\n') : 'Simulated Python Output...';
            setTerminalOutput(`> Output (Python Mock):\n${outputs}\n\n> Proceso finalizó con código: 0`);
          } else {
            setTerminalOutput(`> Output (Python Mock):\n(Código ejecutado sin errores, pero no hay outputs impresos)\n\n> Proceso finalizó con código: 0`);
          }
        }
        else {
          setTerminalOutput(`> Output (${language} Mock):\nEjecución simulada finalizada correctamente para ${language}.\n\n> Proceso finalizó con código: 0`);
        }
      } catch (error) {
        setTerminalOutput(`> Error inesperado:\n${error.message}`);
      } finally {
        setIsExecuting(false);
      }
    }, 800); // Simulamos retraso de red/ejecución
  };

  if (!session) return <div className="loader">Loading Session...</div>;

  // Si es profesor, forzamos el rol 'observer' para que vea todo en vivo sin modificar.
  const myRole = user?.role === 'teacher' 
    ? 'observer' 
    : (session.SessionUsers?.find(su => su.userId === user?.sub || su.userId === user?.id)?.role || 'navigator');

  // Diverse fallback title
  const fallbackTitles = ["Práctica de Algoritmos", "Desafío de Lógica", "Estructuras de Datos", "Optimización de Código", "Pair Programming Libre"];
  const randomFallback = session ? fallbackTitles[session.id.charCodeAt(0) % fallbackTitles.length] : "Cargando...";
  const sessionTitle = session?.title || (session?.exerciseId ? 'Reto Asignado' : randomFallback);

  return (
    <div className="session-workspace fade-in" style={{ height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>
      <div className="workspace-header glass-panel" style={{ flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <h2>{sessionTitle}</h2>
          <span className={`badge ${isConnected ? 'active' : 'waiting'}`}>
            {isConnected ? '🟢 Conectado' : '🟠 Conectando...'}
          </span>
          <span className={`badge ${session.status}`}>{session.status}</span>
        </div>
        
        <div className="header-actions" style={{ display: 'flex', gap: '0.8rem' }}>
          <button 
            className="btn-secondary" 
            onClick={handleExecuteCode} 
            disabled={isExecuting}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid var(--success)', color: 'white' }}
          >
            <Play size={18} /> {isExecuting ? 'Ejecutando...' : 'Ejecutar'}
          </button>
          
          <button 
            className="btn-primary" 
            onClick={handleAskAI} 
            disabled={isAskingAi || !isConnected}
            style={{ background: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            {isAskingAi ? '🤖 Analizando...' : '✨ Preguntar IA'}
          </button>
        </div>
      </div>
      
      <div className="workspace-main" style={{ display: 'flex', flex: 1, gap: '1rem', overflow: 'hidden' }}>
        <div style={{ flex: 3, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="editor-container glass-panel" style={{ flex: 2, overflow: 'hidden' }}>
            <CollaborativeEditor 
              sessionId={session.id} 
              role={myRole} 
              onEditorMount={(editor) => {
                editorRef.current = editor;
                if (exercise && exercise.initialCode) {
                  window.initialCodeForEditor = exercise.initialCode;
                }
              }}
              language={language}
              setLanguage={setLanguage}
            />
          </div>
          
          {/* FAKE TERMINAL PANEL */}
          <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '200px' }}>
            <div style={{ padding: '0.5rem 1rem', background: 'rgba(0,0,0,0.5)', borderBottom: '1px solid var(--panel-border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TerminalIcon size={16} /> <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Terminal de Ejecución</span>
            </div>
            <div style={{ 
              flex: 1, padding: '1rem', background: '#0d1117', color: '#e5e5e5', 
              fontFamily: 'var(--font-mono)', fontSize: '0.9rem', overflowY: 'auto',
              whiteSpace: 'pre-wrap'
            }}>
              {terminalOutput}
            </div>
          </div>
        </div>
        
        <div className="sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
          {exercise && (
            <div className="glass-panel" style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.1)' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
                <BookOpen size={18} /> {exercise.title}
              </h3>
              <p style={{ fontSize: '0.9rem', marginTop: '0.5rem', whiteSpace: 'pre-wrap' }}>
                {exercise.description}
              </p>
              <div style={{ marginTop: '0.8rem', display: 'flex', gap: '0.5rem' }}>
                <span className={`badge-difficulty ${exercise.difficulty.toLowerCase()}`}>{exercise.difficulty}</span>
                <span className="badge-lang">{exercise.language}</span>
              </div>
            </div>
          )}

          <div className="glass-panel" style={{ padding: '1rem' }}>
            <h3>Participantes</h3>
            <ul className="participant-list" style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {session.SessionUsers?.map((su, index) => {
                const isMe = su.userId === (user?.sub || user?.id);
                let displayName = '';
                if (isMe) {
                  displayName = user?.firstName ? `Tú (${user.firstName})` : 'Tú';
                } else {
                  displayName = user?.role === 'teacher' ? `Estudiante ${index + 1}` : 'Tu Compañero';
                }
                
                return (
                  <li key={su.userId} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <span className={`role-badge ${su.role}`}>{su.role}</span>
                    <span>{displayName}</span>
                  </li>
                );
              })}
              {myRole === 'observer' && (
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'var(--secondary)' }}>
                  <span className="role-badge observer">observer</span>
                  <span>{user?.firstName} (Tú - Profesor)</span>
                </li>
              )}
            </ul>
          </div>
          
          <div className="glass-panel ai-panel" style={{ padding: '1rem', flex: 1, overflowY: 'auto' }}>
            <h3>Sugerencias IA</h3>
            {aiSuggestions.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '1rem' }}>
                No hay sugerencias aún. Clic en "Preguntar IA" para analizar el código actual.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                {aiSuggestions.map((s, idx) => (
                  <div key={idx} className="suggestion-card" style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid var(--primary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.8rem' }}>
                      <span className="badge active">{s.type}</span>
                      <span style={{ color: 'var(--text-muted)' }}>Confianza: {(s.confidence * 100).toFixed(0)}%</span>
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

export default Session;