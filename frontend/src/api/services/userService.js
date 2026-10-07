import api from "../axiosInstance";

// ================= PROFILE =================

// Get user profile
export const getProfile = async () => {
    const response = await api.get("/user/profile");
    return response.data;
};

// Update profile
export const updateProfile = async (data) => {
    const response = await api.put("/user/profile", data);
    return response.data;
};

// ================= PROFILE IMAGE =================

// Update profile image
export const updateProfileImage = async (data) => {
    const response = await api.put("/user/profile", data);
    return response.data;
};

// Remove profile image
export const removeProfileImage = async (data) => {
    const response = await api.put("/user/profile", data);
    return response.data;
};

// ================= CHANGE EMAIL =================

// Send email change OTP
export const sendEmailChangeOtp = async (newEmail) => {
    const response = await api.post(
        "/user/change-email/send-otp",
        {
            newEmail,
        }
    );

    return response.data;
};

// Verify email change OTP
export const verifyEmailChangeOtp = async (data) => {
    const response = await api.post(
        "/user/change-email/verify-otp",
        data
    );

    return response.data;
};

// ================= CHANGE PASSWORD =================

// Send password change OTP
export const sendPasswordChangeOtp = async (data) => {
    const response = await api.post(
        "/user/change-password/send-otp",
        data
    );

    return response.data;
};

// Verify password change OTP
export const verifyPasswordChangeOtp = async (data) => {
    const response = await api.post(
        "/user/change-password/verify-otp",
        data
    );

    return response.data;
};

// ================= ADDRESSES =================

// Get addresses
export const getAddresses = async () => {
    const response = await api.get("/user/addresses");
    return response.data;
};

// Add address
export const addAddress = async (data) => {
    const response = await api.post(
        "/user/addresses",
        data
    );

    return response.data;
};

// Update address
export const updateAddress = async (addressId, data) => {
    const response = await api.put(
        `/user/addresses/${addressId}`,
        data
    );

    return response.data;
};

// Delete address
export const deleteAddress = async (addressId) => {
    const response = await api.delete(
        `/user/addresses/${addressId}`
    );

    return response.data;
};

// Set default address
export const setDefaultAddress = async (addressId) => {
    const response = await api.put(
        `/user/addresses/${addressId}/default`
    );

    return response.data;
};