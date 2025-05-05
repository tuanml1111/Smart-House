const cron = require('node-cron');
const SensorModel = require('../models/sensorModel');
const AlertConfigModel = require('../models/alertConfigModel');
const AlertModel = require('../models/alertModel');
const DeviceModel = require('../models/deviceModel');
const db = require('../config/db'); // Add proper db import
const logger = require('../utils/logger');

class AlertMonitorService {
  constructor() {
    this.isRunning = false;
    this.checkInterval = '*/1 * * * *'; // Every 1 minute
    this.lastCheckedValues = {}; // Store previous values
  }

  start() {
    if (this.isRunning) {
      logger.info('Alert monitor service is already running');
      return;
    }

    // Schedule check every minute
    this.job = cron.schedule(this.checkInterval, async () => {
      try {
        await this.checkThresholds();
      } catch (error) {
        logger.error(`Error checking alert thresholds: ${error.message}`);
      }
    });

    this.isRunning = true;
    logger.info('Alert monitor service started successfully');
  }

  stop() {
    if (this.job) {
      this.job.stop();
      this.isRunning = false;
      logger.info('Alert monitor service stopped');
    }
  }

  async checkThresholds() {
    logger.info('Checking sensor values against alert thresholds');

    try {
      // Get all active alert configurations
      const allConfigs = await this.getAllActiveConfigs();
      if (!allConfigs || allConfigs.length === 0) {
        logger.info('No active alert configurations found');
        return;
      }

      // Group configurations by sensor type
      const configsByType = {};
      allConfigs.forEach(config => {
        if (!configsByType[config.sensor_type]) {
          configsByType[config.sensor_type] = [];
        }
        configsByType[config.sensor_type].push(config);
      });

      // Get all sensors
      const sensors = await SensorModel.getAllSensors();
      logger.info(`Found ${sensors.length} sensors to check`);
      
      // Check each sensor
      for (const sensor of sensors) {
        // Skip sensors without alert configuration
        if (!configsByType[sensor.sensor_type]) {
          continue;
        }

        logger.info(`Checking sensor ${sensor.sensor_id} (${sensor.sensor_type})`);
        
        // Get latest value
        const latestData = await SensorModel.getLatestSensorData(sensor.sensor_id);
        if (!latestData) {
          logger.info(`No data found for sensor ${sensor.sensor_id}`);
          continue;
        }

        const sensorValue = parseFloat(latestData.svalue);
        const sensorKey = `${sensor.sensor_id}`;
        const previousValue = this.lastCheckedValues[sensorKey];
        
        // Store current value for next check
        this.lastCheckedValues[sensorKey] = sensorValue;

        logger.info(`Sensor ${sensor.sensor_id} value: ${sensorValue} (previous: ${previousValue})`);

        // Try to find related device
        const deviceId = await this.findDeviceForSensor(sensor.sensor_id);
        if (!deviceId) {
          // If no device found, use a default device ID (e.g., 1)
          logger.warn(`No device found for sensor ${sensor.sensor_id}, using default ID 1`);
        }

        // Check each alert configuration for this sensor type
        for (const config of configsByType[sensor.sensor_type]) {
          logger.info(`Checking against config: min=${config.min_value}, max=${config.max_value}`);
          
          // Only create alert when state changes from normal to threshold exceeded
          // or from one threshold to another
          if (previousValue !== undefined) {
            // Check lower threshold
            if (sensorValue < config.min_value && (previousValue >= config.min_value || (previousValue < config.min_value && previousValue > config.max_value))) {
              logger.info(`Low threshold alert triggered: ${sensorValue} < ${config.min_value}`);
              await this.createAlert(deviceId || 1, sensor, 'Low', sensorValue, config.min_value);
            }
            // Check upper threshold
            else if (sensorValue > config.max_value && (previousValue <= config.max_value || (previousValue > config.max_value && previousValue < config.min_value))) {
              logger.info(`High threshold alert triggered: ${sensorValue} > ${config.max_value}`);
              await this.createAlert(deviceId || 1, sensor, 'High', sensorValue, config.max_value);
            }
          } else {
            // First check
            if (sensorValue < config.min_value) {
              logger.info(`Initial low threshold alert triggered: ${sensorValue} < ${config.min_value}`);
              await this.createAlert(deviceId || 1, sensor, 'Low', sensorValue, config.min_value);
            } else if (sensorValue > config.max_value) {
              logger.info(`Initial high threshold alert triggered: ${sensorValue} > ${config.max_value}`);
              await this.createAlert(deviceId || 1, sensor, 'High', sensorValue, config.max_value);
            }
          }
        }
      }
    } catch (error) {
      logger.error(`Error in checkThresholds: ${error.message}`);
      throw error;
    }
  }

  async findDeviceForSensor(sensorId) {
    try {
      // Try to find relationship between devices and sensors in equipped_with table
      const query = `
        SELECT device_id FROM equipped_with 
        WHERE sensor_id = $1 
        LIMIT 1
      `;
      const result = await db.query(query, [sensorId]);
      
      if (result.rows.length > 0) {
        return result.rows[0].device_id;
      }
      
      // If not found, return null and let caller handle it
      return null;
    } catch (error) {
      logger.error(`Error finding device for sensor: ${error.message}`);
      return null;
    }
  }

  async createAlert(deviceId, sensor, levelType, currentValue, thresholdValue) {
    try {
      const alertType = `${levelType} ${sensor.sensor_type}`;
      const message = `${sensor.sensor_type} is ${levelType.toLowerCase()} at ${currentValue.toFixed(1)}${sensor.unit || ''} (threshold: ${thresholdValue}${sensor.unit || ''})`;
      
      logger.info(`Creating alert: ${message}`);
      
      await AlertModel.createAlert({
        device_id: deviceId,
        sensor_id: sensor.sensor_id,
        alert_type: alertType,
        amessage: message,
        status: 'pending'
      });
      
      logger.info('Alert created successfully');
    } catch (error) {
      logger.error(`Error creating alert: ${error.message}`);
    }
  }
  
  // Get all active alert configurations
  async getAllActiveConfigs() {
    try {
      const query = `
        SELECT config_id, user_id, sensor_type, min_value, max_value, is_active
        FROM alert_config
        WHERE is_active = true
      `;
      
      const result = await db.query(query);
      logger.info(`Found ${result.rows.length} active alert configurations`);
      return result.rows;
    } catch (error) {
      logger.error(`Error getting active alert configurations: ${error.message}`);
      throw new Error(`Error getting active alert configurations: ${error.message}`);
    }
  }
}

module.exports = new AlertMonitorService();