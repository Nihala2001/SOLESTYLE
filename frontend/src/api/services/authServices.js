import api from "../axiosInstance";

// Normal login
export const loginUser = async (data) => {
  const response = await api.post("/auth/login", data);
  return response.data;
};

// Google login
export const googleLogin = async (idToken) => {
  const response = await api.post("/auth/google-login", {
    idToken,
  });

  return response.data;
};

// Register user
export const registerUser = async (data) => {
  const response = await api.post("/auth/register", data);
  return response.data;
};

// Verify registration OTP
export const verifyOtp = async (data) => {
  const response = await api.post("/auth/verify-otp", data);
  return response.data;
};

// Resend registration OTP
export const resendOtp = async (email) => {
  const response = await api.post("/auth/resend-otp", {
    email,
  });
  return response.data;
};

// Forgot password
export const forgotPassword = async (email) => {
  const response = await api.post("/auth/forgot-password", {
    email,
  });

  return response.data;
};

// Verify forgot password OTP
export const verifyForgotPasswordOtp = async (data) => {
  const response = await api.post(
    "/auth/verify-forgot-password-otp",
    data
  );

  return response.data;
};

// Resend forgot password OTP
export const resendForgotPasswordOtp = async (email) => {
  const response = await api.post(
    "/auth/forgot-password",
    {
      email,
    }
  );

  return response.data;
};

// Reset password
export const resetPassword = async (data) => {
  const response = await api.post(
    "/auth/reset-password",
    data
  );

  return response.data;
};