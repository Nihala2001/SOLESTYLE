
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import NotificationModal from "../common/NotificationModal";
import "./ResetPassword.css";

function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();

  const email =
    location.state?.email ||
    sessionStorage.getItem("forgotPasswordEmail") ||
    "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ================= NOTIFICATION MODAL =================

  const [showNotification, setShowNotification] = useState(false);

  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationType, setNotificationType] = useState("success");

  const showNotificationMessage = (
    title,
    message,
    type = "success"
  ) => {
    setNotificationTitle(title);
    setNotificationMessage(message);
    setNotificationType(type);
    setShowNotification(true);
  };

  // ================= NOTIFICATION CLOSE =================

  const handleNotificationClose = () => {
    setShowNotification(false);

    // After successful password reset
    if (notificationTitle === "Password Reset Successful") {
      navigate("/login");
    }
  };

  // ================= RESET PASSWORD =================

  const handleResetPassword = async (e) => {
    e.preventDefault();

    setError("");

    if (!email) {
      setError("Email is missing. Please start again.");
      return;
    }

    if (!password) {
      setError("Please enter a new password.");
      return;
    }

    // Same password rule used during registration
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/;

    if (!passwordRegex.test(password)) {
      setError(
        "Password must be 8-20 characters and include uppercase, lowercase, number and special character."
      );
      return;
    }

    if (!confirmPassword) {
      setError("Please confirm your password.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:5001/api/auth/reset-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            newPassword: password,
            confirmPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message || "Failed to reset password."
        );
        return;
      }

      // Remove stored email
      sessionStorage.removeItem(
        "forgotPasswordEmail"
      );

      // Show success notification
      showNotificationMessage(
        "Password Reset Successful",
        "Your password has been reset successfully.",
        "success"
      );

    } catch (error) {
      console.error(
        "Reset password error:",
        error
      );

      showNotificationMessage(
        "Password Reset Failed",
        "Something went wrong. Please try again.",
        "error"
      );

    } finally {
      setLoading(false);
    }
  };

  // ================= UI =================

  return (
    <div className="reset-page">

      <div className="reset-card">

        {/* HEADING */}

        <div className="reset-heading">

          <p>ACCOUNT RECOVERY</p>

          <h2>Reset Password</h2>

          <span>
            Create a new password for your SOLESTYLE account.
          </span>

        </div>

        {/* FORM */}

        <form onSubmit={handleResetPassword}>

          {/* NEW PASSWORD */}

          <div className="reset-field">

            <label htmlFor="password">
              NEW PASSWORD
            </label>

            <div className="reset-password-wrapper">

              <input
                id="password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                placeholder="Enter new password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
              />

              <button
                type="button"
                className="reset-show-password"
                onClick={() =>
                  setShowPassword(
                    !showPassword
                  )
                }
              >
                {showPassword
                  ? "HIDE"
                  : "SHOW"}
              </button>

            </div>

          </div>

          {/* CONFIRM PASSWORD */}

          <div className="reset-field">

            <label htmlFor="confirmPassword">
              CONFIRM PASSWORD
            </label>

            <div className="reset-password-wrapper">

              <input
                id="confirmPassword"
                type={
                  showConfirmPassword
                    ? "text"
                    : "password"
                }
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(
                    e.target.value
                  );
                  setError("");
                }}
              />

              <button
                type="button"
                className="reset-show-password"
                onClick={() =>
                  setShowConfirmPassword(
                    !showConfirmPassword
                  )
                }
              >
                {showConfirmPassword
                  ? "HIDE"
                  : "SHOW"}
              </button>

            </div>

          </div>

          {/* PASSWORD RULE */}

          <p className="password-hint">
            8–20 characters with uppercase,
            lowercase, number and special character.
          </p>

          {/* ERROR */}

          {error && (
            <p className="reset-error">
              {error}
            </p>
          )}

          {/* BUTTON */}

          <button
            type="submit"
            className="reset-button"
            disabled={loading}
          >
            {loading
              ? "RESETTING..."
              : "RESET PASSWORD"}
          </button>

        </form>

      </div>

      {/* ================= NOTIFICATION MODAL ================= */}

      <NotificationModal
        isOpen={showNotification}
        onClose={handleNotificationClose}
        title={notificationTitle}
        message={notificationMessage}
        type={notificationType}
      />

    </div>
  );
}

export default ResetPassword;
