"""
YoloHome AI Module - Hyperparameter Tuning
=========================================
Module tối ưu hyperparameter cho các mô hình dự đoán nhiệt độ và độ ẩm.
"""

import os
import json
import logging
import numpy as np
import pandas as pd
from time import time
from sklearn.tree import DecisionTreeRegressor
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.model_selection import GridSearchCV, RandomizedSearchCV

# Cấu hình logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("hyperparameter_tuning.log"),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger("hyperparameter_tuning")

class ModelTuner:
    """Lớp tối ưu hyperparameter cho các mô hình dự đoán."""
    
    def __init__(self, output_dir='.'):        
        self.output_dir = output_dir
        self.tuning_results = {}
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)

    def define_param_grids(self):
        param_grids = {
            'decision_tree': {
                'max_depth': [4, 6, 8, 10, 12, None],
                'min_samples_split': [2, 5, 10],
                'min_samples_leaf': [1, 2, 4, 8, 16],
                'max_features': ['auto', 'sqrt', 'log2', None],
                'criterion': ['squared_error', 'friedman_mse', 'absolute_error', 'poisson']
            },
            'random_forest': {
                'n_estimators': [50, 100, 200],
                'max_depth': [6, 8, 10, 12, None],
                'min_samples_split': [2, 5, 10],
                'min_samples_leaf': [1, 2, 4, 8],
                'max_features': ['auto', 'sqrt', 'log2', None],
                'bootstrap': [True, False]
            },
            'gradient_boosting': {
                'n_estimators': [50, 100, 200],
                'learning_rate': [0.01, 0.05, 0.1, 0.2],
                'max_depth': [3, 4, 5, 6],
                'min_samples_split': [2, 5, 10],
                'min_samples_leaf': [1, 2, 4],
                'subsample': [0.8, 0.9, 1.0]
            }
        }
        return param_grids

    def define_random_param_distributions(self):
        param_distributions = {
            'decision_tree': {
                'max_depth': [4, 6, 8, 10, 12, 15, 20, None],
                'min_samples_split': np.arange(2, 20),
                'min_samples_leaf': np.arange(1, 20),
                'max_features': ['auto', 'sqrt', 'log2', None],
                'criterion': ['squared_error', 'friedman_mse', 'absolute_error', 'poisson']
            },
            'random_forest': {
                'n_estimators': np.arange(50, 500, 50),
                'max_depth': [6, 8, 10, 12, 15, 20, None],
                'min_samples_split': np.arange(2, 20),
                'min_samples_leaf': np.arange(1, 20),
                'max_features': ['auto', 'sqrt', 'log2', None],
                'bootstrap': [True, False]
            },
            'gradient_boosting': {
                'n_estimators': np.arange(50, 500, 50),
                'learning_rate': np.logspace(-3, 0, 10),
                'max_depth': np.arange(3, 10),
                'min_samples_split': np.arange(2, 20),
                'min_samples_leaf': np.arange(1, 20),
                'subsample': np.linspace(0.6, 1.0, 5)
            }
        }
        return param_distributions

    def create_model(self, model_type):
        if model_type == 'random_forest':
            return RandomForestRegressor(random_state=42)
        elif model_type == 'gradient_boosting':
            return GradientBoostingRegressor(random_state=42)
        else:
            return DecisionTreeRegressor(random_state=42)

    def tune_model_grid(self, X_train, y_train, model_type='decision_tree', cv=5, scoring='neg_mean_squared_error'):
        logger.info(f"Bắt đầu grid search cho mô hình {model_type}...")
        model = self.create_model(model_type)
        param_grids = self.define_param_grids()
        if model_type not in param_grids:
            logger.error(f"Không tìm thấy grid tham số cho {model_type}")
            return None
        param_grid = param_grids[model_type]
        grid_search = GridSearchCV(
            estimator=model,
            param_grid=param_grid,
            cv=cv,
            scoring=scoring,
            n_jobs=-1,
            verbose=1,
            return_train_score=True
        )
        start_time = time()
        grid_search.fit(X_train, y_train)
        end_time = time()
        total_time = end_time - start_time
        logger.info(f"Grid search hoàn thành trong {total_time:.2f} giây")
        logger.info(f"Tham số tốt nhất: {grid_search.best_params_}")
        logger.info(f"Score tốt nhất: {grid_search.best_score_:.4f}")
        self.tuning_results[f"{model_type}_grid"] = {
            'best_params': grid_search.best_params_,
            'best_score': float(grid_search.best_score_),
            'execution_time': float(total_time)
        }
        self.save_results()
        return grid_search

    def tune_model_random(self, X_train, y_train, model_type='decision_tree', cv=5, scoring='neg_mean_squared_error', n_iter=100):
        logger.info(f"Bắt đầu random search cho mô hình {model_type}...")
        model = self.create_model(model_type)
        param_distributions = self.define_random_param_distributions()
        if model_type not in param_distributions:
            logger.error(f"Không tìm thấy phân phối tham số cho {model_type}")
            return None
        param_dist = param_distributions[model_type]
        random_search = RandomizedSearchCV(
            estimator=model,
            param_distributions=param_dist,
            n_iter=n_iter,
            cv=cv,
            scoring=scoring,
            n_jobs=-1,
            verbose=1,
            random_state=42,
            return_train_score=True
        )
        start_time = time()
        random_search.fit(X_train, y_train)
        end_time = time()
        total_time = end_time - start_time
        logger.info(f"Random search hoàn thành trong {total_time:.2f} giây")
        logger.info(f"Tham số tốt nhất: {random_search.best_params_}")
        logger.info(f"Score tốt nhất: {random_search.best_score_:.4f}")
        self.tuning_results[f"{model_type}_random"] = {
            'best_params': random_search.best_params_,
            'best_score': float(random_search.best_score_),
            'execution_time': float(total_time)
        }
        self.save_results()
        return random_search

    def save_results(self):
        result_path = os.path.join(self.output_dir, 'tuning_results.json')
        with open(result_path, 'w', encoding='utf-8') as f:
            json.dump(self.tuning_results, f, ensure_ascii=False, indent=2)
        logger.info(f"Đã lưu kết quả tuning vào {result_path}")

    def load_results(self):
        result_path = os.path.join(self.output_dir, 'tuning_results.json')
        if os.path.exists(result_path):
            with open(result_path, 'r', encoding='utf-8') as f:
                self.tuning_results = json.load(f)
            logger.info(f"Đã tải kết quả tuning từ {result_path}")
        else:
            logger.warning(f"Không tìm thấy file tuning_results.json ở {result_path}")

if __name__ == "__main__":
    import pandas as pd
    from sklearn.model_selection import train_test_split
    X = pd.DataFrame({
        'feature1': np.random.rand(100),
        'feature2': np.random.rand(100),
        'feature3': np.random.rand(100),
        'feature4': np.random.rand(100)
    })
    y_temp = np.random.rand(100)
    X_train, X_test, y_train, y_test = train_test_split(X, y_temp, test_size=0.2)
    tuner = ModelTuner(output_dir='output')
    grid = tuner.tune_model_grid(X_train, y_train, model_type='decision_tree', cv=3)
    print("Best params:", grid.best_params_)