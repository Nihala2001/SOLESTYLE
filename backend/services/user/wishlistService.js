
const Wishlist = require("../../models/Wishlist");
const Variant = require("../../models/Variant");
const Product = require("../../models/Product");

// ================= GET WISHLIST =================

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

      // Keep the wishlist item even if its variant no longer exists.
      if (!variant) {
        return {
          _id: item._id,
          variantId: String(item.variantId),
          quantity: item.quantity,
          color: "",
          size: "",
          price: 0,
          stock: 0,
          image: "",
          product: {
            name: "Product no longer available",
          },
          availability: "unavailable",
          unavailableReason: "Product not available",
        };
      }

      const product = await Product.findById(variant.productId).lean();

      // Keep the wishlist item even if its product no longer exists.
      if (!product) {
        return {
          _id: item._id,
          variantId: String(variant._id),
          quantity: item.quantity,
          color: variant.color || "",
          size: variant.size || "",
          price: Number(variant.price || 0),
          stock: Number(variant.stock || 0),
          image:
            variant.mainImage ||
            variant.productImages?.[0] ||
            "",
          product: {
            name: "Product no longer available",
          },
          availability: "unavailable",
          unavailableReason: "Product not available",
        };
      }
      const unavailable =
        product.isActive === false || variant.isActive === false;

      const stock = Number(variant.stock || 0);

      let availability = "available";
      let unavailableReason = "";

      if (unavailable) {
        availability = "unavailable";
        unavailableReason = "Product not available";
      } else if (stock <= 0) {
        availability = "out_of_stock";
        unavailableReason = "This product is out of stock.";
      } else if (Number(item.quantity) > stock) {
        availability = "insufficient_stock";
        unavailableReason =
          `Only ${stock} item(s) are available.`;
      }

      return {
        _id: item._id,
        variantId: String(variant._id),
        quantity: item.quantity,
        color: variant.color,
        size: variant.size,
        price: Number(variant.price ?? product.basePrice ?? 0),
        stock,
        image:
          variant.mainImage ||
          variant.productImages?.[0] ||
          product.images?.[0] ||
          "",
        product: {
          _id: product._id,
          name: product.name,
          basePrice: product.basePrice,
        },
        availability,
        unavailableReason,
      };
    })
  );

  return {
    _id: wishlist._id,
    items,
  };
};

// ================= ADD TO WISHLIST =================

const addToWishlist = async (userId, variantId, quantity = 1) => {
  const variant = await Variant.findById(variantId);

  if (!variant || !variant.isActive) {
    throw new Error("Product variant is unavailable");
  }

  const product = await Product.findById(variant.productId);

  if (!product || !product.isActive) {
    throw new Error("Product is unavailable");
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

// ================= REMOVE FROM WISHLIST =================

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
