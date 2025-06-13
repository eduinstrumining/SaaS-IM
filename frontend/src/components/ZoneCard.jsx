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

// Registra componentes de ChartJS
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

// Nuevo: agrega puntos vacíos para mostrar el eje X completo
function fillTimeRange(readings, desde, hasta) {
  const points = [...readings];
  if (desde) {
    const desdeDate = new Date(desde);
    // Si el primer dato está después del inicio, inyecta un punto vacío
    if (!points.length || new Date(points[0].timestamp) > desdeDate) {
      points.unshift({ timestamp: desdeDate.toISOString(), temperature: null });
    }
  }
  if (hasta) {
    const hastaDate = new Date(hasta);
    // Si el último dato está antes del final, inyecta un punto vacío
    if (!points.length || new Date(points[points.length - 1].timestamp) < hastaDate) {
      points.push({ timestamp: hastaDate.toISOString(), temperature: null });
    }
  }
  return points;
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

  // --- AQUI agregamos los puntos extremos ---
  const displayReadings = downsample(fillTimeRange(validReadings, desde, hasta), 1000);

  // Data series y labels eje X
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

  // Variación porcentual en periodo seleccionado
  let variation = 0;
  if (filteredTemps.length >= 2 && filteredTemps[0] !== 0) {
    variation = Math.round(
      ((filteredTemps[filteredTemps.length - 1] - filteredTemps[0]) / Math.abs(filteredTemps[0])) * 100
    );
  }

  // DATASET CHART.JS
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
        spanGaps: true, // <-- Importante para que Chart.js muestre saltos en los huecos
      },
    ],
  };

  // Chart Options
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
          unit: "hour",
          tooltipFormat: "dd/MM/yyyy HH:mm",
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
          maxTicksLimit: 8,
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

  // Fechas del rango visual (UI)
  let desdeStr = desde ? new Date(desde).toLocaleString("es-CL") : "";
  let hastaStr = hasta ? new Date(hasta).toLocaleString("es-CL") : "";

  return (
    <div className="bg-flowforge-panel rounded-2xl p-6 shadow flex flex-col gap-4">
      <h2 className="text-xl font-bold">{`Zona ${zoneLabel}`}</h2>
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
          {filteredTemps.length > 1 ? (
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
