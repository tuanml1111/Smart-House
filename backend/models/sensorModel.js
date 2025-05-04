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
      return result.rows;
    } catch (error) {
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
      throw new Error(`Error getting sensor data: ${error.message}`);
    }
  }
  
  static async getLatestSensorData(sensorId) {
    try {
      // Thay đổi câu truy vấn để tránh lỗi cú pháp
      const query = `
        SELECT sd.data_id, sd.sensor_id, sd.svalue, sd.recorded_time
        FROM sensor_data sd
        WHERE sd.sensor_id = $1
        ORDER BY sd.recorded_time DESC
        LIMIT 1
      `;
      
      const result = await db.query(query, [sensorId]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      // Đảm bảo svalue luôn là số sau khi lấy dữ liệu
      const data = result.rows[0];
      if (data && data.svalue !== null && data.svalue !== undefined) {
        // Ép kiểu về số sau khi lấy dữ liệu từ database, không trong câu truy vấn
        data.svalue = parseFloat(data.svalue);
      }
      
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
      
      if (timestamp) {
        query = `
          INSERT INTO sensor_data (sensor_id, svalue, recorded_time)
          VALUES ($1, $2, $3)
          RETURNING *
        `;
        values = [sensorId, value, timestamp];
      } else {
        query = `
          INSERT INTO sensor_data (sensor_id, svalue)
          VALUES ($1, $2)
          RETURNING *
        `;
        values = [sensorId, value];
      }
      
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error inserting sensor data: ${error.message}`);
    }
  }
}

module.exports = SensorModel;