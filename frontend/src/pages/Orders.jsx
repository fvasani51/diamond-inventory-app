import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api/axios";

const empty = { customerName: "", customerPhone: "", diamond: "", quantity: 1, totalAmount: "", paymentStatus: "pending", deliveryStatus: "pending" };

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [diamonds, setDiamonds] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [invoiceLoadingId, setInvoiceLoadingId] = useState(null);
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user?.role === "admin";

  const load = async () => {
    const { data } = await api.get("/orders");
    setOrders(data);
    const inv = await api.get("/inventory");
    setDiamonds(inv.data);
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post("/orders", form);
    setForm(empty);
    setShowForm(false);
    load();
  };

  const updateStatus = async (id, field, value) => {
    await api.put(`/orders/${id}`, { [field]: value });
    load();
  };

  const handleDelete = async (id) => {
    if (confirm("Delete this order?")) {
      await api.delete(`/orders/${id}`);
      load();
    }
  };

  const downloadInvoice = async (orderId) => {
    setInvoiceLoadingId(orderId);
    try {
      const res = await api.get(`/reports/invoice/${orderId}`, { responseType: "blob" });
      const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.setAttribute("download", `invoice-${orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      alert("Could not generate invoice. Please try again.");
    } finally {
      setInvoiceLoadingId(null);
    }
  };

  return (
    <Layout>
      <div className="toolbar">
        <div />
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Close" : "+ New Order"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card" style={{ marginBottom: 20 }}>
          <div className="form-grid">
            <input placeholder="Customer Name" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} required />
            <input placeholder="Customer Phone" value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} required />
            <select value={form.diamond} onChange={(e) => setForm({ ...form, diamond: e.target.value })} required>
              <option value="">Select Diamond</option>
              {diamonds.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.carat}ct {d.cut} {d.color} (Stock: {d.stockQuantity}) - ₹{d.price}
                </option>
              ))}
            </select>
            <input placeholder="Quantity" type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />
            <input placeholder="Total Amount (₹)" type="number" value={form.totalAmount} onChange={(e) => setForm({ ...form, totalAmount: e.target.value })} required />
          </div>
          <button className="btn btn-primary" type="submit">Create Order</button>
        </form>
      )}

      <table>
        <thead>
          <tr>
            <th>Customer</th><th>Phone</th><th>Diamond</th><th>Qty</th><th>Amount</th><th>Payment</th><th>Delivery</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o._id}>
              <td>{o.customerName}</td>
              <td>{o.customerPhone}</td>
              <td>{o.diamond ? `${o.diamond.carat}ct ${o.diamond.cut}` : "—"}</td>
              <td>{o.quantity}</td>
              <td>₹{o.totalAmount}</td>
              <td>
                <select value={o.paymentStatus} onChange={(e) => updateStatus(o._id, "paymentStatus", e.target.value)}>
                  <option value="pending">Pending</option>
                  <option value="partial">Partial</option>
                  <option value="paid">Paid</option>
                </select>
              </td>
              <td>
                <select value={o.deliveryStatus} onChange={(e) => updateStatus(o._id, "deliveryStatus", e.target.value)}>
                  <option value="pending">Pending</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                </select>
              </td>
              <td style={{ display: "flex", gap: 8 }}>
                {isAdmin && (
                  <button
                    className="btn btn-secondary"
                    onClick={() => downloadInvoice(o._id)}
                    disabled={invoiceLoadingId === o._id}
                  >
                    {invoiceLoadingId === o._id ? "…" : "🧾 Invoice"}
                  </button>
                )}
                {isAdmin && <button className="btn btn-danger" onClick={() => handleDelete(o._id)}>Delete</button>}
                {!isAdmin && "—"}
              </td>
            </tr>
          ))}
          {orders.length === 0 && <tr><td colSpan="8" style={{ textAlign: "center", padding: 20 }}>No orders yet</td></tr>}
        </tbody>
      </table>
    </Layout>
  );
}