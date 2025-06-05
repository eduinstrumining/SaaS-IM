const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// --- Empresas (COMPANIES) ---
export async function fetchCompanies() {
  const res = await fetch(`${API_BASE}/companies`);
  if (!res.ok) throw new Error("No se pudieron obtener las empresas");
  return await res.json();
}

// --- Login (requiere companyId) ---
export async function loginUser(email, password, companyId) {
  const res = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, company_id: companyId }),
  });
  if (!res.ok) {
    // Captura el mensaje del backend si existe
    let msg = "Login failed";
    try {
      const err = await res.json();
      msg = err.error || msg;
    } catch { /* ignora */ }
    throw new Error(msg);
  }
  const data = await res.json();
  return data.token;
}

// --- Listar cámaras ---
export async function fetchCameras(token) {
  const res = await fetch(`${API_BASE}/cameras`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    let msg = "Error al obtener cámaras";
    try {
      const err = await res.json();
      if (err.error && err.error.includes("Token")) {
        msg = "Tu sesión expiró. Por favor, inicia sesión nuevamente.";
      } else if (err.error) {
        msg = err.error;
      }
    } catch { /* ignora */ }
    throw new Error(msg);
  }
  return await res.json();
}

// --- Estado de cámara (zonas/histórico) ---
export async function fetchCameraStatus(cameraId, token, desde, hasta) {
  const params = new URLSearchParams();
  if (desde) params.append("desde", desde);
  if (hasta) params.append("hasta", hasta);
  const res = await fetch(`${API_BASE}/cameras/${cameraId}/status?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    let msg = "Error al obtener datos de la cámara";
    try {
      const err = await res.json();
      if (err.error && err.error.includes("Token")) {
        msg = "Tu sesión expiró. Por favor, inicia sesión nuevamente.";
      } else if (err.error) {
        msg = err.error;
      }
    } catch { /* ignora */ }
    throw new Error(msg);
  }
  return await res.json();
}

// --- Usuarios (para User Management) ---
export async function fetchUsers(token) {
  const res = await fetch(`${API_BASE}/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    let msg = "Error al obtener usuarios";
    try {
      const err = await res.json();
      if (err.error && err.error.includes("Token")) {
        msg = "Tu sesión expiró. Por favor, inicia sesión nuevamente.";
      } else if (err.error) {
        msg = err.error;
      }
    } catch { /* ignora */ }
    throw new Error(msg);
  }
  return await res.json();
}

// --- Crear usuario (para User Management) ---
export async function createUser(userData, token) {
  const res = await fetch(`${API_BASE}/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(userData),
  });
  if (!res.ok) {
    let msg = "No se pudo crear el usuario";
    try {
      const err = await res.json();
      msg = err.error || msg;
    } catch { /* ignora */ }
    throw new Error(msg);
  }
  return await res.json();
}

// --- Actualizar usuario ---
export async function updateUser(userId, userData, token) {
  const res = await fetch(`${API_BASE}/users/${userId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(userData),
  });
  if (!res.ok) {
    let msg = "Error al actualizar usuario";
    try {
      const err = await res.json();
      msg = err.error || msg;
    } catch {}
    throw new Error(msg);
  }
  return await res.json();
}

// --- Eliminar usuario ---
export async function deleteUser(userId, token) {
  const res = await fetch(`${API_BASE}/users/${userId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    let msg = "Error al eliminar usuario";
    try {
      const err = await res.json();
      msg = err.error || msg;
    } catch {}
    throw new Error(msg);
  }
  return await res.json();
}

// --- Alertas de dispositivos (Device Alerts) ---
export async function fetchDeviceAlerts(token) {
  const res = await fetch(`${API_BASE}/device-alerts`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    let msg = "Error al obtener alertas de dispositivos";
    try {
      const err = await res.json();
      if (err.error && err.error.includes("Token")) {
        msg = "Tu sesión expiró. Por favor, inicia sesión nuevamente.";
      } else if (err.error) {
        msg = err.error;
      }
    } catch { /* ignora */ }
    throw new Error(msg);
  }
  return await res.json();
}

// --- Crear alerta dispositivo (Device Alert) ---
export async function createDeviceAlert(alertData, token) {
  const res = await fetch(`${API_BASE}/device-alerts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(alertData),
  });
  if (!res.ok) {
    let msg = "No se pudo crear la alerta de dispositivo";
    try {
      const err = await res.json();
      msg = err.error || msg;
    } catch {}
    throw new Error(msg);
  }
  return await res.json();
}

// --- Crear alerta zona (Zone Alert) ---
export async function createZoneAlert(alertData, token) {
  const res = await fetch(`${API_BASE}/zone-alerts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(alertData),
  });
  if (!res.ok) {
    let msg = "No se pudo crear la alerta de zona";
    try {
      const err = await res.json();
      msg = err.error || msg;
    } catch {}
    throw new Error(msg);
  }
  return await res.json();
}

// --- Obtener dispositivos con zonas (para Alerts.jsx) ---
export async function fetchDevicesWithZones(token) {
  const res = await fetch(`${API_BASE}/devices`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    let msg = "Error al obtener dispositivos con zonas";
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
