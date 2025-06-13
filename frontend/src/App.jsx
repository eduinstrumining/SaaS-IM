import React, { useEffect, useState, useCallback, useContext } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import DeviceDetail from "./components/DeviceDetail";
import UserManagement from "./pages/UserManagement";
import Alerts from "./pages/Alerts";
import Login from "./pages/Login";
import { fetchCameras, API_BASE } from "./api";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { AuthContext } from "./context/AuthContext"; // <--- Importa tu contexto

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

// Dashboard principal
function Dashboard({ token }) {
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Estado para rango de fechas libre
  const today = new Date();
  const oneWeekAgo = new Date(today);
  oneWeekAgo.setDate(today.getDate() - 7);

  const [dateRange, setDateRange] = useState({
    desde: oneWeekAgo,
    hasta: today,
  });

  // Actualiza cámaras disponibles
  useEffect(() => {
    if (!token || isTokenExpired(token)) {
      setError("Sesión expirada o token inválido. Inicia sesión nuevamente.");
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchCameras(token)
      .then((cams) => {
        setCameras(cams);
        // Selecciona la primera cámara válida si la actual no existe
        if (!cams.find(c => c.camera_id === selectedCamera)) {
          setSelectedCamera(cams?.[0]?.camera_id || null);
        }
        setError("");
      })
      .catch(() => setError("No se pudieron cargar las cámaras"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line
  }, [token]);

  // Actualiza la cámara seleccionada si cambia la lista
  useEffect(() => {
    if (cameras.length && !cameras.find(c => c.camera_id === selectedCamera)) {
      setSelectedCamera(cameras[0].camera_id);
    }
    // eslint-disable-next-line
  }, [cameras]);

  // Normaliza fechas antes de pasarlas al backend
  const desde = new Date(dateRange.desde);
  desde.setHours(0, 0, 0, 0);
  const hasta = new Date(dateRange.hasta);
  hasta.setHours(23, 59, 59, 999);

  // Permite cambiar el rango de fechas
  const handleDesdeChange = useCallback(
    (date) => setDateRange(r => ({ ...r, desde: date })),
    []
  );
  const handleHastaChange = useCallback(
    (date) => setDateRange(r => ({ ...r, hasta: date })),
    []
  );

  // --- Mostrar error SIEMPRE que exista ---
  if (error) {
    return (
      <main className="max-w-5xl mx-auto py-10 px-4">
        <h1 className="text-2xl font-bold mb-4">Dispositivo: Sensor de Temperatura</h1>
        <div className="text-red-400">{error}</div>
      </main>
    );
  }

  if (!loading && cameras.length === 0) {
    return (
      <main className="max-w-5xl mx-auto py-10 px-4">
        <h1 className="text-2xl font-bold mb-4">Dispositivo: Sensor de Temperatura</h1>
        <div className="text-red-400">No hay cámaras disponibles.</div>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-4">
        Dispositivo: Sensor de Temperatura{" "}
        <span className="font-normal text-flowforge-accent">
          {selectedCamera || ""}
        </span>
      </h1>
      {/* Selector de cámara y fechas */}
      <div className="flex flex-wrap gap-8 mb-8 items-center">
        <div className="flex gap-2 items-center">
          <span className="text-[#8C92A4] font-semibold text-sm">Selecciona cámara:</span>
          <select
            className="bg-flowforge-panel text-white border border-flowforge-border rounded-lg px-3 py-2"
            value={selectedCamera || ""}
            onChange={(e) => setSelectedCamera(Number(e.target.value))}
            disabled={cameras.length === 0}
          >
            {cameras.map((cam) => (
              <option key={cam.camera_id} value={cam.camera_id}>
                Cámara {cam.camera_id}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-[#8C92A4] font-semibold text-sm">Rango de fechas:</span>
          <DatePicker
            selected={dateRange.desde}
            onChange={handleDesdeChange}
            selectsStart
            startDate={dateRange.desde}
            endDate={dateRange.hasta}
            maxDate={dateRange.hasta}
            dateFormat="yyyy-MM-dd"
            className="bg-flowforge-panel text-white rounded-lg px-3 py-2"
            placeholderText="Desde"
          />
          <span className="text-[#8C92A4] font-semibold text-sm">a</span>
          <DatePicker
            selected={dateRange.hasta}
            onChange={handleHastaChange}
            selectsEnd
            startDate={dateRange.desde}
            endDate={dateRange.hasta}
            minDate={dateRange.desde}
            maxDate={today}
            dateFormat="yyyy-MM-dd"
            className="bg-flowforge-panel text-white rounded-lg px-3 py-2"
            placeholderText="Hasta"
          />
        </div>
      </div>
      {/* Contenido del dispositivo */}
      {selectedCamera ? (
        <DeviceDetail
          cameraId={selectedCamera}
          token={token}
          desde={desde.toISOString()}
          hasta={hasta.toISOString()}
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
  // Usa el AuthContext (así tu login, logout y protección están centralizados)
  const { token, setToken, logout } = useContext(AuthContext);

  useEffect(() => {
    console.log("API Base URL:", API_BASE);
  }, []);

  const handleLogout = useCallback(() => {
    logout(); // Usa el método del contexto, así limpia todo (incluyendo localStorage)
  }, [logout]);

  if (!token || isTokenExpired(token)) {
    return (
      <div className="min-h-screen bg-flowforge-dark flex items-center justify-center">
        <Login onLogin={setToken} />
      </div>
    );
  }

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
