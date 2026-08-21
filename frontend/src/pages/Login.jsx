import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const { data } = await api.post("/auth/login", form);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="auth-wrap">
      <svg className="auth-watermark" width="420" height="420" viewBox="0 0 32 32" fill="none">
        <path d="M6 11L16 4L26 11L16 28L6 11Z" stroke="#B08D57" strokeWidth="0.4" strokeLinejoin="round" />
        <path d="M6 11H26M11 11L16 4L21 11M11 11L16 28M21 11L16 28" stroke="#B08D57" strokeWidth="0.25" />
      </svg>
      <form className="auth-box" onSubmit={handleSubmit}>
        <h2>Welcome back</h2>
        <p>PALADIYA BROTHERS — INVENTORY ACCESS</p>
        {error && <div className="error">{error}</div>}
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
        <button className="btn btn-primary" style={{ width: "100%" }} type="submit">
          Sign in
        </button>
        <p style={{ marginTop: 14, fontSize: 13, fontFamily: "var(--font-body)", color: "var(--muted)" }}>
          No account? <Link to="/register">Register</Link>
        </p>
      </form>
    </div>
  );
}
