import fs from "fs";
import https from "https";
import WebSocket, { WebSocketServer } from "ws";
import express from "express";
import path from "path";
import url from "url";
import bcrypt from "bcrypt";

const app = express();
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
app.use(express.json());

const users = [];
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// register route
app.post("/users/register", async (req, res) => {
  const { name, password } = req.body;
  if (!name || !password) return res.status(400).json({ error: "Missing credentials" });

  const existingUser = users.find(user => user.name === name);
  if (existingUser) return res.status(400).json({ error: "User already exists" });

  const hashedPassword = await bcrypt.hash(password, 10);
  users.push({ name, password: hashedPassword });

  res.status(201).json({ message: "User registered successfully" });
});

// login route
app.post("/users/login", async (req, res) => {
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
    const data = JSON.parse(message);

    if (!ws.isAuthenticated) {
      if (data.type === "auth") {
        const user = users.find(user => user.name === data.username);
        if (user && await bcrypt.compare(data.password, user.password)) {
          ws.isAuthenticated = true;
          ws.username = data.username;
          clients.set(ws.username, ws);

          ws.send(JSON.stringify({ type: "auth", success: true }));

          // notify all clients of new connection
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
  });

  ws.on("close", () => {
    if (ws.isAuthenticated) {
      clients.delete(ws.username);
      
      // notify all clients of disconnection
      broadcast({ type: "system", message: `${ws.username} left the chat` }, ws);
    }
  });
});

// Broadcast to all connected clients except sender
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
