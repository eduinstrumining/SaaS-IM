// src/context/AuthContext.js

import React, { createContext, useContext, useState, useEffect } from "react";

// Creamos el contexto de autenticación
const AuthContext = createContext();

// Proveedor del contexto de autenticación
export function AuthProvider({ children }) {
  // Estado inicial seguro: toma de localStorage si existe (permite persistencia de sesión)
  const [token, setToken] = useState(() => localStorage.getItem("token") || null);
  const [company, setCompany] = useState(() => localStorage.getItem("company") || "");
  const [user, setUser] = useState(() => localStorage.getItem("user") || "");

  // Si cambian token, company o user, sincronizamos con localStorage (protege contra errores de sincronía)
  useEffect(() => {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");

    if (company) localStorage.setItem("company", company);
    else localStorage.removeItem("company");

    if (user) localStorage.setItem("user", user);
    else localStorage.removeItem("user");
  }, [token, company, user]);

  // Función de login
  const login = ({ token, company, user }) => {
    setToken(token);
    setCompany(company);
    setUser(user);
    // El useEffect anterior se encarga de sincronizar el localStorage
  };

  // Función de logout
  const logout = () => {
    setToken(null);
    setCompany("");
    setUser("");
    // El useEffect limpia localStorage automáticamente
  };

  // Valor que entrega el contexto a los hijos
  const value = { token, company, user, login, logout };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook para consumir el contexto en cualquier componente
export const useAuth = () => useContext(AuthContext);
