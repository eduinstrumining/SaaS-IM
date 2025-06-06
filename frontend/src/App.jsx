import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import DeviceDetail from "./components/DeviceDetail";
import UserManagement from "./pages/UserManagement";
import Alerts from "./pages/Alerts";
import Login from "./pages/Login";
import { fetchCameras, API_BASE } from "./api"; // Importa la constante real

// Helper para decodificar el JWT y chequear expiración
function isTokenExpired(token) {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (!payload.exp) return true;
    return Date.now() / 1000 > payload.exp;
  } catch {
    return true;
  }
}

// Formatea fecha a YYYY-MM-DD para inputs tipo date y query params
function formatDate(date) {
  return date.toISOString().split("T")[0];
}

// Dashboard principal, lo extraemos a un componente para rutearlo
function Dashboard({ token }) {
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Estado para rango de fechas preseleccionado (última semana)
  const [dateRange, setDateRange] = useState(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 7);
    return { desde: formatDate(start), hasta: formatDate(end) };
  });

  useEffect(() => {
    if (!token || isTokenExpired(token)) return;
    setLoading(true);
    fetchCameras(token)
      .then((cams) => {
        setCameras(cams);
        setSelectedCamera(cams?.[0]?.camera_id || null);
        setError("");
      })
      .catch(() => setError("No se pudieron cargar las cámaras"))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <main className="max-w-5xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-4">
        Dispositivo: Sensor de Temperatura{" "}
        <span className="font-normal text-flowforge-accent">
          {selectedCamera || ""}
        </span>
      </h1>
      {/* Selector de cámaras */}
      <div className="flex gap-2 mb-8">
        <span className="text-[#8C92A4] font-semibold text-sm pt-2">
          Selecciona cámara:
        </span>
        <select
          className="bg-flowforge-panel text-white border border-flowforge-border rounded-lg px-3 py-2"
          value={selectedCamera || ""}
          onChange={(e) => setSelectedCamera(Number(e.target.value))}
        >
          {cameras.map((cam) => (
            <option key={cam.camera_id} value={cam.camera_id}>
              Cámara {cam.camera_id}
            </option>
          ))}
        </select>
      </div>
      {/* Contenido del dispositivo */}
      {error && (
        <div className="text-red-400 text-sm font-semibold mb-2">{error}</div>
      )}
      {selectedCamera ? (
        <DeviceDetail
          cameraId={selectedCamera}
          token={token}
          desde={dateRange.desde}
          hasta={dateRange.hasta}
        />
      ) : loading ? (
        <div className="flex gap-2 items-center text-[#8C92A4] text-sm">
          <span className="animate-spin h-4 w-4 inline-block border-2 border-flowforge-accent border-t-transparent rounded-full"></span>
          Cargando...
        </div>
      ) : null}
    </main>
  );
}

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");

  // Para debug: mostrar en consola la URL base API que realmente se usa
  useEffect(() => {
    console.log("API Base URL:", API_BASE);
  }, []);

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken("");
  };

  // Si no hay token, muestra el login
  if (!token || isTokenExpired(token)) {
    return (
      <div className="min-h-screen bg-flowforge-dark flex items-center justify-center">
        <Login onLogin={setToken} />
      </div>
    );
  }

  // App protegida con rutas
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-flowforge-dark text-white font-sans">
        <Navbar onLogout={handleLogout} />
        <Routes>
          <Route path="/" element={<Dashboard token={token} />} />
          <Route path="/users" element={<UserManagement token={token} />} />
          <Route path="/alerts" element={<Alerts token={token} />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
