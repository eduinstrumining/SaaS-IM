// src/pages/DeviceZones.jsx
import React, { useEffect, useState, useContext } from "react";
import { fetchCameras, fetchCameraZones } from "../api";
import Thermometer from "../components/Thermometer";
import { AuthContext } from "../context/AuthContext";

// Utilidad para localStorage (umbral máximo por zona)
const getUserMaxTemp = (cameraId, zoneId) => {
  const key = `zone_max_${cameraId}_${zoneId}`; // ← ¡CORREGIDO!
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
  const [editMax, setEditMax] = useState({});
  const [maxVals, setMaxVals] = useState({});

  // Trae cámaras una vez por token
  useEffect(() => {
    setLoading(true);
    fetchCameras(token)
      .then((cams) => {
        setCameras(cams);
        setSelectedCamera(cams?.[0]?.camera_id ?? null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  // Trae zonas y refresca automáticamente cada 8 segundos
  useEffect(() => {
    let intervalId;
    const fetchZonas = () => {
      if (!selectedCamera) return;
      setLoading(true);
      fetchCameraZones(selectedCamera, token)
        .then((data) => {
          setZonas(data.zonas || []);
          const newMax = {};
          (data.zonas || []).forEach(z => {
            newMax[z.zone_id] = getUserMaxTemp(selectedCamera, z.zone_id);
          });
          setMaxVals(newMax);
        })
        .finally(() => setLoading(false));
    };

    fetchZonas();
    intervalId = setInterval(fetchZonas, 8000); // cada 8 segundos

    return () => {
      clearInterval(intervalId);
    };
  }, [selectedCamera, token]);

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
              minWidth: 150
            }}
          >
            <Thermometer
              currentTemp={zona.last_temp ?? null}
              userMax={maxVals[zona.zone_id] ?? 40}
              zoneName={zona.name || `Zona ${zona.zone_id}`}
            />
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
