import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api/axios";
import CountUp from "../components/CountUp";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const PIE_COLORS = ["#B08D57", "#3B5570", "#4B7A5E", "#A14B3F", "#B07F1E", "#78705F"];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [insight, setInsight] = useState(null);
  const [insightLoading, setInsightLoading] = useState(true);
  const [insightError, setInsightError] = useState(false);
  const [lowStock, setLowStock] = useState({ count: 0, items: [] });
  const [chartData, setChartData] = useState({ salesTrend: [], inventoryByCut: [] });
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    api.get("/reports/dashboard").then((res) => setStats(res.data)).catch(() => {});
    fetchInsight();
    fetchLowStock();
    fetchChartData();
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

  const fetchLowStock = () => {
    api
      .get("/inventory/low-stock")
      .then((res) => setLowStock(res.data))
      .catch(() => {});
  };

  const fetchChartData = () => {
    api
      .get("/reports/chart-data")
      .then((res) => setChartData(res.data))
      .catch(() => {});
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

      {lowStock.count > 0 && (
        <div className="low-stock-banner">
          <span className="low-stock-icon">⚠️</span>
          <span className="low-stock-text">
            <strong>{lowStock.count}</strong> diamond{lowStock.count > 1 ? "s are" : " is"} running low on stock
            (≤ {lowStock.threshold} left):{" "}
            {lowStock.items
              .slice(0, 3)
              .map((d) => `${d.carat}ct ${d.shape}`)
              .join(", ")}
            {lowStock.items.length > 3 ? ` +${lowStock.items.length - 3} more` : ""}
          </span>
        </div>
      )}

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
        <div className={`card ${lowStock.count > 0 ? "card-alert" : ""}`}>
          <h3>Low Stock Items</h3>
          <div className="value"><CountUp value={lowStock.count} /></div>
        </div>
      </div>

      <div className="chart-grid">
        <div className="chart-card">
          <h3 className="chart-title">Sales Trend</h3>
          {chartData.salesTrend.length === 0 ? (
            <p className="empty-state">No sales data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData.salesTrend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7E1D3" />
                <XAxis dataKey="date" fontSize={11} stroke="#78705F" />
                <YAxis fontSize={11} stroke="#78705F" tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip formatter={(v) => `₹${v.toLocaleString()}`} />
                <Line type="monotone" dataKey="total" stroke="#B08D57" strokeWidth={2.5} dot={{ r: 4, fill: "#B08D57" }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="chart-card">
          <h3 className="chart-title">Inventory by Cut</h3>
          {chartData.inventoryByCut.length === 0 ? (
            <p className="empty-state">No inventory data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={chartData.inventoryByCut}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                >
                  {chartData.inventoryByCut.map((entry, index) => (
                    <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </Layout>
  );
}