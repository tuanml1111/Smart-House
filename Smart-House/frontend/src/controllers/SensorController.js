import apiService from '../services/apiService';

class SensorController {
  static async getLatestReadings() {
    try {
      console.log('Fetching latest sensor readings from API');
      const response = await apiService.get('/sensors/readings');
      
      if (response.data && response.data.data) {
        const data = response.data.data;
        console.log('API response data:', data);
        console.log('Data types - temperature:', typeof data.temperature, 
                    'humidity:', typeof data.humidity,
                    'motion:', typeof data.motion);
        
        return {
          // Đảm bảo là số trước khi định dạng
          temperature: (typeof data.temperature === 'number' ? data.temperature : parseFloat(data.temperature || 0)).toFixed(1),
          humidity: (typeof data.humidity === 'number' ? data.humidity : parseFloat(data.humidity || 0)).toFixed(1),
          motion: Boolean(data.motion)
        };
      }
      
      console.warn('API response structure:', JSON.stringify(response.data));
      throw new Error('Invalid data format received from API');
    } catch (error) {
      console.error('Error fetching sensor readings:', error);
      throw error;
    }
  }
  
  static async getSensorHistory(sensorType, timeRange = 'day') {
    try {
      // In a real application, we would fetch historical data from the API
      // For now, let's generate mock data
      const now = new Date();
      const data = [];
      
      // Generate mock data points
      if (timeRange === 'day') {
        // 24 hours, one point per hour
        for (let i = 23; i >= 0; i--) {
          const timestamp = new Date(now);
          timestamp.setHours(now.getHours() - i);
          
          let value;
          if (sensorType === 'temperature') {
            value = (Math.random() * 5 + 25).toFixed(1); // 25-30 degrees
          } else if (sensorType === 'humidity') {
            value = (Math.random() * 10 + 60).toFixed(1); // 60-70%
          } else {
            value = Math.random() > 0.8 ? 1 : 0; // Motion detected randomly
          }
          
          data.push({
            timestamp: timestamp.toISOString(),
            value: parseFloat(value)
          });
        }
      }
      
      return data;
    } catch (error) {
      console.error(`Error fetching ${sensorType} history:`, error);
      throw error;
    }
  }
  
  static async getRecentAlerts() {
    try {
      // Fetch real alerts from API
      const response = await apiService.get('/alerts/recent');
      
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        return response.data.data.map(alert => ({
          id: alert.alert_id,
          type: alert.alert_type.toLowerCase(),
          message: alert.amessage,
          timestamp: alert.alerted_time,
          status: alert.status
        }));
      }
      
      // Fallback to mock data if API fails or returns unexpected format
      return [
        {
          id: 1,
          type: 'temperature',
          message: 'Temperature exceeded 30°C',
          timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
          status: 'active'
        },
        {
          id: 2,
          type: 'motion',
          message: 'Motion detected in living room',
          timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
          status: 'active'
        },
        {
          id: 3,
          type: 'humidity',
          message: 'Humidity level below 30%',
          timestamp: new Date(Date.now() - 120 * 60000).toISOString(),
          status: 'resolved'
        }
      ];
    } catch (error) {
      console.error('Error fetching alerts:', error);
      // Fallback to mock data
      return [
        {
          id: 1,
          type: 'temperature',
          message: 'Temperature exceeded 30°C',
          timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
          status: 'active'
        },
        {
          id: 2,
          type: 'motion',
          message: 'Motion detected in living room',
          timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
          status: 'active'
        },
        {
          id: 3,
          type: 'humidity',
          message: 'Humidity level below 30%',
          timestamp: new Date(Date.now() - 120 * 60000).toISOString(),
          status: 'resolved'
        }
      ];
    }
  }
}

export default SensorController;