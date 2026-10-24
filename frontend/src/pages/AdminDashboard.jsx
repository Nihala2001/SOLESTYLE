import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../components/admin/AdminLayout";
import { getDashboardData } from "../api/services/adminDashboardService";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

import { getDashboardSalesReport } from "../api/services/adminDashboardService";
import "./AdminDashboard.css";

const currency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));

const formatDate = (date) =>
  date
    ? new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

function AdminDashboard() {
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [chartPeriod, setChartPeriod] = useState("7days");
  const [chartData, setChartData] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getDashboardData();

        if (!data.success) {
          throw new Error(data.message || "Failed to load dashboard");
        }

        setDashboard(data);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Unable to load dashboard data",
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  useEffect(() => {
    const loadChartData = async () => {
      try {
        setChartLoading(true);

        const report = await getDashboardSalesReport({
          period: chartPeriod,
        });

        if (report.success) {
          setChartData(
            (report.dailySales || []).map((day) => ({
              date: day.date,
              sales: Number(day.revenue || 0),
            })),
          );
        } else {
          setChartData([]);
        }
      } catch (error) {
        console.error("Load dashboard sales chart error:", error);
        setChartData([]);
      } finally {
        setChartLoading(false);
      }
    };

    loadChartData();
  }, [chartPeriod]);

  const statistics = dashboard?.statistics;
  const recentOrders = dashboard?.recentOrders || [];

  const topSellingProducts = dashboard?.topSellingProducts || [];
const topSellingCategories = dashboard?.topSellingCategories || [];

  return (
    <AdminLayout title="Dashboard">
     

      {error && (
        <div className="dashboard-section" role="alert">
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      )}

      {/* Statistics */}
      <div className="dashboard-cards">
        <div className="stat-card">
          <div className="stat-icon">♙</div>
          <div>
            <p>Total Users</p>
            <h2>{loading ? "..." : (statistics?.totalUsers ?? 0)}</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">▣</div>
          <div>
            <p>Total Products</p>
            <h2>{loading ? "..." : (statistics?.totalProducts ?? 0)}</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">▤</div>
          <div>
            <p>Total Orders</p>
            <h2>{loading ? "..." : (statistics?.totalOrders ?? 0)}</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">₹</div>
          <div>
            <p>Total Sales</p>
            <h2>{loading ? "..." : currency(statistics?.totalSales)}</h2>
          </div>
        </div>
      </div>

      {/* Sales Overview */}
      <div className="dashboard-section">
        <div className="section-header">
          <div>
            <h2>Sales Overview</h2>
            <p>Track your store's sales performance over time.</p>
          </div>

          <select
            value={chartPeriod}
            onChange={(event) => setChartPeriod(event.target.value)}
            aria-label="Sales chart period"
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="6months">Last 6 Months</option>
            <option value="year">This Year</option>
          </select>
        </div>

        {chartLoading ? (
          <div className="chart-placeholder">
            <p>Loading sales chart...</p>
          </div>
        ) : chartData.length === 0 ? (
          <div className="chart-placeholder">
            <p>No paid sales found for this period.</p>
          </div>
        ) : (
          <div style={{ width: "100%", height: 320, marginTop: 20 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) => {
                    const parsedDate = new Date(`${date}T00:00:00`);
                    return parsedDate.toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                    });
                  }}
                />
                <YAxis
                  tickFormatter={(value) =>
                    `₹${Number(value).toLocaleString("en-IN")}`
                  }
                  width={85}
                />
                <Tooltip
                  formatter={(value) => [currency(value), "Sales"]}
                  labelFormatter={(date) => `Date: ${date}`}
                />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="#c76b91"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

{/* Recent Orders and Top Selling */}
<div className="dashboard-bottom-grid">
 
  {/* Top-Selling Products */}
  <div className="dashboard-section dashboard-bottom-panel">
    <div className="section-header">
      <div>
        <h2>Top-Selling Products</h2>
        <p>Best-selling products by quantity.</p>
      </div>
    </div>

    {loading ? (
      <div className="empty-dashboard">
        <p>Loading products...</p>
      </div>
    ) : topSellingProducts.length === 0 ? (
      <div className="empty-dashboard">
        <p>No product sales available yet.</p>
      </div>
    ) : (
      <div className="top-selling-list">
        {topSellingProducts.map((product, index) => (
          <div
            className="top-selling-item"
            key={product.productId}
          >
            <span className="top-selling-rank">{index + 1}</span>

            {product.image ? (
              <img
                className="top-selling-image"
                src={product.image}
                alt={product.productName}
              />
            ) : (
              <div className="top-selling-image top-selling-no-image">
                ♡
              </div>
            )}

            <div className="top-selling-info">
              <h3>{product.productName}</h3>
              <p>{product.unitsSold} units sold</p>
              <strong>{currency(product.revenue)}</strong>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>

  {/* Top-Selling Categories */}
  <div className="dashboard-section dashboard-bottom-panel">
    <div className="section-header">
      <div>
        <h2>Top-Selling Categories</h2>
        <p>Best-performing categories.</p>
      </div>
    </div>

    {loading ? (
      <div className="empty-dashboard">
        <p>Loading categories...</p>
      </div>
    ) : topSellingCategories.length === 0 ? (
      <div className="empty-dashboard">
        <p>No category sales available yet.</p>
      </div>
    ) : (
      <div className="top-selling-list">
        {topSellingCategories.map((category, index) => (
          <div
            className="top-selling-item category-selling-item"
            key={category.categoryId}
          >
            <span className="top-selling-rank">{index + 1}</span>

            <div className="category-selling-icon">♧</div>

            <div className="top-selling-info">
              <h3>{category.categoryName}</h3>
              <p>{category.unitsSold} units sold</p>
              <strong>{currency(category.revenue)}</strong>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>

 {/* Recent Orders */}
  <div className="dashboard-section dashboard-bottom-panel">
    <div className="section-header">
      <div>
        <h2>Recent Orders</h2>
        <p>Your five latest orders.</p>
      </div>

      <button
        className="view-all-button"
        onClick={() => navigate("/admin/orders")}
      >
        View All
      </button>
    </div>

    {loading ? (
      <div className="empty-dashboard">
        <p>Loading recent orders...</p>
      </div>
    ) : recentOrders.length === 0 ? (
      <div className="empty-dashboard">
        <span>▤</span>
        <p>No orders available yet.</p>
      </div>
    ) : (
      <div className="dashboard-orders-table">
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Payment</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((order) => (
              <tr key={order._id}>
                <td>
                  {order.orderNumber || order._id.slice(-6).toUpperCase()}
                </td>
                <td>
                  {order.userId?.name || order.userId?.email || "Customer"}
                </td>
                <td>{formatDate(order.createdAt)}</td>
                <td>{currency(order.totalAmount)}</td>
                <td>{order.paymentStatus || "Pending"}</td>
                <td>{order.orderStatus || "Placed"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>


</div>

    </AdminLayout>
  );
}

export default AdminDashboard;
