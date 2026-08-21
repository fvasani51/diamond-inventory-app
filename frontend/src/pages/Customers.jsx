import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api/axios";

const empty = { name: "", phone: "", email: "", address: "", notes: "" };

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [selected, setSelected] = useState(null); // customer + order history
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user?.role === "admin";

  const load = async () => {
    const { data } = await api.get("/customers", { params: { search } });
    setCustomers(data);
  };

  useEffect(() => { load(); }, [search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editId) {
      await api.put(`/customers/${editId}`, form);
    } else {
      await api.post("/customers", form);
    }
    setForm(empty);
    setEditId(null);
    setShowForm(false);
    load();
  };

  const handleEdit = (c) => {
    setForm({ ...c });
    setEditId(c._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Delete this customer?")) {
      await api.delete(`/customers/${id}`);
      load();
    }
  };

  const viewHistory = async (id) => {
    const { data } = await api.get(`/customers/${id}`);
    setSelected(data);
  };

  return (
    <Layout>
      <div className="toolbar">
        <input
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 320 }}
        />
        <button className="btn btn-primary" onClick={() => { setForm(empty); setEditId(null); setShowForm(!showForm); }}>
          {showForm ? "Close" : "+ Add Customer"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card" style={{ marginBottom: 20 }}>
          <div className="form-grid">
            <input placeholder="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
            <input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            <input placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <button className="btn btn-primary" type="submit">{editId ? "Update" : "Save"} Customer</button>
        </form>
      )}

      <table>
        <thead>
          <tr>
            <th>Name</th><th>Phone</th><th>Email</th><th>Address</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((c) => (
            <tr key={c._id}>
              <td>{c.name}</td>
              <td>{c.phone}</td>
              <td>{c.email || "-"}</td>
              <td>{c.address || "-"}</td>
              <td>
                <button className="btn btn-secondary" onClick={() => viewHistory(c._id)} style={{ marginRight: 6 }}>History</button>
                <button className="btn btn-secondary" onClick={() => handleEdit(c)} style={{ marginRight: 6 }}>Edit</button>
                {isAdmin && <button className="btn btn-danger" onClick={() => handleDelete(c._id)}>Delete</button>}
              </td>
            </tr>
          ))}
          {customers.length === 0 && <tr><td colSpan="5" style={{ textAlign: "center", padding: 20 }}>No customers found</td></tr>}
        </tbody>
      </table>

      {selected && (
        <div className="card" style={{ marginTop: 20 }}>
          <div className="toolbar">
            <h3>Order History — {selected.customer.name}</h3>
            <button className="btn btn-secondary" onClick={() => setSelected(null)}>Close</button>
          </div>
          <table>
            <thead>
              <tr><th>Diamond</th><th>Qty</th><th>Amount</th><th>Payment</th><th>Delivery</th></tr>
            </thead>
            <tbody>
              {selected.orders.map((o) => (
                <tr key={o._id}>
                  <td>{o.diamond ? `${o.diamond.carat}ct ${o.diamond.cut}` : "—"}</td>
                  <td>{o.quantity}</td>
                  <td>₹{o.totalAmount}</td>
                  <td>{o.paymentStatus}</td>
                  <td>{o.deliveryStatus}</td>
                </tr>
              ))}
              {selected.orders.length === 0 && <tr><td colSpan="5" style={{ textAlign: "center", padding: 20 }}>No orders yet</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
}
