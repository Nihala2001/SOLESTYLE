
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../components/admin/AdminLayout";
import "./AdminUsers.css";

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  const fetchUsers = async (searchValue = "") => {
    try {
      setLoading(true);

      const token = localStorage.getItem("adminToken");

      const response = await fetch(
        `http://localhost:5001/api/admin/users?search=${encodeURIComponent(
          searchValue
        )}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to fetch users");
        return;
      }

      setUsers(data.users);
    } catch (error) {
      console.error("Fetch users error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearch(value);
    fetchUsers(value);
  };

  //.......................block user.................//

  const handleBlock = async (userId) => {
  const confirmBlock = window.confirm(
    "Are you sure you want to block this user?"
  );

  if (!confirmBlock) {
    return;
  }

  try {
    const token = localStorage.getItem("adminToken");

    const response = await fetch(
      `http://localhost:5001/api/admin/users/${userId}/block`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Failed to block user");
      return;
    }

    alert("User blocked successfully");

    fetchUsers(search);
  } catch (error) {
    console.error("Block user error:", error);
    alert("Something went wrong");
  }
};


//..................unblock user...................//
  const handleUnblock = async (userId) => {
  const confirmUnblock = window.confirm(
    "Are you sure you want to unblock this user?"
  );

  if (!confirmUnblock) {
    return;
  }

  try {
    const token = localStorage.getItem("adminToken");

    const response = await fetch(
      `http://localhost:5001/api/admin/users/${userId}/unblock`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Failed to unblock user");
      return;
    }

    alert("User unblocked successfully");

    fetchUsers(search);
  } catch (error) {
    console.error("Unblock user error:", error);
    alert("Something went wrong");
  }
};

  return (
    <AdminLayout title="User Management">
      <div className="users-page-header">
        <div>
          <h1>Customers</h1>
          <p>Manage all registered SOLESTYLE customers.</p>
        </div>

        <div className="user-count">
          {users.length} Users
        </div>
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
                        <span className="status active">
                          Active
                        </span>
                      ) : (
                        <span className="status blocked">
                          Blocked
                        </span>
                      )}
                    </td>

                    <td>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>

                    <td>
                      <div className="action-buttons">
                        <button
                          className="view-button"
                          onClick={() =>
                            navigate(`/admin/users/${user._id}`)
                          }
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
                            onClick={() =>
                              handleUnblock(user._id)
                            }
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
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminUsers;
