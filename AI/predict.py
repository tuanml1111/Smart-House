#!/usr/bin/env python3
"""
YoloHome AI - Temperature Prediction Script
Sử dụng mô hình đã được huấn luyện từ dữ liệu data_from_export2.csv
để dự đoán nhiệt độ cho giờ tiếp theo
"""

import os
import sys
import json
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import joblib
import psycopg2
from psycopg2 import sql
from sklearn.ensemble import RandomForestRegressor

def get_latest_sensor_data():
    """Lấy dữ liệu cảm biến mới nhất từ PostgreSQL"""
    try:
        # Thông số kết nối database - cập nhật theo thông tin thực tế của bạn
        db_params = {
            'user': 'postgres',
            'password': 'tuan',
            'host': 'localhost',
            'port': '5432',
            'database': 'yolohome1'
        }
        
        conn = psycopg2.connect(**db_params)
        cursor = conn.cursor()
        
        # Truy vấn lấy dữ liệu nhiệt độ mới nhất
        query = """
        SELECT sd.recorded_time, sd.svalue
        FROM sensor_data sd
        JOIN sensor s ON sd.sensor_id = s.sensor_id
        WHERE s.sensor_type = 'temperature'
        ORDER BY sd.recorded_time DESC
        LIMIT 3
        """
        
        cursor.execute(query)
        rows = cursor.fetchall()
        
        # Xử lý dữ liệu
        if not rows or len(rows) < 1:
            print(json.dumps({
                "error": "Không đủ dữ liệu lịch sử",
                "temperature": 0,
                "confidence": 0
            }))
            return None
            
        # Lấy giá trị nhiệt độ mới nhất
        current_temperature = float(rows[0][1])
        current_time = rows[0][0]
        
        # Tạo thời gian hiện tại
        if isinstance(current_time, str):
            current_time = datetime.fromisoformat(current_time.replace('Z', '+00:00'))
        
        # Thời gian trong ngày
        hour = current_time.hour
        
        # Tạo thời gian trong ngày
        if 5 <= hour < 12:
            time_of_day = [1, 0, 0, 0]  # sáng
        elif 12 <= hour < 17:
            time_of_day = [0, 1, 0, 0]  # trưa
        elif 17 <= hour < 21:
            time_of_day = [0, 0, 1, 0]  # chiều
        else:
            time_of_day = [0, 0, 0, 1]  # tối
        
        cursor.close()
        conn.close()
        
        return {
            'current_time': current_time,
            'current_temperature': current_temperature,
            'hour': hour,
            'day_of_week': current_time.weekday(),
            'time_morning': time_of_day[0],
            'time_afternoon': time_of_day[1],
            'time_evening': time_of_day[2],
            'time_night': time_of_day[3]
        }
        
    except Exception as e:
        print(json.dumps({
            "error": str(e),
            "temperature": 0,
            "confidence": 0
        }))
        return None

def load_or_create_model():
    """Tải mô hình đã huấn luyện hoặc tạo mô hình mới từ tệp CSV mẫu"""
    try:
        # Đường dẫn đến thư mục dữ liệu
        current_dir = os.path.dirname(os.path.abspath(__file__))
        data_dir = os.path.join(current_dir, 'data')
        model_dir = os.path.join(data_dir, 'models')
        model_path = os.path.join(model_dir, 'temp_model.pkl')
        
        # Kiểm tra nếu mô hình đã tồn tại
        if os.path.exists(model_path):
            print("Đang tải mô hình đã huấn luyện...")
            return joblib.load(model_path)
        
        # Nếu không, tạo mô hình mới từ tệp CSV mẫu
        print("Tạo mô hình mới từ tệp CSV mẫu...")
        csv_path = os.path.join(data_dir, 'raw', 'temperature_data_from_export2.csv')
        
        if not os.path.exists(csv_path):
            raise FileNotFoundError(f"Không tìm thấy tệp dữ liệu: {csv_path}")
        
        # Đọc dữ liệu
        df = pd.read_csv(csv_path)
        
        # Xử lý dữ liệu
        if 'recorded_time' in df.columns:
            df['recorded_time'] = pd.to_datetime(df['recorded_time'])
            df['hour'] = df['recorded_time'].dt.hour
            df['day_of_week'] = df['recorded_time'].dt.dayofweek
            
            # Tạo các đặc trưng thời gian trong ngày
            df['time_morning'] = ((df['hour'] >= 5) & (df['hour'] < 12)).astype(int)
            df['time_afternoon'] = ((df['hour'] >= 12) & (df['hour'] < 17)).astype(int)
            df['time_evening'] = ((df['hour'] >= 17) & (df['hour'] < 21)).astype(int)
            df['time_night'] = ((df['hour'] >= 21) | (df['hour'] < 5)).astype(int)
        
        # Tạo đặc trưng
        features = ['hour', 'day_of_week', 'time_morning', 'time_afternoon', 'time_evening', 'time_night']
        X = df[features]
        y = df['temperature']
        
        # Tạo mô hình Random Forest
        model = RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42)
        model.fit(X, y)
        
        # Tạo thư mục models nếu chưa tồn tại
        os.makedirs(model_dir, exist_ok=True)
        
        # Lưu mô hình
        joblib.dump(model, model_path)
        
        return model
        
    except Exception as e:
        print(f"Lỗi khi tạo/tải mô hình: {str(e)}")
        raise

def predict_temperature():
    try:
        # Tải mô hình
        model = load_or_create_model()
        
        # Lấy dữ liệu cảm biến mới nhất
        sensor_data = get_latest_sensor_data()
        if not sensor_data:
            return
        
        # Dự đoán cho giờ tiếp theo với khoảng thời gian 15 phút
        time_points = [15, 30, 45, 60]  # phút tiếp theo
        hour_predictions = []
        
        # Thời gian hiện tại
        current_time = sensor_data['current_time']
        if isinstance(current_time, str):
            current_time = datetime.fromisoformat(current_time.replace('Z', '+00:00'))
        
        for minutes_ahead in time_points:
            # Điều chỉnh đặc trưng cho thời gian tương lai
            future_time = current_time + timedelta(minutes=minutes_ahead)
            future_hour = future_time.hour
            
            # Cập nhật đặc trưng thời gian trong ngày cho thời gian tương lai
            if 5 <= future_hour < 12:
                future_time_of_day = [1, 0, 0, 0]  # sáng
            elif 12 <= future_hour < 17:
                future_time_of_day = [0, 1, 0, 0]  # trưa
            elif 17 <= future_hour < 21:
                future_time_of_day = [0, 0, 1, 0]  # chiều
            else:
                future_time_of_day = [0, 0, 0, 1]  # tối
            
            # Tạo đặc trưng cho dự đoán
            features = {
                'hour': future_hour,
                'day_of_week': future_time.weekday(),
                'time_morning': future_time_of_day[0],
                'time_afternoon': future_time_of_day[1],
                'time_evening': future_time_of_day[2],
                'time_night': future_time_of_day[3]
            }
            
            future_df = pd.DataFrame([features])
            
            # Dự đoán cho mốc thời gian này
            future_prediction = model.predict(future_df)[0]
            
            # Tính độ tin cậy (đối với Random Forest, lấy độ lệch chuẩn của các cây)
            future_predictions_trees = [tree.predict(future_df)[0] for tree in model.estimators_]
            future_confidence = 1.0 - (np.std(future_predictions_trees) / (max(future_predictions_trees) - min(future_predictions_trees) + 1e-10))
            
            # Thêm vào dự đoán cho giờ tiếp theo
            hour_predictions.append({
                "minutes_ahead": minutes_ahead,
                "temperature": float(future_prediction),
                "confidence": float(future_confidence),
                "predicted_time": future_time.isoformat()
            })
        
        # Trả về kết quả dự đoán
        result = {
            "current_time": current_time.isoformat(),
            "current_temperature": sensor_data['current_temperature'],
            "hour_predictions": hour_predictions,
            # Nhiệt độ dự đoán cao nhất và độ tin cậy tương ứng
            "max_temperature": max([p["temperature"] for p in hour_predictions]),
            "max_confidence": [p["confidence"] for p in hour_predictions][
                [p["temperature"] for p in hour_predictions].index(max([p["temperature"] for p in hour_predictions]))
            ]
        }
        
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({
            "error": str(e),
            "temperature": 0,
            "confidence": 0
        }))

if __name__ == "__main__":
    predict_temperature()