"""
YoloHome AI Module - Model Evaluator
===================================
Module đánh giá hiệu suất các mô hình dự đoán nhiệt độ và độ ẩm.
"""

import os
import numpy as np
import pandas as pd
import logging
import matplotlib.pyplot as plt
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
# Cấu hình logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("model_evaluator.log"),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger("model_evaluator")

class ModelEvaluator:
    """Lớp đánh giá mô hình dự đoán."""
    
    def __init__(self):
        """Khởi tạo evaluator."""
        self.results = {}
        
    def evaluate_models(self, temp_model, X_test, y_test_temp):
        """
        Đánh giá mô hình nhiệt độ.
        
        Args:
            temp_model: Mô hình dự đoán nhiệt độ
            X_test: Đặc trưng kiểm tra
            y_test_temp: Giá trị nhiệt độ thực tế
        Returns:
            Dictionary với các metrics đánh giá
        """
        logger.info("Đánh giá mô hình nhiệt độ trên dữ liệu kiểm tra")
        results = {}
        if temp_model is not None and y_test_temp is not None:
            logger.info("Đánh giá mô hình nhiệt độ")
            y_pred_temp = temp_model.predict(X_test)
            temp_mse = mean_squared_error(y_test_temp, y_pred_temp)
            temp_rmse = np.sqrt(temp_mse)
            temp_mae = mean_absolute_error(y_test_temp, y_pred_temp)
            temp_r2 = r2_score(y_test_temp, y_pred_temp)
            logger.info(f"Nhiệt độ - MSE: {temp_mse:.4f}, RMSE: {temp_rmse:.4f}, " 
                       f"MAE: {temp_mae:.4f}, R²: {temp_r2:.4f}")
            results['temperature'] = {
                'mse': temp_mse,
                'rmse': temp_rmse,
                'mae': temp_mae,
                'r2': temp_r2,
                'predictions': y_pred_temp,
                'actuals': y_test_temp
            }
        else:
            logger.warning("Không thể đánh giá mô hình nhiệt độ: model hoặc dữ liệu thiếu")
        self.results = results
        return results
    
    def plot_predictions(self, output_dir='.'):
        """
        Tạo biểu đồ so sánh giá trị dự đoán và thực tế.
        
        Args:
            output_dir: Thư mục đầu ra để lưu biểu đồ
        """
        if not self.results:
            logger.error("Không có kết quả để vẽ. Hãy gọi evaluate_models() trước.")
            return False
            
        # Tạo thư mục đầu ra nếu không tồn tại
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
            
        # Biểu đồ so sánh
        plt.figure(figsize=(8, 6))
        
        # Biểu đồ nhiệt độ
        if 'temperature' in self.results:
            temp_actual = self.results['temperature']['actuals']
            temp_predicted = self.results['temperature']['predictions']
            # Reset index để đảm bảo index liên tục
            if isinstance(temp_actual, (pd.Series, np.ndarray)):
                temp_actual = pd.Series(temp_actual).reset_index(drop=True)
            if isinstance(temp_predicted, (pd.Series, np.ndarray)):
                temp_predicted = pd.Series(temp_predicted).reset_index(drop=True)
            sorted_indices = np.argsort(temp_actual)
            plt.scatter(temp_actual, temp_predicted, alpha=0.5, color='red', label='Temperature')
            plt.plot(temp_actual[sorted_indices], temp_actual[sorted_indices], 'k--', label='Perfect prediction')
            r2 = self.results['temperature']['r2']
            rmse = self.results['temperature']['rmse']
            plt.title(f'Nhiệt độ: Giá trị dự đoán vs thực tế (R² = {r2:.4f}, RMSE = {rmse:.4f})')
            plt.xlabel('Giá trị thực tế')
            plt.ylabel('Giá trị dự đoán')
            plt.legend()
            plt.grid(True)
        plt.tight_layout()
        plt.savefig(os.path.join(output_dir, 'prediction_comparison.png'))
        plt.close()
        
        # Biểu đồ phân phối lỗi
        plt.figure(figsize=(8, 6))
        
        # Biểu đồ lỗi nhiệt độ
        if 'temperature' in self.results:
            temp_actual = self.results['temperature']['actuals']
            temp_predicted = self.results['temperature']['predictions']
            temp_errors = temp_predicted - temp_actual
            plt.hist(temp_errors, bins=30, alpha=0.7, color='red')
            plt.axvline(x=0, color='k', linestyle='--')
            plt.title('Phân phối lỗi dự đoán nhiệt độ')
            plt.xlabel('Lỗi dự đoán (Dự đoán - Thực tế)')
            plt.ylabel('Tần suất')
            plt.grid(True)
        plt.tight_layout()
        plt.savefig(os.path.join(output_dir, 'error_distribution.png'))
        plt.close()
        
        logger.info(f"Đã lưu biểu đồ đánh giá vào {output_dir}")
        return True
    
    def feature_importance(self, temp_model, feature_names):
        """
        Phân tích tầm quan trọng của các đặc trưng.
        Args:
            temp_model: Mô hình dự đoán nhiệt độ
            feature_names: Danh sách tên các đặc trưng
        Returns:
            DataFrame với thông tin tầm quan trọng của đặc trưng
        """
        importance_data = {}
        if hasattr(temp_model, 'feature_importances_'):
            importance_data['temperature'] = temp_model.feature_importances_
        if not importance_data:
            logger.warning("Không thể tính tầm quan trọng đặc trưng: mô hình không hỗ trợ")
            return None
        feature_importance_df = pd.DataFrame({
            'feature': feature_names
        })
        if 'temperature' in importance_data:
            feature_importance_df['temperature_importance'] = importance_data['temperature']
            feature_importance_df = feature_importance_df.sort_values('temperature_importance', ascending=False)
        return feature_importance_df
    
    def plot_feature_importance(self, temp_model, feature_names, output_dir='.'): 
        """
        Vẽ biểu đồ tầm quan trọng của đặc trưng.
        Args:
            temp_model: Mô hình dự đoán nhiệt độ
            feature_names: Danh sách tên các đặc trưng
            output_dir: Thư mục đầu ra để lưu biểu đồ
        """
        importance_df = self.feature_importance(temp_model, feature_names)
        if importance_df is None:
            logger.error("Không có dữ liệu tầm quan trọng đặc trưng để vẽ biểu đồ")
            return False
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
        plt.figure(figsize=(8, 6))
        N = min(10, len(importance_df))
        top_features = importance_df.head(N)
        if 'temperature_importance' in importance_df.columns:
            temp_sorted = top_features.sort_values('temperature_importance')
            bars = plt.barh(temp_sorted['feature'], temp_sorted['temperature_importance'], color='red', alpha=0.7)
            plt.title('Top đặc trưng quan trọng cho dự đoán nhiệt độ')
            plt.xlabel('Tầm quan trọng')
            for bar in bars:
                width = bar.get_width()
                plt.text(width + 0.01, bar.get_y() + bar.get_height()/2, 
                        f'{width:.3f}', ha='left', va='center')
        plt.tight_layout()
        plt.savefig(os.path.join(output_dir, 'feature_importance.png'))
        plt.close()
        logger.info(f"Đã lưu biểu đồ tầm quan trọng đặc trưng vào {output_dir}")
        importance_df.to_csv(os.path.join(output_dir, 'feature_importance.csv'), index=False)
        return True
    
    def generate_evaluation_report(self, temp_model, feature_names, output_dir='.'): 
        """
        Tạo báo cáo đánh giá đầy đủ với các biểu đồ và thông tin.
        Args:
            temp_model: Mô hình dự đoán nhiệt độ
            feature_names: Danh sách tên các đặc trưng
            output_dir: Thư mục đầu ra để lưu báo cáo
        """
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
        if not self.results:
            logger.error("Không có kết quả để tạo báo cáo. Hãy gọi evaluate_models() trước.")
            return False
        self.plot_predictions(output_dir)
        self.plot_feature_importance(temp_model, feature_names, output_dir)
        html_report = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>YoloHome AI Model Evaluation Report</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; }}
                h1, h2, h3 {{ color: #3366cc; }}
                table {{ border-collapse: collapse; width: 100%; margin-bottom: 20px; }}
                th, td {{ padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }}
                th {{ background-color: #f2f2f2; }}
                .metric-good {{ color: green; }}
                .metric-warning {{ color: orange; }}
                .metric-bad {{ color: red; }}
                .container {{ display: flex; flex-wrap: wrap; }}
                .chart {{ max-width: 100%; margin-bottom: 20px; }}
            </style>
        </head>
        <body>
            <h1>YoloHome AI Model Evaluation Report</h1>
            <p>Thời gian đánh giá: {pd.Timestamp.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
            <h2>Kết quả đánh giá mô hình</h2>
        """
        if 'temperature' in self.results:
            temp_metrics = self.results['temperature']
            r2_class = "metric-good" if temp_metrics['r2'] > 0.8 else "metric-warning" if temp_metrics['r2'] > 0.6 else "metric-bad"
            html_report += f"""
            <h3>Mô hình dự đoán nhiệt độ</h3>
            <table>
                <tr>
                    <th>Metric</th>
                    <th>Value</th>
                </tr>
                <tr>
                    <td>R² (Coefficient of Determination)</td>
                    <td class=\"{r2_class}\">{temp_metrics['r2']:.4f}</td>
                </tr>
                <tr>
                    <td>RMSE (Root Mean Squared Error)</td>
                    <td>{temp_metrics['rmse']:.4f}</td>
                </tr>
                <tr>
                    <td>MAE (Mean Absolute Error)</td>
                    <td>{temp_metrics['mae']:.4f}</td>
                </tr>
            </table>
            """
        html_report += f"""
            <h2>Biểu đồ đánh giá</h2>
            <div class=\"container\">
                <div class=\"chart\">
                    <h3>So sánh giá trị dự đoán vs thực tế</h3>
                    <img src=\"prediction_comparison.png\" alt=\"Prediction Comparison\" width=\"100%\">
                </div>
                <div class=\"chart\">
                    <h3>Phân phối lỗi dự đoán</h3>
                    <img src=\"error_distribution.png\" alt=\"Error Distribution\" width=\"100%\">
                </div>
                <div class=\"chart\">
                    <h3>Tầm quan trọng đặc trưng</h3>
                    <img src=\"feature_importance.png\" alt=\"Feature Importance\" width=\"100%\">
                </div>
            </div>
            <h2>Thông tin mô hình</h2>
        """
        if temp_model is not None:
            model_type = type(temp_model).__name__
            params = temp_model.get_params()
            param_str = "<br>".join([f"<b>{k}</b>: {v}" for k, v in params.items()])
            html_report += f"""
            <h3>Mô hình nhiệt độ</h3>
            <p><b>Loại mô hình:</b> {model_type}</p>
            <p><b>Tham số:</b><br>{param_str}</p>
            """
        html_report += """
        </body>
        </html>
        """
        report_path = os.path.join(output_dir, 'evaluation_report.html')
        with open(report_path, 'w', encoding='utf-8') as f:
            f.write(html_report)
        logger.info(f"Đã tạo báo cáo đánh giá tại {report_path}")
        return True


if __name__ == "__main__":
    # Ví dụ sử dụng
    import numpy as np
    from sklearn.tree import DecisionTreeRegressor
    
    # Giả lập dữ liệu 
    np.random.seed(42)
    X_test = np.random.rand(100, 4)
    y_test_temp = np.random.rand(100)
    y_test_humid = np.random.rand(100)
    
    # Tạo mô hình giả
    temp_model = DecisionTreeRegressor(max_depth=5)
    temp_model.fit(X_test, y_test_temp)
    
    humid_model = DecisionTreeRegressor(max_depth=4)
    humid_model.fit(X_test, y_test_humid)
    
    # Đánh giá
    evaluator = ModelEvaluator()
    results = evaluator.evaluate_models(temp_model, humid_model, X_test, y_test_temp, y_test_humid)
    
    # Tạo biểu đồ
    evaluator.plot_predictions('output')
    
    # In kết quả
    print("Kết quả đánh giá mô hình nhiệt độ:")
    print(f"  R²: {results['temperature']['r2']:.4f}")
    print(f"  RMSE: {results['temperature']['rmse']:.4f}")
    
    print("\nKết quả đánh giá mô hình độ ẩm:")
    print(f"  R²: {results['humidity']['r2']:.4f}")
    print(f"  RMSE: {results['humidity']['rmse']:.4f}")
    
    # Tính và vẽ biểu đồ tầm quan trọng đặc trưng
    feature_names = ['feature1', 'feature2', 'feature3', 'feature4']
    evaluator.plot_feature_importance(temp_model, humid_model, feature_names, 'output')
    
    # Tạo báo cáo đánh giá
    evaluator.generate_evaluation_report(temp_model, humid_model, feature_names, 'output')