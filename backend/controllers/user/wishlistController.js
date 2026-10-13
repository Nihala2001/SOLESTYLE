
const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} = require("../../services/user/wishlistService");

// GET WISHLIST
const fetchWishlist = async (req, res) => {
  try {
    const wishlist = await getWishlist(req.userId);

    return res.status(200).json({
      success: true,
      wishlist,
    });
  } catch (error) {
    console.error("Fetch wishlist error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch wishlist",
    });
  }
};

// ADD ITEM TO WISHLIST
const addWishlistItem = async (req, res) => {
  try {
    const { variantId, quantity } = req.body;

    if (!variantId) {
      return res.status(400).json({
        success: false,
        message: "Variant ID is required",
      });
    }

    const wishlist = await addToWishlist(
      req.userId,
      variantId,
      quantity
    );

    return res.status(200).json({
      success: true,
      message: "Added to wishlist successfully",
      wishlist,
    });
  } catch (error) {
    console.error("Add wishlist item error:", error.message);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to add item to wishlist",
    });
  }
};

// REMOVE ITEM FROM WISHLIST
const deleteWishlistItem = async (req, res) => {
  try {
    const wishlist = await removeFromWishlist(
      req.userId,
      req.params.itemId
    );

    return res.status(200).json({
      success: true,
      message: "Removed from wishlist successfully",
      wishlist,
    });
  } catch (error) {
    console.error("Remove wishlist item error:", error.message);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to remove item from wishlist",
    });
  }
};

module.exports = {
  fetchWishlist,
  addWishlistItem,
  deleteWishlistItem,
};