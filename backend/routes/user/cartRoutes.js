
const express = require("express");
const router = express.Router();

const authMiddleware = require("../../middleware/user/authMiddleware");

const {
  fetchCart,
  addCartItem,
  changeCartItemQuantity,
  deleteCartItem,
} = require("../../controllers/user/cartController");

router.get("/", authMiddleware, fetchCart);

router.post("/items", authMiddleware, addCartItem);

router.put(
  "/items/:itemId",
  authMiddleware,
  changeCartItemQuantity
);

router.delete(
  "/items/:itemId",
  authMiddleware,
  deleteCartItem
);

module.exports = router;
