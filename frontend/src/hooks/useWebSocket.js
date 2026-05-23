import { useEffect, useState } from 'react';
import wsService from '../services/websocket.service';

export const useWebSocket = (sessionId) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const s = wsService.connect();
    setSocket(s);
    setIsConnected(s.connected);

    const onConnect = () => {
      setIsConnected(true);
      if (sessionId) {
        s.emit('join-session', { sessionId });
      }
    };

    const onDisconnect = () => setIsConnected(false);

    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);

    // If already connected, join right away
    if (s.connected && sessionId) {
      s.emit('join-session', { sessionId });
    }

    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
      // We don't disconnect the socket completely here as other components might use it, 
      // but in a strict session view, we could.
    };
  }, [sessionId]);

  return { socket, isConnected };
};