const {
  getActiveProducts,
} = require("../../services/user/productService");

// ================= GET ACTIVE PRODUCTS =================

const fetchActiveProducts = async (req, res) => {
  try {
    const {
      search = "",
      categoryId = "",
      page = 1,
      limit = 12,
    } = req.query;

    const result = await getActiveProducts({
      search,
      categoryId,
      page,
      limit,
    });

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Get active products error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
};

module.exports = {
  fetchActiveProducts,
};