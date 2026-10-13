
const {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
} = require("../../services/user/cartService");

const fetchCart = async (req, res) => {
  try {
    const cart = await getCart(req.userId);

    res.status(200).json({
      success: true,
      cart,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const addCartItem = async (req, res) => {
  try {
    const { variantId, quantity } = req.body;

    if (!variantId) {
      return res.status(400).json({
        success: false,
        message: "Please select a product variant",
      });
    }

    const cart = await addToCart(
      req.userId,
      variantId,
      quantity ?? 1
    );

    res.status(200).json({
      success: true,
      message: "Added to cart successfully",
      cart,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const changeCartItemQuantity = async (req, res) => {
  try {
    const cart = await updateCartItem(
      req.userId,
      req.params.itemId,
      req.body.quantity
    );

    res.status(200).json({
      success: true,
      message: "Cart quantity updated",
      cart,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteCartItem = async (req, res) => {
  try {
    const cart = await removeCartItem(
      req.userId,
      req.params.itemId
    );

    res.status(200).json({
      success: true,
      message: "Item removed from cart",
      cart,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  fetchCart,
  addCartItem,
  changeCartItemQuantity,
  deleteCartItem,
};
