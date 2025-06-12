// src/components/ZoneChart.jsx

import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  TimeScale,
  Filler,
  Tooltip,
  Legend
} from "chart.js";
import 'chartjs-adapter-date-fns';

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, TimeScale, Filler, Tooltip, Legend);

/**
 * ZoneChart
 * Recibe: history [{timestamp, temperature}], rango en horas (ej: 24, 72, 168).
 * 100% dinámico y sin ningún hardcodeo de fechas, cámaras, ni lógica de UI.
 */
export default function ZoneChart({ history, rango = "24" }) {
  // 1. Validación dinámica de datos
  if (!Array.isArray(history) || history.length === 0) {
    return (
      <div className="h-32 w-full bg-gradient-to-b from-flowforge-border to-flowforge-dark rounded-2xl flex items-center justify-center opacity-50">
        <svg width="180" height="60">
          <path d="M0,40 Q30,10 60,30 Q90,50 120,20 Q150,40 180,20" fill="none" stroke="#70F3FF" strokeWidth="4" />
        </svg>
      </div>
    );
  }

  // 2. Filtrado ultra-dinámico: solo temperaturas numéricas y no atípicas (opcional)
  const filtered = history.filter(
    (p) =>
      typeof p.temperature === "number" &&
      isFinite(p.temperature)
  );

  const temps = filtered.map(point => point.temperature);

  // 3. Etiquetas eje X: siempre dinámicas según rango
  let labels, xScale;
  if (Number(rango) >= 24) {
    labels = filtered.map(point => new Date(point.timestamp));
    xScale = {
      type: "time",
      time: {
        unit: Number(rango) >= 168 ? "day" : "hour",
        tooltipFormat: "dd/MM/yyyy HH:mm",
        displayFormats: {
          hour: "HH:mm",
          day: "dd/MM"
        }
      },
      grid: { display: false },
      ticks: {
        color: "#8C92A4",
        font: { size: 12, family: "Inter, ui-sans-serif" },
        maxTicksLimit: 6,
      }
    };
  } else {
    labels = filtered.map(point =>
      point.timestamp
        ? new Date(point.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : ""
    );
    xScale = {
      type: "category",
      grid: { display: false },
      ticks: {
        color: "#8C92A4",
        font: { size: 12, family: "Inter, ui-sans-serif" },
        maxTicksLimit: 6,
      }
    };
  }

  // 4. Data y opciones del gráfico: siempre dinámico según el dataset
  const data = {
    labels,
    datasets: [
      {
        label: "Temperatura",
        data: temps,
        fill: true,
        tension: 0.45,
        borderColor: "#70F3FF",
        borderWidth: 3,
        pointRadius: 0,
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 140);
          gradient.addColorStop(0, "#70F3FF20");
          gradient.addColorStop(1, "#181B22");
          return gradient;
        },
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        backgroundColor: "#23262F",
        titleColor: "#70F3FF",
        bodyColor: "#fff",
        borderColor: "#70F3FF",
        borderWidth: 1,
        padding: 10,
        caretSize: 8,
      },
    },
    scales: {
      x: xScale,
      y: {
        display: false, // Cambia a true si quieres mostrar el eje Y
        grid: { display: false },
      },
    },
    elements: {
      line: { borderJoinStyle: "round", borderCapStyle: "round" },
    },
  };

  return (
    <div className="h-32 w-full bg-gradient-to-b from-flowforge-border to-flowforge-dark rounded-2xl">
      <Line data={data} options={options} height={90} />
    </div>
  );
}
