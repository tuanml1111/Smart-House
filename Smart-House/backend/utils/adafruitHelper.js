const mqtt = require('mqtt');
const logger = require('./logger');

/**
 * Gửi trạng thái thiết bị lên Adafruit IO
 * @param {string} deviceType - Loại thiết bị (fan, light)
 * @param {string} status - Trạng thái (active/inactive)
 */
function sendDeviceStateToAdafruit(deviceType, status) {
  return new Promise((resolve, reject) => {
    try {
      // Chỉ gửi nếu là thiết bị được hỗ trợ
      if (['fan', 'light'].includes(deviceType.toLowerCase())) {
        // Kết nối đến Adafruit IO
        const adaClient = mqtt.connect('mqtts://io.adafruit.com', {
          username: process.env.ADA_USERNAME,
          password: process.env.ADAFRUIT_IO_KEY
        });
        
        adaClient.on('connect', () => {
          // Xác định giá trị dựa trên trạng thái
          const value = status === 'active' ? '1' : '0';
          const adaTopic = `${process.env.ADA_USERNAME}/feeds/${deviceType.toLowerCase()}`;
          
          logger.info(`Sending to Adafruit: ${deviceType} = ${value}`);
          
          // Publish và đóng kết nối sau khi hoàn thành
          adaClient.publish(adaTopic, value, (err) => {
            adaClient.end();
            
            if (err) {
              logger.error(`Error publishing to Adafruit: ${err.message}`);
              reject(err);
            } else {
              logger.info(`Successfully sent to Adafruit: ${deviceType} = ${value}`);
              resolve(true);
            }
          });
        });
        
        adaClient.on('error', (err) => {
          logger.error(`Adafruit connection error: ${err.message}`);
          reject(err);
        });
      } else {
        // Không phải thiết bị được hỗ trợ, vẫn trả về thành công
        resolve(false);
      }
    } catch (error) {
      logger.error(`Error in sendDeviceStateToAdafruit: ${error.message}`);
      reject(error);
    }
  });
}

module.exports = {
  sendDeviceStateToAdafruit
};