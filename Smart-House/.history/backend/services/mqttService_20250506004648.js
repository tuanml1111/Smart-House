// backend/services/mqttService.js
const mqtt = require('mqtt');
const logger = require('../utils/logger');
require('dotenv').config();

class MQTTService {
  constructor() {
    // Kết nối đến broker MQTT local
    this.client = mqtt.connect(process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883');
    
    // Kết nối đến Adafruit IO
    this.adaClient = mqtt.connect('mqtts://io.adafruit.com', {
      username: process.env.ADA_USERNAME,
      password: process.env.ADAFRUIT_IO_KEY
    });
    
    this.client.on('connect', () => {
      logger.info('Connected to local MQTT broker');
      this.connected = true;
    });
    
    this.adaClient.on('connect', () => {
      logger.info('Connected to Adafruit IO MQTT broker');
    });
    
    this.client.on('error', (err) => {
      logger.error(`MQTT Local Error: ${err.message}`);
      this.connected = false;
    });
    
    this.adaClient.on('error', (err) => {
      logger.error(`Adafruit MQTT Error: ${err.message}`);
    });
  }
  
  connect() {
    if (!this.connected) {
      this.client = mqtt.connect(process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883');
      this.client.on('connect', () => {
        logger.info('Connected to MQTT broker');
        this.connected = true;
      });
    }
    return this.connected;
  }
  
  disconnect() {
    if (this.connected) {
      this.client.end();
      this.adaClient.end();
      logger.info('Disconnected from MQTT broker');
      this.connected = false;
    }
    return !this.connected;
  }
  
  publishMessage(topic, message) {
    if (this.connected) {
      this.client.publish(topic, message);
      logger.info(`MQTT message published - Topic: ${topic}`);
      
      // Kiểm tra nếu đây là thông tin điều khiển thiết bị
      try {
        const data = JSON.parse(message);
        if (data.device_id && data.status) {
          // Lấy thông tin thiết bị từ message
          const deviceType = topic.split('/')[2]; // Giả sử topic có dạng yolohome/devices/TYPE/control
          
          // Gửi trạng thái thiết bị lên Adafruit IO
          if (deviceType === 'fan' || deviceType === 'light') {
            const value = data.status === 'active' ? '1' : '0';
            const adaTopic = `${process.env.ADA_USERNAME}/feeds/${deviceType}`;
            this.adaClient.publish(adaTopic, value);
            logger.info(`Published to Adafruit IO - Topic: ${adaTopic}, Value: ${value}`);
          }
        }
      } catch (e) {
        // Không phải JSON hoặc không có cấu trúc mong đợi
        logger.warn(`Not a device control message: ${e.message}`);
      }
      
      return true;
    }
    logger.warn('MQTT not connected - message not published');
    return false;
  }
  
  subscribe(topic) {
    if (this.connected) {
      this.client.subscribe(topic);
      logger.info(`Subscribed to MQTT topic: ${topic}`);
      return true;
    }
    logger.warn('MQTT not connected - cannot subscribe');
    return false;
  }
  
  unsubscribe(topic) {
    if (this.connected) {
      this.client.unsubscribe(topic);
      logger.info(`Unsubscribed from MQTT topic: ${topic}`);
      return true;
    }
    logger.warn('MQTT not connected - cannot unsubscribe');
    return false;
  }
}

// Sử dụng Singleton pattern để đảm bảo chỉ có một instance
module.exports = new MQTTService();