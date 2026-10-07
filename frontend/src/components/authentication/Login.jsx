
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import NotificationModal from "../common/NotificationModal";
import "./Login.css";
import { loginUser, googleLogin,} from "../../api/services/authServices";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [errors, setErrors] = useState({});

  // Notification modal
  const [showNotification, setShowNotification] = useState(false);
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationType, setNotificationType] = useState("success");

  const navigate = useNavigate();

  // ======================== VALIDATION ======================== //

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  // ======================== NORMAL LOGIN ======================== //

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedEmail = email.trim().toLowerCase();

    const newErrors = {};

    // Email validation
    if (!trimmedEmail) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(trimmedEmail)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Password validation
    if (!password) {
      newErrors.password = "Password is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
     const data = await loginUser({
     email: trimmedEmail,
     password,
      });

      // Save token
      if (data.token) {
        localStorage.setItem("userToken", data.token);
      }

      // Save user
      if (data.user) {
        localStorage.setItem(
          "user",
          JSON.stringify(data.user)
        );
      }

      // Show success modal
      showNotificationMessage(
        "Login Successful",
        "Welcome back to SOLESTYLE!",
        "success"
      );

    } catch (error) {
      console.error("Login error:", error);

      setErrors({
        general:  error.response?.data?.message || "Something went wrong. Please try again.",
      });

    } finally {
      setIsLoading(false);
    }
  };

  // ....................GOOGLE LOGIN ................//

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const data = await googleLogin(
       credentialResponse.credential
        );
      // Save token
      if (data.token) {
        localStorage.setItem(
          "userToken",
          data.token
        );
      }

      // Save user
      if (data.user) {
        localStorage.setItem(
          "user",
          JSON.stringify(data.user)
        );
      }

      // Show success notification
      showNotificationMessage(
        "Login Successful",
        "Welcome to SOLESTYLE!",
        "success"
      );

    } catch (error) {
      console.error("Google login error:", error);

      showNotificationMessage(
        "Google Login Failed",
        "Failed to authenticate with Google. Please try again.",
        "error"
      );
    }
  };

  // ======================== GOOGLE ERROR ======================== //

  const handleGoogleError = () => {
    console.error("Google Sign-In was unsuccessful");

    showNotificationMessage(
      "Google Login Failed",
      "Google Sign-In was canceled or failed.",
      "error"
    );
  };

  // ======================== NOTIFICATION CLOSE ======================== //

  const handleNotificationClose = () => {
    setShowNotification(false);

    // Only navigate after successful login
    if (notificationType === "success") {
      navigate("/home");
    }
  };

  // ======================== CLEAR ERROR ======================== //

  const clearError = (field) => {
    setErrors((previousErrors) => ({
      ...previousErrors,
      [field]: "",
      general: "",
    }));
  };

  // ======================== UI ======================== //

  return (
    <div className="login-container">

      {/* Left Banner Section */}
      <div className="login-banner">
        <img
          src="https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=1000&auto=format&fit=crop"
          alt="SOLESTYLE Footwear Collection"
          className="banner-image"
        />

        <div className="banner-overlay">
          <div className="banner-branding">
            <h4>SOLESTYLE ATELIER</h4>
            <p>
              Refined modern form & pure silhouette
            </p>
          </div>
        </div>
      </div>

      {/* Right Login Section */}
      <div className="login-form-container">
        <div className="form-wrapper">

          {/* Brand */}
          <div className="brand-header">
            <h3 className="brand-logo">
              SOLESTYLE
            </h3>

            <h2 className="form-title">
              Welcome Back
            </h2>

            <p className="form-subtitle">
              Sign in to continue exploring SOLESTYLE footwear
            </p>
          </div>

          {/* Login Form */}
          <form
            onSubmit={handleSubmit}
            className="login-form"
          >

            {/* Email */}
            <div className="input-group">

              <label htmlFor="email">
                EMAIL ADDRESS
              </label>

              <input
                type="email"
                id="email"
                placeholder="Enter your email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  clearError("email");
                }}
              />

              {errors.email && (
                <p className="input-error">
                  {errors.email}
                </p>
              )}

            </div>

            {/* Password */}
            <div className="input-group">

              <label htmlFor="password">
                PASSWORD
              </label>

              <div className="password-input-wrapper">

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  id="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    clearError("password");
                  }}
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  👁
                </button>

              </div>

              {errors.password && (
                <p className="input-error">
                  {errors.password}
                </p>
              )}

            </div>

            {/* Forgot Password */}
            <div className="forgot-password-wrapper">
              <Link
                to="/forgot-password"
                className="forgot-password-link"
              >
                Forgot Password?
              </Link>
            </div>

            {/* General Error */}
            {errors.general && (
              <p className="input-error general-error">
                {errors.general}
              </p>
            )}

            {/* Login Button */}
            <button
              type="submit"
              className="submit-btn"
              disabled={isLoading}
            >
              {isLoading
                ? "LOGGING IN..."
                : "LOGIN"}
            </button>

          </form>

          {/* Register Link */}
          <div className="form-footer">
            <p>
              Don't have an account?{" "}
              <Link
                to="/register"
                className="login-link"
              >
                Create Account
              </Link>
            </p>
          </div>

          {/* Divider */}
          <div className="auth-divider">
            <span>OR</span>
          </div>

          {/* Google Sign-In */}
          <div className="social-auth-wrapper">

            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              theme="outline"
              size="large"
              text="continue_with"
              shape="rectangular"
            />

          </div>

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

export default Login;
