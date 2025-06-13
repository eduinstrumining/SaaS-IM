import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { AuthProvider } from "./context/AuthContext"; // <--- IMPORTANTE

// Monta la app React con el contexto de autenticación global
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);

// trigger deploy jueves, 5 de junio de 2025, 12:51:43 -04
