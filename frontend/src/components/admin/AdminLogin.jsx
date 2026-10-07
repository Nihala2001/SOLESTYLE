import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginAdmin } from "../../api/services/adminService";
import "./AdminLogin.css";

function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [errors, setErrors] = useState({
    email: "",
    password: "",
    general: "",
  });

  // ================= LOGIN =================

  const handleLogin = async (e) => {
    e.preventDefault();

    setErrors({
      email: "",
      password: "",
      general: "",
    });

    const trimmedEmail = email.trim().toLowerCase();

    let hasError = false;

    // ================= EMAIL VALIDATION =================

    if (!trimmedEmail) {
      setErrors((prev) => ({
        ...prev,
        email: "Email is required.",
      }));

      hasError = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrors((prev) => ({
        ...prev,
        email: "Please enter a valid email address.",
      }));

      hasError = true;
    }

    // ================= PASSWORD VALIDATION =================

    if (!password) {
      setErrors((prev) => ({
        ...prev,
        password: "Password is required.",
      }));

      hasError = true;
    }

    if (hasError) {
      return;
    }

    try {
      setIsLoading(true);

      // .............. ADMIN LOGIN API

      const data = await loginAdmin({
        email: trimmedEmail,
        password,
      });

      //.............. LOGIN ERROR...............

      if (!data.success) {
        setErrors((prev) => ({
          ...prev,
          general: data.message || "Invalid admin email or password.",
        }));

        return;
      }
      // ..............SAVE ADMIN DATA
      localStorage.setItem("adminToken", data.token);

      if (data.admin) {
        localStorage.setItem("admin", JSON.stringify(data.admin));
      }

      // ................ GO TO ADMIN DASHBOARD................

      navigate("/admin/dashboard");
    } catch (error) {
      console.error("Admin login error:", error);

      setErrors((prev) => ({
        ...prev,
        general:
          error.response?.data?.message ||
          "Unable to connect to the server. Please try again.",
      }));
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        {/* ================= HEADING ================= */}

        <div className="admin-login-heading">
          <p>SOLESTYLE ADMIN</p>

          <h2>Admin Login</h2>

          <span>Sign in to manage your SOLESTYLE store.</span>
        </div>

        <form onSubmit={handleLogin}>
          {/* ================= EMAIL ================= */}

          <div className="admin-login-field">
            <label htmlFor="admin-email">EMAIL ADDRESS</label>

            <input
              id="admin-email"
              type="email"
              placeholder="Enter admin email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);

                setErrors((prev) => ({
                  ...prev,
                  email: "",
                  general: "",
                }));
              }}
            />

            {errors.email && (
              <p className="admin-login-error">{errors.email}</p>
            )}
          </div>

          {/* ================= PASSWORD ================= */}

          <div className="admin-login-field">
            <label htmlFor="admin-password">PASSWORD</label>

            <div className="admin-password-wrapper">
              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);

                  setErrors((prev) => ({
                    ...prev,
                    password: "",
                    general: "",
                  }));
                }}
              />

              <button
                type="button"
                className="admin-show-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "HIDE" : "SHOW"}
              </button>
            </div>

            {errors.password && (
              <p className="admin-login-error">{errors.password}</p>
            )}
          </div>

          {/* ================= GENERAL ERROR ================= */}

          {errors.general && (
            <p className="admin-login-general-error">{errors.general}</p>
          )}

          {/* ================= LOGIN BUTTON ================= */}

          <button
            type="submit"
            className="admin-login-button"
            disabled={isLoading}
          >
            {isLoading ? "LOGGING IN..." : "ADMIN LOGIN"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminLogin;
