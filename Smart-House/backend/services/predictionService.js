// backend/services/predictionService.js
const path = require('path');
const { spawn } = require('child_process');
const logger = require('../utils/logger');
const DeviceModel = require('../models/deviceModel');
const mqttService = require('./mqttService');
const predictionController = require('../controllers/predictionController');

class PredictionService {
  constructor() {
    this.predictionInterval = null;
    this.isRunning = false;
    this.threshold = 30; // Temperature threshold in Celsius
  }

  // Start the prediction service
  start(intervalMinutes = 5) {
    if (this.isRunning) {
      logger.info('Prediction service is already running');
      return;
    }

    logger.info(`Starting temperature prediction service with ${intervalMinutes} minute interval`);
    this.isRunning = true;
    
    // Run prediction once immediately
    this.runPrediction();
    
    // Set up interval for regular predictions
    this.predictionInterval = setInterval(() => {
      this.runPrediction();
    }, intervalMinutes * 60 * 1000);
  }

  // Stop the prediction service
  stop() {
    if (!this.isRunning) return;
    
    clearInterval(this.predictionInterval);
    this.isRunning = false;
    logger.info('Temperature prediction service stopped');
  }

  // Run the Python prediction script
  async runPrediction() {
    try {
      logger.info('Running temperature prediction for next hour');
      
      // Path to the Python script that runs the model
      const scriptPath = path.join(__dirname, '../../AI/predict.py');
      
      // Spawn a Python process
      const pythonProcess = spawn('python', [scriptPath]);
      
      let predictionData = '';
      
      // Collect data from script
      pythonProcess.stdout.on('data', (data) => {
        predictionData += data.toString();
      });
      
      // Handle completion
      pythonProcess.on('close', async (code) => {
        if (code !== 0) {
          logger.error(`Prediction process exited with code ${code}`);
          return;
        }
        
        try {
          // Parse the prediction result
          const prediction = JSON.parse(predictionData);
          logger.info(`Prediction result: ${JSON.stringify(prediction)}`);
          
          // Store the prediction
          await predictionController.storePrediction(prediction);
          
          // Check if the maximum predicted temperature exceeds threshold
          if (prediction.max_temperature > this.threshold && prediction.max_confidence > 0.7) {
            logger.info(`Predicted maximum temperature (${prediction.max_temperature}°C) exceeds threshold (${this.threshold}°C) with confidence ${prediction.max_confidence}`);
            await this.activateCooling();
          }
        } catch (parseError) {
          logger.error(`Error parsing prediction data: ${parseError.message}`);
        }
      });
      
      // Handle errors
      pythonProcess.stderr.on('data', (data) => {
        logger.error(`Prediction script error: ${data.toString()}`);
      });
      
    } catch (error) {
      logger.error(`Error running prediction: ${error.message}`);
    }
  }

  // Activate cooling devices (fans)
  async activateCooling() {
    try {
      // Find fan devices
      const fans = await DeviceModel.getDevicesByType('fan');
      
      if (fans.length === 0) {
        logger.warn('No fan devices found for automatic control');
        return false;
      }
      
      // Turn on all fans that are currently off
      for (const fan of fans) {
        if (fan.status === 'inactive') {
          // Update device status
          await DeviceModel.updateDevice(fan.device_id, { status: 'active' });
          
          // Send MQTT command
          const topic = `yolohome/devices/${fan.device_id}/control`;
          const message = JSON.stringify({
            device_id: fan.device_id,
            action: 'ON',
            status: 'active',
            timestamp: new Date().toISOString(),
            source: 'ai'
          });
          
          mqttService.publishMessage(topic, message);
          
          logger.info(`AI activated fan ${fan.device_id} due to temperature prediction`);
        }
      }
      
      return true;
    } catch (error) {
      logger.error(`Error activating cooling: ${error.message}`);
      return false;
    }
  }
}

module.exports = new PredictionService();