# Secure WebSocket Chat Application

## Overview

This is a WebSocket-based chat application that allows users to securely connect, authenticate, and communicate in real-time. It features secure WebSocket connections (`wss://`), user authentication with usernames and passwords, message rate limiting, and automatic reconnection in case of dropped connections.

## Features
- Real-time messaging using WebSocket
- Secure WebSocket connection (`wss://`)
- User authentication (username and password)
- Rate limiting (1 message per second per user)
- Automatic reconnection on connection loss
- Join/Disconnect notifications to all connected clients

## Installation

### Prerequisites:
- Node.js (version 14 or higher)
- SSL certificates (`cert.pem` and `key.pem`)

### Steps:
1. Clone or download the repository.
   ```bash
   git clone https://github.com/ethanawu/SecureChat-455.git
3. Install dependencies:
   ```bash
   
   npm install
4. Place your SSL certificates (cert.pem and key.pem) in the certs/ directory.
Run the server:
   ```bash
   node server.js

## How to Use

### Step 1: Login
1. Open the application in your browser.
2. In the **Login** section, enter **user1** and **password123**. (username and password are hardcoded and can be changed in server.js)
3. Click the **Login** button.

   - If the credentials are correct, you will be authenticated and granted access to the chat.
   - If the credentials are incorrect, you will receive an error message, and the WebSocket connection will be closed.

### Step 2: Start Chatting
1. Once authenticated, the **Chat** interface will appear.
2. In the **Chat** section, you can see all messages sent by other users.
3. To send a message, type it into the input field under **Type a message**.
4. Click the **Send** button, or press Enter, to send your message.

   - **Note**: You can only send one message per second. If you try to send a message too quickly, you will receive an error message.

### Step 3: System Notifications
- When a user connects or disconnects, a system message will appear in the chat window, notifying you of the event. 
- The message will look like: 
  - `[SYSTEM]: username connected`
  - `[SYSTEM]: username disconnected`

### Step 4: Logout/Disconnect
- To disconnect from the chat, simply close the browser tab or refresh the page. The WebSocket connection will be closed, and you will be logged out.

