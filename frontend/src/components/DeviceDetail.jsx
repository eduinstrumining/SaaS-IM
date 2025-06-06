// src/components/DeviceDetail.jsx

import React, { useEffect, useState } from "react";
import ZoneCard from "./ZoneCard";
import { fetchCameraStatus } from "../api";
import { subHours, subMonths } from "date-fns";

const RANGOS = [
  { value: "24", label: "Últimas 24 horas" },
  { value: "72", label: "Últimas 72 horas" },
  { value: "168", label: "Última semana" },
  { value: "720", label: "Último mes" },
];

// Devuelve fechas ISO en UTC para el rango dado en horas
function getRangoFechas(rango) {
  const hasta = new Date();
  let desde;
  if (Number(rango) === 720) {
    desde = subMonths(hasta, 1);
  } else {
    desde = subHours(hasta, Number(rango));
  }
  return {
    desde: desde.toISOString(),
    hasta: hasta.toISOString(),
  };
}

// Rango histórico de cámara 3
const HIST_CAM3 = {
  min: "2025-03-25T00:00:00Z",
  max: "2025-06-05T00:00:00Z"
};

export default function DeviceDetail({
  cameraId,
  token,
  desde: desdeProp,
  hasta: hastaProp,
  onCameraChange,
}) {
  const [data, setData] = useState(null);
  const [rango, setRango] = useState("24");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fetchParams, setFetchParams] = useState({ desde: null, hasta: null });

  // Maneja fechas externas si vienen como props
  useEffect(() => {
    if (desdeProp && hastaProp) {
      setFetchParams({ desde: desdeProp, hasta: hastaProp });
    }
  }, [desdeProp, hastaProp]);

  // Si no hay fechas externas, usa el rango para calcular fechas y actualizar fetchParams
  useEffect(() => {
    if (!desdeProp && !hastaProp) {
      const { desde, hasta } = getRangoFechas(Number(rango));
      setFetchParams({ desde, hasta });
    }
  }, [rango, desdeProp, hastaProp]);

  // Fetch datos cada vez que cambian cámara, token o fetchParams
  useEffect(() => {
    if (!cameraId || !token || !fetchParams.desde || !fetchParams.hasta) return;

    setLoading(true);
    setError("");
    setData(null);

    fetchCameraStatus(cameraId, token, fetchParams.desde, fetchParams.hasta)
      .then((resp) => setData(resp))
      .catch((err) => {
        let msg = err.message || "No se pudieron cargar los datos del dispositivo.";
        if (
          msg.includes("Rango máximo para consulta sin agregación es 7 días") ||
          msg.includes("rango máximo permitido") ||
          msg.includes("7 días")
        ) {
          msg = "El rango máximo permitido es 7 días. Usa 'Último mes' si necesitas ver más.";
        }
        setError(msg);
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [cameraId, token, fetchParams]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-[#8C92A4] text-sm">
        <span className="animate-spin h-4 w-4 inline-block border-2 border-flowforge-accent border-t-transparent rounded-full"></span>
        Cargando...
      </div>
    );
  }

  if (error) {
    return <div className="text-red-400">{error}</div>;
  }

  if (!data) {
    return <div className="text-red-400">No hay datos del dispositivo.</div>;
  }

  // Asegura que siempre es un array de zonas
  const zonasRaw = Array.isArray(data?.zonas)
    ? data.zonas
    : [];

  // Ordena zonas y filtra lecturas inválidas
  const zonasOrdenadas = zonasRaw
    .map((zona) => ({
      ...zona,
      readings: Array.isArray(zona.readings)
        ? zona.readings.filter((r) => Number(r.temperature) < 6450)
        : [],
    }))
    .sort((a, b) => (a.zone_id ?? 0) - (b.zone_id ?? 0));

  // Detecta si todas las zonas no tienen readings (no hay datos en el rango)
  const todasVacias = zonasOrdenadas.length === 0 ||
    zonasOrdenadas.every((z) => !z.readings || z.readings.length === 0);

  // Mensaje especial para cámara 3 (puedes generalizar para otras cámaras/rangos si quieres)
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
  }

  return (
    <div>
      {/* Controles cámara y rango en línea */}
      <div className="flex items-center gap-4 mb-6">
        {onCameraChange && (
          <>
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
          </>
        )}

        <div className="ml-auto flex items-center gap-2">
          <label className="text-gray-300 font-semibold whitespace-nowrap">
            Rango de fechas:
          </label>
          <select
            className="bg-[#1F2937] text-white rounded-2xl px-6 py-5 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#72B1FF] transition text-lg"
            value={rango}
            onChange={(e) => setRango(e.target.value)}
          >
            {RANGOS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Si todas las zonas están vacías, muestra un solo mensaje claro */}
      {todasVacias ? (
        <div className="bg-flowforge-panel text-[#8C92A4] text-center py-10 rounded-2xl mb-8">
          {noDataMsg}
        </div>
      ) : (
        <>
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
                    .find((r) => Number(r.temperature) < 6450);

                  return (
                    <tr className="border-t border-flowforge-border" key={z.zone_id}>
                      <td className="px-6 py-4">{`Zona ${z.zone_id}`}</td>
                      <td className="px-6 py-4">
                        {lastValid && lastValid.temperature !== undefined
                          ? `${Math.round(lastValid.temperature)}°C`
                          : "--"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-4 py-1 bg-[#22252B] rounded-xl font-bold ${
                            z.state === "Activo"
                              ? "text-green-400"
                              : "text-gray-400"
                          }`}
                        >
                          {z.state || "Inactivo"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Cards zonas con gráfico sin selector */}
          <section className="grid gap-8">
            {zonasOrdenadas.map((z) => (
              <ZoneCard
                key={z.zone_id}
                zone={z}
                zoneLabel={z.zone_id}
                rango={rango}
                setRango={setRango}
                showSelect={false}
              />
            ))}
          </section>
        </>
      )}
    </div>
  );
}
