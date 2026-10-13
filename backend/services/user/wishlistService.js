
const Wishlist = require("../../models/Wishlist");
const Variant = require("../../models/Variant");

const getWishlist = async (userId) => {
  let wishlist = await Wishlist.findOne({ userId });

  if (!wishlist) {
    wishlist = await Wishlist.create({
      userId,
      items: [],
    });
  }

  const items = await Promise.all(
    wishlist.items.map(async (item) => {
      const variant = await Variant.findById(item.variantId).lean();

      if (!variant) {
        return null;
      }

      const Product = require("../../models/Product");
      const product = await Product.findById(variant.productId).lean();

      if (!product) {
        return null;
      }

      return {
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
          product.displayImage ||
          product.images?.[0] ||
          "",
        product: {
          _id: product._id,
          name: product.name,
          basePrice: product.basePrice,
        },
      };
    })
  );

  return {
    _id: wishlist._id,
    items: items.filter(Boolean),
  };
};

const addToWishlist = async (userId, variantId, quantity = 1) => {
  const variant = await Variant.findById(variantId);

  if (!variant || !variant.isActive) {
    throw new Error("Product variant is unavailable");
  }

  let wishlist = await Wishlist.findOne({ userId });

  if (!wishlist) {
    wishlist = await Wishlist.create({
      userId,
      items: [],
    });
  }

  const existingItem = wishlist.items.find(
    (item) => item.variantId.toString() === variantId.toString()
  );

  if (existingItem) {
    existingItem.quantity = Math.max(
      existingItem.quantity,
      Number(quantity) || 1
    );
  } else {
    wishlist.items.push({
      variantId,
      quantity: Math.max(1, Number(quantity) || 1),
    });
  }

  await wishlist.save();

  return getWishlist(userId);
};

const removeFromWishlist = async (userId, itemId) => {
  const wishlist = await Wishlist.findOne({ userId });

  if (!wishlist) {
    throw new Error("Wishlist not found");
  }

  const item = wishlist.items.id(itemId);

  if (!item) {
    throw new Error("Wishlist item not found");
  }

  wishlist.items.pull({ _id: itemId });
  await wishlist.save();

  return getWishlist(userId);
};

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
};