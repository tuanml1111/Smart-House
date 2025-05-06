// frontend/src/components/PredictionChart.jsx
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import apiService from '../services/apiService';

const PredictionChart = () => {
  const [predictions, setPredictions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchPredictions = async () => {
      setIsLoading(true);
      setError(null);
      try {
        console.log('Fetching temperature predictions...');
        const response = await apiService.get('/predictions');
        
        if (response.data && response.data.data) {
          // Format the data for the chart
          const formattedData = response.data.data.map(pred => ({
            ...pred,
            time: new Date(pred.time).toLocaleTimeString(),
            // Ensure values are numeric
            predicted: pred.predicted !== null ? parseFloat(pred.predicted) : null,
            actual: pred.actual !== null ? parseFloat(pred.actual) : null
          }));
          
          console.log('Received prediction data:', formattedData);
          setPredictions(formattedData);
        } else {
          console.log('No prediction data in response');
          // Use mock data if no predictions are available yet
          createMockData();
        }
      } catch (error) {
        console.error('Failed to fetch predictions:', error);
        setError('Failed to load predictions. Using sample data instead.');
        // Use mock data if API fails
        createMockData();
      } finally {
        setIsLoading(false);
      }
    };
    
    // Create mock data for development/fallback
    const createMockData = () => {
      const mockData = [];
      const now = new Date();
      
      // Current reading
      mockData.push({
        time: now.toLocaleTimeString(),
        actual: 25.5,
        predicted: null
      });
      
      // Future predictions
      for (let i = 1; i <= 4; i++) {
        const futureTime = new Date(now.getTime() + i * 15 * 60000);
        mockData.push({
          time: futureTime.toLocaleTimeString(),
          actual: null,
          predicted: 25.5 + (Math.random() * 2 - 1)
        });
      }
      
      setPredictions(mockData);
    };
    
    fetchPredictions();
    const interval = setInterval(fetchPredictions, 300000); // Update every 5 minutes
    
    return () => clearInterval(interval);
  }, []);
  
  if (isLoading && predictions.length === 0) {
    return <div className="loading">Loading predictions...</div>;
  }
  
  // Find the latest prediction for the next hour
  const nextHourPredictions = predictions
    .filter(p => p.predicted !== null)
    .sort((a, b) => {
      const timeA = a.time.split(':').map(Number);
      const timeB = b.time.split(':').map(Number);
      return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
    });
  
  const maxPredictedTemp = nextHourPredictions.length > 0 
    ? Math.max(...nextHourPredictions.map(p => p.predicted).filter(p => p !== null))
    : null;
  
  const currentTemp = predictions.find(p => p.actual !== null)?.actual || 'N/A';
  
  return (
    <div className="prediction-chart">
      {error && <div className="error-message">{error}</div>}
      
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={predictions}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis 
            domain={['dataMin - 1', 'dataMax + 1']} 
          />
          <Tooltip formatter={(value) => value !== null ? `${value.toFixed(1)}°C` : 'N/A'} />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="actual" 
            name="Actual" 
            stroke="#8884d8" 
            activeDot={{ r: 8 }} 
            strokeWidth={2}
          />
          <Line 
            type="monotone" 
            dataKey="predicted" 
            name="Predicted" 
            stroke="#ff7300" 
            strokeDasharray="5 5"
            activeDot={{ r: 6 }} 
          />
        </LineChart>
      </ResponsiveContainer>
      
      <div className="prediction-info">
        <div className="prediction-stat">
          <span className="label">Current:</span>
          <span className="value">{typeof currentTemp === 'number' ? `${currentTemp.toFixed(1)}°C` : currentTemp}</span>
        </div>
        
        <div className="prediction-stat">
          <span className="label">Max Predicted:</span>
          <span className="value">
            {maxPredictedTemp !== null ? `${maxPredictedTemp.toFixed(1)}°C` : 'N/A'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PredictionChart;