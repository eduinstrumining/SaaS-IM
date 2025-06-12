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

// Percentil (para autoescalado eje Y)
function getPercentile(arr, p) {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.floor(p * (sorted.length - 1));
  return sorted[idx];
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

  // 2. Downsample visual
  const displayReadings = downsample(validReadings, 1000);

  // 3. Data series y labels eje X
  const temps = displayReadings.map((r) => Number(r.temperature));
  const timeLabels = displayReadings.map((r) => new Date(r.timestamp));

  // 4. Autoescalado Y (percentiles, para evitar que outliers arruinen la visual)
  let yMin = 0, yMax = 40;
  if (temps.length > 2) {
    yMin = Math.floor(getPercentile(temps, 0.02));
    yMax = Math.ceil(getPercentile(temps, 0.98));
    if (yMin === yMax) {
      yMin = Math.floor(Math.min(...temps));
      yMax = Math.ceil(Math.max(...temps));
    }
    yMin = Math.max(yMin - 2, minSafeTemp);
    yMax = Math.min(yMax + 2, maxSafeTemp);
  }

  // 5. Variación porcentual en periodo seleccionado
  let variation = 0;
  if (temps.length >= 2 && temps[0] !== 0) {
    variation = Math.round(
      ((temps[temps.length - 1] - temps[0]) / Math.abs(temps[0])) * 100
    );
  }

  // 6. DATASET CHART.JS
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
      },
    ],
  };

  // Rango de fechas (opcional para mostrar en UI)
  let desdeStr = desde ? new Date(desde).toLocaleString("es-CL") : "";
  let hastaStr = hasta ? new Date(hasta).toLocaleString("es-CL") : "";

  // 7. Chart Options - SIEMPRE EJE DE TIEMPO CONSISTENTE
  const chartOptions = {
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: "index",
        intersect: false,
        callbacks: {
          label: (context) => `${context.parsed.y}°C`,
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
        min: desde,
        max: hasta,
        grid: { display: false },
        ticks: {
          color: "#8C92A4",
          font: { size: 11, family: "Inter, sans-serif" },
          maxTicksLimit: 6,
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
          maxTicksLimit: 5,
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

  return (
    <div className="bg-flowforge-panel rounded-2xl p-6 shadow flex flex-col gap-4">
      <h2 className="text-xl font-bold">{`Zona ${zoneLabel}`}</h2>
      <div className="flex flex-col md:flex-row items-end md:items-center gap-8">
        <div>
          <div className="text-4xl font-bold text-white">
            {temps.length ? `${Math.round(temps[temps.length - 1])}°C` : "--"}
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
          {temps.length > 1 ? (
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
