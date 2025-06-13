import React, { useEffect, useState } from "react";
import ZoneCard from "./ZoneCard";
import { fetchCameraStatus } from "../api";

/**
 * DeviceDetail
 * Muestra el detalle de una cámara seleccionada, incluyendo las zonas, tabla resumen y gráficos.
 * Recibe rango de fechas, valida entrada y pasa props seguras a los hijos.
 */
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

  // --- Valida y formatea fechas para mayor seguridad ---
  function getSafeDate(dateLike, fallback) {
    const date = new Date(dateLike);
    return isNaN(date.getTime()) ? new Date(fallback) : date;
  }
  // Fechas robustas (evita fechas inválidas)
  const safeDesde = getSafeDate(desde, Date.now() - 24 * 3600 * 1000);
  const safeHasta = getSafeDate(hasta, Date.now());

  useEffect(() => {
    if (!cameraId || !token || !desde || !hasta) return;
    setLoading(true);
    setError("");
    setData(null);

    fetchCameraStatus(cameraId, token, safeDesde.toISOString(), safeHasta.toISOString())
      .then((resp) => setData(resp))
      .catch((err) => {
        let msg = err.message || "No se pudieron cargar los datos del dispositivo.";
        setError(msg);
        setData(null);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line
  }, [cameraId, token, desde, hasta]);

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

  const todasVacias =
    zonasOrdenadas.length === 0 ||
    zonasOrdenadas.every((z) => !z.readings || z.readings.length === 0);

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
  }

  return (
    <div>
      {/* Controles cámara solo si onCameraChange viene como prop */}
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
        </div>
      )}

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
