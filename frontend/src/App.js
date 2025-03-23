import React, { useState } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import ChatBox from './components/ChatBox';

const App = () => {
  const [user, setUser] = useState(localStorage.getItem('token') ? 'LoggedInUser' : null);
  const [showRegister, setShowRegister] = useState(false);

  return (
    <div className="app p-4 min-h-screen bg-gray-100">
      {user ? (
        <ChatBox username={user} />
      ) : showRegister ? (
        <Register onSwitchToLogin={() => setShowRegister(false)} />
      ) : (
        <Login onLogin={setUser} />
      )}
      {!user && !showRegister && (
        <div className="text-center mt-4">
          <p>
            Don’t have an account?{' '}
            <span className="text-blue-600 cursor-pointer" onClick={() => setShowRegister(true)}>
              Register Here
            </span>
          </p>
        </div>
      )}
    </div>
  );
};

export default App;
