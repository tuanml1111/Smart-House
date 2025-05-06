require('dotenv').config();
const mqtt = require('mqtt');

// Kết nối đến Adafruit IO MQTT Broker
const client = mqtt.connect('mqtts://io.adafruit.com', {
  username: process.env.ADA_USERNAME,
  password: process.env.ADAFRUIT_IO_KEY
});

// Các thiết bị cần kiểm thử
const devices = [
  'fan',
  'light'
];

client.on('connect', () => {
  console.log('Đã kết nối đến Adafruit IO MQTT broker.');

  // Đầu tiên, thử gửi trạng thái OFF (0)
  devices.forEach(device => {
    const topic = `${process.env.ADA_USERNAME}/feeds/${device}`;
    client.publish(topic, '0', (err) => {
      if (err) {
        console.error(`Lỗi gửi trạng thái OFF đến ${device}:`, err.message);
      } else {
        console.log(`Đã gửi trạng thái OFF (0) đến ${device}`);
      }
    });
  });

  // Sau 5 giây, thử gửi trạng thái ON (1)
  setTimeout(() => {
    devices.forEach(device => {
      const topic = `${process.env.ADA_USERNAME}/feeds/${device}`;
      client.publish(topic, '1', (err) => {
        if (err) {
          console.error(`Lỗi gửi trạng thái ON đến ${device}:`, err.message);
        } else {
          console.log(`Đã gửi trạng thái ON (1) đến ${device}`);
        }
      });
    });

    // Sau 5 giây nữa, ngắt kết nối
    setTimeout(() => {
      client.end();
      console.log('Đã ngắt kết nối.');
    }, 5000);
  }, 5000);
});

client.on('error', (err) => {
  console.error('Lỗi kết nối:', err.message);
});