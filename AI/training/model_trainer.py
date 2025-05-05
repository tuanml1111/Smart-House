
import os
import pickle
import logging
import numpy as np
from sklearn.tree import DecisionTreeRegressor
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import GridSearchCV

# Cấu hình logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("model_trainer.log"),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger("model_trainer")

class TemperatureModelTrainer:
    """Lớp huấn luyện mô hình cho dự đoán nhiệt độ."""
    
    def __init__(self, model_type='decision_tree'):
        """
        Khởi tạo trainer với loại mô hình được chỉ định.
        
        Args:
            model_type: Loại mô hình ('decision_tree' hoặc 'random_forest')
        """
        self.model_type = model_type
        self.temp_model = None
        self.feature_names = None
        self.best_params_temp = None
    
    def _create_model(self, model_type):
        """
        Tạo mô hình dựa trên loại được chỉ định.
        
        Args:
            model_type: Loại mô hình ('decision_tree' hoặc 'random_forest')
            
        Returns:
            Model scikit-learn
        """
        if model_type == 'random_forest':
            return RandomForestRegressor(random_state=42)
        else:  # Mặc định: decision_tree
            return DecisionTreeRegressor(max_depth=10, min_samples_leaf=2, max_features='sqrt', random_state=42)
    
    def train_models(self, X_train, X_test, y_train_temp, y_test_temp, cv=5):
        """
        
        Args:
            X_train: Đặc trưng huấn luyện
            X_test: Đặc trưng kiểm tra
            y_train_temp: Giá trị nhiệt độ mục tiêu cho huấn luyện
            y_test_temp: Giá trị nhiệt độ mục tiêu cho kiểm tra
            cv: Số fold cho cross-validation
        """
        logger.info("Bắt đầu huấn luyện mô hình")
        self.feature_names = X_train.columns.tolist()
        
        # Khởi tạo tham số grid dựa trên loại mô hình
        if self.model_type == 'random_forest':
            param_grid = {
                'n_estimators': [100, 200, 300, 400],
                'max_depth': [None, 10, 20, 30],
                'min_samples_split': [2, 5, 10],
                'min_samples_leaf': [1, 2, 4],
                'max_features': ['auto', 'sqrt']
            }
        else:  # Decision Tree
            param_grid = {
                'max_depth': [4, 6, 8, 10],
                'min_samples_leaf': [10, 15, 20, 25],
                'min_samples_split': [2, 5, 10]
            }
        
        # Mô hình nhiệt độ
        logger.info("Huấn luyện mô hình nhiệt độ")
        temp_base_model = self._create_model(self.model_type)
        temp_grid = GridSearchCV(
            temp_base_model,
            param_grid,
            cv=cv,
            scoring='neg_mean_squared_error',
            n_jobs=-1,
            verbose=1
        )
        temp_grid.fit(X_train, y_train_temp)
        
        # Lấy mô hình tốt nhất cho nhiệt độ
        self.temp_model = temp_grid.best_estimator_
        self.best_params_temp = temp_grid.best_params_
        logger.info(f"Tham số tốt nhất cho mô hình nhiệt độ: {temp_grid.best_params_}")
        
        return {
            'temp_best_params': self.best_params_temp
        }
    
    def predict(self, X, model_type='temp'):
        """
        Dự đoán giá trị dựa trên mô hình đã huấn luyện.
        Args:
            X: Dữ liệu đầu vào
            model_type: 'temp' hoặc 'temperature'
        Returns:
            Giá trị dự đoán
        """
        if model_type == 'temp' or model_type == 'temperature':
            if self.temp_model is None:
                logger.error("Mô hình nhiệt độ chưa được huấn luyện")
                return None
            return self.temp_model.predict(X)
        else:
            logger.error("Chỉ hỗ trợ dự đoán nhiệt độ.")
            return None
    
    def save_models(self, temp_model_path='temp_model.pkl'):
        """Lưu mô hình đã huấn luyện vào đĩa."""
        if self.temp_model is None:
            logger.error("Mô hình chưa được huấn luyện. Hãy gọi train_models() trước.")
            return False
        temp_dir = os.path.dirname(temp_model_path)
        if temp_dir and not os.path.exists(temp_dir):
            os.makedirs(temp_dir)
        import joblib
        joblib.dump(self.temp_model, temp_model_path)
        logger.info(f"Đã lưu mô hình nhiệt độ vào {temp_model_path}")
        return True
    
    def load_models(self, temp_model_path='temp_model.pkl'):
        """Tải mô hình đã huấn luyện từ đĩa."""
        try:
            logger.info(f"Tải mô hình nhiệt độ từ {temp_model_path}")
            import pickle
            with open(temp_model_path, 'rb') as f:
                temp_data = pickle.load(f)
                self.temp_model = temp_data['model']
                self.feature_names = temp_data['feature_names']
                self.best_params_temp = temp_data.get('best_params')
                self.model_type = temp_data.get('model_type', 'decision_tree')
            return True
        except Exception as e:
            logger.error(f"Lỗi khi tải mô hình: {str(e)}")
            return False


if __name__ == "__main__":
    # Ví dụ sử dụng
    import pandas as pd
    from sklearn.model_selection import train_test_split
    
    # Giả lập dữ liệu
    X = pd.DataFrame({
        'temp_lag_1_scaled': np.random.rand(100),
        'temp_lag_2_scaled': np.random.rand(100),
        'humid_lag_1_scaled': np.random.rand(100),
        'hour': np.random.randint(0, 24, 100)
    })
    y_temp = np.random.rand(100)
    
    # Chia dữ liệu
    X_train, X_test, y_train_temp, y_test_temp = train_test_split(X, y_temp, test_size=0.2)
    
    trainer = TemperatureModelTrainer(model_type='decision_tree')
    trainer.train_models(X_train, X_test, y_train_temp, y_test_temp)
    preds = trainer.predict(X_test)
    print("Dự đoán nhiệt độ:", preds)