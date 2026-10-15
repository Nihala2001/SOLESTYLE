const Variant = require("../../models/Variant");
const Product = require("../../models/Product");
const { getVariantPricing } = require("./offerPricingService");

// ================= GET ACTIVE PRODUCT VARIANTS =================

const getActiveProductVariants = async (productId) => {
  const product = await Product.findOne({
    _id: productId,
    isActive: true,
  })
    .populate("categoryId", "name")
    .lean();

  if (!product) {
    return [];
  }

  const variants = await Variant.find({
    productId,
    isActive: true,
  })
    .sort({
      color: 1,
      size: 1,
    })
    .lean();

  const updatedVariants = await Promise.all(
    variants.map(async (variant) => {
      let updatedVariant = { ...variant };

      // Preserve the admin-selected main image as the first image.
      if (
        variant.mainImage &&
        Array.isArray(variant.productImages) &&
        variant.productImages.includes(variant.mainImage)
      ) {
        const otherImages = variant.productImages.filter(
          (image) => image !== variant.mainImage
        );

        updatedVariant.productImages = [
          variant.mainImage,
          ...otherImages,
        ];
      }

      // Calculate the best applicable product/category offer.
      const pricing = await getVariantPricing(variant, product);

      return {
        ...updatedVariant,
        originalPrice: pricing.originalPrice,
        price: pricing.price,
        offerDiscount: pricing.offerDiscount,
        offerName: pricing.offerName,
        discountType: pricing.discountType,
        discountValue: pricing.discountValue,
      };
    })
  );

  return updatedVariants;
};

module.exports = {
  getActiveProductVariants,
};
