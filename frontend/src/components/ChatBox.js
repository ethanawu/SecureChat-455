import React, { useState, useEffect, useRef } from "react";
import socket from "../socket";
import EmojiPicker from "emoji-picker-react";
import axios from "axios";
import "../styles.css";

const ChatBox = ({ username }) => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    socket.emit("user-logged-in", { username });

    socket.on("message", (msg) => setMessages((prev) => [...prev, msg]));

    socket.on("user-joined", (data) => {
      if (data.username !== username) {
        setMessages((prev) => [
          ...prev,
          {
            sender: "System",
            content: `${data.username} has joined the chat.`,
          },
        ]);
      }
      setActiveUsers(data.activeUsers);
    });

    socket.on("user-left", (data) => {
      setMessages((prev) => [
        ...prev,
        { sender: "System", content: `${data.username} has left the chat.` },
      ]);
      setActiveUsers(data.activeUsers);
    });

    const heartbeatInterval = setInterval(
      () => socket.emit("heartbeat"),
      10000
    );

    return () => {
      socket.off("message");
      socket.off("user-joined");
      socket.off("user-left");
      clearInterval(heartbeatInterval);
    };
  }, [username]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (message.trim()) {
      socket.emit("message", { sender: username, content: message });
      setMessage("");
    }
  };

  const handleEmojiClick = (emojiData) => {
    setMessage((prev) => prev + emojiData.emoji);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.reload();
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append("file", selectedFile);
    try {
      const res = await axios.post('https://securechat-455.onrender.com/api/chat/upload', formData);
      const fileLink = `https://securechat-455.onrender.com/api/chat/download/${res.data.file}`;
      socket.emit("message", {
        sender: username,
        content: `📎 File shared: ${fileLink}`,
      });
      setSelectedFile(null);
    } catch (err) {
      console.error("File upload failed", err);
    }
  };

  const formatMessage = (text) => {
    text = text.replace(/\*([^*]+)\*/g, "<strong>$1</strong>");
    text = text.replace(/_([^_]+)_/g, "<em>$1</em>");
    text = text.replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline">$1</a>'
    );
    return text;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="chatbox max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">
            Welcome, {username}
          </h2>
          <button
            onClick={handleLogout}
            className="text-sm text-red-500 hover:underline"
          >
            Logout
          </button>
        </div>

        <div className="text-sm text-gray-600 mb-2">
          <strong>Active Users:</strong> {activeUsers.length}
        </div>

        <div className="chat-area h-72 overflow-y-auto border border-gray-200 rounded p-4 bg-gray-50 space-y-3">
          {messages.map((msg, index) => {
            const isFile = msg.content.includes(
              "https://localhost:5000/api/chat/download/"
            );
            const formattedContent = formatMessage(msg.content);
            const isOwn = msg.sender === username;
            const isSystem = msg.sender === "System";

            return (
              <div
                key={index}
                className={`chat-bubble ${
                  isSystem
                    ? "chat-bubble-system"
                    : isOwn
                    ? "chat-bubble-user"
                    : "chat-bubble-other"
                }`}
              >
                {isSystem ? (
                  <span>{msg.content}</span>
                ) : (
                  <p>
                    <strong className="text-sm text-gray-700">
                      {msg.sender}:&nbsp;
                    </strong>
                    {isFile ? (
                      <a
                        href={msg.content.split("File shared: ")[1]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        📎 Download File
                      </a>
                    ) : (
                      <span
                        dangerouslySetInnerHTML={{ __html: formattedContent }}
                      />
                    )}
                  </p>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        <div className="mt-4 space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              className="input-field flex-grow"
              value={message}
              placeholder="Type a message..."
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="button button-gray"
            >
              😀
            </button>
            <button onClick={sendMessage} className="button button-blue">
              Send
            </button>
          </div>

          {showEmojiPicker && (
            <div className="mt-1">
              <EmojiPicker onEmojiClick={handleEmojiClick} />
            </div>
          )}

          <div className="flex gap-2 items-center">
            <input
              type="file"
              onChange={(e) => setSelectedFile(e.target.files[0])}
              className="text-sm"
            />
            <button onClick={handleFileUpload} className="button button-green">
              Upload File
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;
