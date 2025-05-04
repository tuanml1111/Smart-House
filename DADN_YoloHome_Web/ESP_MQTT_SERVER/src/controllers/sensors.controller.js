const sensorService = require('../services/sensors.service');

exports.createSensorData = async (req, res, next) => {
  try {
    const sensor_data = await sensorService.createSensorData(req.body);
    res.status(200).json(sensor_data);
  } catch (error) {
    next(error);
  }
};

exports.getAllSensorData = async (req, res, next) => {
  try {
    const sensors_data = await sensorService.getAllSensorData();
    res.status(200).json(sensors_data);
  } catch (error) {
    next(error);
  }
};

exports.getSensorDataWithinRange = async (req, res, next) => {
  try {
    const sensors_data = await sensorService.getSensorDataWithinRange(req.body);
    res.status(200).json(sensors_data);
  } catch (error) {
    next(error);
  }
};

exports.getSensorDataById = async (req, res, next) => {
  try {
    const sensor_data = await sensorService.getSensorDataById(req.params.id);
    if (!sensor_data) {
      return res.status(404).json({ message: 'Sensor data not found' });
    }
    res.status(200).json(sensor_data);
  } catch (error) {
    next(error);
  }
};

exports.deleteSensorData = async (req, res, next) => {
  try {
    const sensor_data = await sensorService.deleteSensorData(req.params.id);
    res.status(200).json(sensor_data);
  } catch (error) {
    next(error);
  }
};
