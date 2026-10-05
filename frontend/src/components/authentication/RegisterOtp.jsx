import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import NotificationModal from "../common/NotificationModal";
import "./RegisterOtp.css";

function RegisterOtp() {
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email;

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  // ================= NOTIFICATION MODAL =================

  const [showNotification, setShowNotification] = useState(
    Boolean(location.state?.showOtpSentNotification)
  );

  const [notificationTitle, setNotificationTitle] = useState(
    location.state?.showOtpSentNotification
      ? "OTP Sent"
      : ""
  );

  const [notificationMessage, setNotificationMessage] =
    useState(
      location.state?.showOtpSentNotification
        ? "A verification OTP has been sent to your email."
        : ""
    );

  const [notificationType, setNotificationType] =
    useState("success");

  // ================= REMOVE OTP SENT FLAG =================

  useEffect(() => {
    if (location.state?.showOtpSentNotification) {
      navigate("/verify-otp", {
        replace: true,
        state: {
          email,
        },
      });
    }
  }, [
    location.state?.showOtpSentNotification,
    email,
    navigate,
  ]);

  // ================= SHOW NOTIFICATION =================

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

  // ================= CLOSE NOTIFICATION =================

  const handleNotificationClose = () => {
    setShowNotification(false);

    // After successful OTP verification, go to login
    if (notificationTitle === "OTP Verified") {
      navigate("/login");
    }
  };

  // ================= VERIFY OTP =================

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    setError("");

    if (!email) {
      setError(
        "Email is missing. Please register again."
      );
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

      console.log("Email being sent:", email);
      console.log("OTP being sent:", otp);

      const response = await fetch(
        "http://localhost:5001/api/auth/verify-otp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            otp,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message || "Invalid OTP."
        );
        return;
      }

      // OTP verified successfully
      showNotificationMessage(
        "OTP Verified",
        "Your email has been verified successfully.",
        "success"
      );

    } catch (error) {
      console.error(
        "OTP verification error:",
        error
      );

      showNotificationMessage(
        "Verification Failed",
        "Something went wrong. Please try again.",
        "error"
      );

    } finally {
      setLoading(false);
    }
  };

  // ================= RESEND OTP =================

  const handleResendOtp = async () => {
    setError("");

    if (!email) {
      setError(
        "Email is missing. Please register again."
      );
      return;
    }

    try {
      setResending(true);

      const response = await fetch(
        "http://localhost:5001/api/auth/resend-otp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message || "Failed to resend OTP."
        );
        return;
      }

      // Resend successful
      showNotificationMessage(
        "OTP Sent",
        "A new OTP has been sent to your email.",
        "success"
      );

    } catch (error) {
      console.error(
        "Resend OTP error:",
        error
      );

      showNotificationMessage(
        "OTP Failed",
        "Something went wrong. Please try again.",
        "error"
      );

    } finally {
      setResending(false);
    }
  };

  // ================= UI =================

  return (
    <div className="otp-page">

      {/* ================= OTP SECTION ================= */}

      <div className="otp">

        <div className="otp-card">

          <div className="otp-heading">

            <p>ACCOUNT VERIFICATION</p>

            <h2>
              Verify Your Email
            </h2>

            <span>
              Enter the 6-digit OTP sent to
              <br />

              <strong>
                {email || "your email"}
              </strong>
            </span>

          </div>

          {/* ================= OTP FORM ================= */}

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

            {/* ERROR */}

            {error && (
              <p className="otp-error">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="otp-verify-button"
              disabled={loading}
            >
              {loading
                ? "VERIFYING..."
                : "VERIFY OTP"}
            </button>

          </form>

          {/* ================= RESEND OTP ================= */}

          <div className="resend-section">

            <p>
              Didn't receive the OTP?
            </p>

            <button
              type="button"
              className="resend-button"
              onClick={handleResendOtp}
              disabled={resending}
            >
              {resending
                ? "SENDING..."
                : "RESEND OTP"}
            </button>

          </div>

          {/* ================= BACK TO REGISTER ================= */}

          <button
            className="back-login"
            onClick={() =>
              navigate("/register")
            }
          >
            ← BACK TO REGISTER
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

export default RegisterOtp;