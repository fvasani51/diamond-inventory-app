import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api/axios";
import CountUp from "../components/CountUp";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [insight, setInsight] = useState(null);
  const [insightLoading, setInsightLoading] = useState(true);
  const [insightError, setInsightError] = useState(false);
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    api.get("/reports/dashboard").then((res) => setStats(res.data)).catch(() => {});
    fetchInsight();
  }, []);

  const fetchInsight = (refresh = false) => {
    setInsightLoading(true);
    setInsightError(false);
    api
      .get(`/reports/ai-insights${refresh ? "?refresh=true" : ""}`)
      .then((res) => setInsight(res.data.insight))
      .catch(() => setInsightError(true))
      .finally(() => setInsightLoading(false));
  };

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

  if (!stats) {
    return (
      <Layout>
        <div className="skeleton-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton-card" style={{ animationDelay: `${i * 0.05}s` }} />
          ))}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="ai-insight-card">
        <div className="ai-insight-head">
          <span className="ai-badge">✦ AI Insight</span>
          <button
            className="ai-refresh-btn"
            onClick={() => fetchInsight(true)}
            disabled={insightLoading}
            title="Refresh insight"
          >
            {insightLoading ? "…" : "↻"}
          </button>
        </div>
        {insightLoading ? (
          <div className="ai-insight-skeleton" />
        ) : insightError ? (
          <p className="ai-insight-text ai-insight-error">Couldn't load an insight right now — try refreshing.</p>
        ) : (
          <p className="ai-insight-text">{insight}</p>
        )}
      </div>

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
          <div className="value"><CountUp value={stats.totalStockValue} format={(n) => `₹${n.toLocaleString()}`} /></div>
        </div>
        <div className="card">
          <h3>Diamonds in Stock</h3>
          <div className="value"><CountUp value={stats.totalDiamonds} /></div>
        </div>
        <div className="card">
          <h3>Total Orders</h3>
          <div className="value"><CountUp value={stats.totalOrders} /></div>
        </div>
        <div className="card">
          <h3>Pending Orders</h3>
          <div className="value"><CountUp value={stats.pendingOrders} /></div>
        </div>
        <div className="card">
          <h3>Total Sales</h3>
          <div className="value"><CountUp value={stats.totalSales} format={(n) => `₹${n.toLocaleString()}`} /></div>
        </div>
        <div className="card">
          <h3>Amount Collected</h3>
          <div className="value"><CountUp value={stats.paidAmount} format={(n) => `₹${n.toLocaleString()}`} /></div>
        </div>
      </div>
    </Layout>
  );
}