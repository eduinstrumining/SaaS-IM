import React, { useEffect, useState } from "react";
import { loginUser, fetchCompanies } from "../api";

export default function Login({ onLogin }) {
  const [companies, setCompanies] = useState([]);
  const [companyId, setCompanyId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCompanies()
      .then((companies) => {
        setCompanies(companies);
        setLoadingCompanies(false);
      })
      .catch(() => {
        setError("No se pudieron cargar las empresas");
        setLoadingCompanies(false);
      });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const token = await loginUser(email, password, companyId);
      localStorage.setItem("token", token);
      onLogin(token);
    } catch (err) {
      // Mejor manejo de error para mostrar el mensaje correcto
      const msg = err.message || err.toString() || "Error al iniciar sesión";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0A0D12] px-6 text-white">
      {/* Logo arriba, centrado */}
      <div className="mb-10 flex justify-center w-full max-w-sm">
        <img
          src="/src/assets/INSTRUMINING-logo.svg"
          alt="INSTRUMINING Logo"
          className="h-20 object-contain"
        />
      </div>

      {/* Título fuera del formulario */}
      <h1 className="text-4xl font-bold mb-10">Log in to your account</h1>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm flex flex-col gap-6"
        aria-label="Login form"
      >
        {error && (
          <div
            role="alert"
            className="text-red-600 font-semibold text-center mb-2"
          >
            {error}
          </div>
        )}

        <select
          className="bg-[#1F2937] text-white rounded-2xl px-6 py-5 placeholder-gray-400 appearance-none focus:outline-none focus:ring-2 focus:ring-[#72B1FF] transition text-lg"
          value={companyId}
          onChange={(e) => setCompanyId(e.target.value)}
          required
          disabled={loadingCompanies}
          aria-label="Select your company"
        >
          <option value="" className="text-gray-400">
            Select your company
          </option>
          {companies.map((c) => (
            <option key={c.id} value={c.id} className="text-white">
              {c.name}
            </option>
          ))}
        </select>

        <input
          className="bg-[#1F2937] text-white rounded-2xl px-6 py-5 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#72B1FF] transition text-lg"
          type="email"
          placeholder="Email"
          value={email}
          autoComplete="username"
          onChange={(e) => setEmail(e.target.value)}
          required
          aria-label="Email"
        />

        <input
          className="bg-[#1F2937] text-white rounded-2xl px-6 py-5 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#72B1FF] transition text-lg"
          type="password"
          placeholder="Password"
          value={password}
          autoComplete="current-password"
          onChange={(e) => setPassword(e.target.value)}
          required
          aria-label="Password"
        />

        <button
          className="w-full bg-[#A9E7FF] text-black font-extrabold rounded-2xl px-6 py-5 mt-4 hover:bg-[#8ed1ff] transition disabled:opacity-50 disabled:cursor-not-allowed text-lg"
          type="submit"
          disabled={loading || loadingCompanies}
          aria-busy={loading}
          aria-disabled={loading || loadingCompanies}
        >
          {loading ? "Signing in..." : "Iniciar Sesión"}
        </button>
      </form>
    </div>
  );
}
