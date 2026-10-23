import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Register.css";
import { registerUser } from "../../api/services/authServices";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState({});

  const navigate = useNavigate();

  // ======================== VALIDATION ======================== //

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const nameRegex = /^[A-Za-z ]{2,50}$/;

  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/;

  // ======================== REGISTER ======================== //

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedReferralCode = referralCode.trim();

    const newErrors = {};

    // Name validation
    if (!trimmedName) {
      newErrors.name = "Name is required";
    } else if (!nameRegex.test(trimmedName)) {
      newErrors.name =
        "Name must contain only letters and spaces and be 2-50 characters long";
    }

    // Email validation
    if (!trimmedEmail) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(trimmedEmail)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Password validation
    if (!password) {
      newErrors.password = "Password is required";
    } else if (!passwordRegex.test(password)) {
      newErrors.password =
        "Password must be 8-20 characters and contain uppercase, lowercase, number and special character";
    }

    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirmPassword =
        "Please confirm your password";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword =
        "Passwords do not match";
    }

    // Show validation errors
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Clear old errors
    setErrors({});

    setIsLoading(true);

    try {
      const data = await registerUser({
       name: trimmedName,
        email: trimmedEmail,
        password,
        confirmPassword,
       referralCode:
       trimmedReferralCode || undefined,
        });

      // ......................SUCCESS ................ 

      // Go to OTP verification page
      // and tell RegisterOtp that OTP was sent
      // Go to OTP verification page with expiry time
const expiresAt =
  data?.expiresAt || data?.data?.expiresAt;

navigate("/verify-otp", {
  state: {
    email: trimmedEmail,
    expiresAt,
    showOtpSentNotification: true,
  },
});

    }catch (error) {
  console.error(
    "Registration error:",
    error
  );

  const message =
    error.response?.data?.message ||
    "Something went wrong. Please try again.";

  if (message.toLowerCase().includes("email")) {
    setErrors({
      email: message,
    });
  } else {
    setErrors({
      general: message,
    });
  }
}
  }
  // ======================== CLEAR FIELD ERROR ======================== //

  const clearError = (field) => {
    setErrors((previousErrors) => ({
      ...previousErrors,
      [field]: "",
      general: "",
    }));
  };

  // ======================== UI ======================== //

  return (
    <div className="register-container">

      {/* Left Banner Section */}

      <div className="register-banner">

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

      {/* Right Form Section */}

      <div className="register-form-container">

        <div className="form-wrapper">

          <div className="brand-header">

            <h3 className="brand-logo">
              SOLESTYLE
            </h3>

            <h2 className="form-title">
              Create Account
            </h2>

            <p className="form-subtitle">
              Enter your details to explore
              SOLESTYLE footwear
            </p>

          </div>

          <form
            onSubmit={handleSubmit}
            className="register-form"
          >

            {/* Full Name */}

            <div className="input-group">

              <label htmlFor="fullName">
                FULL NAME
              </label>

              <input
                type="text"
                id="fullName"
                placeholder="Enter your full name"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  clearError("name");
                }}
              />

              {errors.name && (
                <p className="input-error">
                  {errors.name}
                </p>
              )}

            </div>

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
                    setShowPassword(
                      !showPassword
                    )
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

            {/* Confirm Password */}

            <div className="input-group">

              <label htmlFor="confirmPassword">
                CONFIRM PASSWORD
              </label>

              <div className="password-input-wrapper">

                <input
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  id="confirmPassword"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(
                      event.target.value
                    );
                    clearError(
                      "confirmPassword"
                    );
                  }}
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowConfirmPassword(
                      !showConfirmPassword
                    )
                  }
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                >
                  👁
                </button>

              </div>

              {errors.confirmPassword && (
                <p className="input-error">
                  {errors.confirmPassword}
                </p>
              )}

            </div>

            {/* Referral Code */}

            <div className="input-group">

              <label htmlFor="referralCode">
                REFERRAL CODE{" "}
                <span>(OPTIONAL)</span>
              </label>

              <input
                type="text"
                id="referralCode"
                placeholder="Enter referral code"
                value={referralCode}
                onChange={(event) =>
                  setReferralCode(
                    event.target.value
                  )
                }
              />

            </div>

            {/* General Error */}

            {errors.general && (
              <p className="input-error general-error">
                {errors.general}
              </p>
            )}

            {/* Submit Button */}

            <button
              type="submit"
              className="submit-btn"
              disabled={isLoading}
            >
              {isLoading
                ? "CREATING ACCOUNT..."
                : "CREATE ACCOUNT"}
            </button>

          </form>

          {/* Footer Navigation */}

          <div className="form-footer">

            <p>
              Already have an account?{" "}

              <Link
                to="/login"
                className="login-link"
              >
                Log in
              </Link>

            </p>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Register;