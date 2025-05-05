const db = require('../config/db');

class AlertModel {
  static async getAllAlerts(limit = 50, status = null) {
    try {
      let query = `
        SELECT a.alert_id, a.device_id, a.sensor_id, a.alert_type, a.amessage, a.alerted_time, a.status
        FROM alert a
        ORDER BY a.alerted_time DESC
      `;
      
      const values = [];
      
      if (status) {
        query = `
          SELECT a.alert_id, a.device_id, a.sensor_id, a.alert_type, a.amessage, a.alerted_time, a.status
          FROM alert a
          WHERE a.status = $1
          ORDER BY a.alerted_time DESC
        `;
        values.push(status);
      }
      
      if (limit) {
        query += ' LIMIT $' + (values.length + 1);
        values.push(limit);
      }
      
      console.log('Executing query:', query, 'with values:', values);
      const result = await db.query(query, values);
      console.log(`Retrieved ${result.rows.length} alerts`);
      return result.rows;
    } catch (error) {
      console.error(`Error getting alerts: ${error.message}`);
      throw new Error(`Error getting alerts: ${error.message}`);
    }
  }
  
  static async getAlertById(id) {
    try {
      const query = `
        SELECT a.alert_id, a.device_id, a.sensor_id, a.alert_type, a.amessage, a.alerted_time, a.status
        FROM alert a
        WHERE a.alert_id = $1
      `;
      
      const result = await db.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0];
    } catch (error) {
      console.error(`Error getting alert by ID: ${error.message}`);
      throw new Error(`Error getting alert by ID: ${error.message}`);
    }
  }
  
  static async createAlert(alertData) {
    try {
      console.log('Creating alert with data:', alertData);
      
      const query = `
        INSERT INTO alert (device_id, sensor_id, alert_type, amessage, status)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      
      const values = [
        alertData.device_id,
        alertData.sensor_id,
        alertData.alert_type,
        alertData.amessage,
        alertData.status || 'pending'
      ];
      
      console.log('Executing query with values:', values);
      const result = await db.query(query, values);
      console.log('Alert created:', result.rows[0]);
      return result.rows[0];
    } catch (error) {
      console.error(`Error creating alert: ${error.message}`);
      throw new Error(`Error creating alert: ${error.message}`);
    }
  }
  
  static async updateAlertStatus(id, status) {
    try {
      const query = `
        UPDATE alert
        SET status = $1
        WHERE alert_id = $2
        RETURNING *
      `;
      
      const result = await db.query(query, [status, id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error updating alert status: ${error.message}`);
    }
  }
  
  static async deleteAlert(id) {
    try {
      const query = 'DELETE FROM alert WHERE alert_id = $1 RETURNING alert_id';
      const result = await db.query(query, [id]);
      
      if (result.rows.length === 0) {
        return false;
      }
      
      return true;
    } catch (error) {
      throw new Error(`Error deleting alert: ${error.message}`);
    }
  }
  
  static async resolveAllAlerts() {
    try {
      const query = `
        UPDATE alert
        SET status = 'resolved'
        WHERE status = 'pending'
        RETURNING alert_id
      `;
      
      const result = await db.query(query);
      console.log(`Resolved ${result.rows.length} alerts`);
      return result.rows.length;
    } catch (error) {
      throw new Error(`Error resolving all alerts: ${error.message}`);
    }
  }
  
  // Get recent alerts for dashboard
  static async getRecentAlerts(limit = 5) {
    try {
      const query = `
        SELECT a.alert_id, a.device_id, a.sensor_id, a.alert_type, a.amessage, a.alerted_time, a.status
        FROM alert a
        ORDER BY a.alerted_time DESC
        LIMIT $1
      `;
      
      const result = await db.query(query, [limit]);
      return result.rows;
    } catch (error) {
      throw new Error(`Error getting recent alerts: ${error.message}`);
    }
  }
}

module.exports = AlertModel;