import DeviceModel from '../models/DeviceModel';
import apiService from '../services/apiService';
import deviceService from '../services/deviceService';

class DeviceController {
  static async getAllDevices() {
    try {
      // Fetch devices from the API through deviceService
      const devices = await deviceService.getDevices();
      
      // Map backend properties to frontend model properties
      return devices.map(device => new DeviceModel({
        id: device.device_id,
        name: device.device_name,
        type: device.device_type,
        location: device.dlocation,
        status: device.status,
        lastUpdated: device.created_time || new Date().toISOString()
      }));
    } catch (error) {
      console.error('Error fetching devices:', error);
      throw error;
    }
  }
  
  static async getDeviceById(id) {
    try {
      // In a real application, we would fetch data from the API
      // For now, let's find the device from our mock data
      const devices = await this.getAllDevices();
      const device = devices.find(d => d.id === id);
      
      if (!device) {
        throw new Error('Device not found');
      }
      
      return device;
    } catch (error) {
      console.error(`Error fetching device with id ${id}:`, error);
      throw error;
    }
  }
  
  static async updateDeviceStatus(id, status) {
    try {
      // Call the API to update the device status
      const response = await apiService.put(`/devices/${id}`, { status });
      return new DeviceModel({
        id: response.data.device_id,
        name: response.data.device_name,
        type: response.data.device_type,
        location: response.data.dlocation,
        status: response.data.status,
        lastUpdated: response.data.created_time || new Date().toISOString()
      });
    } catch (error) {
      console.error(`Error updating device status for id ${id}:`, error);
      throw error;
    }
  }
  
  static async getDeviceStats() {
    try {
      // Fetch stats from the API
      const response = await apiService.get('/devices/stats');
      
      if (response.data && response.data.data) {
        return {
          total: parseInt(response.data.data.total) || 0,
          online: parseInt(response.data.data.online) || 0,
          offline: parseInt(response.data.data.offline) || 0
        };
      }
      
      // Fallback if response format is unexpected
      return {
        total: 0,
        online: 0,
        offline: 0
      };
    } catch (error) {
      console.error('Error fetching device stats:', error);
      // Fallback values
      return {
        total: 0,
        online: 0,
        offline: 0
      };
    }
  }
  
  static async toggleDeviceByType(deviceType) {
    try {
      // Call the API endpoint to toggle devices by type
      // Pass device_type instead of type to match backend expectations
      const response = await apiService.post('/devices/toggle-by-type', { device_type: deviceType });
      
      // Handle response data
      if (response.data) {
        return {
          success: response.data.success,
          devices: response.data.data ? response.data.data.map(device => new DeviceModel({
            id: device.device_id,
            name: device.device_name,
            type: device.device_type,
            location: device.dlocation,
            status: device.status,
            lastUpdated: device.created_time || new Date().toISOString()
          })) : []
        };
      }
      
      return {
        success: false,
        devices: []
      };
    } catch (error) {
      console.error(`Error toggling devices of type ${deviceType}:`, error);
      throw error;
    }
  }
}

export default DeviceController;