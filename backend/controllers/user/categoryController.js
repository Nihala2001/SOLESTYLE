const {
  getActiveCategories,
} = require("../../services/user/categoryService");

// ================= GET ACTIVE CATEGORIES =================

const fetchActiveCategories = async (req, res) => {
  try {
    const categories = await getActiveCategories();

    res.status(200).json({
      success: true,
      categories,
    });
  } catch (error) {
    console.error("Get active categories error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
    });
  }
};

module.exports = {
  fetchActiveCategories,
};