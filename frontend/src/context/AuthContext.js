import React, { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [company, setCompany] = useState(localStorage.getItem("company") || "");
  const [user, setUser] = useState(localStorage.getItem("user") || "");

  const login = ({ token, company, user }) => {
    setToken(token);
    setCompany(company);
    setUser(user);
    localStorage.setItem("token", token);
    localStorage.setItem("company", company);
    localStorage.setItem("user", user);
  };

  const logout = () => {
    setToken(null);
    setCompany("");
    setUser("");
    localStorage.removeItem("token");
    localStorage.removeItem("company");
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ token, company, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
