import { Link, useNavigate, useLocation } from "react-router-dom";

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const links = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/inventory", label: "Inventory" },
    { to: "/orders", label: "Orders" },
    { to: "/customers", label: "Customers" },
  ];

  return (
    <div className="layout">
      <div className="sidebar">
        <div className="brand">
          <svg className="brand-mark" width="30" height="30" viewBox="0 0 32 32" fill="none">
            <path d="M6 11L16 4L26 11L16 28L6 11Z" stroke="#B08D57" strokeWidth="1.3" strokeLinejoin="round" />
            <path d="M6 11H26M11 11L16 4L21 11M11 11L16 28M21 11L16 28" stroke="#B08D57" strokeWidth="0.8" opacity="0.7" />
          </svg>
          <div className="brand-text">
            <h2>Paladiya Brothers</h2>
            <span>Diamond Trade</span>
          </div>
        </div>
        <div className="sidebar-divider" />
        <nav>
          {links.map((l) => (
            <Link key={l.to} to={l.to} className={location.pathname === l.to ? "active" : ""}>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-spacer" />
        <button onClick={logout}>Logout</button>
      </div>
      <div className="main">
        <div className="topbar">
          <h1>{links.find((l) => l.to === location.pathname)?.label || "Dashboard"}</h1>
          <div className="user-chip">
            <span className="name">{user?.name}</span>
            {user?.role && <span className="role-badge">{user.role}</span>}
          </div>
        </div>
        <div key={location.pathname} className="page-fade">
          {children}
        </div>
      </div>
    </div>
  );
}