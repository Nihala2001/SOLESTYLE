
import api from "../axiosInstance";

// Get wishlist
export const getWishlist = async () => {
  const response = await api.get("/wishlist");
  return response.data;
};

// Add item to wishlist
export const addToWishlist = async (variantId, quantity = 1) => {
  const response = await api.post("/wishlist/items", {
    variantId,
    quantity,
  });

  return response.data;
};

// Remove item from wishlist
export const removeFromWishlist = async (itemId) => {
  const response = await api.delete(`/wishlist/items/${itemId}`);
  return response.data;
};