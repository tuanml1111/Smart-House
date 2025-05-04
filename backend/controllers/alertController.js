const AlertModel = require('../models/alertModel');

// @desc    Get all alerts
// @route   GET /api/alerts
// @access  Private
exports.getAllAlerts = async (req, res, next) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 50;
    const status = req.query.status || null;
    
    const alerts = await AlertModel.getAllAlerts(limit, status);
    
    res.status(200).json({
      success: true,
      count: alerts.length,
      data: alerts
    });
  } catch (error) {
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
    if (!device_id || !sensor_id || !alert_type || !amessage) {
      return res.status(400).json({
        success: false,
        message: 'Please provide device_id, sensor_id, alert_type, and amessage'
      });
    }
    
    // Create alert
    const alert = await AlertModel.createAlert({
      device_id,
      sensor_id,
      alert_type,
      amessage,
      status
    });
    
    res.status(201).json({
      success: true,
      data: alert
    });
  } catch (error) {
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
    next(error);
  }
};

// @desc    Resolve all pending alerts
// @route   PUT /api/alerts/resolve-all
// @access  Private
exports.resolveAllAlerts = async (req, res, next) => {
  try {
    const count = await AlertModel.resolveAllAlerts();
    
    res.status(200).json({
      success: true,
      count,
      message: `${count} alerts resolved`
    });
  } catch (error) {
    next(error);
  }
};