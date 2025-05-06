// fix-humidity.js
require('dotenv').config({ path: './config/.env' });
const SensorModel = require('./models/sensorModel');
const AlertModel = require('./models/alertModel');

async function suaCanhBaoDoAm() {
  console.log('Đang chạy script sửa cảnh báo độ ẩm...');
  
  try {
    // Lấy cảm biến độ ẩm
    const sensors = await SensorModel.getAllSensors();
    const humiditySensor = sensors.find(s => s.sensor_type.toLowerCase() === 'humidity');
    
    if (!humiditySensor) {
      console.error('Không tìm thấy cảm biến độ ẩm. Vui lòng tạo một cảm biến trước.');
      process.exit(1);
    }
    
    console.log(`Đã tìm thấy cảm biến độ ẩm với ID: ${humiditySensor.sensor_id}`);
    
    // Chèn giá trị độ ẩm cao (90%)
    console.log('Đang chèn giá trị độ ẩm cao (90%)...');
    const highReading = await SensorModel.insertSensorData(humiditySensor.sensor_id, 90.0);
    console.log('Giá trị độ ẩm cao đã được chèn:', highReading);
    
    // Tạo cảnh báo độ ẩm cao
    console.log('Đang tạo cảnh báo độ ẩm cao...');
    const alert = await AlertModel.createAlert({
      device_id: null,
      sensor_id: humiditySensor.sensor_id,
      alert_type: 'Độ ẩm cao',
      amessage: 'Độ ẩm cao ở mức 90.0% (ngưỡng: 70%)',
      status: 'pending'
    });
    
    console.log('Cảnh báo độ ẩm cao được tạo thành công:', alert);
    console.log('Vui lòng kiểm tra trang cảnh báo trong giao diện người dùng.');
    
    process.exit(0);
  } catch (error) {
    console.error('Lỗi trong script sửa cảnh báo độ ẩm:', error);
    process.exit(1);
  }
}

// Chạy hàm
suaCanhBaoDoAm();