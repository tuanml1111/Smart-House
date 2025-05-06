const db = require('../config/db');

class AlertConfigModel {
  static async getAlertConfig(userId) {
    try {
      const query = `
        SELECT config_id, user_id, sensor_type, min_value, max_value, is_active, created_at, updated_at
        FROM alert_config
        WHERE user_id = $1
        ORDER BY sensor_type
      `;
      
      const result = await db.query(query, [userId]);
      return result.rows;
    } catch (error) {
      throw new Error(`Error getting alert configurations: ${error.message}`);
    }
  }
  
  static async getAlertConfigById(configId) {
    try {
      const query = `
        SELECT config_id, user_id, sensor_type, min_value, max_value, is_active, created_at, updated_at
        FROM alert_config
        WHERE config_id = $1
      `;
      
      const result = await db.query(query, [configId]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error getting alert configuration by ID: ${error.message}`);
    }
  }
  
  static async getAlertConfigByType(userId, sensorType) {
    try {
      const query = `
        SELECT config_id, user_id, sensor_type, min_value, max_value, is_active, created_at, updated_at
        FROM alert_config
        WHERE user_id = $1 AND sensor_type = $2
      `;
      
      const result = await db.query(query, [userId, sensorType]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error getting alert configuration by type: ${error.message}`);
    }
  }
  
  static async createAlertConfig(configData) {
    try {
      // Check if configuration already exists for this user and sensor type
      const existingConfig = await this.getAlertConfigByType(configData.user_id, configData.sensor_type);
      
      if (existingConfig) {
        // Update existing configuration
        return await this.updateAlertConfig(existingConfig.config_id, configData);
      }
      
      const query = `
        INSERT INTO alert_config (user_id, sensor_type, min_value, max_value, is_active)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      
      const values = [
        configData.user_id,
        configData.sensor_type,
        configData.min_value,
        configData.max_value,
        configData.is_active !== undefined ? configData.is_active : true
      ];
      
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error creating alert configuration: ${error.message}`);
    }
  }
  
  static async updateAlertConfig(configId, configData) {
    try {
      const fields = [];
      const values = [];
      let paramCount = 1;
      
      if (configData.min_value !== undefined) {
        fields.push(`min_value = $${paramCount}`);
        values.push(configData.min_value);
        paramCount++;
      }
      
      if (configData.max_value !== undefined) {
        fields.push(`max_value = $${paramCount}`);
        values.push(configData.max_value);
        paramCount++;
      }
      
      if (configData.is_active !== undefined) {
        fields.push(`is_active = $${paramCount}`);
        values.push(configData.is_active);
        paramCount++;
      }
      
      if (fields.length === 0) {
        throw new Error('No fields to update');
      }
      
      fields.push(`updated_at = CURRENT_TIMESTAMP`);
      
      const query = `
        UPDATE alert_config
        SET ${fields.join(', ')}
        WHERE config_id = $${paramCount}
        RETURNING *
      `;
      
      values.push(configId);
      
      const result = await db.query(query, values);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error updating alert configuration: ${error.message}`);
    }
  }
  
  static async deleteAlertConfig(configId) {
    try {
      const query = 'DELETE FROM alert_config WHERE config_id = $1 RETURNING config_id';
      const result = await db.query(query, [configId]);
      
      if (result.rows.length === 0) {
        return false;
      }
      
      return true;
    } catch (error) {
      throw new Error(`Error deleting alert configuration: ${error.message}`);
    }
  }
  
  static async initializeDefaultConfigs(userId) {
    try {
      // Delete any existing configurations first
      const deleteQuery = 'DELETE FROM alert_config WHERE user_id = $1';
      await db.query(deleteQuery, [userId]);
      
      console.log(`Initializing default configs for user ${userId}`);
      
      // Create default temperature config
      await this.createAlertConfig({
        user_id: userId,
        sensor_type: 'temperature',
        min_value: 18.0,
        max_value: 30.0,
        is_active: true
      });
      
      // Create default humidity config
      await this.createAlertConfig({
        user_id: userId,
        sensor_type: 'humidity',
        min_value: 30.0,
        max_value: 70.0,
        is_active: true
      });
      
      const configs = await this.getAlertConfig(userId);
      console.log(`Created ${configs.length} default configs`);
      return configs;
    } catch (error) {
      console.error(`Error initializing default configs: ${error.message}`);
      throw new Error(`Error initializing default configs: ${error.message}`);
    }
  }
}

module.exports = AlertConfigModel; 