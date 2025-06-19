// src/pages/DeviceDetail.jsx

import React, { useEffect, useState, useRef } from "react";
import ZoneCard from "./ZoneCard";
import { fetchCameraSummary } from "../api";

function getZoneStatus(lastTime) {
  if (!lastTime) {
    return { estado: "Nunca", ultimo: null, color: "gray" };
  }
  const lastDate = new Date(lastTime);
  const now = new Date();
  const diffMin = (now - lastDate) / 1000 / 60;
  if (diffMin < 2) return { estado: "OK", ultimo: lastDate, color: "green" };
  if (diffMin < 10) return { estado: "Retraso", ultimo: lastDate, color: "orange" };
  return { estado: "Offline", ultimo: lastDate, color: "red" };
}

function tiempoDesde(date) {
  if (!date) return "";
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);
  if (diffSec < 60) return `hace ${diffSec}s`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `hace ${diffMin}min`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `hace ${diffHr}h`;
  const diffDay = Math.floor(diffHr / 24);
  return `hace ${diffDay}d`;
}

export default function DeviceDetail({ cameraId, token, onCameraChange }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const intervalRef = useRef(null);

  // Fetch resumen rápido
  const fetchData = React.useCallback(() => {
    if (!cameraId || !token) return;
    setLoading(true);
    setError("");
    fetchCameraSummary(cameraId, token)
      .then((resp) => {
        setData(resp);
        setError("");
      })
      .catch((err) => {
        let msg =
          err.message || "No se pudieron cargar los datos del dispositivo.";
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [cameraId, token]);

  useEffect(() => {
    fetchData();
  }, [cameraId, token, fetchData]);

  useEffect(() => {
    if (!autoRefresh) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      fetchData();
    }, 30000);
    return () => clearInterval(intervalRef.current);
  }, [autoRefresh, fetchData]);

  const handleToggleAutoRefresh = () => setAutoRefresh((ar) => !ar);

  const zonas = Array.isArray(data?.zonas) ? data.zonas : [];

  // Mensajes para estados
  let noDataMsg = "Sin datos suficientes para esta cámara.";
  if (zonas.length === 0) {
    noDataMsg = (
      <>
        Este dispositivo nunca ha enviado datos.<br />
        <span className="text-xs">
          Verifique instalación o espere primeras lecturas.
        </span>
      </>
    );
  }

  if (loading && !data) {
    return (
      <div className="flex items-center gap-2 text-[#8C92A4] text-sm">
        <span className="animate-spin h-4 w-4 inline-block border-2 border-flowforge-accent border-t-transparent rounded-full"></span>
        Cargando...
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="text-red-400 flex items-center gap-4">
        {error}
        <button
          onClick={() => fetchData()}
          className="ml-4 px-3 py-1 bg-[#2D3748] rounded text-white text-xs font-semibold hover:bg-[#70F3FF] hover:text-black transition"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!data || zonas.length === 0) {
    return <div className="text-red-400">{noDataMsg}</div>;
  }

  return (
    <div>
      {onCameraChange && (
        <div className="flex items-center gap-4 mb-6">
          <label className="text-gray-300 font-semibold whitespace-nowrap">
            Selecciona cámara:
          </label>
          <select
            className="bg-[#1F2937] text-white rounded-2xl px-6 py-5 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#72B1FF] transition text-lg"
            value={cameraId}
            onChange={(e) => onCameraChange(Number(e.target.value))}
          >
            <option value={1}>Cámara 1</option>
            <option value={2}>Cámara 2</option>
            <option value={3}>Cámara 3</option>
          </select>
          <button
            onClick={handleToggleAutoRefresh}
            className={`ml-6 px-3 py-1 rounded text-xs font-bold transition ${
              autoRefresh
                ? "bg-[#70F3FF] text-black hover:bg-[#39d1d7]"
                : "bg-[#2D3748] text-white hover:bg-[#444]"
            }`}
          >
            {autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
          </button>
        </div>
      )}

      {/* Tabla resumen zonas */}
      <div className="mb-12">
        <table className="min-w-full rounded-xl overflow-hidden bg-flowforge-panel text-sm shadow">
          <thead className="bg-[#22252B] text-[#8C92A4]">
            <tr>
              <th className="px-6 py-3 text-left">Zona</th>
              <th className="px-6 py-3 text-left">Temperatura</th>
              <th className="px-6 py-3 text-left">Estado</th>
            </tr>
          </thead>
          <tbody className="text-[#D1D5DB]">
            {zonas.map((z) => {
              const { estado, ultimo, color } = getZoneStatus(z.last_time);
              return (
                <tr
                  className="border-t border-flowforge-border"
                  key={z.zone_id}
                >
                  <td className="px-6 py-4">{`Zona ${z.zone_id}`}</td>
                  <td className="px-6 py-4">
                    {z.last_temp !== undefined && z.last_temp !== null
                      ? `${Math.round(z.last_temp)}°C`
                      : "--"}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-4 py-1 rounded-xl font-bold`}
                      style={{
                        color:
                          color === "green"
                            ? "#34d399"
                            : color === "orange"
                            ? "#f59e42"
                            : color === "red"
                            ? "#ef4444"
                            : "#8C92A4",
                        background:
                          color === "gray"
                            ? "#22252B"
                            : color === "green"
                            ? "#132817"
                            : color === "orange"
                            ? "#2d2110"
                            : "#220e0e",
                      }}
                    >
                      {estado}
                    </span>
                    <span className="ml-2 text-xs text-[#8C92A4]">
                      {ultimo ? `(${tiempoDesde(ultimo)})` : ""}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Cards zonas con placeholder para gráficos históricos */}
      <section className="grid gap-8">
        {zonas.map((z) => (
          <div
            key={z.zone_id}
            className="bg-flowforge-panel rounded-2xl p-6 shadow flex flex-col gap-4"
          >
            <h2 className="text-xl font-bold">{`Zona ${z.zone_id}`}</h2>
            <div className="flex items-center gap-4">
              <div className="text-4xl font-bold text-white">
                {z.last_temp !== undefined && z.last_temp !== null
                  ? `${Math.round(z.last_temp)}°C`
                  : "--"}
              </div>
              <span
                className={`inline-block px-4 py-1 rounded-xl font-bold text-xs`}
                style={{
                  color:
                    getZoneStatus(z.last_time).color === "green"
                      ? "#34d399"
                      : getZoneStatus(z.last_time).color === "orange"
                      ? "#f59e42"
                      : getZoneStatus(z.last_time).color === "red"
                      ? "#ef4444"
                      : "#8C92A4",
                  background:
                    getZoneStatus(z.last_time).color === "gray"
                      ? "#22252B"
                      : getZoneStatus(z.last_time).color === "green"
                      ? "#132817"
                      : getZoneStatus(z.last_time).color === "orange"
                      ? "#2d2110"
                      : "#220e0e",
                }}
              >
                {getZoneStatus(z.last_time).estado}
              </span>
              <span className="ml-2 text-xs text-[#8C92A4]">
                {z.last_time ? `(${tiempoDesde(new Date(z.last_time))})` : ""}
              </span>
            </div>
            {/* Aquí puedes poner el gráfico histórico bajo demanda */}
            {/* <ZoneChart zoneId={z.zone_id} cameraId={cameraId} token={token} /> */}
          </div>
        ))}
      </section>
    </div>
  );
}
