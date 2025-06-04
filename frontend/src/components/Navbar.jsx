import React from "react";
import { NavLink } from "react-router-dom";

export default function Navbar({ onLogout }) {
  return (
    <nav className="w-full flex items-center justify-between px-8 py-4 border-b border-flowforge-border bg-flowforge-dark">
      {/* Logo estilo FlowForge */}
      <div className="flex items-center gap-2 font-bold text-lg tracking-wide">
        <span className="block w-4 h-4 bg-white rounded mr-2"></span>
        FlowForge
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
        <div className="rounded-full bg-flowforge-panel w-8 h-8 flex items-center justify-center">
          <span className="text-[#8C92A4] text-lg">👤</span>
        </div>
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
