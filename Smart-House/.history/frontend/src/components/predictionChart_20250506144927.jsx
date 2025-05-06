// frontend/src/components/predictionChart.jsx
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import apiService from '../services/apiService';

const PredictionChart = () => {
  const [predictions, setPredictions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Nhiệt độ hiện tại và nhiệt độ dự đoán tối đa
  const [currentTemp, setCurrentTemp] = useState('N/A');
  const [maxPredicted, setMaxPredicted] = useState('N/A');
  
  useEffect(() => {
    const fetchPredictions = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log('Đang lấy dữ liệu dự đoán nhiệt độ...');
        const response = await apiService.get('/predictions');
        console.log('Phản hồi API:', response.data);
        
        if (response.data && response.data.data && response.data.data.length > 0) {
          // Định dạng dữ liệu cho biểu đồ
          const formattedData = response.data.data.map(pred => ({
            time: new Date(pred.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            predicted: pred.predicted !== null ? parseFloat(pred.predicted) : null,
            actual: pred.actual !== null ? parseFloat(pred.actual) : null
          }));
          
          console.log('Dữ liệu đã định dạng:', formattedData);
          setPredictions(formattedData);
          
          // Đặt nhiệt độ hiện tại và dự đoán tối đa
          const actualTemp = formattedData.find(p => p.actual !== null)?.actual;
          if (actualTemp !== undefined) {
            setCurrentTemp(actualTemp.toFixed(1));
          }
          
          const predictedValues = formattedData
            .filter(p => p.predicted !== null)
            .map(p => p.predicted);
            
          if (predictedValues.length > 0) {
            setMaxPredicted(Math.max(...predictedValues).toFixed(1));
          }
        } else {
          console.log('Không có dữ liệu dự đoán. Hiển thị thông báo.');
          setPredictions([]);
          setError('Không có dữ liệu dự đoán. Vui lòng thử lại sau.');
        }
      } catch (error) {
        console.error('Lỗi khi lấy dữ liệu dự đoán:', error);
        setError('Không thể kết nối đến máy chủ dự đoán.');
        setPredictions([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Gọi API khi component được tải
    fetchPredictions();
    
    // Cập nhật dữ liệu mỗi 5 phút
    const interval = setInterval(fetchPredictions, 300000);
    return () => clearInterval(interval);
  }, []);
  
  // Hiển thị trạng thái đang tải
  if (isLoading) {
    return (
      <div className="prediction-loading">
        <div className="loader"></div>
        <p>Đang tải dự đoán nhiệt độ...</p>
      </div>
    );
  }
  
  return (
    <div className="prediction-chart-container">
      {error && <div className="prediction-error">{error}</div>}
      
      <div className="prediction-chart">
        {predictions.length > 0 ? (
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={predictions} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" tick={{ fontSize: 10 }} />
              <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={{ fontSize: 10 }} />
              <Tooltip 
                formatter={(value) => value !== null ? `${value.toFixed(1)}°C` : 'N/A'}
                labelFormatter={(time) => `Thời gian: ${time}`}
              />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Line 
                type="monotone" 
                dataKey="actual" 
                name="Thực tế" 
                stroke="#8884d8" 
                activeDot={{ r: 6 }} 
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="predicted" 
                name="Dự đoán" 
                stroke="#ff7300" 
                strokeDasharray="5 5"
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="no-data-message">Không có dữ liệu dự đoán</div>
        )}
      </div>
      
      <div className="prediction-info">
        <div className="prediction-stat">
          <span className="stat-label">Hiện tại:</span>
          <span className="stat-value">{currentTemp}°C</span>
        </div>
        <div className="prediction-stat">
          <span className="stat-label">Dự đoán cao nhất:</span>
          <span className="stat-value">{maxPredicted}°C</span>
        </div>
      </div>
    </div>
  );
};

export default PredictionChart;