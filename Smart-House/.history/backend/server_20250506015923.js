const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const path = require('path');
const errorMiddleware = require('./middleware/errorMiddleware');
// Removed MQTT service import
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
    console.log('Manual alert check triggered');
    await alertMonitorService.checkThresholds();
    res.status(200).json({ success: true, message: 'Alert check completed' });
  } catch (error) {
    console.error('Error in manual alert check:', error);
    res.status(500).json({ success: false, message: error.message });
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

// Removed MQTT broker connection

// Start alert monitoring service with a delay
// This gives time for the server to fully initialize
setTimeout(() => {
  console.log('Starting alert monitor service...');
  alertMonitorService.start();
  
  // Start temperature prediction service
  console.log('Starting temperature prediction service...');
  predictionService.start(15); // Run prediction every 15 minutes
}, 5000);

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`Error: ${err.message}`);
  // Close server & exit process
  alertMonitorService.stop();
  // Removed MQTT disconnect
  server.close(() => process.exit(1));
});

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  alertMonitorService.stop();
  // Removed MQTT disconnect
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});