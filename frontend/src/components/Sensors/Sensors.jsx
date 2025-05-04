import React, { useState } from 'react';
import SensorChart from './SensorChart';
import './Sensor.css';

const Sensors = () => {
  const [selectedSensor, setSelectedSensor] = useState('temperature');
  
  const sensorTypes = [
    { type: 'temperature', label: 'Temperature', icon: 'fas fa-thermometer-half' },
    { type: 'humidity', label: 'Humidity', icon: 'fas fa-tint' }
  ];
  
  return (
    <div className="sensors-container">
      <div className="sensors-header">
        <h1>Sensor Readings</h1>
        <div className="sensor-type-selector">
          {sensorTypes.map(sensor => (
            <button
              key={sensor.type}
              className={`sensor-type-btn${selectedSensor === sensor.type ? ' active' : ''}`}
              onClick={() => setSelectedSensor(sensor.type)}
            >
              <i className={sensor.icon}></i>
              <span>{sensor.label}</span>
            </button>
          ))}
        </div>
      </div>
      {(selectedSensor === 'temperature' || selectedSensor === 'humidity') && (
        <div className="sensor-chart-wrapper">
          <SensorChart sensorType={selectedSensor} />
        </div>
      )}
    </div>
  );
};

export default Sensors;