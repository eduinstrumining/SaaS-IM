// src/pages/Alerts.jsx
import React, { useState, useEffect } from "react";
import { fetchCameras, fetchZonesByCamera, createZoneAlert } from "../api";

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
        if (cams.length && !cams.find(c => (c.camera_id || c.id) === Number(selectedCamera))) {
          setSelectedCamera(cams[0].camera_id || cams[0].id || "");
        }
      })
      .catch((e) => {
        setCameras([]);
        setLoadingCameras(false);
        console.error("Error al cargar cámaras", e);
      });
    // eslint-disable-next-line
  }, [token]);

  // ----------- Carga zonas al seleccionar cámara -----------
  useEffect(() => {
    if (!selectedCamera) {
      setZonas([]);
      setZoneConfigs({});
      return;
    }
    fetchZonesByCamera(Number(selectedCamera), token)
      .then((data) => {
        let zonasArr = Array.isArray(data.zonas) ? data.zonas : data;
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
    // eslint-disable-next-line
  }, [selectedCamera, token]);

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
          zone_id: String(zoneId),
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
    <div className="max-w-3xl mx-auto py-8 px-4 text-white font-sans">
      <h1 className="text-2xl font-bold mb-2 tracking-tight">Alertas por Zona</h1>
      <p className="mb-8 text-gray-300 text-base">
        Selecciona una <span className="text-cyan-400 font-semibold">cámara</span>, ingresa un <span className="text-cyan-400 font-semibold">correo destinatario</span> y define umbrales para cada zona monitoreada.
      </p>
      {/* Selección de cámara y correo global */}
      <div className="mb-8 flex gap-3 flex-wrap items-center">
        <select
          className="bg-[#21242B] rounded-lg px-3 py-2 border border-[#343741] text-white text-base font-semibold min-w-[140px] shadow-sm focus:outline-cyan-400"
          value={selectedCamera}
          onChange={e => setSelectedCamera(e.target.value)}
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
          className="bg-[#21242B] rounded-lg px-3 py-2 border border-[#343741] text-white text-base w-64 font-medium shadow-sm"
          placeholder="Correo destinatario (requiere @)"
          value={correo}
          onChange={e => setCorreo(e.target.value)}
          disabled={!selectedCamera}
        />
      </div>

      {/* Sin cámaras */}
      {cameras.length === 0 && !loadingCameras && (
        <div className="text-gray-400 text-sm mb-5">
          No hay cámaras disponibles.
        </div>
      )}

      {/* Sin zonas */}
      {zonas.length === 0 && selectedCamera && (
        <div className="text-gray-400 text-sm mb-5">
          No hay zonas para esta cámara.
        </div>
      )}

      {/* Lista de zonas con configuración */}
      <div className="space-y-3">
        {zonas.map((z, idx) => {
          const id = typeof z.zone_id !== "undefined" ? z.zone_id : (typeof z.id !== "undefined" ? z.id : idx);
          return (
            <div
              key={`zona-${id}`}
              className="flex flex-wrap items-center justify-between bg-[#22252D] rounded-xl px-5 py-3 shadow border border-[#343741] gap-3"
            >
              <div className="text-base font-bold min-w-[92px]">{z.name || `Zona ${id}`}</div>
              <input
                type="number"
                className="bg-[#181A20] rounded px-3 py-2 border border-[#343741] text-white text-sm w-28 mx-1 font-semibold placeholder-gray-500"
                placeholder="Umbral sup (°C)"
                value={zoneConfigs[id]?.upper ?? ""}
                onChange={e =>
                  handleConfigChange(id, "upper", e.target.value)
                }
              />
              <input
                type="number"
                className="bg-[#181A20] rounded px-3 py-2 border border-[#343741] text-white text-sm w-28 mx-1 font-semibold placeholder-gray-500"
                placeholder="Umbral inf (°C)"
                value={zoneConfigs[id]?.lower ?? ""}
                onChange={e =>
                  handleConfigChange(id, "lower", e.target.value)
                }
              />
              <button
                className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded px-4 py-2 ml-2 shadow transition text-sm"
                onClick={() => saveZoneAlert(id)}
              >
                Guardar
              </button>
              <div className="text-xs mt-1 min-h-[18px] w-full text-right text-green-400 font-semibold">
                {statusMsg[id]}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
