import React, { useState, useEffect } from 'react';
import AlertConfigController from '../../controllers/AlertConfigController';
import './AlertConfig.css';

const AlertConfig = () => {
  const [configs, setConfigs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);
  
  // Load alert configurations on mount
  useEffect(() => {
    loadConfigs();
  }, []);
  
  const loadConfigs = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const configData = await AlertConfigController.getAlertConfigs();
      setConfigs(configData);
    } catch (err) {
      console.error('Error loading configurations:', err);
      setError(err.message || 'Lỗi máy chủ, vui lòng thử lại sau');
    } finally {
      setIsLoading(false);
    }
  };
  
  const startEditing = (config) => {
    setEditingConfig({
      ...config,
      minValue: config.minValue.toString(),
      maxValue: config.maxValue.toString()
    });
    setIsEditing(true);
  };
  
  const cancelEditing = () => {
    setEditingConfig(null);
    setIsEditing(false);
  };
  
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditingConfig({
      ...editingConfig,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  const saveConfig = async (e) => {
    e.preventDefault();
    
    try {
      const updatedConfig = await AlertConfigController.updateAlertConfig(
        editingConfig.id, 
        {
          minValue: parseFloat(editingConfig.minValue),
          maxValue: parseFloat(editingConfig.maxValue),
          isActive: true // Always active
        }
      );
      
      // Update the local state
      setConfigs(configs.map(config => 
        config.id === updatedConfig.id ? updatedConfig : config
      ));
      
      setIsEditing(false);
      setEditingConfig(null);
      setError(null);
    } catch (err) {
      console.error('Error saving configuration:', err);
      setError(err.message || 'Lỗi khi cập nhật cấu hình cảnh báo');
    }
  };
  
  const getSensorTypeLabel = (type) => {
    switch (type) {
      case 'temperature':
        return 'Nhiệt độ';
      case 'humidity':
        return 'Độ ẩm';
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };
  
  const getSensorTypeUnit = (type) => {
    switch (type) {
      case 'temperature':
        return '°C';
      case 'humidity':
        return '%';
      default:
        return '';
    }
  };
  
  const getAlertDescriptions = (type, min, max) => {
    switch (type) {
      case 'temperature':
        return {
          low: `Cảnh báo khi nhiệt độ < ${min}°C`,
          high: `Cảnh báo khi nhiệt độ > ${max}°C`
        };
      case 'humidity':
        return {
          low: `Cảnh báo khi độ ẩm < ${min}%`,
          high: `Cảnh báo khi độ ẩm > ${max}%`
        };
      default:
        return {
          low: `Cảnh báo khi < ${min}`,
          high: `Cảnh báo khi > ${max}`
        };
    }
  };
  
  const handleInitializeDefaults = async () => {
    try {
      setIsInitializing(true);
      const resetConfigs = await AlertConfigController.resetAlertConfigs();
      setConfigs(resetConfigs);
      setError(null);
    } catch (err) {
      console.error('Error initializing default configurations:', err);
      setError(err.message || 'Lỗi khi khởi tạo cấu hình mặc định');
    } finally {
      setIsInitializing(false);
    }
  };
  
  if (isLoading) {
    return <div className="loading-indicator">Đang tải cấu hình...</div>;
  }
  
  return (
    <div className="alert-config-container">
      <div className="alert-config-header">
        <h1>Cấu hình cảnh báo</h1>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {configs.length > 0 ? (
        <div className="config-grid">
          {configs.map(config => (
            <div key={config.id} className="config-card">
              {isEditing && editingConfig && editingConfig.id === config.id ? (
                <form onSubmit={saveConfig} className="config-form">
                  <div className="config-form-header">
                    <h3>{getSensorTypeLabel(config.sensorType)}</h3>
                  </div>
                  
                  <div className="form-group">
                    <div className="alert-setting">
                      <i className="fas fa-arrow-down text-blue"></i>
                      <label>Cảnh báo khi thấp hơn:</label>
                    </div>
                    <div className="input-with-unit">
                      <input
                        type="number"
                        name="minValue"
                        value={editingConfig.minValue}
                        onChange={handleInputChange}
                        step="0.1"
                        required
                      />
                      <span className="unit">{getSensorTypeUnit(config.sensorType)}</span>
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <div className="alert-setting">
                      <i className="fas fa-arrow-up text-red"></i>
                      <label>Cảnh báo khi cao hơn:</label>
                    </div>
                    <div className="input-with-unit">
                      <input
                        type="number"
                        name="maxValue"
                        value={editingConfig.maxValue}
                        onChange={handleInputChange}
                        step="0.1"
                        required
                      />
                      <span className="unit">{getSensorTypeUnit(config.sensorType)}</span>
                    </div>
                  </div>
                  
                  <div className="form-actions">
                    <button type="submit" className="save-btn">Lưu</button>
                    <button type="button" className="cancel-btn" onClick={cancelEditing}>Hủy</button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="config-header">
                    <h3>{getSensorTypeLabel(config.sensorType)}</h3>
                    <div className="config-status">
                      <span className="active">Đã bật</span>
                    </div>
                  </div>
                  
                  <div className="config-details">
                    <div className="threshold-alert">
                      <div className="alert-condition low">
                        <i className="fas fa-arrow-down"></i>
                        <span>{getAlertDescriptions(config.sensorType, config.minValue, config.maxValue).low}</span>
                      </div>
                      <div className="alert-condition high">
                        <i className="fas fa-arrow-up"></i>
                        <span>{getAlertDescriptions(config.sensorType, config.minValue, config.maxValue).high}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="config-actions">
                    <button 
                      className="edit-btn"
                      onClick={() => startEditing(config)}
                    >
                      Sửa
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="no-configs">
          <p>Không tìm thấy cấu hình cảnh báo nào.</p>
          <button 
            className="init-btn" 
            onClick={handleInitializeDefaults}
            disabled={isInitializing}
          >
            {isInitializing ? 'Đang khởi tạo...' : 'Khởi tạo cấu hình cảnh báo'}
          </button>
        </div>
      )}
    </div>
  );
};

export default AlertConfig; 