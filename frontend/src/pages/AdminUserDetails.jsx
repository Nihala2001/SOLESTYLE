import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import AdminLayout from "../components/admin/AdminLayout";
import NotificationModal from "../components/common/NotificationModal";

import { getAdminUser } from "../api/services/adminService";

import "./AdminUserDetails.css";

function AdminUserDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [notification, setNotification] = useState({
    show: false,
    title: "",
    message: "",
    type: "success",
  });

  const showNotification = (title, message, type = "success") => {
    setNotification({
      show: true,
      title,
      message,
      type,
    });
  };

  const closeNotification = () => {
    setNotification((prev) => ({
      ...prev,
      show: false,
    }));
  };

  const fetchUser = async () => {
    try {
      setLoading(true);

      const data = await getAdminUser(id);

      console.log("ADMIN USER RESPONSE:", data);
      console.log("USER ADDRESSES:", data.user?.addresses);

      if (!data.success) {
        throw new Error(
          data.message || "Failed to load customer"
        );
      }

      setUser(data.user);
    } catch (error) {
      console.error("Fetch customer error:", error);

      showNotification(
        "Failed to Load Customer",
        error.response?.data?.message ||
          error.message ||
          "Unable to load customer details",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [id]);

  if (loading) {
    return (
      <AdminLayout title="Customer Details">
        <div className="user-details-loading">
          <p>Loading customer details...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!user) {
    return (
      <AdminLayout title="Customer Details">
        <div className="user-details-empty">
          <h2>Customer Not Found</h2>

          <p>
            The customer details could not be loaded.
          </p>

          <button
            className="back-button"
            onClick={() => navigate("/admin/users")}
          >
            Back to Customers
          </button>
        </div>

        <NotificationModal
          isOpen={notification.show}
          title={notification.title}
          message={notification.message}
          type={notification.type}
          onClose={closeNotification}
        />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Customer Details">
      <NotificationModal
        isOpen={notification.show}
        title={notification.title}
        message={notification.message}
        type={notification.type}
        onClose={closeNotification}
      />

      <div className="user-details-page">

        {/* Back Button */}

        <button
          className="back-button"
          onClick={() => navigate("/admin/users")}
        >
          ← Back to Customers
        </button>

        {/* Customer Card */}

        <div className="user-details-card">

          {/* Header */}

          <div className="user-details-header">
            <div className="user-details-avatar">
              {user.name
                ?.charAt(0)
                .toUpperCase()}
            </div>

            <div>
              <h1>{user.name}</h1>
              <p>{user.email}</p>
            </div>
          </div>

          {/* Status */}

          <div className="user-details-status">
            {user.isActive ? (
              <span className="status active">
                Active
              </span>
            ) : (
              <span className="status blocked">
                Blocked
              </span>
            )}
          </div>

          {/* Customer Information */}

          <div className="user-details-section">
            <h2>Customer Information</h2>

            <div className="user-details-grid">

              <div className="user-detail-item">
                <span>Name</span>

                <strong>
                  {user.name || "Not available"}
                </strong>
              </div>

              <div className="user-detail-item">
                <span>Email</span>

                <strong>
                  {user.email || "Not available"}
                </strong>
              </div>

              <div className="user-detail-item">
                <span>Account Status</span>

                <strong>
                  {user.isActive
                    ? "Active"
                    : "Blocked"}
                </strong>
              </div>

              <div className="user-detail-item">
                <span>Joined Date</span>

                <strong>
                  {user.createdAt
                    ? new Date(
                        user.createdAt
                      ).toLocaleDateString()
                    : "Not available"}
                </strong>
              </div>

            </div>
          </div>

          {/* Addresses */}

          <div className="user-details-section">
            <h2>Saved Addresses</h2>

            {user.addresses &&
            user.addresses.length > 0 ? (
              <div className="user-address-list">

                {user.addresses.map(
                  (address) => (
                    <div
                      className="user-address-card"
                      key={address._id}
                    >

                      <div className="user-address-header">

                        <h3>
                          {address.addressType ||
                            "Address"}
                        </h3>

                        {address.isDefault && (
                          <span className="default-address-badge">
                            Default
                          </span>
                        )}

                      </div>

                      <div className="user-address-content">

                        <p>
                          <strong>
                            {address.fullName}
                          </strong>
                        </p>

                        <p>
                          {address.phone}
                        </p>

                        <p>
                          {address.addressLine}
                        </p>

                        <p>
                          {address.city},{" "}
                          {address.state}
                        </p>

                        <p>
                          {address.pincode}
                        </p>

                      </div>

                    </div>
                  )
                )}

              </div>
            ) : (
              <p className="no-address-message">
                No address saved by this
                customer.
              </p>
            )}
          </div>

        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminUserDetails;