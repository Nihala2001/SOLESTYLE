const User = require("../models/User");
const Otp = require("../models/Otp");
const authService = require("../services/user/authServices");

jest.mock("../models/User");
jest.mock("../models/Otp");

describe("registerUser", () => {
  test("should reject registration if email already exists", async () => {
    User.findOne.mockResolvedValue({
      email: "test@example.com",
    });

    await expect(
      authService.registerUser({
        name: "Test User",
        email: "test@example.com",
        phone: "9876543210",
        password: "Test@123",
        referralCode: "",
      })
    ).rejects.toThrow("Email already registered");
  });
});