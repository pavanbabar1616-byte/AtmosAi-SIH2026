// frontend/js/api.js
// Real API integration

const API_URL = 'https://atmosai-sih2026.up.railway.app/api';
const WS_URL = 'wss://atmosai-sih2026.up.railway.app/ws/live';

// ===== REST API FUNCTIONS =====

export async function fetchDashboard() {
    const response = await fetch(`${API_URL}/dashboard`);
    return await response.json();
}

export async function fetchStations() {
    const response = await fetch(`${API_URL}/stations`);
    const data = await response.json();
    return data.stations || [];
}

export async function fetchAnomalies() {
    const response = await fetch(`${API_URL}/anomalies`);
    const data = await response.json();
    return data.anomalies || [];
}

export async function fetchSensorHealth() {
    const response = await fetch(`${API_URL}/sensor-health`);
    const data = await response.json();
    return data.sensor_health || {};
}

export async function detectAnomaly(station_id, temperature, pressure, humidity) {
    const response = await fetch(`${API_URL}/detect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            station_id,
            timestamp: new Date().toISOString(),
            temperature,
            pressure,
            humidity
        })
    });
    return await response.json();
}

export async function detectBatch(observations) {
    const response = await fetch(`${API_URL}/detect-batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(observations)
    });
    return await response.json();
}

export async function submitFeedback(anomaly_id, station_id, user_decision, notes = '') {
    const response = await fetch(`${API_URL}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            anomaly_id,
            station_id,
            timestamp: new Date().toISOString(),
            user_decision,
            notes
        })
    });
    return await response.json();
}

export async function fetchFeedbackStats() {
    const response = await fetch(`${API_URL}/feedback/stats`);
    return await response.json();
}

// ===== WEBSOCKET FUNCTIONS =====

export function connectWebSocket(onMessage, onConnect, onDisconnect) {
    const ws = new WebSocket(WS_URL);
    
    ws.onopen = () => {
        console.log('✅ WebSocket connected');
        if (onConnect) onConnect();
    };
    
    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            if (onMessage) onMessage(data);
        } catch (e) {
            console.error('WebSocket parse error:', e);
        }
    };
    
    ws.onclose = () => {
        console.log('❌ WebSocket disconnected');
        if (onDisconnect) onDisconnect();
    };
    
    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };
    
    return ws;
}