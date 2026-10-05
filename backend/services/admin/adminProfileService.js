const Admin = require("../../models/Admin");

const getAdminProfile = async (adminId) => {
  const admin = await Admin.findById(adminId).select("-password");

  if (!admin) {
    throw new Error("Admin not found");
  }

  return admin;
};

const updateAdminProfile = async (
  adminId,
  name,
  profileImage
) => {
  const admin = await Admin.findById(adminId);

  if (!admin) {
    throw new Error("Admin not found");
  }

  if (!name || name.trim().length < 2 || name.trim().length > 50) {
    throw new Error(
      "Name must be between 2 and 50 characters"
    );
  }

  admin.name = name.trim();

  if (profileImage !== undefined) {
    admin.profileImage = profileImage;
  }

  await admin.save();

  return await Admin.findById(adminId).select("-password");
};

module.exports = {
  getAdminProfile,
  updateAdminProfile,
};