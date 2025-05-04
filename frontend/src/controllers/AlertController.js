import apiService from '../services/apiService';

class AlertController {
  static async getAllAlerts(limit = 50, status = null) {
    try {
      // Build query parameters
      let queryParams = '';
      if (limit) {
        queryParams += `limit=${limit}`;
      }
      if (status) {
        queryParams += queryParams ? `&status=${status}` : `status=${status}`;
      }
      
      const url = queryParams ? `/alerts?${queryParams}` : '/alerts';
      const response = await apiService.get(url);
      
      if (response.data && response.data.data) {
        return response.data.data.map(alert => ({
          id: alert.alert_id,
          deviceId: alert.device_id,
          sensorId: alert.sensor_id,
          type: alert.alert_type,
          message: alert.amessage,
          timestamp: alert.alerted_time,
          status: alert.status
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching alerts:', error);
      throw error;
    }
  }
  
  static async getAlertById(id) {
    try {
      const response = await apiService.get(`/alerts/${id}`);
      
      if (response.data && response.data.data) {
        const alert = response.data.data;
        return {
          id: alert.alert_id,
          deviceId: alert.device_id,
          sensorId: alert.sensor_id,
          type: alert.alert_type,
          message: alert.amessage,
          timestamp: alert.alerted_time,
          status: alert.status
        };
      }
      
      throw new Error('Alert not found');
    } catch (error) {
      console.error(`Error fetching alert with id ${id}:`, error);
      throw error;
    }
  }
  
  static async updateAlertStatus(id, status) {
    try {
      const response = await apiService.put(`/alerts/${id}`, { status });
      
      if (response.data && response.data.data) {
        const alert = response.data.data;
        return {
          id: alert.alert_id,
          deviceId: alert.device_id,
          sensorId: alert.sensor_id,
          type: alert.alert_type,
          message: alert.amessage,
          timestamp: alert.alerted_time,
          status: alert.status
        };
      }
      
      throw new Error('Failed to update alert status');
    } catch (error) {
      console.error(`Error updating alert status for id ${id}:`, error);
      throw error;
    }
  }
  
  static async resolveAllAlerts() {
    try {
      const response = await apiService.put('/alerts/resolve-all');
      
      if (response.data && response.data.success) {
        return {
          success: true,
          count: response.data.count,
          message: response.data.message
        };
      }
      
      throw new Error('Failed to resolve all alerts');
    } catch (error) {
      console.error('Error resolving all alerts:', error);
      throw error;
    }
  }
}

export default AlertController; 