import React, { useState, useEffect } from "react";
import { createDeviceAlert, createZoneAlert } from "../api";

// Helpers fetch para cámaras y zonas (igual a dashboard)
async function fetchCameras(token) {
  const res = await fetch("/api/cameras", {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json();
  // Suponiendo data.cameras (ajusta si la key es distinta)
  return data.cameras || data;
}

async function fetchZonasByCamera(cameraId, token) {
  const res = await fetch(`/api/cameras/${cameraId}/zonas`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json();
  // Suponiendo data.zonas (ajusta si la key es distinta)
  return data.zonas || data;
}

export default function Alerts({ token }) {
  // Cámaras y zonas
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState("");
  const [zonas, setZonas] = useState([]);

  // Campos alertas dispositivo
  const [deviceUpper, setDeviceUpper] = useState("");
  const [deviceLower, setDeviceLower] = useState("");
  const [deviceEmail, setDeviceEmail] = useState("");

  // Campos alertas zona
  const [selectedZone, setSelectedZone] = useState("");
  const [zoneUpper, setZoneUpper] = useState("");
  const [zoneLower, setZoneLower] = useState("");
  const [zoneEmail, setZoneEmail] = useState("");

  // Mensajes UI
  const [alertError, setAlertError] = useState("");
  const [alertSuccess, setAlertSuccess] = useState("");

  // Trae cámaras al cargar
  useEffect(() => {
    if (!token) return;
    fetchCameras(token)
      .then((cams) => setCameras(cams))
      .catch(() => setCameras([]));
  }, [token]);

  // Cuando seleccionas cámara, trae sus zonas
  useEffect(() => {
    if (!selectedCamera) {
      setZonas([]);
      setSelectedZone("");
      return;
    }
    fetchZonasByCamera(selectedCamera, token)
      .then((zonas) => setZonas(zonas))
      .catch(() => setZonas([]));
  }, [selectedCamera, token]);

  // Guardar alerta dispositivo
  const saveDeviceAlert = async () => {
    setAlertError("");
    setAlertSuccess("");
    try {
      await createDeviceAlert(
        {
          device_id: selectedCamera,
          upper_thresh: Number(deviceUpper),
          lower_thresh: Number(deviceLower),
          recipient: deviceEmail,
        },
        token
      );
      setAlertSuccess("Alerta de dispositivo guardada correctamente");
      setDeviceUpper("");
      setDeviceLower("");
      setDeviceEmail("");
      setSelectedCamera("");
      setZonas([]);
      setSelectedZone("");
    } catch (error) {
      setAlertError(error.message || "Error al guardar alerta de dispositivo");
    }
  };

  // Guardar alerta zona
  const saveZoneAlert = async () => {
    setAlertError("");
    setAlertSuccess("");
    try {
      await createZoneAlert(
        {
          zone_id: selectedZone,
          upper_thresh: Number(zoneUpper),
          lower_thresh: Number(zoneLower),
          recipient: zoneEmail,
        },
        token
      );
      setAlertSuccess("Alerta de zona guardada correctamente");
      setZoneUpper("");
      setZoneLower("");
      setZoneEmail("");
      setSelectedZone("");
    } catch (error) {
      setAlertError(error.message || "Error al guardar alerta de zona");
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-6 text-white font-sans">
      <h1 className="text-4xl font-bold mb-2">Alertas</h1>
      <p className="mb-10 text-gray-400 text-lg">
        Configure alertas para cada dispositivo y zona basadas en variaciones de temperatura. Establezca umbrales y especifique las direcciones de correo electrónico de los destinatarios para las notificaciones.
      </p>

      {(alertError || alertSuccess) && (
        <div className={`mb-6 font-semibold ${alertError ? "text-red-500" : "text-green-500"}`}>
          {alertError || alertSuccess}
        </div>
      )}

      {/* Alertas de Dispositivo */}
      <section className="mb-16">
        <h2 className="text-2xl font-semibold mb-6">Alertas de Dispositivo</h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 mb-4">
          <select
            className="bg-[#191C22] rounded-lg px-4 py-3 border border-gray-700 text-white text-lg"
            value={selectedCamera}
            onChange={(e) => setSelectedCamera(Number(e.target.value))}
          >
            <option value="">Seleccione cámara</option>
            {cameras.map((cam) => (
              <option key={cam.camera_id} value={cam.camera_id}>
                {cam.name || `Cámara ${cam.camera_id}`}
              </option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Umbral superior (°C)"
            className="bg-[#191C22] rounded-lg px-4 py-3 border border-gray-700 text-white text-lg"
            value={deviceUpper}
            onChange={(e) => setDeviceUpper(e.target.value)}
          />
          <input
            type="number"
            placeholder="Umbral inferior (°C)"
            className="bg-[#191C22] rounded-lg px-4 py-3 border border-gray-700 text-white text-lg"
            value={deviceLower}
            onChange={(e) => setDeviceLower(e.target.value)}
          />
          <input
            type="email"
            placeholder="Correo del destinatario"
            className="bg-[#191C22] rounded-lg px-4 py-3 border border-gray-700 text-white text-lg"
            value={deviceEmail}
            onChange={(e) => setDeviceEmail(e.target.value)}
          />
        </div>
        <button
          className="bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg px-6 py-3"
          onClick={saveDeviceAlert}
          disabled={!selectedCamera || !deviceEmail}
        >
          Guardar alerta
        </button>
      </section>

      {/* Alertas de Zona */}
      <section>
        <h2 className="text-2xl font-semibold mb-6">Alertas de Zona</h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 mb-4">
          <select
            className="bg-[#191C22] rounded-lg px-4 py-3 border border-gray-700 text-white text-lg"
            value={selectedZone}
            onChange={(e) => setSelectedZone(Number(e.target.value))}
            disabled={!selectedCamera}
          >
            <option value="">Seleccione zona</option>
            {zonas.map((z) => (
              <option key={z.zone_id} value={z.zone_id}>
                {z.name || `Zona ${z.zone_id}`}
              </option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Umbral superior (°C)"
            className="bg-[#191C22] rounded-lg px-4 py-3 border border-gray-700 text-white text-lg"
            value={zoneUpper}
            onChange={(e) => setZoneUpper(e.target.value)}
          />
          <input
            type="number"
            placeholder="Umbral inferior (°C)"
            className="bg-[#191C22] rounded-lg px-4 py-3 border border-gray-700 text-white text-lg"
            value={zoneLower}
            onChange={(e) => setZoneLower(e.target.value)}
          />
          <input
            type="email"
            placeholder="Correo del destinatario"
            className="bg-[#191C22] rounded-lg px-4 py-3 border border-gray-700 text-white text-lg"
            value={zoneEmail}
            onChange={(e) => setZoneEmail(e.target.value)}
          />
        </div>
        <button
          className="bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg px-6 py-3"
          onClick={saveZoneAlert}
          disabled={!selectedZone || !zoneEmail}
        >
          Guardar alerta
        </button>
      </section>
    </div>
  );
}
