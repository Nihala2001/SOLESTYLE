import api from "../axiosInstance";

// Create product variants
export const createProductVariants = async (data) => {
  const response = await api.post("/admin/variants", data);
  return response.data;
};

// Get variants for a product
export const getProductVariants = async (productId) => {
  const response = await api.get(`/admin/variants/${productId}`);
  return response.data;
};

// Update a variant
export const updateProductVariant = async (variantId, data) => {
  const response = await api.put(
    `/admin/variants/${variantId}`,
    data
  );

  return response.data;
};

// Update the main image for a color
export const updateVariantMainImage = async (
  productId,
  color,
  mainImage
) => {
  const response = await api.patch(
    `/admin/variants/${productId}/main-image`,
    {
      color,
      mainImage,
    }
  );

  return response.data;
};



// ================= UPDATE COLOR IMAGES =================

export const updateProductColorImages = async (
  productId,
  color,
  existingImages,
  newImages = []
) => {
  const formData = new FormData();

  formData.append("color", color);
  formData.append(
    "existingImages",
    JSON.stringify(existingImages)
  );

  newImages.forEach((image) => {
    formData.append("variantImages", image);
  });

  const response = await api.patch(
    `/admin/variants/${productId}/images`,
    formData
  );

  return response.data;
};

