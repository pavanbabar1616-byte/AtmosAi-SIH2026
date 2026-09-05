import numpy as np
from sklearn.ensemble import IsolationForest
import joblib
import os

class AnomalyDetector:
    def __init__(self):
        self.model = None
        self.threshold = None
    
    def train(self, normal_data):
        """Train Isolation Forest on normal data"""
        X = np.array([[d['temperature'], d['pressure'], d['humidity']] for d in normal_data])
        self.model = IsolationForest(contamination=0.05, random_state=42)
        self.model.fit(X)
        scores = self.model.score_samples(X)
        self.threshold = np.percentile(scores, 5)
        return self.model
    
    def detect(self, observation):
        """Detect if a single observation is anomalous"""
        X = np.array([[observation['temperature'], observation['pressure'], observation['humidity']]])
        score = self.model.score_samples(X)[0]
        is_anomaly = score < self.threshold
        
        return {
            'is_anomaly': bool(is_anomaly),
            'anomaly_score': float(score),
            'confidence': min(1.0, abs(score) / (abs(self.threshold) + 0.01))
        }
    
    def explain(self, observation):
        """Feature contribution explanation (simplified SHAP)"""
        temp = observation['temperature']
        pressure = observation['pressure']
        humidity = observation['humidity']
        
        contributions = {
            'temperature': min(1.0, abs(temp - 30) / 30),
            'pressure': min(1.0, abs(pressure - 1013) / 50),
            'humidity': min(1.0, abs(humidity - 55) / 45)
        }
        
        total = sum(contributions.values())
        if total > 0:
            contributions = {k: round(v/total, 2) for k, v in contributions.items()}
        
        reasons = []
        if temp > 40:
            reasons.append(f"🌡️ Temperature ({temp}°C) is abnormally high (normal: 25-35°C)")
        elif temp < -5:
            reasons.append(f"🌡️ Temperature ({temp}°C) is abnormally low")
        if pressure < 950:
            reasons.append(f"📊 Pressure ({pressure}hPa) is unusually low")
        elif pressure > 1050:
            reasons.append(f"📊 Pressure ({pressure}hPa) is unusually high")
        if humidity > 90:
            reasons.append(f"💧 Humidity ({humidity}%) is very high")
        elif humidity < 10:
            reasons.append(f"💧 Humidity ({humidity}%) is very low")
        if not reasons:
            reasons.append("All parameters are within normal range")
        
        return {
            'summary': '. '.join(reasons),
            'contributions': contributions,
            'top_feature': max(contributions, key=contributions.get)
        }
    
    def save_model(self, path="models/isolation_forest.pkl"):
        os.makedirs(os.path.dirname(path), exist_ok=True)
        joblib.dump({'model': self.model, 'threshold': self.threshold}, path)
    
    def load_model(self, path="models/isolation_forest.pkl"):
        data = joblib.load(path)
        self.model = data['model']
        self.threshold = data['threshold']