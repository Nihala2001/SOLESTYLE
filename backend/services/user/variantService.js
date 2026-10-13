const Variant = require("../../models/Variant");

// ================= GET ACTIVE PRODUCT VARIANTS =================

const getActiveProductVariants = async (productId) => {
  const variants = await Variant.find({
    productId,
    isActive: true,
  })
    .sort({
      color: 1,
      size: 1,
    })
    .lean();

  const updatedVariants = variants.map((variant) => {
    if (
      variant.mainImage &&
      Array.isArray(variant.productImages) &&
      variant.productImages.includes(variant.mainImage)
    ) {
      const otherImages = variant.productImages.filter(
        (image) => image !== variant.mainImage
      );

      return {
        ...variant,
        productImages: [
          variant.mainImage,
          ...otherImages,
        ],
      };
    }

    return variant;
  });

  return updatedVariants;
};

module.exports = {
  getActiveProductVariants,
};