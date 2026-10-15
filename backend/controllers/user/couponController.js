const {
getAvailableCoupons,
} = require("../../services/user/couponService");

const fetchAvailableCoupons = async (req, res) => {
try {
const coupons = await getAvailableCoupons();


return res.status(200).json({
  success: true,
  coupons,
});


} catch (error) {
console.error("Fetch available coupons error:", error);


return res.status(500).json({
  success: false,
  message: "Failed to fetch available coupons",
});


}
};

module.exports = { fetchAvailableCoupons };
