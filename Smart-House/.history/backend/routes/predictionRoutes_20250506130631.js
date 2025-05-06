// backend/routes/predictionRoutes.js
const express = require('express');
const router = express.Router();
const predictionController = require('../controllers/predictionController');
const authMiddleware = require('../middleware/authMiddleware');

// Get predictions
router.get('/',  predictionController.getPredictions);

module.exports = router;