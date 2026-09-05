// AtmosAi Operational Prototype
// SIH26073 — Detect. Explain. Protect.

(function () {
  "use strict";

  // ============================================================
  // LOGIN / LOGOUT
  // ============================================================

  const loginScreen = document.getElementById("login-screen");
  const app = document.getElementById("app");
  const loginForm = document.getElementById("login-form");

  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
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
    const anomalies = ANOMALIES || [];
    let csv = 'Time,Station,Parameter,Value,Type,Severity,Confidence,Assessment\n';
    anomalies.forEach(a => {
      csv += `${a.time},${a.station},${a.param},${a.value},${a.type},${a.severity},${a.conf},${a.assessment}\n`;
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
  // KPIs
  // ============================================================

  function computeKPIs() {
    const states = Object.values(STATION_STATE);
    const total = states.length;
    const healthy = states.filter((s) => s.status === "healthy").length;
    const warning = states.filter((s) => s.status === "warning").length;
    const critical = states.filter((s) => s.status === "critical").length;
    const avgHealth = Math.round(states.reduce((a, s) => a + s.health, 0) / total);
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
    if (kpiAnomalies) kpiAnomalies.textContent = ANOMALIES.length;
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

    STATIONS.forEach((st) => {
      const state = STATION_STATE[st.id] || { status: "healthy", health: 90 };
      const color =
        state.status === "critical" ? "#ef4444" :
        state.status === "warning" ? "#f59e0b" : "#22c55e";
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
        Status: <b style="color:${color}">${state.status.toUpperCase()}</b><br/>
        Health: ${state.health}%<br/>
        Temp: ${state.temp ?? "—"}°C
      `);
      marker.on("click", () => openStationModal(st.id));
    });
  }

  // ============================================================
  // STATIONS TABLE (with Search & Filter)
  // ============================================================

  function renderStations(search = '', statusFilter = 'all') {
    const tbody = document.querySelector('#stations-table tbody');
    if (!tbody) return;
    const q = search.toLowerCase();
    tbody.innerHTML = '';
    
    const filtered = STATIONS.filter(s => {
      const state = STATION_STATE[s.id];
      const matchesSearch = !q || s.id.toLowerCase().includes(q) || s.name.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || (state && state.status === statusFilter);
      return matchesSearch && matchesStatus;
    });
    
    filtered.forEach((st) => {
      const state = STATION_STATE[st.id] || { status: 'unknown', health: 0 };
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${st.id}</strong></td>
        <td>${st.name}<br/><span style="color:var(--muted);font-size:11px">${st.region}</span></td>
        <td>${st.lat.toFixed(2)}, ${st.lon.toFixed(2)}</td>
        <td>${state.temp != null ? state.temp + "°C" : "—"}</td>
        <td>${state.pressure != null ? state.pressure : "—"}</td>
        <td>${state.humidity != null ? state.humidity + "%" : "—"}</td>
        <td>${state.health || 0}%</td>
        <td><span class="status-pill ${state.status || 'unknown'}">${state.status || 'unknown'}</span></td>
        <td><button class="btn-secondary" data-station="${st.id}">Inspect</button></td>
      `;
      tbody.appendChild(tr);
    });
    
    tbody.querySelectorAll("[data-station]").forEach((btn) => {
      btn.addEventListener("click", () => openStationModal(btn.dataset.station));
    });
  }

  document.getElementById("station-search")?.addEventListener("input", (e) => {
    const filter = document.getElementById("status-filter");
    renderStations(e.target.value, filter ? filter.value : 'all');
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
    const data = ANOMALIES || [];
    data.filter((a) => filter === "all" || a.type === filter).forEach((a) => {
      const tr = document.createElement("tr");
      const sevClass =
        a.severity === "CRITICAL" ? "critical" :
        a.severity === "HIGH" ? "critical" :
        a.severity === "MEDIUM" ? "warning" : "healthy";
      tr.innerHTML = `
        <td>${a.time}</td>
        <td><strong>${a.station}</strong></td>
        <td>${a.param}</td>
        <td>${a.value}</td>
        <td>${a.type}</td>
        <td><span class="status-pill ${sevClass}">${a.severity}</span></td>
        <td>${a.conf}%</td>
        <td>${a.assessment}</td>
        <td><button class="btn-secondary" data-invest="${a.station}">Investigate</button></td>
      `;
      tbody.appendChild(tr);
    });
    tbody.querySelectorAll("[data-invest]").forEach((btn) => {
      btn.addEventListener("click", () => {
        showView("investigate");
        if (btn.dataset.invest === "AWS-DEL-01" || btn.dataset.invest === "AWS-VAR-21") {
          document.getElementById("case-select").value = "case1";
        } else if (btn.dataset.invest === "AWS-HYD-06") {
          document.getElementById("case-select").value = "case3";
        } else {
          document.getElementById("case-select").value = "case2";
        }
        renderCase(document.getElementById("case-select").value);
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
    const data = ALERTS || [];
    data.slice(0, limit).forEach((a) => {
      const div = document.createElement("div");
      div.className = `alert-item ${a.severity}`;
      div.innerHTML = `
        <div class="alert-top">
          <span class="alert-title">${a.title}</span>
          <span class="alert-time">${a.time}</span>
        </div>
        <div class="alert-body">${a.body}</div>
        <div class="alert-reco">→ ${a.reco}</div>
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
    STATIONS.forEach((st) => {
      const state = STATION_STATE[st.id] || { health: 85, fault: null };
      const tempH = Math.max(20, state.health + (state.fault === "Spike" || state.fault === "Calibration" ? -30 : 5));
      const presH = Math.max(40, state.health + (state.fault === "Drift" ? -20 : 0));
      const humH = Math.max(30, state.health + (state.fault === "Frozen" ? -35 : 0));
      const overall = state.health || 85;
      const drift = state.fault === "Drift" || state.fault === "Calibration"
        ? "Active drift"
        : overall < 70 ? "Watch" : "Stable";
      const trend = overall < 60 ? "↓ Declining" : overall < 80 ? "→ Stable" : "↑ Good";
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong>${st.id}</strong></td>
        <td>${Math.min(99, tempH)}%</td>
        <td>${Math.min(99, presH)}%</td>
        <td>${Math.min(99, humH)}%</td>
        <td><strong>${overall}%</strong></td>
        <td>${drift}</td>
        <td>${trend}</td>
      `;
      tbody.appendChild(tr);
    });
    
    const healthTemp = document.getElementById("health-temp");
    const healthPres = document.getElementById("health-pres");
    const healthHum = document.getElementById("health-hum");
    if (healthTemp) healthTemp.textContent = "91%";
    if (healthPres) healthPres.textContent = "88%";
    if (healthHum) healthHum.textContent = "84%";
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
            label: "AWS-DEL-01 Temp Sensor Health",
            data: [92, 88, 81, 72, 61, 50, 42],
            borderColor: "#ef4444",
            tension: 0.3,
            fill: false,
          },
          {
            label: "Network Average",
            data: [90, 89, 90, 88, 87, 88, 87],
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
  // LIVE STREAM
  // ============================================================

  function randomAround(base, spread = 0.8) {
    if (base == null) return null;
    return +(base + (Math.random() - 0.5) * spread * 2).toFixed(1);
  }

  function pushLiveRow() {
    const tbody = document.querySelector("#live-table tbody");
    if (!tbody) return;
    const st = STATIONS[Math.floor(Math.random() * STATIONS.length)];
    const state = STATION_STATE[st.id] || { status: 'healthy' };
    const now = new Date().toLocaleTimeString("en-IN", { hour12: false });
    let temp = state.temp != null ? randomAround(state.temp) : null;
    let pressure = state.pressure != null ? randomAround(state.pressure, 1.2) : null;
    let humidity = state.humidity != null ? Math.round(randomAround(state.humidity, 2)) : null;

    let qc = "PASS";
    let ml = (0.1 + Math.random() * 0.25).toFixed(2);
    let status = "normal";
    let isAnomaly = false;
    
    if (state.status === "critical" && Math.random() > 0.4) {
      qc = "FAIL";
      ml = (0.75 + Math.random() * 0.2).toFixed(2);
      status = "anomaly";
      isAnomaly = true;
      if (state.fault === "Spike") {
        temp = +(40 + Math.random() * 18).toFixed(1);
      } else if (state.fault === "Frozen") {
        humidity = 55;
      } else if (state.fault === "Calibration") {
        temp = +(38 + Math.random() * 6).toFixed(1);
      }
    } else if (state.status === "warning" && Math.random() > 0.6) {
      qc = "WARN";
      ml = (0.45 + Math.random() * 0.25).toFixed(2);
      status = "anomaly";
      isAnomaly = true;
    }

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${now}</td>
      <td><strong>${st.id}</strong></td>
      <td>${temp != null ? temp : "—"}</td>
      <td>${pressure != null ? pressure : "—"}</td>
      <td>${humidity != null ? humidity : "—"}</td>
      <td>${qc}</td>
      <td>${ml}</td>
      <td><span class="status-pill ${status}">${status === "anomaly" ? "ANOMALY" : "NORMAL"}</span></td>
    `;
    tbody.insertBefore(tr, tbody.firstChild);
    while (tbody.children.length > 12) tbody.removeChild(tbody.lastChild);
    
    if (isAnomaly) {
      showToast(`🚨 Anomaly detected at ${st.id}!`, 'error');
      playAlertSound();
    }
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
      pushLiveRow();
      streamInterval = setInterval(pushLiveRow, 2200);
      btn.textContent = "⏹ Stop Simulation";
      showToast('▶️ Live stream started!', 'success');
    }
  });

  // ============================================================
  // INVESTIGATION
  // ============================================================

  function renderCase(key) {
    const c = CASES[key];
    if (!c) return;
    const isFault = c.assessment.includes("Sensor Fault") || c.assessment.includes("Communication");
    const summaryEl = document.getElementById("case-summary");
    if (summaryEl) {
      summaryEl.innerHTML = `
        <h4>${c.title}</h4>
        <p style="color:var(--muted);font-size:13px">Demo case — synthetic scenario for SIH evaluation of Event vs Sensor Fault engine.</p>
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
          <div class="assessment-item">
            <label>Fault Type</label>
            <strong>${c.ml.type}</strong>
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
    showToast('✅ Recommendation accepted and logged!', 'success');
    alert("Recommendation accepted and logged.\n\nHuman decision recorded. Observation remains unchanged (human-in-the-loop).");
  });
  
  document.getElementById("override-btn")?.addEventListener("click", () => {
    showToast('⚠️ Operator override recorded!', 'warning');
    alert("Operator override recorded.\n\nYou may mark this as genuine weather or request further investigation. Official data is never auto-overwritten.");
  });
  
  document.getElementById("mark-review")?.addEventListener("click", () => {
    showToast('📋 Case marked for review!', 'info');
    alert("Case marked for senior review. Ticket created in ops queue.");
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
    const st = STATIONS.find((s) => s.id === id);
    const state = STATION_STATE[id];
    if (!st) return;
    const body = document.getElementById("modal-body");
    if (!body) return;
    body.innerHTML = `
      <h3 style="margin-bottom:8px">${st.id} — ${st.name}</h3>
      <p style="color:var(--muted);font-size:13px;margin-bottom:16px">${st.region} · ${st.lat}, ${st.lon}</p>
      <div class="assessment-row" style="margin-bottom:16px">
        <div class="assessment-item"><label>Status</label><strong class="status-pill ${state.status}">${state.status}</strong></div>
        <div class="assessment-item"><label>Health</label><strong>${state.health}%</strong></div>
        <div class="assessment-item"><label>Active Fault</label><strong>${state.fault || "None"}</strong></div>
      </div>
      <dl class="case-context">
        <dt>Temperature</dt><dd>${state.temp != null ? state.temp + "°C" : "No data"}</dd>
        <dt>Pressure</dt><dd>${state.pressure != null ? state.pressure + " hPa" : "No data"}</dd>
        <dt>Humidity</dt><dd>${state.humidity != null ? state.humidity + "%" : "No data"}</dd>
      </dl>
      <p style="margin-top:16px;font-size:12px;color:var(--muted)">Simulated reading for prototype demonstration. Production system would stream live AWS observations.</p>
      <button class="btn-primary" style="margin-top:16px;width:auto" id="modal-investigate">Open Investigation</button>
    `;
    const modal = document.getElementById("station-modal");
    if (modal) modal.classList.remove("hidden");
    document.getElementById("modal-investigate")?.addEventListener("click", () => {
      if (modal) modal.classList.add("hidden");
      showView("investigate");
      if (id === "AWS-DEL-01" || id === "AWS-VAR-21") {
        document.getElementById("case-select").value = "case1";
      } else if (id === "AWS-HYD-06") {
        document.getElementById("case-select").value = "case3";
      } else {
        document.getElementById("case-select").value = "case2";
      }
      renderCase(document.getElementById("case-select").value);
    });
  }

  document.getElementById("modal-close")?.addEventListener("click", () => {
    document.getElementById("station-modal")?.classList.add("hidden");
  });
  document.getElementById("station-modal")?.addEventListener("click", (e) => {
    if (e.target.id === "station-modal") e.target.classList.add("hidden");
  });

  // ============================================================
  // AUTO-REFRESH
  // ============================================================

  function fetchAllData() {
    computeKPIs();
    renderAnomalies(document.getElementById("anomaly-filter")?.value || 'all');
    renderAlerts("recent-alerts", 5);
    renderAlerts("alerts-full");
    renderHealthTable();
  }

  // Auto-refresh every 30 seconds
  setInterval(() => {
    fetchAllData();
    console.log('🔄 Dashboard auto-refreshed at', new Date().toLocaleTimeString());
  }, 30000);

  // ============================================================
  // INIT
  // ============================================================

  function initApp() {
    updateClock();
    setInterval(updateClock, 1000);
    computeKPIs();
    setTimeout(initMap, 100);
    renderStations();
    renderAnomalies();
    renderAlerts("recent-alerts", 5);
    renderAlerts("alerts-full");
    renderHealthTable();
    for (let i = 0; i < 5; i++) pushLiveRow();
    showToast('🌤️ AtmosAi initialized successfully!', 'success');
  }
})();