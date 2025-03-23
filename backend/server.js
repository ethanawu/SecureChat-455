// backend/server.js
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');

dotenv.config();
const app = express();
const server = http.createServer(app);

// Socket.IO Server
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Error:', err));

console.log('Loaded MONGO_URI:', process.env.MONGO_URI);

// Rate Limiting Middleware
const apiLimiter = rateLimit({
  windowMs: 10 * 1000, // 10 seconds
  max: 10, // max 10 requests per window per IP
  message: { message: 'Too many requests, slow down!' }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/api/', apiLimiter); // Apply to all API routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

// WebSocket Events with Connection Handling
const activeUsers = new Set();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  activeUsers.add(socket.id);
  io.emit('user-joined', { socketId: socket.id, activeUsers: Array.from(activeUsers) });

  socket.on('message', (msg) => {
    console.log(`[Message from ${msg.sender}]: ${msg.content}`);
    io.emit('message', msg);
  });

  socket.on('heartbeat', () => {
    console.log(`Heartbeat received from ${socket.id}`);
  });

  socket.on('disconnect', (reason) => {
    console.log(`User disconnected: ${socket.id} (${reason})`);
    activeUsers.delete(socket.id);
    io.emit('user-left', { socketId: socket.id, activeUsers: Array.from(activeUsers) });
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));