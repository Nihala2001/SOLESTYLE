const { loginAdmin } = require("../../services/admin/adminAuthService");

const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const result = await loginAdmin(email, password);

    res.status(200).json({
      success: true,
      message: "Admin login successful",
      token: result.token,
      admin: {
        id: result.admin._id,
        name: result.admin.name,
        email: result.admin.email,
        profileImage: result.admin.profileImage,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);

    res.status(401).json({
      success: false,
      message: error.message || "Invalid email or password",
    });
  }
};

module.exports = {
  adminLogin,
};