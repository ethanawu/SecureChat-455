const express = require('express');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs'); // ← keep this for logs
const { RateLimiterMemory } = require('rate-limiter-flexible');
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');

dotenv.config();
const app = express();

// 🔌 MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Error:', err));

console.log('Loaded MONGO_URI:', process.env.MONGO_URI);

// 🔐 Express Rate Limiter (for REST APIs)
const apiLimiter = rateLimit({
  windowMs: 10 * 1000,
  max: 10,
  message: { message: 'Too many requests, slow down!' }
});

// 📦 Middleware
app.use(cors());
app.use(express.json());
app.use('/api/', apiLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

// 📝 Chat Logging Setup
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const logFilePath = path.join(logDir, `chatlog-${timestamp}.txt`);
const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });

function logMessage(text) {
  const time = new Date().toLocaleTimeString();
  logStream.write(`[${time}] ${text}\n`);
}

// 👥 Active Users Tracking
const activeUsers = new Set();
const userMap = new Map();

// ⚡ Rate limiter for WebSocket messages
const chatRateLimiter = new RateLimiterMemory({
  points: 5,
  duration: 10
});

// 🔐 Start Express Server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);

// Attach socket.io to the server
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// 📡 Socket.io Events
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  activeUsers.add(socket.id);

  socket.on('user-logged-in', (data) => {
    const { username } = data;
    userMap.set(socket.id, username);
    io.emit('user-joined', { username, activeUsers: Array.from(userMap.values()) });
    logMessage(`>> ${username} joined the chat.`);
  });

  socket.on('message', async (msg) => {
    try {
      await chatRateLimiter.consume(socket.id);
      io.emit('message', msg);
      logMessage(`[${msg.sender}] ${msg.content}`);
    } catch (rateErr) {
      socket.emit('message', {
        sender: 'System',
        content: '⚠️ You are sending messages too quickly. Please wait a few seconds.'
      });
    }
  });

  socket.on('heartbeat', () => {
    console.log(`Heartbeat received from ${socket.id}`);
  });

  socket.on('disconnect', () => {
    const username = userMap.get(socket.id);
    userMap.delete(socket.id);
    activeUsers.delete(socket.id);
    if (username) {
      io.emit('user-left', { username, activeUsers: Array.from(userMap.values()) });
      logMessage(`<< ${username} left the chat.`);
    }
    console.log(`User disconnected: ${socket.id}`);
  });
});
