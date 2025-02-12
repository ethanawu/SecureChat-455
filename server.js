import fs from "fs";
import https from "https";
import WebSocket, { WebSocketServer } from "ws";
import express from "express";
import path from "path"; // Required for working with file paths
import url from "url"; // For working with URLs

const app = express();

// Get the current directory path
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

// Serve static files (like index.html) from the "public" folder
app.use(express.static(path.join(__dirname, "public")));

// Serve index.html when visiting the root URL
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

wss.on("connection", (ws) => {
  ws.isAuthenticated = false;

  ws.on("message", (message) => {
    const data = JSON.parse(message);

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

    if (data.type === "message") {
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
