const cron = require('node-cron');
const SensorModel = require('../models/sensorModel');
const AlertConfigModel = require('../models/alertConfigModel');
const AlertModel = require('../models/alertModel');
const DeviceModel = require('../models/deviceModel');
const logger = require('../utils/logger');

class AlertMonitorService {
  constructor() {
    this.isRunning = false;
    this.checkInterval = '*/1 * * * *'; // Mỗi 1 phút
    this.lastCheckedValues = {}; // Lưu các giá trị trước đó
  }

  start() {
    if (this.isRunning) {
      logger.info('Alert monitor service is already running');
      return;
    }

    // Lên lịch kiểm tra mỗi phút
    this.job = cron.schedule(this.checkInterval, async () => {
      try {
        await this.checkThresholds();
      } catch (error) {
        logger.error(`Error checking alert thresholds: ${error.message}`);
      }
    });

    this.isRunning = true;
    logger.info('Alert monitor service started successfully');
  }

  stop() {
    if (this.job) {
      this.job.stop();
      this.isRunning = false;
      logger.info('Alert monitor service stopped');
    }
  }

  async checkThresholds() {
    logger.info('Checking sensor values against alert thresholds');

    try {
      // Lấy tất cả cấu hình cảnh báo đang hoạt động
      const allConfigs = await AlertConfigModel.getAllActiveConfigs();
      if (!allConfigs || allConfigs.length === 0) {
        logger.info('No active alert configurations found');
        return;
      }

      // Nhóm cấu hình theo loại cảm biến
      const configsByType = {};
      allConfigs.forEach(config => {
        if (!configsByType[config.sensor_type]) {
          configsByType[config.sensor_type] = [];
        }
        configsByType[config.sensor_type].push(config);
      });

      // Lấy tất cả cảm biến
      const sensors = await SensorModel.getAllSensors();
      
      // Kiểm tra từng cảm biến
      for (const sensor of sensors) {
        // Bỏ qua cảm biến không có cấu hình cảnh báo
        if (!configsByType[sensor.sensor_type]) {
          continue;
        }

        // Lấy giá trị mới nhất
        const latestData = await SensorModel.getLatestSensorData(sensor.sensor_id);
        if (!latestData) {
          continue;
        }

        const sensorValue = parseFloat(latestData.svalue);
        const sensorKey = `${sensor.sensor_id}`;
        const previousValue = this.lastCheckedValues[sensorKey];
        
        // Lưu giá trị hiện tại cho lần kiểm tra tiếp theo
        this.lastCheckedValues[sensorKey] = sensorValue;

        // Xác định thiết bị liên quan đến cảm biến này
        const deviceId = await this.findDeviceForSensor(sensor.sensor_id);
        if (!deviceId) {
          logger.warn(`No device found for sensor ${sensor.sensor_id}`);
          continue;
        }

        // Kiểm tra từng cấu hình cảnh báo cho loại cảm biến này
        for (const config of configsByType[sensor.sensor_type]) {
          // Chỉ tạo cảnh báo nếu thay đổi trạng thái từ bình thường sang vượt ngưỡng
          // hoặc từ vượt ngưỡng này sang vượt ngưỡng khác
          if (previousValue !== undefined) {
            // Kiểm tra ngưỡng dưới
            if (sensorValue < config.min_value && (previousValue >= config.min_value || previousValue < config.min_value && previousValue > config.max_value)) {
              await this.createAlert(deviceId, sensor, 'Low', sensorValue, config.min_value);
            }
            // Kiểm tra ngưỡng trên
            else if (sensorValue > config.max_value && (previousValue <= config.max_value || previousValue > config.max_value && previousValue < config.min_value)) {
              await this.createAlert(deviceId, sensor, 'High', sensorValue, config.max_value);
            }
          } else {
            // Lần đầu kiểm tra
            if (sensorValue < config.min_value) {
              await this.createAlert(deviceId, sensor, 'Low', sensorValue, config.min_value);
            } else if (sensorValue > config.max_value) {
              await this.createAlert(deviceId, sensor, 'High', sensorValue, config.max_value);
            }
          }
        }
      }
    } catch (error) {
      logger.error(`Error in checkThresholds: ${error.message}`);
      throw error;
    }
  }

  async findDeviceForSensor(sensorId) {
    try {
      // Tìm mối quan hệ giữa thiết bị và cảm biến trong bảng equipped_with
      const query = `
        SELECT device_id FROM equipped_with 
        WHERE sensor_id = $1 
        LIMIT 1
      `;
      const result = await db.query(query, [sensorId]);
      
      if (result.rows.length > 0) {
        return result.rows[0].device_id;
      }
      
      // Nếu không tìm thấy, trả về thiết bị mặc định (ví dụ: ID 1)
      return 1;
    } catch (error) {
      logger.error(`Error finding device for sensor: ${error.message}`);
      return 1; // Trả về ID mặc định trong trường hợp lỗi
    }
  }

  async createAlert(deviceId, sensor, levelType, currentValue, thresholdValue) {
    try {
      const alertType = `${levelType} ${sensor.sensor_type}`;
      const message = `${sensor.sensor_type} is ${levelType.toLowerCase()} at ${currentValue.toFixed(1)}${sensor.unit || ''} (threshold: ${thresholdValue}${sensor.unit || ''})`;
      
      logger.info(`Creating alert: ${message}`);
      
      await AlertModel.createAlert({
        device_id: deviceId,
        sensor_id: sensor.sensor_id,
        alert_type: alertType,
        amessage: message,
        status: 'pending'
      });
    } catch (error) {
      logger.error(`Error creating alert: ${error.message}`);
    }
  }
}

// Thêm phương thức vào AlertConfigModel để lấy tất cả cấu hình đang hoạt động
AlertConfigModel.getAllActiveConfigs = async function() {
  try {
    const query = `
      SELECT config_id, user_id, sensor_type, min_value, max_value, is_active
      FROM alert_config
      WHERE is_active = true
    `;
    
    const result = await db.query(query);
    return result.rows;
  } catch (error) {
    throw new Error(`Error getting active alert configurations: ${error.message}`);
  }
};

module.exports = new AlertMonitorService();