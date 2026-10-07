const {
  getAllUsers,
  getUserById,
  blockUser,
  unblockUser,
} = require("../../services/admin/adminUserService");

const getUsers = async (req, res) => {
  try {
    const { search, page = 1, limit = 5 } = req.query;

    const result = await getAllUsers(
      search,
      Number(page),
      Number(limit)
    );

    res.status(200).json({
      success: true,
      users: result.users,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Get users error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get users",
    });
  }
};

const getUser = async (req, res) => {
  try {
    const user = await getUserById(req.params.id);

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get user error:", error);

    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

const blockUserAccount = async (req, res) => {
  try {
    const user = await blockUser(req.params.id);

    res.status(200).json({
      success: true,
      message: "User blocked successfully",
      user,
    });
  } catch (error) {
    console.error("Block user error:", error);

    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

const unblockUserAccount = async (req, res) => {
  try {
    const user = await unblockUser(req.params.id);

    res.status(200).json({
      success: true,
      message: "User unblocked successfully",
      user,
    });
  } catch (error) {
    console.error("Unblock user error:", error);

    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getUsers,
  getUser,
  blockUserAccount,
  unblockUserAccount,
};