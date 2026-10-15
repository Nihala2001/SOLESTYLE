const express = require("express");
const router = express.Router();

const adminAuthMiddleware = require("../../middleware/admin/adminAuthMiddleware");

const {
  createOffer,
  fetchOffers,
  editOffer,
  removeOffer,
  restoreOffer,
} = require("../../controllers/admin/adminOfferController");

router.post("/", adminAuthMiddleware, createOffer);
router.get("/", adminAuthMiddleware, fetchOffers);
router.put("/:offerId", adminAuthMiddleware, editOffer);
router.patch("/:offerId/deactivate", adminAuthMiddleware, removeOffer);
router.patch("/:offerId/activate", adminAuthMiddleware, restoreOffer);

module.exports = router;
