
const { getBestOfferForProduct } = require("../admin/adminOfferService");

// Calculate the best offer for a product variant.
// Product and category offers do not stack.
const getVariantPricing = async (variant, product) => {
  const originalPrice = Number(variant.price);

  const categoryId =
    product.categoryId?._id || product.categoryId || null;

  const offer = await getBestOfferForProduct(
    product._id,
    categoryId,
    originalPrice
  );

  const offerDiscount = Number(offer?.discountAmount || 0);

  return {
    originalPrice,
    offerDiscount,
    price: Math.round(
      (originalPrice - offerDiscount + Number.EPSILON) * 100
    ) / 100,
    offerName: offer?.name || null,
    discountType: offer?.discountType || null,
    discountValue: offer
      ? Number(offer.discountValue ?? offer.discountPercentage ?? 0)
      : 0,
  };
};

module.exports = { getVariantPricing };
