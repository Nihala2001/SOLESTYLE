import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../components/admin/AdminLayout";
import "./AdminProfile.css";

function AdminProfile() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profileImage, setProfileImage] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ================= GET ADMIN PROFILE =================

  useEffect(() => {
    const fetchAdminProfile = async () => {
      try {
        const token = localStorage.getItem("adminToken");

        const response = await fetch(
          "http://localhost:5001/api/admin/profile",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          alert(data.message || "Failed to load profile");
          return;
        }

        setName(data.admin.name || "");
        setEmail(data.admin.email || "");
        setProfileImage(data.admin.profileImage || []);
      } catch (error) {
        console.error("Get admin profile error:", error);
        alert("Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchAdminProfile();
  }, []);

  // ================= UPDATE PROFILE =================

  const handleSave = async () => {
    if (!name.trim()) {
      alert("Name is required");
      return;
    }

    if (
      name.trim().length < 2 ||
      name.trim().length > 50
    ) {
      alert("Name must be between 2 and 50 characters");
      return;
    }

    try {
      setSaving(true);

      const token = localStorage.getItem("adminToken");

      const response = await fetch(
        "http://localhost:5001/api/admin/profile",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: name.trim(),
            profileImage,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to update profile");
        return;
      }

      // Update localStorage
      localStorage.setItem(
        "admin",
        JSON.stringify(data.admin)
      );

      alert("Profile updated successfully");

      navigate("/admin/dashboard");
    } catch (error) {
      console.error("Update admin profile error:", error);
      alert("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  // ================= LOADING =================

  if (loading) {
    return (
      <AdminLayout title="Admin Profile">
        <div className="admin-profile-loading">
          Loading profile...
        </div>
      </AdminLayout>
    );
  }

  // ================= UI =================

  return (
    <AdminLayout title="Admin Profile">

      <div className="admin-profile-page">

        <div className="profile-header">
          <div>
            <h1>Admin Profile</h1>
            <p>
              Manage your administrator account.
            </p>
          </div>
        </div>

        <div className="admin-profile-card">

          {/* PROFILE IMAGE */}

          <div className="admin-profile-image-section">

            <div className="admin-profile-large-avatar">
              {name
                ? name.charAt(0).toUpperCase()
                : "A"}
            </div>

            <h2>{name || "Admin"}</h2>

            <p>Administrator</p>

          </div>

          {/* PROFILE DETAILS */}

          <div className="admin-profile-form">

            {/* NAME */}

            <div className="admin-profile-field">

              <label>FULL NAME</label>

              <input
                type="text"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                placeholder="Enter your name"
              />

            </div>

            {/* EMAIL */}

            <div className="admin-profile-field">

              <label>EMAIL ADDRESS</label>

              <input
                type="email"
                value={email}
                disabled
              />

            </div>

            {/* BUTTONS */}

            <div className="admin-profile-actions">

              <button
                type="button"
                className="cancel-profile-button"
                onClick={() =>
                  navigate("/admin/dashboard")
                }
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="button"
                className="save-profile-button"
                onClick={handleSave}
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : "Save Changes"}
              </button>

            </div>

          </div>

        </div>

      </div>

    </AdminLayout>
  );
}

export default AdminProfile;