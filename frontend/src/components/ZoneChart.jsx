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

export default function ZoneChart({ history, rango = "24" }) {
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
        <span className="text-[#70F3FF]">No hay suficientes datos en el rango seleccionado</span>
      </div>
    );
  }

  // Calcula el rango real de fechas (en días)
  const minTs = Math.min(...filtered.map(p => new Date(p.timestamp).getTime()));
  const maxTs = Math.max(...filtered.map(p => new Date(p.timestamp).getTime()));
  const days = Math.round((maxTs - minTs) / (1000 * 60 * 60 * 24)) + 1;

  // Ajusta la unidad del eje X según los días del rango
  let xUnit = "hour";
  let tooltipFmt = "dd/MM/yyyy HH:mm";
  let displayFmt = { hour: "HH:mm" };
  if (days >= 2) {
    xUnit = "day";
    tooltipFmt = "dd/MM/yyyy";
    displayFmt = { day: "dd/MM" };
  }

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
          // Muestra fecha y hora en el tooltip si el rango es mayor a 1 día
          title: (items) =>
            xUnit === "day"
              ? items[0].label
              : items[0].label,
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
          maxTicksLimit: 7,
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
