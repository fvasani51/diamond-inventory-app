import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api/axios";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    api.get("/reports/dashboard").then((res) => setStats(res.data)).catch(() => {});
  }, []);

  const downloadFile = async (url, filename) => {
    const res = await api.get(url, { responseType: "blob" });
    const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = blobUrl;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);
  };

  if (!stats) return <Layout><p>Loading...</p></Layout>;

  return (
    <Layout>
      {isAdmin && (
        <div className="toolbar" style={{ marginBottom: 16 }}>
          <button className="btn btn-secondary" onClick={() => downloadFile("/reports/export/pdf", "diamond-business-report.pdf")}>
            📄 Export PDF Report
          </button>
          <button className="btn btn-secondary" onClick={() => downloadFile("/reports/export/excel", "diamond-inventory.xlsx")}>
            📊 Export Excel Inventory
          </button>
        </div>
      )}

      <div className="card-grid">
        <div className="card">
          <h3>Total Stock Value</h3>
          <div className="value">₹{stats.totalStockValue.toLocaleString()}</div>
        </div>
        <div className="card">
          <h3>Diamonds in Stock</h3>
          <div className="value">{stats.totalDiamonds}</div>
        </div>
        <div className="card">
          <h3>Total Orders</h3>
          <div className="value">{stats.totalOrders}</div>
        </div>
        <div className="card">
          <h3>Pending Orders</h3>
          <div className="value">{stats.pendingOrders}</div>
        </div>
        <div className="card">
          <h3>Total Sales</h3>
          <div className="value">₹{stats.totalSales.toLocaleString()}</div>
        </div>
        <div className="card">
          <h3>Amount Collected</h3>
          <div className="value">₹{stats.paidAmount.toLocaleString()}</div>
        </div>
      </div>
    </Layout>
  );
}
