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
  // Si no hay datos, muestra placeholder
  if (!history || history.length === 0) {
    return (
      <div className="h-32 w-full bg-gradient-to-b from-flowforge-border to-flowforge-dark rounded-2xl flex items-center justify-center opacity-50">
        <svg width="180" height="60"><path d="M0,40 Q30,10 60,30 Q90,50 120,20 Q150,40 180,20" fill="none" stroke="#70F3FF" strokeWidth="4" /></svg>
      </div>
    );
  }

  // Datos para chart
  const temps = history.map(point => point.temperature);

  // Si rango >= 24h, usa fechas reales para eje tiempo, si no, etiquetas horarias
  let labels, xScale;
  if (Number(rango) >= 24) {
    labels = history.map(point => new Date(point.timestamp));
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
      }
    };
  } else {
    labels = history.map(point =>
      point.timestamp ? new Date(point.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""
    );
    xScale = {
      type: "category",
      grid: { display: false },
      ticks: {
        color: "#8C92A4",
        font: { size: 12, family: "Inter, ui-sans-serif" },
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
        display: false, // Cambia a true si quieres mostrar eje Y
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
