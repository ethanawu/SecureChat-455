

# 455-SecureChat

The WebSocket Chat Application allows users to communicate in real-time through a secure and simple messaging interface. This application supports:

User Authentication: Users can sign in using a username and password.

Real-Time Chat: Users can send and receive messages instantaneously.

Join/Leave Notifications: Users will be notified when others join or leave the chat.

Rate Limiting: Measures are in place to prevent spamming of the server with excessive messages.

Connection Handling: Users will be notified if their connection is lost, and automatic reconnection will occur.

-------
Installation

clone into repo
cd 455-SecureChat



Install the necessary packages by running:

npm install

npm i ws

Run the Server:

node server.js
The server should now be running on ws://localhost:3000.
------
