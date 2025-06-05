import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { fetchCompanies, loginUser } from "../api";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [companies, setCompanies] = useState([]);
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loadingCompanies, setLoadingCompanies] = useState(true);

  useEffect(() => {
    setLoadingCompanies(true);
    fetchCompanies()
      .then((data) => {
        setCompanies(data);
        setLoadingCompanies(false);
      })
      .catch(() => {
        setError("No se pudieron cargar las empresas");
        setLoadingCompanies(false);
      });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const resp = await loginUser(email, password, company);
      // resp puede ser token directamente o { token } según API, acá asumimos token directo
      login({ token: resp, company, user: email });
      navigate("/"); // Redirige al dashboard raíz
    } catch (err) {
      // Mostrar mensaje de error real si viene
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#181112] px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-[#221718] rounded-2xl p-8 shadow-lg flex flex-col gap-4"
      >
        <h1 className="text-3xl font-bold text-white mb-6 text-center">
          Welcome back
        </h1>

        <select
          className="bg-[#3A2324] text-white rounded-md p-3 focus:outline-none"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          required
          disabled={loadingCompanies}
          aria-label="Select your company"
        >
          <option value="">Select your company</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name || "Unnamed Company"}
            </option>
          ))}
        </select>

        <input
          type="email"
          placeholder="Email"
          className="bg-[#3A2324] text-white rounded-md p-3 focus:outline-none"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          aria-label="Email"
          autoComplete="username"
        />

        <input
          type="password"
          placeholder="Password"
          className="bg-[#3A2324] text-white rounded-md p-3 focus:outline-none"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          aria-label="Password"
          autoComplete="current-password"
        />

        <a href="#" className="text-xs text-gray-300 underline mb-2">
          Forgot password?
        </a>

        <button
          type="submit"
          className="bg-[#B30717] hover:bg-[#8B0612] text-white font-bold rounded-md p-3 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={loading || loadingCompanies}
          aria-busy={loading}
        >
          {loading ? "Logging in..." : "Log in"}
        </button>

        {error && (
          <div
            role="alert"
            className="text-red-400 text-sm font-semibold text-center mt-2"
          >
            {error}
          </div>
        )}

        <div className="text-xs text-gray-300 mt-4 text-center">
          Don't have an account?{" "}
          <a href="#" className="underline">
            Sign up
          </a>
        </div>
      </form>
    </div>
  );
}
