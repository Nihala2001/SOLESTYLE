
const authService = require("../../services/user/authServices");

// ======================== VALIDATION HELPERS ======================== //

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const nameRegex = /^[A-Za-z ]{2,50}$/;

const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/;

const otpRegex = /^\d{6}$/;


// ======================== USER REGISTER ======================== //

const registerUser = async (req, res) => {
  try {
    let {
      name,
      email,
      password,
      confirmPassword,
      referralCode,
    } = req.body;

    // Required fields
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({
        message: "All required fields must be provided",
      });
    }

    // Remove unnecessary spaces
    name = name.trim();
    email = email.trim().toLowerCase();

    // Name validation
    if (!nameRegex.test(name)) {
      return res.status(400).json({
        message:
          "Name must contain only letters and spaces and be 2-50 characters long",
      });
    }

    // Email validation
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Please enter a valid email address",
      });
    }

    // Password validation
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          "Password must be 8-20 characters and contain uppercase, lowercase, number and special character",
      });
    }

    // Confirm password validation
    if (password !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match",
      });
    }

    // Referral code is optional
    if (referralCode) {
      referralCode = referralCode.trim();
    }

    const result = await authService.registerUser({
      name,
      email,
      password,
      referralCode,
    });

    
return res.status(201).json({
  message: "Registration successful. Please verify your OTP.",
  userId: result.userId,
  expiresAt: result.expiresAt,
});


  } catch (error) {
    console.error("Register error:", error);

    return res.status(400).json({
      message: error.message,
    });
  }
};


// ======================== VERIFY REGISTRATION OTP ======================== //

// ======================== VERIFY REGISTRATION OTP ======================== //

const verifyOtp = async (req, res) => {
  try {

    console.log("VERIFY OTP BODY:", req.body);

    let { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        message: "Email and OTP are required",
      });
    }

    email = email.trim().toLowerCase();
    otp = String(otp).trim();

    // Email validation
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Please enter a valid email address",
      });
    }

    // OTP validation
    if (!otpRegex.test(otp)) {
      return res.status(400).json({
        message: "OTP must be exactly 6 digits",
      });
    }

    const result = await authService.verifyOtp({
      email,
      otp,
    });

    return res.status(200).json(result);

  } catch (error) {

    console.error("Verify OTP error:", error);

    return res.status(400).json({
      message: error.message,
    });
  }
};
// ======================== RESEND OTP ======================== //

const resendOtp = async (req, res) => {
  try {
    let { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    email = email.trim().toLowerCase();

    // Email validation
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Please enter a valid email address",
      });
    }

    const result = await authService.resendOtp({
      email,
    });

    return res.status(200).json(result);

  } catch (error) {
    console.error("Resend OTP error:", error);

    return res.status(400).json({
      message: error.message,
    });
  }
};


// ======================== LOGIN USER ======================== //

const loginUser = async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    email = email.trim().toLowerCase();

    // Email validation
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Please enter a valid email address",
      });
    }

    const result = await authService.loginUser({
      email,
      password,
    });

    return res.status(200).json(result);

  } catch (error) {
    console.error("Login error:", error);

    return res.status(400).json({
      message: error.message,
    });
  }
};


// ======================== FORGOT PASSWORD ======================== //

const forgotPassword = async (req, res) => {
  try {
    let { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    email = email.trim().toLowerCase();

    // Email validation
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Please enter a valid email address",
      });
    }

    const result = await authService.forgotPassword({
      email,
    });

    return res.status(200).json(result);

  } catch (error) {
    console.error("Forgot password error:", error);

    return res.status(400).json({
      message: error.message,
    });
  }
};


// ======================== VERIFY FORGOT PASSWORD OTP ======================== //

const verifyForgotPasswordOtp = async (req, res) => {
  try {
    let { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        message: "Email and OTP are required",
      });
    }

    email = email.trim().toLowerCase();
    otp = String(otp).trim();

    // Email validation
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Please enter a valid email address",
      });
    }

    // OTP validation
    if (!otpRegex.test(otp)) {
      return res.status(400).json({
        message: "OTP must be exactly 6 digits",
      });
    }

    const result = await authService.verifyForgotPasswordOtp({
      email,
      otp,
    });

    return res.status(200).json(result);

  } catch (error) {
    console.error("Forgot password OTP verification error:", error);

    return res.status(400).json({
      message: error.message,
    });
  }
};


// ======================== RESET PASSWORD ======================== //

const resetPassword = async (req, res) => {
  try {
    let {
      email,
      newPassword,
      confirmPassword,
    } = req.body;

    if (!email || !newPassword || !confirmPassword) {
      return res.status(400).json({
        message:
          "Email, new password and confirm password are required",
      });
    }

    email = email.trim().toLowerCase();

    // Email validation
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Please enter a valid email address",
      });
    }

    // New password validation
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        message:
          "Password must be 8-20 characters and contain uppercase, lowercase, number and special character",
      });
    }

    // Confirm password validation
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match",
      });
    }

    const result = await authService.resetPassword({
      email,
      newPassword,
      confirmPassword,
    });

    return res.status(200).json(result);

  } catch (error) {
    console.error("Reset password error:", error);

    return res.status(400).json({
      message: error.message,
    });
  }
};


// ======================== GOOGLE LOGIN ======================== //

const googleLogin = async (req, res) => {
  try {
    let { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        message: "Google ID token is required",
      });
    }

    idToken = String(idToken).trim();

    if (!idToken) {
      return res.status(400).json({
        message: "Google ID token cannot be empty",
      });
    }

    const result = await authService.googleLogin(idToken);

    return res.status(200).json(result);

  } catch (error) {
    console.error("Google login error:", error);

    return res.status(400).json({
      message: error.message,
    });
  }
};

// ======================== CHANGE EMAIL - SEND OTP ======================== //

const sendChangeEmailOtp = async (req, res) => {
  try {
    let { newEmail } = req.body;

    if (!newEmail) {
      return res.status(400).json({
        message: "New email is required",
      });
    }

    newEmail = newEmail.trim().toLowerCase();

    if (!emailRegex.test(newEmail)) {
      return res.status(400).json({
        message: "Please enter a valid email address",
      });
    }

    const result = await authService.sendChangeEmailOtp({
      userId: req.userId,
      newEmail,
    });

    return res.status(200).json(result);

  } catch (error) {
    console.error("Send change email OTP error:", error);

    return res.status(400).json({
      message: error.message,
    });
  }
};


// ======================== CHANGE EMAIL - VERIFY OTP ======================== //

const verifyChangeEmailOtp = async (req, res) => {
  try {
    let { newEmail, otp } = req.body;

    if (!newEmail || !otp) {
      return res.status(400).json({
        message: "New email and OTP are required",
      });
    }

    newEmail = newEmail.trim().toLowerCase();
    otp = String(otp).trim();

    if (!emailRegex.test(newEmail)) {
      return res.status(400).json({
        message: "Please enter a valid email address",
      });
    }

    if (!otpRegex.test(otp)) {
      return res.status(400).json({
        message: "OTP must be exactly 6 digits",
      });
    }

    const result = await authService.verifyChangeEmailOtp({
      userId: req.userId,
      newEmail,
      otp,
    });

    return res.status(200).json(result);

  } catch (error) {
    console.error("Verify change email OTP error:", error);

    return res.status(400).json({
      message: error.message,
    });
  }
};


// ======================== CHANGE PASSWORD - SEND OTP ======================== //

const sendChangePasswordOtp = async (req, res) => {
  try {
    const {
      currentPassword,
      newPassword,
      confirmPassword,
    } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        message:
          "Current password, new password and confirm password are required",
      });
    }

    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        message:
          "Password must be 8-20 characters and contain uppercase, lowercase, number and special character",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match",
      });
    }

    const result = await authService.sendChangePasswordOtp({
      userId: req.userId,
      currentPassword,
      newPassword,
      confirmPassword,
    });

    return res.status(200).json(result);

  } catch (error) {
    console.error("Send change password OTP error:", error);

    return res.status(400).json({
      message: error.message,
    });
  }
};


// ======================== CHANGE PASSWORD - VERIFY OTP ======================== //

const verifyChangePasswordOtp = async (req, res) => {
  try {
    const {
      otp,
      newPassword,
      confirmPassword,
    } = req.body;

    if (!otp || !newPassword || !confirmPassword) {
      return res.status(400).json({
        message:
          "OTP, new password and confirm password are required",
      });
    }

    const otpValue = String(otp).trim();

    if (!otpRegex.test(otpValue)) {
      return res.status(400).json({
        message: "OTP must be exactly 6 digits",
      });
    }

    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        message:
          "Password must be 8-20 characters and contain uppercase, lowercase, number and special character",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match",
      });
    }

    const result = await authService.verifyChangePasswordOtp({
      userId: req.userId,
      otp: otpValue,
      newPassword,
      confirmPassword,
    });

    return res.status(200).json(result);

  } catch (error) {
    console.error("Verify change password OTP error:", error);

    return res.status(400).json({
      message: error.message,
    });
  }
};

// ======================== EXPORTS ======================== //

module.exports = {
  registerUser,
  verifyOtp,
  resendOtp,
  loginUser,
  forgotPassword,
  verifyForgotPasswordOtp,
  resetPassword,
  googleLogin,
  sendChangeEmailOtp,
  verifyChangeEmailOtp,
  sendChangePasswordOtp,
  verifyChangePasswordOtp,
};
