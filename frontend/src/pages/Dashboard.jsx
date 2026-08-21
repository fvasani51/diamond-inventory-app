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
  const [lowStock, setLowStock] = useState({ count: 0, items: [] });
  const [chartData, setChartData] = useState({ salesTrend: [], inventoryByCut: [] });
  const [activity, setActivity] = useState([]);
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user?.role === "admin";

  // --- Invite Staff state ---
  const [showInvite, setShowInvite] = useState(false);
  const [inviteRole, setInviteRole] = useState("staff");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteResult, setInviteResult] = useState(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");

  useEffect(() => {
    api.get("/reports/dashboard").then((res) => setStats(res.data)).catch(() => {});
    fetchLowStock();
    fetchChartData();
    fetchActivity();
  }, []);

  const fetchActivity = () => {
    api
      .get("/reports/activity")
      .then((res) => setActivity(res.data))
      .catch(() => {});
  };

  const timeAgo = (dateStr) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
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

  const generateInvite = async () => {
    setInviteLoading(true);
    setInviteError("");
    setInviteResult(null);
    try {
      const res = await api.post("/auth/invite", {
        role: inviteRole,
        email: inviteEmail || undefined,
        expiresInDays: 7,
      });
      setInviteResult(res.data);
    } catch (err) {
      setInviteError(err.response?.data?.message || "Could not generate invite code");
    } finally {
      setInviteLoading(false);
    }
  };

  const copyCode = () => {
    if (inviteResult?.code) {
      navigator.clipboard.writeText(inviteResult.code);
    }
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
        <div className="toolbar" style={{ marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
          <button className="btn btn-secondary" onClick={() => downloadFile("/reports/export/pdf", "diamond-business-report.pdf")}>
            📄 Export PDF Report
          </button>
          <button className="btn btn-secondary" onClick={() => downloadFile("/reports/export/excel", "diamond-inventory.xlsx")}>
            📊 Export Excel Inventory
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setShowInvite((v) => !v);
              setInviteResult(null);
              setInviteError("");
            }}
          >
            ✉️ Invite Staff
          </button>
        </div>
      )}

      {isAdmin && showInvite && (
        <div
          style={{
            border: "1px solid var(--border, #E7E1D3)",
            borderRadius: 10,
            padding: 16,
            marginBottom: 16,
            maxWidth: 420,
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: 10 }}>Generate Invite Code</h3>

          <div style={{ display: "flex", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
            <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
            <input
              placeholder="Restrict to email (optional)"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              style={{ flex: 1, minWidth: 180 }}
            />
          </div>

          <button className="btn btn-primary" onClick={generateInvite} disabled={inviteLoading}>
            {inviteLoading ? "Generating…" : "Generate Code"}
          </button>

          {inviteError && (
            <p style={{ color: "#A14B3F", marginTop: 10, fontSize: 13 }}>{inviteError}</p>
          )}

          {inviteResult && (
            <div
              style={{
                marginTop: 14,
                padding: 12,
                background: "rgba(176,141,87,0.1)",
                borderRadius: 8,
              }}
            >
              <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
                Share this code with the new {inviteResult.role} — valid until{" "}
                {new Date(inviteResult.expiresAt).toLocaleDateString("en-IN")}, one-time use only.
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                <code style={{ fontSize: 18, fontWeight: 600, letterSpacing: 1 }}>{inviteResult.code}</code>
                <button className="btn btn-secondary" onClick={copyCode} style={{ padding: "4px 10px" }}>
                  Copy
                </button>
              </div>
            </div>
          )}
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

      <div className="activity-card">
        <h3 className="chart-title">Recent Activity</h3>
        {activity.length === 0 ? (
          <p className="empty-state">No activity yet</p>
        ) : (
          <ul className="activity-list">
            {activity.map((a) => (
              <li key={a._id} className="activity-item">
                <span className={`activity-dot activity-dot-${a.type}`} />
                <span className="activity-text">{a.message}</span>
                <span className="activity-time">{timeAgo(a.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Layout>
  );
}