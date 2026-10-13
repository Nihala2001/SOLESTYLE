const User = require("../../models/User");
const Address = require("../../models/Address");

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
  const user = await User.findById(userId)
    .select("-password")
    .lean();

  if (!user) {
    throw new Error("User not found");
  }

  const addresses = await Address.find({
    userId: userId,
  })
    .sort({
      isDefault: -1,
      createdAt: -1,
    })
    .lean();

  console.log("================================");
  console.log("ADMIN VIEW USER ID:", userId);
  console.log("FOUND ADDRESSES:", addresses);
  console.log("================================");

  return {
    ...user,
    addresses,
  };
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