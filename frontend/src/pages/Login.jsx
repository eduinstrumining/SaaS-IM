import React, { useEffect, useState } from "react";
import { loginUser, fetchCompanies } from "../api";
import Logo from "../assets/INSTRUMINING-logo.svg";

export default function Login({ onLogin }) {
  const [companies, setCompanies] = useState([]);
  const [companyId, setCompanyId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [loading, setLoading] = useState(false);

  // Trae las empresas solo una vez al montar
  useEffect(() => {
    setLoadingCompanies(true);
    fetchCompanies()
      .then((companies) => {
        setCompanies(companies);
      })
      .catch(() => setError("No se pudieron cargar las empresas"))
      .finally(() => setLoadingCompanies(false));
  }, []);

  // Mejor UX: submit solo si todo está ok
  const canSubmit = companyId && email && password && !loading && !loadingCompanies;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const token = await loginUser(email, password, companyId);
      // Puedes agregar aquí más datos si usas AuthContext, por ejemplo: onLogin({ token, company: companyId, user: email });
      localStorage.setItem("token", token);
      onLogin(token); // O pásale el objeto si tu contexto lo requiere
    } catch (err) {
      const msg =
        err?.message?.replace(/^Error:\s*/, "") ||
        "Error al iniciar sesión. Intenta nuevamente.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0A0D12] px-6 text-white">
      <div className="mb-10 flex justify-center w-full max-w-sm">
        <img src={Logo} alt="INSTRUMINING Logo" className="h-20 object-contain" />
      </div>
      <h1 className="text-4xl font-bold mb-10">Log in to your account</h1>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm flex flex-col gap-6"
        aria-label="Login form"
        autoComplete="on"
      >
        {error && (
          <div role="alert" className="text-red-600 font-semibold text-center mb-2">
            {error}
          </div>
        )}

        <select
          className="bg-[#1F2937] text-white rounded-2xl px-6 py-5 placeholder-gray-400 appearance-none focus:outline-none focus:ring-2 focus:ring-[#72B1FF] transition text-lg"
          value={companyId}
          onChange={(e) => setCompanyId(e.target.value)}
          required
          disabled={loadingCompanies}
          aria-label="Selecciona tu empresa"
        >
          <option value="">Selecciona tu empresa</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
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
          disabled={!canSubmit}
          aria-busy={loading}
          aria-disabled={!canSubmit}
        >
          {loading ? "Signing in..." : "Iniciar Sesión"}
        </button>
      </form>
    </div>
  );
}
