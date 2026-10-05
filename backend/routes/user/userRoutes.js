
const express = require("express");

const router = express.Router();

const authMiddleware = require("../../middleware/user/authMiddleware");

const { getUserProfile, updateUserProfile, sendChangePasswordOtp, verifyChangePasswordOtp, sendChangeEmailOtp,  verifyChangeEmailOtp,} = require("../../controllers/user/userController");

const { addAddress, getAddresses, updateAddress,deleteAddress,setDefaultAddress,} = require("../../controllers/user/addressController");


//.................. Profile ..................//

router.get( "/profile", authMiddleware, getUserProfile );

router.put( "/profile", authMiddleware,  updateUserProfile );



// Change Password - OTP
router.post( "/change-password/send-otp", authMiddleware, sendChangePasswordOtp );

router.post( "/change-password/verify-otp", authMiddleware,  verifyChangePasswordOtp );

// Change Email - OTP
router.post( "/change-email/send-otp", authMiddleware, sendChangeEmailOtp );

router.post(  "/change-email/verify-otp", authMiddleware,  verifyChangeEmailOtp );

//.................. Addresses ..................//

router.post( "/addresses",  authMiddleware,  addAddress );

router.get( "/addresses", authMiddleware,  getAddresses );

router.put( "/addresses/:addressId", authMiddleware, updateAddress);

router.delete( "/addresses/:addressId", authMiddleware, deleteAddress);

router.put( "/addresses/:addressId/default",  authMiddleware,  setDefaultAddress );


module.exports = router;

