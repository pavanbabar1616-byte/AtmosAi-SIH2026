import random
import numpy as np
from datetime import datetime, timedelta
import json

class AWSDataGenerator:
    def __init__(self):
        self.stations = [
            {"id": "AWS001", "name": "Delhi", "lat": 28.61, "lon": 77.23},
            {"id": "AWS002", "name": "Mumbai", "lat": 19.07, "lon": 72.87},
            {"id": "AWS003", "name": "Bangalore", "lat": 12.97, "lon": 77.59},
            {"id": "AWS004", "name": "Chennai", "lat": 13.08, "lon": 80.28},
            {"id": "AWS005", "name": "Kolkata", "lat": 22.57, "lon": 88.36},
        ]
        self.base_temp = {"AWS001": 30, "AWS002": 32, "AWS003": 28, "AWS004": 33, "AWS005": 31}
        self.base_pressure = 1013
        self.base_humidity = {"AWS001": 50, "AWS002": 70, "AWS003": 65, "AWS004": 75, "AWS005": 80}
        self.history = {}
    
    def generate_normal(self, station_id, timestamp):
        """Generate normal reading with realistic variation"""
        hour = timestamp.hour
        diurnal = 5 * np.sin(2 * np.pi * (hour - 14) / 24)
        temp = self.base_temp[station_id] + diurnal + random.gauss(0, 1.5)
        pressure = self.base_pressure + random.gauss(0, 3)
        humidity = self.base_humidity[station_id] + 10 * np.sin(2 * np.pi * (hour - 6) / 24) + random.gauss(0, 5)
        humidity = max(10, min(100, humidity))
        
        reading = {
            "temperature": round(temp, 1),
            "pressure": round(pressure, 1),
            "humidity": round(humidity, 1),
            "timestamp": timestamp.isoformat()
        }
        self.history[station_id] = reading
        return reading
    
    def inject_fault(self, reading, fault_type):
        """Inject specific fault type"""
        fault_reading = reading.copy()
        
        if fault_type == "spike":
            fault_reading["temperature"] += random.uniform(15, 30)
            fault_reading["fault_type"] = "spike"
            
        elif fault_type == "frozen":
            if reading.get("station_id") in self.history:
                prev = self.history[reading["station_id"]]
                fault_reading["temperature"] = prev["temperature"]
                fault_reading["pressure"] = prev["pressure"]
                fault_reading["humidity"] = prev["humidity"]
            fault_reading["fault_type"] = "frozen"
            
        elif fault_type == "drift":
            fault_reading["temperature"] += random.uniform(5, 15)
            fault_reading["fault_type"] = "drift"
            
        elif fault_type == "calibration":
            fault_reading["temperature"] += random.uniform(3, 10)
            fault_reading["fault_type"] = "calibration"
            
        elif fault_type == "communication":
            return None
            
        return fault_reading
    
    def generate_batch(self, num_readings=100, anomaly_rate=0.05):
        """Generate a batch of readings with optional anomalies"""
        readings = []
        fault_types = ["spike", "frozen", "drift", "calibration", "communication"]
        
        for i in range(num_readings):
            station = random.choice(self.stations)
            timestamp = datetime.now() - timedelta(minutes=random.randint(1, 1440))
            station_id = station["id"]
            
            reading = self.generate_normal(station_id, timestamp)
            reading["station_id"] = station_id
            reading["timestamp"] = timestamp.isoformat()
            
            if random.random() < anomaly_rate:
                fault_type = random.choice(fault_types)
                reading_with_fault = self.inject_fault(reading, fault_type)
                if reading_with_fault:
                    reading = reading_with_fault
                    reading["is_anomaly"] = True
                else:
                    continue
            else:
                reading["is_anomaly"] = False
                reading["fault_type"] = None
            
            readings.append(reading)
        
        return readings