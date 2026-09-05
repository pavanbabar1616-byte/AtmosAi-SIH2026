from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from datetime import datetime
from typing import List, Optional
import random
from pydantic import BaseModel

# Initialize FastAPI
app = FastAPI(title="AtmosAi API", version="1.0.0")

# CORS - allows frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============= DATA MODELS =============

class Observation(BaseModel):
    station_id: str
    timestamp: datetime
    temperature: float
    pressure: float
    humidity: float

class AnomalyResponse(BaseModel):
    station_id: str
    timestamp: datetime
    temperature: float
    pressure: float
    humidity: float
    is_anomaly: bool
    anomaly_score: float
    fault_type: Optional[str] = None
    severity: Optional[str] = None
    confidence: Optional[float] = None
    explanation: Optional[str] = None
    sensor_health: Optional[dict] = None

# ============= MOCK DATA =============

MOCK_STATIONS = [
    {"id": "AWS001", "name": "Delhi", "lat": 28.61, "lon": 77.23, "status": "healthy"},
    {"id": "AWS002", "name": "Mumbai", "lat": 19.07, "lon": 72.87, "status": "healthy"},
    {"id": "AWS003", "name": "Bangalore", "lat": 12.97, "lon": 77.59, "status": "warning"},
    {"id": "AWS004", "name": "Chennai", "lat": 13.08, "lon": 80.28, "status": "healthy"},
    {"id": "AWS005", "name": "Kolkata", "lat": 22.57, "lon": 88.36, "status": "critical"},
]

MOCK_SENSOR_HEALTH = {
    "AWS001": {"temperature": 98, "pressure": 95, "humidity": 92, "overall": 95},
    "AWS002": {"temperature": 87, "pressure": 90, "humidity": 88, "overall": 88},
    "AWS003": {"temperature": 65, "pressure": 70, "humidity": 75, "overall": 70},
    "AWS004": {"temperature": 92, "pressure": 94, "humidity": 90, "overall": 92},
    "AWS005": {"temperature": 45, "pressure": 50, "humidity": 55, "overall": 50},
}

MOCK_ANOMALIES = [
    {
        "id": "ANOM001",
        "station_id": "AWS003",
        "timestamp": datetime.now().isoformat(),
        "temperature": 55.0,
        "pressure": 1012.5,
        "humidity": 65.0,
        "fault_type": "temperature_spike",
        "severity": "HIGH",
        "confidence": 0.96,
        "explanation": "Temperature reading (55.0°C) is 20°C higher than all nearby stations. Historical pattern mismatch detected."
    },
    {
        "id": "ANOM002",
        "station_id": "AWS005",
        "timestamp": datetime.now().isoformat(),
        "temperature": 28.5,
        "pressure": 1010.0,
        "humidity": 65.0,
        "fault_type": "humidity_frozen",
        "severity": "MEDIUM",
        "confidence": 0.88,
        "explanation": "Humidity value (65.0%) has remained unchanged for the last 8 hours, likely a frozen sensor."
    }
]

# ============= API ROUTES =============

@app.get("/")
async def root():
    return {"message": "AtmosAi API - AWS Quality Control Platform"}

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
    # Simple mock detection
    is_anomaly = observation.temperature > 45 or observation.temperature < -5
    
    if is_anomaly:
        anomaly = {
            "station_id": observation.station_id,
            "timestamp": observation.timestamp.isoformat(),
            "temperature": observation.temperature,
            "pressure": observation.pressure,
            "humidity": observation.humidity,
            "is_anomaly": True,
            "anomaly_score": 0.91,
            "fault_type": "temperature_spike" if observation.temperature > 45 else "temperature_drop",
            "severity": "HIGH",
            "confidence": 0.96,
            "explanation": f"Temperature reading ({observation.temperature:.1f}°C) is abnormal. Expected range: 20-40°C.",
            "sensor_health": MOCK_SENSOR_HEALTH.get(observation.station_id, {"overall": 85})
        }
    else:
        anomaly = {
            "station_id": observation.station_id,
            "timestamp": observation.timestamp.isoformat(),
            "temperature": observation.temperature,
            "pressure": observation.pressure,
            "humidity": observation.humidity,
            "is_anomaly": False,
            "anomaly_score": 0.12,
            "fault_type": None,
            "severity": "NONE",
            "confidence": 0.99,
            "explanation": "All parameters are within normal range",
            "sensor_health": MOCK_SENSOR_HEALTH.get(observation.station_id, {"overall": 85})
        }
    
    return anomaly

@app.post("/api/detect-batch")
async def detect_batch(observations: List[Observation]):
    results = []
    for obs in observations:
        result = await detect_anomaly(obs)
        results.append(result)
    return {"results": results}

@app.get("/api/dashboard")
async def get_dashboard():
    healthy = sum(1 for s in MOCK_STATIONS if s["status"] == "healthy")
    warning = sum(1 for s in MOCK_STATIONS if s["status"] == "warning")
    critical = sum(1 for s in MOCK_STATIONS if s["status"] == "critical")
    
    return {
        "total_stations": len(MOCK_STATIONS),
        "station_status": {"healthy": healthy, "warning": warning, "critical": critical},
        "active_anomalies": len(MOCK_ANOMALIES),
        "avg_sensor_health": 85.5,
        "recent_anomalies": MOCK_ANOMALIES[:5]
    }

@app.get("/api/anomalies/{station_id}")
async def get_station_anomalies(station_id: str):
    station = next((s for s in MOCK_STATIONS if s["id"] == station_id), None)
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")
    
    station_anomalies = [a for a in MOCK_ANOMALIES if a["station_id"] == station_id]
    return {"station_id": station_id, "anomalies": station_anomalies}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)