require('dotenv').config();
const mqtt = require('mqtt');
const MQTT_BROKER = process.env.MQTT_BROKER;
const client = mqtt.connect(MQTT_BROKER);

client.on('connect', () => {
  console.log('Connected to MQTT broker');
  client.subscribe('home/sensors/data', (err) => {
    if (err) {
      console.error("MQTT subscribe error:", err);
    }
  });
});

client.on('error', (error) => {
  console.error("MQTT Error:", error);
});

module.exports = client;
