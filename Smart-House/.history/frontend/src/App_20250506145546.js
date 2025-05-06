// frontend/src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login/Login';
import Dashboard from './components/Dashboard/Dashboard';
import DeviceControl from './components/DeviceControl/DeviceControl';
import Alerts from './components/Alerts/Alerts';
import AlertConfig from './components/Alerts/AlertConfig';
import AIPrediction from './components/AIPrediction/AIPrediction'; // Import component mới
import Header from './components/common/Header';
import Sidebar from './components/common/Sidebar';
import Footer from './components/common/Footer';
import Sensors from './components/Sensors/Sensors';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    // Check if token exists in localStorage
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);
  
  const handleLogin = (token) => {
    localStorage.setItem('token', token);
    setIsAuthenticated(true);
  };
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    setIsAuthenticated(false);
  };
  
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/login" element={
            isAuthenticated ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />
          } />
          
          <Route path="/*" element={
            isAuthenticated ? (
              <div className="app-container">
                <Header onLogout={handleLogout} />
                <div className="main-container">
                  <Sidebar />
                  <main className="content">
                    <Routes>
                      <Route path="/" element={<Navigate to="/dashboard" />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/devices" element={<DeviceControl />} />
                      <Route path="/alerts" element={<Alerts />} />
                      <Route path="/alert-config" element={<AlertConfig />} />
                      <Route path="/sensors" element={<Sensors />} />
                      <Route path="/ai-prediction" element={<AIPrediction />} /> {/* Thêm route mới */}
                    </Routes>
                  </main>
                </div>
                <Footer />
              </div>
            ) : <Navigate to="/login" />
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;