// frontend/src/components/AIPrediction/AIPrediction.jsx
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import apiService from '../../services/apiService';
import './AIPrediction.css';

const AIPrediction = () => {
  const [predictions, setPredictions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
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

  return (
    <div className="ai-prediction-container">
      <div className="ai-prediction-header">
        <h1>Biểu đồ dự đoán nhiệt độ</h1>
        <p className="header-description">
          Hệ thống AI dự đoán nhiệt độ trong 60 phút tới dựa trên dữ liệu cảm biến và mô hình randomforest.
        </p>
      </div>

      {error && <div className="prediction-error">{error}</div>}
      
      {isLoading ? (
        <div className="prediction-loading">
          <div className="loader"></div>
          <p>Đang tải dữ liệu dự đoán nhiệt độ...</p>
        </div>
      ) : (
        <div className="prediction-content">
          <div className="stats-container">
            <div className="stat-card">
              <div className="stat-icon temperature">
                <i className="fas fa-thermometer-half"></i>
              </div>
              <div className="stat-info">
                <span className="stat-label">Nhiệt độ hiện tại</span>
                <span className="stat-value">{currentTemp}°C</span>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon prediction">
                <i className="fas fa-chart-line"></i>
              </div>
              <div className="stat-info">
                <span className="stat-label">Dự đoán cao nhất</span>
                <span className="stat-value">{maxPredicted}°C</span>
              </div>
            </div>
          </div>
          
          <div className="chart-container">
            <h2>Biểu đồ dự đoán nhiệt độ</h2>
            {predictions.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={predictions} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  {/* Sửa trục Y để hiển thị đúng định dạng nhiệt độ */}
                  <YAxis 
                    domain={['dataMin - 1', 'dataMax + 1']} 
                    tickFormatter={(value) => `${value.toFixed(1)}°C`}
                    width={65}
                  />
                  <Tooltip 
                    formatter={(value) => value !== null ? `${value.toFixed(1)}°C` : 'N/A'}
                    labelFormatter={(time) => `Thời gian: ${time}`}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="actual" 
                    name="Thực tế" 
                    stroke="#8884d8" 
                    activeDot={{ r: 8 }} 
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
          
        </div>
      )}
    </div>
  );
};

export default AIPrediction;