const User = require("../../models/User");
const Otp = require("../../models/Otp");
const bcrypt = require("bcryptjs");
const generateToken = require("../../utils/generateToken");
const sendEmail = require("../../utils/sendEmail");
const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID
);

// ======================================================
// REGISTER USER
// ======================================================

const registerUser = async ({
  name,
  email,
  password,
  referralCode,
}) => {
  email = email.toLowerCase().trim();

  const existingEmail = await User.findOne({ email });

  if (existingEmail) {
    throw new Error("Email already registered");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    referralCodeUsed: referralCode || null,
    isVerified: false,
  });

  const otpCode = Math.floor(
    100000 + Math.random() * 900000
  ).toString();

  const expireAt = new Date(
    Date.now() + 5 * 60 * 1000
  );

  await Otp.create({
    userId: user._id,
    code: otpCode,
    email: user.email,
    expireAt,
    isUsed: false,
  });

  await sendEmail(
    user.email,
    "SOLESTYLE Registration OTP",
    `Your SOLESTYLE registration OTP is ${otpCode}. This OTP is valid for 5 minutes.`
  );

  return {
    userId: user._id,
  };
};

// ======================================================
// VERIFY REGISTRATION OTP
// ======================================================

const verifyOtp = async ({ email, otp }) => {
  const otpRecord = await Otp.findOne({
    email,
    code: otp,
    isUsed: false,
  });

  if (!otpRecord) {
    throw new Error("Invalid OTP");
  }

  if (otpRecord.expireAt <= new Date()) {
    throw new Error(
      "OTP expired. Please resend a new OTP."
    );
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new Error("User not found");
  }

  user.isVerified = true;

  await user.save();

  otpRecord.isUsed = true;

  await otpRecord.save();

  return {
    message: "OTP verified successfully",
  };
};

// ======================================================
// RESEND REGISTRATION OTP
// ======================================================

const resendOtp = async ({ email }) => {
  email = email.toLowerCase().trim();

  const user = await User.findOne({ email });

  if (!user) {
    throw new Error("User not found");
  }

  if (user.isVerified) {
    throw new Error("User is already verified");
  }

  const otpCode = Math.floor(
    100000 + Math.random() * 900000
  ).toString();

  const expireAt = new Date(
    Date.now() + 5 * 60 * 1000
  );

  await Otp.updateMany(
    {
      email,
      isUsed: false,
    },
    {
      isUsed: true,
    }
  );

  await Otp.create({
    userId: user._id,
    code: otpCode,
    email: user.email,
    expireAt,
    isUsed: false,
  });

  await sendEmail(
    user.email,
    "SOLESTYLE OTP Resend",
    `Your new SOLESTYLE OTP is ${otpCode}. This OTP is valid for 5 minutes.`
  );

  return {
    message: "OTP resent successfully",
  };
};

// ======================================================
// LOGIN USER
// ======================================================

const loginUser = async ({ email, password }) => {
  email = email.toLowerCase().trim();

  const user = await User.findOne({ email });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  if (!user.isActive) {
    throw new Error("Your account has been blocked");
  }

  if (!user.isVerified) {
    throw new Error("Please verify your email first");
  }

  const isPasswordMatch = await bcrypt.compare(
    password,
    user.password
  );

  if (!isPasswordMatch) {
    throw new Error("Invalid email or password");
  }

  const token = generateToken(user._id);

  return {
    message: "Login successful",
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
  };
};

// ======================================================
// FORGOT PASSWORD
// ======================================================

const forgotPassword = async ({ email }) => {
  email = email.toLowerCase().trim();

  const user = await User.findOne({ email });

  if (!user) {
    throw new Error("User not found");
  }

  const otpCode = Math.floor(
    100000 + Math.random() * 900000
  ).toString();

  const expireAt = new Date(
    Date.now() + 5 * 60 * 1000
  );

  await Otp.create({
    userId: user._id,
    email: user.email,
    code: otpCode,
    expireAt,
    isUsed: false,
  });

  await sendEmail(
    user.email,
    "SOLESTYLE Password Reset OTP",
    `Your SOLESTYLE password reset OTP is ${otpCode}. This OTP is valid for 5 minutes.`
  );

  return {
    message: "OTP sent successfully",
  };
};

// ======================================================
// VERIFY FORGOT PASSWORD OTP
// ======================================================

const verifyForgotPasswordOtp = async ({
  email,
  otp,
}) => {
  email = email.toLowerCase().trim();

  const otpRecord = await Otp.findOne({
    email,
    code: otp,
    isUsed: false,
  });

  if (!otpRecord) {
    throw new Error("Invalid OTP");
  }

  if (otpRecord.expireAt < new Date()) {
    throw new Error("OTP expired");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new Error("User not found");
  }

  otpRecord.isUsed = true;

  await otpRecord.save();

  user.passwordResetVerified = true;

  await user.save();

  return {
    message:
      "OTP verified successfully. You can now reset your password.",
  };
};

// ======================================================
// RESET PASSWORD
// ======================================================

const resetPassword = async ({
  email,
  newPassword,
  confirmPassword,
}) => {
  email = email.toLowerCase().trim();

  if (newPassword !== confirmPassword) {
    throw new Error("Passwords do not match");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new Error("User not found");
  }

  if (!user.passwordResetVerified) {
    throw new Error("Please verify OTP first");
  }

  const hashedPassword = await bcrypt.hash(
    newPassword,
    10
  );

  user.password = hashedPassword;

  user.passwordResetVerified = false;

  await user.save();

  return {
    message: "Password reset successfully",
  };
};

// ======================================================
// GOOGLE LOGIN
// ======================================================

const googleLogin = async (idToken) => {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();

  const {
    sub: googleId,
    email,
    name,
    picture,
  } = payload;

  if (!email) {
    throw new Error("Google account email not found");
  }

  let user = await User.findOne({ email });

  if (user) {
    if (!user.isActive) {
      throw new Error("Your account has been blocked");
    }

    if (!user.googleId) {
      user.googleId = googleId;
    }

    if (
      picture &&
      (!user.profileImage ||
        user.profileImage.length === 0)
    ) {
      user.profileImage = [picture];
    }

    user.isVerified = true;

    await user.save();
  } else {
    user = await User.create({
      name,
      email,
      googleId,
      profileImage: picture ? [picture] : [],
      isVerified: true,
      isActive: true,
    });
  }

  const token = generateToken(user._id);

  return {
    message: "Google login successful",
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
  };
};

// ======================================================
// CHANGE EMAIL - SEND OTP
// ======================================================

const sendChangeEmailOtp = async ({
  userId,
  newEmail,
}) => {
  newEmail = newEmail.toLowerCase().trim();

  // Validate email format
  const emailRegex =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(newEmail)) {
    throw new Error("Please enter a valid email address");
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  if (!user.isActive) {
    throw new Error("Your account has been blocked");
  }

  if (user.email === newEmail) {
    throw new Error(
      "This is already your current email"
    );
  }

  // Check whether email is already registered
  const existingUser = await User.findOne({
    email: newEmail,
    _id: { $ne: userId },
  });

  if (existingUser) {
    throw new Error(
      "This email is already registered"
    );
  }

  // Invalidate previous unused OTPs
  await Otp.updateMany(
    {
      userId,
      isUsed: false,
    },
    {
      isUsed: true,
    }
  );

  // Generate OTP
  const otpCode = Math.floor(
    100000 + Math.random() * 900000
  ).toString();

  const expireAt = new Date(
    Date.now() + 5 * 60 * 1000
  );

  // Save OTP
  await Otp.create({
    userId,
    email: newEmail,
    code: otpCode,
    expireAt,
    isUsed: false,
  });

  // Send OTP to new email
  await sendEmail(
    newEmail,
    "SOLESTYLE Email Change OTP",
    `Your SOLESTYLE email change OTP is ${otpCode}. This OTP is valid for 5 minutes.`
  );

  return {
    message: "OTP sent successfully",
  };
};

// ======================================================
// CHANGE EMAIL - VERIFY OTP
// ======================================================

const verifyChangeEmailOtp = async ({
  userId,
  newEmail,
  otp,
}) => {
  newEmail = newEmail.toLowerCase().trim();

  const otpRecord = await Otp.findOne({
    userId,
    email: newEmail,
    code: otp,
    isUsed: false,
  });

  if (!otpRecord) {
    throw new Error("Invalid OTP");
  }

  if (otpRecord.expireAt <= new Date()) {
    throw new Error(
      "OTP expired. Please request a new OTP."
    );
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  if (!user.isActive) {
    throw new Error("Your account has been blocked");
  }

  // Check again before changing email
  const existingUser = await User.findOne({
    email: newEmail,
    _id: { $ne: userId },
  });

  if (existingUser) {
    throw new Error(
      "This email is already registered"
    );
  }

  // Change email
  user.email = newEmail;

  user.isVerified = true;

  await user.save();

  // Mark OTP as used
  otpRecord.isUsed = true;

  await otpRecord.save();

  return {
    message: "Email changed successfully",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
  };
};

// ======================================================
// CHANGE PASSWORD - SEND OTP
// ======================================================

const sendChangePasswordOtp = async ({
  userId,
  currentPassword,
  newPassword,
  confirmPassword,
}) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  if (!user.isActive) {
    throw new Error("Your account has been blocked");
  }

  if (!user.password) {
    throw new Error(
      "Password change is not available for this account"
    );
  }

  // Check current password
  const isPasswordMatch = await bcrypt.compare(
    currentPassword,
    user.password
  );

  if (!isPasswordMatch) {
    throw new Error(
      "Current password is incorrect"
    );
  }

  // Check new password and confirm password
  if (newPassword !== confirmPassword) {
    throw new Error("Passwords do not match");
  }

  // Password validation
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,20}$/;

  if (!passwordRegex.test(newPassword)) {
    throw new Error(
      "Password must be 8-20 characters and include uppercase, lowercase, number and special character"
    );
  }

  // New password must be different
  if (currentPassword === newPassword) {
    throw new Error(
      "New password must be different from current password"
    );
  }

  // Invalidate previous unused OTPs
  await Otp.updateMany(
    {
      userId,
      isUsed: false,
    },
    {
      isUsed: true,
    }
  );

  // Generate OTP
  const otpCode = Math.floor(
    100000 + Math.random() * 900000
  ).toString();

  const expireAt = new Date(
    Date.now() + 5 * 60 * 1000
  );

  // Save OTP
  await Otp.create({
    userId,
    email: user.email,
    code: otpCode,
    expireAt,
    isUsed: false,
  });

  // Send OTP
  await sendEmail(
    user.email,
    "SOLESTYLE Password Change OTP",
    `Your SOLESTYLE password change OTP is ${otpCode}. This OTP is valid for 5 minutes.`
  );

  return {
    message: "OTP sent successfully",
  };
};

// ======================================================
// CHANGE PASSWORD - VERIFY OTP
// ======================================================

const verifyChangePasswordOtp = async ({
  userId,
  otp,
  newPassword,
  confirmPassword,
}) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  if (!user.isActive) {
    throw new Error("Your account has been blocked");
  }

  const otpRecord = await Otp.findOne({
    userId,
    email: user.email,
    code: otp,
    isUsed: false,
  });

  if (!otpRecord) {
    throw new Error("Invalid OTP");
  }

  if (otpRecord.expireAt <= new Date()) {
    throw new Error(
      "OTP expired. Please request a new OTP."
    );
  }

  if (newPassword !== confirmPassword) {
    throw new Error("Passwords do not match");
  }

  // Validate password again during verification
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,20}$/;

  if (!passwordRegex.test(newPassword)) {
    throw new Error(
      "Password must be 8-20 characters and include uppercase, lowercase, number and special character"
    );
  }

  // Check that new password is not the current password
  const isSamePassword = await bcrypt.compare(
    newPassword,
    user.password
  );

  if (isSamePassword) {
    throw new Error(
      "New password must be different from current password"
    );
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(
    newPassword,
    10
  );

  user.password = hashedPassword;

  await user.save();

  // Mark OTP as used
  otpRecord.isUsed = true;

  await otpRecord.save();

  return {
    message: "Password changed successfully",
  };
};

// ======================================================
// EXPORT
// ======================================================

module.exports = {
  registerUser,
  verifyOtp,
  resendOtp,
  loginUser,
  forgotPassword,
  verifyForgotPasswordOtp,
  resetPassword,
  googleLogin,

  // Change Email
  sendChangeEmailOtp,
  verifyChangeEmailOtp,

  // Change Password
  sendChangePasswordOtp,
  verifyChangePasswordOtp,
};