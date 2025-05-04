const DeviceModel = require('../models/deviceModel');
const mqttService = require('../services/mqttService');
const adafruitHelper = require('../utils/adafruitHelper'); 

// @desc    Get all devices
// @route   GET /api/devices
// @access  Private
exports.getAllDevices = async (req, res, next) => {
  try {
    const devices = await DeviceModel.getAllDevices();
    
    res.status(200).json({
      success: true,
      count: devices.length,
      data: devices
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single device
// @route   GET /api/devices/:id
// @access  Private
exports.getDevice = async (req, res, next) => {
  try {
    const device = await DeviceModel.getDeviceById(req.params.id);
    
    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: device
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new device
// @route   POST /api/devices
// @access  Private
exports.createDevice = async (req, res, next) => {
  try {
    const { name, type, location, status } = req.body;
    
    // Validate input
    if (!name || !type) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name and type for the device'
      });
    }
    
    // Create device
    const device = await DeviceModel.createDevice({
      name,
      type,
      location,
      status: status || 'inactive'
    });
    
    res.status(201).json({
      success: true,
      data: device
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update device
// @route   PUT /api/devices/:id
// @access  Private
exports.updateDevice = async (req, res, next) => {
  try {
    const { name, type, location, status } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (type) updateData.type = type;
    if (location) updateData.location = location;
    if (status) updateData.status = status;
    
    // Update device
    const device = await DeviceModel.updateDevice(req.params.id, updateData);
    
    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }
    
    // Send MQTT message if status has changed
    if (updateData.status) {
      const topic = `yolohome/devices/${device.device_type}/control`;
      const message = JSON.stringify({
        device_id: device.device_id,
        status: device.status,
        timestamp: new Date().toISOString(),
        source: 'api'
      });
      
      mqttService.publishMessage(topic, message);
      
      // Thêm đoạn này để gửi lên Adafruit
      try {
        await adafruitHelper.sendDeviceStateToAdafruit(device.device_type, device.status);
      } catch (adaError) {
        console.error('Error sending to Adafruit:', adaError);
        // Không throw error để không ảnh hưởng đến luồng chính
      }
    }
    
    res.status(200).json({
      success: true,
      data: device
    });
  } catch (error) {
    next(error);
  }
};
  
  // @desc    Delete device
  // @route   DELETE /api/devices/:id
  // @access  Private
  exports.deleteDevice = async (req, res, next) => {
    try {
      const success = await DeviceModel.deleteDevice(req.params.id);
      
      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'Device not found'
        });
      }
      
      res.status(200).json({
        success: true,
        data: {}
      });
    } catch (error) {
      next(error);
    }
  };
  
  // @desc    Control device (turn on/off)
  // @route   POST /api/devices/:id/control
  // @access  Private
  // Trong hàm controlDevice
// Sửa đổi hàm controlDevice
exports.controlDevice = async (req, res, next) => {
  try {
    const { action } = req.body;
    
    // Validate input
    if (!action || (action !== 'ON' && action !== 'OFF')) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid action (ON or OFF)'
      });
    }
    
    // Get device
    const device = await DeviceModel.getDeviceById(req.params.id);
    
    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }
    
    // Update device status
    const status = action === 'ON' ? 'active' : 'inactive';
    const updatedDevice = await DeviceModel.updateDevice(req.params.id, { status });
    
    // Send MQTT message
    const topic = `yolohome/devices/${device.device_type}/control`;
    const message = JSON.stringify({
      device_id: device.device_id,
      action,
      status,
      timestamp: new Date().toISOString(),
      source: 'api'
    });
    
    mqttService.publishMessage(topic, message);
    
    // Thêm đoạn này để gửi lên Adafruit
    try {
      await adafruitHelper.sendDeviceStateToAdafruit(device.device_type, status);
    } catch (adaError) {
      console.error('Error sending to Adafruit:', adaError);
      // Không throw error để không ảnh hưởng đến luồng chính
    }
    
    res.status(200).json({
      success: true,
      data: updatedDevice
    });
  } catch (error) {
    next(error);
  }
};  
  
  // @desc    Get device statistics
  // @route   GET /api/devices/stats
  // @access  Private
  exports.getDeviceStats = async (req, res, next) => {
    try {
      const stats = await DeviceModel.getDeviceStatistics();
      
      res.status(200).json({
        success: true,
        data: {
          total: parseInt(stats.total),
          online: parseInt(stats.active),
          offline: parseInt(stats.inactive)
        }
      });
    } catch (error) {
      next(error);
    }
  };
  
  // @desc    Toggle devices by type
  // @route   POST /api/devices/toggle-by-type
  // @access  Private
  exports.toggleDevicesByType = async (req, res, next) => {
    try {
      const { type } = req.body;
      
      // Validate input
      if (!type) {
        return res.status(400).json({
          success: false,
          message: 'Please provide device type'
        });
      }
      
      // Get devices of the specified type
      const devices = await DeviceModel.getDevicesByType(type);
      
      if (devices.length === 0) {
        return res.status(404).json({
          success: false,
          message: `No devices found with type: ${type}`
        });
      }
      
      // Toggle each device
      const updatedDevices = [];
      
      for (const device of devices) {
        const newStatus = device.status === 'active' ? 'inactive' : 'active';
        const updatedDevice = await DeviceModel.updateDevice(device.device_id, { status: newStatus });
        updatedDevices.push(updatedDevice);
        
        // Send MQTT message
        const topic = `yolohome/devices/${device.device_id}/control`;
        const action = newStatus === 'active' ? 'ON' : 'OFF';
        const message = JSON.stringify({
          device_id: device.device_id,
          action,
          status: newStatus,
          timestamp: new Date().toISOString(),
          source: 'api'
        });
        
        mqttService.publishMessage(topic, message);
      }
      
      res.status(200).json({
        success: true,
        count: updatedDevices.length,
        data: updatedDevices
      });
    } catch (error) {
      next(error);
    }
  };