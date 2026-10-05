require("dotenv").config();

const bcrypt = require("bcryptjs");
const connectDB = require("./config/db");
const Admin = require("./models/Admin");

const createAdmin = async () => {
  try {
    await connectDB();

    const hashedPassword = await bcrypt.hash("Admin@123", 10);

    const admin = await Admin.create({
      name: "Admin",
      email: "admin@solestyle.com",
      password: hashedPassword,
    });

    console.log("Admin created successfully");
    console.log(admin);

    process.exit();
  } catch (error) {
    console.error("Error creating admin:", error);
    process.exit(1);
  }
};

createAdmin();