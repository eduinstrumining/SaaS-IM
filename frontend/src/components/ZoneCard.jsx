// src/components/ZoneCard.jsx

import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Filler,
  Legend,
  TimeScale,
} from "chart.js";
import "chartjs-adapter-date-fns";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Filler,
  Legend,
  TimeScale
);

// Helpers
function downsample(arr, maxPoints = 1000) {
  if (!Array.isArray(arr) || arr.length <= maxPoints) return arr;
  const factor = Math.ceil(arr.length / maxPoints);
  return arr.filter((_, idx) => idx % factor === 0);
}

function getPercentile(arr, p) {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.floor(p * (sorted.length - 1));
  return sorted[idx];
}

function fillTimeRange(readings, desde, hasta) {
  const points = [...readings];
  if (desde) {
    const desdeDate = new Date(desde);
    if (!points.length || new Date(points[0].timestamp) > desdeDate) {
      points.unshift({ timestamp: desdeDate.toISOString(), temperature: null });
    }
  }
  if (hasta) {
    const hastaDate = new Date(hasta);
    if (!points.length || new Date(points[points.length - 1].timestamp) < hastaDate) {
      points.push({ timestamp: hastaDate.toISOString(), temperature: null });
    }
  }
  return points;
}

// --- Estado de la zona según último dato ---
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

// --- Muestra tiempo desde última lectura ---
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

export default function ZoneCard({
  zone,
  zoneLabel,
  desde,
  hasta,
  showSelect,
}) {
  // 1. Filtra readings inválidos y atípicos
  const minSafeTemp = 5;
  const maxSafeTemp = 45;
  const validReadings = Array.isArray(zone.readings)
    ? zone.readings.filter(
        (r) =>
          typeof r.temperature !== "undefined" &&
          r.temperature !== null &&
          !isNaN(Number(r.temperature)) &&
          Number(r.temperature) >= minSafeTemp &&
          Number(r.temperature) <= maxSafeTemp
      )
    : [];

  const displayReadings = downsample(fillTimeRange(validReadings, desde, hasta), 1000);

  const temps = displayReadings.map((r) => r.temperature === null ? null : Number(r.temperature));
  const timeLabels = displayReadings.map((r) => new Date(r.timestamp));

  // Autoescalado Y (percentiles)
  const filteredTemps = temps.filter((t) => t !== null);
  let yMin = 0, yMax = 40;
  if (filteredTemps.length > 2) {
    yMin = Math.floor(getPercentile(filteredTemps, 0.02));
    yMax = Math.ceil(getPercentile(filteredTemps, 0.98));
    if (yMin === yMax) {
      yMin = Math.floor(Math.min(...filteredTemps));
      yMax = Math.ceil(Math.max(...filteredTemps));
    }
    yMin = Math.max(yMin - 2, minSafeTemp);
    yMax = Math.min(yMax + 2, maxSafeTemp);
  }

  let variation = 0;
  if (filteredTemps.length >= 2 && filteredTemps[0] !== 0) {
    variation = Math.round(
      ((filteredTemps[filteredTemps.length - 1] - filteredTemps[0]) / Math.abs(filteredTemps[0])) * 100
    );
  }

  // Cálculo rango de días
  const msPorDia = 24 * 60 * 60 * 1000;
  const desdeDate = desde ? new Date(desde) : null;
  const hastaDate = hasta ? new Date(hasta) : null;
  const diffDias = (desdeDate && hastaDate)
    ? Math.ceil((hastaDate - desdeDate) / msPorDia)
    : 1;

  const chartData = {
    labels: timeLabels,
    datasets: [
      {
        label: `Temperatura zona ${zoneLabel}`,
        data: temps,
        fill: true,
        tension: 0.48,
        borderColor: "#70F3FF",
        backgroundColor: "rgba(112,243,255,0.07)",
        pointRadius: 0,
        borderWidth: 3,
        cubicInterpolationMode: "monotone",
        spanGaps: true,
      },
    ],
  };

  const chartOptions = {
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: "index",
        intersect: false,
        callbacks: {
          label: (context) =>
            context.parsed.y !== null ? `${context.parsed.y}°C` : "Sin datos",
        },
      },
    },
    scales: {
      x: {
        type: "time",
        time: {
          unit: diffDias >= 2 ? "day" : "hour",
          tooltipFormat: diffDias >= 2 ? "dd/MM/yyyy" : "dd/MM/yyyy HH:mm",
          displayFormats: {
            hour: "HH:mm",
            day: "dd/MM",
          },
        },
        min: desde ? new Date(desde) : undefined,
        max: hasta ? new Date(hasta) : undefined,
        grid: { display: false },
        ticks: {
          color: "#8C92A4",
          font: { size: 11, family: "Inter, sans-serif" },
          maxTicksLimit: diffDias >= 2 ? 8 : 12,
        },
      },
      y: {
        min: yMin,
        max: yMax,
        grid: { color: "#22252B", drawTicks: false, borderDash: [5, 8] },
        ticks: {
          color: "#8C92A4",
          font: { size: 11, family: "Inter, sans-serif" },
          callback: (v) => v + "°C",
          maxTicksLimit: 6,
        },
      },
    },
    elements: {
      line: {
        tension: 0.45,
        borderJoinStyle: "round",
        borderCapStyle: "round",
      },
    },
    layout: { padding: { left: 10, right: 20, top: 16, bottom: 16 } },
    responsive: true,
    maintainAspectRatio: false,
  };

  let desdeStr = desde ? new Date(desde).toLocaleString("es-CL") : "";
  let hastaStr = hasta ? new Date(hasta).toLocaleString("es-CL") : "";

  // --------- ESTADO Y TIEMPO DE ÚLTIMA LECTURA ---------
  const { estado, ultimo, color } = getZoneStatus(zone.readings);

  // --- Nueva lógica de mensajes diferenciados por tipo de ausencia de data ---
  // Nunca hubo datos en esta zona
  const nuncaHuboDatos = !zone.readings || zone.readings.length === 0;
  // Hay data en algún momento (histórico), pero ninguna en el rango filtrado (después del filtrado por fecha/temperatura)
  const sinDatosEnRango = zone.readings && zone.readings.length > 0 && filteredTemps.length === 0;

  let mensajeSinDatos = null;
  if (nuncaHuboDatos) {
    mensajeSinDatos = (
      <div className="flex flex-col items-center justify-center h-36 text-[#8C92A4]">
        <span className="text-base font-bold mb-1">Esta zona nunca ha enviado datos.</span>
        <span className="text-xs">Verifique instalación o espere primeras lecturas.</span>
      </div>
    );
  } else if (sinDatosEnRango) {
    mensajeSinDatos = (
      <div className="flex flex-col items-center justify-center h-36 text-[#8C92A4]">
        <span className="text-base font-bold mb-1">No hay datos en el rango seleccionado, pero sí existen datos históricos para esta zona.</span>
        <span className="text-xs">Pruebe ajustando el rango de fechas.</span>
      </div>
    );
  }

  return (
    <div className="bg-flowforge-panel rounded-2xl p-6 shadow flex flex-col gap-4">
      <div className="flex items-center gap-4 mb-2">
        <h2 className="text-xl font-bold">{`Zona ${zoneLabel}`}</h2>
        <span
          className="inline-block px-4 py-1 rounded-xl font-bold text-xs"
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
      </div>
      <div className="flex flex-col md:flex-row items-end md:items-center gap-8">
        <div>
          <div className="text-4xl font-bold text-white">
            {filteredTemps.length
              ? `${Math.round(filteredTemps[filteredTemps.length - 1])}°C`
              : "--"}
          </div>
          <div
            className={`text-xs mt-1 font-semibold ${
              variation > 0
                ? "text-green-400"
                : variation < 0
                ? "text-red-400"
                : "text-[#8C92A4]"
            }`}
          >
            Periodo seleccionado {variation > 0 ? "+" : ""}
            {variation}%
          </div>
          <div className="text-xs text-[#8C92A4] mt-2">
            {desdeStr && hastaStr ? (
              <>
                {desdeStr} <span className="font-bold">→</span> {hastaStr}
              </>
            ) : null}
          </div>
        </div>
        <div className="flex-1 min-w-[240px] h-32 sm:h-36 md:h-40">
          {/* Si no hay datos en la zona, muestra el mensaje correspondiente */}
          {mensajeSinDatos ? (
            mensajeSinDatos
          ) : filteredTemps.length > 1 ? (
            <Line data={chartData} options={chartOptions} />
          ) : (
            <div className="h-full flex items-center justify-center text-[#8C92A4]">
              Sin datos suficientes para graficar
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
