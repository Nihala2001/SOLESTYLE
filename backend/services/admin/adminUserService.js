const User = require("../../models/User");

const getAllUsers = async (search) => {
  const query = {};

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const users = await User.find(query)
    .select("-password")
    .sort({ createdAt: -1 });

  return users;
};

const getUserById = async (userId) => {
  const user = await User.findById(userId).select("-password");

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

const blockUser = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  user.isActive = false;
  await user.save();

  return user;
};

const unblockUser = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  user.isActive = true;
  await user.save();

  return user;
};

module.exports = {
  getAllUsers,
  getUserById,
  blockUser,
  unblockUser,
};