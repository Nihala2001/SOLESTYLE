
import api from "../axiosInstance";

// Get the logged-in user's cart
export const getCart = async () => {
  const response = await api.get("/cart");
  return response.data;
};

// Add a product variant to the cart
export const addToCart = async (variantId, quantity = 1) => {
  const response = await api.post("/cart/items", {
    variantId,
    quantity,
  });

  return response.data;
};

// Update cart item quantity
export const updateCartItem = async (itemId, quantity) => {
  const response = await api.put(`/cart/items/${itemId}`, {
    quantity,
  });

  return response.data;
};

// Remove a cart item
export const removeCartItem = async (itemId) => {
  const response = await api.delete(`/cart/items/${itemId}`);
  return response.data;
};
