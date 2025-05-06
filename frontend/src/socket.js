import { io } from 'socket.io-client';

const socket = io('https://securechat.secure-tech.org', {
  transports: ['websocket'],
  secure: true
});

export default socket;
