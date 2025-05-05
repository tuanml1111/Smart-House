const AlertModel = require('../models/alertModel');

// @desc    Get all alerts
// @route   GET /api/alerts
// @access  Private
exports.getAllAlerts = async (req, res, next) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 50;
    const status = req.query.status || null;
    
    console.log(`Getting alerts with limit: ${limit}, status: ${status}`);
    const alerts = await AlertModel.getAllAlerts(limit, status);
    
    res.status(200).json({
      success: true,
      count: alerts.length,
      data: alerts
    });
  } catch (error) {
    console.error('Error in getAllAlerts:', error);
    next(error);
  }
};

// @desc    Get recent alerts for dashboard
// @route   GET /api/alerts/recent
// @access  Private
exports.getRecentAlerts = async (req, res, next) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 5;
    
    console.log(`Getting ${limit} recent alerts for dashboard`);
    const alerts = await AlertModel.getRecentAlerts(limit);
    
    res.status(200).json({
      success: true,
      count: alerts.length,
      data: alerts
    });
  } catch (error) {
    console.error('Error in getRecentAlerts:', error);
    next(error);
  }
};

// @desc    Get single alert
// @route   GET /api/alerts/:id
// @access  Private
exports.getAlert = async (req, res, next) => {
  try {
    const alert = await AlertModel.getAlertById(req.params.id);
    
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: alert
    });
  } catch (error) {
    console.error('Error in getAlert:', error);
    next(error);
  }
};

// @desc    Create new alert
// @route   POST /api/alerts
// @access  Private
exports.createAlert = async (req, res, next) => {
  try {
    const { device_id, sensor_id, alert_type, amessage, status } = req.body;
    
    // Validate input
    if (!alert_type || !amessage) {
      return res.status(400).json({
        success: false,
        message: 'Please provide alert_type and amessage'
      });
    }
    
    // Create alert with whatever data is provided
    const alertData = {
      device_id,
      sensor_id,
      alert_type,
      amessage,
      status
    };
    
    console.log('Creating alert with data:', alertData);
    const alert = await AlertModel.createAlert(alertData);
    
    res.status(201).json({
      success: true,
      data: alert
    });
  } catch (error) {
    console.error('Error in createAlert:', error);
    next(error);
  }
};

// @desc    Update alert status
// @route   PUT /api/alerts/:id
// @access  Private
exports.updateAlertStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    
    // Validate input
    if (!status || (status !== 'pending' && status !== 'resolved')) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid status (pending or resolved)'
      });
    }
    
    // Update alert
    const alert = await AlertModel.updateAlertStatus(req.params.id, status);
    
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: alert
    });
  } catch (error) {
    console.error('Error in updateAlertStatus:', error);
    next(error);
  }
};

// @desc    Delete alert
// @route   DELETE /api/alerts/:id
// @access  Private
exports.deleteAlert = async (req, res, next) => {
  try {
    const success = await AlertModel.deleteAlert(req.params.id);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error in deleteAlert:', error);
    next(error);
  }
};

// @desc    Resolve all pending alerts
// @route   PUT /api/alerts/resolve-all
// @access  Private
exports.resolveAllAlerts = async (req, res, next) => {
  try {
    console.log('Resolving all pending alerts');
    const count = await AlertModel.resolveAllAlerts();
    
    res.status(200).json({
      success: true,
      count,
      message: `${count} alerts resolved`
    });
  } catch (error) {
    console.error('Error in resolveAllAlerts:', error);
    next(error);
  }
};