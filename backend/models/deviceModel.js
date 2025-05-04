const db = require('../config/db');

class DeviceModel {
  static async getAllDevices() {
    try {
      const query = `
        SELECT d.device_id, d.device_name, d.device_type, d.dlocation, d.status, d.created_time
        FROM device d
        ORDER BY d.device_name
      `;
      
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      throw new Error(`Error getting all devices: ${error.message}`);
    }
  }
  
  static async getDeviceById(id) {
    try {
      const query = `
        SELECT d.device_id, d.device_name, d.device_type, d.dlocation, d.status, d.created_time
        FROM device d
        WHERE d.device_id = $1
      `;
      
      const result = await db.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error getting device by ID: ${error.message}`);
    }
  }
  
  static async createDevice(deviceData) {
    try {
      const query = `
        INSERT INTO device (device_name, device_type, dlocation, status)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
      
      const values = [
        deviceData.name,
        deviceData.type,
        deviceData.location,
        deviceData.status || 'inactive'
      ];
      
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error creating device: ${error.message}`);
    }
  }
  
  static async updateDevice(id, deviceData) {
    try {
      // Build the SET clause dynamically
      const setClause = Object.keys(deviceData)
        .map((key, index) => {
          // Map the JS property names to DB column names
          const columnMapping = {
            name: 'device_name',
            type: 'device_type',
            location: 'dlocation',
            status: 'status'
          };
          
          return `${columnMapping[key]} = $${index + 1}`;
        })
        .join(', ');
      
      // Build the query
      const query = `
        UPDATE device
        SET ${setClause}
        WHERE device_id = $${Object.keys(deviceData).length + 1}
        RETURNING *
      `;
      
      // Build the values array
      const values = [...Object.values(deviceData), id];
      
      const result = await db.query(query, values);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error updating device: ${error.message}`);
    }
  }
  
  static async deleteDevice(id) {
    try {
      const query = 'DELETE FROM device WHERE device_id = $1 RETURNING device_id';
      const result = await db.query(query, [id]);
      
      if (result.rows.length === 0) {
        return false;
      }
      
      return true;
    } catch (error) {
      throw new Error(`Error deleting device: ${error.message}`);
    }
  }
  
  static async getDevicesByType(type) {
    try {
      const query = `
        SELECT d.device_id, d.device_name, d.device_type, d.dlocation, d.status, d.created_time
        FROM device d
        WHERE d.device_type = $1
        ORDER BY d.device_name
      `;
      
      const result = await db.query(query, [type]);
      return result.rows;
    } catch (error) {
      throw new Error(`Error getting devices by type: ${error.message}`);
    }
  }
  
  static async getDeviceStatistics() {
    try {
      const query = `
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
          COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive
        FROM device
      `;
      
      const result = await db.query(query);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error getting device statistics: ${error.message}`);
    }
  }
}

module.exports = DeviceModel;