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
2. Install dependencies:
   ```bash
   npm install
