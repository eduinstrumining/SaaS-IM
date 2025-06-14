// src/components/Thermometer.jsx
import React from "react";

function getThermoColor(temp, min, userMax, inactive) {
  if (inactive) return "#888"; // Color atenuado para inactivo
  if (temp === null || temp === undefined) return "#444";
  if (temp >= userMax) return "#FF4A4A";
  if (temp > (userMax * 0.7)) return "#FFA500";
  return "#18B6FF";
}

export default function Thermometer({ currentTemp, userMax, minTemp = 0, zoneName, inactive = false }) {
  // Rango visual fijo 0-userMax
  const percent = currentTemp !== null && currentTemp !== undefined
    ? Math.min(1, Math.max(0, (currentTemp - minTemp) / (userMax - minTemp)))
    : 0;
  const color = getThermoColor(currentTemp, minTemp, userMax, inactive);

  return (
    <div style={{
      background: inactive ? "#23243a" : "#191B22",
      borderRadius: "2rem",
      width: 120,
      minHeight: 300,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      margin: "1rem",
      boxShadow: inactive
        ? "0 2px 8px rgba(0,0,0,0.3)"
        : "0 8px 32px rgba(0,0,0,0.7)",
      position: "relative",
      filter: inactive ? "grayscale(0.6) opacity(0.8)" : "none"
    }}>
      <div style={{
        color: inactive ? "#aaa" : "#fff",
        fontWeight: 600,
        fontSize: 16,
        marginTop: 18,
        marginBottom: 4,
        textAlign: "center"
      }}>
        {zoneName}
      </div>
      <div style={{
        position: "relative", width: 52, height: 180, margin: "18px 0 0 0",
        display: "flex", alignItems: "flex-end"
      }}>
        {/* SVG Termómetro */}
        <svg width="52" height="180" style={{ position: "absolute", top: 0, left: 0 }}>
          {/* Bulbo */}
          <circle cx="26" cy="158" r="20" fill="#23243a" stroke="#2D3A4C" strokeWidth="4" />
          {/* Tallo */}
          <rect x="18" y="20" width="16" height="140" fill="#23243a" stroke="#2D3A4C" strokeWidth="4" />
        </svg>
        {/* Mercurio */}
        <div style={{
          position: "absolute", left: 18, bottom: 20,
          width: 16,
          height: `${percent * 140 + 20}px`,
          borderRadius: "0 0 16px 16px",
          background: `linear-gradient(to top, ${color}, #191B22 70%)`,
          transition: "height 0.8s cubic-bezier(.47,1.64,.41,.8), background 0.4s"
        }} />
        {/* Bulbo (mercurio) */}
        <div style={{
          position: "absolute", left: 6, bottom: 0, width: 40, height: 40,
          borderRadius: "50%", background: color, boxShadow: `0 0 16px ${color}66`
        }} />
        {/* Línea de umbral */}
        <div style={{
          position: "absolute", left: 0, width: "100%",
          bottom: `${((userMax - minTemp) / (userMax - minTemp)) * 140 + 20}px`,
          height: 3, background: "#FF4A4A", opacity: 0.25
        }} />
      </div>
      <div style={{
        color: color,
        fontWeight: 800,
        fontSize: 38,
        textShadow: "0 2px 10px #0007",
        marginTop: 14
      }}>
        {currentTemp !== null && currentTemp !== undefined
          ? currentTemp.toFixed(1)
          : "--"}
        <span style={{ fontSize: 18 }}>°C</span>
      </div>
      <div style={{
        color: "#aaa", fontSize: 13, marginTop: 2, letterSpacing: 1, marginBottom: 18
      }}>
        Máx: <b>{userMax}°C</b>
      </div>
      {inactive && (
        <div style={{
          position: "absolute",
          top: 18,
          left: 0,
          width: "100%",
          textAlign: "center",
          color: "#e17963",
          fontWeight: 600,
          fontSize: 12,
          opacity: 0.82
        }}>
          Zona inactiva
        </div>
      )}
    </div>
  );
}
