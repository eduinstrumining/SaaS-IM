// src/pages/DeviceZones.jsx
import React, { useEffect, useState, useContext } from "react";
import { fetchCameras, fetchCameraStatus } from "../api";
import Thermometer from "../components/Thermometer";
import { AuthContext } from "../context/AuthContext";

// Utilidad para localStorage (umbral máximo por zona)
const getUserMaxTemp = (cameraId, zoneId) => {
  const key = `zone_max_${cameraId}_${zoneId}`;
  const v = window.localStorage.getItem(key);
  return v ? parseFloat(v) : 40; // Valor por defecto: 40°C
};
const setUserMaxTemp = (cameraId, zoneId, value) => {
  const key = `zone_max_${cameraId}_${zoneId}`;
  window.localStorage.setItem(key, value);
};

export default function DeviceZones() {
  const { token } = useContext(AuthContext);
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [zonas, setZonas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMax, setEditMax] = useState({}); // { [zoneId]: bool }
  const [maxVals, setMaxVals] = useState({}); // { [zoneId]: valor }

  // Trae cámaras
  useEffect(() => {
    setLoading(true);
    fetchCameras(token)
      .then((cams) => {
        setCameras(cams);
        setSelectedCamera(cams?.[0]?.camera_id ?? null);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line
  }, [token]);

  // Trae status de cámara (zonas)
  useEffect(() => {
    if (!selectedCamera) return;
    setLoading(true);
    fetchCameraStatus(selectedCamera, token)
      .then((data) => {
        setZonas(data.zonas || []);
        // Setea max por zona
        const newMax = {};
        (data.zonas || []).forEach(z => {
          newMax[z.zone_id] = getUserMaxTemp(selectedCamera, z.zone_id);
        });
        setMaxVals(newMax);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line
  }, [selectedCamera, token]);

  // Editar el umbral
  const handleMaxChange = (zoneId, val) => {
    setMaxVals(v => ({ ...v, [zoneId]: val }));
    setUserMaxTemp(selectedCamera, zoneId, val);
  };

  return (
    <main className="max-w-6xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">Monitoreo de Zonas por Temperatura</h1>
      <div className="flex gap-6 mb-8 items-center">
        <span className="text-[#8C92A4] font-semibold text-sm">Selecciona cámara:</span>
        <select
          className="bg-flowforge-panel text-white border border-flowforge-border rounded-lg px-3 py-2"
          value={selectedCamera || ""}
          onChange={e => setSelectedCamera(Number(e.target.value))}
          disabled={cameras.length === 0}
        >
          {cameras.map((cam) => (
            <option key={cam.camera_id} value={cam.camera_id}>
              Cámara {cam.camera_id}
            </option>
          ))}
        </select>
      </div>
      {loading && <div className="text-[#8C92A4]">Cargando...</div>}
      {!loading && zonas.length === 0 && (
        <div className="text-[#8C92A4]">No hay zonas para esta cámara.</div>
      )}
      <div className="flex flex-wrap gap-6">
        {zonas.map(zona => (
          <div
            key={zona.zone_id}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              background: "#23243a",
              borderRadius: "2rem",
              boxShadow: "0 6px 32px rgba(0,0,0,0.4)",
              padding: "16px 10px",
              minWidth: 150,
              opacity: zona.state === "Activo" ? 1 : 0.6 // Atenúa si está inactivo
            }}
          >
            {/* Estado visual arriba del termómetro */}
            <div style={{
              display: "flex", alignItems: "center", gap: 8, marginBottom: 6
            }}>
              <span
                style={{
                  display: "inline-block",
                  width: 12, height: 12,
                  borderRadius: "50%",
                  background: zona.state === "Activo" ? "#32e18a" : "#B0B0B0",
                  border: "1.5px solid #191B22"
                }}
                title={zona.state}
              />
              <span
                style={{
                  color: zona.state === "Activo" ? "#32e18a" : "#B0B0B0",
                  fontWeight: 600,
                  fontSize: 13,
                  letterSpacing: 0.5
                }}
              >
                {zona.state === "Activo" ? "En tiempo real" : "Sin datos recientes"}
              </span>
            </div>
            <Thermometer
              currentTemp={zona.last_temp ?? null}
              userMax={maxVals[zona.zone_id] ?? 40}
              zoneName={`Zona ${zona.zone_id}`}
              inactive={zona.state !== "Activo"}
            />
            {/* Última lectura */}
            <div style={{
              color: "#bbb", fontSize: 12, marginTop: 2
            }}>
              Última lectura: {zona.last_time
                ? new Date(zona.last_time).toLocaleString("es-CL", {
                    hour: "2-digit", minute: "2-digit", second: "2-digit"
                  })
                : "N/A"}
            </div>
            <div style={{ marginTop: 8 }}>
              {editMax[zona.zone_id] ? (
                <div>
                  <input
                    type="number"
                    value={maxVals[zona.zone_id] ?? 40}
                    min={10}
                    max={150}
                    step={0.1}
                    style={{
                      width: 64,
                      padding: "4px 8px",
                      borderRadius: 8,
                      background: "#191B22",
                      color: "#fff",
                      border: "1px solid #2D3A4C"
                    }}
                    onChange={e => handleMaxChange(zona.zone_id, parseFloat(e.target.value))}
                  />{" "}
                  <button
                    style={{
                      background: "#18B6FF",
                      color: "#fff",
                      borderRadius: 8,
                      border: "none",
                      padding: "4px 8px",
                      cursor: "pointer"
                    }}
                    onClick={() => setEditMax(m => ({ ...m, [zona.zone_id]: false }))}
                  >
                    OK
                  </button>
                </div>
              ) : (
                <button
                  style={{
                    background: "#444A",
                    color: "#18B6FF",
                    borderRadius: 8,
                    border: "none",
                    padding: "4px 12px",
                    cursor: "pointer"
                  }}
                  onClick={() => setEditMax(m => ({ ...m, [zona.zone_id]: true }))}
                >
                  Editar máx
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
