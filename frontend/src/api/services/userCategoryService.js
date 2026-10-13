import axiosInstance from "../axiosInstance";

// ================= GET ACTIVE CATEGORIES =================

export const getActiveCategories = async () => {
  const response = await axiosInstance.get("/categories");

  return response.data;
};