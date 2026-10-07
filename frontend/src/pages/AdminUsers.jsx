import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../components/admin/AdminLayout";
import NotificationModal from "../components/common/NotificationModal";
import ConfirmationModal from "../components/common/ConfirmationModal";
import {
  getAdminUsers,
  blockUser,
  unblockUser,
} from "../api/services/adminService";
import "./AdminUsers.css";

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
  });

  const [notification, setNotification] = useState({
    show: false,
    title: "",
    message: "",
    type: "success",
  });
  const [confirmation, setConfirmation] = useState({
    show: false,
    title: "",
    message: "",
    onConfirm: null,
    confirmText: "Confirm",
  });

  const navigate = useNavigate();

  //modal helpers
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

  const showConfirmation = (
    title,
    message,
    onConfirm,
    confirmText = "Confirm",
  ) => {
    setConfirmation({
      show: true,
      title,
      message,
      onConfirm,
      confirmText,
    });
  };

  const closeConfirmation = () => {
    setConfirmation((prev) => ({
      ...prev,
      show: false,
      onConfirm: null,
    }));
  };

  //................fetch user..........

  const fetchUsers = async (searchValue = "", pageNumber = 1) => {
    try {
      setLoading(true);

      const data = await getAdminUsers(searchValue, pageNumber, 5);
      console.log("ADMIN USERS RESPONSE:", data);

      setUsers(data.users || []);
      setPagination(
        data.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalUsers: 0,
        },
      );
    } catch (error) {
      console.error("Fetch users error:", error);

      showNotification(
        "Failed to Load Users",
        error.response?.data?.message || "Failed to fetch users",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };
  const handleSearch = (e) => {
    const value = e.target.value;

    setSearch(value);
    fetchUsers(value, 1);
  };

  const handlePageChange = (pageNumber) => {
    fetchUsers(search, pageNumber);
  };

  useEffect(() => {
    fetchUsers();
  }, []);
  //.......................block user.................//

  const handleBlock = (userId) => {
    showConfirmation(
      "Block User?",
      "Are you sure you want to block this user?",
      async () => {
        try {
          const data = await blockUser(userId);

          if (!data.success) {
            showNotification(
              "Block Failed",
              data.message || "Failed to block user",
              "error",
            );
            return;
          }

          showNotification(
            "User Blocked",
            data.message || "User blocked successfully",
            "success",
          );

          fetchUsers(search, pagination.currentPage);
        } catch (error) {
          console.error("Block user error:", error);

          showNotification(
            "Something Went Wrong",
            error.response?.data?.message || "Something went wrong",
            "error",
          );
        }
      },
      "Block",
    );
  };
  //..................unblock user...................//
  const handleUnblock = (userId) => {
    showConfirmation(
      "Unblock User?",
      "Are you sure you want to unblock this user?",
      async () => {
        try {
          const data = await unblockUser(userId);

          if (!data.success) {
            showNotification(
              "Unblock Failed",
              data.message || "Failed to unblock user",
              "error",
            );
            return;
          }

          showNotification(
            "User Unblocked",
            data.message || "User unblocked successfully",
            "success",
          );

          fetchUsers(search, pagination.currentPage);
        } catch (error) {
          console.error("Unblock user error:", error);

          showNotification(
            "Something Went Wrong",
            error.response?.data?.message || "Something went wrong",
            "error",
          );
        }
      },
      "Unblock",
    );
  };

  return (
    <AdminLayout title="User Management">
      <NotificationModal
        isOpen={notification.show}
        title={notification.title}
        message={notification.message}
        type={notification.type}
        onClose={closeNotification}
      />
      <ConfirmationModal
        isOpen={confirmation.show}
        title={confirmation.title}
        message={confirmation.message}
        confirmText={confirmation.confirmText}
        onCancel={closeConfirmation}
        onConfirm={async () => {
          const action = confirmation.onConfirm;

          closeConfirmation();

          if (action) {
            await action();
          }
        }}
      />
      <div className="users-page-header">
        <div>
          <h1>Customers</h1>
          <p>Manage all registered SOLESTYLE customers.</p>
        </div>

        <div className="user-count">{pagination.totalUsers} Users</div>
      </div>

      <div className="users-card">
        <div className="users-toolbar">
          <div className="search-box">
            <span>⌕</span>

            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={handleSearch}
            />
          </div>
        </div>

        {loading ? (
          <div className="users-empty">
            <p>Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="users-empty">
            <span>♙</span>
            <h3>No users found</h3>
            <p>There are no customers matching your search.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {users.map((user) => (
                  <tr key={user._id}>
                    <td>
                      <div className="customer-info">
                        <div className="customer-avatar">
                          {user.name?.charAt(0).toUpperCase()}
                        </div>

                        <strong>{user.name}</strong>
                      </div>
                    </td>

                    <td>{user.email}</td>

                    <td>
                      {user.isActive ? (
                        <span className="status active">Active</span>
                      ) : (
                        <span className="status blocked">Blocked</span>
                      )}
                    </td>

                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>

                    <td>
                      <div className="action-buttons">
                        <button
                          className="view-button"
                          onClick={() => navigate(`/admin/users/${user._id}`)}
                        >
                          View
                        </button>

                        {user.isActive ? (
                          <button
                            className="block-button"
                            onClick={() => handleBlock(user._id)}
                          >
                            Block
                          </button>
                        ) : (
                          <button
                            className="unblock-button"
                            onClick={() => handleUnblock(user._id)}
                          >
                            Unblock
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="pagination">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
              >
                Previous
              </button>

              {Array.from(
                { length: pagination.totalPages },
                (_, index) => index + 1,
              ).map((pageNumber) => (
                <button
                  key={pageNumber}
                  onClick={() => handlePageChange(pageNumber)}
                  className={
                    pagination.currentPage === pageNumber ? "active" : ""
                  }
                >
                  {pageNumber}
                </button>
              ))}

              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminUsers;
