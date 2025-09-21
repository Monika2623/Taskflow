import React, { useState } from "react";
import { login } from "../../api/client";
import { useNavigate } from "react-router-dom";
import AuthBackground from "./AuthBackground";
import "./authStyles.css";

type AuthPageProps = {
  onAuth: () => void;
};

// Simple username/password login to obtain JWT from Django

const AuthPage: React.FC<AuthPageProps> = ({ onAuth }) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErr("");
    try {
      const tokens = await login(username, password);
      localStorage.setItem("accessToken", tokens.access);
      localStorage.setItem("refreshToken", tokens.refresh);
      onAuth();
      navigate("/your-work", { replace: true });
    } catch (e: any) {
      setErr(e?.message || "Login failed");
    }
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <AuthBackground />
      <div className="auth-box">
        <h1 className="auth-title">TaskFlow </h1>
        <p className="auth-subtitle">Sign in with your E-mail</p>

        <form onSubmit={handleLogin}>
          <input
            type="text"
            required
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="auth-input"
            autoFocus
          />
          <input
            type="password"
            required
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="auth-input"
          />
          {err && <p className="auth-error">{err}</p>}
          <button disabled={loading} className="auth-button cool-mode">
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthPage;
