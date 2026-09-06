// AtmosAi Operational Prototype
// SIH26073 — Detect. Explain. Protect.

(function () {
  "use strict";

  // ============================================================
  // API CONFIGURATION
  // ============================================================
  
  const API_URL = 'http://localhost:8000/api';
  const WS_URL = 'ws://localhost:8000/ws/live';

  // ============================================================
  // GLOBAL DATA (will be populated from API)
  // ============================================================
  
  let dashboardData = null;
  let anomalyData = [];
  let stationData = [];
  let healthData = {};

  // ============================================================
  // LOGIN / LOGOUT
  // ============================================================

  const loginScreen = document.getElementById("login-screen");
  const app = document.getElementById("app");
  const loginForm = document.getElementById("login-form");

  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    console.log('✅ Login clicked');
    loginScreen.classList.add("hidden");
    app.classList.remove("hidden");
    initApp();
  });

  document.getElementById("logout-btn").addEventListener("click", () => {
    app.classList.add("hidden");
    loginScreen.classList.remove("hidden");
  });

  // ============================================================
  // CLOCK & CONNECTION STATUS
  // ============================================================

  function updateClock() {
    const now = new Date();
    const clockEl = document.getElementById('live-clock');
    if (clockEl) {
      clockEl.textContent = now.toLocaleString('en-IN', { 
        timeZone: 'Asia/Kolkata', 
        hour12: false,
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    }
  }
  setInterval(updateClock, 1000);
  updateClock();

  function updateConnectionStatus() {
    const status = document.getElementById('connection-status');
    if (status) {
      status.textContent = '🟢 Connected';
      status.style.color = '#22c55e';
    }
  }
  updateConnectionStatus();

  // ============================================================
  // TOAST NOTIFICATIONS
  // ============================================================

  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const colors = {
      info: '#38bdf8',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444'
    };
    
    const toast = document.createElement('div');
    toast.style.cssText = `
      background: #1f2937;
      border: 1px solid ${colors[type] || colors.info};
      border-left: 4px solid ${colors[type] || colors.info};
      padding: 12px 20px;
      border-radius: 8px;
      color: #e2e8f0;
      font-size: 14px;
      min-width: 280px;
      max-width: 400px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
      animation: slideIn 0.3s ease;
    `;
    toast.textContent = message;
    container.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // ============================================================
  // ALERT SOUND
  // ============================================================

  function playAlertSound() {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoAAACBhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqF');
      audio.play();
    } catch(e) {
      console.log('Audio not supported');
    }
  }

  // ============================================================
  // NAVIGATION
  // ============================================================

  const views = document.querySelectorAll(".view");
  const navItems = document.querySelectorAll(".nav-item");
  const titleMap = {
    dashboard: "Operational Dashboard",
    stations: "AWS Station Inventory",
    anomalies: "Anomaly History",
    alerts: "Alert Center",
    health: "Sensor Health & Drift",
    investigate: "Case Investigation (Event vs Fault)",
    analytics: "Analytics & Model Snapshot",
  };

  function showView(name) {
    views.forEach((v) => v.classList.remove("active"));
    navItems.forEach((n) => n.classList.remove("active"));
    const view = document.getElementById("view-" + name);
    if (view) view.classList.add("active");
    document.querySelector(`.nav-item[data-view="${name}"]`)?.classList.add("active");
    const titleEl = document.getElementById("view-title");
    if (titleEl) titleEl.textContent = titleMap[name] || name;
    if (name === "investigate") renderCase(document.getElementById("case-select").value);
    if (name === "analytics") renderCharts();
    if (name === "health") renderHealthChart();
  }

  navItems.forEach((btn) => {
    btn.addEventListener("click", () => showView(btn.dataset.view));
  });
  document.querySelectorAll("[data-view]").forEach((el) => {
    if (el.tagName === "BUTTON" && !el.classList.contains("nav-item")) {
      el.addEventListener("click", () => showView(el.dataset.view));
    }
  });

  // ============================================================
  // EXPORT REPORT (CSV)
  // ============================================================

  window.exportReport = function() {
    const data = anomalyData || [];
    let csv = 'Time,Station,Parameter,Value,Type,Severity,Confidence,Assessment\n';
    data.forEach(a => {
      csv += `${a.time || a.timestamp || ''},${a.station || a.station_id || ''},${a.param || 'Temperature'},${a.value || a.temperature || ''},${a.type || a.fault_type || ''},${a.severity || 'LOW'},${a.conf || (a.confidence ? Math.round(a.confidence * 100) : 0)},${a.assessment || (a.is_anomaly ? 'Anomaly' : 'Normal')}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AtmosAi_Report_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('📥 Report exported successfully!', 'success');
  };

  // ============================================================
  // API CALLS
  // ============================================================

  async function fetchDashboard() {
    const response = await fetch(`${API_URL}/dashboard`);
    return await response.json();
  }

  async function fetchStations() {
    const response = await fetch(`${API_URL}/stations`);
    const data = await response.json();
    return data.stations || [];
  }

  async function fetchAnomalies() {
    const response = await fetch(`${API_URL}/anomalies`);
    const data = await response.json();
    return data.anomalies || [];
  }

  async function fetchSensorHealth() {
    const response = await fetch(`${API_URL}/sensor-health`);
    const data = await response.json();
    return data.sensor_health || {};
  }

  async function submitFeedback(anomaly_id, station_id, user_decision, notes = '') {
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

  async function fetchFeedbackStats() {
    const response = await fetch(`${API_URL}/feedback/stats`);
    return await response.json();
  }

  // ============================================================
  // KPIs
  // ============================================================

  function computeKPIs() {
    const data = dashboardData || { 
      total_stations: 5, 
      station_status: { healthy: 0, warning: 0, critical: 0 },
      active_anomalies: 0,
      avg_sensor_health: 85
    };
    
    const total = data.total_stations || 5;
    const healthy = data.station_status?.healthy || 0;
    const warning = data.station_status?.warning || 0;
    const critical = data.station_status?.critical || 0;
    const avgHealth = data.avg_sensor_health || 85;
    const anomaliesCount = data.active_anomalies || 0;
    
    const kpiTotal = document.getElementById("kpi-total");
    const kpiHealthy = document.getElementById("kpi-healthy");
    const kpiWarning = document.getElementById("kpi-warning");
    const kpiCritical = document.getElementById("kpi-critical");
    const kpiAnomalies = document.getElementById("kpi-anomalies");
    const kpiHealth = document.getElementById("kpi-health");
    
    if (kpiTotal) kpiTotal.textContent = total;
    if (kpiHealthy) kpiHealthy.textContent = healthy;
    if (kpiWarning) kpiWarning.textContent = warning;
    if (kpiCritical) kpiCritical.textContent = critical;
    if (kpiAnomalies) kpiAnomalies.textContent = anomaliesCount;
    if (kpiHealth) kpiHealth.textContent = avgHealth + "%";
  }

  // ============================================================
  // MAP
  // ============================================================

  let map;
  function initMap() {
    if (map) return;
    map = L.map("map", { zoomControl: true }).setView([22.5, 79], 4.5);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: "&copy; OpenStreetMap &copy; CARTO",
      maxZoom: 18,
    }).addTo(map);

    const stations = stationData.length > 0 ? stationData : [
      { id: "AWS001", name: "Delhi", lat: 28.61, lon: 77.23 },
      { id: "AWS002", name: "Mumbai", lat: 19.07, lon: 72.87 },
      { id: "AWS003", name: "Bangalore", lat: 12.97, lon: 77.59 },
      { id: "AWS004", name: "Chennai", lat: 13.08, lon: 80.28 },
      { id: "AWS005", name: "Kolkata", lat: 22.57, lon: 88.36 },
    ];

    stations.forEach((st) => {
      const color = "#22c55e";
      const marker = L.circleMarker([st.lat, st.lon], {
        radius: 8,
        fillColor: color,
        color: "#0f172a",
        weight: 2,
        fillOpacity: 0.95,
      }).addTo(map);
      marker.bindPopup(`
        <strong>${st.id}</strong><br/>
        ${st.name}<br/>
        Status: <b style="color:${color}">ACTIVE</b>
      `);
      marker.on("click", () => openStationModal(st.id));
    });
  }

  // ============================================================
  // STATIONS TABLE
  // ============================================================

  function renderStations(search = '', statusFilter = 'all') {
    const tbody = document.querySelector('#stations-table tbody');
    if (!tbody) return;
    const q = search.toLowerCase();
    tbody.innerHTML = '';
    
    const stations = stationData.length > 0 ? stationData : [
      { id: "AWS001", name: "Delhi", lat: 28.61, lon: 77.23, region: "North" },
      { id: "AWS002", name: "Mumbai", lat: 19.07, lon: 72.87, region: "West" },
      { id: "AWS003", name: "Bangalore", lat: 12.97, lon: 77.59, region: "South" },
      { id: "AWS004", name: "Chennai", lat: 13.08, lon: 80.28, region: "South" },
      { id: "AWS005", name: "Kolkata", lat: 22.57, lon: 88.36, region: "East" },
    ];
    
    const filtered = stations.filter(s => {
      const matchesSearch = !q || s.id.toLowerCase().includes(q) || s.name.toLowerCase().includes(q);
      return matchesSearch;
    });
    
    filtered.forEach((st) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${st.id}</strong></td>
        <td>${st.name}<br/><span style="color:var(--muted);font-size:11px">${st.region || 'India'}</span></td>
        <td>${st.lat.toFixed(2)}, ${st.lon.toFixed(2)}</td>
        <td>—</td>
        <td>—</td>
        <td>—</td>
        <td>85%</td>
        <td><span class="status-pill healthy">healthy</span></td>
        <td><button class="btn-secondary" data-station="${st.id}">Inspect</button></td>
      `;
      tbody.appendChild(tr);
    });
    
    tbody.querySelectorAll("[data-station]").forEach((btn) => {
      btn.addEventListener("click", () => openStationModal(btn.dataset.station));
    });
  }

  document.getElementById("station-search")?.addEventListener("input", (e) => {
    renderStations(e.target.value);
  });

  document.getElementById("status-filter")?.addEventListener("change", (e) => {
    const search = document.getElementById("station-search");
    renderStations(search ? search.value : '', e.target.value);
  });

  // ============================================================
  // ANOMALIES
  // ============================================================

  function renderAnomalies(filter = "all") {
    const tbody = document.querySelector("#anomalies-table tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    
    const data = anomalyData || [];
    const filtered = data.filter((a) => filter === "all" || a.type === filter || a.fault_type === filter);
    
    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;color:var(--muted);padding:20px;">✅ No anomalies detected</td></tr>`;
      return;
    }
    
    filtered.forEach((a, index) => {
      const tr = document.createElement("tr");
      const sevClass = a.severity === "CRITICAL" ? "critical" :
                      a.severity === "HIGH" ? "critical" :
                      a.severity === "MEDIUM" ? "warning" : "healthy";
      
      const time = a.time || a.timestamp || 'N/A';
      const station = a.station || a.station_id || 'Unknown';
      const param = a.param || 'Temperature';
      const value = a.value !== undefined ? a.value : (a.temperature || '—');
      const type = a.type || a.fault_type || 'Unknown';
      const severity = a.severity || 'LOW';
      const conf = a.conf || (a.confidence ? Math.round(a.confidence * 100) : 0);
      const assessment = a.assessment || (a.is_anomaly ? 'Anomaly Detected' : 'Normal');
      
      tr.innerHTML = `
        <td>${time}</td>
        <td><strong>${station}</strong></td>
        <td>${param}</td>
        <td>${typeof value === 'number' ? value.toFixed(1) : value}</td>
        <td>${type}</td>
        <td><span class="status-pill ${sevClass}">${severity}</span></td>
        <td>${conf}%</td>
        <td>${assessment}</td>
        <td>
          <button class="btn-secondary" data-invest="${station}" style="margin-right:4px;font-size:11px;">🔍</button>
          <button class="btn-secondary" data-feedback="confirm" data-id="${a.id || index}" style="font-size:11px;background:rgba(34,197,94,0.1);">✅</button>
          <button class="btn-secondary" data-feedback="reject" data-id="${a.id || index}" style="font-size:11px;background:rgba(239,68,68,0.1);">❌</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
    
    tbody.querySelectorAll("[data-invest]").forEach((btn) => {
      btn.addEventListener("click", () => {
        showView("investigate");
        document.getElementById("case-select").value = "case1";
        renderCase("case1");
      });
    });
    
    tbody.querySelectorAll("[data-feedback]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const action = btn.dataset.feedback;
        const anomalyId = btn.dataset.id;
        const row = btn.closest('tr');
        const station = row.querySelector('td:nth-child(2)')?.textContent || 'unknown';
        
        const decision = action === 'confirm' ? 'confirmed' : 'false_positive';
        try {
          await submitFeedback(anomalyId, station, decision);
          showToast(`✅ Feedback recorded: ${decision}`, 'success');
          updateFeedbackStats();
        } catch (e) {
          showToast('❌ Failed to submit feedback', 'error');
        }
      });
    });
  }

  document.getElementById("anomaly-filter")?.addEventListener("change", (e) => {
    renderAnomalies(e.target.value);
  });

  // ============================================================
  // ALERTS
  // ============================================================

  function renderAlerts(containerId, limit = 100) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = "";
    
    const data = anomalyData || [];
    const limited = data.slice(0, limit);
    
    if (limited.length === 0) {
      el.innerHTML = `<div style="padding:20px;text-align:center;color:var(--muted);">✅ No alerts</div>`;
      return;
    }
    
    limited.forEach((a) => {
      const div = document.createElement("div");
      const severity = a.severity?.toLowerCase() || 'medium';
      div.className = `alert-item ${severity}`;
      div.innerHTML = `
        <div class="alert-top">
          <span class="alert-title">${a.station || a.station_id || 'Unknown'} · ${a.type || a.fault_type || 'Anomaly'}</span>
          <span class="alert-time">${a.time || a.timestamp || 'Now'}</span>
        </div>
        <div class="alert-body">${a.explanation || a.assessment || 'Anomaly detected'}</div>
        <div class="alert-reco">→ ${a.reco || 'Inspect sensor'}</div>
      `;
      el.appendChild(div);
    });
  }

  // ============================================================
  // HEALTH
  // ============================================================

  function renderHealthTable() {
    const tbody = document.querySelector("#health-table tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    
    const stations = stationData.length > 0 ? stationData : [
      { id: "AWS001", name: "Delhi" },
      { id: "AWS002", name: "Mumbai" },
      { id: "AWS003", name: "Bangalore" },
      { id: "AWS004", name: "Chennai" },
      { id: "AWS005", name: "Kolkata" },
    ];
    
    stations.forEach((st) => {
      const health = healthData[st.id] || { temperature: 85, pressure: 88, humidity: 82, overall: 85 };
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong>${st.id}</strong></td>
        <td>${health.temperature || 85}%</td>
        <td>${health.pressure || 88}%</td>
        <td>${health.humidity || 82}%</td>
        <td><strong>${health.overall || 85}%</strong></td>
        <td>Stable</td>
        <td>↑ Good</td>
      `;
      tbody.appendChild(tr);
    });
    
    const healthTemp = document.getElementById("health-temp");
    const healthPres = document.getElementById("health-pres");
    const healthHum = document.getElementById("health-hum");
    if (healthTemp) healthTemp.textContent = "85%";
    if (healthPres) healthPres.textContent = "88%";
    if (healthHum) healthHum.textContent = "82%";
  }

  let healthChart;
  function renderHealthChart() {
    const ctx = document.getElementById("health-chart");
    if (!ctx) return;
    if (healthChart) healthChart.destroy();
    const labels = ["Day -13", "Day -11", "Day -9", "Day -7", "Day -5", "Day -3", "Today"];
    healthChart = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "AWS001 Sensor Health",
            data: [92, 88, 81, 72, 61, 50, 42],
            borderColor: "#ef4444",
            tension: 0.3,
            fill: false,
          },
          {
            label: "Network Average",
            data: [90, 89, 90, 88, 87, 88, 85],
            borderColor: "#38bdf8",
            borderDash: [5, 5],
            tension: 0.3,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { labels: { color: "#94a3b8" } } },
        scales: {
          x: { ticks: { color: "#94a3b8" }, grid: { color: "#1e293b" } },
          y: { min: 0, max: 100, ticks: { color: "#94a3b8" }, grid: { color: "#1e293b" } },
        },
      },
    });
  }

  // ============================================================
  // WEBSOCKET LIVE STREAM
  // ============================================================

  let ws = null;
  let wsConnected = false;

  function connectWebSocket(onMessage, onConnect, onDisconnect) {
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

  function initWebSocket() {
    ws = connectWebSocket(
      (data) => {
        addLiveRow(data);
        if (data.status === 'ANOMALY') {
          showToast(`🚨 Anomaly detected at ${data.station_id}!`, 'error');
          playAlertSound();
        }
      },
      () => {
        wsConnected = true;
        showToast('🌐 Live stream connected!', 'success');
        document.getElementById('connection-status').textContent = '🟢 Connected';
      },
      () => {
        wsConnected = false;
        showToast('❌ Live stream disconnected', 'error');
        document.getElementById('connection-status').textContent = '🔴 Disconnected';
      }
    );
  }

  function addLiveRow(data) {
    const tbody = document.querySelector("#live-table tbody");
    if (!tbody) return;
    
    const now = new Date().toLocaleTimeString("en-IN", { hour12: false });
    const statusClass = data.status === 'ANOMALY' ? 'anomaly' : 'normal';
    const qc = data.status === 'ANOMALY' ? 'FAIL' : 'PASS';
    
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${now}</td>
      <td><strong>${data.station_id}</strong></td>
      <td>${data.temperature || '—'}</td>
      <td>${data.pressure || '—'}</td>
      <td>${data.humidity || '—'}</td>
      <td>${qc}</td>
      <td>${data.anomaly_score?.toFixed(4) || '0.0000'}</td>
      <td><span class="status-pill ${statusClass}">${data.status || 'NORMAL'}</span></td>
    `;
    tbody.insertBefore(tr, tbody.firstChild);
    while (tbody.children.length > 12) tbody.removeChild(tbody.lastChild);
  }

  let streamInterval;
  document.getElementById("simulate-btn")?.addEventListener("click", () => {
    const btn = document.getElementById("simulate-btn");
    if (streamInterval) {
      clearInterval(streamInterval);
      streamInterval = null;
      btn.textContent = "▶ Simulate Live Stream";
      showToast('⏹️ Live stream stopped', 'info');
    } else {
      btn.textContent = "⏹ Stop Simulation";
      showToast('▶️ Live stream started!', 'success');
    }
  });

  // ============================================================
  // INVESTIGATION
  // ============================================================

  function renderCase(key) {
    const cases = {
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
          { kind: "support", text: "Nearby stations remain 29–35°C — strong spatial outlier" },
          { kind: "support", text: "Temperature sensor health declining over last 14 days" },
        ],
        xai: "The anomaly score is high (0.91). Spatial comparison shows the observation is an extreme local outlier. Combined with declining sensor health, the system assesses this as a <strong>likely sensor fault</strong>.",
        reco: "Inspect temperature sensor at AWS-DEL-01. Verify physical condition and calibration."
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
          { kind: "against", text: "Sensor health is excellent across parameters" },
        ],
        xai: "Although unusual, spatial analysis shows a coherent regional pattern. Sensor health scores are high. Therefore AtmosAi classifies this as a <strong>genuine weather event</strong>.",
        reco: "No sensor action required. Continue monitoring."
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
          { kind: "support", text: "Humidity value unchanged for 4+ hours (persistence check failed)" },
          { kind: "support", text: "Temperature and pressure continue to vary normally" },
          { kind: "support", text: "Humidity sensor health score dropped to 48%" },
        ],
        xai: "The value is locked while other parameters evolve — a classic frozen sensor signature. AtmosAi assesses this as a <strong>likely frozen humidity sensor</strong>.",
        reco: "Inspect humidity sensor for obstruction or electronics fault."
      }
    };
    
    const c = cases[key];
    if (!c) return;
    
    const isFault = c.assessment.includes("Sensor Fault");
    const summaryEl = document.getElementById("case-summary");
    if (summaryEl) {
      summaryEl.innerHTML = `
        <h4>${c.title}</h4>
        <p style="color:var(--muted);font-size:13px">Demo case for SIH evaluation of Event vs Sensor Fault engine.</p>
        <div class="assessment-row">
          <div class="assessment-item ${isFault ? "fault" : "event"}">
            <label>Assessment</label>
            <strong>${c.assessment}</strong>
          </div>
          <div class="assessment-item">
            <label>Confidence</label>
            <strong>${c.confidence}%</strong>
          </div>
          <div class="assessment-item">
            <label>Severity</label>
            <strong>${c.severity}</strong>
          </div>
          <div class="assessment-item">
            <label>ML Score</label>
            <strong>${c.ml.score}</strong>
          </div>
        </div>
      `;
    }

    const contextEl = document.getElementById("case-context");
    if (contextEl) {
      contextEl.innerHTML = `
        <dl>
          <dt>Observed Temp</dt><dd>${c.observed.temp}°C</dd>
          <dt>Pressure</dt><dd>${c.observed.pressure} hPa</dd>
          <dt>Humidity</dt><dd>${c.observed.humidity}%</dd>
          <dt>Nearby stations</dt>
          <dd>${c.nearby.map((n) => `${n.id}: ${n.temp != null ? n.temp + "°C" : n.humidity + "% RH"}`).join(" · ")}</dd>
          <dt>Sensor Health</dt>
          <dd>T ${c.health.temp}% · P ${c.health.pressure}% · H ${c.health.humidity}% · Overall ${c.health.overall}%</dd>
        </dl>
      `;
    }

    const evidenceEl = document.getElementById("case-evidence");
    if (evidenceEl) {
      evidenceEl.innerHTML = c.evidence.map(e => `
        <div class="evidence-item">
          <span class="dot ${e.kind}"></span>
          <span>${e.text}</span>
        </div>
      `).join("");
    }

    const xaiEl = document.getElementById("case-xai");
    if (xaiEl) {
      xaiEl.innerHTML = c.xai;
    }

    const recoEl = document.getElementById("case-reco");
    if (recoEl) {
      recoEl.innerHTML = `<strong>Recommended action:</strong> ${c.reco}`;
    }
  }

  document.getElementById("case-select")?.addEventListener("change", (e) => {
    renderCase(e.target.value);
  });

  document.getElementById("accept-reco")?.addEventListener("click", () => {
    showToast('✅ Recommendation accepted!', 'success');
    alert("Recommendation accepted.\n\nHuman decision recorded.");
  });
  
  document.getElementById("override-btn")?.addEventListener("click", () => {
    showToast('⚠️ Override recorded!', 'warning');
    alert("Operator override recorded.");
  });
  
  document.getElementById("mark-review")?.addEventListener("click", () => {
    showToast('📋 Marked for review!', 'info');
    alert("Case marked for senior review.");
  });

  // ============================================================
  // CHARTS
  // ============================================================

  let typeChart, dailyChart;
  function renderCharts() {
    const typeCtx = document.getElementById("anomaly-type-chart");
    const dailyCtx = document.getElementById("anomaly-daily-chart");
    if (!typeCtx || !dailyCtx) return;
    
    if (typeChart) typeChart.destroy();
    if (dailyChart) dailyChart.destroy();

    typeChart = new Chart(typeCtx, {
      type: "doughnut",
      data: {
        labels: ["Spike", "Frozen", "Drift", "Communication", "Calibration"],
        datasets: [{
          data: [4, 1, 2, 1, 2],
          backgroundColor: ["#ef4444", "#f59e0b", "#38bdf8", "#818cf8", "#a78bfa"],
        }],
      },
      options: {
        plugins: { legend: { position: "bottom", labels: { color: "#94a3b8" } } },
      },
    });

    dailyChart = new Chart(dailyCtx, {
      type: "bar",
      data: {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        datasets: [{
          label: "Anomalies",
          data: [3, 5, 2, 7, 4, 6, 11],
          backgroundColor: "rgba(56,189,248,0.6)",
        }],
      },
      options: {
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: "#94a3b8" }, grid: { color: "#1e293b" } },
          y: { ticks: { color: "#94a3b8" }, grid: { color: "#1e293b" } },
        },
      },
    });
  }

  // ============================================================
  // MODAL
  // ============================================================

  function openStationModal(id) {
    const body = document.getElementById("modal-body");
    if (!body) return;
    body.innerHTML = `
      <h3 style="margin-bottom:8px">${id}</h3>
      <p style="color:var(--muted);font-size:13px;margin-bottom:16px">AWS Station</p>
      <div class="assessment-row" style="margin-bottom:16px">
        <div class="assessment-item"><label>Status</label><strong class="status-pill healthy">healthy</strong></div>
        <div class="assessment-item"><label>Health</label><strong>85%</strong></div>
        <div class="assessment-item"><label>Active Fault</label><strong>None</strong></div>
      </div>
      <button class="btn-primary" style="margin-top:16px;width:auto" id="modal-investigate">Open Investigation</button>
    `;
    const modal = document.getElementById("station-modal");
    if (modal) modal.classList.remove("hidden");
    document.getElementById("modal-investigate")?.addEventListener("click", () => {
      if (modal) modal.classList.add("hidden");
      showView("investigate");
      document.getElementById("case-select").value = "case1";
      renderCase("case1");
    });
  }

  document.getElementById("modal-close")?.addEventListener("click", () => {
    document.getElementById("station-modal")?.classList.add("hidden");
  });
  document.getElementById("station-modal")?.addEventListener("click", (e) => {
    if (e.target.id === "station-modal") e.target.classList.add("hidden");
  });

  // ============================================================
  // FETCH DATA FROM API
  // ============================================================

  async function fetchAllData() {
    try {
      console.log('🔄 Fetching data from API...');
      
      const dashboard = await fetchDashboard();
      const anomalies = await fetchAnomalies();
      const stations = await fetchStations();
      const health = await fetchSensorHealth();
      
      dashboardData = dashboard;
      anomalyData = anomalies;
      stationData = stations;
      healthData = health;
      
      console.log('✅ Data fetched:', { dashboard, anomalies, stations, health });
      
      computeKPIs();
      renderAnomalies(document.getElementById("anomaly-filter")?.value || 'all');
      renderAlerts("recent-alerts", 5);
      renderAlerts("alerts-full");
      renderHealthTable();
      updateFeedbackStats();
      
      return { dashboard, anomalies, stations, health };
    } catch (error) {
      console.error('❌ Error fetching data:', error);
      showToast('❌ Failed to fetch data from server', 'error');
      return null;
    }
  }

  // ============================================================
  // FEEDBACK STATS
  // ============================================================

  async function updateFeedbackStats() {
    try {
      const stats = await fetchFeedbackStats();
      document.getElementById('fb-total').textContent = stats.total || 0;
      document.getElementById('fb-confirmed').textContent = stats.confirmed || 0;
      document.getElementById('fb-fp').textContent = stats.false_positives || 0;
      document.getElementById('fb-accuracy').textContent = stats.accuracy + '%' || '0%';
    } catch (e) {
      console.log('Feedback stats not available');
    }
  }

  // ============================================================
  // AUTO-REFRESH
  // ============================================================

  setInterval(() => {
    fetchAllData();
    console.log('🔄 Dashboard auto-refreshed at', new Date().toLocaleTimeString());
  }, 30000);

  // ============================================================
  // INIT
  // ============================================================

  function initApp() {
    console.log('🚀 Initializing AtmosAi...');
    updateClock();
    setInterval(updateClock, 1000);
    
    showToast('🔄 Loading data...', 'info');
    
    fetchAllData().then(() => {
      setTimeout(initMap, 100);
      renderStations();
      renderAnomalies();
      renderAlerts("recent-alerts", 5);
      renderAlerts("alerts-full");
      renderHealthTable();
      updateFeedbackStats();
      showToast('🌤️ AtmosAi ready!', 'success');
    });
    
    initWebSocket();
    console.log('✅ AtmosAi initialized!');
  }
})();