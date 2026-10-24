import axiosInstance from "../axiosInstance";

// ================= GET PRODUCT VARIANTS =================

export const getProductVariants = async (productId) => {
  const response = await axiosInstance.get(
    `/variants/${productId}`
  );

  return response.data;
};

