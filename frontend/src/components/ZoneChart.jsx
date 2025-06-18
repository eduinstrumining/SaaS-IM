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

  // 2. Filtrado de datos
  const filtered = history.filter(
    (p) =>
      typeof p.temperature === "number" &&
      isFinite(p.temperature) &&
      !!p.timestamp // asegúrate que tenga timestamp válido
  );

  // 3. Formato para Chart.js: [{x, y}]
  const chartData = filtered.map(point => ({
    x: new Date(point.timestamp),
    y: point.temperature
  }));

  // 4. Opciones de eje X: time, días si el rango es >=48h
  const isMultiDay = Number(rango) >= 48;
  const xScale = {
    type: "time",
    time: {
      unit: isMultiDay ? "day" : "hour",
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
      maxTicksLimit: isMultiDay ? 8 : 10,
      autoSkip: true,
    }
  };

  // 5. Data y opciones del gráfico
  const data = {
    datasets: [
      {
        label: "Temperatura",
        data: chartData,
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
