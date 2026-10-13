import axiosInstance from "../axiosInstance";

// ================= GET ACTIVE PRODUCTS =================

export const getActiveProducts = async ({
  search = "",
  categoryId = "",
  page = 1,
  limit = 12,
} = {}) => {
  const response = await axiosInstance.get("/products", {
    params: {
      search,
      categoryId,
      page,
      limit,
    },
  });

  return response.data;
};