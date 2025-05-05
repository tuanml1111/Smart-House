// backend/controllers/predictionController.js
const SensorModel = require('../models/sensorModel');

// Store predictions in memory for simplicity 
// (in production, you'd save to database)
let predictions = [];

exports.getPredictions = async (req, res, next) => {
  try {
    // Get the count parameter from query or default to 24
    const count = parseInt(req.query.count) || 24;
    
    // Return the latest predictions
    const latestPredictions = predictions.slice(-count);
    
    res.status(200).json({
      success: true,
      count: latestPredictions.length,
      data: latestPredictions
    });
  } catch (error) {
    next(error);
  }
};

exports.storePrediction = async (temperaturePrediction) => {
  try {
    // Get the latest actual temperature reading
    const tempSensor = await SensorModel.getSensorByType('temperature');
    let actualTemperature = null;
    
    if (tempSensor) {
      const latestReading = await SensorModel.getLatestSensorData(tempSensor.sensor_id);
      if (latestReading) {
        actualTemperature = parseFloat(latestReading.svalue);
      }
    }
    
    // Create prediction objects for each time point in the hour
    const hourPredictions = temperaturePrediction.hour_predictions.map(hourPred => {
      return {
        time: hourPred.predicted_time,
        predicted: hourPred.temperature,
        confidence: hourPred.confidence,
        actual: null, // Will be filled in later when we get the actual reading
        minutes_ahead: hourPred.minutes_ahead
      };
    });
    
    // Add current reading
    const currentReading = {
      time: temperaturePrediction.current_time,
      predicted: null, // No prediction for current time
      confidence: null,
      actual: actualTemperature
    };
    
    // Add to predictions array
    predictions.push(currentReading);
    predictions = predictions.concat(hourPredictions);
    
    // Keep only the latest 100 predictions
    if (predictions.length > 100) {
      predictions = predictions.slice(-100);
    }
    
    return hourPredictions;
  } catch (error) {
    console.error('Error storing prediction:', error);
    throw error;
  }
};