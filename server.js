import fs from "fs";
import https from "https";
import WebSocket, { WebSocketServer } from "ws";
import express from "express";
import path from "path";
import url from "url"; 

const app = express();

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Create an HTTPS server with SSL certificates
const server = https.createServer({
  cert: fs.readFileSync("certs/cert.pem"),
  key: fs.readFileSync("certs/key.pem"),
}, app);

// Create a WebSocket server
const wss = new WebSocketServer({ server });

const users = {
  user1: "password123",
  user2: "securepass",
};

const clients = new Map();
const messageTimestamps = new Map(); // Store the last message timestamp for each user

wss.on("connection", (ws) => {
  ws.isAuthenticated = false;

  ws.on("message", (message) => {
    const data = JSON.parse(message);

    // Handle authentication
    if (!ws.isAuthenticated) {
      if (data.type === "auth") {
        if (users[data.username] === data.password) {
          ws.isAuthenticated = true;
          ws.username = data.username;
          clients.set(data.username, ws);
          ws.send(JSON.stringify({ type: "auth", success: true }));

          // Notify all other clients that the user has connected
          wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: "system",
                message: `${ws.username} connected`,
              }));
            }
          });
        } else {
          ws.send(JSON.stringify({ type: "auth", success: false }));
          ws.close();
        }
      }
      return;
    }

    // Handle messages and apply rate limiting
    if (data.type === "message") {
      const now = Date.now();
      const lastMessageTime = messageTimestamps.get(ws.username) || 0;

      // Check rate limit (1 message per second)
      if (now - lastMessageTime < 1000) {
        // Reject the message if the user exceeds the rate limit
        ws.send(JSON.stringify({
          type: "error",
          message: "You are sending messages too quickly. Please wait a moment.",
        }));
        return;
      }

      // Update the last message timestamp for the user
      messageTimestamps.set(ws.username, now);

      // Broadcast the message to all other clients
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: "message",
            username: ws.username,
            data: data.data,
          }));
        }
      });
    }
  });

  ws.on("close", () => {
    if (ws.isAuthenticated) {
      clients.delete(ws.username);
      // Notify all other clients that the user has disconnected
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: "system",
            message: `${ws.username} disconnected`,
          }));
        }
      });
    }
  });
});

// Start HTTPS server
server.listen(3000, () => {
  console.log("Secure WebSocket server running on https://localhost:3000");
});
