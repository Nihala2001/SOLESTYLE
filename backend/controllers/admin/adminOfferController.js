const {
  addOffer,
  getOffers,
  updateOffer,
  deactivateOffer,
  activateOffer,
} = require("../../services/admin/adminOfferService");

const createOffer = async (req, res) => {
  try {
    const offer = await addOffer(req.body);

    return res.status(201).json({
      success: true,
      message: "Offer created successfully",
      offer,
    });
  } catch (error) {
    console.error("Create offer error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to create offer",
    });
  }
};

const fetchOffers = async (req, res) => {
  try {
    const { search = "", page = 1, limit = 5 } = req.query;
    const result = await getOffers({ search, page, limit });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Fetch offers error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch offers",
    });
  }
};

const editOffer = async (req, res) => {
  try {
    const offer = await updateOffer(req.params.offerId, req.body);

    return res.status(200).json({
      success: true,
      message: "Offer updated successfully",
      offer,
    });
  } catch (error) {
    console.error("Update offer error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to update offer",
    });
  }
};

const removeOffer = async (req, res) => {
  try {
    const offer = await deactivateOffer(req.params.offerId);

    return res.status(200).json({
      success: true,
      message: "Offer deactivated successfully",
      offer,
    });
  } catch (error) {
    console.error("Deactivate offer error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to deactivate offer",
    });
  }
};

const restoreOffer = async (req, res) => {
  try {
    const offer = await activateOffer(req.params.offerId);

    return res.status(200).json({
      success: true,
      message: "Offer activated successfully",
      offer,
    });
  } catch (error) {
    console.error("Activate offer error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to activate offer",
    });
  }
};

module.exports = {
  createOffer,
  fetchOffers,
  editOffer,
  removeOffer,
  restoreOffer,
};
