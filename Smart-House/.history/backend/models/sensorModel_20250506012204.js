const db = require('../config/db');

class SensorModel {
  static async getAllSensors() {
    try {
      const query = `
        SELECT s.sensor_id, s.sensor_type, s.model, s.unit, s.description
        FROM sensor s
        ORDER BY s.sensor_type
      `;
      
      const result = await db.query(query);
      console.log(`Found ${result.rows.length} sensors`);
      return result.rows;
    } catch (error) {
      console.error(`Error getting all sensors: ${error.message}`);
      throw new Error(`Error getting all sensors: ${error.message}`);
    }
  }
  
  static async getSensorById(id) {
    try {
      const query = `
        SELECT s.sensor_id, s.sensor_type, s.model, s.unit, s.description
        FROM sensor s
        WHERE s.sensor_id = $1
      `;
      
      const result = await db.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error getting sensor by ID: ${error.message}`);
    }
  }
  
  static async getSensorByType(type) {
    try {
      const query = `
        SELECT s.sensor_id, s.sensor_type, s.model, s.unit, s.description
        FROM sensor s
        WHERE LOWER(s.sensor_type) = LOWER($1)
        LIMIT 1
      `;
      
      const result = await db.query(query, [type]);
      
      if (result.rows.length === 0) {
        console.log(`No sensor found with type: ${type}`);
        return null;
      }
      
      return result.rows[0];
    } catch (error) {
      console.error(`Error getting sensor by type: ${error.message}`);
      throw new Error(`Error getting sensor by type: ${error.message}`);
    }
  }
  
  static async createSensor(sensorData) {
    try {
      const query = `
        INSERT INTO sensor (sensor_type, model, unit, description)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
      
      const values = [
        sensorData.type,
        sensorData.model,
        sensorData.unit,
        sensorData.description
      ];
      
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error creating sensor: ${error.message}`);
    }
  }
  
  static async updateSensor(id, sensorData) {
    try {
      // Build the SET clause dynamically
      const setClause = Object.keys(sensorData)
        .map((key, index) => {
          // Map the JS property names to DB column names
          const columnMapping = {
            type: 'sensor_type',
            model: 'model',
            unit: 'unit',
            description: 'description'
          };
          
          return `${columnMapping[key]} = $${index + 1}`;
        })
        .join(', ');
      
      // Build the query
      const query = `
        UPDATE sensor
        SET ${setClause}
        WHERE sensor_id = $${Object.keys(sensorData).length + 1}
        RETURNING *
      `;
      
      // Build the values array
      const values = [...Object.values(sensorData), id];
      
      const result = await db.query(query, values);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error updating sensor: ${error.message}`);
    }
  }
  
  static async deleteSensor(id) {
    try {
      const query = 'DELETE FROM sensor WHERE sensor_id = $1 RETURNING sensor_id';
      const result = await db.query(query, [id]);
      
      if (result.rows.length === 0) {
        return false;
      }
      
      return true;
    } catch (error) {
      throw new Error(`Error deleting sensor: ${error.message}`);
    }
  }
  
  static async getSensorData(sensorId, limit = 100) {
    try {
      const query = `
        SELECT sd.data_id, sd.sensor_id, sd.svalue, sd.recorded_time
        FROM sensor_data sd
        WHERE sd.sensor_id = $1
        ORDER BY sd.recorded_time DESC
        LIMIT $2
      `;
      
      const result = await db.query(query, [sensorId, limit]);
      return result.rows;
    } catch (error) {
      console.error(`Error getting sensor data: ${error.message}`);
      throw new Error(`Error getting sensor data: ${error.message}`);
    }
  }
  
  static async getLatestSensorData(sensorId) {
    try {
      console.log(`Getting latest data for sensor ID: ${sensorId}`);
      
      // Ensure that numerical values are properly formatted
      const query = `
        SELECT 
          sd.data_id, 
          sd.sensor_id, 
          CAST(sd.svalue AS FLOAT) AS svalue,
          sd.recorded_time
        FROM sensor_data sd
        WHERE sd.sensor_id = $1
        ORDER BY sd.recorded_time DESC
        LIMIT 1
      `;
      
      const result = await db.query(query, [sensorId]);
      
      if (result.rows.length === 0) {
        console.log(`No data found for sensor ID: ${sensorId}`);
        return null;
      }
      
      const data = result.rows[0];
      console.log(`Latest data for sensor ${sensorId}: ${data.svalue} (${typeof data.svalue})`);
      
      return data;
    } catch (error) {
      console.error(`Error getting latest sensor data: ${error.message}`);
      throw new Error(`Error getting latest sensor data: ${error.message}`);
    }
  }
  
  static async insertSensorData(sensorId, value, timestamp = null) {
    try {
      let query;
      let values;
      
      // Ensure value is a number
      const numericValue = parseFloat(value);
      
      if (isNaN(numericValue)) {
        throw new Error(`Invalid sensor value: ${value}`);
      }
      
      if (timestamp) {
        query = `
          INSERT INTO sensor_data (sensor_id, svalue, recorded_time)
          VALUES ($1, $2, $3)
          RETURNING *
        `;
        values = [sensorId, numericValue, timestamp];
      } else {
        query = `
          INSERT INTO sensor_data (sensor_id, svalue)
          VALUES ($1, $2)
          RETURNING *
        `;
        values = [sensorId, numericValue];
      }
      
      console.log(`Inserting sensor data: sensorId=${sensorId}, value=${numericValue}`);
      const result = await db.query(query, values);
      console.log(`Sensor data inserted successfully:`, result.rows[0]);
      
      // Không cần kiểm tra ngưỡng ở đây nữa vì database trigger sẽ tự động làm
      
      return result.rows[0];
      console.log(`Đã chèn dữ liệu cảm biến mới: sensorId=${sensorId}, value=${numericValue}`);
    
      // Kích hoạt kiểm tra cảnh báo ngay lập tức
      const alertMonitorService = require('../services/alertMonitorService');
      setTimeout(async () => {
        try {
          console.log(`Đang kiểm tra cảnh báo cho dữ liệu mới của cảm biến ${sensorId}...`);
          await alertMonitorService.checkThresholds();
          console.log(`Kiểm tra cảnh báo hoàn tất cho dữ liệu mới`);
        } catch (err) {
          console.error(`Lỗi kiểm tra cảnh báo: ${err.message}`);
        }
      }, 500); // Chờ 0.5 giây để dữ liệu được lưu hoàn tất
      
      return result.rows[0];
    } catch (error) {
      console.error(`Error inserting sensor data: ${error.message}`);
      throw new Error(`Error inserting sensor data: ${error.message}`);
    }
  }
  
  // Method to check if sensor value exceeds thresholds
  static async checkSensorThresholds(sensorId, value) {
    try {
      console.log(`Checking if sensor ${sensorId} value ${value} exceeds thresholds`);
      
      // Get sensor type
      const sensor = await this.getSensorById(sensorId);
      if (!sensor) {
        throw new Error(`Sensor with ID ${sensorId} not found`);
      }
      
      // Get alert configurations for this sensor type
      const query = `
        SELECT config_id, user_id, sensor_type, min_value, max_value
        FROM alert_config
        WHERE is_active = true AND LOWER(sensor_type) = LOWER($1)
      `;
      
      const result = await db.query(query, [sensor.sensor_type]);
      const configs = result.rows;
      
      console.log(`Found ${configs.length} alert configurations for sensor type ${sensor.sensor_type}`);
      
      const thresholdExceeded = {
        isExceeded: false,
        threshold: null,
        type: null, // 'high' or 'low'
        config: null
      };
      
      // Check each configuration
      for (const config of configs) {
        console.log(`Checking config min_value=${config.min_value}, max_value=${config.max_value}`);
        
        if (value < config.min_value) {
          console.log(`Low threshold exceeded: ${value} < ${config.min_value}`);
          thresholdExceeded.isExceeded = true;
          thresholdExceeded.threshold = config.min_value;
          thresholdExceeded.type = 'low';
          thresholdExceeded.config = config;
          break;
        } else if (value > config.max_value) {
          console.log(`High threshold exceeded: ${value} > ${config.max_value}`);
          thresholdExceeded.isExceeded = true;
          thresholdExceeded.threshold = config.max_value;
          thresholdExceeded.type = 'high';
          thresholdExceeded.config = config;
          break;
        }
      }
      
      return thresholdExceeded;
    } catch (error) {
      console.error(`Error checking sensor thresholds: ${error.message}`);
      throw new Error(`Error checking sensor thresholds: ${error.message}`);
    }
  }
}

module.exports = SensorModel;