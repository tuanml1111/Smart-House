const SensorModel = require('../models/sensorModel');
const predictionService = require('../services/predictionService');

// @desc    Get all sensors
// @route   GET /api/sensors
// @access  Private
exports.getAllSensors = async (req, res, next) => {
  try {
    const sensors = await SensorModel.getAllSensors();
    
    res.status(200).json({
      success: true,
      count: sensors.length,
      data: sensors
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single sensor
// @route   GET /api/sensors/:id
// @access  Private
exports.getSensor = async (req, res, next) => {
  try {
    const sensor = await SensorModel.getSensorById(req.params.id);
    
    if (!sensor) {
      return res.status(404).json({
        success: false,
        message: 'Sensor not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: sensor
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new sensor
// @route   POST /api/sensors
// @access  Private
exports.createSensor = async (req, res, next) => {
  try {
    const { type, model, unit, description } = req.body;
    
    // Validate input
    if (!type) {
      return res.status(400).json({
        success: false,
        message: 'Please provide type for the sensor'
      });
    }
    
    // Create sensor
    const sensor = await SensorModel.createSensor({
      type,
      model,
      unit,
      description
    });
    
    res.status(201).json({
      success: true,
      data: sensor
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update sensor
// @route   PUT /api/sensors/:id
// @access  Private
exports.updateSensor = async (req, res, next) => {
  try {
    const { type, model, unit, description } = req.body;
    
    const updateData = {};
    if (type) updateData.type = type;
    if (model) updateData.model = model;
    if (unit) updateData.unit = unit;
    if (description) updateData.description = description;
    
    // Update sensor
    const sensor = await SensorModel.updateSensor(req.params.id, updateData);
    
    if (!sensor) {
      return res.status(404).json({
        success: false,
        message: 'Sensor not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: sensor
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete sensor
// @route   DELETE /api/sensors/:id
// @access  Private
exports.deleteSensor = async (req, res, next) => {
  try {
    const success = await SensorModel.deleteSensor(req.params.id);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Sensor not found'
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

// @desc    Get sensor data
// @route   GET /api/sensors/:id/data
// @access  Private
exports.getSensorData = async (req, res, next) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 100;
    
    const data = await SensorModel.getSensorData(req.params.id, limit);
    
    res.status(200).json({
      success: true,
      count: data.length,
      data
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get latest sensor reading
// @route   GET /api/sensors/:id/latest
// @access  Private
exports.getLatestSensorData = async (req, res, next) => {
  try {
    const data = await SensorModel.getLatestSensorData(req.params.id);
    
    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'No data found for this sensor'
      });
    }
    
    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add sensor data
// @route   POST /api/sensors/:id/data
// @access  Private
exports.addSensorData = async (req, res, next) => {
  try {
    const { value, timestamp } = req.body;
    
    // Validate input
    if (value === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide value for the sensor data'
      });
    }
    
    // Add sensor data
    const data = await SensorModel.insertSensorData(req.params.id, value, timestamp);
    
    // If this is temperature data, run the prediction
    const sensor = await SensorModel.getSensorById(req.params.id);
    if (sensor && sensor.sensor_type === 'temperature') {
      // Run temperature prediction
      const prediction = await predictionService.predictTemperature(value);
      
      // Include prediction in response
      data.prediction = prediction;
    }
    
    res.status(201).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all latest sensor readings
// @route   GET /api/sensors/readings
// @access  Private
exports.getAllLatestReadings = async (req, res, next) => {
  try {
    console.log('Getting all latest sensor readings');
    
    // Get all sensors
    const sensors = await SensorModel.getAllSensors();
    console.log('Found sensors:', sensors.length);
    
    // Define default values with correct type (number, not string)
    const responseData = {
      temperature: 0.0,  // Explicitly using float
      humidity: 0.0,     // Explicitly using float
      motion: false
    };
    
    // Get latest reading for each sensor
    for (const sensor of sensors) {
      console.log(`Getting latest data for sensor ${sensor.sensor_id} (${sensor.sensor_type})`);
      const data = await SensorModel.getLatestSensorData(sensor.sensor_id);
      
      if (data) {
        console.log(`Found data for ${sensor.sensor_type}:`, data);
        
        // Chuyển đổi svalue thành số thực (float)
        const value = parseFloat(data.svalue);
        
        // Kiểm tra kiểu dữ liệu đã chuyển đổi
        console.log(`Converted ${sensor.sensor_type} value: ${value}, type: ${typeof value}`);
        
        if (!isNaN(value)) {  // Đảm bảo giá trị hợp lệ
          if (sensor.sensor_type.toLowerCase() === 'temperature') {
            responseData.temperature = value;  // Lưu dưới dạng số (không phải chuỗi)
          } else if (sensor.sensor_type.toLowerCase() === 'humidity') {
            responseData.humidity = value;     // Lưu dưới dạng số (không phải chuỗi)
          } else if (sensor.sensor_type.toLowerCase() === 'motion') {
            responseData.motion = value > 0;
          }
        }
      } else {
        console.log(`No data found for sensor ${sensor.sensor_id}`);
      }
    }
    
    console.log('Final response data (with types):', {
      temperature: `${responseData.temperature} (${typeof responseData.temperature})`,
      humidity: `${responseData.humidity} (${typeof responseData.humidity})`,
      motion: `${responseData.motion} (${typeof responseData.motion})`
    });
    
    res.status(200).json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Error getting sensor readings:', error);
    next(error);
  }
  exports.addManualSensorData = async (req, res, next) => {
    try {
      const { sensor_type, value } = req.body;
      
      // Validate input
      if (!sensor_type || value === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Please provide sensor_type and value'
        });
      }
      
      // Find sensor by type
      const sensor = await SensorModel.getSensorByType(sensor_type);
      if (!sensor) {
        return res.status(404).json({
          success: false,
          message: `Sensor with type ${sensor_type} not found`
        });
      }
      
      console.log(`Adding manual data for ${sensor_type}: ${value}`);
      
      // Insert sensor data (trigger will automatically check thresholds)
      const data = await SensorModel.insertSensorData(sensor.sensor_id, value);
      
      res.status(201).json({
        success: true,
        data: data,
        message: `${sensor_type} reading added successfully. Any threshold violations will automatically generate alerts.`
      });
    } catch (error) {
      console.error('Error adding manual sensor data:', error);
      next(error);
    }
  };
};