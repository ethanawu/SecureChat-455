# SecureChat – Real-Time WebSocket Chat Application

## Overview

SecureChat is a real-time, full-stack chat application built using **React**, **Node.js**, **Express**, **MongoDB**, and **Socket.IO**. It features secure WebSocket communication (`wss://`), user authentication, message rate limiting, file sharing, emoji support, rich text formatting, and more.

Designed with simplicity, security, and accessibility in mind, SecureChat is perfect for small teams or classroom projects.

---
## 🚀 Live Hosted Service

| Component  | URL |
|------------|-----|
| Frontend (React App) | https://securechat-frontend.vercel.app |
| Backend (API + WebSocket server) | https://securechat.secure-tech.org |

## Features

-  Real-Time Messaging with WebSockets
-  Secure WebSocket Connection (`wss://`)
-  User Authentication (Login & Registration)
-  Brute-Force Protection & Rate Limiting (5 messages per 10 seconds per user)
-  Connection Handling (Join/Leave notifications + Heartbeats)
-  File Upload & Download with AES Encryption
-  Emoji Picker Integration
-  Rich Text Formatting (`*bold*`, `_italic_`, `[link](url)`)
-  Secure File Sharing
-  Per-Session Chat Log Files (stored as `.txt`)
-  Responsive UI with Tailwind CSS

---

## 📦 Installation & Setup

### 🔧 Prerequisites
- Node.js (v14+)
- MongoDB Atlas or local MongoDB
- SSL Certificates (`cert.pem` and `key.pem`) in `/backend/ssl/`

### 🔄 Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/ethanawu/SecureChat-455.git
   cd SecureChat-455
2. **Install backend dependencies**
   ```bash
   npm install
3. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
4. **Create a .env file in backend**
5. **Add SSL certificates**
6. **Start Server**
   ```bash
   npm run dev
   -----
   cd frontend
   npm start

Credit to [Dave ](https://www.youtube.com/@DaveGrayTeachesCode) and [WebDevSimplified](https://www.youtube.com/@WebDevSimplified) for tutorials. No code snippets were directly taken, but instead used as reference.
