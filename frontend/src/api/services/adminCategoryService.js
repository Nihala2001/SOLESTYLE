import api from "../axiosInstance";

// Get categories
export const getAdminCategories = async (
  search = "",
  page = 1,
  limit = 5
) => {
  const response = await api.get("/admin/categories", {
    params: {
      search,
      page,
      limit,
    },
  });

  return response.data;
};

// Add category
export const addAdminCategory = async (data) => {
  const response = await api.post(
    "/admin/categories",
    data
  );

  return response.data;
};

// Update category
export const updateAdminCategory = async (
  categoryId,
  data
) => {
  const response = await api.put(
    `/admin/categories/${categoryId}`,
    data
  );

  return response.data;
};

// Delete category
export const deleteAdminCategory = async (categoryId) => {
  const response = await api.delete(
    `/admin/categories/${categoryId}`
  );

  return response.data;
};

// Activate category
export const activateAdminCategory = async (
  categoryId
) => {
  const response = await api.patch(
    `/admin/categories/${categoryId}/activate`
  );

  return response.data;
};