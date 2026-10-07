
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import NotificationModal from "../common/NotificationModal";
import {  verifyForgotPasswordOtp, resendForgotPasswordOtp, } from "../../api/services/authServices";
import "./ForgotPasswordOtp.css";

function ForgotPasswordOtp() {
  const navigate = useNavigate();
  const location = useLocation();

  const email =
    location.state?.email ||
    sessionStorage.getItem("forgotPasswordEmail") ||
    "";

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

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

    // After OTP verification
    if (notificationTitle === "OTP Verified") {
      navigate("/reset-password", {
        state: {
          email,
        },
      });
    }
  };

  // ================= VERIFY OTP =================

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    setError("");

    if (!email) {
      setError("Email is missing. Please try again.");
      return;
    }

    if (!otp) {
      setError("Please enter the OTP.");
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      setError("OTP must be 6 digits.");
      return;
    }

    try {
      setLoading(true);

        await verifyForgotPasswordOtp({
       email,
       otp,
       });

      // OTP verified successfully
      showNotificationMessage(
        "OTP Verified",
        "Your OTP has been verified successfully.",
        "success"
      );

    }catch (error) {
  console.error(
    "Forgot password OTP error:",
    error
  );

  setError(
    error.response?.data?.message ||
    "Invalid OTP."
  );

} finally {
  setLoading(false);
}
  };

  // ================= RESEND OTP =================

  const handleResendOtp = async () => {
    setError("");

    if (!email) {
      setError("Email is missing. Please try again.");
      return;
    }

    try {
      setResending(true);

     await resendForgotPasswordOtp(email);

      // New OTP sent
      showNotificationMessage(
        "OTP Sent",
        "A new OTP has been sent to your email.",
        "success"
      );

    }catch (error) {
  console.error(
    "Resend OTP error:",
    error
  );

  setError(
    error.response?.data?.message ||
    "Failed to resend OTP."
  );

} finally {
  setResending(false);
}
  };

  // ================= UI =================

  return (
    <div className="forgot-otp-page">

      <div className="forgot-otp-card">

        <div className="forgot-otp-heading">

          <p>ACCOUNT RECOVERY</p>

          <h2>Verify OTP</h2>

          <span>
            Enter the 6-digit OTP sent to
            <br />
            <strong>
              {email || "your email"}
            </strong>
          </span>

        </div>

        <form onSubmit={handleVerifyOtp}>

          <label htmlFor="otp">
            ENTER OTP
          </label>

          <input
            id="otp"
            type="text"
            inputMode="numeric"
            maxLength="6"
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={(e) => {
              const value = e.target.value
                .replace(/\D/g, "")
                .slice(0, 6);

              setOtp(value);
              setError("");
            }}
          />

          {error && (
            <p className="forgot-otp-error">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? "VERIFYING..."
              : "VERIFY OTP"}
          </button>

        </form>

        {/* ================= RESEND ================= */}

        <div className="forgot-otp-resend">

          <span>
            Didn't receive the OTP?
          </span>

          <button
            type="button"
            onClick={handleResendOtp}
            disabled={resending}
          >
            {resending
              ? "SENDING..."
              : "RESEND OTP"}
          </button>

        </div>

        {/* ================= BACK ================= */}

        <div className="forgot-otp-back">

          <button
            type="button"
            onClick={() =>
              navigate("/forgot-password")
            }
          >
            ← BACK
          </button>

        </div>

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

export default ForgotPasswordOtp;
