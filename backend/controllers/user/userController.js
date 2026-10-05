const User = require("../../models/User");

const authService = require("../../services/user/authServices");


// ======================== GET PROFILE ======================== //

const getUserProfile = async (req, res) => {

  try {

    const user = await User.findById(
      req.userId
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user,
    });

  } catch (error) {

    console.error(
      "Get profile error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to get user profile",
    });
  }
};


// ======================== UPDATE PROFILE ======================== //

const updateUserProfile = async (req, res) => {

  try {

    const {
      name,
      profileImage,
    } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    if (
      name.trim().length < 2 ||
      name.trim().length > 50
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name must be between 2 and 50 characters",
      });
    }

    const nameRegex =
      /^[A-Za-z ]{2,50}$/;

    if (!nameRegex.test(name.trim())) {
      return res.status(400).json({
        success: false,
        message:
          "Name must contain only letters and spaces",
      });
    }

    const user = await User.findById(
      req.userId
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.name = name.trim();

    if (profileImage !== undefined) {
      user.profileImage = profileImage;
    }

    await user.save();

    const updatedUser =
      await User.findById(req.userId)
        .select("-password");

    res.status(200).json({
      success: true,
      message:
        "Profile updated successfully",
      user: updatedUser,
    });

  } catch (error) {

    console.error(
      "Update profile error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to update profile",
    });
  }
};


// ======================== CHANGE PASSWORD ======================== //

const sendChangePasswordOtp = async (req, res) => {
  try {
    const {
      currentPassword,
      newPassword,
      confirmPassword,
    } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All password fields are required",
      });
    }

    const result = await authService.sendChangePasswordOtp({
      userId: req.userId,
      currentPassword,
      newPassword,
      confirmPassword,
    });

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("Send change password OTP error:", error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};


const verifyChangePasswordOtp = async (req, res) => {
  console.log("CHANGE PASSWORD OTP ROUTE HIT");
  try {
    const {
      otp,
      newPassword,
      confirmPassword,
    } = req.body;

    if (!otp || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "OTP and password fields are required",
      });
    }

    const result = await authService.verifyChangePasswordOtp({
      userId: req.userId,
      otp,
      newPassword,
      confirmPassword,
    });

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("Verify change password OTP error:", error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================== SEND CHANGE EMAIL OTP ======================== //

const sendChangeEmailOtp = async (req, res) => {
  try {
    const { newEmail } = req.body;

    if (!newEmail) {
      return res.status(400).json({
        success: false,
        message: "New email is required",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(newEmail.trim())) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address",
      });
    }

    const result = await authService.sendChangeEmailOtp({
      userId: req.userId,
      newEmail: newEmail.trim().toLowerCase(),
    });

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("Send change email OTP error:", error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};


const verifyChangeEmailOtp = async (req, res) => {
  try {
    const { newEmail, otp } = req.body;

    if (!newEmail || !otp) {
      return res.status(400).json({
        success: false,
        message: "New email and OTP are required",
      });
    }

    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: "OTP must be 6 digits",
      });
    }

    const result = await authService.verifyChangeEmailOtp({
      userId: req.userId,
      newEmail: newEmail.trim().toLowerCase(),
      otp,
    });

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("Verify change email OTP error:", error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
module.exports = {
  getUserProfile,
  updateUserProfile,

  sendChangePasswordOtp,
  verifyChangePasswordOtp,

  sendChangeEmailOtp,
  verifyChangeEmailOtp,
};