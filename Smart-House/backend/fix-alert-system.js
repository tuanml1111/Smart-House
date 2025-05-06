// fix-alert-system.js
// This script checks and fixes issues with the alert system
// Run it with: node fix-alert-system.js

require('dotenv').config({ path: './config/.env' });
const db = require('./config/db');
const AlertModel = require('./models/alertModel');
const AlertConfigModel = require('./models/alertConfigModel');
const SensorModel = require('./models/sensorModel');
const DeviceModel = require('./models/deviceModel');

async function fixAlertSystem() {
  console.log('Starting alert system diagnostics and repair...');
  
  try {
    // 1. Check database connection
    await testDatabaseConnection();
    
    // 2. Check sensors table
    await checkSensors();
    
    // 3. Check alert_config table
    await checkAlertConfigs();
    
    // 4. Check equipped_with table
    await checkEquippedWith();
    
    // 5. Manually create some test data if needed
    await createTestData();
    
    console.log('\nAll checks completed. The alert system should now be working properly!');
  } catch (error) {
    console.error('Error during repair process:', error);
  } finally {
    process.exit(0);
  }
}

async function testDatabaseConnection() {
  console.log('\n--- Checking database connection ---');
  try {
    const result = await db.query('SELECT NOW()');
    console.log('Database connection successful:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    throw new Error('Database connection test failed.');
  }
}

async function checkSensors() {
  console.log('\n--- Checking sensors table ---');
  try {
    const sensors = await SensorModel.getAllSensors();
    console.log(`Found ${sensors.length} sensors in database.`);
    
    // Check for temperature and humidity sensors
    const tempSensor = sensors.find(s => s.sensor_type.toLowerCase() === 'temperature');
    const humiditySensor = sensors.find(s => s.sensor_type.toLowerCase() === 'humidity');
    
    if (!tempSensor) {
      console.log('Temperature sensor not found. Creating one...');
      const newTempSensor = await SensorModel.createSensor({
        type: 'temperature',
        model: 'TMP36',
        unit: '°C',
        description: 'Temperature sensor for room monitoring'
      });
      console.log('Temperature sensor created:', newTempSensor);
    } else {
      console.log('Temperature sensor exists:', tempSensor);
    }
    
    if (!humiditySensor) {
      console.log('Humidity sensor not found. Creating one...');
      const newHumiditySensor = await SensorModel.createSensor({
        type: 'humidity',
        model: 'DHT22',
        unit: '%',
        description: 'Humidity sensor for environment control'
      });
      console.log('Humidity sensor created:', newHumiditySensor);
    } else {
      console.log('Humidity sensor exists:', humiditySensor);
    }
    
    return true;
  } catch (error) {
    console.error('Error checking sensors:', error.message);
    throw new Error('Sensors check failed.');
  }
}

async function checkAlertConfigs() {
  console.log('\n--- Checking alert configurations ---');
  try {
    // Get all users
    const users = await getUsers();
    if (users.length === 0) {
      console.error('No users found in the database.');
      console.log('Creating a default admin user...');
      await createDefaultUser();
      users.push({ user_id: 1 });
    }
    
    // For each user, check if they have alert configurations
    for (const user of users) {
      console.log(`Checking alert configurations for user ${user.user_id}...`);
      
      // Since we don't have direct access to AlertConfigModel methods, we query the database directly
      const query = `
        SELECT config_id, user_id, sensor_type, min_value, max_value, is_active
        FROM alert_config
        WHERE user_id = $1
      `;
      
      const result = await db.query(query, [user.user_id]);
      console.log(`Found ${result.rows.length} alert configurations for user ${user.user_id}.`);
      
      // Check for temperature and humidity configurations
      const tempConfig = result.rows.find(c => c.sensor_type.toLowerCase() === 'temperature');
      const humidityConfig = result.rows.find(c => c.sensor_type.toLowerCase() === 'humidity');
      
      if (!tempConfig) {
        console.log('Temperature configuration not found. Creating one...');
        await createAlertConfig(user.user_id, 'temperature', 18.0, 30.0);
      } else {
        console.log('Temperature configuration exists:', tempConfig);
      }
      
      if (!humidityConfig) {
        console.log('Humidity configuration not found. Creating one...');
        await createAlertConfig(user.user_id, 'humidity', 30.0, 70.0);
      } else {
        console.log('Humidity configuration exists:', humidityConfig);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error checking alert configurations:', error.message);
    throw new Error('Alert configurations check failed.');
  }
}

async function checkEquippedWith() {
  console.log('\n--- Checking equipped_with table ---');
  try {
    // Get all sensors
    const sensors = await SensorModel.getAllSensors();
    
    // Get all devices
    const devices = await getDevices();
    if (devices.length === 0) {
      console.log('No devices found. Creating some default devices...');
      await createDefaultDevices();
    }
    
    // Check for each sensor if it has a relationship with a device
    for (const sensor of sensors) {
      const query = `
        SELECT device_id FROM equipped_with
        WHERE sensor_id = $1
      `;
      
      const result = await db.query(query, [sensor.sensor_id]);
      
      if (result.rows.length === 0) {
        console.log(`Sensor ${sensor.sensor_id} (${sensor.sensor_type}) is not equipped with any device. Creating a relationship...`);
        
        // Find a suitable device
        let deviceId = 1; // Default device ID
        
        if (sensor.sensor_type.toLowerCase() === 'temperature') {
          // Try to find a fan device
          const fanDevice = devices.find(d => d.device_type.toLowerCase() === 'fan');
          if (fanDevice) {
            deviceId = fanDevice.device_id;
          } else {
            console.log('No fan device found. Using default device ID 1.');
          }
        } else if (sensor.sensor_type.toLowerCase() === 'humidity') {
          // Try to find a light device
          const lightDevice = devices.find(d => d.device_type.toLowerCase() === 'light');
          if (lightDevice) {
            deviceId = lightDevice.device_id;
          } else {
            console.log('No light device found. Using default device ID 1.');
          }
        }
        
        // Create the relationship
        await createEquippedWith(deviceId, sensor.sensor_id);
      } else {
        console.log(`Sensor ${sensor.sensor_id} (${sensor.sensor_type}) is equipped with device ${result.rows[0].device_id}.`);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error checking equipped_with table:', error.message);
    throw new Error('Equipped_with check failed.');
  }
}

async function createTestData() {
  console.log('\n--- Creating test data ---');
  try {
    // Get sensors
    const sensors = await SensorModel.getAllSensors();
    
    // Create test data for each sensor
    for (const sensor of sensors) {
      console.log(`Creating test data for sensor ${sensor.sensor_id} (${sensor.sensor_type})...`);
      
      // Generate sensor value based on type
      let value;
      
      if (sensor.sensor_type.toLowerCase() === 'temperature') {
        // High temperature to trigger alert
        value = 35.0; // Assuming max threshold is 30.0
      } else if (sensor.sensor_type.toLowerCase() === 'humidity') {
        // Low humidity to trigger alert
        value = 25.0; // Assuming min threshold is 30.0
      } else {
        // Random value for other sensors
        value = Math.random() * 100;
      }
      
      // Insert sensor data
      await SensorModel.insertSensorData(sensor.sensor_id, value);
      console.log(`Created test data: sensor_id=${sensor.sensor_id}, value=${value}`);
      
      // Check thresholds and create alert if needed
      const thresholdExceeded = await SensorModel.checkSensorThresholds(sensor.sensor_id, value);
      
      if (thresholdExceeded.isExceeded) {
        console.log(`Threshold exceeded for sensor ${sensor.sensor_id}: ${value} ${thresholdExceeded.type === 'high' ? '>' : '<'} ${thresholdExceeded.threshold}`);
        
        // Find a device ID
        const query = `
          SELECT device_id FROM equipped_with
          WHERE sensor_id = $1
          LIMIT 1
        `;
        
        const result = await db.query(query, [sensor.sensor_id]);
        const deviceId = result.rows.length > 0 ? result.rows[0].device_id : 1;
        
        // Create an alert
        const alertType = `${thresholdExceeded.type === 'high' ? 'High' : 'Low'} ${sensor.sensor_type}`;
        const message = `${sensor.sensor_type} is ${thresholdExceeded.type} at ${value}${sensor.unit || ''} (threshold: ${thresholdExceeded.threshold}${sensor.unit || ''})`;
        
        const alert = await AlertModel.createAlert({
          device_id: deviceId,
          sensor_id: sensor.sensor_id,
          alert_type: alertType,
          amessage: message,
          status: 'pending'
        });
        
        console.log('Alert created successfully:', alert);
      } else {
        console.log(`No threshold exceeded for sensor ${sensor.sensor_id}.`);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error creating test data:', error.message);
    throw new Error('Test data creation failed.');
  }
}

// Helper functions

async function getUsers() {
  try {
    const query = 'SELECT user_id, username FROM users';
    const result = await db.query(query);
    return result.rows;
  } catch (error) {
    console.error('Error getting users:', error.message);
    return [];
  }
}

async function createDefaultUser() {
  try {
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('tuan', salt);
    
    const query = `
      INSERT INTO users (user_id, username, user_password, email)
      VALUES (1, 'admin', $1, 'admin@example.com')
      ON CONFLICT (user_id) DO NOTHING
      RETURNING user_id, username, email
    `;
    
    const result = await db.query(query, [hashedPassword]);
    console.log('Default user created:', result.rows[0]);
    return result.rows[0];
  } catch (error) {
    console.error('Error creating default user:', error.message);
    throw error;
  }
}

async function getDevices() {
  try {
    const query = 'SELECT device_id, device_name, device_type, dlocation, status FROM device';
    const result = await db.query(query);
    return result.rows;
  } catch (error) {
    console.error('Error getting devices:', error.message);
    return [];
  }
}

async function createDefaultDevices() {
  try {
    const query = `
      INSERT INTO device (device_name, device_type, dlocation, status)
      VALUES 
        ('Smart Fan', 'fan', 'Living Room', 'inactive'),
        ('Smart Light', 'light', 'Bedroom', 'inactive')
      RETURNING *
    `;
    
    const result = await db.query(query);
    console.log('Default devices created:', result.rows);
    return result.rows;
  } catch (error) {
    console.error('Error creating default devices:', error.message);
    throw error;
  }
}

async function createAlertConfig(userId, sensorType, minValue, maxValue) {
  try {
    const query = `
      INSERT INTO alert_config (user_id, sensor_type, min_value, max_value, is_active)
      VALUES ($1, $2, $3, $4, true)
      RETURNING *
    `;
    
    const result = await db.query(query, [userId, sensorType, minValue, maxValue]);
    console.log('Alert configuration created:', result.rows[0]);
    return result.rows[0];
  } catch (error) {
    console.error('Error creating alert configuration:', error.message);
    throw error;
  }
}

async function createEquippedWith(deviceId, sensorId) {
  try {
    const query = `
      INSERT INTO equipped_with (device_id, sensor_id)
      VALUES ($1, $2)
      ON CONFLICT (device_id, sensor_id) DO NOTHING
      RETURNING *
    `;
    
    const result = await db.query(query, [deviceId, sensorId]);
    console.log('Equipment relationship created:', result.rows[0]);
    return result.rows[0];
  } catch (error) {
    console.error('Error creating equipment relationship:', error.message);
    throw error;
  }
}

// Run the fix script
fixAlertSystem();