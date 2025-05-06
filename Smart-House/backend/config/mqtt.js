const dotenv = require('dotenv');

// Load env vars
dotenv.config({ path: './config/.env' });

module.exports = {
  brokerUrl: process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883',
  clientId: `yolohome_server_${Math.random().toString(16).substr(2, 8)}`,
  connectOptions: {
    clean: true,
    connectTimeout: 4000,
    reconnectPeriod: 1000,
  },
  topics: {
    deviceControl: 'yolohome/devices/+/control',
    sensorData: 'yolohome/sensors/#',
    alerts: 'yolohome/alerts'
  }
};