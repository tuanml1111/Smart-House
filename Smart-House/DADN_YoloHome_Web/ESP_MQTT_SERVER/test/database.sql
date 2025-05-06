-- Bảng Users: Lưu thông tin người dùng
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username   VARCHAR(50) UNIQUE NOT NULL,
    user_password   VARCHAR(255) NOT NULL,
    email      VARCHAR(100) UNIQUE NOT NULL
);

-- Bảng Devices: Lưu thông tin thiết bị
CREATE TABLE device (
    device_id SERIAL PRIMARY KEY,
    device_name VARCHAR(100) NOT NULL,
    device_type VARCHAR(50) NOT NULL,
    dlocation    VARCHAR(100),
    status      VARCHAR(10) CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
    created_time  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Sensors: Lưu thông tin cảm biến (Mỗi thiết bị có nhiều cảm biến)
CREATE TABLE sensor (
    sensor_id SERIAL PRIMARY KEY,
    sensor_type VARCHAR(50) NOT NULL,
    model       VARCHAR(50),
    unit        VARCHAR(20),
    description TEXT
);

-- Bảng SensorData: Lưu dữ liệu đo từ cảm biến
CREATE TABLE sensor_data (
    data_id SERIAL PRIMARY KEY,
    sensor_id   INT NOT NULL,
    svalue       FLOAT NOT NULL,
    recorded_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sensor_id) REFERENCES sensor(sensor_id) ON DELETE CASCADE
);

-- Bảng ControlLogs: Lưu lịch sử điều khiển thiết bị
CREATE TABLE control_logs (
    log_id SERIAL PRIMARY KEY,
    user_id     INT NOT NULL,
    device_id   INT NOT NULL,
    cl_action      VARCHAR(50) NOT NULL,
    description TEXT,
    executed_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (device_id) REFERENCES device(device_id) ON DELETE CASCADE
);

-- Bảng Configurations: Thực thể yếu của Sensors (Lưu cấu hình)
CREATE TABLE configuration (
    config_id   INT NOT NULL,
    sensor_id   INT NOT NULL,  -- Thuộc về một cảm biến
    cparameter   VARCHAR(50) NOT NULL,
    cvalue       VARCHAR(50) NOT NULL,
    updated_time  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (config_id, sensor_id),
    FOREIGN KEY (sensor_id) REFERENCES sensor(sensor_id) ON DELETE CASCADE
);

-- Bảng Alerts: Lưu thông tin cảnh báo
CREATE TABLE alert (
    alert_id SERIAL PRIMARY KEY,
    device_id   INT NOT NULL,
    sensor_id   INT NOT NULL,
    alert_type  VARCHAR(50) NOT NULL,
    amessage     TEXT NOT NULL,
    alerted_time  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	status      VARCHAR(10) CHECK (status IN ('pending', 'resolved')) DEFAULT 'pending',
    FOREIGN KEY (device_id) REFERENCES device(device_id) ON DELETE CASCADE,
    FOREIGN KEY (sensor_id) REFERENCES sensor(sensor_id) ON DELETE CASCADE
);

-- Bảng control: Lưu thông tin thiết bị do người dùng điều khiển
CREATE TABLE control (
    user_id INT NOT NULL,
    device_id INT NOT NULL,
    PRIMARY KEY (user_id, device_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (device_id) REFERENCES device(device_id) ON DELETE CASCADE
);

-- Bảng equipped_with: Xác định thiết bị nào được trang bị cảm biến nào
CREATE TABLE equipped_with (
    device_id INT NOT NULL,
    sensor_id INT NOT NULL,
    PRIMARY KEY (device_id, sensor_id),
    FOREIGN KEY (device_id) REFERENCES device(device_id) ON DELETE CASCADE,
    FOREIGN KEY (sensor_id) REFERENCES sensor(sensor_id) ON DELETE CASCADE
);

CREATE TABLE device_logs (
    log_id SERIAL PRIMARY KEY,
    device_id INT REFERENCES device(device_id) ON DELETE CASCADE,
    FOREIGN KEY (log_id) REFERENCES control_logs(log_id) ON DELETE CASCADE
);

CREATE TABLE sensor_logs (
    log_id SERIAL PRIMARY KEY,
    sensor_id INT REFERENCES sensor(sensor_id) ON DELETE CASCADE,
    FOREIGN KEY (log_id) REFERENCES control_logs(log_id) ON DELETE CASCADE
);
INSERT INTO sensor (sensor_type, model, unit, description)
VALUES 
  ('airquality',    'AQ-1000', 'AQI', 'Cảm biến đo chất lượng không khí'),
  ('humidity',      'HM-2000', '%',   'Cảm biến đo độ ẩm không khí'),
  ('lightintensity','LI-3000', 'Lux', 'Cảm biến đo cường độ ánh sáng'),
  ('motion',        'MT-4000', NULL,  'Cảm biến phát hiện chuyển động'),
  ('pressure',      'PR-5000', 'Pa',  'Cảm biến đo áp suất không khí'),
  ('temperature',   'TP-6000', '°C',  'Cảm biến đo nhiệt độ');

