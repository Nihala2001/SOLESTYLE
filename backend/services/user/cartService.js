
const Cart = require("../../models/Cart");
const Variant = require("../../models/Variant");
const Product = require("../../models/Product");

// Get cart with current product and variant information
const getCart = async (userId) => {
  let cart = await Cart.findOne({ userId });

  if (!cart) {
    cart = await Cart.create({
      userId,
      items: [],
    });
  }

  const items = [];

  for (const item of cart.items) {
    const variant = await Variant.findOne({
      _id: item.variantId,
      isActive: true,
    }).lean();

    if (!variant) continue;

    const product = await Product.findOne({
      _id: variant.productId,
      isActive: true,
    })
      .populate("categoryId", "name")
      .lean();

    if (!product) continue;

    items.push({
      _id: item._id,
      variantId: variant._id,
      quantity: item.quantity,
      color: variant.color,
      size: variant.size,
      price: variant.price,
      stock: variant.stock,
      image:
        variant.mainImage ||
        variant.productImages?.[0] ||
        product.images?.[0] ||
        "",
      product: {
        _id: product._id,
        name: product.name,
        categoryId: product.categoryId,
      },
    });
  }

  return {
    _id: cart._id,
    items,
  };
};

// Add a variant to the cart
const addToCart = async (userId, variantId, quantity = 1) => {
  const requestedQuantity = Number(quantity);

  if (
    !Number.isInteger(requestedQuantity) ||
    requestedQuantity < 1
  ) {
    throw new Error("Quantity must be a positive whole number");
  }

  const variant = await Variant.findOne({
    _id: variantId,
    isActive: true,
  });

  if (!variant) {
    throw new Error("Selected product variant is unavailable");
  }

  const product = await Product.findOne({
    _id: variant.productId,
    isActive: true,
  });

  if (!product) {
    throw new Error("Product is unavailable");
  }

  if (variant.stock < 1) {
    throw new Error("This variant is out of stock");
  }

  let cart = await Cart.findOne({ userId });

  if (!cart) {
    cart = new Cart({
      userId,
      items: [],
    });
  }

  const existingItem = cart.items.find(
    (item) => item.variantId.toString() === variantId
  );

  const newQuantity = existingItem
    ? existingItem.quantity + requestedQuantity
    : requestedQuantity;

  if (newQuantity > variant.stock) {
    throw new Error(
      `Only ${variant.stock} items are available for this size and color`
    );
  }

  if (existingItem) {
    existingItem.quantity = newQuantity;
  } else {
    cart.items.push({
      variantId,
      quantity: requestedQuantity,
    });
  }

  await cart.save();

  return getCart(userId);
};

// Update item quantity
const updateCartItem = async (userId, itemId, quantity) => {
  const requestedQuantity = Number(quantity);

  if (
    !Number.isInteger(requestedQuantity) ||
    requestedQuantity < 1
  ) {
    throw new Error("Quantity must be at least 1");
  }

  const cart = await Cart.findOne({ userId });

  if (!cart) {
    throw new Error("Cart not found");
  }

  const item = cart.items.id(itemId);

  if (!item) {
    throw new Error("Cart item not found");
  }

  const variant = await Variant.findOne({
    _id: item.variantId,
    isActive: true,
  });

  if (!variant) {
    throw new Error("Selected variant is unavailable");
  }

  if (requestedQuantity > variant.stock) {
    throw new Error(`Only ${variant.stock} items are available`);
  }

  item.quantity = requestedQuantity;

  await cart.save();

  return getCart(userId);
};

// Remove an item from the cart
const removeCartItem = async (userId, itemId) => {
  const cart = await Cart.findOne({ userId });

  if (!cart) {
    throw new Error("Cart not found");
  }

  const item = cart.items.id(itemId);

  if (!item) {
    throw new Error("Cart item not found");
  }

  item.deleteOne();

  await cart.save();

  return getCart(userId);
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
};
