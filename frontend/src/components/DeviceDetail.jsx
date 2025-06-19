// src/pages/DeviceDetail.jsx

import React, { useEffect, useState, useRef } from "react";
import ZoneCard from "./ZoneCard";
import { fetchCameraStatus } from "../api";

// ... [getZoneStatus y tiempoDesde sin cambios] ...

function getZoneStatus(readings) {
  if (!readings || readings.length === 0) {
    return { estado: "Nunca", ultimo: null, color: "gray" };
  }
  const last = readings[readings.length - 1];
  const lastDate = new Date(last.timestamp);
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

export default function DeviceDetail({
  cameraId,
  token,
  desde,
  hasta,
  onCameraChange,
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Control del intervalo para evitar leaks
  const intervalRef = useRef(null);

  // --- Valida y formatea fechas para mayor seguridad ---
  function getSafeDate(dateLike, fallback) {
    const date = new Date(dateLike);
    return isNaN(date.getTime()) ? new Date(fallback) : date;
  }
  const safeDesde = getSafeDate(desde, Date.now() - 24 * 3600 * 1000);
  const safeHasta = getSafeDate(hasta, Date.now());

  // --- Fetch de datos robusto: solo borra data en primer load/cambio de cámara ---
  const isFirstLoad = useRef(true);
  const fetchData = React.useCallback(
    (forceLoading = false) => {
      if (!cameraId || !token || !desde || !hasta) return;
      if (isFirstLoad.current || forceLoading) {
        setLoading(true);
        setData(null);
      } else {
        setLoading(true);
        // No borra data aquí
      }
      setError("");

      fetchCameraStatus(
        cameraId,
        token,
        safeDesde.toISOString(),
        safeHasta.toISOString()
      )
        .then((resp) => {
          setData(resp);
          setError("");
          isFirstLoad.current = false;
          console.log("Datos zonas:", resp.zonas);
        })
        .catch((err) => {
          let msg =
            err.message || "No se pudieron cargar los datos del dispositivo.";
          setError(msg);
        })
        .finally(() => setLoading(false));
    },
    [cameraId, token, desde, hasta]
  );

  useEffect(() => {
    isFirstLoad.current = true;
    fetchData(true);
  }, [cameraId, token, desde, hasta, fetchData]);

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

  // --- Prepara y filtra zonas para visualización ---
  const zonasRaw = Array.isArray(data?.zonas) ? data.zonas : [];
  const zonasOrdenadas = zonasRaw
    .map((zona) => ({
      ...zona,
      readings: Array.isArray(zona.readings)
        ? zona.readings.filter((r) => Number(r.temperature) < 6450)
        : [],
    }))
    .sort((a, b) => (a.zone_id ?? 0) - (b.zone_id ?? 0));

  // Nuevo: detectar estado general de las zonas
  const todasVacias = zonasOrdenadas.length > 0 &&
    zonasOrdenadas.every((z) => !z.readings || z.readings.length === 0);
  const nuncaHuboDatos = zonasOrdenadas.length === 0;

  // Mensaje especial para cámara 3
  let noDataMsg = "Sin datos suficientes para este rango.";
  if (Number(cameraId) === 3) {
    noDataMsg = (
      <>
        No existen datos de la <b>cámara 3</b> en el rango seleccionado.<br />
        <span className="text-xs">
          (Disponible desde <b>25-mar-2025</b> hasta <b>5-jun-2025</b>)
        </span>
      </>
    );
  } else if (nuncaHuboDatos) {
    noDataMsg = (
      <>
        Este dispositivo nunca ha enviado datos.<br />
        <span className="text-xs">
          Verifique instalación o espere primeras lecturas.
        </span>
      </>
    );
  } else if (todasVacias) {
    noDataMsg = (
      <>
        No hay datos en el rango seleccionado, pero sí existen datos históricos para este dispositivo.<br />
        <span className="text-xs">
          Pruebe ajustando el rango de fechas o consulte con soporte.
        </span>
      </>
    );
  }

  // --- VISTA: prioridad ---
  if (loading && data === null) {
    return (
      <div className="flex items-center gap-2 text-[#8C92A4] text-sm">
        <span className="animate-spin h-4 w-4 inline-block border-2 border-flowforge-accent border-t-transparent rounded-full"></span>
        Cargando...
      </div>
    );
  }

  if (error && data === null) {
    return (
      <div className="text-red-400 flex items-center gap-4">
        {error}
        <button
          onClick={() => fetchData(true)}
          className="ml-4 px-3 py-1 bg-[#2D3748] rounded text-white text-xs font-semibold hover:bg-[#70F3FF] hover:text-black transition"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!data) {
    return <div className="text-red-400">No hay datos del dispositivo.</div>;
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

      {/* Mensajes diferenciados */}
      {(nuncaHuboDatos || todasVacias) ? (
        <div className="bg-flowforge-panel text-[#8C92A4] text-center py-10 rounded-2xl mb-8">
          {noDataMsg}
          {error && (
            <div className="mt-4 text-red-400 flex items-center gap-4 justify-center">
              {error}
              <button
                onClick={() => fetchData(true)}
                className="ml-4 px-3 py-1 bg-[#2D3748] rounded text-white text-xs font-semibold hover:bg-[#70F3FF] hover:text-black transition"
              >
                Reintentar
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          {error && (
            <div className="mb-4 text-red-400 flex items-center gap-4">
              {error}
              <button
                onClick={() => fetchData()}
                className="ml-4 px-3 py-1 bg-[#2D3748] rounded text-white text-xs font-semibold hover:bg-[#70F3FF] hover:text-black transition"
              >
                Reintentar
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
                {zonasOrdenadas.map((z) => {
                  const lastValid = [...(z.readings || [])]
                    .reverse()
                    .find(
                      (r) =>
                        Number(r.temperature) < 6450 &&
                        Number(r.temperature) > 5
                    );

                  const { estado, ultimo, color } = getZoneStatus(z.readings);

                  return (
                    <tr
                      className="border-t border-flowforge-border"
                      key={z.zone_id}
                    >
                      <td className="px-6 py-4">{`Zona ${z.zone_id}`}</td>
                      <td className="px-6 py-4">
                        {lastValid && lastValid.temperature !== undefined
                          ? `${Math.round(lastValid.temperature)}°C`
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

          {/* Cards zonas con gráfico */}
          <section className="grid gap-8">
            {zonasOrdenadas.map((z) => (
              <ZoneCard
                key={z.zone_id}
                zone={z}
                zoneLabel={z.zone_id}
                desde={safeDesde.toISOString()}
                hasta={safeHasta.toISOString()}
                showSelect={false}
              />
            ))}
          </section>
        </>
      )}
    </div>
  );
}
