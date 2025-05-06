// backend/controllers/predictionController.js
const SensorModel = require('../models/sensorModel');

// Lưu trữ dự đoán trong bộ nhớ cho đơn giản
// (trong sản phẩm thực tế, bạn nên lưu vào cơ sở dữ liệu)
const predictions = [];

exports.getPredictions = async (req, res, next) => {
  try {
    // Get the count parameter from query or default to 24
    const count = parseInt(req.query.count) || 24;
    
    // Nếu không có dự đoán, tạo dữ liệu mẫu
    if (predictions.length === 0) {
      console.log('Không tìm thấy dữ liệu dự đoán. Tạo dữ liệu mẫu.');
      await generateMockPredictions();
    }
    
    // Trả về các dự đoán mới nhất
    const latestPredictions = predictions.slice(-count);
    
    res.status(200).json({
      success: true,
      count: latestPredictions.length,
      data: latestPredictions
    });
  } catch (error) {
    console.error('Lỗi khi lấy dự đoán:', error);
    next(error);
  }
};

// Lưu dữ liệu dự đoán từ Python script
exports.storePrediction = async (temperaturePrediction) => {
  try {
    console.log('Đang lưu dữ liệu dự đoán:', temperaturePrediction);
    
    // Lấy dữ liệu nhiệt độ thực tế mới nhất
    const tempSensor = await SensorModel.getSensorByType('temperature');
    let actualTemperature = null;
    
    if (tempSensor) {
      const latestReading = await SensorModel.getLatestSensorData(tempSensor.sensor_id);
      if (latestReading) {
        actualTemperature = parseFloat(latestReading.svalue);
      }
    }
    
    // Tạo đối tượng dự đoán cho mỗi điểm thời gian trong giờ
    const hourPredictions = temperaturePrediction.hour_predictions.map(hourPred => {
      return {
        time: hourPred.predicted_time,
        predicted: hourPred.temperature,
        confidence: hourPred.confidence,
        actual: null, // Sẽ được điền sau khi có số đọc thực tế
        minutes_ahead: hourPred.minutes_ahead
      };
    });
    
    // Thêm đọc hiện tại
    const currentReading = {
      time: temperaturePrediction.current_time,
      predicted: null, // Không dự đoán cho thời gian hiện tại
      confidence: null,
      actual: actualTemperature || temperaturePrediction.current_temperature
    };
    
    // Thêm vào mảng dự đoán
    predictions.push(currentReading);
    hourPredictions.forEach(pred => predictions.push(pred));
    
    // Chỉ giữ 100 dự đoán mới nhất
    if (predictions.length > 100) {
      const startIdx = predictions.length - 100;
      predictions.splice(0, startIdx);
    }
    
    console.log(`Đã lưu ${hourPredictions.length + 1} dự đoán mới. Tổng số dự đoán: ${predictions.length}`);
    return hourPredictions;
  } catch (error) {
    console.error('Lỗi khi lưu dự đoán:', error);
    throw error;
  }
};

// Tạo dữ liệu dự đoán mẫu cho trường hợp không có dữ liệu thực
async function generateMockPredictions() {
  try {
    // Lấy nhiệt độ thực tế hiện tại nếu có
    let actualTemp = 37.0; // Giá trị mặc định
    const tempSensor = await SensorModel.getSensorByType('temperature');
    
    if (tempSensor) {
      const latestReading = await SensorModel.getLatestSensorData(tempSensor.sensor_id);
      if (latestReading) {
        actualTemp = parseFloat(latestReading.svalue);
      }
    }
    
    const now = new Date();
    
    // Đọc hiện tại
    predictions.push({
      time: now.toISOString(),
      predicted: null,
      confidence: null,
      actual: actualTemp
    });
    
    // Dự đoán cho các khoảng thời gian trong tương lai
    for (let i = 1; i <= 4; i++) {
      const futureTime = new Date(now.getTime() + i * 15 * 60000);
      // Dự đoán tương lai (dao động ±2°C)
      const tempChange = (Math.random() - 0.5) * 4;
      const predictedTemp = actualTemp + tempChange;
      
      predictions.push({
        time: futureTime.toISOString(),
        predicted: predictedTemp,
        confidence: 0.7 + Math.random() * 0.2, // Độ tin cậy ngẫu nhiên từ 0.7-0.9
        actual: null,
        minutes_ahead: i * 15
      });
    }
    
    console.log(`Đã tạo ${predictions.length} dự đoán mẫu`);
  } catch (error) {
    console.error('Lỗi khi tạo dữ liệu mẫu:', error);
  }
}