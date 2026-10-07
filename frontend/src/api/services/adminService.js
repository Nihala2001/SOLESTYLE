import api from "../axiosInstance";

//..............ADMIN LOGIN ............

export const loginAdmin = async (data) => {
  const response = await api.post("/admin/login", data);

  return response.data;
};


// .............. ADMIN PROFILE....................

// Get admin profile
export const getAdminProfile = async () => {
  const response = await api.get("/admin/profile");

  return response.data;
};

// Update admin profile
export const updateAdminProfile = async (data) => {
  const response = await api.put("/admin/profile", data);

  return response.data;
};


// .......... ADMIN CATEGORIES ...............

// Get categories
export const getAdminCategories = async () => {
  const response = await api.get(
    "/admin/categories?limit=100"
  );

  return response.data;
};


// .............. ADMIN PRODUCTS.................

// Get products
export const getAdminProducts = async (params) => {
  const response = await api.get(
    "/admin/products",
    {
      params,
    }
  );

  return response.data;
};

// Add product
export const addAdminProduct = async (formData) => {
  const response = await api.post(
    "/admin/products",
    formData
  );

  return response.data;
};

// Update product
export const updateAdminProduct = async (
  productId,
  data
) => {
  const response = await api.put(
    `/admin/products/${productId}`,
    data
  );

  return response.data;
};

// Delete product
export const deleteAdminProduct = async (productId) => {
  const response = await api.delete(
    `/admin/products/${productId}`
  );

  return response.data;
};

// Activate product
export const activateAdminProduct = async (productId) => {
  const response = await api.patch(
    `/admin/products/${productId}/activate`
  );

  return response.data;
};



//....................ADMIN USERS...................

// Get users
export const getAdminUsers = async (
  search = "",
  page = 1,
  limit = 5
) => {
  const response = await api.get("/admin/users", {
    params: {
      search,
      page,
      limit,
    },
  });

  return response.data;
};

// Block user
export const blockUser = async (userId) => {
  const response = await api.patch(
    `/admin/users/${userId}/block`
  );

  return response.data;
};

// Unblock user
export const unblockUser = async (userId) => {
  const response = await api.patch(
    `/admin/users/${userId}/unblock`
  );

  return response.data;
};