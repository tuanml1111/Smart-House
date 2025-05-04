const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');
const authMiddleware = require('../middleware/authMiddleware');

// Protect all routes
router.use(authMiddleware.protect);

// Resolve all alerts
router.put('/resolve-all', alertController.resolveAllAlerts);

// Alert CRUD routes
router.route('/')
  .get(alertController.getAllAlerts)
  .post(alertController.createAlert);

router.route('/:id')
  .get(alertController.getAlert)
  .put(alertController.updateAlertStatus)
  .delete(alertController.deleteAlert);

module.exports = router;