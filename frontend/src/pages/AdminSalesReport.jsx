import { useEffect, useState } from "react";
import AdminLayout from "../components/admin/AdminLayout";
import { getSalesReport } from "../api/services/adminSalesReportService";
import "./AdminSalesReport.css";

const currency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));

const formatDate = (date) => {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const escapeCSV = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

const getOrderId = (order) => order.orderNumber || order._id || "—";

const getCustomerName = (order) =>
  order.userId?.name || order.customerName || order.user?.name || "Guest";

const getItemsCount = (order) =>
  (order.items || []).reduce(
    (total, item) =>
      total +
      Math.max(
        0,
        Number(item.quantity || 0) - Number(item.cancelledQuantity || 0),
      ),
    0,
  );

function AdminSalesReport() {
  const [period, setPeriod] = useState("month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;

  const loadReport = async (filters = { period: "month" }) => {
    try {
      setLoading(true);
      setError("");

      const data = await getSalesReport(filters);

      if (!data.success) {
        throw new Error(data.message || "Failed to load sales report");
      }

      setReport(data);
      setCurrentPage(1);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load sales report",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport({ period: "month" });
  }, []);

  const applyFilter = (selectedPeriod = period) => {
    setPeriod(selectedPeriod);

    if (selectedPeriod === "custom") {
      if (!startDate || !endDate) {
        setError("Please select both start and end dates.");
        return;
      }

      if (startDate > endDate) {
        setError("Start date cannot be after end date.");
        return;
      }

      loadReport({
        period: "custom",
        startDate,
        endDate,
      });

      return;
    }

    loadReport({ period: selectedPeriod });
  };

  const orders = report?.orders || [];
  const summary = report?.summary;

  const totalPages = Math.ceil(orders.length / ordersPerPage);

  const startIndex = (currentPage - 1) * ordersPerPage;

  const paginatedOrders = orders.slice(startIndex, startIndex + ordersPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const downloadCSV = () => {
    if (!report) return;

    const rows = [
      ["SOLESTYLE Sales Report"],
      ["Start Date", formatDate(report.dateRange?.startDate)],
      ["End Date", formatDate(report.dateRange?.endDate)],
      [],
      ["Sales Summary"],
      ["Metric", "Value"],
      ["Total Orders", summary?.totalOrders ?? 0],
      ["Paid Orders", summary?.paidOrders ?? 0],
      ["Cancelled Orders", summary?.cancelledOrders ?? 0],
      ["Items Sold", summary?.itemsSold ?? 0],
      ["Gross Sales", summary?.grossSales ?? 0],
      ["Refunds", summary?.refunds ?? 0],
      ["Net Sales", summary?.netSales ?? 0],
      ["Average Order Value", summary?.averageOrderValue ?? 0],
      [],
      ["Orders Report"],
      [
        "Order ID",
        "Customer",
        "Date",
        "Items",
        "Payment Method",
        "Payment Status",
        "Order Status",
        "Amount",
      ],
      ...orders.map((order) => [
        getOrderId(order),
        getCustomerName(order),
        formatDate(order.createdAt),
        getItemsCount(order),
        order.paymentMethod || "—",
        order.paymentStatus || "—",
        order.orderStatus || "—",
        order.totalAmount ?? 0,
      ]),
    ];

    const csv = rows.map((row) => row.map(escapeCSV).join(",")).join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `solestyle-sales-report-${period}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout title="Sales Report">
      <div className="sales-report-page">
        {/* Page heading */}
        <div className="sales-report-heading">
          <div>
            <h1>Sales Report</h1>
            <p>
              Review sales performance and order details for your selected
              period.
            </p>
          </div>

          <button
            className="sales-export-btn"
            onClick={downloadCSV}
            disabled={!report || loading}
          >
            Export CSV
          </button>
        </div>

        {/* Date filters */}
        <section className="sales-filter-panel">
          <div className="sales-period-buttons">
            {[
              { value: "today", label: "Today" },
              { value: "7days", label: "Last 7 Days" },
              { value: "month", label: "This Month" },
              { value: "custom", label: "Custom Range" },
            ].map((option) => (
              <button
                key={option.value}
                className={period === option.value ? "active" : ""}
                onClick={() => {
                  if (option.value === "custom") {
                    setPeriod("custom");
                    setError("");
                  } else {
                    applyFilter(option.value);
                  }
                }}
              >
                {option.label}
              </button>
            ))}
          </div>

          {period === "custom" && (
            <div className="sales-custom-dates">
              <label>
                Start Date
                <input
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                />
              </label>

              <label>
                End Date
                <input
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                />
              </label>

              <button
                className="sales-apply-btn"
                onClick={() => applyFilter("custom")}
              >
                Apply
              </button>
            </div>
          )}

          {report?.dateRange && (
            <p className="sales-date-caption">
              {formatDate(report.dateRange.startDate)} –{" "}
              {formatDate(report.dateRange.endDate)}
            </p>
          )}
        </section>

        {/* Error message */}
        {error && (
          <div className="sales-error" role="alert">
            {error}
            <button onClick={() => setError("")}>Dismiss</button>
          </div>
        )}

        {/* Loading state */}
        {loading && <p className="sales-loading">Loading sales report...</p>}

        {!loading && report && summary && (
          <>
            {/* Sales summary cards */}
            <section className="sales-summary-grid">
              <article className="sales-summary-card">
                <span>Net Sales</span>
                <strong>{currency(summary.netSales)}</strong>
                <small>After recorded refunds</small>
              </article>

              <article className="sales-summary-card">
                <span>Gross Sales</span>
                <strong>{currency(summary.grossSales)}</strong>
                <small>Before refunds</small>
              </article>

              <article className="sales-summary-card">
                <span>Paid Orders</span>
                <strong>{summary.paidOrders}</strong>
                <small>{summary.cancelledOrders} cancelled orders</small>
              </article>

              <article className="sales-summary-card">
                <span>Items Sold</span>
                <strong>{summary.itemsSold}</strong>
                <small>After recorded cancellations</small>
              </article>

              <article className="sales-summary-card">
                <span>Refunds</span>
                <strong>{currency(summary.refunds)}</strong>
                <small>Recorded refund amount</small>
              </article>

              <article className="sales-summary-card">
                <span>Average Order Value</span>
                <strong>{currency(summary.averageOrderValue)}</strong>
                <small>Per paid order</small>
              </article>
            </section>

            {/* Orders report */}
            <section className="sales-table-panel">
              <div className="sales-orders-heading">
                <div>
                  <h2>Orders Report</h2>
                  <p>Orders for the selected date range</p>
                </div>

                <span className="sales-order-count">
                  {orders.length} orders
                </span>
              </div>

              {orders.length === 0 ? (
                <p className="sales-empty">No orders found for this period.</p>
              ) : (
                <div className="sales-table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Date</th>
                        <th>Items</th>
                        <th>Payment Method</th>
                        <th>Payment Status</th>
                        <th>Order Status</th>
                        <th>Amount</th>
                      </tr>
                    </thead>

                    <tbody>
                      {paginatedOrders.map((order) => (
                        <tr key={order._id || order.orderNumber}>
                          <td>{getOrderId(order)}</td>

                          <td>{getCustomerName(order)}</td>

                          <td>{formatDate(order.createdAt)}</td>

                          <td>{getItemsCount(order)}</td>

                          <td>{order.paymentMethod || "—"}</td>

                          <td>
                            <span
                              className={`sales-status sales-payment-${String(
                                order.paymentStatus || "unknown",
                              ).toLowerCase()}`}
                            >
                              {order.paymentStatus || "—"}
                            </span>
                          </td>

                          <td>
                            <span className="sales-status">
                              {order.orderStatus || "—"}
                            </span>
                          </td>

                          <td>{currency(order.totalAmount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

{totalPages > 1 && (
    <div className="sales-pagination">
        <span className="sales-pagination-info">
            Showing {startIndex + 1}–
            {Math.min(startIndex + ordersPerPage, orders.length)} of{" "}
            {orders.length} orders
        </span>

        <div className="sales-pagination-controls">
            <button
                className="sales-page-btn"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
            >
                Previous
            </button>

            {Array.from(
                { length: totalPages },
                (_, index) => index + 1
            ).map((page) => (
                <button
                    key={page}
                    className={`sales-page-btn ${
                        currentPage === page ? "active" : ""
                    }`}
                    onClick={() => handlePageChange(page)}
                >
                    {page}
                </button>
            ))}

            <button
                className="sales-page-btn"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
            >
                Next
            </button>
        </div>
    </div>
)}

            </section>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminSalesReport;
