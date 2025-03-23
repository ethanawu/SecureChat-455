import fs from "fs";
import https from "https";
import WebSocket, { WebSocketServer } from "ws";
import express from "express";
import path from "path";
import url from "url";
import bcrypt from "bcrypt";
import rateLimit from "express-rate-limit";

const app = express();
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
app.use(express.json());

// Rate limiter for login & register endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: { error: "Too many attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// In-memory user storage (should be replaced with a database)
const users = [];
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Apply rate limiting to register & login endpoints
app.post("/users/register", authLimiter, async (req, res) => {
  const { name, password } = req.body;
  if (!name || !password) return res.status(400).json({ error: "Missing credentials" });

  const existingUser = users.find(user => user.name === name);
  if (existingUser) return res.status(400).json({ error: "User already exists" });

  const hashedPassword = await bcrypt.hash(password, 10);
  users.push({ name, password: hashedPassword });

  res.status(201).json({ message: "User registered successfully" });
});

app.post("/users/login", authLimiter, async (req, res) => {
  const { name, password } = req.body;
  const user = users.find(user => user.name === name);
  
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(400).json({ error: "Invalid credentials" });
  }

  res.json({ message: "Login successful" });
});

const server = https.createServer({
  cert: fs.readFileSync("certs/cert.pem"),
  key: fs.readFileSync("certs/key.pem"),
}, app);

const wss = new WebSocketServer({ server });
const clients = new Map();
const messageTimestamps = new Map();

wss.on("connection", (ws) => {
  ws.isAuthenticated = false;

  ws.on("message", async (message) => {
    try {
      const data = JSON.parse(message);
  
      if (!ws.isAuthenticated) {
        if (data.type === "auth") {
          const user = users.find(user => user.name === data.username);
          if (user && await bcrypt.compare(data.password, user.password)) {
            ws.isAuthenticated = true;
            ws.username = data.username;
            clients.set(ws.username, ws);
  
            ws.send(JSON.stringify({ type: "auth", success: true }));
            broadcast({ type: "system", message: `${ws.username} joined the chat` }, ws);
          } else {
            ws.send(JSON.stringify({ type: "auth", success: false }));
            ws.close();
          }
        }
        return;
      }
  
      if (data.type === "message") {
        const now = Date.now();
        const lastMessageTime = messageTimestamps.get(ws.username) || 0;
  
        if (now - lastMessageTime < 1000) {
          ws.send(JSON.stringify({ type: "error", message: "Too many messages! Wait a second." }));
          return;
        }
  
        messageTimestamps.set(ws.username, now);
        broadcast({ type: "message", username: ws.username, data: data.data }, ws);
      }
    } catch (error) {
      console.error("Error processing message:", error);
      ws.send(JSON.stringify({ type: "error", message: "Invalid request format." }));
    }
  });

  ws.on("close", () => {
    if (ws.isAuthenticated) {
      clients.delete(ws.username);
      broadcast({ type: "system", message: `${ws.username} left the chat` }, ws);
    }
  });
});

// Broadcast function
function broadcast(data, sender) {
  wss.clients.forEach(client => {
    if (client !== sender && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

// Start server
server.listen(3000, () => {
  console.log("Secure WebSocket server running on https://localhost:3000");
});