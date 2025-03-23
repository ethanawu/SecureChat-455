import React, { useState, useEffect } from 'react';
import socket from '../socket';
import EmojiPicker from 'emoji-picker-react';

const ChatBox = ({ username }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  useEffect(() => {
    socket.on('message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });
    return () => socket.off('message');
  }, []);

  const sendMessage = () => {
    if (message.trim()) {
      socket.emit('message', { sender: username, content: message });
      setMessages(prev => [...prev, { sender: username, content: message }]);
      setMessage('');
    }
  };

  const handleEmojiClick = (emojiData) => {
    setMessage(prev => prev + emojiData.emoji);
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
        <button onClick={() => setShowEmojiPicker(prev => !prev)} className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300">😀</button>
        <button onClick={sendMessage} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Send</button>
      </div>
      {showEmojiPicker && <EmojiPicker onEmojiClick={handleEmojiClick} className="mt-2" />}
    </div>
  );
};

export default ChatBox;