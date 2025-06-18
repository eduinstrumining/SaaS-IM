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

  // Filtrado ultra-dinámico: solo temperaturas numéricas válidas
  const filtered = history.filter(
    (p) =>
      typeof p.temperature === "number" &&
      isFinite(p.temperature)
  );

  const temps = filtered.map(point => point.temperature);

  // Si hay menos de 2 puntos no tiene sentido graficar
  if (filtered.length < 2) {
    return (
      <div className="h-32 w-full bg-gradient-to-b from-flowforge-border to-flowforge-dark rounded-2xl flex items-center justify-center opacity-50">
        <span className="text-[#70F3FF]">No hay suficientes datos en el rango seleccionado</span>
      </div>
    );
  }

  // Etiquetas eje X dinámicas
  let labels, xScale;
  if (Number(rango) >= 24) {
    labels = filtered.map(point => new Date(point.timestamp));
    xScale = {
      type: "time",
      time: {
        unit: Number(rango) >= 168 ? "day" : "hour",
        tooltipFormat: "dd/MM/yyyy HH:mm",
        displayFormats: {
          hour: "dd/MM HH:mm",
          day: "dd/MM",
        },
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
