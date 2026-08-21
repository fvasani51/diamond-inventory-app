import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

const SHAPES = [
  { key: "Round", icon: <circle cx="12" cy="12" r="9" /> },
  { key: "Pear", icon: <path d="M12 3c4 4 7 8 7 12a7 7 0 1 1-14 0c0-4 3-8 7-12z" /> },
  { key: "Marquise", icon: <path d="M12 3c5 3 8 6 8 9s-3 6-8 9c-5-3-8-6-8-9s3-6 8-9z" /> },
  { key: "Oval", icon: <ellipse cx="12" cy="12" rx="6.5" ry="9" /> },
  { key: "Heart", icon: <path d="M12 20S3 13.5 3 8.2A4.2 4.2 0 0 1 12 6a4.2 4.2 0 0 1 9 2.2C21 13.5 12 20 12 20z" /> },
  { key: "Emerald", icon: <rect x="4" y="6" width="16" height="12" rx="2" /> },
  { key: "Princess", icon: <rect x="4" y="4" width="16" height="16" /> },
  { key: "Radiant", icon: <rect x="4" y="6" width="16" height="12" rx="3" /> },
  { key: "Cushion", icon: <rect x="4" y="4" width="16" height="16" rx="6" /> },
  { key: "Asscher", icon: <rect x="4.5" y="4.5" width="15" height="15" rx="1" /> },
  { key: "Triangle", icon: <path d="M12 4l9 16H3z" /> },
];

const COLORS = ["Fancy", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O-P", "Q-R", "S-T", "U-V", "W-X", "Y-Z"];
const CLARITY = ["FL", "IF", "VVS1", "VVS2", "VS1", "VS2", "SI1", "SI2", "SI3", "I1", "I2", "I3"];
const CUT = ["All", "EX", "VG", "G", "F", "3EX", "3VG+", "VG-"];
const POLISH = ["All", "EX", "VG", "G", "F"];
const SYMMETRY = ["All", "EX", "VG", "G", "F"];
const FLUORESCENCE = ["All", "NON", "FNT", "VSL", "SLT", "MED", "STG", "VSTG"];
const LAB = ["All", "GIA", "IGI", "HRD", "Other"];

const emptyForm = {
  name: "",
  email: "",
  companyName: "",
  phone: "",
  shapes: [],
  pieces: "",
  orderType: "Certified",
  caratFrom: "",
  caratTo: "",
  colors: [],
  clarity: [],
  cut: [],
  polish: [],
  symmetry: [],
  fluorescence: [],
  lab: [],
  remark: "",
};

export default function Inquiry() {
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const toggleShape = (shape) => {
    if (shape === "All Select") {
      setForm((f) => ({ ...f, shapes: f.shapes.length === SHAPES.length ? [] : SHAPES.map((s) => s.key) }));
      return;
    }
    setForm((f) => ({
      ...f,
      shapes: f.shapes.includes(shape) ? f.shapes.filter((s) => s !== shape) : [...f.shapes, shape],
    }));
  };

  const toggleMulti = (field, value) => {
    setForm((f) => ({
      ...f,
      [field]: f[field].includes(value) ? f[field].filter((v) => v !== value) : [...f[field], value],
    }));
  };

  const toggleWithAll = (field, value) => {
    setForm((f) => {
      if (value === "All") {
        return { ...f, [field]: f[field].includes("All") ? [] : ["All"] };
      }
      const withoutAll = f[field].filter((v) => v !== "All");
      const next = withoutAll.includes(value) ? withoutAll.filter((v) => v !== value) : [...withoutAll, value];
      return { ...f, [field]: next };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.post("/inquiry", form);
      setSubmitted(true);
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="inquiry-page">
        <div className="inquiry-success">
          <h2>Thank you!</h2>
          <p>Your inquiry has been received. Our team will get back to you shortly.</p>
          <Link to="/" className="btn btn-primary">Back to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="inquiry-page">
      <div className="inquiry-header">
        <Link to="/" className="inquiry-brand">Paladiya Brothers</Link>
      </div>

      <form onSubmit={handleSubmit} className="inquiry-form">
        <h1>Inquiry Detail</h1>

        <div className="inquiry-section">
          <h3>User Detail</h3>
          <div className="inquiry-user-grid">
            <input placeholder="Name*" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <input placeholder="Email*" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            <input placeholder="Company Name*" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} required />
            <input placeholder="Phone*" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
          </div>
        </div>

        <div className="inquiry-section">
          <h3>Select Shape</h3>
          <div className="shape-grid">
            <button
              type="button"
              className={`shape-btn ${form.shapes.length === SHAPES.length ? "shape-btn-active" : ""}`}
              onClick={() => toggleShape("All Select")}
            >
              <span className="shape-label-only">All Select</span>
            </button>
            {SHAPES.map((s) => (
              <button
                type="button"
                key={s.key}
                className={`shape-btn ${form.shapes.includes(s.key) ? "shape-btn-active" : ""}`}
                onClick={() => toggleShape(s.key)}
              >
                <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1.3">
                  {s.icon}
                </svg>
                <span>{s.key}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="inquiry-section inquiry-row-fields">
          <div className="inquiry-field">
            <label>Pieces</label>
            <input type="number" min="1" value={form.pieces} onChange={(e) => setForm({ ...form, pieces: e.target.value })} />
          </div>

          <div className="inquiry-field">
            <label>Order Type</label>
            <div className="toggle-pair">
              {["Certified", "Loose"].map((t) => (
                <button
                  type="button"
                  key={t}
                  className={`toggle-btn ${form.orderType === t ? "toggle-btn-active" : ""}`}
                  onClick={() => setForm({ ...form, orderType: t })}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="inquiry-field">
            <label>Carat Range</label>
            <div className="carat-range">
              <input type="number" step="0.01" placeholder="From" value={form.caratFrom} onChange={(e) => setForm({ ...form, caratFrom: e.target.value })} />
              <input type="number" step="0.01" placeholder="To" value={form.caratTo} onChange={(e) => setForm({ ...form, caratTo: e.target.value })} />
            </div>
          </div>
        </div>

        <div className="inquiry-section">
          <h3>Color</h3>
          <div className="color-grid">
            {COLORS.map((c) => (
              <button
                type="button"
                key={c}
                className={`toggle-btn ${form.colors.includes(c) ? "toggle-btn-active" : ""}`}
                onClick={() => toggleMulti("colors", c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="inquiry-section">
          <h3>Clarity</h3>
          <div className="color-grid">
            {CLARITY.map((c) => (
              <button
                type="button"
                key={c}
                className={`toggle-btn ${form.clarity.includes(c) ? "toggle-btn-active" : ""}`}
                onClick={() => toggleMulti("clarity", c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="inquiry-section">
          <h3>Cut</h3>
          <div className="color-grid">
            {CUT.map((c) => (
              <button
                type="button"
                key={c}
                className={`toggle-btn ${form.cut.includes(c) ? "toggle-btn-active" : ""}`}
                onClick={() => toggleWithAll("cut", c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="inquiry-section">
          <h3>Polish</h3>
          <div className="color-grid">
            {POLISH.map((c) => (
              <button
                type="button"
                key={c}
                className={`toggle-btn ${form.polish.includes(c) ? "toggle-btn-active" : ""}`}
                onClick={() => toggleWithAll("polish", c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="inquiry-section">
          <h3>Symmetry</h3>
          <div className="color-grid">
            {SYMMETRY.map((c) => (
              <button
                type="button"
                key={c}
                className={`toggle-btn ${form.symmetry.includes(c) ? "toggle-btn-active" : ""}`}
                onClick={() => toggleWithAll("symmetry", c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="inquiry-section">
          <h3>Fluorescence</h3>
          <div className="color-grid">
            {FLUORESCENCE.map((c) => (
              <button
                type="button"
                key={c}
                className={`toggle-btn ${form.fluorescence.includes(c) ? "toggle-btn-active" : ""}`}
                onClick={() => toggleWithAll("fluorescence", c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="inquiry-section">
          <h3>Lab</h3>
          <div className="color-grid">
            {LAB.map((c) => (
              <button
                type="button"
                key={c}
                className={`toggle-btn ${form.lab.includes(c) ? "toggle-btn-active" : ""}`}
                onClick={() => toggleWithAll("lab", c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="inquiry-section">
          <h3>Remark</h3>
          <textarea
            className="inquiry-remark"
            rows={3}
            placeholder="Any additional notes or requirements..."
            value={form.remark}
            onChange={(e) => setForm({ ...form, remark: e.target.value })}
          />
        </div>

        {error && <p className="error">{error}</p>}

        <button className="btn btn-primary inquiry-submit-btn" type="submit" disabled={submitting}>
          {submitting ? "Submitting…" : "Submit Inquiry"}
        </button>
      </form>
    </div>
  );
}