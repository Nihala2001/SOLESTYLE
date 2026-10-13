const Category = require("../../models/Category");

// ================= GET ACTIVE CATEGORIES =================

const getActiveCategories = async () => {
  const categories = await Category.find({
    isActive: true,
  })
    .sort({ name: 1 })
    .select("_id name");

  return categories;
};

module.exports = {
  getActiveCategories,
};