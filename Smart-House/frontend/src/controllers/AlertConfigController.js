import apiService from '../services/apiService';

class AlertConfigController {
  static async getAlertConfigs() {
    try {
      console.log('Fetching alert configurations');
      const response = await apiService.get('/alert-config');
      
      if (response.data && response.data.data) {
        console.log('Alert configurations fetched successfully:', response.data.data.length);
        return response.data.data.map(config => ({
          id: config.config_id,
          sensorType: config.sensor_type,
          minValue: parseFloat(config.min_value),
          maxValue: parseFloat(config.max_value),
          isActive: config.is_active
        }));
      }
      
      console.log('No alert configurations found in response');
      return [];
    } catch (error) {
      console.error('Error fetching alert configurations:', error);
      
      // Handle different error types
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        const message = error.response.data?.message || 'Lỗi máy chủ khi tải cấu hình cảnh báo';
        throw new Error(message);
      } else if (error.request) {
        // The request was made but no response was received
        throw new Error('Không thể kết nối tới máy chủ. Vui lòng thử lại sau.');
      } else {
        // Something happened in setting up the request that triggered an Error
        throw new Error(error.message || 'Đã xảy ra lỗi không xác định');
      }
    }
  }
  
  static async getAlertConfigById(id) {
    try {
      const response = await apiService.get(`/alert-config/${id}`);
      
      if (response.data && response.data.data) {
        const config = response.data.data;
        return {
          id: config.config_id,
          sensorType: config.sensor_type,
          minValue: parseFloat(config.min_value),
          maxValue: parseFloat(config.max_value),
          isActive: config.is_active
        };
      }
      
      throw new Error('Alert configuration not found');
    } catch (error) {
      console.error(`Error fetching alert configuration with id ${id}:`, error);
      throw error;
    }
  }
  
  static async createAlertConfig(configData) {
    try {
      const response = await apiService.post('/alert-config', {
        sensor_type: configData.sensorType,
        min_value: configData.minValue,
        max_value: configData.maxValue,
        is_active: configData.isActive !== undefined ? configData.isActive : true
      });
      
      if (response.data && response.data.data) {
        const config = response.data.data;
        return {
          id: config.config_id,
          sensorType: config.sensor_type,
          minValue: parseFloat(config.min_value),
          maxValue: parseFloat(config.max_value),
          isActive: config.is_active
        };
      }
      
      throw new Error('Failed to create alert configuration');
    } catch (error) {
      console.error('Error creating alert configuration:', error);
      throw error;
    }
  }
  
  static async updateAlertConfig(id, data) {
    try {
      console.log('Updating alert config:', id, data);
      // Định dạng lại dữ liệu để phù hợp với API
      const updateData = {};
      
      if (data.minValue !== undefined) updateData.min_value = parseFloat(data.minValue);
      if (data.maxValue !== undefined) updateData.max_value = parseFloat(data.maxValue);
      // Đảm bảo luôn luôn bật
      updateData.is_active = true;
      
      const response = await apiService.put(`/alert-config/${id}`, updateData);
      
      if (response.data && response.data.data) {
        console.log('Alert config updated successfully:', response.data.data);
        const config = response.data.data;
        return {
          id: config.config_id,
          sensorType: config.sensor_type,
          minValue: parseFloat(config.min_value),
          maxValue: parseFloat(config.max_value),
          isActive: config.is_active
        };
      }
      
      throw new Error('Không thể cập nhật cấu hình cảnh báo');
    } catch (error) {
      console.error('Error updating alert configuration:', error);
      
      if (error.response) {
        const message = error.response.data?.message || 'Lỗi máy chủ khi cập nhật cấu hình';
        throw new Error(message);
      } else if (error.request) {
        throw new Error('Không thể kết nối tới máy chủ. Vui lòng thử lại sau.');
      } else {
        throw new Error(error.message || 'Đã xảy ra lỗi không xác định');
      }
    }
  }
  
  static async deleteAlertConfig(id) {
    try {
      const response = await apiService.delete(`/alert-config/${id}`);
      
      if (response.data && response.data.success) {
        return true;
      }
      
      throw new Error('Failed to delete alert configuration');
    } catch (error) {
      console.error(`Error deleting alert configuration with id ${id}:`, error);
      throw error;
    }
  }
  
  static async resetAlertConfigs() {
    try {
      console.log('Attempting to reset alert configurations');
      const response = await apiService.post('/alert-config/reset');
      
      if (response.data && response.data.data) {
        console.log('Alert configurations reset successfully:', response.data.data.length);
        return response.data.data.map(config => ({
          id: config.config_id,
          sensorType: config.sensor_type,
          minValue: parseFloat(config.min_value),
          maxValue: parseFloat(config.max_value),
          isActive: config.is_active
        }));
      }
      
      if (response.data && response.data.message) {
        throw new Error(response.data.message);
      }
      
      throw new Error('Không thể khởi tạo cấu hình cảnh báo mặc định');
    } catch (error) {
      console.error('Error resetting alert configurations:', error);
      
      // Handle different error types
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        const message = error.response.data?.message || 'Lỗi máy chủ';
        throw new Error(message);
      } else if (error.request) {
        // The request was made but no response was received
        throw new Error('Không thể kết nối tới máy chủ. Vui lòng thử lại sau.');
      } else {
        // Something happened in setting up the request that triggered an Error
        throw new Error(error.message || 'Đã xảy ra lỗi không xác định');
      }
    }
  }
}

export default AlertConfigController; 