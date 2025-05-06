# Module AI cho YoloHome

Module này chứa các thành phần trí tuệ nhân tạo cho hệ thống YoloHome, bao gồm mô hình Decision Tree để dự đoán nhiệt độ và độ ẩm.

## Cấu trúc thư mục

```


## Mô hình Decision Tree dự đoán nhiệt độ & độ ẩm

### Thu thập dữ liệu
- Dữ liệu nhiệt độ và độ ẩm được thu thập từ cảm biến DHT20 với chu kỳ 1 phút
- Dữ liệu được lưu trữ trong cơ sở dữ liệu PostgreSQL cùng với dấu thời gian (timestamp)

### Tiền xử lý dữ liệu
- Xử lý dữ liệu thiếu hoặc giá trị ngoại lai bằng nội suy tuyến tính
- Scale dữ liệu về khoảng [0, 1] bằng Min-Max Scaler
- Chia dữ liệu thành 80% huấn luyện và 20% kiểm thử
- Xóa các dữ liệu trùng lặp liên tục ( ví dụ quá 3 lần trùng lặp thì sẽ xóa n lần đó thành 1 lần)
- Dữ liệu sau khi xử lí sẽ được lưu vào file CSV
### Đặc trưng đầu vào
- Giá trị nhiệt độ, độ ẩm tại t, t-1, t-2 (lag features)
- Thời gian trong ngày (sáng/trưa/chiều/tối)

### Mô hình
- Sử dụng Decision TreeRegressor từ scikit-learn
- Siêu tham số tối ưu qua 5-fold cross-validation:
  - max_depth = 8
  - min_samples_leaf = 20

### Đánh giá mô hình
- Sử dụng tập dữ liệu kiểm thử để đánh giá hiệu suất
- Các chỉ số đánh giá: MSE, MAE, R²

### Triển khai
- Mô hình được đóng gói dưới dạng file decision_tree.pkl
- Tích hợp với backend Node.js qua scikit-learn-inference
- Dự đoán nhiệt độ và độ ẩm cho 5 phút kế tiếp
- Phát lệnh bật quạt nếu nhiệt độ dự báo vượt 30°C
- Hiển thị kết quả dự đoán trên dashboard React

### Cập nhật mô hình
- Theo dõi hiệu suất mô hình trong thời gian thực
- Thu thập dữ liệu mới để cập nhật và cải thiện mô hình
- Xem xét sử dụng online learning hoặc incremental learning để cập nhật mô hình liên tục