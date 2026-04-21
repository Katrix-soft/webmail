import React, { useState } from "react";
import axios from "axios";

/* Logo served from /public/arkhon-logo.png */
const LOGO_SRC = "/arkhon-logo.png";

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await axios.post("/api/auth/login", { email, password });
      onLogin();
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          "Credenciales incorrectas. Verificá e intentá de nuevo."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <img
            src={LOGO_SRC}
            alt="Arkhon"
            className="login-logo-img"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
          <div className="login-logo-text">
            <h1>
              Arkhon<span> Mail</span>
            </h1>
            <p>Correo corporativo seguro</p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="alert-error" style={{ marginBottom: 16 }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">
              Correo electrónico
            </label>
            <input
              id="login-email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@arkhon.com.ar"
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">
              Contraseña
            </label>
            <input
              id="login-password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          <button
            id="login-submit"
            type="submit"
            className="login-submit-btn"
            disabled={loading}
          >
            {loading ? "Iniciando sesión…" : "Iniciar sesión"}
          </button>
        </form>

        <p className="login-footer-note">mail.arkhon.com.ar</p>
      </div>
    </div>
  );
}
