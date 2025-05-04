import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Dữ liệu mẫu cho 1 tuần
const generateMockData = (sensorType) => {
  const data = [];
  const now = new Date();
  if (sensorType === 'temperature') {
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      // Nhiệt độ ngẫu nhiên từ 20-30°C
      const value = parseFloat((20 + Math.random() * 10).toFixed(1));
      data.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        value: value
      });
    }
  } else if (sensorType === 'humidity') {
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      // Độ ẩm ngẫu nhiên từ 60-80%
      const value = parseFloat((60 + Math.random() * 20).toFixed(1));
      data.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        value: value
      });
    }
  }
  return data;
};

const SensorChart = ({ sensorType }) => {
  const [data] = useState(generateMockData(sensorType));
  
  return (
    <div className="sensor-chart-container" style={{ width: '100%', height: 400 }}>
      <ResponsiveContainer>
        <LineChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis 
            label={{ 
              value: sensorType === 'temperature' ? '°C' : '%', 
              angle: -90, 
              position: 'insideLeft' 
            }} 
          />
          <Tooltip />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="value" 
            name={sensorType === 'temperature' ? 'Temperature' : 'Humidity'}
            stroke={sensorType === 'temperature' ? '#ff4500' : '#1e90ff'} 
            activeDot={{ r: 8 }} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SensorChart;