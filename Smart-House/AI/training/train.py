#!/usr/bin/env python3
"""
YoloHome AI Module - Train Script
================================
Script chính để train model Decision Tree cho dự đoán nhiệt độ.
"""

import os
import sys
import json
import argparse
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from datetime import datetime

# Import các module xử lý dữ liệu và train model
from data_processor import SensorDataProcessor
from model_trainer import TemperatureModelTrainer
from model_evaluator import ModelEvaluator
from hyperparameter_tuning import ModelTuner

def generate_sample_data(days=14, readings_per_hour=12, output_file='sensor_data.csv'):
    """
    Tạo dữ liệu mẫu nếu không có dữ liệu thực.
    
    Args:
        days: Số ngày dữ liệu
        readings_per_hour: Số lần đọc mỗi giờ
        output_file: Đường dẫn đến file đầu ra
        
    Returns:
        DataFrame với dữ liệu mẫu
    """
    print(f"Tạo {days} ngày dữ liệu mẫu với {readings_per_hour} lần đọc mỗi giờ...")
    
    # Tính số lượng điểm dữ liệu
    total_readings = days * 24 * readings_per_hour
    
    # Tạo timestamps
    end_time = datetime.now().replace(minute=0, second=0, microsecond=0)
    timestamps = [end_time - pd.Timedelta(hours=i/readings_per_hour) for i in range(total_readings)]
    timestamps.reverse()  # Từ cũ đến mới
    
    # Hàm cơ sở cho nhiệt độ với chu kỳ ngày
    temperatures = []
    
    for ts in timestamps:
        # Hiệu ứng thời gian trong ngày (chu kỳ 0-24 giờ)
        hour = ts.hour + ts.minute / 60.0
        
        # Nhiệt độ có chu kỳ ngày với đỉnh khoảng 3 giờ chiều
        time_factor = np.sin(((hour - 6) % 24) * np.pi / 12)
        base_temp = 22 + 5 * time_factor  # 17-27°C chu kỳ ngày
        
        # Thêm biến đổi ngày-ngày
        day_offset = (ts.toordinal() % 7) * 0.5  # 0-3°C biến đổi qua các ngày
        
        # Thêm nhiễu
        noise = np.random.normal(0, 0.5)  # Nhiễu ngẫu nhiên nhỏ
        
        # Tính nhiệt độ cuối cùng
        temp = base_temp + day_offset + noise
        temperatures.append(temp)
    
    # Tạo DataFrame
    df = pd.DataFrame({
        'recorded_time': timestamps,
        'temperature': temperatures
    })
    
    print(f"Đã tạo {len(df)} điểm dữ liệu từ {timestamps[0]} đến {timestamps[-1]}")
    
    # Lưu dữ liệu mẫu
    if output_file:
        df.to_csv(output_file, index=False)
        print(f"Đã lưu dữ liệu mẫu vào '{output_file}'")
    
    return df

def plot_data(df, output_dir='.'):
    """
    Vẽ biểu đồ dữ liệu để trực quan hoá.
    
    Args:
        df: DataFrame với dữ liệu cảm biến
        output_dir: Thư mục đầu ra để lưu biểu đồ
    """
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    plt.figure(figsize=(12, 8))
    # Biểu đồ nhiệt độ
    plt.plot(df['recorded_time'], df['temperature'], 'r-')
    plt.xlabel('Thời gian')
    plt.ylabel('Nhiệt độ (°C)')
    plt.title('Dữ liệu nhiệt độ')
    plt.grid(True)
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, 'sensor_data.png'))
    plt.close()
    
    print(f"Đã lưu biểu đồ dữ liệu vào {os.path.join(output_dir, 'sensor_data.png')}")

def main():
    parser = argparse.ArgumentParser(description='YoloHome AI - Train models dự đoán nhiệt độ')
    
    # Tham số dữ liệu
    parser.add_argument('--data', type=str, default=None,
                      help='Đường dẫn đến file CSV chứa dữ liệu cảm biến')
    parser.add_argument('--generate-data', action='store_true',
                      help='Tạo dữ liệu mẫu nếu không có đường dẫn dữ liệu')
    parser.add_argument('--days', type=int, default=14,
                      help='Số ngày dữ liệu mẫu để tạo')
    
    # Tham số đầu ra
    parser.add_argument('--output-dir', type=str, default='output',
                      help='Thư mục đầu ra cho models và báo cáo')
    
    # Tham số huấn luyện
    parser.add_argument('--model-type', type=str, default='decision_tree',
                      choices=['decision_tree', 'random_forest', 'gradient_boosting'],
                      help='Loại mô hình để huấn luyện')
    parser.add_argument('--tune', action='store_true',
                      help='Thực hiện tối ưu hyperparameter')
    parser.add_argument('--tune-method', type=str, default='grid',
                      choices=['grid', 'random', 'both'],
                      help='Phương pháp tối ưu hyperparameter')
    parser.add_argument('--cv', type=int, default=5,
                      help='Số lượng folds cho cross-validation')
    parser.add_argument('--test-size', type=float, default=0.2,
                      help='Tỷ lệ dữ liệu kiểm tra')
    
    args = parser.parse_args()
    
    print("YoloHome AI - Train Models")
    print("=========================")
    
    # Tạo thư mục đầu ra
    os.makedirs(args.output_dir, exist_ok=True)
    
    # Xử lý đường dẫn dữ liệu
    if args.data is None:
        if args.generate_data:
            # Tạo dữ liệu mẫu
            data_file = os.path.join(args.output_dir, 'sensor_data.csv')
            df = generate_sample_data(days=args.days, output_file=data_file)
            args.data = data_file
        else:
            print("Lỗi: Không có đường dẫn dữ liệu. Sử dụng --data hoặc --generate-data")
            return 1
    
    # Vẽ biểu đồ dữ liệu
    raw_data = pd.read_csv(args.data)
    if 'recorded_time' in raw_data.columns:
        # Chuyển đổi timestamp thành datetime nếu cần
        raw_data['recorded_time'] = pd.to_datetime(raw_data['recorded_time'])
    
    # Vẽ và lưu biểu đồ
    plot_data(raw_data, args.output_dir)
    
    # Xử lý dữ liệu
    print("\nĐang xử lý dữ liệu...")
    processor = SensorDataProcessor(data_path=args.data)
    if processor.load_data():
        processor.preprocess_data()
        processed_data_file = os.path.join(args.output_dir, 'processed_sensor_data.csv')
        processor.processed_data.to_csv(processed_data_file, index=False)
        print(f"Đã lưu dữ liệu đã xử lý vào '{processed_data_file}'")
        X_train, X_test, y_train_temp, y_test_temp = processor.get_train_test_data(args.test_size)
        print(f"Kích thước tập train: {X_train.shape}, tập test: {X_test.shape}")
        # Huấn luyện mô hình nhiệt độ
        trainer = TemperatureModelTrainer(model_type=args.model_type)
        if args.tune:
            tuner = ModelTuner(output_dir=args.output_dir)
            best_params_temp = None
            if args.tune_method in ['grid', 'both']:
                temp_grid = tuner.tune_model_grid(X_train, y_train_temp, model_type=args.model_type, cv=args.cv)
                best_params_temp = temp_grid.best_params_
            if args.tune_method in ['random', 'both']:
                temp_random = tuner.tune_model_random(X_train, y_train_temp, model_type=args.model_type, cv=args.cv)
                if not best_params_temp or temp_random.best_score_ > temp_grid.best_score_:
                    best_params_temp = temp_random.best_params_
            print(f"Tham số tốt nhất cho mô hình nhiệt độ: {best_params_temp}")
            trainer.temp_model = trainer._create_model(args.model_type)
            trainer.temp_model.set_params(**best_params_temp)
            trainer.temp_model.fit(X_train, y_train_temp)
        else:
            trainer.train_models(X_train, X_test, y_train_temp, y_test_temp, cv=args.cv)
        # Đánh giá mô hình
        evaluator = ModelEvaluator()
        results = evaluator.evaluate_models(trainer.temp_model, X_test, y_test_temp)
        print("Kết quả đánh giá:", results)
        # Lưu mô hình
        trainer.save_models(temp_model_path=os.path.join(args.output_dir, 'temp_model.pkl'))
        # Báo cáo đánh giá
        evaluator.generate_evaluation_report(trainer.temp_model, X_train.columns.tolist(), output_dir=args.output_dir)
    else:
        print("Không thể load dữ liệu.")
        return 1

if __name__ == "__main__":
    sys.exit(main())