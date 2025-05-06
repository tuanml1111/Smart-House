"""
YoloHome AI Module - Data Processor
==================================
Module xử lý và chuẩn bị dữ liệu cảm biến cho quá trình huấn luyện mô hình.
"""

import os
import logging
import pandas as pd
import numpy as np
from datetime import datetime
from sklearn.preprocessing import MinMaxScaler

# Cấu hình logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("data_processor.log", encoding="utf-8"),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger("data_processor")

class SensorDataProcessor:
    
    def __init__(self, data_path=None, db_config=None, filter_hours=24):
        
        self.data_path = data_path
        self.db_config = db_config
        self.filter_hours = filter_hours
        self.scaler_temp = MinMaxScaler()
        self.raw_data = None
        self.processed_data = None
        
    def load_data(self):
        if self.data_path and os.path.exists(self.data_path):
            logger.info(f"Đang tải dữ liệu từ CSV: {self.data_path}")
            self.raw_data = pd.read_csv(self.data_path)
            logger.info(f"Đã tải dữ liệu: {len(self.raw_data)} bản ghi")
            # Lọc dữ liệu chỉ lấy filter_hours gần nhất nếu có cột thời gian
            if 'recorded_time' in self.raw_data.columns:
                self.raw_data['recorded_time'] = pd.to_datetime(self.raw_data['recorded_time'])
                max_time = self.raw_data['recorded_time'].max()
                min_time = max_time - pd.Timedelta(hours=self.filter_hours)
                self.raw_data = self.raw_data[self.raw_data['recorded_time'] >= min_time]
                logger.info(f"Đã lọc dữ liệu {self.filter_hours} giờ gần nhất: {len(self.raw_data)} bản ghi")
                # Kiểm tra số lượng bản ghi sau khi lọc
                if len(self.raw_data) < 10:
                    logger.warning(f"Dữ liệu sau khi lọc còn quá ít ({len(self.raw_data)} bản ghi). Tiếp tục pipeline nhưng cần kiểm tra chất lượng dữ liệu đầu vào.")
            return True
            
        elif self.db_config:
            try:
                # Tham số kết nối sẽ lấy từ db_config
                import psycopg2
                from psycopg2 import sql
                
                logger.info("Đang kết nối đến cơ sở dữ liệu PostgreSQL")
                conn = psycopg2.connect(
                    user=self.db_config['user'],
                    password=self.db_config['password'],
                    host=self.db_config['host'],
                    port=self.db_config['port'],
                    database=self.db_config['database']
                )
                
                # Ví dụ truy vấn để lấy dữ liệu nhiệt độ và độ ẩm
                query = """
                SELECT s.recorded_time, sd1.svalue as temperature 
                FROM sensor_data sd1
                JOIN sensor s1 ON sd1.sensor_id = s1.sensor_id
                WHERE s1.sensor_type = 'Temperature'
                ORDER BY sd1.recorded_time DESC
                LIMIT 10000;
                """
                
                logger.info("Đang thực thi truy vấn")
                self.raw_data = pd.read_sql_query(query, conn)
                conn.close()
                logger.info(f"Đã tải dữ liệu: {len(self.raw_data)} bản ghi")
                return True
                
            except Exception as e:
                logger.error(f"Lỗi kết nối cơ sở dữ liệu: {str(e)}")
                return False
        else:
            logger.error("Không có nguồn dữ liệu được cung cấp")
            return False
    
    def preprocess_data(self):
        """
        Tiền xử lý dữ liệu cảm biến:
        1. Xử lý giá trị thiếu
        2. Chuyển timestamp sang định dạng datetime
        3. Thêm đặc trưng thời gian
        4. Thêm đặc trưng trễ (lag features)
        5. Loại bỏ giá trị trùng lặp
        6. Scale đặc trưng
        """
        if self.raw_data is None:
            logger.error("Chưa tải dữ liệu. Hãy gọi load_data() trước.")
            return False
            
        logger.info("Bắt đầu tiền xử lý dữ liệu")
        
        # Tạo bản sao để tránh thay đổi dữ liệu gốc
        df = self.raw_data.copy()
        
        # Đảm bảo timestamp ở định dạng datetime
        if 'recorded_time' in df.columns:
            df['recorded_time'] = pd.to_datetime(df['recorded_time'])
            # Sắp xếp theo timestamp
            df = df.sort_values('recorded_time')
        else:
            logger.warning("Không tìm thấy cột timestamp")
            
        # Xử lý giá trị thiếu với nội suy tuyến tính
        if df['temperature'].isna().any():
            logger.info("Xử lý giá trị thiếu bằng nội suy tuyến tính")
            df['temperature'] = df['temperature'].interpolate(method='linear')
            
        # Loại bỏ các outlier rõ ràng (giá trị nằm ngoài khả năng)
        logger.info("Loại bỏ outlier")
        df = df[(df['temperature'] >= -20) & (df['temperature'] <= 60)]
        
        # Thêm đặc trưng thời gian
        if 'recorded_time' in df.columns:
            logger.info("Thêm đặc trưng thời gian")
            df['hour'] = df['recorded_time'].dt.hour
            df['minute'] = df['recorded_time'].dt.minute
            df['day_of_week'] = df['recorded_time'].dt.dayofweek
            
            # Tạo chuyên mục thời gian trong ngày
            conditions = [
                (df['hour'] >= 5) & (df['hour'] < 12),
                (df['hour'] >= 12) & (df['hour'] < 17),
                (df['hour'] >= 17) & (df['hour'] < 21),
                (df['hour'] >= 21) | (df['hour'] < 5)
            ]
            categories = ['morning', 'afternoon', 'evening', 'night']
            df['time_of_day'] = pd.Categorical(
                np.select(conditions, categories, default='night'),
                categories=categories,
                ordered=True
            )
            
            # One-hot encode cho time of day
            time_dummies = pd.get_dummies(df['time_of_day'], prefix='time')
            df = pd.concat([df, time_dummies], axis=1)
        
        # Thêm đặc trưng trễ (t-1, t-2)
        logger.info("Tạo đặc trưng trễ")
        for lag in [1, 2, 3]:
            df[f'temp_lag_{lag}'] = df['temperature'].shift(lag)
            
        # Thêm đặc trưng chênh lệch
        df['temp_diff_1'] = df['temperature'].diff()
        df['temp_diff_2'] = df['temp_diff_1'].diff()
        
        # Loại bỏ các hàng có giá trị NaN (từ việc tạo đặc trưng trễ)
        df = df.dropna()
        
        # Loại bỏ các giá trị trùng lặp liên tiếp (nhiều hơn 3 lần)
        logger.info("Loại bỏ giá trị trùng lặp quá mức")
        df['temp_diff'] = df['temperature'].diff().abs()
        df['temp_unchanged'] = (df['temp_diff'] < 0.01).astype(int)
        df['temp_dup_count'] = df['temp_unchanged'].groupby(
            (df['temp_unchanged'] != df['temp_unchanged'].shift()).cumsum()
        ).cumsum()
        df = df[(df['temp_dup_count'] <= 3)]
        
        # Scale các đặc trưng số
        features_to_scale = ['temperature', 'temp_lag_1', 'temp_lag_2', 'temp_lag_3',
                           'temp_diff_1', 'temp_diff_2']
        logger.info("Scaling đặc trưng")
        for feature in features_to_scale:
            if feature.startswith('temp'):
                df[f'{feature}_scaled'] = self.scaler_temp.fit_transform(df[[feature]])
        # Loại bỏ các cột tính toán trung gian
        df = df.drop(['temp_diff', 'temp_unchanged', 'temp_dup_count'], axis=1)
        
        self.processed_data = df
        logger.info(f"Hoàn tất tiền xử lý. Kích thước dữ liệu: {df.shape}")
        return True
        
    def get_train_test_data(self, test_size=0.2, random_state=42):
        """
        Chia dữ liệu đã xử lý thành tập huấn luyện và kiểm tra.
        
        Args:
            test_size: Tỷ lệ dữ liệu dùng để kiểm tra
            random_state: Seed cho bộ tạo số ngẫu nhiên
            
        Returns:
            X_train, X_test, y_train_temp, y_test_temp, y_train_humid, y_test_humid
        """
        from sklearn.model_selection import train_test_split
        
        if self.processed_data is None:
            logger.error("Chưa có dữ liệu đã xử lý. Hãy gọi preprocess_data() trước.")
            return None
            
        logger.info(f"Chia dữ liệu với test_size={test_size}")
        
        # Đặc trưng cho dự đoán
        feature_cols = [
            'temp_lag_1_scaled', 'temp_lag_2_scaled', 'temp_lag_3_scaled',
            'humid_lag_1_scaled', 'humid_lag_2_scaled', 'humid_lag_3_scaled',
            'temp_diff_1_scaled', 'temp_diff_2_scaled',
            'humid_diff_1_scaled', 'humid_diff_2_scaled',
            'hour', 'day_of_week',
            'time_morning', 'time_afternoon', 'time_evening', 'time_night'
        ]
        
        # Chỉ sử dụng các cột đặc trưng có trong DataFrame
        available_features = [col for col in feature_cols if col in self.processed_data.columns]
        logger.info(f"Sử dụng {len(available_features)} đặc trưng: {available_features}")
        
        X = self.processed_data[available_features]
        y_temp = self.processed_data['temperature_scaled']
        
        X_train, X_test, y_train_temp, y_test_temp = train_test_split(
            X, y_temp, test_size=test_size, random_state=random_state
        )
        
        logger.info(f"Kích thước tập huấn luyện: {X_train.shape[0]}, tập kiểm tra: {X_test.shape[0]}")
        
        return X_train, X_test, y_train_temp, y_test_temp
    
    def save_processed_data(self, output_path='processed_sensor_data.csv'):
        """Lưu dữ liệu đã xử lý vào file CSV."""
        if self.processed_data is not None:
            logger.info(f"Lưu dữ liệu đã xử lý vào {output_path}")
            self.processed_data.to_csv(output_path, index=False)
            return True
        else:
            logger.error("Không có dữ liệu đã xử lý để lưu")
            return False

if __name__ == "__main__":
    # Ví dụ
    processor = SensorDataProcessor(data_path="sensor_data.csv", filter_hours=24)
    if processor.load_data():
        processor.preprocess_data()
        processor.save_processed_data()
        print("Đã xử lý và lưu dữ liệu thành công!")
    else:
        print("Không thể tải dữ liệu. Vui lòng kiểm tra đường dẫn hoặc kết nối cơ sở dữ liệu.")