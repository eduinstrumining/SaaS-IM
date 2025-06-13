import React, { useState, useEffect } from "react";
import { createZoneAlert, API_BASE } from "../api";

// =================== HELPERS ====================
async function fetchCameras(token) {
  try {
    const res = await fetch(`${API_BASE}/cameras`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error("Error al obtener cámaras");
    const data = await res.json();
    if (Array.isArray(data.cameras)) return data.cameras;
    if (Array.isArray(data)) return data;
    return [];
  } catch (e) {
    console.error("Error fetchCameras:", e);
    return [];
  }
}

async function fetchZonasByCamera(cameraId, token) {
  try {
    const res = await fetch(`${API_BASE}/cameras/${cameraId}/zonas`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error("Error al obtener zonas");
    const data = await res.json();
    if (Array.isArray(data.zonas)) return data.zonas;
    if (Array.isArray(data)) return data;
    return [];
  } catch (e) {
    console.error("Error fetchZonasByCamera:", e);
    return [];
  }
}

// =================== COMPONENT ====================
export default function Alerts({ token }) {
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState("");
  const [zonas, setZonas] = useState([]);
  const [correo, setCorreo] = useState(""); // Correo global

  const [zoneConfigs, setZoneConfigs] = useState({});
  const [statusMsg, setStatusMsg] = useState({});
  const [loadingCameras, setLoadingCameras] = useState(false);

  // ----------- Carga cámaras -----------
  useEffect(() => {
    if (!token) return;
    setLoadingCameras(true);
    fetchCameras(token)
      .then((cams) => {
        setCameras(cams);
        setLoadingCameras(false);
        if (cams.length && !cams.find(c => (c.camera_id || c.id) === selectedCamera)) {
          setSelectedCamera(cams[0].camera_id || cams[0].id || "");
        }
      })
      .catch((e) => {
        setCameras([]);
        setLoadingCameras(false);
        console.error("Error al cargar cámaras", e);
      });
  }, [token]); // eslint-disable-line

  // ----------- Carga zonas al seleccionar cámara -----------
  useEffect(() => {
    if (!selectedCamera) {
      setZonas([]);
      setZoneConfigs({});
      return;
    }
    fetchZonasByCamera(selectedCamera, token)
      .then((zonas) => {
        let zonasArr = zonas;
        if (zonasArr.length > 0 && typeof zonasArr[0] === "number") {
          zonasArr = zonasArr.map(id => ({
            zone_id: id,
            name: `Zona ${id}`
          }));
        }
        setZonas(zonasArr);
        const next = {};
        zonasArr.forEach(z => {
          const id = typeof z.zone_id !== "undefined" ? z.zone_id : (typeof z.id !== "undefined" ? z.id : undefined);
          if (id !== undefined) {
            next[id] = zoneConfigs[id] || {
              upper: "",
              lower: "",
            };
          }
        });
        setZoneConfigs(next);
      })
      .catch((e) => {
        setZonas([]);
        console.error("Error al cargar zonas", e);
      });
  }, [selectedCamera, token]); // eslint-disable-line

  // ----------- Cambia valores input por zona -----------
  const handleConfigChange = (zoneId, field, value) => {
    setZoneConfigs(cfgs => ({
      ...cfgs,
      [zoneId]: {
        ...cfgs[zoneId],
        [field]: value
      }
    }));
  };

  // ----------- Guardar alerta por zona -----------
  const saveZoneAlert = async (zoneId) => {
    setStatusMsg(msg => ({ ...msg, [zoneId]: "" }));
    if (!correo) {
      setStatusMsg(msg => ({ ...msg, [zoneId]: "Debe ingresar un correo" }));
      return;
    }
    const cfg = zoneConfigs[zoneId];
    try {
      await createZoneAlert(
        {
          zone_id: String(zoneId), // 👈 CORREGIDO: siempre string para el backend Go
          upper_thresh: Number(cfg.upper),
          lower_thresh: Number(cfg.lower),
          recipient: correo,
        },
        token
      );
      setStatusMsg(msg => ({ ...msg, [zoneId]: "✅ Alerta guardada" }));
    } catch (e) {
      setStatusMsg(msg => ({ ...msg, [zoneId]: e.message || "Error" }));
    }
  };

  // =================== RENDER ====================
  return (
    <div className="max-w-3xl mx-auto py-14 px-4 text-white font-sans">
      <h1 className="text-5xl font-black mb-1 tracking-tight" style={{letterSpacing: '-2px'}}>Alertas por Zona</h1>
      <p className="mb-10 text-gray-300 text-lg">
        Selecciona una <span className="text-cyan-400 font-semibold">cámara</span>, ingresa un <span className="text-cyan-400 font-semibold">correo destinatario</span> y define umbrales para cada zona monitoreada.
      </p>
      {/* Selección de cámara y correo global */}
      <div className="mb-10 flex gap-4 flex-wrap items-center">
        <select
          className="bg-[#21242B] rounded-xl px-5 py-3 border border-[#343741] text-white text-lg font-bold min-w-[160px] shadow-md focus:outline-cyan-400"
          value={selectedCamera}
          onChange={e => setSelectedCamera(Number(e.target.value))}
          disabled={loadingCameras || cameras.length === 0}
        >
          <option value="">
            {loadingCameras
              ? "Cargando cámaras..."
              : cameras.length === 0
                ? "No hay cámaras disponibles"
                : "Seleccione cámara"}
          </option>
          {cameras.map(cam => {
            const id = cam.camera_id || cam.id;
            return (
              <option key={id} value={id}>
                {cam.name || cam.label || `Cámara ${id}`}
              </option>
            );
          })}
        </select>
        <input
          type="email"
          className="bg-[#21242B] rounded-xl px-5 py-3 border border-[#343741] text-white text-lg w-80 font-medium shadow-md"
          placeholder="Correo destinatario (requiere @)"
          value={correo}
          onChange={e => setCorreo(e.target.value)}
          disabled={!selectedCamera}
        />
      </div>

      {/* Sin cámaras */}
      {cameras.length === 0 && !loadingCameras && (
        <div className="text-gray-400 text-md mb-6">
          No hay cámaras disponibles.
        </div>
      )}

      {/* Sin zonas */}
      {zonas.length === 0 && selectedCamera && (
        <div className="text-gray-400 text-md mb-6">
          No hay zonas para esta cámara.
        </div>
      )}

      {/* Lista de zonas con configuración */}
      <div className="space-y-5">
        {zonas.map((z, idx) => {
          const id = typeof z.zone_id !== "undefined" ? z.zone_id : (typeof z.id !== "undefined" ? z.id : idx);
          return (
            <div
              key={`zona-${id}`}
              className="flex flex-wrap items-center justify-between bg-[#22252D] rounded-2xl px-7 py-5 shadow-lg border border-[#343741]"
            >
              <div className="text-xl font-extrabold min-w-[100px]">{z.name || `Zona ${id}`}</div>
              <input
                type="number"
                className="bg-[#181A20] rounded-lg px-4 py-2 border border-[#343741] text-white text-base w-32 mx-2 font-semibold placeholder-gray-500"
                placeholder="Umbral sup (°C)"
                value={zoneConfigs[id]?.upper ?? ""}
                onChange={e =>
                  handleConfigChange(id, "upper", e.target.value)
                }
              />
              <input
                type="number"
                className="bg-[#181A20] rounded-lg px-4 py-2 border border-[#343741] text-white text-base w-32 mx-2 font-semibold placeholder-gray-500"
                placeholder="Umbral inf (°C)"
                value={zoneConfigs[id]?.lower ?? ""}
                onChange={e =>
                  handleConfigChange(id, "lower", e.target.value)
                }
              />
              <button
                className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg px-6 py-2 ml-3 shadow transition"
                onClick={() => saveZoneAlert(id)}
              >
                Guardar
              </button>
              <div className="text-xs mt-1 min-h-[20px] w-full text-right text-green-400 font-semibold">
                {statusMsg[id]}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
