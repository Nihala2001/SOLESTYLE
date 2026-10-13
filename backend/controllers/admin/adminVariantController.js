
const {
  createVariants,
  getProductVariants,
  updateVariant,
  updateMainImage,
  updateColorImages,
} = require("../../services/admin/adminVariantService");

// ================= CREATE VARIANTS =================

const createProductVariants = async (req, res) => {
  try {
    const { productId, variants } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    let parsedVariants = variants;

    if (typeof variants === "string") {
      parsedVariants = JSON.parse(variants);
    }

    if (
      !Array.isArray(parsedVariants) ||
      parsedVariants.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "At least one variant is required",
      });
    }

    const createdVariants = await createVariants(
      productId,
      parsedVariants,
      req.files || []
    );

    return res.status(201).json({
      success: true,
      message: "Variants created successfully",
      variants: createdVariants,
    });
  } catch (error) {
    console.error("Create variants error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create variants",
    });
  }
};

// ================= GET PRODUCT VARIANTS =================

const fetchProductVariants = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    const variants = await getProductVariants(productId);

    return res.status(200).json({
      success: true,
      variants,
    });
  } catch (error) {
    console.error("Get product variants error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch variants",
    });
  }
};

// ================= UPDATE VARIANT =================

const updateProductVariant = async (req, res) => {
  try {
    const { variantId } = req.params;

    if (!variantId) {
      return res.status(400).json({
        success: false,
        message: "Variant ID is required",
      });
    }

    const { color, size, stock, price, sku } = req.body;

    const updatedVariant = await updateVariant(variantId, {
      color,
      size,
      stock,
      price,
      sku,
    });

    return res.status(200).json({
      success: true,
      message: "Variant updated successfully",
      variant: updatedVariant,
    });
  } catch (error) {
    console.error("Update variant error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update variant",
    });
  }
};

// ================= UPDATE MAIN IMAGE =================

const updateProductMainImage = async (req, res) => {
  try {
    const { productId } = req.params;
    const { color, mainImage } = req.body;

    if (!productId || !color || !mainImage) {
      return res.status(400).json({
        success: false,
        message: "Product ID, color, and main image are required",
      });
    }

    const variants = await updateMainImage(
      productId,
      color,
      mainImage
    );

    return res.status(200).json({
      success: true,
      message: "Main image updated successfully",
      variants,
    });
  } catch (error) {
    console.error("Update main image error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update main image",
    });
  }
};

// ================= UPDATE COLOR IMAGES =================

const updateProductColorImages = async (req, res) => {
  try {
    const { productId } = req.params;
    const { color } = req.body;

    let existingImages = req.body.existingImages || "[]";

    if (typeof existingImages === "string") {
      existingImages = JSON.parse(existingImages);
    }

    if (!Array.isArray(existingImages)) {
      return res.status(400).json({
        success: false,
        message: "Invalid existing images",
      });
    }

    const variants = await updateColorImages(
      productId,
      color,
      existingImages,
      req.files || []
    );

    return res.status(200).json({
      success: true,
      message: "Color images updated successfully",
      variants,
    });
  } catch (error) {
    console.error("Update color images error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to update color images",
    });
  }
};

// ================= EXPORT =================

module.exports = {
  createProductVariants,
  fetchProductVariants,
  updateProductVariant,
  updateProductMainImage,
  updateProductColorImages,
};
