const express = require('express');
const router = express.Router();

const sensorRoutes = require('./sensors.route');

router.use('/sensor', sensorRoutes);

module.exports = router;
