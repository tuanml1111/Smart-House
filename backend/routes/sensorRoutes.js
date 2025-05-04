const express = require('express');
const router = express.Router();
const sensorController = require('../controllers/sensorController');
const authMiddleware = require('../middleware/authMiddleware');

// Protect all routes
router.use(authMiddleware.protect);

// Get all latest readings
router.get('/readings', sensorController.getAllLatestReadings);

// Sensor CRUD routes
router.route('/')
  .get(sensorController.getAllSensors)
  .post(sensorController.createSensor);

router.route('/:id')
  .get(sensorController.getSensor)
  .put(sensorController.updateSensor)
  .delete(sensorController.deleteSensor);

// Sensor data routes
router.get('/:id/data', sensorController.getSensorData);
router.get('/:id/latest', sensorController.getLatestSensorData);
router.post('/:id/data', sensorController.addSensorData);

module.exports = router;