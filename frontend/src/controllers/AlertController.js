import apiService from '../services/apiService';

class AlertController {
  static async getAllAlerts(limit = 50, status = null) {
    try {
      console.log('Fetching alerts with params:', { limit, status });
      
      // Build query parameters
      let queryParams = '';
      if (limit) {
        queryParams += `limit=${limit}`;
      }
      if (status) {
        queryParams += queryParams ? `&status=${status}` : `status=${status}`;
      }
      
      const url = queryParams ? `/alerts?${queryParams}` : '/alerts';
      console.log('Requesting URL:', url);
      
      const response = await apiService.get(url);
      console.log('Alerts response:', response.data);
      
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
      console.log(`Updating alert ${id} status to ${status}`);
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
      console.log('Resolving all pending alerts');
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

  static async getRecentAlerts(limit = 5) {
    try {
      console.log(`Fetching ${limit} recent alerts`);
      const response = await apiService.get(`/alerts/recent?limit=${limit}`);
      
      if (response.data && response.data.data) {
        return response.data.data.map(alert => ({
          id: alert.alert_id,
          type: alert.alert_type.toLowerCase(),
          message: alert.amessage,
          timestamp: alert.alerted_time,
          status: alert.status
        }));
      }
      
      // If API returns no data, return empty array
      return [];
    } catch (error) {
      console.error('Error fetching recent alerts:', error);
      
      // Return empty array in case of error to prevent UI from breaking
      return [];
    }
  }
}

export default AlertController;