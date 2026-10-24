import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../components/admin/AdminLayout";
import NotificationModal from "../components/common/NotificationModal";
import {
  getAdminProfile,
  updateAdminProfile,
} from "../api/services/adminService";
import "./AdminProfile.css";

function AdminProfile() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profileImage, setProfileImage] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState({
    show: false,
    title: "",
    message: "",
    type: "success",
  });
  const [nameError, setNameError] = useState("");

  //helper
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

  // ================= GET ADMIN PROFILE =================

  useEffect(() => {
    const fetchAdminProfile = async () => {
      try {
        const data = await getAdminProfile();

        if (!data.success) {
          showNotification(
            "Failed to Load Profile",
            data.message || "Failed to load profile",
            "error",
          );
          return;
        }

        setName(data.admin.name || "");
        setEmail(data.admin.email || "");
        setProfileImage(data.admin.profileImage || []);
      } catch (error) {
        console.error("Get admin profile error:", error);

        showNotification(
          "Something Went Wrong",
          error.response?.data?.message || "Something went wrong",
          "error",
        );
      } finally {
        setLoading(false);
      }
    };
    fetchAdminProfile();
  }, []);

  // ================= UPDATE PROFILE =================

  const handleSave = async () => {
    if (!name.trim()) {
      setNameError("Name is required");
      return;
    }

    if (name.trim().length < 2 || name.trim().length > 50) {
      setNameError("Name must be between 2 and 50 characters");
      return;
    }

    try {
      setSaving(true);

      const data = await updateAdminProfile({
        name: name.trim(),
        profileImage,
      });

      if (!data.success) {
        showNotification(
          "Update Failed",
          data.message || "Failed to update profile",
          "error",
        );
        return;
      }

      // Update localStorage
      localStorage.setItem("admin", JSON.stringify(data.admin));

      showNotification(
        "Profile Updated",
        "Profile updated successfully",
        "success",
      );

      setTimeout(() => {
        navigate("/admin/dashboard");
      }, 1500);
    } catch (error) {
      console.error("Update admin profile error:", error);
      showNotification(
        "Something Went Wrong",
        error.response?.data?.message || "Something went wrong",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  // ================= LOADING =================

  if (loading) {
    return (
      <AdminLayout title="Admin Profile">
        <div className="admin-profile-loading">Loading profile...</div>
      </AdminLayout>
    );
  }

  // ================= UI =================

  return (
    <AdminLayout title="Admin Profile">
      <NotificationModal
        isOpen={notification.show}
        title={notification.title}
        message={notification.message}
        type={notification.type}
        onClose={closeNotification}
      />
      <div className="admin-profile-page">
        <div className="admin-profile-card">
          {/* PROFILE IMAGE */}

          <div className="admin-profile-image-section">
            <div className="admin-profile-large-avatar">
              {name ? name.charAt(0).toUpperCase() : "A"}
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
                onChange={(e) => {
                  setName(e.target.value);
                  setNameError("");
                }}
                placeholder="Enter your name"
              />

              {nameError && <p className="admin-profile-error">{nameError}</p>}
            </div>

            {/* EMAIL */}

            <div className="admin-profile-field">
              <label>EMAIL ADDRESS</label>

              <input type="email" value={email} disabled />
            </div>

            {/* BUTTONS */}

            <div className="admin-profile-actions">
              <button
                type="button"
                className="cancel-profile-button"
                onClick={() => navigate("/admin/dashboard")}
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
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminProfile;
