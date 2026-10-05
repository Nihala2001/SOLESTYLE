const {
  getAdminProfile,
  updateAdminProfile,
} = require("../../services/admin/adminProfileService");

// GET ADMIN PROFILE

const getProfile = async (req, res) => {
  try {
    const admin = await getAdminProfile(req.adminId);

    res.status(200).json({
      success: true,
      admin,
    });
  } catch (error) {
    console.error("Get admin profile error:", error);

    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

// UPDATE ADMIN PROFILE

const updateProfile = async (req, res) => {
  try {
    const { name, profileImage } = req.body;

    const admin = await updateAdminProfile(
      req.adminId,
      name,
      profileImage
    );

    res.status(200).json({
      success: true,
      message: "Admin profile updated successfully",
      admin,
    });
  } catch (error) {
    console.error("Update admin profile error:", error);

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
};