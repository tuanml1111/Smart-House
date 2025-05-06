// Chỗ này tui dùng để test data dạng json nên mn ko cần để ý =))))))))
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const socketIo = require('socket.io');

const app = express();
const port = process.env.PORT || 3000;

const ADA_USERNAME = process.env.ADA_USERNAME;
const ADAFRUIT_IO_KEY = process.env.ADAFRUIT_IO_KEY;

const headers = {
  'X-AIO-Key': ADAFRUIT_IO_KEY,
  'Content-Type': 'application/json'
};

const feeds = [
  'airquality',
  'humidity',
  'lightintensity',
  'motion',
  'pressure',
  'temperature'
];

async function fetchFeedData(feed) {
  const url = `https://io.adafruit.com/api/v2/${ADA_USERNAME}/feeds/${feed}/data?limit=1`;
  try {
    const response = await axios.get(url, { headers });
    return { feed, data: response.data };
  } catch (error) {
    console.error(`Lỗi khi lấy dữ liệu từ feed ${feed}:`, error.message);
    return { feed, data: [] };
  }
}

setInterval(async () => {
  console.log("=== Lấy dữ liệu từ các feeds ===");
  for (const feed of feeds) {
    const result = await fetchFeedData(feed);
    console.log(JSON.stringify(result, null, 2));

    io.emit('newData', result);
  }
}, 5000);

app.use(express.static('public'));

const server = app.listen(port, () => {
  console.log(`Server chạy tại http://localhost:${port}`);
});

const io = socketIo(server);
io.on('connection', (socket) => {
  console.log('Client kết nối');
  socket.on('disconnect', () => {
    console.log('Client ngắt kết nối');
  });
});
