
const jwt = require("jsonwebtoken");
const User = require("../../models/User");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        code: "UNAUTHORIZED",
        message: "Authorization token is required",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        code: "UNAUTHORIZED",
        message: "Invalid authorization format",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.userId) {
      return res.status(401).json({
        code: "UNAUTHORIZED",
        message: "Invalid authorization token",
      });
    }

    // Fetch the current account status from MongoDB.
    const user = await User.findById(decoded.userId).select("_id isActive");

    if (!user) {
      return res.status(401).json({
        code: "UNAUTHORIZED",
        message: "User account not found",
      });
    }

    // Reject requests from accounts blocked by the admin.
    if (!user.isActive) {
      return res.status(403).json({
        code: "ACCOUNT_BLOCKED",
        message: "Your account has been blocked by the administrator",
      });
    }

    req.userId = user._id.toString();

    next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res.status(401).json({
        code: "UNAUTHORIZED",
        message: "Invalid or expired token",
      });
    }

    console.error("User authentication error:", error);

    return res.status(500).json({
      code: "AUTHENTICATION_ERROR",
      message: "Unable to authenticate your request",
    });
  }
};

module.exports = authMiddleware;
