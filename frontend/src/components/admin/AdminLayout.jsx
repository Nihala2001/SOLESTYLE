import { useNavigate } from "react-router-dom";
import "./AdminLayout.css";

function AdminLayout({ children, title }) {
  const navigate = useNavigate();

  const admin = JSON.parse(localStorage.getItem("admin"));

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("admin");
    navigate("/admin/login");
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <h1>SOLESTYLE</h1>
          <span>ADMIN PANEL</span>
        </div>

        <nav className="admin-menu">
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="menu-item"
          >
            <span>⌂</span>
            Dashboard
          </button>

          <button
            onClick={() => navigate("/admin/users")}
            className="menu-item"
          >
            <span>♙</span>
            Users
          </button>

          <button
            onClick={() => navigate("/admin/products")}
            className="menu-item"
          >
            <span>▣</span>
            Products
          </button>

          <button
            onClick={() => navigate("/admin/orders")}
            className="menu-item"
          >
            <span>▤</span>
            Orders
          </button>

          <button
            onClick={() => navigate("/admin/returns")}
            className="menu-item"
          >
            <span>↩</span>
            Return&Exchange
          </button>

          <button
            onClick={() => navigate("/admin/categories")}
            className="menu-item"
          >
            <span>◈</span>
            Categories
          </button>

          <button
            onClick={() => navigate("/admin/offers")}
            className="menu-item"
          >
            <span>◇</span>
            Offers
          </button>

          <button
            onClick={() => navigate("/admin/coupons")}
            className="menu-item"
          >
            <span>♢</span>
            Coupons
          </button>

          <button
            className="menu-item"
            onClick={() => navigate("/admin/sales-report")}
          >
            <span>▥</span>
            Sales Report
          </button>

          <button
            onClick={() => navigate("/admin/reviews")}
            className="menu-item"
          >
            <span>☆</span>
            Reviews
          </button>
        </nav>

        <div className="sidebar-bottom">
          <button className="logout-button" onClick={handleLogout}>
            <span>⇥</span>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <h2>{title}</h2>
            <p>Manage your SOLESTYLE store</p>
          </div>

          <div
            className="admin-profile"
            onClick={() => navigate("/admin/profile")}
            style={{ cursor: "pointer" }}
          >
            <div className="admin-avatar">
              {admin?.name?.charAt(0).toUpperCase() || "A"}
            </div>

            <div>
              <strong>{admin?.name || "Admin"}</strong>
              <span>Administrator</span>
            </div>
          </div>
        </header>

        <section className="admin-content">{children}</section>
      </main>
    </div>
  );
}

export default AdminLayout;
