const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController');
const authMiddleware = require('../middleware/authMiddleware');

// Protect all routes
router.use(authMiddleware.protect);

// Device stats route
router.get('/stats', deviceController.getDeviceStats);

// Toggle devices by type
router.post('/toggle-by-type', deviceController.toggleDevicesByType);

// Device CRUD routes
router.route('/')
  .get(deviceController.getAllDevices)
  .post(deviceController.createDevice);

router.route('/:id')
  .get(deviceController.getDevice)
  .put(deviceController.updateDevice)
  .delete(deviceController.deleteDevice);

// Device control route
router.post('/:id/control', deviceController.controlDevice);

module.exports = router;