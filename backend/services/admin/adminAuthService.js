const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Admin = require("../../models/Admin");

const loginAdmin = async (email, password) => {
  // Find admin by email
  const admin = await Admin.findOne({
    email: email.toLowerCase().trim(),
  });

  // If admin does not exist
  if (!admin) {
    throw new Error("Invalid email or password");
  }

  // Compare entered password with hashed password
  const isPasswordMatch = await bcrypt.compare(
    password,
    admin.password
  );

  // If password is wrong
  if (!isPasswordMatch) {
    throw new Error("Invalid email or password");
  }

  // Generate admin JWT token
  const token = jwt.sign(
    {
      adminId: admin._id,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1d",
    }
  );

  return {
    token,
    admin,
  };
};

module.exports = {
  loginAdmin,
};