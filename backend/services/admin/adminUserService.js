const User = require("../../models/User");

const getAllUsers = async (
  search,
  page = 1,
  limit = 5
) => {
  const query = {};

  if (search) {
    query.$or = [
      {
        name: {
          $regex: search,
          $options: "i",
        },
      },
      {
        email: {
          $regex: search,
          $options: "i",
        },
      },
    ];
  }

  const skip = (page - 1) * limit;

  const totalUsers = await User.countDocuments(query);

  const users = await User.find(query)
    .select("-password")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const totalPages = Math.ceil(
    totalUsers / limit
  );

  return {
    users,
    pagination: {
      currentPage: page,
      totalPages,
      totalUsers,
    },
  };
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