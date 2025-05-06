// In your alertMonitorService.js

class AlertMonitorService {
  constructor() {
    this.isRunning = false;
    this.checkInterval = '*/1 * * * *'; // Check every minute
    this.lastCheckedValues = {}; // Store previous values
    this.activeAlerts = {}; // Track currently active alerts by sensor type and condition
  }

  // ... other methods remain the same ...

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
        const sensorKey = `${sensor.sensor_id}`;
        
        // Check against each config for this sensor type
        for (const config of configs) {
          // Check if value exceeds high threshold
          if (sensorValue > config.max_value) {
            const alertKey = `${sensor.sensor_id}_high`;
            
            // Only create alert if we don't already have an active one for this condition
            if (!this.activeAlerts[alertKey]) {
              console.log(`Creating high alert for ${sensor.sensor_type}: ${sensorValue} > ${config.max_value}`);
              const alert = await this.createAlert(sensor, 'High', sensorValue, config.max_value);
              if (alert) {
                // Mark this condition as having an active alert
                this.activeAlerts[alertKey] = alert.alert_id;
              }
            } else {
              console.log(`Alert already active for ${sensor.sensor_type} high threshold`);
            }
          } 
          // If value is back below threshold, clear the active alert marker
          else if (sensorValue <= config.max_value) {
            const alertKey = `${sensor.sensor_id}_high`;
            if (this.activeAlerts[alertKey]) {
              console.log(`Clearing active high alert marker for ${sensor.sensor_type}`);
              delete this.activeAlerts[alertKey];
            }
          }
          
          // Check if value is below low threshold
          if (sensorValue < config.min_value) {
            const alertKey = `${sensor.sensor_id}_low`;
            
            // Only create alert if we don't already have an active one for this condition
            if (!this.activeAlerts[alertKey]) {
              console.log(`Creating low alert for ${sensor.sensor_type}: ${sensorValue} < ${config.min_value}`);
              const alert = await this.createAlert(sensor, 'Low', sensorValue, config.min_value);
              if (alert) {
                // Mark this condition as having an active alert
                this.activeAlerts[alertKey] = alert.alert_id;
              }
            } else {
              console.log(`Alert already active for ${sensor.sensor_type} low threshold`);
            }
          }
          // If value is back above threshold, clear the active alert marker
          else if (sensorValue >= config.min_value) {
            const alertKey = `${sensor.sensor_id}_low`;
            if (this.activeAlerts[alertKey]) {
              console.log(`Clearing active low alert marker for ${sensor.sensor_type}`);
              delete this.activeAlerts[alertKey];
            }
          }
        }
        
        // Store the current value for next check
        this.lastCheckedValues[sensorKey] = sensorValue;
      }
      
      // Optionally check for resolved alerts
      await this.checkForResolvedAlerts();
      
    } catch (error) {
      logger.error(`Error in checkThresholds: ${error.message}`);
      throw error;
    }
  }
  
  // Optional: add this method to automatically resolve alerts when conditions return to normal
  async checkForResolvedAlerts() {
    try {
      // Get all pending alerts
      const query = `
        SELECT a.alert_id, a.sensor_id, a.alert_type
        FROM alert a
        WHERE a.status = 'pending'
      `;
      
      const result = await db.query(query);
      
      for (const alert of result.rows) {
        // Extract if this is a high or low alert
        const isHighAlert = alert.alert_type.toLowerCase().includes('high');
        const alertKey = `${alert.sensor_id}_${isHighAlert ? 'high' : 'low'}`;
        
        // If alert is in DB but not in our active alerts map, mark it as resolved
        if (!this.activeAlerts[alertKey]) {
          logger.info(`Auto-resolving alert ID ${alert.alert_id} as condition is no longer active`);
          
          const updateQuery = `
            UPDATE alert
            SET status = 'resolved'
            WHERE alert_id = $1
          `;
          
          await db.query(updateQuery, [alert.alert_id]);
        }
      }
    } catch (error) {
      logger.error(`Error checking for resolved alerts: ${error.message}`);
    }
  }

  // other methods remain the same...
}

module.exports = new AlertMonitorService();