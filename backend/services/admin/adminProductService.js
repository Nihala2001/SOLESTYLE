const Product = require("../../models/Product");
const Category = require("../../models/Category");

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

  const totalProducts = await Product.countDocuments(query);

  const products = await Product.find(query)
    .populate("categoryId", "name")
    .sort({ isActive: -1, name: 1 })
    .skip(skip)
    .limit(limitNumber);

  const totalPages = Math.ceil(
    totalProducts / limitNumber
  );

  return {
    products,
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
      ...(name !== undefined && { name: name.trim() }),
      ...(description !== undefined && {
        description: description.trim(),
      }),
      ...(categoryId !== undefined && { categoryId }),
      ...(basePrice !== undefined && { basePrice }),
      ...(images !== undefined && { images }),
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


module.exports = {
  addProduct,
  getProducts,
  updateProduct,
  deleteProduct,
  activateProduct,
};