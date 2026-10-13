const Product = require("../../models/Product");
const Category = require("../../models/Category");
const Variant = require("../../models/Variant");

// ================= ADD PRODUCT =================

const addProduct = async ({
  name,
  description,
  categoryId,
  basePrice,
  images = [],
}) => {
  // Check category exists
  const category = await Category.findById(categoryId);

  if (!category) {
    throw new Error("Category not found");
  }

  // Don't allow inactive category
  if (!category.isActive) {
    throw new Error("Cannot add product to an inactive category");
  }

  const product = await Product.create({
    name: name.trim(),
    description: description.trim(),
    categoryId,
    basePrice,
    images,
  });

  return product;
};


// ================= GET PRODUCTS =================

const getProducts = async ({
  search = "",
  categoryId = "",
  page = 1,
  limit = 5,
}) => {
  const pageNumber = Number(page);
  const limitNumber = Number(limit);
  const skip = (pageNumber - 1) * limitNumber;

  const query = {};

  if (search.trim()) {
    query.name = {
      $regex: search.trim(),
      $options: "i",
    };
  }

  if (categoryId) {
    query.categoryId = categoryId;
  }

  const totalProducts = await Product.countDocuments(query);

  const products = await Product.find(query)
    .populate("categoryId", "name")
    .sort({
      isActive: -1,
      name: 1,
    })
    .skip(skip)
    .limit(limitNumber)
    .lean();

  const productIds = products.map((product) => product._id);

  const variants = await Variant.find({
    productId: { $in: productIds },
    isActive: true,
  })
    .select("productId color productImages mainImage")
    .lean();

  const productsWithImages = products.map((product) => {
    const productVariants = variants.filter(
      (variant) =>
        variant.productId.toString() === product._id.toString()
    );

    // Prefer the color selected by the admin.
    const selectedColorVariant = productVariants.find(
      (variant) =>
        product.displayColor &&
        variant.color?.trim().toLowerCase() ===
          product.displayColor.trim().toLowerCase()
    );

    // Fallback if the selected color no longer has an active variant.
    const fallbackVariant = productVariants[0];

    const chosenVariant = selectedColorVariant || fallbackVariant;

    const displayImage =
      chosenVariant?.mainImage ||
      chosenVariant?.productImages?.[0] ||
      product.images?.[0] ||
      null;

    return {
      ...product,
      displayImage,
      displayColor: chosenVariant?.color || product.displayColor || "",
    };
  });

  const totalPages = Math.ceil(totalProducts / limitNumber);

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
// ================= UPDATE PRODUCT =================

const updateProduct = async (
  productId,
  {
    name,
    description,
    categoryId,
    basePrice,
    images,
  }
) => {
  const product = await Product.findById(productId);

  if (!product) {
    throw new Error("Product not found");
  }

  // Check category if category is being changed
  if (categoryId) {
    const category = await Category.findById(categoryId);

    if (!category) {
      throw new Error("Category not found");
    }

    if (!category.isActive) {
      throw new Error("Cannot use an inactive category");
    }
  }

  const updatedProduct = await Product.findByIdAndUpdate(
    productId,
    {
      ...(name !== undefined && {
        name: name.trim(),
      }),

      ...(description !== undefined && {
        description: description.trim(),
      }),

      ...(categoryId !== undefined && {
        categoryId,
      }),

      ...(basePrice !== undefined && {
        basePrice,
      }),

      ...(images !== undefined && {
        images,
      }),
    },
    {
      new: true,
      runValidators: true,
    }
  );

  return updatedProduct;
};

// ================= SOFT DELETE =================

const deleteProduct = async (productId) => {
  const product = await Product.findByIdAndUpdate(
    productId,
    {
      isActive: false,
    },
    {
      new: true,
    }
  );

  if (!product) {
    throw new Error("Product not found");
  }

  return product;
};

// ================= ACTIVATE PRODUCT =================

const activateProduct = async (productId) => {
  const product = await Product.findByIdAndUpdate(
    productId,
    {
      isActive: true,
    },
    {
      new: true,
    }
  );

  if (!product) {
    throw new Error("Product not found");
  }

  return product;
};

// ================= EXPORTS =================

module.exports = {
  addProduct,
  getProducts,
  updateProduct,
  deleteProduct,
  activateProduct,
};