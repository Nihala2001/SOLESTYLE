const Product = require("../../models/Product");
const Category = require("../../models/Category");
const Variant = require("../../models/Variant");

// ================= GET ACTIVE PRODUCTS =================

const getActiveProducts = async ({
  search = "",
  categoryId = "",
  page = 1,
  limit = 12,
}) => {
  const pageNumber = Number(page);
  const limitNumber = Number(limit);

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

  // Filter by category
  if (categoryId) {
    query.categoryId = categoryId;
  }

  // Get only products whose category is active
  const activeCategories = await Category.find({
    isActive: true,
  }).select("_id");

  const activeCategoryIds = activeCategories.map(
    (category) => category._id
  );

  query.categoryId = {
    $in: categoryId
      ? [categoryId]
      : activeCategoryIds,
  };

  // Count products
  const totalProducts = await Product.countDocuments(query);

  // Get products
  const products = await Product.find(query)
    .populate("categoryId", "name")
    .sort({
      name: 1,
    })
    .skip(skip)
    .limit(limitNumber)
    .lean();

  // Get active variants
  const productIds = products.map(
    (product) => product._id
  );

  const variants = await Variant.find({
  productId: {
    $in: productIds,
  },
  isActive: true,
})
  .select("productId productImages mainImage")
  .lean();

  // Add display image
  const productsWithImages = products.map((product) => {
  const variant = variants.find(
    (variant) =>
      variant.productId.toString() ===
      product._id.toString()
  );

  return {
    ...product,

    displayImage:
      variant?.mainImage ||
      product.images?.[0] ||
      variant?.productImages?.[0] ||
      null,
  };
});

  const totalPages = Math.ceil(
    totalProducts / limitNumber
  );

  return {
    products: productsWithImages,

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