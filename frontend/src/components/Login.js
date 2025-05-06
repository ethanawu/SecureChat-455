import React, { useState } from 'react';
import axios from 'axios';
import '../styles.css';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('https://securechat.secure-tech.org/api/auth/login', { username, password });
      localStorage.setItem('token', res.data.token);
      onLogin(username);
    } catch (err) {
      console.error('Login failed:', err);
      setError(err.response?.data?.message || 'Login failed');
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-md max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">SecureChat Login</h2>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="input-field w-full"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field w-full"
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" className="button button-blue w-full">Login</button>
        </form>

        
      </div>
    </div>
  );
};

export default Login;
