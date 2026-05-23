const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Installing dependencies...');
execSync('npm install socket.io jsonwebtoken cors', { cwd: path.join(__dirname, 'ms-editor'), stdio: 'inherit' });
execSync('npm install socket.io-client', { cwd: path.join(__dirname, 'frontend'), stdio: 'inherit' });

const dirs = [
  'ms-editor/src/config',
  'ms-editor/src/websocket',
  'ms-editor/src/middlewares',
  'ms-editor/src/utils',
  'frontend/src/services',
  'frontend/src/hooks'
];

dirs.forEach(d => fs.mkdirSync(path.join(__dirname, d), { recursive: true }));

const files = {};

// ms-editor setup
files['ms-editor/src/config/env.js'] = `require('dotenv').config();
module.exports = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || 'supersecret'
};`;

files['ms-editor/src/utils/logger.js'] = `const winston = require('winston');
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});
module.exports = logger;`;

files['ms-editor/src/middlewares/wsAuth.middleware.js'] = `const jwt = require('jsonwebtoken');
const env = require('../config/env');

const wsAuthMiddleware = (socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Authentication error: No token provided'));
  
  try {
    const payload = jwt.verify(token, env.jwtSecret);
    socket.user = payload; // Attach user payload to socket
    next();
  } catch (err) {
    next(new Error('Authentication error: Invalid token'));
  }
};

module.exports = wsAuthMiddleware;`;

files['ms-editor/src/websocket/socketHandler.js'] = `const logger = require('../utils/logger');

const socketHandler = (io) => {
  io.on('connection', (socket) => {
    logger.info(\`User connected: \${socket.user.sub} (Socket ID: \${socket.id})\`);

    socket.on('join-session', ({ sessionId }) => {
      socket.join(sessionId);
      logger.info(\`User \${socket.user.sub} joined session room \${sessionId}\`);
      
      // Notify others in the room
      socket.to(sessionId).emit('user-joined', { userId: socket.user.sub, role: socket.user.role });
    });

    socket.on('code-change', ({ sessionId, delta, version }) => {
      // Broadcast code change to everyone else in the room
      socket.to(sessionId).emit('code-change', { delta, userId: socket.user.sub, version });
    });

    socket.on('cursor-move', ({ sessionId, position }) => {
      socket.to(sessionId).emit('cursor-move', { position, userId: socket.user.sub });
    });

    socket.on('disconnect', () => {
      logger.info(\`User disconnected: \${socket.user.sub} (Socket ID: \${socket.id})\`);
      // Could broadcast user-left to rooms they were in, but socket.io handles room leaving on disconnect
    });
  });
};

module.exports = socketHandler;`;

files['ms-editor/src/app.js'] = `const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const env = require('./config/env');
const logger = require('./utils/logger');
const wsAuthMiddleware = require('./middlewares/wsAuth.middleware');
const socketHandler = require('./websocket/socketHandler');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.send('OK'));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*', // For development. Should be restricted in production.
    methods: ['GET', 'POST']
  }
});

io.use(wsAuthMiddleware);
socketHandler(io);

server.listen(env.port, () => {
  logger.info(\`ms-editor WebSocket server running on port \${env.port}\`);
});`;

// frontend setup
files['frontend/src/services/websocket.service.js'] = `import { io } from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.socket = null;
  }

  connect() {
    if (this.socket) return this.socket;

    const token = localStorage.getItem('token');
    // Connecting directly to ms-editor for now, could go through gateway if configured for WS
    this.socket = io('http://localhost:3003', {
      auth: { token },
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => console.log('WebSocket Connected'));
    this.socket.on('connect_error', (err) => console.error('WebSocket Error:', err.message));

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket() {
    return this.socket;
  }
}

export default new WebSocketService();`;

files['frontend/src/hooks/useWebSocket.js'] = `import { useEffect, useState } from 'react';
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
};`;

// Let's update the docker-compose to map port 3003 for ms-editor so frontend can reach it directly, 
// or let it go through kong. For WebSockets it's often easier to expose it or route it.
// We'll expose port 3003 in docker-compose.yml for development.
let dockerCompose = fs.readFileSync(path.join(__dirname, 'docker-compose.yml'), 'utf8');
if (!dockerCompose.includes('ms-editor:')) {
  const msEditorService = '\\n  ms-editor:\\n    build: ./ms-editor\\n    container_name: pp_ms_editor\\n    ports:\\n      - "3003:3000"\\n    environment:\\n      - PORT=3000\\n    networks:\\n      - pp-network\\n';
  if (dockerCompose.includes('kong:')) {
    dockerCompose = dockerCompose.replace('kong:', msEditorService + '  kong:');
    fs.writeFileSync(path.join(__dirname, 'docker-compose.yml'), dockerCompose);
  }
}

Object.entries(files).forEach(([f, content]) => {
  fs.writeFileSync(path.join(__dirname, f), content);
});

// Update the Session.jsx to use the WebSocket hook to prove it works
const sessionPath = path.join(__dirname, 'frontend/src/pages/Session.jsx');
let sessionContent = fs.readFileSync(sessionPath, 'utf8');

console.log('Phase 6 setup complete');
