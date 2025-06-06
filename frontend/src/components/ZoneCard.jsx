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
import 'chartjs-adapter-date-fns';

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

// Formatea la hora para el eje X en rangos menores a 24h
function formatHour(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleTimeString("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Downsampling visual para evitar freeze en browsers con muchos puntos
function downsample(arr, maxPoints = 1000) {
  if (!Array.isArray(arr) || arr.length <= maxPoints) return arr;
  const factor = Math.ceil(arr.length / maxPoints);
  return arr.filter((_, idx) => idx % factor === 0);
}

export default function ZoneCard({ zone, zoneLabel, rango, setRango, showSelect }) {
  // Filtra solo lecturas válidas
  const validReadings = Array.isArray(zone.readings)
    ? zone.readings.filter((r) =>
        typeof r.temperature !== "undefined" &&
        r.temperature !== null &&
        Number(r.temperature) < 6450 &&
        !isNaN(Number(r.temperature))
      )
    : [];

  // Downsample (solo visual)
  const displayReadings = downsample(validReadings, 1000);

  // Temperaturas y labels del eje X
  const temps = displayReadings.map((r) => Number(r.temperature));
  let labels = [];

  if (Number(rango) >= 24) {
    labels = displayReadings.map((r) => new Date(r.timestamp));
  } else {
    labels = displayReadings.map((r) => formatHour(r.timestamp));
  }

  // Variación porcentual en el periodo seleccionado
  let variation = 0;
  if (temps.length >= 2 && temps[0] !== 0) {
    variation = Math.round(
      ((temps[temps.length - 1] - temps[0]) / Math.abs(temps[0])) * 100
    );
  }

  // DATASET CHART.JS
  const chartData = {
    labels,
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
      x: Number(rango) >= 24
        ? {
            type: "time",
            time: {
              unit: Number(rango) >= 168 ? "day" : "hour",
              tooltipFormat: "dd/MM/yyyy HH:mm",
              displayFormats: {
                hour: "HH:mm",
                day: "dd/MM",
              },
            },
            grid: { display: false },
            ticks: {
              color: "#8C92A4",
              font: { size: 11, family: "Inter, sans-serif" },
              maxTicksLimit: 6,
            },
          }
        : {
            grid: { display: false },
            ticks: {
              color: "#8C92A4",
              font: { size: 11, family: "Inter, sans-serif" },
              maxTicksLimit: 6,
            },
          },
      y: {
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
 