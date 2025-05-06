import React, { useState, useEffect } from 'react';
import AlertController from '../../controllers/AlertController';
import './Alerts.css';
import { NavLink } from 'react-router-dom';

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [filteredAlerts, setFilteredAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState(null);
  
  // Load alerts on component mount
  useEffect(() => {
    loadAlerts();
    // Set up a refresh interval (every 30 seconds)
    const interval = setInterval(loadAlerts, 30000);
    
    // Clean up interval on unmount
    return () => clearInterval(interval);
  }, []);
  
  // Filter alerts when filter or alerts change
  useEffect(() => {
    if (filter === 'all') {
      setFilteredAlerts(alerts);
    } else {
      setFilteredAlerts(alerts.filter(alert => alert.status === filter));
    }
  }, [filter, alerts]);
  
  const loadAlerts = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const alertData = await AlertController.getAllAlerts();
      setAlerts(alertData);
    } catch (err) {
      setError('Failed to load alerts. Please try again.');
      console.error('Error loading alerts:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleResolveAlert = async (id) => {
    try {
      await AlertController.updateAlertStatus(id, 'resolved');
      
      // Update the local state
      setAlerts(alerts.map(alert => 
        alert.id === id ? { ...alert, status: 'resolved' } : alert
      ));
    } catch (err) {
      setError('Failed to resolve alert. Please try again.');
      console.error('Error resolving alert:', err);
    }
  };
  
  const handleResolveAll = async () => {
    try {
      await AlertController.resolveAllAlerts();
      
      // Update all pending alerts to resolved in local state
      setAlerts(alerts.map(alert => 
        alert.status === 'pending' ? { ...alert, status: 'resolved' } : alert
      ));
      
      // Show success message
      setError(null);
    } catch (err) {
      setError('Failed to resolve all alerts. Please try again.');
      console.error('Error resolving all alerts:', err);
    }
  };
  
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };
  
  if (isLoading) {
    return <div className="loading-indicator">Loading alerts...</div>;
  }
  
  return (
    <div className="alerts-container">
      <div className="alerts-header">
        <h1>Alerts</h1>
        <div className="alerts-actions">
          <NavLink to="/alert-config" className="config-link">
            <i className="fas fa-sliders-h"></i> Configure Alerts
          </NavLink>
          <button 
            className="resolve-all-btn" 
            onClick={handleResolveAll}
            disabled={alerts.filter(a => a.status === 'pending').length === 0}
          >
            Resolve All Alerts
          </button>
          <div className="filter-buttons">
            <button 
              className={filter === 'all' ? 'filter-btn active' : 'filter-btn'}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button 
              className={filter === 'pending' ? 'filter-btn active' : 'filter-btn'}
              onClick={() => setFilter('pending')}
            >
              Active
            </button>
            <button 
              className={filter === 'resolved' ? 'filter-btn active' : 'filter-btn'}
              onClick={() => setFilter('resolved')}
            >
              Resolved
            </button>
          </div>
        </div>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {filteredAlerts.length > 0 ? (
        <div className="alerts-list">
          {filteredAlerts.map(alert => (
            <div key={alert.id} className={`alert-card ${alert.status}`}>
              <div className="alert-details">
                <div className="alert-type">
                  {alert.type === 'Overheat' && <i className="fas fa-thermometer-full"></i>}
                  {alert.type === 'Low Humidity' && <i className="fas fa-tint"></i>}
                  {alert.type === 'Motion Detected' && <i className="fas fa-running"></i>}
                  {alert.type === 'Air Pollution' && <i className="fas fa-smog"></i>}
                  {alert.type === 'Darkness Alert' && <i className="fas fa-moon"></i>}
                  {!['Overheat', 'Low Humidity', 'Motion Detected', 'Air Pollution', 'Darkness Alert'].includes(alert.type) && <i className="fas fa-exclamation-triangle"></i>}
                  <span>{alert.type}</span>
                </div>
                <div className="alert-message">{alert.message}</div>
                <div className="alert-time">
                  <span>{formatDate(alert.timestamp)}</span>
                  <span>{formatTime(alert.timestamp)}</span>
                </div>
              </div>
              <div className="alert-status">
                <span className={alert.status}>{alert.status}</span>
              </div>
              {alert.status === 'pending' && (
                <div className="alert-actions">
                  <button 
                    className="resolve-btn"
                    onClick={() => handleResolveAlert(alert.id)}
                  >
                    Resolve
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="no-alerts">
          <i className="fas fa-check-circle"></i>
          <p>No {filter !== 'all' ? filter : ''} alerts found.</p>
        </div>
      )}
    </div>
  );
};

export default Alerts; 