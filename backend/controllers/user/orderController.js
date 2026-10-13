
const mongoose = require("mongoose");
const Order = require("../../models/Order");
const Address = require("../../models/Address");
const Cart = require("../../models/Cart");
const Variant = require("../../models/Variant");
const { getCart } = require("../../services/user/cartService");

const createOrder = async (req, res) => {
  try {
    const { addressId, paymentMethod } = req.body;

    if (!mongoose.isValidObjectId(addressId)) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid delivery address",
      });
    }

    if (!["COD", "UPI"].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method",
      });
    }

    const address = await Address.findOne({
      _id: addressId,
      userId: req.userId,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Delivery address not found",
      });
    }

    const cart = await getCart(req.userId);

    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Your cart is empty",
      });
    }

    const orderItems = [];
    let subtotal = 0;

    for (const item of cart.items) {
      if (
        !item.variantId ||
        !mongoose.isValidObjectId(item.variantId) ||
        !item.product ||
        !Number.isInteger(Number(item.quantity)) ||
        Number(item.quantity) < 1
      ) {
        return res.status(400).json({
          success: false,
          message: "Your cart contains an invalid item",
        });
      }

      const variant = await Variant.findOne({
        _id: item.variantId,
        isActive: true,
      });

      if (!variant || variant.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${item.product.name}`,
        });
      }

      const price = Number(item.price);

      if (!Number.isFinite(price) || price < 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid product price",
        });
      }

      const productId = item.product._id;

      orderItems.push({
        productId,
        variantId: variant._id,
        productName: item.product.name,
        color: item.color || variant.color || "",
        size: item.size || variant.size || "",
        image: item.image || variant.mainImage || "",
        price,
        quantity: Number(item.quantity),
      });

      subtotal += price * Number(item.quantity);
    }

    subtotal = Math.round(subtotal * 100) / 100;

    // Free shipping for this initial checkout version.
    const shippingFee = 0;
    const discount = 0;
    const totalAmount = Math.max(
      0,
      Math.round((subtotal - discount + shippingFee) * 100) / 100
    );

    const order = await Order.create({
      orderNumber: `SS-${Date.now()}-${Math.floor(
        1000 + Math.random() * 9000
      )}`,
      userId: req.userId,
      items: orderItems,
      shippingAddress: {
        fullName: address.fullName,
        phone: address.phone,
        addressLine: address.addressLine,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        addressType: address.addressType,
      },
      subtotal,
      discount,
      shippingFee,
      totalAmount,
      paymentMethod,
      paymentStatus: paymentMethod === "COD" ? "Pending" : "Pending",
      orderStatus: "Placed",
    });

    // Clear the cart after the order is successfully created.
    const userCart = await Cart.findOne({ userId: req.userId });

    if (userCart) {
      userCart.items = [];
      await userCart.save();
    }

    return res.status(201).json({
      success: true,
      message:
        paymentMethod === "COD"
          ? "Order placed successfully"
          : "Order created. UPI payment is pending.",
      order,
    });
  } catch (error) {
    console.error("Create order error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to place order",
    });
  }
};

const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      userId: req.userId,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Get orders error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
    });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
};