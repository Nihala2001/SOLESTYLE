const {
  addCategory,
  getCategories,
  updateCategory,
  deleteCategory,
  activateCategory,
} = require("../../services/admin/adminCategoryService");


// ================= ADD CATEGORY =================

const createCategory = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    const category = await addCategory(name);

    res.status(201).json({
      success: true,
      message: "Category added successfully",
      category,
    });

  } catch (error) {
    console.error("Add category error:", error);

    res.status(400).json({
      success: false,
      message: error.message || "Failed to add category",
    });
  }
};


// ================= GET CATEGORIES =================

const fetchCategories = async (req, res) => {
  try {
    const {
      search = "",
      page = 1,
      limit = 5,
    } = req.query;

    const result = await getCategories({
      search,
      page,
      limit,
    });

    res.status(200).json({
      success: true,
      ...result,
    });

  } catch (error) {
    console.error("Get categories error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
    });
  }
};


// ================= UPDATE CATEGORY =================

const editCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    const category = await updateCategory(
      categoryId,
      name
    );

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      category,
    });

  } catch (error) {
    console.error("Update category error:", error);

    res.status(400).json({
      success: false,
      message: error.message || "Failed to update category",
    });
  }
};


// ================= SOFT DELETE =================

const removeCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const category = await deleteCategory(categoryId);

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
      category,
    });

  } catch (error) {
    console.error("Delete category error:", error);

    res.status(400).json({
      success: false,
      message: error.message || "Failed to delete category",
    });
  }
};

// ================= ACTIVATE CATEGORY =================

const restoreCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const category = await activateCategory(categoryId);

    res.status(200).json({
      success: true,
      message: "Category activated successfully",
      category,
    });

  } catch (error) {
    console.error("Activate category error:", error);

    res.status(400).json({
      success: false,
      message:
        error.message || "Failed to activate category",
    });
  }
};

module.exports = {
  createCategory,
  fetchCategories,
  editCategory,
  removeCategory,
  restoreCategory,
};