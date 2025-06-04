// src/components/DeviceDetail.jsx
import React, { useEffect, useState } from "react";
import ZoneCard from "./ZoneCard";
import { fetchCameraStatus } from "../api";

const RANGOS = [
  { value: "1", label: "Última hora" },
  { value: "6", label: "Últimas 6 horas" },
  { value: "12", label: "Últimas 12 horas" },
  { value: "24", label: "Últimas 24 horas" },
  { value: "168", label: "Última semana" },
  { value: "720", label: "Último mes" },
];

function getRangoFechas(horas) {
  const hasta = new Date();
  const desde = new Date(hasta.getTime() - horas * 60 * 60 * 1000);
  return {
    desde: desde.toISOString(),
    hasta: hasta.toISOString(),
  };
}

export default function DeviceDetail({ cameraId, token, onCameraChange }) {
  const [data, setData] = useState(null);
  const [rango, setRango] = useState("24");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const { desde, hasta } = getRangoFechas(Number(rango));
    fetchCameraStatus(cameraId, token, desde, hasta)
      .then((resp) => {
        setData(resp);
      })
      .finally(() => setLoading(false));
  }, [cameraId, token, rango]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-[#8C92A4] text-sm">
        <span className="animate-spin h-4 w-4 inline-block border-2 border-flowforge-accent border-t-transparent rounded-full"></span>
        Cargando...
      </div>
    );
  }
  if (!data) {
    return <div className="text-red-400">No hay datos del dispositivo.</div>;
  }

  const zonasRaw = Array.isArray(data)
    ? data
    : Array.isArray(data.zonas)
    ? data.zonas
    : [];

  const zonasOrdenadas = zonasRaw
    .map((zona) => ({
      ...zona,
      readings: Array.isArray(zona.readings)
        ? zona.readings.filter((r) => Number(r.temperature) < 6450)
        : [],
    }))
    .sort((a, b) => (a.zone_id ?? 0) - (b.zone_id ?? 0));

  return (
    <div>
      {/* Controles cámara y rango en línea */}
      <div className="flex items-center gap-4 mb-6">
        <label className="text-gray-300 font-semibold whitespace-nowrap">
          Selecciona cámara:
        </label>
        <select
          className="bg-[#1F2937] text-white rounded-2xl px-6 py-5 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#72B1FF] transition text-lg"
          value={cameraId}
          onChange={(e) => onCameraChange(e.target.value)}
        >
          {/* Aquí deben venir las opciones dinámicas de cámaras */}
          <option value="1">Cámara 1</option>
          <option value="2">Cámara 2</option>
        </select>

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
            setRango={setRango} // Se pasa pero no se usa para mostrar selector
            showSelect={false}   // No mostrar selector en ZoneCard
          />
        ))}
      </section>
    </div>
  );
}
