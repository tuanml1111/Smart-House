const AlertConfigModel = require('../models/alertConfigModel');
const db = require('../config/db');

// @desc    Get user's alert configurations
// @route   GET /api/alert-config
// @access  Private
exports.getAlertConfigs = async (req, res, next) => {
  try {
    console.log('Getting alert configs for user:', req.user.id);
    const userId = req.user.id;
    
    // Get configurations or initialize defaults if none exist
    let configs = await AlertConfigModel.getAlertConfig(userId);
    console.log(`Found ${configs.length} existing configurations`);
    
    if (configs.length === 0) {
      console.log('No configurations found, initializing defaults');
      configs = await AlertConfigModel.initializeDefaultConfigs(userId);
    }
    
    res.status(200).json({
      success: true,
      count: configs.length,
      data: configs
    });
  } catch (error) {
    console.error('Error in getAlertConfigs:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while getting alert configurations'
    });
  }
};

// @desc    Get single alert configuration
// @route   GET /api/alert-config/:id
// @access  Private
exports.getAlertConfig = async (req, res, next) => {
  try {
    const config = await AlertConfigModel.getAlertConfigById(req.params.id);
    
    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Alert configuration not found'
      });
    }
    
    // Check if the configuration belongs to the user
    if (config.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this configuration'
      });
    }
    
    res.status(200).json({
      success: true,
      data: config
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create alert configuration
// @route   POST /api/alert-config
// @access  Private
exports.createAlertConfig = async (req, res, next) => {
  try {
    const { sensor_type, min_value, max_value, is_active } = req.body;
    
    // Validate input
    if (!sensor_type || min_value === undefined || max_value === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide sensor_type, min_value, and max_value'
      });
    }
    
    // Allow only temperature and humidity sensor types
    if (sensor_type !== 'temperature' && sensor_type !== 'humidity') {
      return res.status(400).json({
        success: false,
        message: 'sensor_type must be either "temperature" or "humidity"'
      });
    }
    
    // Create configuration
    const config = await AlertConfigModel.createAlertConfig({
      user_id: req.user.id,
      sensor_type,
      min_value: parseFloat(min_value),
      max_value: parseFloat(max_value),
      is_active: is_active !== undefined ? is_active : true
    });
    
    res.status(201).json({
      success: true,
      data: config
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update alert configuration
// @route   PUT /api/alert-config/:id
// @access  Private
exports.updateAlertConfig = async (req, res, next) => {
  try {
    console.log('Updating alert config:', req.params.id, req.body);
    // Get the current configuration
    const currentConfig = await AlertConfigModel.getAlertConfigById(req.params.id);
    
    if (!currentConfig) {
      return res.status(404).json({
        success: false,
        message: 'Alert configuration not found'
      });
    }
    
    // Check if the configuration belongs to the user
    if (currentConfig.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this configuration'
      });
    }
    
    // Build update object
    const { min_value, max_value, isActive } = req.body;
    const updateData = {};
    
    if (min_value !== undefined) updateData.min_value = parseFloat(min_value);
    if (max_value !== undefined) updateData.max_value = parseFloat(max_value);
    
    // Đảm bảo isActive luôn là true nếu không được cung cấp
    updateData.is_active = true;
    
    // Update configuration
    const config = await AlertConfigModel.updateAlertConfig(req.params.id, updateData);
    
    res.status(200).json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Error in updateAlertConfig:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while updating alert configuration'
    });
  }
};

// @desc    Delete alert configuration
// @route   DELETE /api/alert-config/:id
// @access  Private
exports.deleteAlertConfig = async (req, res, next) => {
  try {
    // Get the current configuration
    const currentConfig = await AlertConfigModel.getAlertConfigById(req.params.id);
    
    if (!currentConfig) {
      return res.status(404).json({
        success: false,
        message: 'Alert configuration not found'
      });
    }
    
    // Check if the configuration belongs to the user
    if (currentConfig.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this configuration'
      });
    }
    
    await AlertConfigModel.deleteAlertConfig(req.params.id);
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset alert configurations to default
// @route   POST /api/alert-config/reset
// @access  Private
exports.resetAlertConfigs = async (req, res, next) => {
  try {
    console.log('Resetting alert configs for user:', req.user.id);
    const userId = req.user.id;
    
    // Delete existing configurations
    const query = 'DELETE FROM alert_config WHERE user_id = $1';
    await db.query(query, [userId]);
    console.log('Deleted existing configurations');
    
    // Initialize default configurations
    const configs = await AlertConfigModel.initializeDefaultConfigs(userId);
    console.log(`Created ${configs.length} default configurations`);
    
    res.status(200).json({
      success: true,
      message: 'Alert configurations reset to default',
      data: configs
    });
  } catch (error) {
    console.error('Error in resetAlertConfigs:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while resetting alert configurations'
    });
  }
}; 