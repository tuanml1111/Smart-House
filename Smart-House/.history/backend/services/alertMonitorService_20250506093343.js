const SensorModel = require('../models/sensorModel');
const AlertConfigModel = require('../models/alertConfigModel');
const AlertModel = require('../models/alertModel');
const db = require('../config/db');
const logger = require('../utils/logger');

class AlertMonitorService {
  constructor() {
    this.isRunning = false;
    this.checkInterval = '*/1 * * * *'; // Check every minute
    this.lastCheckedValues = {}; // Store previous values
  }

  start() {
    if (this.isRunning) {
      logger.info('Alert monitor service is already running');
      return;
    }

    // Check for alerts every minute
    this.job = setInterval(async () => {
      try {
        await this.checkThresholds();
      } catch (error) {
        logger.error(`Error checking alert thresholds: ${error.message}`);
      }
    }, 60000); // 60000ms = 1 minute

    this.isRunning = true;
    logger.info('Alert monitor service started successfully');
  }

  stop() {
    if (this.job) {
      clearInterval(this.job);
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

      // Get all sensors
      const sensors = await SensorModel.getAllSensors();
      
      // Check each sensor
      for (const sensor of sensors) {
        // Get configs for this sensor type
        const configs = allConfigs.filter(config => 
          config.sensor_type.toLowerCase() === sensor.sensor_type.toLowerCase()
        );
        
        if (configs.length === 0) {
          continue; // No configs for this sensor type
        }

        // Get latest sensor reading
        const latestData = await SensorModel.getLatestSensorData(sensor.sensor_id);
        if (!latestData) {
          continue;
        }

        const sensorValue = parseFloat(latestData.svalue);
        console.log(`Checking ${sensor.sensor_type}: Current value: ${sensorValue}`);
        
        // Check against each config for this sensor type
        for (const config of configs) {
          console.log(`Checking against threshold: min=${config.min_value}, max=${config.max_value}`);
          
          // Check if value exceeds threshold
          if (sensorValue > config.max_value) {
            console.log(`Alert threshold exceeded! ${sensorValue} > ${config.max_value}`);
            await this.createAlert(sensor, 'High', sensorValue, config.max_value);
          } else if (sensorValue < config.min_value) {
            console.log(`Alert threshold exceeded! ${sensorValue} < ${config.min_value}`);
            await this.createAlert(sensor, 'Low', sensorValue, config.min_value);
          }
        }
      }
    } catch (error) {
      logger.error(`Error in checkThresholds: ${error.message}`);
      throw error;
    }
  }

  async getAllActiveConfigs() {
    try {
      const query = `
        SELECT config_id, user_id, sensor_type, min_value, max_value, is_active
        FROM alert_config
        WHERE is_active = true
      `;
      
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      logger.error(`Error getting active alert configurations: ${error.message}`);
      return [];
    }
  }

  async createAlert(sensor, levelType, currentValue, thresholdValue) {
    try {
      const alertType = `${levelType} ${sensor.sensor_type}`;
      const message = `${sensor.sensor_type} is ${levelType.toLowerCase()} at ${currentValue.toFixed(1)}${sensor.unit || ''} (threshold: ${thresholdValue}${sensor.unit || ''})`;
      
      logger.info(`Creating alert: ${message}`);
      
      // Find a device associated with this sensor (if any)
      let deviceId = null;
      try {
        const deviceQuery = `
          SELECT device_id FROM equipped_with 
          WHERE sensor_id = $1 
          LIMIT 1
        `;
        const deviceResult = await db.query(deviceQuery, [sensor.sensor_id]);
        if (deviceResult.rows.length > 0) {
          deviceId = deviceResult.rows[0].device_id;
        }
      } catch (err) {
        logger.warn(`Could not find device for sensor ${sensor.sensor_id}: ${err.message}`);
      }
      
      // Create the alert
      const query = `
        INSERT INTO alert (device_id, sensor_id, alert_type, amessage, status)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      
      const values = [
        deviceId,
        sensor.sensor_id,
        alertType,
        message,
        'pending'
      ];
      
      const result = await db.query(query, values);
      logger.info(`Alert created with ID: ${result.rows[0].alert_id}`);
      
      return result.rows[0];
    } catch (error) {
      logger.error(`Error creating alert: ${error.message}`);
    }
  }
}

module.exports = new AlertMonitorService();