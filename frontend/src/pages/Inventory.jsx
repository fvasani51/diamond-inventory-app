import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api/axios";

const empty = { carat: "", cut: "", color: "", clarity: "", shape: "", certification: "", price: "", stockQuantity: 1 };

export default function Inventory() {
  const [diamonds, setDiamonds] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [qrImage, setQrImage] = useState(null);
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user?.role === "admin";

  const load = async () => {
    const { data } = await api.get("/inventory", { params: { search } });
    setDiamonds(data);
  };

  useEffect(() => { load(); }, [search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editId) {
      await api.put(`/inventory/${editId}`, form);
    } else {
      await api.post("/inventory", form);
    }
    setForm(empty);
    setEditId(null);
    setShowForm(false);
    load();
  };

  const handleEdit = (d) => {
    setForm({ ...d });
    setEditId(d._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Delete this diamond?")) {
      await api.delete(`/inventory/${id}`);
      load();
    }
  };

  const showQr = async (id) => {
    const { data } = await api.get(`/inventory/${id}/qrcode`);
    setQrImage(data.qrDataUrl);
  };

  return (
    <Layout>
      <div className="toolbar">
        <input
          placeholder="Search by cut, color, shape, clarity..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 320 }}
        />
        <button className="btn btn-primary" onClick={() => { setForm(empty); setEditId(null); setShowForm(!showForm); }}>
          {showForm ? "Close" : "+ Add Diamond"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card" style={{ marginBottom: 20 }}>
          <div className="form-grid">
            <input placeholder="Carat" type="number" step="0.01" value={form.carat} onChange={(e) => setForm({ ...form, carat: e.target.value })} required />
            <input placeholder="Cut" value={form.cut} onChange={(e) => setForm({ ...form, cut: e.target.value })} required />
            <input placeholder="Color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} required />
            <input placeholder="Clarity" value={form.clarity} onChange={(e) => setForm({ ...form, clarity: e.target.value })} required />
            <input placeholder="Shape" value={form.shape} onChange={(e) => setForm({ ...form, shape: e.target.value })} required />
            <input placeholder="Certification" value={form.certification} onChange={(e) => setForm({ ...form, certification: e.target.value })} />
            <input placeholder="Price (₹)" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
            <input placeholder="Stock Quantity" type="number" value={form.stockQuantity} onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })} required />
          </div>
          <button className="btn btn-primary" type="submit">{editId ? "Update" : "Save"} Diamond</button>
        </form>
      )}

      <table>
        <thead>
          <tr>
            <th>Carat</th><th>Cut</th><th>Color</th><th>Clarity</th><th>Shape</th><th>Price</th><th>Stock</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {diamonds.map((d) => (
            <tr key={d._id}>
              <td>{d.carat}</td>
              <td>{d.cut}</td>
              <td>{d.color}</td>
              <td>{d.clarity}</td>
              <td>{d.shape}</td>
              <td>₹{d.price}</td>
              <td>{d.stockQuantity}</td>
              <td>
                <button className="btn btn-secondary" onClick={() => showQr(d._id)} style={{ marginRight: 6 }}>QR</button>
                <button className="btn btn-secondary" onClick={() => handleEdit(d)} style={{ marginRight: 6 }}>Edit</button>
                {isAdmin && <button className="btn btn-danger" onClick={() => handleDelete(d._id)}>Delete</button>}
              </td>
            </tr>
          ))}
          {diamonds.length === 0 && <tr><td colSpan="8" style={{ textAlign: "center", padding: 20 }}>No diamonds found</td></tr>}
        </tbody>
      </table>

      {qrImage && (
        <div
          onClick={() => setQrImage(null)}
          style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50,
          }}
        >
          <div className="card" onClick={(e) => e.stopPropagation()} style={{ textAlign: "center" }}>
            <h3>Scan for Diamond Details</h3>
            <img src={qrImage} alt="Diamond QR Code" style={{ width: 260, height: 260 }} />
            <div>
              <button className="btn btn-secondary" onClick={() => setQrImage(null)} style={{ marginTop: 12 }}>Close</button>
              <a href={qrImage} download="diamond-qr.png" className="btn btn-primary" style={{ marginTop: 12, marginLeft: 8, textDecoration: "none" }}>
                Download
              </a>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
