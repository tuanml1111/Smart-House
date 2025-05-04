const SensorModel = require('../models/sensorModel');
const DeviceModel = require('../models/deviceModel');
const mqttService = require('./mqttService');
const logger = require('../utils/logger');

class PredictionService {
  // Predict if the temperature will exceed the threshold
  async predictTemperature(currentTemperature) {
    try {
      // This is a simple prediction model
      // In a real-world scenario, you would use a more sophisticated ML model
      
      // Get historical temperature data
      const temperatureSensorId = 1; // Assume ID 1 is the temperature sensor
      const historicalData = await SensorModel.getSensorData(temperatureSensorId, 24);
      
      if (historicalData.length < 5) {
        logger.info('Not enough historical data for prediction');
        return {
          willExceedThreshold: false,
          predictedTemperature: currentTemperature,
          confidence: 0
        };
      }
      
      // Calculate temperature trend
      const recentReadings = historicalData.slice(0, 5);
      const trend = this.calculateTrend(recentReadings.map(d => d.svalue));
      
      // Predict future temperature
      const predictedTemperature = currentTemperature + trend;
      
      // Check if it will exceed threshold
      const threshold = 30; // 30°C threshold
      const willExceedThreshold = predictedTemperature > threshold;
      
      // Calculate confidence based on data variance
      const values = recentReadings.map(d => d.svalue);
      const variance = this.calculateVariance(values);
      const confidence = Math.max(0, Math.min(1, 1 - variance / 10));
      
      // If temperature will exceed threshold with high confidence, turn on fan
      if (willExceedThreshold && confidence > 0.7) {
        await this.activateCooling();
      }
      
      return {
        willExceedThreshold,
        predictedTemperature,
        confidence,
        threshold
      };
    } catch (error) {
      logger.error(`Error predicting temperature: ${error.message}`);
      return {
        willExceedThreshold: false,
        predictedTemperature: currentTemperature,
        confidence: 0
      };
    }
  }
  
  // Calculate temperature trend
  calculateTrend(values) {
    if (values.length < 2) return 0;
    
    // Simple linear regression to get slope
    const n = values.length;
    const indices = Array.from({ length: n }, (_, i) => i);
    
    const sumX = indices.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = indices.reduce((sum, x, i) => sum + x * values[i], 0);
    const sumXX = indices.reduce((sum, x) => sum + x * x, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    
    return slope;
  }
  
  // Calculate variance of values
  calculateVariance(values) {
    if (values.length < 2) return 0;
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    
    return variance;
  }
  
  // Activate cooling system (turn on fan)
  async activateCooling() {
    try {
      // Find fan device(s)
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