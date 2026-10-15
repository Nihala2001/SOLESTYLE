
import api from "../axiosInstance";

// Notify the navbar that the cart has changed
const notifyCartUpdated = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("cartUpdated"));
  }
};

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

  notifyCartUpdated();
  return response.data;
};

// Update cart item quantity
export const updateCartItem = async (itemId, quantity) => {
  const response = await api.put(`/cart/items/${itemId}`, {
    quantity,
  });

  notifyCartUpdated();
  return response.data;
};

// Remove an item from the cart
export const removeCartItem = async (itemId) => {
  const response = await api.delete(`/cart/items/${itemId}`);

  notifyCartUpdated();
  return response.data;
};
