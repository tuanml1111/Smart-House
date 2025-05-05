import pandas as pd
import os

# Đường dẫn file nguồn và file đích
SRC = os.path.join(os.path.dirname(__file__), 'export (2).csv')
DST = os.path.join(os.path.dirname(__file__), 'temperature_data_from_export2.csv')

def convert():
    # Đọc file nguồn
    df = pd.read_csv(SRC)
    # Xác định tên cột thời gian và nhiệt độ (có thể thay đổi tuỳ file)
    # Giả sử các tên phổ biến: 'timestamp', 'time', 'recorded_time', 'value', 'temperature', 'temp'
    time_col = None
    temp_col = None
    for col in df.columns:
        if col.lower() in ['timestamp', 'time', 'recorded_time']:
            time_col = col
        if col.lower() in ['temperature', 'temp', 'value']:
            temp_col = col
    if time_col is None or temp_col is None:
        raise Exception(f"Không tìm thấy cột thời gian hoặc nhiệt độ trong file: {df.columns.tolist()}")
    # Đổi tên cột
    df = df[[time_col, temp_col]].rename(columns={time_col: 'recorded_time', temp_col: 'temperature'})
    # Xử lý giá trị thiếu
    df = df.dropna(subset=['recorded_time', 'temperature'])
    # Lưu ra file đích
    df.to_csv(DST, index=False)
    print(f"Đã chuyển đổi dữ liệu sang {DST}")

if __name__ == "__main__":
    convert()