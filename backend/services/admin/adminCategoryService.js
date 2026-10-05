const Category = require("../../models/Category");

// ================= ADD CATEGORY =================

const addCategory = async (name) => {
  const trimmedName = name.trim();

  const existingCategory = await Category.findOne({
    name: {
      $regex: `^${trimmedName}$`,
      $options: "i",
    },
  });

  if (existingCategory) {
    throw new Error("Category already exists");
  }

  const category = await Category.create({
    name: trimmedName,
  });

  return category;
};


// ================= GET CATEGORIES =================

const getCategories = async ({
  search = "",
  page = 1,
  limit = 5,
}) => {
  const pageNumber = Number(page);
  const limitNumber = Number(limit);

  const skip = (pageNumber - 1) * limitNumber;

  const query = {};

  // Search
  if (search.trim()) {
    query.name = {
      $regex: search.trim(),
      $options: "i",
    };
  }

  // Get total count
  const totalCategories = await Category.countDocuments(query);

  // Get categories
  const categories = await Category.find(query)
    .sort({ isActive:-1,name: 1 })
    .skip(skip)
    .limit(limitNumber);

  const totalPages = Math.ceil(
    totalCategories / limitNumber
  );

  return {
    categories,
    pagination: {
      currentPage: pageNumber,
      totalPages,
      totalCategories,
      limit: limitNumber,
    },
  };
};


// ================= UPDATE CATEGORY =================

const updateCategory = async (categoryId, name) => {
  const trimmedName = name.trim();

  const existingCategory = await Category.findOne({
    name: {
      $regex: `^${trimmedName}$`,
      $options: "i",
    },

    _id: {
      $ne: categoryId,
    },
  });

  if (existingCategory) {
    throw new Error("Category already exists");
  }

  const category = await Category.findByIdAndUpdate(
    categoryId,
    {
      name: trimmedName,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!category) {
    throw new Error("Category not found");
  }

  return category;
};


// ================= SOFT DELETE =================

const deleteCategory = async (categoryId) => {
  const category = await Category.findByIdAndUpdate(
    categoryId,
    {
      isActive: false,
    },
    {
      new: true,
    }
  );

  if (!category) {
    throw new Error("Category not found");
  }

  return category;
};

// ================= ACTIVATE CATEGORY =================

const activateCategory = async (categoryId) => {
  const category = await Category.findByIdAndUpdate(
    categoryId,
    {
      isActive: true,
    },
    {
      new: true,
    }
  );

  if (!category) {
    throw new Error("Category not found");
  }

  return category;
};


module.exports = {
  addCategory,
  getCategories,
  updateCategory,
  deleteCategory,
  activateCategory,
};