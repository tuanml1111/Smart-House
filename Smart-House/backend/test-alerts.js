// generate-test-data.js
// This script generates test sensor data that will trigger alerts
// Run with: node generate-test-data.js

require('dotenv').config({ path: './config/.env' });
const SensorModel = require('./models/sensorModel');

// Mode options: 'normal', 'high-temp', 'low-temp', 'high-humidity', 'low-humidity', 'cycle'
const MODE = process.env.TEST_MODE || 'cycle';
const INTERVAL_MS = 10000; // 10 seconds between readings

async function generateTestData() {
  try {
    console.log('Starting test data generation in mode:', MODE);
    
    // Get sensors
    const sensors = await SensorModel.getAllSensors();
    const tempSensor = sensors.find(s => s.sensor_type.toLowerCase() === 'temperature');
    const humiditySensor = sensors.find(s => s.sensor_type.toLowerCase() === 'humidity');
    
    if (!tempSensor) {
      console.error('Temperature sensor not found!');
      process.exit(1);
    }
    
    if (!humiditySensor) {
      console.error('Humidity sensor not found!');
      process.exit(1);
    }
    
    console.log(`Found temperature sensor ID: ${tempSensor.sensor_id}`);
    console.log(`Found humidity sensor ID: ${humiditySensor.sensor_id}`);
    
    // Keep track of cycle counter for 'cycle' mode
    let cycleCounter = 0;
    
    // Generate data at regular intervals
    setInterval(async () => {
      try {
        let tempValue, humidityValue;
        
        // Determine values based on mode
        if (MODE === 'cycle') {
          // Cycle through different alert conditions
          cycleCounter = (cycleCounter + 1) % 5;
          switch (cycleCounter) {
            case 0: // Normal
              tempValue = 25.0;
              humidityValue = 50.0;
              break;
            case 1: // High temp
              tempValue = 35.0;
              humidityValue = 50.0;
              break;
            case 2: // Low temp
              tempValue = 15.0;
              humidityValue = 50.0;
              break;
            case 3: // High humidity
              tempValue = 25.0;
              humidityValue = 75.0;
              break;
            case 4: // Low humidity
              tempValue = 25.0;
              humidityValue = 25.0;
              break;
          }
        } else if (MODE === 'high-temp') {
          tempValue = 35.0;
          humidityValue = 50.0;
        } else if (MODE === 'low-temp') {
          tempValue = 15.0;
          humidityValue = 50.0;
        } else if (MODE === 'high-humidity') {
          tempValue = 25.0;
          humidityValue = 75.0;
        } else if (MODE === 'low-humidity') {
          tempValue = 25.0;
          humidityValue = 25.0;
        } else { // normal
          tempValue = 25.0;
          humidityValue = 50.0;
        }
        
        // Add some randomness to values
        tempValue += (Math.random() * 2 - 1); // +/- 1°C
        humidityValue += (Math.random() * 4 - 2); // +/- 2%
        
        // Insert sensor readings
        console.log(`Inserting temperature reading: ${tempValue.toFixed(1)}°C`);
        await SensorModel.insertSensorData(tempSensor.sensor_id, tempValue);
        
        console.log(`Inserting humidity reading: ${humidityValue.toFixed(1)}%`);
        await SensorModel.insertSensorData(humiditySensor.sensor_id, humidityValue);
        
        console.log('Test data generated successfully');
      } catch (error) {
        console.error('Error generating test data:', error);
      }
    }, INTERVAL_MS);
    
    console.log(`Test data will be generated every ${INTERVAL_MS/1000} seconds`);
    console.log('Press Ctrl+C to stop');
  } catch (error) {
    console.error('Error in data generation script:', error);
    process.exit(1);
  }
}

// Run the function
generateTestData();