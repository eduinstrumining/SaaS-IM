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

export default function ZoneChart({ history, desde, hasta }) {
  if (!Array.isArray(history) || history.length === 0) {
    return (
      <div className="h-32 w-full bg-gradient-to-b from-flowforge-border to-flowforge-dark rounded-2xl flex items-center justify-center opacity-50">
        <span className="text-[#70F3FF]">Sin datos para este rango</span>
      </div>
    );
  }

  const filtered = history.filter(
    (p) =>
      typeof p.temperature === "number" &&
      isFinite(p.temperature)
  );
  if (filtered.length < 2) {
    return (
      <div className="h-32 w-full bg-gradient-to-b from-flowforge-border to-flowforge-dark rounded-2xl flex items-center justify-center opacity-50">
        <span className="text-[#70F3FF]">No hay suficientes datos</span>
      </div>
    );
  }

  // Calcula el rango en días, usando los props desde/hasta SIEMPRE
  let days = 1;
  if (desde && hasta) {
    const d1 = new Date(desde).getTime();
    const d2 = new Date(hasta).getTime();
    days = Math.round(Math.abs(d2 - d1) / (1000 * 60 * 60 * 24));
  }

  // Si el rango es más de 2 días, usa unit: "day"
  const xUnit = days >= 2 ? "day" : "hour";
  const tooltipFmt = days >= 2 ? "dd/MM/yyyy" : "dd/MM/yyyy HH:mm";
  const displayFmt = days >= 2 ? { day: "dd/MM" } : { hour: "HH:mm" };

  const labels = filtered.map(point => new Date(point.timestamp));
  const temps = filtered.map(point => point.temperature);

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
        callbacks: {
          title: (items) => items[0].label,
        },
      },
    },
    scales: {
      x: {
        type: "time",
        time: {
          unit: xUnit,
          tooltipFormat: tooltipFmt,
          displayFormats: displayFmt,
        },
        grid: { display: false },
        ticks: {
          color: "#8C92A4",
          font: { size: 12, family: "Inter, ui-sans-serif" },
          maxTicksLimit: days >= 2 ? Math.min(days, 8) : 6,
        }
      },
      y: {
        display: false,
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
