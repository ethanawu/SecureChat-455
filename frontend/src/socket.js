import { io } from 'socket.io-client';

const socket = io('https://securechat-455.onrender.com', {
  transports: ['websocket'],
  secure: true
});

export default socket;
