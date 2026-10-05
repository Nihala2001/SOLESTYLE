
import AdminLayout from "../components/admin/AdminLayout";
import "./AdminDashboard.css";

function AdminDashboard() {
  return (
    <AdminLayout title="Dashboard">
      <div className="dashboard-welcome">
        <div>
          <h1>Welcome back 👋</h1>
          <p>Here's what's happening with your store today.</p>
        </div>
      </div>

      {/* Statistics */}
      <div className="dashboard-cards">
        <div className="stat-card">
          <div className="stat-icon">♙</div>
          <div>
            <p>Total Users</p>
            <h2>--</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">▣</div>
          <div>
            <p>Total Products</p>
            <h2>--</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">▤</div>
          <div>
            <p>Total Orders</p>
            <h2>--</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">₹</div>
          <div>
            <p>Total Sales</p>
            <h2>₹ --</h2>
          </div>
        </div>
      </div>

      {/* Sales Overview */}
      <div className="dashboard-section">
        <div className="section-header">
          <div>
            <h2>Sales Overview</h2>
            <p>Sales performance will appear here.</p>
          </div>

          <select>
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
            <option>Last 6 Months</option>
            <option>This Year</option>
          </select>
        </div>

        <div className="chart-placeholder">
          <div className="chart-line">
            ╱╲___╱╲____╱╲___
          </div>

          <p>Sales chart</p>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="dashboard-section">
        <div className="section-header">
          <div>
            <h2>Recent Orders</h2>
            <p>Your latest customer orders.</p>
          </div>

          <button className="view-all-button">
            View All
          </button>
        </div>

        <div className="empty-dashboard">
          <span>▤</span>
          <p>No orders available yet.</p>
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminDashboard;

