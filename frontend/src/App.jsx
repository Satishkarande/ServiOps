import { useEffect, useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import NotificationBell from "./components/NotificationBell";
import { useAuth } from "./auth/AuthContext";
import "./App.css";

const navItems = [
  ["view_dashboard", "/dashboard", "⌂", "Overview"],
  ["view_ticket", "/tickets", "◈", "Service Tickets"],
  ["view_customer", "/customers", "◎", "Customers"],
  ["view_plant", "/plants", "⌁", "Plants"],
  ["view_machine", "/machines", "▣", "Machines"],
  ["view_spare", "/spare-parts", "◇", "Spare Parts"],
  ["view_inventory", "/inventory", "▤", "Inventory"],
  ["view_stock_movement", "/stock-movements", "↕", "Stock Movements"],
];

function initials(user) {
  return `${user?.first_name?.[0] || ""}${user?.last_name?.[0] || ""}`.toUpperCase() || "U";
}


const modernTheme = `
/* Final ServiOps visual system — intentionally loaded after page styles */
:root { --ui-accent:#ff5a36; --ui-ink:#15171b; --ui-muted:#777b84; --ui-line:#e8e9ec; --ui-surface:#fff; --ui-canvas:#f5f5f6; --ui-radius:18px; }

/* Page rhythm */
.modern-content > * { max-width: 1380px !important; margin-left:auto !important; margin-right:auto !important; }
.page-container,.page-content,.dashboard-page,.ticket-details-page,.ticket-form-page,.customers-page,.customer-details-page,.customer-form-page,.plants-page,.plant-details-page,.plant-form-page,.machines-page,.machine-details-page,.machine-form-page,.spare-list-page,.spare-form-page,.inventory-page,.movement-page,.users-page,.user-form-page,.roles-page,.role-form-page,.permissions-page,.permission-form-page,.profile-page { color:var(--ui-ink) !important; }

/* Headings and descriptions */
.modern-content h1,.modern-content h2,.modern-content h3,.modern-content h4 { letter-spacing:-.035em !important; color:var(--ui-ink) !important; }
.modern-content p { color:var(--ui-muted); }
.page-header,.dashboard-header { margin-bottom:28px !important; }

/* Universal surfaces */
.modern-content .card,.modern-content .form-card,.modern-content .ticket-section-card,.modern-content .ticket-detail-card,.modern-content .workflow-card,.modern-content .dashboard-card,.modern-content .dashboard-stat-card,.modern-content [class*="table-card"] { background:#fff !important; border:1px solid var(--ui-line) !important; border-radius:18px !important; box-shadow:0 12px 34px rgba(17,19,24,.055) !important; }
.modern-content .card,.modern-content .form-card,.modern-content .ticket-detail-card { overflow:hidden; }

/* Buttons */
.modern-content button.primary-button,.modern-content button[class*="primary"],.modern-content button[class*="add"],.modern-content a.primary-button { background:var(--ui-accent) !important; color:#fff !important; border-color:var(--ui-accent) !important; border-radius:11px !important; font-weight:800 !important; box-shadow:0 7px 18px rgba(255,90,54,.16) !important; }
.modern-content button.secondary-button,.modern-content button.edit-button,.modern-content a.secondary-button { background:#fff !important; color:#30343b !important; border:1px solid #dfe1e5 !important; border-radius:11px !important; font-weight:750 !important; }
.modern-content button:hover { transform:translateY(-1px); }

/* Inputs */
.modern-content input,.modern-content select,.modern-content textarea { border:1px solid #dfe1e5 !important; border-radius:11px !important; background:#fff !important; color:#17191e !important; box-shadow:none !important; }
.modern-content input:focus,.modern-content select:focus,.modern-content textarea:focus { border-color:var(--ui-accent) !important; box-shadow:0 0 0 4px rgba(255,90,54,.10) !important; outline:none !important; }
.modern-content label { color:#40434a !important; font-weight:750 !important; }

/* Tables: quiet, editorial rather than spreadsheet */
.modern-content table { border-collapse:separate !important; border-spacing:0 !important; width:100%; }
.modern-content th { background:#fafafa !important; color:#858891 !important; border-bottom:1px solid var(--ui-line) !important; font-size:10px !important; font-weight:850 !important; letter-spacing:.08em !important; text-transform:uppercase !important; }
.modern-content td { border-bottom:1px solid #f0f1f3 !important; color:#30333a !important; }
.modern-content tbody tr { transition:background .16s ease,transform .16s ease; }
.modern-content tbody tr:hover { background:#fcfcfd !important; }
.modern-content .entity-link { color:#c94327 !important; font-weight:800 !important; text-decoration:none !important; }
.modern-content .entity-link:hover { color:#e74725 !important; text-decoration:underline !important; }

/* Soft semantic pills */
.modern-content [class*="badge"],.modern-content [class*="status"],.modern-content [class*="priority"] { border-radius:999px !important; }

/* Dashboard — make it the visual home of the product */
.dashboard-page { max-width:1380px !important; padding:4px 0 55px !important; }
.dashboard-header h1 { font-size:38px !important; font-weight:900 !important; letter-spacing:-.055em !important; }
.dashboard-header p { font-size:13px !important; }
.dashboard-summary-grid { gap:14px !important; }
.dashboard-summary-card { border-radius:20px !important; min-height:132px !important; padding:22px !important; position:relative !important; overflow:hidden !important; }
.dashboard-summary-card::after { content:""; position:absolute; width:100px; height:100px; right:-28px; top:-30px; border-radius:50%; background:rgba(255,90,54,.06); }
.dashboard-summary-primary { border-left:3px solid var(--ui-accent) !important; }
.dashboard-section { margin-top:28px !important; }
.dashboard-section-header { margin-bottom:12px !important; }
.dashboard-section-header h2,.dashboard-section-header h3 { font-size:15px !important; font-weight:900 !important; }
.dashboard-mini-grid { gap:12px !important; }
.dashboard-mini-card,.dashboard-attention-card,.dashboard-aging-card { border-radius:16px !important; background:#fff !important; border:1px solid var(--ui-line) !important; box-shadow:0 8px 26px rgba(17,19,24,.045) !important; }
.dashboard-clickable-card,.dashboard-clickable-row { cursor:pointer !important; }
.dashboard-clickable-card:hover,.dashboard-clickable-row:hover { transform:translateY(-2px) !important; box-shadow:0 14px 32px rgba(17,19,24,.08) !important; }
.dashboard-recent-row { padding:16px 0 !important; }
.dashboard-recent-ticket { font-weight:850 !important; }
.dashboard-trend,.dashboard-pie { border-radius:18px !important; }
.dashboard-view-all { color:#c94327 !important; font-weight:850 !important; }

/* Ticket pages */
.ticket-details-page,.ticket-form-page { max-width:1380px !important; }
.ticket-page-title h2 { font-size:30px !important; font-weight:900 !important; }
.ticket-section-header { background:#fafafa !important; }

/* Empty/error/loading states */
.dashboard-empty,.dashboard-error,.dashboard-loading,.modern-content [class*="empty"],.modern-content [class*="state"] { border-radius:18px !important; background:#fff !important; border:1px solid var(--ui-line) !important; box-shadow:0 10px 28px rgba(17,19,24,.045) !important; }

/* Mobile */
@media (max-width:700px) {
  .modern-content > * { max-width:none !important; }
  .dashboard-header { align-items:flex-start !important; flex-direction:column !important; }
  .dashboard-header h1 { font-size:30px !important; }
  .page-header { flex-direction:column !important; align-items:stretch !important; }
  .modern-content table { min-width:720px; }
}
`;

function App() {
  const { isAuthenticated, login, logout, hasPermission, loadingUser, currentUser } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem("serviops-sidebar-collapsed") === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed((collapsed) => {
      const next = !collapsed;
      try {
        localStorage.setItem("serviops-sidebar-collapsed", String(next));
      } catch {
        // Ignore storage errors.
      }
      return next;
    });
  };

  const userName = currentUser ? [currentUser.first_name, currentUser.last_name].filter(Boolean).join(" ") : "Loading user...";
  const userRole = currentUser?.role?.name || currentUser?.role || "User";

  return (
    <div className="app app-modern">
      <header className="topbar modern-topbar">
        <button
          type="button"
          className="sidebar-toggle"
          onClick={toggleSidebar}
          aria-label={sidebarCollapsed ? "Expand navigation" : "Collapse navigation"}
          aria-expanded={!sidebarCollapsed}
          title={sidebarCollapsed ? "Expand navigation" : "Collapse navigation"}
        >
          <span className="sidebar-toggle-line" />
          <span className="sidebar-toggle-line" />
          <span className="sidebar-toggle-line" />
        </button>
        <Link to="/dashboard" className="serviops-brand modern-brand" title="Go to Dashboard">
          <span className="brand-mark">S</span><span>ServiOps</span>
        </Link>
        <div className="topbar-center">
          <span className="topbar-kicker">SERVICE OPERATIONS</span>
          <span className="topbar-divider" aria-hidden="true" />
          <span className="topbar-timebox">
            <span className="topbar-time-dot" aria-hidden="true" />
            <span className="topbar-time">{currentTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}</span>
          </span>
        </div>
        {isAuthenticated ? (
          <div className="modern-user-area">
            <NotificationBell />
            <NavLink to="/profile" className="modern-profile-link">
              <span className="modern-avatar">{initials(currentUser)}</span>
              <span className="modern-profile-copy"><strong>{loadingUser ? "Loading..." : userName}</strong><small>{userRole}</small></span>
            </NavLink>
            <button type="button" className="modern-logout" onClick={logout}>Sign out</button>
          </div>
        ) : <button type="button" className="modern-login" onClick={login}>Sign in</button>}
      </header>

      <div className={`layout modern-layout ${sidebarCollapsed ? "sidebar-is-collapsed" : ""}`}>
        <aside className="sidebar modern-sidebar">
          <div className="sidebar-label">WORKSPACE</div>
          <nav className="modern-nav">
            {navItems.map(([permission, path, icon, label]) => hasPermission(permission) ? (
              <NavLink key={path} to={path} className="nav-item modern-nav-item" title={label}>
                <span className="nav-icon">{icon}</span><span>{label}</span>
              </NavLink>
            ) : null)}
          </nav>
          {hasPermission("manage_users") || hasPermission("manage_roles") || hasPermission("manage_permissions") ? (
            <>
              <div className="sidebar-label admin-label">ADMINISTRATION</div>
              <nav className="modern-nav">
                {hasPermission("manage_users") && <NavLink to="/users" className="nav-item modern-nav-item" title="Users"><span className="nav-icon">♙</span><span>Users</span></NavLink>}
                {hasPermission("manage_roles") && <NavLink to="/roles" className="nav-item modern-nav-item" title="Roles"><span className="nav-icon">◉</span><span>Roles</span></NavLink>}
                {hasPermission("manage_permissions") && <NavLink to="/permissions" className="nav-item modern-nav-item" title="Permissions"><span className="nav-icon">✓</span><span>Permissions</span></NavLink>}
              </nav>
            </>
          ) : null}
          <div className="sidebar-footer"><div className="sidebar-status-dot" /><div><strong>System online</strong><span>Local workspace</span></div></div>
        </aside>
        <main className="content modern-content"><Outlet /><style>{modernTheme}</style></main>
      </div>
    </div>
  );
}

export default App;



