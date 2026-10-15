
import api from "../axiosInstance";

// Get coupons
export const getAdminCoupons = async (
  search = "",
  page = 1,
  limit = 5
) => {
  const response = await api.get("/admin/coupons", {
    params: {
      search,
      page,
      limit,
    },
  });

  return response.data;
};

// Add coupon
export const addAdminCoupon = async (data) => {
  const response = await api.post("/admin/coupons", data);
  return response.data;
};

// Update coupon
export const updateAdminCoupon = async (couponId, data) => {
  const response = await api.put(
    `/admin/coupons/${couponId}`,
    data
  );

  return response.data;
};

// Deactivate coupon
export const deactivateAdminCoupon = async (couponId) => {
  const response = await api.patch(
    `/admin/coupons/${couponId}/deactivate`
  );

  return response.data;
};

// Activate coupon
export const activateAdminCoupon = async (couponId) => {
  const response = await api.patch(
    `/admin/coupons/${couponId}/activate`
  );

  return response.data;
};