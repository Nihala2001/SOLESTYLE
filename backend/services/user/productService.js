
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

  // Search by product name
  if (search.trim()) {
    query.name = {
      $regex: search.trim(),
      $options: "i",
    };
  }

  // Get only products whose category is active
  const activeCategories = await Category.find({
    isActive: true,
  }).select("_id");

  const activeCategoryIds = activeCategories.map(
    (category) => category._id
  );

  query.categoryId = {
    $in: categoryId ? [categoryId] : activeCategoryIds,
  };

  // Count products
  const totalProducts = await Product.countDocuments(query);

  // Get products
  const products = await Product.find(query)
    .populate("categoryId", "name")
    .sort({ name: 1 })
    .skip(skip)
    .limit(limitNumber)
    .lean();

  // Get active variants, including their prices
  const productIds = products.map((product) => product._id);

  const variants = await Variant.find({
    productId: { $in: productIds },
    isActive: true,
  })
    .select("productId productImages mainImage price")
    .sort({ price: 1 })
    .lean();

  // Add display image and offer pricing
  const productsWithPricing = await Promise.all(
    products.map(async (product) => {
      const productVariants = variants.filter(
        (variant) =>
          variant.productId.toString() === product._id.toString()
      );

      // Use the lowest-priced active variant for the Shop card.
      const variant = productVariants[0] || null;

      const displayImage =
        variant?.mainImage ||
        product.images?.[0] ||
        variant?.productImages?.[0] ||
        null;

      // Use the product base price if no active variant exists.
      const pricing = await getVariantPricing(
        variant || { price: product.basePrice },
        product
      );

      return {
        ...product,
        displayImage,

        // Price shown on the Shop page
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
