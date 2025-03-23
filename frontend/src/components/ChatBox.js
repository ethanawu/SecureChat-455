// src/components/ChatBox.js
import React, { useState, useEffect } from 'react';
import socket from '../socket';
import EmojiPicker from 'emoji-picker-react';

const ChatBox = ({ username }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);

  useEffect(() => {
    // Listen for incoming messages
    socket.on('message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    // Listen for user join/leave events
    socket.on('user-joined', (data) => {
      if (data.socketId !== socket.id) {
        setMessages((prev) => [...prev, { sender: 'System', content: `A user has joined the chat.` }]);
      }
      setActiveUsers(data.activeUsers);
    });

    socket.on('user-left', (data) => {
      setMessages((prev) => [...prev, { sender: 'System', content: `A user has left the chat.` }]);
      setActiveUsers(data.activeUsers);
    });

    // Emit heartbeat every 10s
    const heartbeatInterval = setInterval(() => {
      socket.emit('heartbeat');
    }, 10000);

    return () => {
      socket.off('message');
      socket.off('user-joined');
      socket.off('user-left');
      clearInterval(heartbeatInterval);
    };
  }, []);

  const sendMessage = () => {
    if (message.trim()) {
      socket.emit('message', { sender: username, content: message });
      setMessage('');
    }
  };

  const handleEmojiClick = (emojiData) => {
    setMessage((prev) => prev + emojiData.emoji);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.reload();
  };

  return (
    <div className="chatbox p-6 max-w-2xl mx-auto bg-gray-50 rounded-xl shadow-md space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Welcome, {username}</h2>
        <button onClick={handleLogout} className="text-sm text-red-500 hover:underline">Logout</button>
      </div>

      <div className="bg-white p-2 border rounded mb-2 text-sm text-gray-700">
        <strong>Active Users:</strong> {activeUsers.length}
      </div>

      <div className="messages h-64 overflow-y-auto border p-4 bg-white rounded">
        {messages.map((msg, index) => (
          <p key={index}><strong>{msg.sender}:</strong> {msg.content}</p>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={message}
          placeholder="Type a message..."
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          className="flex-grow p-2 border rounded"
        />
        <button onClick={() => setShowEmojiPicker((prev) => !prev)} className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300">😀</button>
        <button onClick={sendMessage} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Send</button>
      </div>

      {showEmojiPicker && <EmojiPicker onEmojiClick={handleEmojiClick} className="mt-2" />}
    </div>
  );
};

export default ChatBox;
