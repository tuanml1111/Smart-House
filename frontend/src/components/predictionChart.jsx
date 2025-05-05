// frontend/src/components/PredictionChart.jsx
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import apiService from '../services/apiService';

const PredictionChart = () => {
  const [predictions, setPredictions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchPredictions = async () => {
      setIsLoading(true);
      try {
        const response = await apiService.get('/predictions');
        if (response.data && response.data.data) {
          // Format the data for the chart
          const formattedData = response.data.data.map(pred => ({
            ...pred,
            time: new Date(pred.time).toLocaleTimeString(),
          }));
          
          setPredictions(formattedData);
        }
      } catch (error) {
        console.error('Failed to fetch predictions:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPredictions();
    const interval = setInterval(fetchPredictions, 300000); // Update every 5 minutes
    
    return () => clearInterval(interval);
  }, []);
  
  if (isLoading) {
    return <div className="loading">Loading predictions...</div>;
  }
  
  if (!predictions.length) {
    return <div className="no-data">No prediction data available yet.</div>;
  }
  
  // Find the latest prediction for the next hour
  const nextHourPredictions = predictions
    .filter(p => p.minutes_ahead)
    .sort((a, b) => new Date(a.time) - new Date(b.time));
  
  const maxPredictedTemp = nextHourPredictions.length > 0 
    ? Math.max(...nextHourPredictions.map(p => p.predicted).filter(p => p !== null))
    : null;
  
  return (
    <div className="prediction-chart">
      <h3>Temperature Prediction (Next Hour)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={predictions}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis 
            label={{ value: 'Temperature (°C)', angle: -90, position: 'insideLeft' }} 
            domain={['dataMin - 1', 'dataMax + 1']} 
          />
          <Tooltip />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="actual" 
            name="Actual" 
            stroke="#8884d8" 
            activeDot={{ r: 8 }} 
          />
          <Line 
            type="monotone" 
            dataKey="predicted" 
            name="Predicted" 
            stroke="#ff7300" 
            activeDot={{ r: 8 }} 
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="prediction-info">
        <p>
          <strong>Current Temperature:</strong> {
            predictions.find(p => p.actual !== null && p.predicted === null)?.actual || 'N/A'
          }°C
        </p>
        <p>
          <strong>Maximum Predicted Temperature:</strong> {
            maxPredictedTemp !== null ? `${maxPredictedTemp.toFixed(1)}°C` : 'N/A'
          }
        </p>
      </div>
    </div>
  );
};

export default PredictionChart;