const {
  getActiveProductVariants,
} = require("../../services/user/variantService");

// ================= GET ACTIVE PRODUCT VARIANTS =================

const fetchActiveProductVariants = async (req, res) => {
  try {
    const { productId } = req.params;

    const variants =
      await getActiveProductVariants(productId);

    res.status(200).json({
      success: true,
      variants,
    });
  } catch (error) {
    console.error(
      "Get active product variants error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch product variants",
    });
  }
};

module.exports = {
  fetchActiveProductVariants,
};