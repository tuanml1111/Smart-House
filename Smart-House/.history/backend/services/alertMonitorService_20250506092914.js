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
    this.activeAlerts = {}; // Track currently active alerts by sensor type and condition
    this.lastAlertedValues = {}; // Lưu giá trị khi cảnh báo được tạo cuối cùng
    this.lastAlertTimes = {}; // Lưu thời gian của cảnh báo cuối cùng
  }

  start() {
    if (this.isRunning) {
      logger.info('Alert monitor service is already running');
      return false;
    }

    // Clear any existing interval first
    if (this.job) {
      clearInterval(this.job);
      this.job = null;
    }

    // Check for alerts every minute
    this.job = setInterval(async () => {
      try {
        console.log(`[${new Date().toLocaleTimeString()}] Đang chạy kiểm tra cảnh báo định kỳ...`);
        await this.checkThresholds();
        console.log(`[${new Date().toLocaleTimeString()}] Kiểm tra cảnh báo hoàn tất`);
      } catch (error) {
        logger.error(`Error checking alert thresholds: ${error.message}`);
      }
    }, 60000); // 60000ms = 1 minute

    this.isRunning = true;
    logger.info('Alert monitor service started successfully');
    return true;
  }

  stop() {
    if (this.job) {
      clearInterval(this.job);
      this.job = null;
      this.isRunning = false;
      logger.info('Alert monitor service stopped');
    }
  }

  async checkThresholds() {
    logger.info('Checking sensor values against alert thresholds');
    console.log('========== ALERT CHECK STARTED ==========');
    console.log('Checking sensor values against alert thresholds at', new Date().toISOString());

    try {
      // Get all active alert configurations
      const allConfigs = await this.getAllActiveConfigs();
      if (!allConfigs || allConfigs.length === 0) {
        logger.info('No active alert configurations found');
        console.log('No active alert configurations found');
        console.log('========== ALERT CHECK COMPLETED (NO CONFIGS) ==========');
        return;
      }

      console.log(`Found ${allConfigs.length} active alert configurations`);
      allConfigs.forEach(config => {
        console.log(`Config: type=${config.sensor_type}, min=${config.min_value}, max=${config.max_value}, active=${config.is_active}`);
      });

      // Get all sensors
      const sensors = await SensorModel.getAllSensors();
      console.log(`Found ${sensors.length} sensors to check`);
      
      // Debug log all sensors
      sensors.forEach(sensor => {
        console.log(`Sensor: id=${sensor.sensor_id}, type=${sensor.sensor_type}`);
      });
      
      // Check each sensor
      for (const sensor of sensors) {
        console.log(`Checking sensor ${sensor.sensor_id} (${sensor.sensor_type})...`);
        
        // Get configs for this sensor type
        const configs = allConfigs.filter(config => 
          config.sensor_type.toLowerCase() === sensor.sensor_type.toLowerCase()
        );
        
        if (configs.length === 0) {
          console.log(`No configurations found for ${sensor.sensor_type} - skipping`);
          continue; // No configs for this sensor type
        }

        console.log(`Found ${configs.length} configurations for ${sensor.sensor_type}`);

        // Get latest sensor reading
        const latestData = await SensorModel.getLatestSensorData(sensor.sensor_id);
        if (!latestData) {
          console.log(`No data found for sensor ${sensor.sensor_id} - skipping`);
          continue;
        }

        const sensorValue = parseFloat(latestData.svalue);
        console.log(`Latest ${sensor.sensor_type} value: ${sensorValue}`);
        
        const sensorKey = `${sensor.sensor_id}`;
        const previousValue = this.lastCheckedValues[sensorKey];
        
        // Log if this is a new value
        if (previousValue !== undefined) {
          console.log(`Previous value was: ${previousValue}, changed: ${previousValue !== sensorValue}`);
        }
        
        // Check against each config for this sensor type
        for (const config of configs) {
          console.log(`Checking against config: min=${config.min_value}, max=${config.max_value}`);
          
          // Check if value exceeds high threshold
          if (sensorValue > config.max_value) {
            console.log(`HIGH THRESHOLD EXCEEDED: ${sensorValue} > ${config.max_value}`);
            const alertKey = `${sensor.sensor_id}_high`;
            
            // Xác định xem có nên tạo cảnh báo mới hay không
            const lastAlertedValue = this.lastAlertedValues[alertKey];
            const lastAlertTime = this.lastAlertTimes[alertKey] || 0;
            const currentTime = Date.now();
            
            // Tạo cảnh báo mới nếu:
            // 1. Chưa có cảnh báo nào cho điều kiện này trước đây
            // 2. Hoặc giá trị đã thay đổi ít nhất 1 đơn vị so với lần cảnh báo trước
            // 3. Hoặc đã qua ít nhất 1 giờ kể từ lần cảnh báo trước
            const valueChanged = !lastAlertedValue || Math.abs(sensorValue - lastAlertedValue) >= 1.0;
            const timeElapsed = (currentTime - lastAlertTime) >= 3600000; // 1 giờ = 3600000ms
            
            if (!this.activeAlerts[alertKey] || valueChanged || timeElapsed) {
              console.log(`Creating HIGH alert for ${sensor.sensor_type}: ${sensorValue} > ${config.max_value}`);
              console.log(`Reason: ${!this.activeAlerts[alertKey] ? 'No active alert' : valueChanged ? 'Value changed significantly' : 'Time elapsed'}`);
              
              const alert = await this.createAlert(sensor, 'High', sensorValue, config.max_value);
              if (alert) {
                // Cập nhật thông tin theo dõi
                this.activeAlerts[alertKey] = alert.alert_id;
                this.lastAlertedValues[alertKey] = sensorValue;
                this.lastAlertTimes[alertKey] = currentTime;
                console.log(`Alert created with ID: ${alert.alert_id}`);
              }
            } else {
              console.log(`Alert already active for ${sensor.sensor_type} HIGH threshold: ${this.activeAlerts[alertKey]}`);
              console.log(`Last alerted value: ${lastAlertedValue}, current: ${sensorValue}, time since last alert: ${Math.floor((currentTime - lastAlertTime) / 60000)} minutes`);
            }
          } else {
            console.log(`High threshold NOT exceeded: ${sensorValue} <= ${config.max_value}`);
            // Clear active high alert if value is back in range
            const alertKey = `${sensor.sensor_id}_high`;
            if (this.activeAlerts[alertKey]) {
              console.log(`Clearing active high alert marker: ${this.activeAlerts[alertKey]}`);
              delete this.activeAlerts[alertKey];
            }
          }
          
          // Check if value is below low threshold
          if (sensorValue < config.min_value) {
            console.log(`LOW THRESHOLD EXCEEDED: ${sensorValue} < ${config.min_value}`);
            const alertKey = `${sensor.sensor_id}_low`;
            
            // Xác định xem có nên tạo cảnh báo mới hay không - tương tự như trên
            const lastAlertedValue = this.lastAlertedValues[alertKey];
            const lastAlertTime = this.lastAlertTimes[alertKey] || 0;
            const currentTime = Date.now();
            
            const valueChanged = !lastAlertedValue || Math.abs(sensorValue - lastAlertedValue) >= 1.0;
            const timeElapsed = (currentTime - lastAlertTime) >= 3600000; // 1 giờ
            
            if (!this.activeAlerts[alertKey] || valueChanged || timeElapsed) {
              console.log(`Creating LOW alert for ${sensor.sensor_type}: ${sensorValue} < ${config.min_value}`);
              console.log(`Reason: ${!this.activeAlerts[alertKey] ? 'No active alert' : valueChanged ? 'Value changed significantly' : 'Time elapsed'}`);
              
              const alert = await this.createAlert(sensor, 'Low', sensorValue, config.min_value);
              if (alert) {
                // Cập nhật thông tin theo dõi
                this.activeAlerts[alertKey] = alert.alert_id;
                this.lastAlertedValues[alertKey] = sensorValue;
                this.lastAlertTimes[alertKey] = currentTime;
                console.log(`Alert created with ID: ${alert.alert_id}`);
              }
            } else {
              console.log(`Alert already active for ${sensor.sensor_type} LOW threshold: ${this.activeAlerts[alertKey]}`);
              console.log(`Last alerted value: ${lastAlertedValue}, current: ${sensorValue}, time since last alert: ${Math.floor((currentTime - lastAlertTime) / 60000)} minutes`);
            }
          } else {
            console.log(`Low threshold NOT exceeded: ${sensorValue} >= ${config.min_value}`);
            // Clear active low alert if value is back in range
            const alertKey = `${sensor.sensor_id}_low`;
            if (this.activeAlerts[alertKey]) {
              console.log(`Clearing active low alert marker: ${this.activeAlerts[alertKey]}`);
              delete this.activeAlerts[alertKey];
            }
          }
        }
        
        // Store the current value for next check
        this.lastCheckedValues[sensorKey] = sensorValue;
      }
      
      // Check for resolved alerts
      await this.checkForResolvedAlerts();
      console.log('========== ALERT CHECK COMPLETED ==========');
      
    } catch (error) {
      logger.error(`Error in checkThresholds: ${error.message}`);
      console.error(`Error in checkThresholds: ${error.message}`);
      console.error(error.stack);
      console.log('========== ALERT CHECK FAILED ==========');
      throw error;
    }
  }
  
  async checkForResolvedAlerts() {
    try {
      // Get all pending alerts
      const query = `
        SELECT a.alert_id, a.sensor_id, a.alert_type
        FROM alert a
        WHERE a.status = 'pending'
      `;
      
      const result = await db.query(query);
      console.log(`Checking ${result.rows.length} pending alerts for resolution`);
      
      for (const alert of result.rows) {
        // Extract if this is a high or low alert
        const isHighAlert = alert.alert_type.toLowerCase().includes('high');
        const alertKey = `${alert.sensor_id}_${isHighAlert ? 'high' : 'low'}`;
        
        // If alert is in DB but not in our active alerts map, mark it as resolved
        if (!this.activeAlerts[alertKey]) {
          logger.info(`Auto-resolving alert ID ${alert.alert_id} as condition is no longer active`);
          console.log(`Auto-resolving alert ID ${alert.alert_id} as condition is no longer active`);
          
          const updateQuery = `
            UPDATE alert
            SET status = 'resolved'
            WHERE alert_id = $1
          `;
          
          await db.query(updateQuery, [alert.alert_id]);
          
          // Xóa các biến theo dõi cảnh báo này
          delete this.lastAlertedValues[alertKey];
          delete this.lastAlertTimes[alertKey];
        }
      }
    } catch (error) {
      logger.error(`Error checking for resolved alerts: ${error.message}`);
      console.error(`Error checking for resolved alerts: ${error.message}`);
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
      return null;
    }
  }
  
  async testHumidityAlert(humidityValue) {
    try {
      console.log(`========== TESTING HUMIDITY ALERT: ${humidityValue} ==========`);
      
      // Get humidity sensor
      const sensors = await SensorModel.getAllSensors();
      const humiditySensor = sensors.find(s => s.sensor_type.toLowerCase() === 'humidity');
      
      if (!humiditySensor) {
        console.error('No humidity sensor found');
        return { success: false, message: 'No humidity sensor found' };
      }
      
      console.log(`Found humidity sensor with ID: ${humiditySensor.sensor_id}`);
      
      // Get humidity configurations
      const allConfigs = await this.getAllActiveConfigs();
      const humidityConfigs = allConfigs.filter(config => 
        config.sensor_type.toLowerCase() === 'humidity'
      );
      
      if (humidityConfigs.length === 0) {
        console.error('No humidity configurations found');
        return { success: false, message: 'No humidity configurations found' };
      }
      
      console.log(`Found ${humidityConfigs.length} humidity configurations`);
      
      // Force create a humidity alert
      for (const config of humidityConfigs) {
        console.log(`Testing against config: min=${config.min_value}, max=${config.max_value}`);
        
        let alertType, thresholdValue;
        let shouldAlert = false;
        
        // Check if value exceeds thresholds
        if (humidityValue > config.max_value) {
          alertType = 'High';
          thresholdValue = config.max_value;
          shouldAlert = true;
          console.log(`HIGH threshold exceeded: ${humidityValue} > ${config.max_value}`);
        } else if (humidityValue < config.min_value) {
          alertType = 'Low';
          thresholdValue = config.min_value;
          shouldAlert = true;
          console.log(`LOW threshold exceeded: ${humidityValue} < ${config.min_value}`);
        } else {
          console.log(`No thresholds exceeded: ${config.min_value} <= ${humidityValue} <= ${config.max_value}`);
        }
        
        if (shouldAlert) {
          console.log(`Creating test ${alertType} humidity alert for value: ${humidityValue}`);
          const alert = await this.createAlert(humiditySensor, alertType, humidityValue, thresholdValue);
          
          return { 
            success: true, 
            alertCreated: true, 
            alertId: alert.alert_id,
            message: `Created ${alertType} humidity alert for value: ${humidityValue}`
          };
        }
      }
      
      return { 
        success: true, 
        alertCreated: false, 
        message: 'No thresholds exceeded, no alert created' 
      };
    } catch (error) {
      console.error(`Error testing humidity alert: ${error.message}`);
      return { success: false, message: error.message };
    }
  }
}

module.exports = new AlertMonitorService();