// Chỗ này dùng để fake data tuy nhiên nó lại không giống API feeds của ông Nguyên nên mn có thể dựa vào cấu trúc API để chỉnh sửa cho phù hợp
// Ở chỗ này có write data nên bắt buộc phải có ADA key, chủ yếu dùng để test real time data có hoạt động hoặc có lấy đúng dữ liệu không
// Note: có 1 số chú ý là mn nên ghi hoạt động của func mn làm để dễ dàng xử lý hơn chứ đọc hơi mệt :]
// :( ============== :| ============ :) ============= :))
require('dotenv').config();
const mqtt = require('mqtt');

const client = mqtt.connect('mqtts://io.adafruit.com', {
  username: process.env.ADA_USERNAME,
  password: process.env.ADAFRUIT_IO_KEY
});

const feeds = [
  'temperature',
  'humidity',
  // 'airquality',
  // 'lightintensity',
  // 'motion',
  // 'pressure'
];

client.on('connect', () => {
  console.log('Đã kết nối đến Adafruit IO MQTT broker.');

  setInterval(async () => {
    try {
      await Promise.all(
        feeds.map(feed => {
          return new Promise((resolve, reject) => {
            const value = Math.floor(Math.random() * 100) + 1;
            const topic = `${process.env.ADA_USERNAME}/feeds/dadn.${feed}`;
            client.publish(topic, value.toString(), (err) => {
              if (err) {
                console.error(`Lỗi gửi đến feed "${feed}":`, err.message);
                reject(err);
              } else {
                console.log(`Đã gửi đến feed "${feed}": ${value}`);
                resolve();
              }
            });
          });
        })
      );
      console.log('Đã gửi dữ liệu đến tất cả các feeds.');
    } catch (error) {
      console.error('Có lỗi khi gửi dữ liệu:', error);
    }
  }, 1000); // Mn chỉnh timer để thay đổi thời gian send fake data
});
