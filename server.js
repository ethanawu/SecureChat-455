import WebSocket, { WebSocketServer } from "ws";

// hardcoded user credentials 
const users = {
  user1: "password123",
  user2: "securepass",
};

const wss = new WebSocketServer({ port: 3000 });

wss.on("connection", function connection(ws) {
  ws.isAuthenticated = false; // track authentication status

  ws.on("message", function message(message) {
    const data = JSON.parse(message);

    if (!ws.isAuthenticated) {
      if (data.type === "auth") {
        const { username, password } = data;
        if (users[username] && users[username] === password) {
          ws.isAuthenticated = true;
          ws.send(JSON.stringify({ type: "auth", success: true, message: "Authenticated" }));
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

    // only logged users can send messages
    if (data.type === "message") {
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: "message", data: data.data }));
        }
      });
    }
  });
});

console.log("WebSocket server running on ws://localhost:3000");
