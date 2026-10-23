
const Product = require("../../models/Product");
const Category = require("../../models/Category");
const Variant = require("../../models/Variant");
const { getVariantPricing } = require("./offerPricingService");

// ================= GET ACTIVE PRODUCTS =================


const getActiveProducts = async ({
  search = "",
  categoryId = "",
  page = 1,
  limit = 12,
}) => {
  const pageNumber = Math.max(1, Number(page) || 1);
  const limitNumber = Math.max(1, Number(limit) || 12);
  const skip = (pageNumber - 1) * limitNumber;

  const query = {
    isActive: true,
  };

  // Search by product name, ignoring uppercase/lowercase differences.
  const searchText = search.trim();

  if (searchText) {
    const escapedSearch = searchText.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );

    query.name = {
      $regex: escapedSearch,
      $options: "i",
    };
  }

  // Only show products belonging to active categories.
const activeCategories = await Category.find({
  isActive: true,
}).select("_id name");

const activeCategoryIds = activeCategories.map(
  (category) => category._id
);

if (categoryId) {
  const mongoose = require("mongoose");

  let matchedCategory = null;

  // If categoryId is a valid MongoDB ObjectId, match by ID.
  if (mongoose.Types.ObjectId.isValid(categoryId)) {
    matchedCategory = activeCategories.find(
      (category) =>
        category._id.toString() === categoryId
    );
  }

  // Otherwise, match by category name, ignoring case.
  if (!matchedCategory) {
    matchedCategory = activeCategories.find(
      (category) =>
        category.name.trim().toLowerCase() ===
        categoryId.trim().toLowerCase()
    );
  }

  query.categoryId = matchedCategory
    ? matchedCategory._id
    : null;
} else {
  query.categoryId = {
    $in: activeCategoryIds,
  };
}

  // Count matching products for pagination.
  const totalProducts = await Product.countDocuments(query);

  // Fetch the requested page.
  const products = await Product.find(query)
    .populate("categoryId", "name")
    .sort({ name: 1 })
    .skip(skip)
    .limit(limitNumber)
    .lean();

  // Fetch active variants for the displayed products.
  const productIds = products.map((product) => product._id);

  const variants = await Variant.find({
    productId: { $in: productIds },
    isActive: true,
  })
    .select("productId productImages mainImage price")
    .sort({ price: 1 })
    .lean();

  // Preserve product images, variant prices, and offer pricing.
  const productsWithPricing = await Promise.all(
    products.map(async (product) => {
      const productVariants = variants.filter(
        (variant) =>
          variant.productId.toString() === product._id.toString()
      );

      const variant = productVariants[0] || null;

      const displayImage =
        variant?.mainImage ||
        product.images?.[0] ||
        variant?.productImages?.[0] ||
        null;

      const pricing = await getVariantPricing(
        variant || { price: product.basePrice },
        product
      );

      return {
        ...product,
        displayImage,
        displayPrice: pricing.price,
        originalPrice: pricing.originalPrice,
        offerDiscount: pricing.offerDiscount,
        offerName: pricing.offerName,
        discountType: pricing.discountType,
        discountValue: pricing.discountValue,
      };
    })
  );

  const totalPages = Math.ceil(totalProducts / limitNumber);

  return {
    products: productsWithPricing,
    pagination: {
      currentPage: pageNumber,
      totalPages,
      totalProducts,
      limit: limitNumber,
    },
  };
};

module.exports = {
  getActiveProducts,
};
