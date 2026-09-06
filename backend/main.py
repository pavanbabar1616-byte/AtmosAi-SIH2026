from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from datetime import datetime, timedelta
from typing import List, Optional
import random
import asyncio
import os
from pydantic import BaseModel

from data_generator import AWSDataGenerator
from ml_detector import AnomalyDetector

# Initialize FastAPI
app = FastAPI(title="AtmosAi API", version="2.0.0")

# ===== CORS =====
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for demo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ... rest of your code

# ============= DATA MODELS =============

class Observation(BaseModel):
    station_id: str
    timestamp: datetime
    temperature: float
    pressure: float
    humidity: float

class Feedback(BaseModel):
    anomaly_id: str
    station_id: str
    timestamp: datetime
    user_decision: str
    notes: Optional[str] = None

# ============= INITIALIZE ML =============

print("🔄 Initializing AtmosAi ML Engine...")
generator = AWSDataGenerator()
detector = AnomalyDetector()

# Train on normal data
normal_data = []
for station_id in ['AWS001', 'AWS002', 'AWS003', 'AWS004', 'AWS005']:
    for hour in range(48):
        timestamp = datetime.now() - timedelta(hours=hour)
        reading = generator.generate_normal(station_id, timestamp)
        reading['station_id'] = station_id
        normal_data.append(reading)

detector.train(normal_data)
detector.save_model()
print("✅ ML model trained!")

# ============= MOCK DATA FOR BACKWARD COMPATIBILITY =============

MOCK_STATIONS = generator.stations

MOCK_SENSOR_HEALTH = {
    "AWS001": {"temperature": 98, "pressure": 95, "humidity": 92, "overall": 95},
    "AWS002": {"temperature": 87, "pressure": 90, "humidity": 88, "overall": 88},
    "AWS003": {"temperature": 65, "pressure": 70, "humidity": 75, "overall": 70},
    "AWS004": {"temperature": 92, "pressure": 94, "humidity": 90, "overall": 92},
    "AWS005": {"temperature": 45, "pressure": 50, "humidity": 55, "overall": 50},
}

# Generate some anomalies for display
MOCK_ANOMALIES = generator.generate_batch(10, anomaly_rate=0.5)
MOCK_ANOMALIES = [a for a in MOCK_ANOMALIES if a.get('is_anomaly', False)][:5]

# ============= API ROUTES =============

@app.get("/")
async def root():
    return {"message": "AtmosAi API v2.0 - Real ML Detection"}

@app.get("/api/stations")
async def get_stations():
    return {"stations": MOCK_STATIONS}

@app.get("/api/stations/{station_id}")
async def get_station(station_id: str):
    station = next((s for s in MOCK_STATIONS if s["id"] == station_id), None)
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")
    return station

@app.get("/api/sensor-health")
async def get_sensor_health():
    return {"sensor_health": MOCK_SENSOR_HEALTH}

@app.get("/api/anomalies")
async def get_anomalies():
    return {"anomalies": MOCK_ANOMALIES}

@app.post("/api/detect")
async def detect_anomaly(observation: Observation):
    """Real ML-based anomaly detection"""
    obs_dict = observation.dict()
    obs_dict['timestamp'] = obs_dict['timestamp'].isoformat()
    
    # ML Detection
    result = detector.detect(obs_dict)
    
    # Explainability
    explanation = detector.explain(obs_dict)
    
    # Determine fault type
    fault_type = None
    severity = "LOW"
    
    if result['is_anomaly']:
        if obs_dict['temperature'] > 45:
            fault_type = "temperature_spike"
            severity = "CRITICAL"
        elif obs_dict['temperature'] < -5:
            fault_type = "temperature_drop"
            severity = "HIGH"
        elif obs_dict['pressure'] > 1050 or obs_dict['pressure'] < 950:
            fault_type = "pressure_anomaly"
            severity = "HIGH"
        else:
            fault_type = "multivariate_anomaly"
            severity = "MEDIUM" if result['confidence'] > 0.7 else "LOW"
    
    return {
        'station_id': obs_dict['station_id'],
        'timestamp': obs_dict['timestamp'],
        'temperature': obs_dict['temperature'],
        'pressure': obs_dict['pressure'],
        'humidity': obs_dict['humidity'],
        'is_anomaly': result['is_anomaly'],
        'anomaly_score': round(result['anomaly_score'], 4),
        'fault_type': fault_type,
        'severity': severity,
        'confidence': round(result['confidence'], 2),
        'explanation': explanation['summary'],
        'feature_contributions': explanation['contributions'],
        'top_feature': explanation['top_feature'],
        'sensor_health': {"temperature": 85, "pressure": 88, "humidity": 82, "overall": 85}
    }

@app.post("/api/detect-batch")
async def detect_batch(observations: List[Observation]):
    """Batch anomaly detection"""
    results = []
    for obs in observations:
        result = await detect_anomaly(obs)
        results.append(result)
    return {"results": results}

@app.get("/api/dashboard")
async def get_dashboard():
    healthy = sum(1 for s in MOCK_STATIONS if "AWS" in s["id"])
    return {
        "total_stations": len(MOCK_STATIONS),
        "station_status": {"healthy": 4, "warning": 1, "critical": 0},
        "active_anomalies": len(MOCK_ANOMALIES),
        "avg_sensor_health": 85.5,
        "recent_anomalies": MOCK_ANOMALIES[:5]
    }

# ============= WEBSOCKET =============

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
    
    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
    
    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                pass

manager = ConnectionManager()

@app.websocket("/ws/live")
async def websocket_live(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            station = random.choice(generator.stations)
            timestamp = datetime.now()
            station_id = station["id"]
            
            reading = generator.generate_normal(station_id, timestamp)
            reading["station_id"] = station_id
            reading["timestamp"] = timestamp.isoformat()
            
            # Randomly inject anomaly for demo (10% chance)
            if random.random() < 0.1:
                fault = random.choice(["spike", "drift", "frozen"])
                reading = generator.inject_fault(reading, fault)
                if reading:
                    reading['status'] = 'ANOMALY'
                    reading['fault_type'] = fault
                else:
                    reading['status'] = 'NORMAL'
            else:
                reading['status'] = 'NORMAL'
            
            # ML detection
            if reading['status'] == 'ANOMALY':
                result = detector.detect(reading)
                reading['anomaly_score'] = round(result['anomaly_score'], 4)
                reading['confidence'] = round(result['confidence'], 2)
            else:
                reading['anomaly_score'] = 0.0
                reading['confidence'] = 1.0
            
            await websocket.send_json(reading)
            await asyncio.sleep(2)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# ============= HUMAN FEEDBACK =============

feedback_store = []

@app.post("/api/feedback")
async def submit_feedback(feedback: Feedback):
    feedback_store.append(feedback.dict())
    return {
        "status": "success",
        "message": "Feedback recorded",
        "total_feedback": len(feedback_store)
    }

@app.get("/api/feedback")
async def get_feedback():
    return {"feedback": feedback_store}

@app.get("/api/feedback/stats")
async def get_feedback_stats():
    total = len(feedback_store)
    confirmed = sum(1 for f in feedback_store if f['user_decision'] == 'confirmed')
    false_positives = sum(1 for f in feedback_store if f['user_decision'] == 'false_positive')
    
    return {
        "total": total,
        "confirmed": confirmed,
        "false_positives": false_positives,
        "accuracy": round(confirmed / total * 100, 1) if total > 0 else 0
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)