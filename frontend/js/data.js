// AtmosAi Prototype — Simulated India AWS Network Data
// Clearly labeled as DEMO / SIMULATED data (rules.md)

const STATIONS = [
  { id: "AWS-DEL-01", name: "Delhi Safdarjung", lat: 28.58, lon: 77.21, region: "North" },
  { id: "AWS-MUM-02", name: "Mumbai Colaba", lat: 18.91, lon: 72.81, region: "West" },
  { id: "AWS-BLR-03", name: "Bengaluru HAL", lat: 12.95, lon: 77.67, region: "South" },
  { id: "AWS-CHN-04", name: "Chennai Nungambakkam", lat: 13.07, lon: 80.25, region: "South" },
  { id: "AWS-KOL-05", name: "Kolkata Alipore", lat: 22.54, lon: 88.33, region: "East" },
  { id: "AWS-HYD-06", name: "Hyderabad Begumpet", lat: 17.45, lon: 78.47, region: "South" },
  { id: "AWS-JAI-07", name: "Jaipur Sanganer", lat: 26.82, lon: 75.81, region: "North" },
  { id: "AWS-LKO-08", name: "Lucknow Amausi", lat: 26.76, lon: 80.88, region: "North" },
  { id: "AWS-AMD-09", name: "Ahmedabad", lat: 23.07, lon: 72.63, region: "West" },
  { id: "AWS-PUN-10", name: "Pune Lohegaon", lat: 18.58, lon: 73.92, region: "West" },
  { id: "AWS-CHD-11", name: "Chandigarh", lat: 30.70, lon: 76.80, region: "North" },
  { id: "AWS-BHO-12", name: "Bhopal", lat: 23.28, lon: 77.35, region: "Central" },
  { id: "AWS-NAG-13", name: "Nagpur", lat: 21.09, lon: 79.05, region: "Central" },
  { id: "AWS-PAT-14", name: "Patna", lat: 25.59, lon: 85.09, region: "East" },
  { id: "AWS-RAN-15", name: "Ranchi", lat: 23.31, lon: 85.32, region: "East" },
  { id: "AWS-GUW-16", name: "Guwahati", lat: 26.10, lon: 91.59, region: "Northeast" },
  { id: "AWS-TRI-17", name: "Trivandrum", lat: 8.48, lon: 76.95, region: "South" },
  { id: "AWS-GOA-18", name: "Goa Panjim", lat: 15.50, lon: 73.83, region: "West" },
  { id: "AWS-SRN-19", name: "Srinagar", lat: 34.08, lon: 74.80, region: "North" },
  { id: "AWS-JAM-20", name: "Jammu", lat: 32.69, lon: 74.84, region: "North" },
  { id: "AWS-VAR-21", name: "Varanasi", lat: 25.45, lon: 82.86, region: "North" },
  { id: "AWS-IND-22", name: "Indore", lat: 22.72, lon: 75.80, region: "Central" },
  { id: "AWS-SUR-23", name: "Surat", lat: 21.17, lon: 72.83, region: "West" },
  { id: "AWS-COI-24", name: "Coimbatore", lat: 11.03, lon: 77.04, region: "South" },
];

// Seeded status for demo consistency
const STATION_STATE = {
  "AWS-DEL-01": { status: "critical", health: 42, fault: "Spike", temp: 54.8, pressure: 1008.2, humidity: 41 },
  "AWS-MUM-02": { status: "healthy", health: 94, fault: null, temp: 31.2, pressure: 1006.5, humidity: 78 },
  "AWS-BLR-03": { status: "warning", health: 71, fault: "Drift", temp: 27.4, pressure: 912.1, humidity: 62 },
  "AWS-CHN-04": { status: "healthy", health: 91, fault: null, temp: 33.1, pressure: 1007.8, humidity: 71 },
  "AWS-KOL-05": { status: "healthy", health: 88, fault: null, temp: 30.5, pressure: 1005.2, humidity: 82 },
  "AWS-HYD-06": { status: "warning", health: 68, fault: "Frozen", temp: 29.8, pressure: 948.3, humidity: 55 },
  "AWS-JAI-07": { status: "healthy", health: 96, fault: null, temp: 34.6, pressure: 978.4, humidity: 28 },
  "AWS-LKO-08": { status: "critical", health: 38, fault: "Calibration", temp: 41.2, pressure: 1001.0, humidity: 48 },
  "AWS-AMD-09": { status: "healthy", health: 90, fault: null, temp: 35.1, pressure: 1002.6, humidity: 35 },
  "AWS-PUN-10": { status: "warning", health: 74, fault: "Communication", temp: null, pressure: null, humidity: null },
  "AWS-CHD-11": { status: "healthy", health: 93, fault: null, temp: 29.4, pressure: 972.1, humidity: 52 },
  "AWS-BHO-12": { status: "healthy", health: 89, fault: null, temp: 32.0, pressure: 970.5, humidity: 44 },
  "AWS-NAG-13": { status: "healthy", health: 92, fault: null, temp: 31.5, pressure: 978.8, humidity: 51 },
  "AWS-PAT-14": { status: "warning", health: 65, fault: "Drift", temp: 33.8, pressure: 1003.4, humidity: 69 },
  "AWS-RAN-15": { status: "healthy", health: 87, fault: null, temp: 28.9, pressure: 938.2, humidity: 66 },
  "AWS-GUW-16": { status: "healthy", health: 85, fault: null, temp: 27.2, pressure: 1004.1, humidity: 88 },
  "AWS-TRI-17": { status: "healthy", health: 94, fault: null, temp: 29.6, pressure: 1009.3, humidity: 79 },
  "AWS-GOA-18": { status: "healthy", health: 91, fault: null, temp: 30.8, pressure: 1008.0, humidity: 81 },
  "AWS-SRN-19": { status: "healthy", health: 86, fault: null, temp: 18.4, pressure: 845.2, humidity: 58 },
  "AWS-JAM-20": { status: "healthy", health: 90, fault: null, temp: 26.1, pressure: 968.4, humidity: 47 },
  "AWS-VAR-21": { status: "critical", health: 45, fault: "Spike", temp: 48.3, pressure: 1002.7, humidity: 39 },
  "AWS-IND-22": { status: "healthy", health: 88, fault: null, temp: 33.4, pressure: 969.1, humidity: 42 },
  "AWS-SUR-23": { status: "warning", health: 72, fault: "Calibration", temp: 36.9, pressure: 1004.5, humidity: 58 },
  "AWS-COI-24": { status: "healthy", health: 93, fault: null, temp: 28.7, pressure: 956.3, humidity: 64 },
};

const ANOMALIES = [
  { time: "2026-09-05 08:42", station: "AWS-DEL-01", param: "Temperature", value: "54.8°C", type: "Spike", severity: "CRITICAL", conf: 96, assessment: "Likely Sensor Fault" },
  { time: "2026-09-05 08:15", station: "AWS-VAR-21", param: "Temperature", value: "48.3°C", type: "Spike", severity: "HIGH", conf: 91, assessment: "Likely Sensor Fault" },
  { time: "2026-09-05 07:50", station: "AWS-LKO-08", param: "Temperature", value: "41.2°C", type: "Calibration", severity: "HIGH", conf: 88, assessment: "Likely Sensor Fault" },
  { time: "2026-09-05 07:22", station: "AWS-HYD-06", param: "Humidity", value: "55% (stuck)", type: "Frozen", severity: "MEDIUM", conf: 94, assessment: "Likely Sensor Fault" },
  { time: "2026-09-05 06:58", station: "AWS-PUN-10", param: "All", value: "—", type: "Communication", severity: "HIGH", conf: 99, assessment: "Communication Error" },
  { time: "2026-09-05 06:30", station: "AWS-BLR-03", param: "Pressure", value: "912.1 hPa", type: "Drift", severity: "MEDIUM", conf: 82, assessment: "Requires Validation" },
  { time: "2026-09-04 22:10", station: "AWS-PAT-14", param: "Humidity", value: "69%", type: "Drift", severity: "LOW", conf: 74, assessment: "Requires Validation" },
  { time: "2026-09-04 19:45", station: "AWS-SUR-23", param: "Temperature", value: "36.9°C", type: "Calibration", severity: "MEDIUM", conf: 79, assessment: "Likely Sensor Fault" },
  { time: "2026-09-04 14:20", station: "AWS-DEL-01", param: "Temperature", value: "52.1°C", type: "Spike", severity: "CRITICAL", conf: 93, assessment: "Likely Sensor Fault" },
  { time: "2026-09-03 11:05", station: "AWS-MUM-02", param: "Temperature", value: "38.4°C", type: "Spike", severity: "LOW", conf: 61, assessment: "Genuine Weather Event" },
  { time: "2026-09-02 09:30", station: "AWS-JAI-07", param: "Temperature", value: "41.2°C", type: "Spike", severity: "LOW", conf: 55, assessment: "Genuine Weather Event" },
];

const ALERTS = [
  { id: 1, severity: "critical", title: "AWS-DEL-01 · Temperature Spike", time: "08:42 IST", body: "Observed 54.8°C. Nearby stations 30–33°C. Multivariate stable.", reco: "Inspect / recalibrate temperature sensor immediately." },
  { id: 2, severity: "critical", title: "AWS-VAR-21 · Temperature Spike", time: "08:15 IST", body: "Sudden jump to 48.3°C. Spatial mismatch with neighbors.", reco: "Schedule sensor inspection and compare with nearby stations." },
  { id: 3, severity: "high", title: "AWS-LKO-08 · Calibration Offset", time: "07:50 IST", body: "Persistent warm bias vs climatology and neighbors.", reco: "Verify calibration; check recent maintenance logs." },
  { id: 4, severity: "high", title: "AWS-PUN-10 · Communication Loss", time: "06:58 IST", body: "No observations received for >90 minutes.", reco: "Check station connectivity and power." },
  { id: 5, severity: "medium", title: "AWS-HYD-06 · Frozen Humidity", time: "07:22 IST", body: "Humidity unchanged for 4+ hours while other parameters vary.", reco: "Inspect humidity sensor; check for debris / condensation." },
  { id: 6, severity: "medium", title: "AWS-BLR-03 · Pressure Drift", time: "06:30 IST", body: "Gradual downward drift over 48 hours.", reco: "Monitor drift; schedule calibration check." },
  { id: 7, severity: "low", title: "AWS-PAT-14 · Humidity Trend", time: "Yesterday", body: "Mild drift relative to regional pattern.", reco: "Continue monitoring; no immediate action." },
];

// Investigation cases (core differentiator demo)
const CASES = {
  case1: {
    title: "Temperature Spike at AWS-DEL-01",
    assessment: "Likely Sensor Fault",
    confidence: 96,
    severity: "HIGH",
    observed: { temp: 54.8, pressure: 1008.2, humidity: 41 },
    nearby: [
      { id: "AWS-CHD-11", temp: 29.4 },
      { id: "AWS-JAI-07", temp: 34.6 },
      { id: "AWS-LKO-08", temp: 32.1 },
    ],
    ml: { score: 0.91, type: "Spike" },
    health: { temp: 42, pressure: 88, humidity: 91, overall: 42 },
    evidence: [
      { kind: "support", text: "Sudden temperature jump (+22°C in 15 min) — classic spike pattern" },
      { kind: "support", text: "Historical pattern mismatch: station rarely exceeds 42°C in September" },
      { kind: "support", text: "Nearby stations remain 29–35°C — strong spatial outlier" },
      { kind: "support", text: "Pressure & humidity comparatively stable — multivariate inconsistency" },
      { kind: "support", text: "Temperature sensor health declining over last 14 days" },
      { kind: "neutral", text: "No communication gaps detected in the last 24 hours" },
    ],
    xai: "The LSTM Autoencoder produced a reconstruction error of 0.91 (threshold 0.55). SHAP-style contribution analysis attributes the high anomaly score primarily to the temperature channel. Spatial comparison shows the observation is an extreme local outlier. Multivariate consistency is low (pressure/humidity do not support extreme heat). Combined with declining temperature sensor health, the system assesses this as a <strong>likely sensor fault</strong> rather than a genuine regional weather event.",
    reco: "Inspect temperature sensor at AWS-DEL-01. Verify physical condition, cabling, and last calibration date. Do not overwrite the official observation; flag for QC review."
  },
  case2: {
    title: "Regional Heat Spike — Multiple Stations",
    assessment: "Genuine Weather Event",
    confidence: 88,
    severity: "LOW",
    observed: { temp: 41.5, pressure: 998.4, humidity: 22 },
    nearby: [
      { id: "AWS-JAI-07", temp: 41.2 },
      { id: "AWS-AMD-09", temp: 40.8 },
      { id: "AWS-DEL-01", temp: 40.1 },
    ],
    ml: { score: 0.62, type: "Spike" },
    health: { temp: 94, pressure: 91, humidity: 89, overall: 92 },
    evidence: [
      { kind: "against", text: "Multiple nearby stations show similar elevated temperatures (40–42°C)" },
      { kind: "against", text: "Humidity is correspondingly low (22%) — physically consistent with heat" },
      { kind: "against", text: "Pressure drop mild and consistent across region" },
      { kind: "support", text: "ML score elevated (0.62) because value is rare for this station historically" },
      { kind: "against", text: "Sensor health is excellent across parameters" },
      { kind: "neutral", text: "Event aligns with known heat-wave climatology for the region" },
    ],
    xai: "Although the observation is unusual relative to the station’s recent history (reconstruction error 0.62), spatial analysis shows a coherent regional pattern. Multivariate signals (low humidity, slight pressure drop) are consistent with a genuine heat event. Sensor health scores are high. Therefore AtmosAi classifies this as a <strong>genuine weather event</strong> and does not recommend sensor maintenance.",
    reco: "No sensor action required. Continue monitoring. Log as validated extreme weather observation."
  },
  case3: {
    title: "Frozen Humidity — AWS-HYD-06",
    assessment: "Likely Sensor Fault",
    confidence: 94,
    severity: "MEDIUM",
    observed: { temp: 29.8, pressure: 948.3, humidity: 55 },
    nearby: [
      { id: "AWS-BLR-03", humidity: 62 },
      { id: "AWS-CHN-04", humidity: 71 },
      { id: "AWS-COI-24", humidity: 64 },
    ],
    ml: { score: 0.84, type: "Frozen" },
    health: { temp: 90, pressure: 87, humidity: 48, overall: 68 },
    evidence: [
      { kind: "support", text: "Humidity value unchanged for 4 hours 12 minutes (persistence check failed)" },
      { kind: "support", text: "Temperature and pressure continue to vary normally" },
      { kind: "support", text: "Nearby stations show fluctuating humidity (62–71%)" },
      { kind: "support", text: "Humidity sensor health score dropped to 48%" },
      { kind: "neutral", text: "No communication errors; station is online" },
    ],
    xai: "Traditional QC persistence check and the LSTM sequence model both flag the humidity channel. The value is locked while other parameters evolve — a classic frozen/stuck sensor signature. Spatial comparison further supports a local sensor issue. AtmosAi assesses this as a <strong>likely frozen humidity sensor</strong>.",
    reco: "Inspect humidity sensor for obstruction, moisture ingress, or electronics fault. Schedule maintenance if confirmed."
  }
};
