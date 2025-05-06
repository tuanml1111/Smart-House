const express = require('express');
const router = express.Router();
const alertConfigController = require('../controllers/alertConfigController');
const authMiddleware = require('../middleware/authMiddleware');

// Protect all routes
router.use(authMiddleware.protect);

// Reset configurations to default
router.post('/reset', alertConfigController.resetAlertConfigs);

// Alert configuration routes
router.route('/')
  .get(alertConfigController.getAlertConfigs)
  .post(alertConfigController.createAlertConfig);

router.route('/:id')
  .get(alertConfigController.getAlertConfig)
  .put(alertConfigController.updateAlertConfig)
  .delete(alertConfigController.deleteAlertConfig);

module.exports = router; 