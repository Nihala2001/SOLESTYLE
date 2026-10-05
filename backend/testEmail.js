require("dotenv").config();

const sendEmail = require("./utils/sendEmail");

const test = async () => {
  try {
    await sendEmail(
      "solestyleproject@gmail.com",
      "SOLESTYLE Email Test",
      "Nodemailer is working successfully!"
    );

    console.log("Email sent successfully");
  } catch (error) {
    console.error("Email sending failed:", error);
  }
};

test();

