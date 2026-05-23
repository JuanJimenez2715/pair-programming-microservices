const kafkaProducer = require('./services/kafkaProducer.service');
const kafkaConsumer = require('./services/kafkaConsumer.service');
const redisPubSub = require('./services/redis.service');
const sessionCache = require('./services/sessionCache.service');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { WebSocketServer } = require('ws');
let setupWSConnection;
try {
  setupWSConnection = require('./y-websocket-utils.js').setupWSConnection;
} catch (e) {
  console.log('Could not load y-websocket utils', e);
}
const cors = require('cors');
const env = require('./config/env');
const logger = require('./utils/logger');
const wsAuthMiddleware = require('./middlewares/wsAuth.middleware');
const socketHandler = require('./websocket/socketHandler');

const app = express();
app.use(cors());
app.use(express.json());


app.post('/api/editor/:sessionId/sync', async (req, res) => {
  const { sessionId } = req.params;
  const { code, language, userId } = req.body;
  
  // Publish to Kafka
  await kafkaProducer.sendCodeEvent(sessionId, { fullCode: code }, language || 'javascript', userId || 'unknown');
  res.send({ status: 'sync_requested' });
});

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

const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  if (request.url.startsWith('/socket.io/')) {
    // Let socket.io handle this, do nothing here
    return;
  }
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

wss.on('connection', (ws, req) => {
  ws.on('error', (err) => logger.error('WebSocket Error', err));
  if (setupWSConnection) {
    setupWSConnection(ws, req);
  }
});

// Initialize Kafka
kafkaProducer.connect();
kafkaConsumer.connect((suggestion) => {
  // Broadcast AI suggestion via Redis so all instances can push it to their WebSockets
  redisPubSub.publish('ai-suggestions-broadcast', suggestion);
});


redisPubSub.subscribe('ai-suggestions-broadcast', (message) => {
  try {
    const suggestion = typeof message === 'string' ? JSON.parse(message) : message;
    io.to(suggestion.sessionId).emit('ai-suggestion', suggestion);
  } catch(e) {
    logger.error('Error parsing broadcast suggestion', e);
  }
});
server.listen(env.port, () => {
  logger.info(`ms-editor WebSocket server running on port ${env.port}`);
});