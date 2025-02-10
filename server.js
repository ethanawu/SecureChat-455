import WebSocket, { WebSocketServer } from "ws";

// hardcoded user credentials
const users = {
  user1: "password123",
  user2: "securepass",
};

// rate limiting settings
const MESSAGE_LIMIT = 5; // max messages
const TIME_FRAME = 10000; // 10 seconds

const wss = new WebSocketServer({ port: 3000 });
const clients = new Map(); // store user sessions

wss.on("connection", function connection(ws) {
  ws.isAuthenticated = false;
  ws.username = null;
  ws.messageCount = 0;
  ws.lastMessageTime = Date.now();

  ws.on("message", function message(message) {
    const data = JSON.parse(message);

    // authentication
    if (!ws.isAuthenticated) {
      if (data.type === "auth") {
        const { username, password } = data;
        if (users[username] && users[username] === password) {
          ws.isAuthenticated = true;
          ws.username = username;
          clients.set(username, ws); // track connected users
          ws.send(JSON.stringify({ type: "auth", success: true, message: "Authenticated" }));

          // notify others that user joined
          broadcast({ type: "system", message: `${username} joined the chat.` }, ws);
        } else {
          ws.send(JSON.stringify({ type: "auth", success: false, message: "Invalid credentials" }));
          ws.close();
        }
      } else {
        ws.send(JSON.stringify({ type: "error", message: "Authentication required" }));
        ws.close();
      }
      return;
    }

    // rate limiting
    const currentTime = Date.now();
    if (currentTime - ws.lastMessageTime > TIME_FRAME) {
      ws.messageCount = 0;
    }
    ws.lastMessageTime = currentTime;
    ws.messageCount++;

    if (ws.messageCount > MESSAGE_LIMIT) {
      ws.send(JSON.stringify({ type: "error", message: "Rate limit exceeded. Please wait." }));
      return;
    }

    // chat messages
    if (data.type === "message") {
      broadcast({ type: "message", username: ws.username, data: data.data }, ws);
    }
  });

  // handle disconnection
  ws.on("close", () => {
    if (ws.isAuthenticated) {
      clients.delete(ws.username);
      broadcast({ type: "system", message: `${ws.username} left the chat.` });
    }
  });

  // keep connection alive
  ws.isAlive = true;
  ws.on("pong", () => {
    ws.isAlive = true;
  });
});

// Broadcast message to all clients except sender
function broadcast(message, sender = null) {
  wss.clients.forEach((client) => {
    if (client !== sender && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

// Heartbeat interval (Detect disconnected clients)
setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) {
      ws.terminate(); // Force disconnect
    } else {
      ws.isAlive = false;
      ws.ping(); // Send heartbeat ping
    }
  });
}, 10000); // Every 10 seconds

console.log("WebSocket server running on ws://localhost:3000");
