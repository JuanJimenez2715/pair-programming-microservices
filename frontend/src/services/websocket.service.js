import { io } from 'socket.io-client';

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

export default new WebSocketService();