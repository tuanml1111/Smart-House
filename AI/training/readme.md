├── training/
│   ├── data_processor.py      # Module xử lý dữ liệu
│   ├── model_trainer.py       # Module huấn luyện mô hình 
│   ├── model_evaluator.py     # Module đánh giá mô hình
│   ├── hyperparameter_tuning.py  # Module tối ưu tham số
│   └── train.py               # Script chính huấn luyện
│
├── data/
│   ├── raw/                   # Dữ liệu thô từ cảm biến
│   ├── processed/             # Dữ liệu đã xử lý
│   └── models/                # Lưu trữ các model đã train
│
└── output/                    # Thư mục chứa kết quả, biểu đồ

Luồng làm việc

Dữ liệu từ các cảm biến được lưu vào thư mục data/raw/
Script train.py sẽ:

Tải dữ liệu từ thư mục data/raw/ hoặc tạo dữ liệu mẫu
Tiền xử lý dữ liệu sử dụng data_processor.py
Tối ưu tham số nếu cần sử dụng hyperparameter_tuning.py
Huấn luyện mô hình sử dụng model_trainer.py
Đánh giá mô hình sử dụng model_evaluator.py
Lưu mô hình đã huấn luyện vào thư mục data/models/