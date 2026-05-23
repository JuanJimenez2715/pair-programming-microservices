const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { WebSocketServer } = require('ws');
const setupWSConnection = require('y-websocket/bin/utils').setupWSConnection;
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

const wss = new WebSocketServer({ server });
wss.on('connection', (ws, req) => {
  setupWSConnection(ws, req);
});

server.listen(env.port, () => {
  logger.info(`ms-editor WebSocket server running on port ${env.port}`);
});