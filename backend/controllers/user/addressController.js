
const Address = require("../../models/Address");

//.................. add address ..................//
const addAddress = async (req, res) => {
  try {
    const {
      fullName,
      phone,
      addressLine,
      city,
      state,
      pincode,
      addressType,
      isDefault,
    } = req.body;

    if (
      !fullName ||
      !phone ||
      !addressLine ||
      !city ||
      !state ||
      !pincode
    ) {
      return res.status(400).json({
        success: false,
        message: "All address fields are required",
      });
    }

    // Check whether user wants this address as default
    if (isDefault === true) {
      await Address.updateMany(
        { userId: req.userId },
        { $set: { isDefault: false } }
      );
    }

    // If this is the user's first address, make it default
    const addressCount = await Address.countDocuments({
      userId: req.userId,
    });

    const makeDefault =
      addressCount === 0 ? true : isDefault === true;

    const address = await Address.create({
      userId: req.userId,
      fullName: fullName.trim(),
      phone: phone.trim(),
      addressLine: addressLine.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      addressType: addressType || "Home",
      isDefault: makeDefault,
    });

    res.status(201).json({
      success: true,
      message: "Address added successfully",
      address,
    });
  } catch (error) {
    console.error("Add address error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to add address",
    });
  }
};


//.................. get addresses ..................//
const getAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({
      userId: req.userId,
    }).sort({ isDefault: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      addresses,
    });
  } catch (error) {
    console.error("Get addresses error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get addresses",
    });
  }
};


//.................. edit address ..................//
const updateAddress = async (req, res) => {
  try {
    const { addressId } = req.params;

    const {
      fullName,
      phone,
      addressLine,
      city,
      state,
      pincode,
      addressType,
      isDefault,
    } = req.body;

    if (
      !fullName ||
      !phone ||
      !addressLine ||
      !city ||
      !state ||
      !pincode
    ) {
      return res.status(400).json({
        success: false,
        message: "All address fields are required",
      });
    }

    const address = await Address.findOne({
      _id: addressId,
      userId: req.userId,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    // If updating this address as default,
    // remove default from other addresses
    if (isDefault === true) {
      await Address.updateMany(
        {
          userId: req.userId,
          _id: { $ne: addressId },
        },
        { $set: { isDefault: false } }
      );

      address.isDefault = true;
    }

    address.fullName = fullName.trim();
    address.phone = phone.trim();
    address.addressLine = addressLine.trim();
    address.city = city.trim();
    address.state = state.trim();
    address.pincode = pincode.trim();
    address.addressType = addressType || "Home";

    await address.save();

    res.status(200).json({
      success: true,
      message: "Address updated successfully",
      address,
    });
  } catch (error) {
    console.error("Update address error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update address",
    });
  }
};


//.................. delete address ..................//
const deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;

    const address = await Address.findOne({
      _id: addressId,
      userId: req.userId,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    const wasDefault = address.isDefault;

    await Address.deleteOne({
      _id: addressId,
      userId: req.userId,
    });

    // If the default address was deleted,
    // make another address default
    if (wasDefault) {
      const nextAddress = await Address.findOne({
        userId: req.userId,
      }).sort({ createdAt: -1 });

      if (nextAddress) {
        nextAddress.isDefault = true;
        await nextAddress.save();
      }
    }

    res.status(200).json({
      success: true,
      message: "Address deleted successfully",
    });
  } catch (error) {
    console.error("Delete address error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete address",
    });
  }
};


//.................. set default address ..................//
const setDefaultAddress = async (req, res) => {
  try {
    const { addressId } = req.params;

    const address = await Address.findOne({
      _id: addressId,
      userId: req.userId,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    // Remove default from all user's addresses
    await Address.updateMany(
      { userId: req.userId },
      { $set: { isDefault: false } }
    );

    // Set selected address as default
    address.isDefault = true;

    await address.save();

    res.status(200).json({
      success: true,
      message: "Default address updated successfully",
      address,
    });
  } catch (error) {
    console.error("Set default address error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to set default address",
    });
  }
};


module.exports = {
  addAddress,
  getAddresses,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
};

