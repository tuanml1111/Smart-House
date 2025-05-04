import apiService from './apiService';

const deviceService = {
  // Get all devices
  async getDevices() {
    try {
      const response = await apiService.get('/devices');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching devices:', error);
      throw error;
    }
  },
  
  // Get device by ID
  async getDeviceById(id) {
    try {
      // In a real application, we would call the API
      const response = await apiService.get(`/devices/${id}`);
      return response.data.data;
      
    } catch (error) {
      console.error(`Error fetching device with ID ${id}:`, error);
      throw error;
    }
  },
  
  // Update device status
  async updateDeviceStatus(id, status) {
    try {
      // In a real application, we would call the API
      const response = await apiService.put(`/devices/${id}`, { status });
      return response.data.data;
      
    } catch (error) {
      console.error(`Error updating device status for ID ${id}:`, error);
      throw error;
    }
  },
  
  // Toggle device by type
  async toggleDevicesByType(type) {
    try {
      // In a real application, we would call the API
      const response = await apiService.post(`/devices/toggle-by-type`, { device_type: type });
      return response.data;
      
    } catch (error) {
      console.error(`Error toggling devices of type ${type}:`, error);
      throw error;
    }
  }
};

export default deviceService;