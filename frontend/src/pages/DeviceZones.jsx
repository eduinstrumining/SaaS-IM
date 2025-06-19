// src/pages/DeviceZones.jsx

import React, { useEffect, useState } from "react";
import { fetchCameraSummary } from "../api";
import ZoneCard from "../components/ZoneCard"; // ¡Importación correcta!

function getZoneStatus(lastTime) {
  if (!lastTime) {
    return { estado: "Nunca", ultimo: null, color: "gray" };
  }
  const lastDate = new Date(lastTime);
  const now = new Date();
  const diffMin = (now - lastDate) / 1000 / 60;
  if (diffMin < 2) return { estado: "OK", ultimo: lastDate, color: "green" };
  if (diffMin < 10) return { estado: "Retraso", ultimo: lastDate, color: "orange" };
  return { estado: "Offline", ultimo: lastDate, color: "red" };
}

function tiempoDesde(date) {
  if (!date) return "";
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);
  if (diffSec < 60) return `hace ${diffSec}s`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `hace ${diffMin}min`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `hace ${diffHr}h`;
  const diffDay = Math.floor(diffHr / 24);
  return `hace ${diffDay}d`;
}

export default function DeviceZones({ cameraId, token }) {
  const [zonas, setZonas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!cameraId || !token) return;
    setLoading(true);
    setError("");
    fetchCameraSummary(cameraId, token)
      .then((data) => {
        setZonas(data.zonas || []);
        setError("");
      })
      .catch((err) => {
        setError(
          err.message ||
            "No se pudieron cargar las zonas de la cámara."
        );
      })
      .finally(() => setLoading(false));
  }, [cameraId, token]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-[#8C92A4] text-sm">
        <span className="animate-spin h-4 w-4 inline-block border-2 border-flowforge-accent border-t-transparent rounded-full"></span>
        Cargando...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-400 flex items-center gap-4">
        {error}
        <button
          onClick={() => window.location.reload()}
          className="ml-4 px-3 py-1 bg-[#2D3748] rounded text-white text-xs font-semibold hover:bg-[#70F3FF] hover:text-black transition"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!zonas.length) {
    return (
      <div className="bg-flowforge-panel text-[#8C92A4] text-center py-10 rounded-2xl mb-8">
        No existen zonas registradas para esta cámara.
      </div>
    );
  }

  return (
    <div className="grid gap-8">
      {zonas.map((z) => {
        const { estado, ultimo, color } = getZoneStatus(z.last_time);
        return (
          <ZoneCard
            key={z.zone_id}
            zone={{
              zone_id: z.zone_id,
              readings: [
                {
                  temperature: z.last_temp,
                  timestamp: z.last_time,
                },
              ],
            }}
            zoneLabel={z.zone_id}
            showSelect={false}
          />
        );
      })}
    </div>
  );
}
