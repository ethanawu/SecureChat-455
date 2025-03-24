import React, { useState, useEffect } from "react";
import socket from "../socket";
import EmojiPicker from "emoji-picker-react";
import axios from "axios";

const ChatBox = ({ username }) => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    socket.emit("user-logged-in", { username });

    socket.on("message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

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

    const heartbeatInterval = setInterval(() => {
      socket.emit("heartbeat");
    }, 10000);

    return () => {
      socket.off("message");
      socket.off("user-joined");
      socket.off("user-left");
      clearInterval(heartbeatInterval);
    };
  }, [username]);

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

  const formatMessage = (text) => {
    text = text.replace(/\*([^*]+)\*/g, "<strong>$1</strong>");
    text = text.replace(/_([^_]+)_/g, "<em>$1</em>");
    text = text.replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    );

    return text;
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append("file", selectedFile);
    try {
      const res = await axios.post(
        "http://localhost:5000/api/chat/upload",
        formData
      );
      const fileLink = `http://localhost:5000/api/chat/download/${res.data.file}`;
      socket.emit("message", {
        sender: username,
        content: `📎 File shared: ${fileLink}`,
      });
      setSelectedFile(null);
    } catch (err) {
      console.error("File upload failed", err);
    }
  };

  return (
    <div className="chatbox p-6 max-w-2xl mx-auto bg-gray-50 rounded-xl shadow-md space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Welcome, {username}</h2>
        <button
          onClick={handleLogout}
          className="text-sm text-red-500 hover:underline"
        >
          Logout
        </button>
      </div>

      <div className="bg-white p-2 border rounded mb-2 text-sm text-gray-700">
        <strong>Active Users:</strong> {activeUsers.length}
      </div>

      <div className="messages h-64 overflow-y-auto border p-4 bg-white rounded">
        {messages.map((msg, index) => {
          const isFile = msg.content.includes(
            "http://localhost:5000/api/chat/download/"
          );
          const formattedContent = formatMessage(msg.content); 

          return (
            <p key={index}>
              <strong>{msg.sender}:</strong>{" "}
              {isFile ? (
                <a
                  href={msg.content.split("File shared: ")[1]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  Download File
                </a>
              ) : (
                <span dangerouslySetInnerHTML={{ __html: formattedContent }} />
              )}
            </p>
          );
        })}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            placeholder="Type a message..."
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            className="flex-grow p-2 border rounded"
          />
          <button
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            😀
          </button>
          <button
            onClick={sendMessage}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Send
          </button>
        </div>

        <div className="flex gap-2 items-center">
          <input
            type="file"
            onChange={(e) => setSelectedFile(e.target.files[0])}
            className="text-sm"
          />
          <button
            onClick={handleFileUpload}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Upload File
          </button>
        </div>
      </div>

      {showEmojiPicker && (
        <div className="mt-2">
          <EmojiPicker
            onEmojiClick={(emojiData) => handleEmojiClick(emojiData)}
          />
        </div>
      )}
    </div>
  );
};

export default ChatBox;
