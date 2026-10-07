
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import NotificationModal from "../common/NotificationModal";
import { forgotPassword } from "../../api/services/authServices";
import "./ForgotPassword.css";

function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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

    // After OTP is sent, go to OTP page
    if (notificationTitle === "OTP Sent") {
      navigate("/forgot-password-otp", {
        state: {
          email: email.trim().toLowerCase(),
        },
      });
    }
  };

  // ================= SUBMIT =================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    const trimmedEmail = email.trim().toLowerCase();

    // Email validation
    if (!trimmedEmail) {
      setError("Email is required.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      setIsLoading(true);

      await forgotPassword(trimmedEmail);
      
      // Save email for the next page
      sessionStorage.setItem(
        "forgotPasswordEmail",
        trimmedEmail
      );

      // Show OTP sent notification
      showNotificationMessage(
        "OTP Sent",
        "A password reset OTP has been sent to your email.",
        "success"
      );

    } catch (error) {
  console.error("Forgot password error:", error);

  setError(
    error.response?.data?.message ||
    "Unable to connect to the server. Please try again."
  );
   } finally {
     setIsLoading(false);
    }
  }
  // ================= UI =================

  return (
    <div className="forgot-page">

      <div className="forgot-card">

        {/* Heading */}
        <div className="forgot-heading">

          <p>ACCOUNT RECOVERY</p>

          <h2>Forgot Password?</h2>

          <span>
            Enter your registered email address and
            we'll send you an OTP to reset your password.
          </span>

        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>

          <label htmlFor="email">
            EMAIL ADDRESS
          </label>

          <input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
          />

          {error && (
            <p className="forgot-error">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
          >
            {isLoading
              ? "SENDING OTP..."
              : "SEND OTP"}
          </button>

        </form>

        {/* Back to Login */}
        <div className="back-login">
          <Link to="/login">
            ← BACK TO LOGIN
          </Link>
        </div>

      </div>

      {/* Notification Modal */}
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

export default ForgotPassword;
