const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const path = require('path');
const errorMiddleware = require('./middleware/errorMiddleware');
const mqttService = require('./services/mqttService');
const predictionRoutes = require('./routes/predictionRoutes');
const predictionService = require('./services/predictionService');

// Load environment variables
dotenv.config({ path: './config/.env' });

// Import routes
const authRoutes = require('./routes/authRoutes');
const deviceRoutes = require('./routes/deviceRoutes');
const sensorRoutes = require('./routes/sensorRoutes');
const alertRoutes = require('./routes/alertRoutes');
const alertConfigRoutes = require('./routes/alertConfigRoutes');
const alertMonitorService = require('./services/alertMonitorService');

// Initialize express app
const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/sensors', sensorRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/alert-config', alertConfigRoutes);
app.use('/api/predictions', predictionRoutes);

// Test endpoint to manually trigger alert check
app.get('/api/test/check-alerts', async (req, res) => {
  try {
    console.log('Manual alert check triggered via API');
    await alertMonitorService.checkThresholds();
    res.status(200).json({ 
      success: true, 
      message: 'Alert check completed successfully' 
    });
  } catch (error) {
    console.error('Error in manual alert check:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Alert check failed: ' + error.message 
    });
  }
});

// Endpoint kiểm tra cảnh báo độ ẩm cụ thể
app.post('/api/test/humidity-alert', async (req, res) => {
  try {
    const { value } = req.body;
    
    if (value === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'Vui lòng cung cấp giá trị độ ẩm' 
      });
    }
    
    console.log(`Kiểm tra cảnh báo độ ẩm thủ công với giá trị: ${value}`);
    const result = await alertMonitorService.testHumidityAlert(parseFloat(value));
    res.status(200).json(result);
  } catch (error) {
    console.error('Lỗi kiểm tra cảnh báo độ ẩm:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Kiểm tra cảnh báo độ ẩm thất bại: ' + error.message 
    });
  }
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
  });
}

// Error handling middleware
app.use(errorMiddleware);

// Set port
const PORT = process.env.PORT || 5000;

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Khởi tạo các dịch vụ một cách tuần tự và đáng tin cậy
(async function khoiTaoDichVu() {
  try {
    // Kết nối MQTT broker trước
    console.log('Đang kết nối đến MQTT broker...');
    mqttService.connect();
    
    // Chờ một chút để kết nối thiết lập
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Bắt đầu dịch vụ giám sát cảnh báo
    console.log('Đang khởi động dịch vụ giám sát cảnh báo...');
    const alertStarted = alertMonitorService.start();
    if (alertStarted) {
      console.log('Dịch vụ giám sát cảnh báo khởi động thành công');
    } else {
      console.error('Không thể khởi động dịch vụ giám sát cảnh báo');
    }
    
    // Chạy kiểm tra cảnh báo ngay lập tức để nắm bắt trạng thái hiện tại
    console.log('Đang chạy kiểm tra cảnh báo ban đầu...');
    try {
      await alertMonitorService.checkThresholds();
      console.log('Kiểm tra cảnh báo ban đầu hoàn tất');
    } catch (checkError) {
      console.error('Lỗi trong kiểm tra cảnh báo ban đầu:', checkError);
    }
    
    // Khởi động dịch vụ dự đoán nhiệt độ sau cùng
    console.log('Đang khởi động dịch vụ dự đoán nhiệt độ...');
    predictionService.start(15); // Chạy dự đoán mỗi 15 phút
    console.log('Dịch vụ dự đoán nhiệt độ khởi động thành công');
  } catch (error) {
    console.error('Lỗi trong quá trình khởi tạo dịch vụ:', error);
    console.error(error.stack);
    // Dịch vụ sẽ tiếp tục được thử mặc dù có lỗi
  }
})();

// Handle unhandled promise rejections - log error but don't exit process
process.on('unhandledRejection', (err) => {
  console.error(`Lỗi không xử lý: ${err.message}`);
  console.error(err.stack);
  // Không đóng server và thoát nữa - chỉ ghi log
});

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  alertMonitorService.stop();
  mqttService.disconnect();
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});