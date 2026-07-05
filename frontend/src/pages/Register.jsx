import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "staff" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/auth/register", form);
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="auth-wrap">
      <svg className="auth-watermark" width="420" height="420" viewBox="0 0 32 32" fill="none">
        <path d="M6 11L16 4L26 11L16 28L6 11Z" stroke="#B08D57" strokeWidth="0.4" strokeLinejoin="round" />
        <path d="M6 11H26M11 11L16 4L21 11M11 11L16 28M21 11L16 28" stroke="#B08D57" strokeWidth="0.25" />
      </svg>
      <form className="auth-box" onSubmit={handleSubmit}>
        <h2>Create your account</h2>
        <p>SET UP INVENTORY ACCESS</p>
        {error && <div className="error">{error}</div>}
        <input
          placeholder="Full Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
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
        <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} style={{ marginBottom: 12 }}>
          <option value="staff">Staff</option>
          <option value="admin">Admin</option>
        </select>
        <button className="btn btn-primary" style={{ width: "100%" }} type="submit">
          Create account
        </button>
        <p style={{ marginTop: 14, fontSize: 13, fontFamily: "var(--font-body)", color: "var(--muted)" }}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
