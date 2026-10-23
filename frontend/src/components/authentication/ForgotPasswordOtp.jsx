
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import NotificationModal from "../common/NotificationModal";
import {
  verifyForgotPasswordOtp,
  resendForgotPasswordOtp,
} from "../../api/services/authServices";
import "./ForgotPasswordOtp.css";

function ForgotPasswordOtp() {
  const navigate = useNavigate();
  const location = useLocation();

  const email =
    location.state?.email ||
    sessionStorage.getItem("forgotPasswordEmail") ||
    "";

  const getExpiryTimestamp = (value) => {
    if (!value) return null;

    const timestamp =
      typeof value === "number" ? value : Date.parse(value);

    return Number.isFinite(timestamp) ? timestamp : null;
  };

  const [expiresAt, setExpiresAt] = useState(() =>
    getExpiryTimestamp(location.state?.expiresAt)
  );

  const [currentTime, setCurrentTime] = useState(Date.now());

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const isOtpExpired =
    expiresAt !== null && currentTime >= expiresAt;

  const remainingSeconds =
    expiresAt !== null
      ? Math.max(
          0,
          Math.ceil((expiresAt - currentTime) / 1000)
        )
      : null;

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remaining = seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
      remaining
    ).padStart(2, "0")}`;
  };

  // ================= COUNTDOWN =================

  useEffect(() => {
    if (expiresAt === null) return;

    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

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

    if (notificationTitle === "OTP Verified") {
      navigate("/reset-password", {
        state: { email },
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

    if (expiresAt === null) {
      setError("OTP expiry time is unavailable. Please request a new OTP.");
      return;
    }

    if (Date.now() >= expiresAt) {
      setCurrentTime(Date.now());
      setError("OTP expired. Please request a new OTP.");
      return;
    }

    try {
      setLoading(true);

      await verifyForgotPasswordOtp({
        email,
        otp,
      });

      showNotificationMessage(
        "OTP Verified",
        "Your OTP has been verified successfully.",
        "success"
      );
    } catch (error) {
      console.error("Forgot password OTP error:", error);

      setError(
        error.response?.data?.message || "Invalid OTP."
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

      const response = await resendForgotPasswordOtp(email);

      const newExpiry =
        response?.expiresAt ||
        response?.data?.expiresAt;

      const newExpiryTimestamp =
        getExpiryTimestamp(newExpiry);

      if (newExpiryTimestamp === null) {
        setError(
          "OTP was sent, but its expiry time was not received. Please check the backend response."
        );
        return;
      }

      setExpiresAt(newExpiryTimestamp);
      setCurrentTime(Date.now());
      setOtp("");

      showNotificationMessage(
        "OTP Sent",
        "A new OTP has been sent to your email.",
        "success"
      );
    } catch (error) {
      console.error("Resend OTP error:", error);

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
            <strong>{email || "your email"}</strong>
          </span>
        </div>

        <form onSubmit={handleVerifyOtp}>
          <label htmlFor="otp">ENTER OTP</label>

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

          {/* OTP EXPIRY COUNTDOWN */}

          {expiresAt === null ? (
            <p className="forgot-otp-expired" aria-live="polite">
              OTP expiry time unavailable. Please resend the OTP.
            </p>
          ) : isOtpExpired ? (
            <p className="forgot-otp-expired" aria-live="polite">
              OTP expired. Please request a new OTP.
            </p>
          ) : (
            <p className="forgot-otp-expiry" aria-live="polite">
              OTP expires in {formatTime(remainingSeconds)}
            </p>
          )}

          {error && (
            <p className="forgot-otp-error" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={
              loading ||
              resending ||
              expiresAt === null ||
              isOtpExpired
            }
          >
            {loading
              ? "VERIFYING..."
              : isOtpExpired
                ? "OTP EXPIRED"
                : "VERIFY OTP"}
          </button>
        </form>

        {/* RESEND OTP */}

        <div className="forgot-otp-resend">
          <span>Didn't receive the OTP?</span>

          <button
            type="button"
            onClick={handleResendOtp}
            disabled={resending || loading}
          >
            {resending ? "SENDING..." : "RESEND OTP"}
          </button>
        </div>

        {/* BACK */}

        <div className="forgot-otp-back">
          <button
            type="button"
            onClick={() => navigate("/forgot-password")}
          >
            ← BACK
          </button>
        </div>
      </div>

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
