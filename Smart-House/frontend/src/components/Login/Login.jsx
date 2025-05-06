import React, { useState, useEffect } from 'react';
import AuthController from '../../controllers/AuthController';
import './Login.css';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [attemptCount, setAttemptCount] = useState(0);

  // Function to log status with timestamp
  const logStatus = (message, isError = false) => {
    const time = new Date().toLocaleTimeString();
    setStatus(prev => `${prev}\n[${time}] ${message}`);
    
    if (isError) {
      console.error(`[${time}] ${message}`);
    } else {
      console.log(`[${time}] ${message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setAttemptCount(prev => prev + 1);
    
    logStatus(`Login attempt #${attemptCount + 1} with username: ${username}`);
    
    try {
      logStatus('Sending request to AuthController...');
      const result = await AuthController.login(username, password);
      logStatus(`Got response: ${result.success ? 'Success' : 'Failed'}`);
      
      if (result.success) {
        logStatus('Login successful! Redirecting...');
        onLogin(result.token);
      } else {
        logStatus(`Login failed: ${result.message}`, true);
        setError(result.message);
      }
    } catch (err) {
      logStatus(`Error in login process: ${err.message}`, true);
      setError('An error occurred during login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>YoloHome</h1>
          <p>Smart Home System</p>
        </div>
        
        {error && (
          <div className="error-message">
            <p>{error}</p>
            <p className="error-hint">Troubleshooting tips: Check your network connection, verify the backend server is running, and ensure your credentials are correct.</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          
          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        {status && (
          <div className="login-status">
            <h3>Login Status Log:</h3>
            <pre>{status}</pre>
          </div>
        )}
        
        <div className="debug-info">
          <p><strong>Default Login:</strong> username: admin, password: tuan</p>
          <p><strong>API URL:</strong> {process.env.REACT_APP_API_URL}</p>
        </div>
      </div>
    </div>
  );
};

export default Login;