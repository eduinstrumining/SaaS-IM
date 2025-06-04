// src/components/ZoneChart.jsx
import React from "react";
import { Line } from "react-chartjs-2";
import { Chart, LineElement, PointElement, LinearScale, CategoryScale, Filler } from "chart.js";
Chart.register(LineElement, PointElement, LinearScale, CategoryScale, Filler);

export default function ZoneChart({ history }) {
  // Si no hay datos, muestra el placeholder premium
  if (!history || history.length === 0) {
    return (
      <div className="h-32 w-full bg-gradient-to-b from-flowforge-border to-flowforge-dark rounded-2xl flex items-center justify-center opacity-50">
        <svg width="180" height="60"><path d="M0,40 Q30,10 60,30 Q90,50 120,20 Q150,40 180,20" fill="none" stroke="#70F3FF" strokeWidth="4" /></svg>
      </div>
    );
  }

  const labels = history.map(point =>
    point.timestamp ? new Date(point.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""
  );
  const temps = history.map(point => point.temperature);

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
      x: {
        display: true,
        ticks: {
          color: "#8C92A4",
          font: { size: 12, family: "Inter, ui-sans-serif" },
        },
        grid: { display: false },
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
