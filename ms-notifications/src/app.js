const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(cors());
app.use(express.json());

// Track connected teachers
const connectedTeachers = new Map();

app.get('/health', (req, res) =>
  res.json({ status: 'ok', service: 'ms-notifications', connectedClients: io.engine.clientsCount })
);

// Endpoint for other services to send a notification
app.post('/api/notifications/send', (req, res) => {
  const { type, message, sessionId, targetRole } = req.body;

  const notification = {
    type: type || 'info',
    message,
    sessionId,
    timestamp: new Date().toISOString()
  };

  if (targetRole === 'teacher') {
    io.to('teachers').emit('notification', notification);
  } else {
    io.emit('notification', notification);
  }

  res.json({ sent: true, notification });
});

// WebSocket connection
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Client tells us their role on connect
  socket.on('register', ({ role, userId }) => {
    if (role === 'teacher') {
      socket.join('teachers');
      connectedTeachers.set(userId, socket.id);
      console.log(`Teacher registered: ${userId}`);
    }
    socket.emit('registered', { success: true, role });
  });

  // Student requests help from AI — notify teachers
  socket.on('ai-help-requested', ({ sessionId, studentName }) => {
    io.to('teachers').emit('notification', {
      type: 'ai-help',
      message: `${studentName || 'A student'} requested AI help in session ${sessionId}`,
      sessionId,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`ms-notifications running on port ${PORT}`));
