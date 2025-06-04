import React, { useState, useEffect } from "react";
import { fetchDevicesWithZones, createDeviceAlert, createZoneAlert } from "../api";

export default function Alerts({ token }) {
  // Estados para dispositivos y zonas
  const [devices, setDevices] = useState([]);
  const [zones, setZones] = useState([]);

  // Mantengo tus estados originales para selectedDevice y filteredZones
  const [selectedDevice, setSelectedDevice] = useState("");
  const [filteredZones, setFilteredZones] = useState([]);

  // Estados alerta dispositivo
  const [deviceUpper, setDeviceUpper] = useState("");
  const [deviceLower, setDeviceLower] = useState("");
  const [deviceEmail, setDeviceEmail] = useState("");

  // Estados alerta zona
  const [selectedZone, setSelectedZone] = useState("");
  const [zoneUpper, setZoneUpper] = useState("");
  const [zoneLower, setZoneLower] = useState("");
  const [zoneEmail, setZoneEmail] = useState("");

  // Estados para mensajes de éxito o error
  const [alertError, setAlertError] = useState("");
  const [alertSuccess, setAlertSuccess] = useState("");

  // Cargar dispositivos y zonas desde backend al montar
  useEffect(() => {
    if (!token) return;
    fetchDevicesWithZones(token)
      .then((data) => {
        setDevices(data);
        // Mapear zonas con id y deviceId (camera_id)
        const allZones = data.flatMap((device) =>
          device.zones.map((zoneId) => ({ id: zoneId, deviceId: device.camera_id }))
        );
        setZones(allZones);
      })
      .catch(() => {
        setDevices([]);
        setZones([]);
      });
  }, [token]);

  // Filtrar zonas cuando cambia el dispositivo seleccionado
  useEffect(() => {
    if (!selectedDevice) {
      setFilteredZones([]);
      setSelectedZone("");
      return;
    }
    const filtered = zones.filter((z) => z.deviceId === Number(selectedDevice));
    setFilteredZones(filtered);
    setSelectedZone("");
  }, [selectedDevice, zones]);

  // Guardar alerta dispositivo real con manejo de errores y mensajes
  const saveDeviceAlert = async () => {
    setAlertError("");
    setAlertSuccess("");
    try {
      await createDeviceAlert(
        {
          device_id: selectedDevice,
          upper_thresh: Number(deviceUpper),
          lower_thresh: Number(deviceLower),
          recipient: deviceEmail,
        },
        token
      );
      setAlertSuccess("Alerta de dispositivo guardada correctamente");
      // Limpiar campos para nueva alerta
      setDeviceUpper("");
      setDeviceLower("");
      setDeviceEmail("");
      setSelectedDevice("");
    } catch (error) {
      setAlertError(error.message || "Error al guardar alerta de dispositivo");
    }
  };

  // Guardar alerta zona real con manejo de errores y mensajes
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
      // Limpiar campos para nueva alerta
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
            value={selectedDevice}
            onChange={(e) => setSelectedDevice(Number(e.target.value))}
          >
            <option value="">Seleccione dispositivo</option>
            {devices.map((d) => (
              <option key={d.camera_id} value={d.camera_id}>
                Dispositivo {d.camera_id}
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
          disabled={!selectedDevice || !deviceEmail}
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
            disabled={!selectedDevice}
          >
            <option value="">Seleccione zona</option>
            {filteredZones.map((z) => (
              <option key={z.id} value={z.id}>
                Zona {z.id}
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
