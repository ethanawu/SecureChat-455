// backend/server.js
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');

const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');

dotenv.config();
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Error:', err));

console.log('Loaded MONGO_URI:', process.env.MONGO_URI);

const apiLimiter = rateLimit({
  windowMs: 10 * 1000,
  max: 10,
  message: { message: 'Too many requests, slow down!' }
});

app.use(cors());
app.use(express.json());
app.use('/api/', apiLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

// Chat Log Setup
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const logFilePath = path.join(logDir, `chatlog-${timestamp}.txt`);
const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });

const activeUsers = new Set();
const userMap = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  activeUsers.add(socket.id);

  socket.on('user-logged-in', (data) => {
    const { username } = data;
    userMap.set(socket.id, username);
    io.emit('user-joined', { username, activeUsers: Array.from(userMap.values()) });
    logMessage(`>> ${username} joined the chat.`);
  });

  socket.on('message', (msg) => {
    console.log(`[Message from ${msg.sender}]: ${msg.content}`);
    io.emit('message', msg);
    logMessage(`[${msg.sender}] ${msg.content}`);
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

function logMessage(text) {
  const time = new Date().toLocaleTimeString();
  logStream.write(`[${time}] ${text}\n`);
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));