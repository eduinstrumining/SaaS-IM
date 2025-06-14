import React from "react";
import { NavLink } from "react-router-dom";
import Logo from "../assets/INSTRUMINING-logo.svg";
import UserAvatarAlt from "./UserAvatarAlt";  // Cambio aquí para importar el nuevo avatar

export default function Navbar({ onLogout }) {
  return (
    <nav className="w-full flex items-center justify-between px-8 py-4 border-b border-flowforge-border bg-flowforge-dark">
      {/* Logo estilo INSTRUMINING */}
      <div className="flex items-center gap-2 font-bold text-lg tracking-wide">
        <img src={Logo} alt="INSTRUMINING Logo" className="h-8 w-auto mr-2" />
        {/* Si quieres también dejar el texto, descomenta esta línea */}
        {/* <span>INSTRUMINING</span> */}
      </div>

      {/* Menú principal */}
      <div className="flex gap-7 font-medium text-sm text-[#D1D5DB]">
        <NavLink
          to="/"
          className={({ isActive }) =>
            "hover:text-white" + (isActive ? " text-white font-bold" : "")
          }
          end
        >
          Dashboard
        </NavLink>
        <NavLink
          to="/devices"
          className={({ isActive }) =>
            "hover:text-white" + (isActive ? " text-white font-bold" : "")
          }
        >
          Dispositivos
        </NavLink>
        {/* ---- Nuevo NavLink para zonas (termómetros) ---- */}
        <NavLink
          to="/zonas"
          className={({ isActive }) =>
            "hover:text-white" + (isActive ? " text-white font-bold" : "")
          }
        >
          Zonas (Termómetros)
        </NavLink>
        {/* ---- Fin del nuevo ---- */}
        <NavLink
          to="/alerts"
          className={({ isActive }) =>
            "hover:text-white" + (isActive ? " text-white font-bold" : "")
          }
        >
          Alertas
        </NavLink>
        <NavLink
          to="/users"
          className={({ isActive }) =>
            "hover:text-white" + (isActive ? " text-white font-bold" : "")
          }
        >
          Usuarios
        </NavLink>
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            "hover:text-white" + (isActive ? " text-white font-bold" : "")
          }
        >
          Configuración
        </NavLink>
      </div>

      {/* Avatar + Logout */}
      <div className="flex items-center gap-2">
        <UserAvatarAlt />
        {onLogout && (
          <button
            className="ml-4 px-4 py-2 rounded bg-flowforge-border text-[#D1D5DB] hover:bg-flowforge-accent hover:text-flowforge-dark transition font-bold"
            onClick={onLogout}
          >
            Salir
          </button>
        )}
      </div>
    </nav>
  );
}
