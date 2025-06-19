// src/api.js

export const API_BASE =
  import.meta.env.VITE_API_BASE ||
  process.env.REACT_APP_API_BASE ||
  "http://localhost:5000/api";

// --- LOGIN ---
export async function loginUser(email, password) {
  const res = await fetch(${API_BASE}/login, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error("Credenciales inválidas");
  return await res.json();
}

// --- LISTA DE CÁMARAS ---
export async function fetchCameras(token) {
  const res = await fetch(${API_BASE}/cameras, {
    headers: { Authorization: Bearer ${token} },
  });
  if (!res.ok) throw new Error("Error al obtener cámaras");
  return await res.json();
}

// --- ZONAS POR CÁMARA ---
export async function fetchZonesByCamera(cameraId, token) {
  const res = await fetch(${API_BASE}/cameras/${cameraId}/zonas, {
    headers: { Authorization: Bearer ${token} },
  });
  if (!res.ok) throw new Error("Error al obtener zonas");
  return await res.json();
}

// --- ALIAS PARA COMPATIBILIDAD LEGACY ---
export const fetchCameraZones = fetchZonesByCamera;

// --- STATUS HISTÓRICO (para gráficos, rango de fechas, detalle) ---
export async function fetchCameraStatus(cameraId, token, desde, hasta) {
  let url = ${API_BASE}/cameras/${cameraId}/status;
  if (desde && hasta) {
    url += ?desde=${encodeURIComponent(desde)}&hasta=${encodeURIComponent(hasta)};
  }
  const res = await fetch(url, {
    headers: { Authorization: Bearer ${token} },
  });
  if (!res.ok) throw new Error("Error al obtener datos históricos de la cámara");
  return await res.json();
}

// --- NUEVO: RESUMEN RÁPIDO PARA DASHBOARD ---
export async function fetchCameraSummary(cameraId, token) {
  const res = await fetch(${API_BASE}/cameras/${cameraId}/summary, {
    headers: { Authorization: Bearer ${token} },
  });
  if (!res.ok) {
    let msg = "Error al obtener el resumen de la cámara";
    try {
      const err = await res.json();
      if (err.error && err.error.includes("Token")) {
        msg = "Tu sesión expiró. Por favor, inicia sesión nuevamente.";
      } else if (err.error) {
        msg = err.error;
      }
    } catch {}
    throw new Error(msg);
  }
  return await res.json();
}

// --- LISTA DE EMPRESAS ---
export async function fetchCompanies(token) {
  const res = await fetch(${API_BASE}/companies, {
    headers: { Authorization: Bearer ${token} },
  });
  if (!res.ok) throw new Error("Error al obtener empresas");
  return await res.json();
}

// --- USUARIOS ---
export async function fetchUsers(token) {
  const res = await fetch(${API_BASE}/users, {
    headers: { Authorization: Bearer ${token} },
  });
  if (!res.ok) throw new Error("Error al obtener usuarios");
  return await res.json();
}

export async function createUser(user, token) {
  const res = await fetch(${API_BASE}/users, {
    method: "POST",
    headers: {
      Authorization: Bearer ${token},
      "Content-Type": "application/json",
    },
    body: JSON.stringify(user),
  });
  if (!res.ok) throw new Error("Error al crear usuario");
  return await res.json();
}

// --- ALERTAS DE ZONA ---
export async function fetchZoneAlerts(token) {
  const res = await fetch(${API_BASE}/zone-alerts, {
    headers: { Authorization: Bearer ${token} },
  });
  if (!res.ok) throw new Error("Error al obtener alertas de zona");
  return await res.json();
}

export async function createZoneAlert(alert, token) {
  const res = await fetch(${API_BASE}/zone-alerts, {
    method: "POST",
    headers: {
      Authorization: Bearer ${token},
      "Content-Type": "application/json",
    },
    body: JSON.stringify(alert),
  });
  if (!res.ok) throw new Error("Error al crear alerta de zona");
  return await res.json();
}

export async function updateZoneAlert(alertId, alert, token) {
  const res = await fetch(${API_BASE}/zone-alerts/${alertId}, {
    method: "PUT",
    headers: {
      Authorization: Bearer ${token},
      "Content-Type": "application/json",
    },
    body: JSON.stringify(alert),
  });
  if (!res.ok) throw new Error("Error al actualizar alerta de zona");
  return await res.json();
}

export async function deleteZoneAlert(alertId, token) {
  const res = await fetch(${API_BASE}/zone-alerts/${alertId}, {
    method: "DELETE",
    headers: { Authorization: Bearer ${token} },
  });
  if (!res.ok) throw new Error("Error al eliminar alerta de zona");
  return await res.json();
}

// --- ALERTAS DE DISPOSITIVO ---
export async function fetchDeviceAlerts(token) {
  const res = await fetch(${API_BASE}/device-alerts, {
    headers: { Authorization: Bearer ${token} },
  });
  if (!res.ok) throw new Error("Error al obtener alertas de dispositivo");
  return await res.json();
}

export async function createDeviceAlert(alert, token) {
  const res = await fetch(${API_BASE}/device-alerts, {
    method: "POST",
    headers: {
      Authorization: Bearer ${token},
      "Content-Type": "application/json",
    },
    body: JSON.stringify(alert),
  });
  if (!res.ok) throw new Error("Error al crear alerta de dispositivo");
  return await res.json();
}

export async function updateDeviceAlert(alertId, alert, token) {
  const res = await fetch(${API_BASE}/device-alerts/${alertId}, {
    method: "PUT",
    headers: {
      Authorization: Bearer ${token},
      "Content-Type": "application/json",
    },
    body: JSON.stringify(alert),
  });
  if (!res.ok) throw new Error("Error al actualizar alerta de dispositivo");
  return await res.json();
}

export async function deleteDeviceAlert(alertId, token) {
  const res = await fetch(${API_BASE}/device-alerts/${alertId}, {
    method: "DELETE",
    headers: { Authorization: Bearer ${token} },
  });
  if (!res.ok) throw new Error("Error al eliminar alerta de dispositivo");
  return await res.json();
}

// --- HISTORIAL DE EVENTOS DE ALERTA POR ZONA ---
export async function fetchZoneAlertEvents(zoneId, token) {
  const res = await fetch(${API_BASE}/zones/${zoneId}/alert-events, {
    headers: { Authorization: Bearer ${token} },
  });
  if (!res.ok) throw new Error("Error al obtener eventos de alerta de zona");
  return await res.json();
}