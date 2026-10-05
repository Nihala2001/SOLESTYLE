const express = require("express");
const authMiddleware = require("../../middleware/user/authMiddleware");

const {
  registerUser,
  verifyOtp,
  verifyForgotPasswordOtp,
  resendOtp,
  loginUser,
  forgotPassword,
  resetPassword,
  googleLogin,
  sendChangeEmailOtp,
  verifyChangeEmailOtp,
  sendChangePasswordOtp,
  verifyChangePasswordOtp,
} = require("../../controllers/user/authController");

const router = express.Router();


router.post("/register", registerUser);

router.post("/verify-otp", verifyOtp);

router.post("/resend-otp", resendOtp);

router.post("/login", loginUser);

router.post("/forgot-password", forgotPassword);

router.post("/verify-forgot-password-otp",verifyForgotPasswordOtp);

router.post("/reset-password", resetPassword);

router.post("/google-login", googleLogin);

router.post("/change-email/send-otp", authMiddleware, sendChangeEmailOtp);

router.post("/change-email/verify-otp", authMiddleware, verifyChangeEmailOtp);

router.post("/change-password/send-otp", authMiddleware, sendChangePasswordOtp);

router.post("/change-password/verify-otp", authMiddleware, verifyChangePasswordOtp);

module.exports = router;