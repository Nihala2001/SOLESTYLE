
const mongoose = require("mongoose");
const Offer = require("../../models/Offer");
const Product = require("../../models/Product");
const Category = require("../../models/Category");

const validateOfferTarget = async ({
  targetType,
  productId,
  categoryId,
}) => {
  if (targetType === "Product") {
    if (!mongoose.isValidObjectId(productId)) {
      throw new Error("Please select a valid product");
    }

    const product = await Product.findOne({
      _id: productId,
      isActive: true,
    });

    if (!product) {
      throw new Error("Selected product does not exist or is inactive");
    }

    return { productId: product._id, categoryId: null };
  }

  if (targetType === "Category") {
    if (!mongoose.isValidObjectId(categoryId)) {
      throw new Error("Please select a valid category");
    }

    const category = await Category.findOne({
      _id: categoryId,
      isActive: true,
    });

    if (!category) {
      throw new Error("Selected category does not exist or is inactive");
    }

    return { productId: null, categoryId: category._id };
  }

  throw new Error("Offer type must be Product or Category");
};

const validateOfferDates = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (
    !startDate ||
    !endDate ||
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    end <= start
  ) {
    throw new Error("End date must be later than the start date");
  }

  return { startDate: start, endDate: end };
};

const getOfferPayload = async (data) => {
  const {
    name,
    targetType,
    productId,
    categoryId,
    discountType,
    discountValue,
    // Temporary backward compatibility for existing frontend submissions.
    discountPercentage,
    startDate,
    endDate,
  } = data;

  if (!name?.trim()) {
    throw new Error("Offer name is required");
  }

  const normalizedType = discountType || "Percentage";
  const value = Number(
    discountValue !== undefined ? discountValue : discountPercentage
  );

  if (!["Fixed", "Percentage"].includes(normalizedType)) {
    throw new Error("Discount type must be Fixed or Percentage");
  }

  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("Discount value must be greater than zero");
  }

  if (normalizedType === "Percentage" && value > 100) {
    throw new Error("Percentage discount cannot exceed 100%");
  }

  const target = await validateOfferTarget({
    targetType,
    productId,
    categoryId,
  });

  const dates = validateOfferDates(startDate, endDate);

  return {
    name: name.trim(),
    targetType,
    ...target,
    discountType: normalizedType,
    discountValue: value,
    ...dates,
  };
};

const addOffer = async (data) => {
  const payload = await getOfferPayload(data);
  return Offer.create(payload);
};

const getOffers = async ({ search = "", page = 1, limit = 5 }) => {
  const pageNumber = Math.max(1, Number(page) || 1);
  const limitNumber = Math.max(1, Number(limit) || 5);

  const offers = await Offer.find()
    .populate("productId", "name")
    .populate("categoryId", "name")
    .sort({ createdAt: -1 })
    .lean();

  const term = search.trim().toLowerCase();

  const filteredOffers = term
    ? offers.filter((offer) =>
        [
          offer.name,
          offer.targetType,
          offer.productId?.name,
          offer.categoryId?.name,
          offer.discountType,
          offer.discountType === "Fixed"
            ? `₹${offer.discountValue}`
            : `${offer.discountValue}%`,
        ].some((value) =>
          String(value || "").toLowerCase().includes(term)
        )
      )
    : offers;

  const totalOffers = filteredOffers.length;
  const totalPages = Math.ceil(totalOffers / limitNumber);
  const startIndex = (pageNumber - 1) * limitNumber;

  return {
    offers: filteredOffers.slice(startIndex, startIndex + limitNumber),
    pagination: {
      currentPage: pageNumber,
      totalPages,
      totalOffers,
      limit: limitNumber,
    },
  };
};

const updateOffer = async (offerId, data) => {
  if (!mongoose.isValidObjectId(offerId)) {
    throw new Error("Invalid offer ID");
  }

  const offer = await Offer.findById(offerId);

  if (!offer) {
    throw new Error("Offer not found");
  }

  const payload = await getOfferPayload(data);

  Object.assign(offer, payload);
  await offer.save();

  return offer;
};

const deactivateOffer = async (offerId) => {
  const offer = await Offer.findByIdAndUpdate(
    offerId,
    { isActive: false },
    { new: true, runValidators: true }
  );

  if (!offer) {
    throw new Error("Offer not found");
  }

  return offer;
};

const activateOffer = async (offerId) => {
  const offer = await Offer.findById(offerId);

  if (!offer) {
    throw new Error("Offer not found");
  }

  await validateOfferTarget({
    targetType: offer.targetType,
    productId: offer.productId,
    categoryId: offer.categoryId,
  });

  offer.isActive = true;
  await offer.save();

  return offer;
};

// Calculates a price-aware offer for a product variant.
// The larger discount wins; offers are never stacked.
const getBestOfferForProduct = async (productId, categoryId, price) => {
  const originalPrice = Number(price);

  if (!Number.isFinite(originalPrice) || originalPrice <= 0) {
    return null;
  }

  const now = new Date();

  const offers = await Offer.find({
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gt: now },
    $or: [
      { targetType: "Product", productId },
      { targetType: "Category", categoryId },
    ],
  }).lean();

  let bestOffer = null;
  let bestDiscount = 0;

  for (const offer of offers) {
    const value = Number(
      offer.discountValue !== undefined
        ? offer.discountValue
        : offer.discountPercentage
    );

    const discountType = offer.discountType || "Percentage";

    let discountAmount =
      discountType === "Fixed"
        ? value
        : (originalPrice * value) / 100;

    discountAmount = Math.min(
      originalPrice,
      Math.max(0, Math.round((discountAmount + Number.EPSILON) * 100) / 100)
    );

    if (discountAmount > bestDiscount) {
      bestDiscount = discountAmount;
      bestOffer = {
        ...offer,
        discountAmount,
        finalPrice:
          Math.round(
            (originalPrice - discountAmount + Number.EPSILON) * 100
          ) / 100,
      };
    }
  }

  return bestOffer;
};

module.exports = {
  addOffer,
  getOffers,
  updateOffer,
  deactivateOffer,
  activateOffer,
  getBestOfferForProduct,
};
